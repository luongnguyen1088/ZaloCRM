
<template>
  <MobileChatView v-if="isMobile" />
  
  <div v-else class="chat-view-root d-flex">
    <!-- Sidebar: Unified Conversation List -->
    <aside class="chat-sidebar" :style="{ width: leftWidth + 'px' }">
      <UnifiedConversationList
        :conversations="conversations"
        :selected-id="selectedConvId"
        :loading="loadingConvs"
        v-model:search="searchQuery"
        v-model:status="statusFilter"
        :accounts="zaloAccounts"
        :active-status="statusFilter"
        @select="selectConversation"
        @filter-account="onFilterAccount"
      />
      <div class="resize-handle" @mousedown="startResize('left', $event)" />
    </aside>

    <!-- Main Content: Chat Area -->
    <main class="chat-main d-flex flex-column flex-grow-1">
      <ChatHeader
        :conversation="selectedConv"
        :show-contact-panel="showContactPanel"
        @toggle-contact="showContactPanel = !showContactPanel"
      />

      <div class="chat-body d-flex flex-grow-1 overflow-hidden">
        <div class="message-thread-container flex-grow-1 h-100">
          <SmartMessageThread
            :conversation="selectedConv"
            :messages="messages"
            :loading="loadingMsgs"
            :sending="sendingMsg"
            :ai-suggestion="aiSuggestion"
            :ai-suggestion-sources="aiSuggestionSources"
            :ai-loading="aiSuggestionLoading"
            :ai-summary-loading="aiSummaryLoading"
            :ai-sentiment-loading="aiSentimentLoading"
            @send="sendMessage"
            @ask-ai="generateAiSuggestion"
            @ask-summary="handleGenerateSummary"
            @ask-sentiment="handleGenerateSentiment"
            @refine-ai="(data) => refineAiSuggestion(data.content, data.instruction)"
            @clear-ai="clearAiState"
          />
        </div>

        <!-- Right Panel: Contact Details -->
        <aside v-if="showContactPanel && selectedConv?.contact" class="contact-sidebar" :style="{ width: rightWidth + 'px' }">
          <div class="resize-handle resize-handle-left" @mousedown="startResize('right', $event)" />
          <ChatContactPanel
            :contact-id="selectedConv.contact.id"
            :contact="selectedConv.contact"
            :ai-summary="aiSummary"
            :ai-summary-loading="aiSummaryLoading"
            :ai-summary-error="aiSummaryError"
            :ai-sentiment="aiSentiment"
            :ai-sentiment-loading="aiSentimentLoading"
            :ai-sentiment-error="aiSentimentError"
            @refresh-ai-summary="generateAiSummary"
            @refresh-ai-sentiment="generateAiSentiment"
            @close="showContactPanel = false"
            @saved="fetchConversations()"
          />
        </aside>
      </div>
    </main>

    <!-- AI Quota Modal -->
    <AiQuotaModal v-model="isAiQuotaExceeded" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { api } from '@/api/index';
import { useChat } from '@/composables/use-chat';
import { useMobile } from '@/composables/use-mobile';

// Sub-components
import UnifiedConversationList from './Chat/components/UnifiedConversationList.vue';
import ChatHeader from './Chat/components/ChatHeader.vue';
import SmartMessageThread from './Chat/components/SmartMessageThread.vue';
import ChatContactPanel from '@/components/chat/ChatContactPanel.vue';
import AiQuotaModal from '@/components/ai/AiQuotaModal.vue';
import MobileChatView from '@/views/MobileChatView.vue';

const { isMobile } = useMobile();
const {
  conversations, selectedConvId, selectedConv, messages,
  loadingConvs, loadingMsgs, sendingMsg, searchQuery, accountFilter, statusFilter,
  aiSuggestion, aiSuggestionSources, aiSuggestionLoading, 
  aiSummary, aiSummaryLoading, aiSummaryError,
  aiSentiment, aiSentimentLoading, aiSentimentError,
  isAiQuotaExceeded,
  fetchConversations, fetchAiConfig, selectConversation, sendMessage,
  generateAiSuggestion, refineAiSuggestion, generateAiSummary, generateAiSentiment,
  clearAiState, initSocket, destroySocket,
} = useChat();

