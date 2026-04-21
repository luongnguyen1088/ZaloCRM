<template>
  <div class="message-thread d-flex flex-column flex-grow-1 message-thread-root">
    <div v-if="!conversation" class="d-flex align-center justify-center flex-grow-1">
      <div class="text-center text-grey">
        <v-icon icon="mdi-chat-outline" size="96" color="grey-lighten-2" />
        <p class="text-h6 mt-4">Chọn cuộc trò chuyện</p>
      </div>
    </div>

    <template v-else>
      <div class="pa-3 d-flex align-center thread-header">
        <v-avatar size="36" color="grey-lighten-2" class="mr-3">
          <v-icon v-if="conversation.threadType === 'group'" icon="mdi-account-group" />
          <v-img v-else-if="conversation.contact?.avatarUrl" :src="conversation.contact.avatarUrl" />
          <v-icon v-else icon="mdi-account" />
        </v-avatar>
        <div class="flex-grow-1">
          <div class="font-weight-medium">{{ conversation.contact?.fullName || 'Unknown' }}</div>
          <div class="text-caption text-grey">{{ conversation.zaloAccount?.displayName || 'Zalo' }}</div>
        </div>
        <v-btn size="small" variant="tonal" color="primary" class="mr-2" :loading="aiSuggestionLoading" @click="$emit('ask-ai')">
          Ask AI
        </v-btn>
        <v-btn
          :icon="showContactPanel ? 'mdi-account-details' : 'mdi-account-details-outline'"
          size="small"
          variant="text"
          :color="showContactPanel ? 'primary' : undefined"
          @click="$emit('toggle-contact-panel')"
        />
      </div>

      <div ref="messagesContainer" class="flex-grow-1 overflow-y-auto pa-3 chat-messages-area">
        <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-2" />
        <div
          v-for="msg in messages"
          :key="msg.id"
          class="mb-2 d-flex"
          :class="msg.senderType === 'self' ? 'justify-end' : 'justify-start'"
        >
          <div class="thread-bubble-wrap">
            <div v-if="conversation.threadType === 'group' && msg.senderType !== 'self'" class="text-caption mb-1 thread-group-name">
              {{ msg.senderName || 'Unknown' }}
            </div>
            <div
              class="message-bubble pa-2 px-3 rounded-lg"
              :class="msg.senderType === 'self' ? 'bg-primary text-white' : 'bg-white'"
              style="word-wrap: break-word;"
            >
              <div v-if="msg.isDeleted" class="text-decoration-line-through font-italic thread-faded">
                {{ msg.content || '(tin nhắn)' }}<span class="text-caption"> (đã thu hồi)</span>
              </div>

              <div v-else-if="getImageUrl(msg)">
                <img :src="getImageUrl(msg)!" alt="Hình ảnh" class="chat-image" @click="previewImageUrl = getImageUrl(msg)!" />
              </div>

              <div v-else-if="getFileInfo(msg)" class="file-card">
                <v-icon size="20" class="mr-2" color="info">mdi-file-document-outline</v-icon>
                <div class="flex-grow-1">
                  <div class="text-body-2 font-weight-medium">{{ getFileInfo(msg)!.name }}</div>
                  <div class="text-caption thread-faded">{{ getFileInfo(msg)!.size }}</div>
                </div>
                <v-btn v-if="getFileInfo(msg)!.href" icon size="x-small" variant="text" @click="openFile(getFileInfo(msg)!.href)">
                  <v-icon size="16">mdi-download</v-icon>
                </v-btn>
              </div>

              <div v-else-if="msg.contentType === 'sticker'">🏷️ Sticker</div>
              <div v-else-if="msg.contentType === 'video'">🎥 Video</div>
              <div v-else-if="msg.contentType === 'voice'">🎤 Tin nhắn thoại</div>
              <div v-else-if="msg.contentType === 'gif'">GIF</div>

              <div v-else-if="isReminderMessage(msg)" class="reminder-card">
                <div class="d-flex align-center mb-1">
                  <v-icon size="16" color="warning" class="mr-1">mdi-calendar-clock</v-icon>
                  <span class="text-caption font-weight-bold reminder-label">Nhắc hẹn</span>
                </div>
                <div class="text-body-2">{{ getReminderTitle(msg) }}</div>
                <div v-if="getReminderTime(msg)" class="text-caption mt-1 thread-faded">
                  <v-icon size="12" class="mr-1">mdi-clock-outline</v-icon>{{ getReminderTime(msg) }}
                </div>
                <v-btn size="x-small" variant="tonal" color="warning" class="mt-2" prepend-icon="mdi-calendar-sync" @click="syncAppointment(msg)">
                  Đồng bộ lịch
                </v-btn>
              </div>

              <div v-else>{{ parseDisplayContent(msg.content) }}</div>

              <div class="text-caption mt-1 msg-time" :class="msg.senderType === 'self' ? 'msg-time-self' : 'msg-time-contact'" style="font-size: 0.7rem;">
                {{ formatMessageTime(msg.sentAt) }}
              </div>
            </div>
          </div>
        </div>
        <div v-if="!loading && messages.length === 0" class="text-center pa-8 text-grey">Chưa có tin nhắn</div>
      </div>

      <div class="pa-2 chat-input-area">
        <AiSuggestionPanel
          :suggestion="aiSuggestion"
          :loading="aiSuggestionLoading"
          :error="aiSuggestionError"
          @generate="$emit('ask-ai')"
          @apply="applySuggestion"
          @refine="handleRefine"
          @close="$emit('clear-ai')"
        />
        <div class="d-flex align-end">
          <v-textarea
            v-model="inputText"
            placeholder="Nhập tin nhắn..."
            variant="solo-filled"
            density="compact"
            hide-details
            auto-grow
            rows="1"
            max-rows="5"
            @keydown.enter.exact.prevent="handleSend"
            class="flex-grow-1 mr-2 futuristic-input"
          >
            <template #append-inner>
              <v-btn
                icon
                size="x-small"
                variant="text"
                class="magic-wand-btn mr-1"
                :loading="aiSuggestionLoading"
                @click="handleMagicCompose"
                title="AI Soạn văn bản ma thuật"
              >
                <v-icon color="primary">mdi-auto-fix</v-icon>
              </v-btn>
            </template>
          </v-textarea>
          <v-btn icon color="primary" :loading="sending" :disabled="!inputText.trim()" @click="handleSend" class="send-btn">
            <v-icon>mdi-send</v-icon>
          </v-btn>
        </div>
      </div>
    </template>

    <v-dialog v-model="showImagePreview" max-width="900" content-class="elevation-0">
      <div class="text-center preview-shell" @click="showImagePreview = false">
        <img :src="previewImageUrl" alt="Preview" class="preview-image" />
        <div class="text-caption mt-2 preview-caption">Nhấn để đóng</div>
      </div>
    </v-dialog>

    <v-snackbar v-model="syncSnack.show" :color="syncSnack.color" timeout="3000">{{ syncSnack.text }}</v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue';
