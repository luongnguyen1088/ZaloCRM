
<template>
  <div class="message-thread d-flex flex-column h-100">
    <!-- Messages Scroll Area -->
    <div ref="scrollBox" class="messages-viewport flex-grow-1 overflow-y-auto pa-4 pa-md-6" @scroll="handleScroll">
      <!-- Skeleton Loading -->
      <div v-if="loading" class="d-flex flex-column ga-6">
        <div v-for="i in 4" :key="i" class="d-flex" :class="i % 2 === 0 ? 'justify-end' : 'justify-start'">
          <v-skeleton-loader
            :type="i % 2 === 0 ? 'list-item-avatar-three-line' : 'list-item-avatar-three-line'"
            width="280"
            class="rounded-xl bg-transparent"
          />
        </div>
      </div>

      <template v-else-if="messages.length">
        <div v-for="(msg, index) in messages" :key="msg.id" class="message-wrapper" :class="{ 'message-self': msg.senderType === 'self' }">
          <!-- Date Separator -->
          <div v-if="shouldShowDate(index)" class="date-divider my-6 text-center">
            <span>{{ formatDateLabel(msg.sentAt) }}</span>
          </div>

          <div class="message-bubble-row d-flex" :class="msg.senderType === 'self' ? 'justify-end' : 'justify-start'">
            <div class="message-bubble-container">
              <div class="message-bubble pa-3" :class="bubbleClass(msg)">
                <div v-if="msg.senderType !== 'self'" class="sender-name">{{ msg.senderName || 'Khách hàng' }}</div>
                
                <div class="message-content">
                  <template v-if="msg.contentType === 'text'">
                    {{ msg.content }}
                  </template>
                  <template v-else-if="msg.contentType === 'image'">
                    <v-img :src="msg.content || ''" max-width="300" class="rounded-lg cursor-pointer" @click="openMedia(msg.content)" />
                  </template>
                  <template v-else>
                    <div class="d-flex align-center ga-2 py-1">
                      <v-icon size="20">mdi-paperclip</v-icon>
                      <span>{{ msg.contentType }} content</span>
                    </div>
                  </template>
                </div>
                
                <div class="message-meta d-flex align-center justify-end mt-1 ga-1">
                  <span>{{ formatTime(msg.sentAt) }}</span>
                  <v-icon v-if="msg.senderType === 'self'" :color="msg.zaloMsgId ? 'primary' : 'grey'" size="14">
                    {{ msg.zaloMsgId ? 'mdi-check-all' : 'mdi-check' }}
                  </v-icon>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Premium Empty State -->
      <div v-else class="h-100 d-flex flex-column align-center justify-center text-center pa-8">
        <div class="empty-illustration-container mb-6">
          <v-img
            src="/chat_empty_state_illustration_1777081798225.png"
            width="280"
            class="empty-image animate__animated animate__pulse animate__infinite animate__slower"
          />
          <div class="glow-effect" />
        </div>
        <h3 class="text-h5 font-weight-black mb-2 color-text">Sẵn sàng hỗ trợ khách hàng?</h3>
        <p class="text-body-2 opacity-60 max-width-300">
          Chọn một cuộc hội thoại từ danh sách bên trái để bắt đầu tư vấn với sự trợ giúp từ AI.
        </p>
      </div>
    </div>

    <!-- AI Workspace Layer -->
    <div v-if="aiSuggestion" class="ai-workspace pa-4 animate__animated animate__slideInUp">
      <v-card class="ai-card pa-4" :class="{ 'ai-card-thinking': aiLoading }" rounded="xl">
        <div class="d-flex align-center mb-3">
          <v-icon color="primary" class="mr-2" :class="{ 'ai-icon-pulse': aiLoading }">mdi-robot-outline</v-icon>
          <span class="font-weight-black text-primary">AI Assistant</span>
          
          <v-spacer />
          
          <div class="d-flex ga-1">
            <v-btn
              :icon="isCopying ? 'mdi-check' : 'mdi-content-copy'"
              variant="text"
              size="x-small"
              :color="isCopying ? 'success' : 'grey'"
              @click="copyToClipboard"
            >
              <v-tooltip activator="parent">{{ isCopying ? 'Đã sao chép' : 'Sao chép' }}</v-tooltip>
            </v-btn>
            <v-btn
              icon="mdi-tray-arrow-down"
              variant="text"
              size="x-small"
              color="primary"
              @click="insertToInput"
            >
              <v-tooltip activator="parent">Chèn vào ô chat</v-tooltip>
            </v-btn>
            <v-btn icon="mdi-close" variant="text" size="x-small" color="grey" @click="$emit('clear-ai')" />
          </div>
        </div>
        
        <div class="ai-content-box mb-3 pa-3">
          <v-textarea
            v-model="editableAiSuggestion"
            variant="plain"
            hide-details
            auto-grow
            rows="1"
            class="ai-editable-textarea"
          />
          <span v-if="aiLoading" class="typing-cursor">|</span>
        </div>

        <div v-if="aiSuggestionSources?.length" class="ai-sources mb-3 px-1">
          <div class="text-caption font-weight-bold mb-1 opacity-60">Nguồn tham khảo:</div>
          <div class="d-flex flex-wrap ga-2">
            <v-chip
              v-for="source in aiSuggestionSources"
              :key="source.id"
              size="x-small"
              variant="tonal"
              color="primary"
              label
              class="px-2"
            >
              {{ source.title }}
            </v-chip>
          </div>
        </div>

        <div class="d-flex flex-wrap ga-2 mb-3">
          <v-btn
            v-for="cmd in quickRefines"
            :key="cmd.value"
            variant="tonal"
            size="x-small"
            rounded="pill"
            color="secondary"
            @click="handleQuickRefine(cmd.label)"
          >
            {{ cmd.label }}
          </v-btn>
        </div>

        <div class="d-flex ga-2">
          <v-btn 
            color="primary" 
            variant="flat" 
            rounded="lg" 
            size="small" 
            prepend-icon="mdi-send"
            @click="useAiSuggestion"
          >
            Gửi ngay
          </v-btn>
          <v-btn 
            variant="tonal" 
            rounded="lg" 
            size="small" 
            prepend-icon="mdi-auto-fix"
            @click="isRefining = true"
          >
            Tinh chỉnh
          </v-btn>
        </div>
      </v-card>
    </div>

    <!-- Input Area -->
    <div class="input-area pa-4">
      <v-card class="input-card" rounded="xl" elevation="0">
        <div class="d-flex align-end ga-2">
          <v-btn icon="mdi-plus" variant="text" color="primary" />
          
          <v-textarea
            v-model="inputContent"
            placeholder="Nhập tin nhắn..."
            rows="1"
            max-rows="5"
            auto-grow
            density="compact"
            variant="plain"
            hide-details
            class="message-input py-2"
            @keydown.enter.exact.prevent="handleSend"
          />

          <div class="d-flex align-center pb-2 pr-1 ga-1">
            <v-btn 
              variant="flat" 
              color="primary" 
              height="32"
              rounded="pill"
              class="ai-magic-btn px-4"
              :loading="aiLoading"
              @click="$emit('ask-ai')"
            >
              <v-icon size="18" class="mr-1">mdi-sparkles</v-icon>
              <span class="text-caption font-weight-black d-none d-sm-inline">Gợi ý AI</span>
              <v-tooltip activator="parent">Tạo gợi ý AI</v-tooltip>
            </v-btn>
            <v-btn 
              icon 
              color="primary" 
              variant="flat" 
              size="small"
              :disabled="!inputContent.trim() || sending"
              :loading="sending"
              @click="handleSend"
            >
              <v-icon>mdi-send</v-icon>
            </v-btn>
          </div>
        </div>
      </v-card>
    </div>

    <!-- Refine Dialog -->
    <v-dialog v-model="isRefining" max-width="500">
      <v-card rounded="xl" class="pa-4">
        <h3 class="text-h6 font-weight-black mb-4">Tinh chỉnh với AI</h3>
        <v-textarea
          v-model="refineInstruction"
          placeholder="Ví dụ: Làm cho câu trả lời lịch sự hơn, hoặc ngắn gọn hơn..."
          variant="solo-filled"
          flat
          rounded="lg"
          class="mb-4"
        />
        <div class="d-flex justify-end ga-2">
          <v-btn variant="text" rounded="lg" @click="isRefining = false">Hủy</v-btn>
          <v-btn color="primary" variant="flat" rounded="lg" @click="handleRefine">Cập nhật</v-btn>
        </div>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue';
