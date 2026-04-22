<template>
  <MobileChatView v-if="isMobile" />
  <div v-else class="chat-container d-flex" style="height: calc(100vh - 64px);">
    <!-- Conversation list — resizable -->
    <div class="chat-panel-left" :style="{ width: leftWidth + 'px' }">
      <ConversationList
        :conversations="conversations"
        :selected-id="selectedConvId"
        :loading="loadingConvs"
        v-model:search="searchQuery"
        @select="selectConversation"
        @filter-account="onFilterAccount"
      />
      <!-- Resize handle -->
      <div class="resize-handle" @mousedown="startResize('left', $event)" />
    </div>

    <!-- Message thread — flexible center -->
    <MessageThread
      :conversation="selectedConv"
      :messages="messages"
      :loading="loadingMsgs"
      :sending="sendingMsg"
      :ai-suggestion="aiSuggestion"
      :ai-suggestion-loading="aiSuggestionLoading"
      :ai-suggestion-error="aiSuggestionError"
      @send="sendMessage"
      @ask-ai="generateAiSuggestion"
      @refine-ai="(data) => refineAiSuggestion(data.content, data.instruction)"
      @clear-ai="clearAiState"
      @toggle-contact-panel="showContactPanel = !showContactPanel"
      :show-contact-panel="showContactPanel"
      style="flex: 1; min-width: 300px;"
    />

    <!-- Contact panel — resizable -->
    <div v-if="showContactPanel && selectedConv?.contact" class="chat-panel-right" :style="{ width: rightWidth + 'px' }">
      <div class="resize-handle resize-handle-left" @mousedown="startResize('right', $event)" />
      <ChatContactPanel
        :contact-id="selectedConv.contact.id"
        :contact="selectedConv.contact"
        :ai-summary="aiSummary"
        :ai-summary-loading="aiSummaryLoading"
        :ai-sentiment="aiSentiment"
        :ai-sentiment-loading="aiSentimentLoading"
        @refresh-ai-summary="generateAiSummary"
        @refresh-ai-sentiment="generateAiSentiment"
        @close="showContactPanel = false"
        @saved="fetchConversations()"
      />
    </div>
  </div>
  <AiQuotaModal v-model="isAiQuotaExceeded" />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import ConversationList from '@/components/chat/ConversationList.vue';
import MessageThread from '@/components/chat/MessageThread.vue';
import ChatContactPanel from '@/components/chat/ChatContactPanel.vue';
import { useChat } from '@/composables/use-chat';
import MobileChatView from '@/views/MobileChatView.vue';
import { useMobile } from '@/composables/use-mobile';
import AiQuotaModal from '@/components/ai/AiQuotaModal.vue';

const { isMobile } = useMobile();

const {
  conversations, selectedConvId, selectedConv, messages,
  loadingConvs, loadingMsgs, sendingMsg, searchQuery, accountFilter,
  aiSuggestion, aiSuggestionLoading, aiSuggestionError,
  aiSummary, aiSummaryLoading, aiSentiment, aiSentimentLoading,
  isAiQuotaExceeded,
  fetchConversations, fetchAiConfig, selectConversation, sendMessage,
  generateAiSuggestion, refineAiSuggestion, generateAiSummary, generateAiSentiment,
  clearAiState, initSocket, destroySocket,
} = useChat();

function onFilterAccount(id: string | null) {
  accountFilter.value = id;
  fetchConversations();
}

const showContactPanel = ref(false);

// Resizable panel widths (restored from localStorage)
const leftWidth = ref(parseInt(localStorage.getItem('chat-left-width') || '320'));
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
    leftWidth.value = Math.max(200, Math.min(500, startWidth + diff));
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
  if (!isMobile.value) { fetchConversations(); fetchAiConfig(); initSocket(); }
});
onUnmounted(() => {
  if (!isMobile.value) { destroySocket(); }
});

let searchTimeout: ReturnType<typeof setTimeout>;
watch(searchQuery, () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => fetchConversations(), 300);
});
</script>

<style scoped>
.chat-container {
  margin: -16px;
  background: var(--color-canvas);
  overflow: hidden;
}

.chat-panel-left {
  position: relative;
  flex-shrink: 0;
  min-width: 260px;
  max-width: 500px;
  z-index: 2;
  box-shadow: 4px 0 15px rgba(0, 0, 0, 0.02);
}

.chat-panel-right {
  position: relative;
  flex-shrink: 0;
  min-width: 300px;
  max-width: 500px;
  z-index: 2;
  box-shadow: -4px 0 15px rgba(0, 0, 0, 0.02);
}

/* Resize handle — elegant vertical line */
.resize-handle {
  position: absolute;
  top: 0;
  right: -3px;
  width: 6px;
  height: 100%;
  cursor: col-resize;
  z-index: 100;
  background: transparent;
  transition: all 0.3s;
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