import type { Conversation, Message } from '@/composables/use-chat';
import { api } from '@/api/index';
import AiSuggestionPanel from '@/components/ai/ai-suggestion-panel.vue';

const props = defineProps<{
  conversation: Conversation | null;
  messages: Message[];
  loading: boolean;
  sending: boolean;
  showContactPanel?: boolean;
  aiSuggestion: string;
  aiSuggestionLoading: boolean;
  aiSuggestionError: string;
}>();

const emit = defineEmits<{
  send: [content: string];
  'toggle-contact-panel': [];
  'ask-ai': [];
  'clear-ai': [];
  'refine-ai': [data: { content: string; instruction: string }];
}>();

const inputText = ref('');
const messagesContainer = ref<HTMLElement | null>(null);
const previewImageUrl = ref('');
const showImagePreview = computed({
  get: () => !!previewImageUrl.value,
  set: (value) => {
    if (!value) previewImageUrl.value = '';
  },
});
const syncSnack = ref({ show: false, text: '', color: 'success' });

function handleSend() {
  if (!inputText.value.trim()) return;
  emit('send', inputText.value);
  inputText.value = '';
}

function applySuggestion() {
  if (!props.aiSuggestion) return;
  inputText.value = props.aiSuggestion;
}

function handleMagicCompose() {
  if (inputText.value.trim()) {
    handleRefine('Hoàn thiện và trau chuốt nội dung này cho tôi');
  } else {
    emit('ask-ai');
  }
}

function handleRefine(instruction: string) {
  emit('refine-ai', { content: inputText.value, instruction });
}