import type { Conversation, ConversationMessage } from '../types';

const props = defineProps<{
  conversation: Conversation | null;
  messages: ConversationMessage[];
  loading: boolean;
  sending: boolean;
  aiSuggestion: string;
  aiSuggestionSources: any[];
  aiLoading: boolean;
}>();

const emit = defineEmits<{
  (e: 'send', content: string): void;
  (e: 'ask-ai'): void;
  (e: 'refine-ai', data: { content: string, instruction: string }): void;
  (e: 'clear-ai'): void;
  (e: 'insert-ai', content: string): void;
}>();

const inputContent = ref('');
const scrollBox = ref<HTMLElement | null>(null);
const isRefining = ref(false);
const refineInstruction = ref('');
const editableAiSuggestion = ref('');

const isCopying = ref(false);

async function copyToClipboard() {
  try {
    await navigator.clipboard.writeText(editableAiSuggestion.value);
    isCopying.value = true;
    setTimeout(() => isCopying.value = false, 2000);
  } catch (err) {
    console.error('Failed to copy', err);
  }
}

function insertToInput() {
  inputContent.value = editableAiSuggestion.value;
  emit('clear-ai');
}

const quickRefines = [
  { label: 'Lịch sự hơn', value: 'polite' },
  { label: 'Ngắn gọn hơn', value: 'shorter' },
  { label: 'Chi tiết hơn', value: 'detailed' },
];

