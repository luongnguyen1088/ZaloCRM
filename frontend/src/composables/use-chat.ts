import { ref, computed } from 'vue';
import { api } from '@/api/index';
import { io, Socket } from 'socket.io-client';
import type { 
  Conversation, 
  ConversationMessage as Message, 
  AiSentiment,
} from '@/views/Chat/types';

export type { AiSentiment, Message, Conversation };

export interface AiConfig {
  provider: string;
  model: string;
  maxDaily: number;
  enabled: boolean;
  managed?: boolean;
  platformKeyConfigured?: boolean;
  planName?: string;
  usedTokens?: number;
  maxTokens?: number;
  remainingTokens?: number;
}

export function useChat() {
  const conversations = ref<Conversation[]>([]);
  const selectedConvId = ref<string | null>(null);
  const messages = ref<Message[]>([]);
  const loadingConvs = ref(false);
  const loadingMsgs = ref(false);
  const sendingMsg = ref(false);
  const searchQuery = ref('');
  const accountFilter = ref<string | null>(null);
  const aiSuggestion = ref('');
  const aiSuggestionSources = ref<any[]>([]);
  const aiSuggestionLoading = ref(false);
  const aiSuggestionError = ref('');
  const aiSummary = ref('');
  const aiSummaryLoading = ref(false);
  const aiSentiment = ref<AiSentiment | null>(null);
  const aiSentimentLoading = ref(false);
  const aiUsage = ref({ usedToday: 0, maxDaily: 500000, remaining: 500000, usedTokens: 0, maxTokens: 500000, remainingTokens: 500000, enabled: true });
  const aiConfig = ref<AiConfig>({ provider: 'anthropic', model: 'claude-sonnet-4-6', maxDaily: 500000, enabled: true, managed: true });
  const isAiQuotaExceeded = ref(false);
  let socket: Socket | null = null;

  const selectedConv = computed(() =>
    conversations.value.find(c => c.id === selectedConvId.value) || null,
  );

  function clearAiState() {
    aiSuggestion.value = '';
    aiSuggestionSources.value = [];
    aiSuggestionError.value = '';
    aiSummary.value = '';
    aiSentiment.value = null;
  }

  const statusFilter = ref<string>('all');

  async function fetchConversations() {
    loadingConvs.value = true;
    try {
      const res = await api.get('/conversations', {
        params: { 
          limit: 100, 
          search: searchQuery.value, 
          accountId: accountFilter.value || undefined,
          status: statusFilter.value !== 'all' ? statusFilter.value : undefined
        },
      });
      conversations.value = res.data.conversations;
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      loadingConvs.value = false;
    }
  }

  async function fetchMessages(convId: string) {
    loadingMsgs.value = true;
    try {
      const res = await api.get(`/conversations/${convId}/messages`, {
        params: { limit: 100 },
      });
      messages.value = res.data.messages;
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      loadingMsgs.value = false;
    }
  }

  async function fetchAiConfig() {
    try {
      const res = await api.get('/ai/config', {
        params: {
          zaloAccountId: selectedConv.value?.zaloAccount?.id || undefined,
        },
      });
      aiConfig.value = {
        provider: res.data.provider,
        model: res.data.model,
        maxDaily: res.data.maxDaily,
        enabled: res.data.enabled,
        managed: res.data.managed,
        platformKeyConfigured: res.data.platformKeyConfigured,
        planName: res.data.planName,
        usedTokens: res.data.usedTokens,
        maxTokens: res.data.maxTokens,
        remainingTokens: res.data.remainingTokens,
      };
    } catch (err) {
      console.error('Failed to fetch AI config:', err);
    }
  }

  async function saveAiConfig(payload: { enabled: boolean }) {
    const res = await api.put('/ai/config', {
      ...payload,
      zaloAccountId: selectedConv.value?.zaloAccount?.id || undefined,
    });
    aiConfig.value = {
      provider: res.data.provider,
      model: res.data.model,
      maxDaily: res.data.maxDaily,
      enabled: res.data.enabled,
      managed: res.data.managed,
      platformKeyConfigured: res.data.platformKeyConfigured,
      planName: res.data.planName,
      usedTokens: res.data.usedTokens,
      maxTokens: res.data.maxTokens,
      remainingTokens: res.data.remainingTokens,
    };
  }

  async function fetchAiUsage() {
    try {
      const res = await api.get('/ai/usage');
      aiUsage.value = {
        usedToday: res.data.usedToday,
        maxDaily: res.data.maxDaily,
        remaining: res.data.remaining,
        usedTokens: res.data.usedTokens,
        maxTokens: res.data.maxTokens,
        remainingTokens: res.data.remainingTokens,
        enabled: res.data.enabled
      };
    } catch (err) {
      console.error('Failed to fetch AI usage:', err);
    }
  }

  async function generateAiSuggestion(customPrompt?: string) {
    if (!selectedConvId.value) return;
    await streamAiSuggestion({ 
      conversationId: selectedConvId.value,
      customPrompt: customPrompt
    });
  }

  async function refineAiSuggestion(content: string, instruction: string) {
    if (!selectedConvId.value) return;
    await streamAiSuggestion({
      conversationId: selectedConvId.value,
      originalContent: content,
      customPrompt: instruction
    });
  }

  async function streamAiSuggestion(body: any) {
    aiSuggestionLoading.value = true;
    aiSuggestion.value = '';
    aiSuggestionSources.value = [];
    aiSuggestionError.value = '';

    try {
      const response = await fetch('/api/v1/ai/suggest/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Không thể tạo gợi ý AI');
      }

      const reader = response.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]') continue;
          if (trimmed.startsWith('data: ')) {
            try {
              const data = JSON.parse(trimmed.slice(6));
              if (data.chunk) {
                aiSuggestion.value += data.chunk;
              }
              if (data.error) throw new Error(data.error);
            } catch (e) { /* ignore */ }
          }
        }
      }
      await fetchAiUsage();
    } catch (err: any) {
      aiSuggestionError.value = err.message || 'Lỗi kết nối AI';
      if (err.message?.includes('quota')) isAiQuotaExceeded.value = true;
    } finally {
      aiSuggestionLoading.value = false;
    }
  }

  async function generateAiSummary() {
    if (!selectedConvId.value) return;
    aiSummaryLoading.value = true;
    try {
      const res = await api.post(`/ai/summarize/${selectedConvId.value}`);
      aiSummary.value = res.data.content || '';
      await fetchAiUsage();
    } catch (err: any) {
      if (err.response?.status === 429) {
        isAiQuotaExceeded.value = true;
      }
      console.error('Failed to summarize conversation:', err);
    } finally {
      aiSummaryLoading.value = false;
    }
  }

  async function generateAiSentiment() {
    if (!selectedConvId.value) return;
    aiSentimentLoading.value = true;
    try {
      const res = await api.post(`/ai/sentiment/${selectedConvId.value}`);
      aiSentiment.value = res.data;
      await fetchAiUsage();
    } catch (err: any) {
      if (err.response?.status === 429) {
        isAiQuotaExceeded.value = true;
      }
      console.error('Failed to analyze sentiment:', err);
    } finally {
      aiSentimentLoading.value = false;
    }
  }

  async function selectConversation(convId: string) {
    selectedConvId.value = convId;
    clearAiState();
    await fetchMessages(convId);
    try {
      const convDetail = await api.get(`/conversations/${convId}`);
      const conv = conversations.value.find(c => c.id === convId);
      if (conv && convDetail.data.contact) {
        conv.contact = convDetail.data.contact;
      }
    } catch {
      // Non-critical
    }
    try {
      await api.post(`/conversations/${convId}/mark-read`);
      const conv = conversations.value.find(c => c.id === convId);
      if (conv) conv.unreadCount = 0;
    } catch {
      // Ignore mark-read errors
    }
    await Promise.allSettled([generateAiSummary(), generateAiSentiment(), fetchAiUsage()]);
  }

  async function sendMessage(content: string) {
    if (!selectedConvId.value || !content.trim()) return;
    await sendMessageTo(selectedConvId.value, content);
  }

  async function sendMessageTo(conversationId: string, content: string) {
    if (!content.trim()) return;
    sendingMsg.value = true;
    try {
      const res = await api.post(`/conversations/${conversationId}/messages`, { content });
      if (conversationId === selectedConvId.value) {
        if (!messages.value.find(m => m.id === res.data.id)) {
          messages.value.push(res.data);
        }
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      throw err;
    } finally {
      sendingMsg.value = false;
    }
  }

  function initSocket() {
    socket = io({ transports: ['websocket', 'polling'] });

    socket.on('chat:message', (data: { message: Message; conversationId: string }) => {
      if (data.conversationId === selectedConvId.value) {
        if (!messages.value.find(m => m.id === data.message.id)) {
          messages.value.push(data.message);
        }
      }
      fetchConversations();
    });

    socket.on('chat:deleted', (data: { msgId: string }) => {
      const msg = messages.value.find(m => m.zaloMsgId === data.msgId);
      if (msg) msg.isDeleted = true;
    });
  }

  function destroySocket() {
    socket?.disconnect();
    socket = null;
  }

  return {
    conversations,
    selectedConvId,
    selectedConv,
    messages,
    loadingConvs,
    loadingMsgs,
    sendingMsg,
    searchQuery,
    accountFilter,
    statusFilter,
    aiSuggestion,
    aiSuggestionSources,
    aiSuggestionLoading,
    aiSuggestionError,
    aiSummary,
    aiSummaryLoading,
    aiSentiment,
    aiSentimentLoading,
    isAiQuotaExceeded,
    aiUsage,
    aiConfig,
    fetchConversations,
    fetchAiConfig,
    saveAiConfig,
    fetchAiUsage,
    selectConversation,
    sendMessage,
    sendMessageTo,
    generateAiSuggestion,
    refineAiSuggestion,
    generateAiSummary,
    generateAiSentiment,
    clearAiState,
    initSocket,
    destroySocket,
  };
}