function formatMessageTime(value: string) {
  return new Date(value).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function openFile(url: string) {
  window.open(url, '_blank');
}

function getImageUrl(msg: Message): string | null {
  if (msg.contentType === 'image' && msg.content) {
    if (msg.content.startsWith('http')) return msg.content;
    try {
      const payload = JSON.parse(msg.content);
      return payload.href || payload.thumb || payload.hdUrl || null;
    } catch {}
  }

  if (msg.content?.startsWith('{')) {
    try {
      const payload = JSON.parse(msg.content);
      const href = payload.href || payload.thumb || '';
      if (href && /\.(jpg|jpeg|png|webp|gif)/i.test(href)) return href;
      if (href && href.includes('zdn.vn') && !payload.params?.includes('fileExt')) return href;
    } catch {}
  }

  return null;
}

function getFileInfo(msg: Message): { name: string; size: string; href: string } | null {
  if (!msg.content?.startsWith('{')) return null;
  try {
    const payload = JSON.parse(msg.content);
    const params = typeof payload.params === 'string' ? JSON.parse(payload.params) : payload.params;
    if (params?.fileExt || params?.fType === 1) {
      const bytes = parseInt(params.fileSize || '0');
      const size = bytes > 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
      return { name: payload.title || `file.${params.fileExt || 'unknown'}`, size, href: payload.href || '' };
    }
  } catch {}
  return null;
}

function parseDisplayContent(content: string | null): string {
  if (!content) return '';
  if (!content.startsWith('{')) return content;
  try {
    const payload = JSON.parse(content);
    if (payload.title && payload.href) return `🔗 ${payload.title}`;
    if (payload.title) return payload.title;
    if (payload.href) return `🔗 ${payload.description || payload.href}`;
    return content;
  } catch {
    return content;
  }
}

function isReminderMessage(msg: Message): boolean {
  if (!msg.content) return false;
  try {
    const payload = JSON.parse(msg.content);
    return payload.action === 'msginfo.actionlist';
  } catch {
    return false;
  }
}

function getReminderTitle(msg: Message): string {
  try {
    return JSON.parse(msg.content!).title || '';
  } catch {
    return msg.content || '';
  }
}

function getReminderTime(msg: Message): string | null {
  try {
    const payload = JSON.parse(msg.content!);
    const params = typeof payload.params === 'string' ? JSON.parse(payload.params) : payload.params;
    for (const highlight of (params?.highLightsV2 || [])) {
      if (highlight.ts > 1e12) {
        return new Date(highlight.ts).toLocaleString('vi-VN', {
          weekday: 'long',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      }
    }
  } catch {}
  return null;
}

async function syncAppointment(msg: Message) {
  if (!props.conversation?.contact?.id) {
    syncSnack.value = { show: true, text: 'Không có thông tin khách hàng', color: 'error' };
    return;
  }

  try {
    const payload = JSON.parse(msg.content!);
    const params = typeof payload.params === 'string' ? JSON.parse(payload.params) : payload.params;
    let appointmentDate: string | null = null;

    for (const highlight of (params?.highLightsV2 || [])) {
      if (highlight.ts > 1e12) {
        appointmentDate = new Date(highlight.ts).toISOString();
        break;
      }
    }

    if (!appointmentDate) {
      syncSnack.value = { show: true, text: 'Không tìm thấy thời gian hẹn', color: 'warning' };
      return;
    }

    await api.post('/appointments', {
      contactId: props.conversation.contact.id,
      appointmentDate,
      appointmentTime: new Date(appointmentDate).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      type: 'tai_kham',
      notes: `[Zalo] ${payload.title || ''}`,
    });

    syncSnack.value = { show: true, text: 'Đã đồng bộ lịch hẹn thành công!', color: 'success' };
  } catch (err: any) {
    syncSnack.value = { show: true, text: err.response?.data?.error || 'Đồng bộ thất bại', color: 'error' };
  }
}

watch(
  () => props.messages.length,
  async () => {
    await nextTick();
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  },
);
</script>

<style scoped>
.message-thread-root {
  height: 100%;
}

.thread-header {
  border-bottom: 1px solid var(--color-border);
}

.thread-bubble-wrap {
  max-width: 70%;
}

.thread-group-name {
  color: var(--color-primary);
  font-weight: 500;
}

.thread-faded {
  opacity: 0.68;
}

.message-bubble {
  box-shadow: var(--shadow-sm);
}

.reminder-card {
  padding: 8px 12px;
  border-left: 3px solid var(--color-warning);
  border-radius: 8px;
  background: var(--color-warning-soft);
}

.reminder-label {
  color: var(--color-warning);
}

.file-card {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 8px;
  background: var(--color-primary-soft);
  border: 1px solid var(--color-primary-soft-strong);
}

.chat-image {
  max-width: 100%;
  max-height: 300px;
  border-radius: 12px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: var(--shadow-sm);
}

.chat-image:hover {
  transform: scale(1.02);
}

.futuristic-input :deep(.v-field) {
  background: var(--color-surface-glass) !important;
  border: 1px solid var(--color-border) !important;
  border-radius: 12px !important;
  transition: all 0.3s ease;
}

.futuristic-input :deep(.v-field--focused) {
  border-color: var(--color-primary-soft-strong) !important;
  box-shadow: 0 0 0 4px var(--color-primary-soft) !important;
}

.magic-wand-btn {
  opacity: 0.7;
  transition: all 0.3s ease;
}

.magic-wand-btn:hover {
  opacity: 1;
  transform: rotate(15deg) scale(1.1);
  filter: drop-shadow(0 0 5px var(--color-primary-soft-strong));
}

.send-btn {
  height: 44px !important;
  width: 44px !important;
  margin-bottom: 2px;
  box-shadow: var(--glow-brand) !important;
}

.chat-input-area {
  background: var(--color-surface-glass);
  border-top: 1px solid var(--color-border);
}

.preview-shell {
  cursor: pointer;
}

.preview-image {
  max-width: 100%;
  max-height: 85vh;
  border-radius: 12px;
  box-shadow: var(--shadow-lg);
}

.preview-caption {
  color: var(--color-text-secondary);
}
</style>