watch(() => props.aiSuggestion, (newVal) => {
  editableAiSuggestion.value = newVal;
}, { immediate: true });

function scrollToBottom() {
  nextTick(() => {
    if (scrollBox.value) {
      scrollBox.value.scrollTop = scrollBox.value.scrollHeight;
    }
  });
}

function handleSend() {
  if (!inputContent.value.trim() || props.sending) return;
  emit('send', inputContent.value);
  inputContent.value = '';
  scrollToBottom();
}

function useAiSuggestion() {
  emit('send', editableAiSuggestion.value);
  emit('clear-ai');
  scrollToBottom();
}

function handleQuickRefine(instruction: string) {
  emit('refine-ai', { content: editableAiSuggestion.value, instruction });
}

function handleRefine() {
  emit('refine-ai', { content: props.aiSuggestion, instruction: refineInstruction.value });
  refineInstruction.value = '';
  isRefining.value = false;
}

function bubbleClass(msg: ConversationMessage) {
  if (msg.senderType === 'self') return 'bubble-self';
  return 'bubble-other';
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function formatDateLabel(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return 'Hôm nay';
  return d.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' });
}

function shouldShowDate(index: number) {
  if (index === 0) return true;
  const curr = new Date(props.messages[index].sentAt).toDateString();
  const prev = new Date(props.messages[index - 1].sentAt).toDateString();
  return curr !== prev;
}

function handleScroll() { /* Paginate if needed */ }
function openMedia(url: string | null) { if (url) window.open(url, '_blank'); }

onMounted(scrollToBottom);
</script>

<style scoped>
.message-thread {
  background: var(--color-canvas);
  position: relative;
}

.messages-viewport {
  background-image: 
    radial-gradient(circle at 2px 2px, var(--color-border) 1px, transparent 0);
  background-size: 32px 32px;
}

.message-bubble-container {
  max-width: 80%;
}

.message-bubble {
  border-radius: 20px;
  position: relative;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.bubble-self {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-strong) 100%);
  color: white;
  border-bottom-right-radius: 4px;
}

.bubble-other {
  background: white !important;
  color: var(--color-text);
  border-bottom-left-radius: 4px;
  border: 1px solid rgba(0,0,0,0.05) !important;
  box-shadow: 0 4px 12px rgba(0,0,0,0.03) !important;
}

.sender-name {
  font-size: 0.75rem;
  font-weight: 800;
  margin-bottom: 4px;
  color: var(--color-primary);
  opacity: 1;
}