const zaloAccounts = ref([]);
const showContactPanel = ref(localStorage.getItem('chat-show-contact') === 'true');

async function fetchZaloAccounts() {
  try {
    const res = await api.get('/zalo-accounts');
    zaloAccounts.value = Array.isArray(res.data) ? res.data : res.data.accounts || [];
  } catch (err) {
    console.error('Failed to fetch Zalo accounts', err);
  }
}

function onFilterAccount(id: string | null) {
  accountFilter.value = id;
  fetchConversations();
}

watch(statusFilter, () => fetchConversations());
watch(showContactPanel, (val) => localStorage.setItem('chat-show-contact', String(val)));

async function handleGenerateSummary() {
  showContactPanel.value = true;
  await generateAiSummary();
}

async function handleGenerateSentiment() {
  showContactPanel.value = true;
  await generateAiSentiment();
}

// Resizable panel widths
const leftWidth = ref(parseInt(localStorage.getItem('chat-left-width') || '360'));
const rightWidth = ref(parseInt(localStorage.getItem('chat-right-width') || '320'));

let resizing: 'left' | 'right' | null = null;
let startX = 0;
let startWidth = 0;

function startResize(panel: 'left' | 'right', e: MouseEvent) {
  resizing = panel;
  startX = e.clientX;
  startWidth = panel === 'left' ? leftWidth.value : rightWidth.value;
  document.addEventListener('mousemove', onResize);
  document.addEventListener('mouseup', stopResize);
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
}

function onResize(e: MouseEvent) {
  if (!resizing) return;
  const diff = e.clientX - startX;
  if (resizing === 'left') {
    leftWidth.value = Math.max(280, Math.min(500, startWidth + diff));
  } else {
    rightWidth.value = Math.max(250, Math.min(500, startWidth - diff));
  }
}

function stopResize() {
  if (resizing) {
    localStorage.setItem('chat-left-width', String(leftWidth.value));
    localStorage.setItem('chat-right-width', String(rightWidth.value));
  }
  resizing = null;
  document.removeEventListener('mousemove', onResize);
  document.removeEventListener('mouseup', stopResize);
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
}

onMounted(() => {
  if (!isMobile.value) {
    fetchConversations();
    fetchAiConfig();
    fetchZaloAccounts();
    initSocket();
  }
});

onUnmounted(() => {
  if (!isMobile.value) {
    destroySocket();
  }
});

let searchTimeout: any;
watch(searchQuery, () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => fetchConversations(), 300);
});
</script>

<style scoped>
.chat-view-root {
  height: calc(100vh - 64px);
  margin: -16px;
  background: var(--color-canvas);
  overflow: hidden;
}

.chat-sidebar {
  position: relative;
  flex-shrink: 0;
  z-index: 5;
}

.chat-main {
  min-width: 0;
  background: var(--color-canvas);
}

.contact-sidebar {
  position: relative;
  flex-shrink: 0;
  background: var(--color-surface-glass);
  backdrop-filter: blur(14px);
  border-left: 1px solid var(--color-border);
  z-index: 5;
}

.resize-handle {
  position: absolute;
  top: 0;
  right: -3px;
  width: 6px;
  height: 100%;
  cursor: col-resize;
  z-index: 100;
  background: transparent;
}

.resize-handle:hover::after {
  content: '';
  position: absolute;
  left: 2px;
  top: 0;
  width: 2px;
  height: 100%;
  background: var(--color-primary);
  box-shadow: 0 0 10px var(--color-primary-soft-strong);
}

.resize-handle-left {
  right: auto;
  left: -3px;
}
</style>