.message-meta {
  font-size: 0.7rem;
  opacity: 0.7;
}

.date-divider {
  position: relative;
}

.date-divider span {
  background: var(--color-canvas);
  padding: 4px 16px;
  border-radius: 99px;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
}

.input-area {
  background: var(--color-surface-glass);
  backdrop-filter: blur(14px);
  border-top: 1px solid var(--color-border);
}

.input-card {
  background: var(--color-surface-muted) !important;
  border: 1px solid var(--color-border) !important;
}

.message-input :deep(textarea) {
  font-size: 0.95rem;
  line-height: 1.5;
  padding-left: 12px;
}

.ai-workspace {
  position: absolute;
  bottom: 85px;
  left: 0;
  right: 0;
  z-index: 5;
}

.ai-card {
  border: 1px solid var(--color-primary-soft-strong) !important;
  background: var(--color-surface-elevated) !important;
  box-shadow: var(--shadow-lg) !important;
  transition: all 0.5s ease;
  position: relative;
  overflow: hidden;
}

.ai-card-thinking {
  border-color: transparent !important;
}

.ai-card-thinking::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: conic-gradient(
    transparent, 
    var(--color-primary), 
    #a855f7, 
    transparent 30%
  );
  animation: rotate-glow 4s linear infinite;
  z-index: 0;
}

.ai-card-thinking::after {
  content: '';
  position: absolute;
  inset: 2px;
  background: var(--color-surface-elevated);
  border-radius: inherit;
  z-index: 1;
}

.ai-card > * {
  position: relative;
  z-index: 2;
}

@keyframes rotate-glow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.ai-icon-pulse {
  animation: ai-pulse 2s ease-in-out infinite;
}

@keyframes ai-pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.3); opacity: 0.7; color: #a855f7; }
  100% { transform: scale(1); opacity: 1; }
}

.typing-cursor {
  display: inline-block;
  width: 2px;
  color: var(--color-primary);
  font-weight: bold;
  animation: blink 1s step-end infinite;
  margin-left: 2px;
}

@keyframes blink {
  from, to { opacity: 1; }
  50% { opacity: 0; }
}

.ai-content-box {
  background: var(--color-primary-soft);
  border-radius: 12px;
  font-size: 0.95rem;
  line-height: 1.6;
  color: var(--color-primary-strong);
  position: relative;
}

.ai-editable-textarea :deep(textarea) {
  font-size: 0.95rem !important;
  line-height: 1.6 !important;
  color: var(--color-primary-strong) !important;
  padding: 0 !important;
}

.ai-sources {
  border-top: 1px solid var(--color-primary-soft-strong);
  padding-top: 8px;
}

.animate__slideInUp {
  animation-duration: 0.4s;
}

.ai-magic-btn {
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%) !important;
  background-size: 200% auto !important;
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4) !important;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
  color: white !important;
  text-transform: none !important;
  border: none !important;
  position: relative;
  overflow: hidden;
  animation: bg-shine 4s linear infinite;
}

@keyframes bg-shine {
  to { background-position: 200% center; }
}

.ai-magic-btn:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 8px 25px rgba(168, 85, 247, 0.5) !important;
}

.ai-magic-btn:active {
  transform: translateY(0) scale(0.95);
}

.ai-magic-btn :deep(.v-icon) {
  color: white !important;
  filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.6));
  animation: sparkle-rotate 3s ease-in-out infinite;
}

@keyframes sparkle-rotate {
  0% { transform: rotate(0deg) scale(1); }
  50% { transform: rotate(180deg) scale(1.25); }
  100% { transform: rotate(360deg) scale(1); }
}

.empty-illustration-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.empty-image {
  z-index: 2;
  filter: drop-shadow(0 20px 30px rgba(var(--v-theme-primary), 0.2));
}

.glow-effect {
  position: absolute;
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, var(--color-primary-soft) 0%, transparent 70%);
  z-index: 1;
  filter: blur(40px);
  animation: pulse-glow 4s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.3); opacity: 0.8; }
}

.max-width-300 {
  max-width: 300px;
}
</style>
