<template>
  <div class="message-thread d-flex flex-column flex-grow-1 message-thread-root">
    <div v-if="!conversation" class="d-flex align-center justify-center flex-grow-1">
      <div class="text-center text-grey">
        <v-icon icon="mdi-chat-outline" size="96" color="grey-lighten-2" />
        <p class="text-h6 mt-4">Chọn cuộc trò chuyện</p>
      </div>
    </div>

    <template v-else>
      <div class="pa-3 d-flex align-center thread-header glass-header">
        <v-btn icon size="small" variant="text" class="mr-1 d-md-none" @click="$emit('back')">
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>
        <div class="position-relative mr-3">
          <v-avatar size="42" class="avatar-glow">
            <v-icon v-if="conversation.threadType === 'group'" icon="mdi-account-group" color="primary" />
            <v-img v-else-if="conversation.contact?.avatarUrl" :src="conversation.contact.avatarUrl" />
            <v-icon v-else icon="mdi-account" color="primary" />
          </v-avatar>
          <div class="status-indicator online"></div>
        </div>
        <div class="flex-grow-1 overflow-hidden">
          <div class="font-weight-bold text-truncate text-h6 mb-n1">{{ conversation.contact?.fullName || 'Khách hàng' }}</div>
          <div class="d-flex align-center">
            <v-icon size="12" color="success" class="mr-1">mdi-circle</v-icon>
            <span class="text-caption text-grey-darken-1">{{ conversation.zaloAccount?.displayName || 'Zalo' }}</span>
          </div>
        </div>
        <div class="d-flex ga-2">
          <v-tooltip text="Hỗ trợ trả lời bằng AI" location="bottom">
            <template #activator="{ props }">
              <v-btn
                v-bind="props"
                size="small"
                variant="flat"
                color="primary"
                class="ai-spark-btn"
                :loading="aiSuggestionLoading"
                @click="$emit('ask-ai')"
              >
                <v-icon start>mdi-sparkles</v-icon>
                AI Reply
              </v-btn>
            </template>
          </v-tooltip>
          <v-btn
            :icon="showContactPanel ? 'mdi-information' : 'mdi-information-outline'"
            size="small"
            variant="tonal"
            :color="showContactPanel ? 'primary' : 'grey-darken-1'"
            @click="$emit('toggle-contact-panel')"
            title="Thông tin chi tiết"
          />
        </div>
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

      <div class="pa-2 chat-input-area border-t">
        <div v-if="aiPills.length > 0 && !aiSuggestionLoading" class="ai-pills-container d-flex ga-2 px-2 pb-2 overflow-x-auto">
          <v-chip
            v-for="(pill, idx) in aiPills"
            :key="idx"
            size="small"
            variant="tonal"
            color="primary"
            class="ai-pill"
            @click="applyPill(pill)"
          >
            <v-icon start size="14">mdi-robot-outline</v-icon>
            {{ pill }}
          </v-chip>
          <v-btn size="x-small" variant="text" icon="mdi-close" @click="aiPills = []" />
        </div>

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
          <div class="d-flex flex-column mb-1">
            <v-btn icon size="small" variant="text" class="mb-1" @click="triggerUpload('image')" title="Gửi ảnh">
              <v-icon color="grey-darken-1">mdi-image-outline</v-icon>
            </v-btn>
            <v-btn icon size="small" variant="text" @click="triggerUpload('file')" title="Gửi tệp">
              <v-icon color="grey-darken-1">mdi-paperclip</v-icon>
            </v-btn>
          </div>
          <input type="file" ref="fileInput" hidden @change="onFileSelected" />
          
          <v-textarea
            v-model="inputText"
            placeholder="Nhập tin nhắn... (Dán ảnh để gửi)"
            variant="solo-filled"
            density="compact"
            hide-details
            auto-grow
            rows="1"
            max-rows="5"
            @keydown.enter.exact.prevent="handleSend"
            @paste="handlePaste"
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

    <v-snackbar v-model="syncSnack.show" :color="syncSnack.color" timeout="3000" location="top">
      <v-icon start>{{ syncSnack.color === 'success' ? 'mdi-check-circle' : 'mdi-alert-circle' }}</v-icon>
      {{ syncSnack.text }}
    </v-snackbar>
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
  back: [];
}>();

const inputText = ref('');
const fileInput = ref<HTMLInputElement | null>(null);
const uploadType = ref<'image' | 'file'>('image');
const messagesContainer = ref<HTMLElement | null>(null);
const previewImageUrl = ref('');
const showImagePreview = computed({
  get: () => !!previewImageUrl.value,
  set: (value) => {
    if (!value) previewImageUrl.value = '';
  },
});
const aiPills = ref<string[]>([]);
const syncSnack = ref({ show: false, text: '', color: 'success' });

// Mock or intelligent pills based on context
watch(() => props.conversation?.id, () => {
  aiPills.value = ['Dạ vâng ạ', 'Cảm ơn bạn', 'Để mình kiểm tra', 'Bạn cần hỗ trợ gì?'];
});

watch(() => props.aiSuggestion, (newVal) => {
  if (newVal && newVal.length < 50) {
    if (!aiPills.value.includes(newVal)) aiPills.value.unshift(newVal);
  }
});

function applyPill(text: string) {
  inputText.value = text;
}

function handleSend() {
  if (!inputText.value.trim()) return;
  emit('send', inputText.value);
  inputText.value = '';
}

async function triggerUpload(type: 'image' | 'file') {
  uploadType.value = type;
  if (fileInput.value) {
    fileInput.value.accept = type === 'image' ? 'image/*' : '*/*';
    fileInput.value.click();
  }
}

async function onFileSelected(e: Event) {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;
  await uploadAndSend(file, uploadType.value);
  target.value = '';
}

async function handlePaste(e: ClipboardEvent) {
  const items = e.clipboardData?.items;
  if (!items) return;

  for (const item of items) {
    if (item.type.indexOf('image') !== -1) {
      const file = item.getAsFile();
      if (file) {
        await uploadAndSend(file, 'image');
      }
    }
  }
}

async function uploadAndSend(file: File, type: 'image' | 'file') {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    // Using api instead of axios to stay consistent
    const uploadRes = await api.post('/chat/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    
    const { url, filename, mimetype } = uploadRes.data;
    
    // Construct attachment object
    const attachment = { url, name: filename, type: mimetype };
    
    // Send message with attachment
    // The emit('send') currently only takes string content, we might need to update use-chat.ts or just handle it here
    // However, keeping it consistent with our backend update:
    await api.post(`/conversations/${props.conversation?.id}/messages`, {
      content: type === 'image' ? 'Gửi một hình ảnh' : `Gửi tệp: ${filename}`,
      contentType: type,
      attachments: [attachment]
    });
    
    // We don't need to manually emit because Socket.IO will sync the message back
  } catch (err) {
    console.error('Upload failed:', err);
    syncSnack.value = { show: true, text: 'Không thể gửi tệp. Vui lòng thử lại.', color: 'error' };
  }
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
    if (msg.content.startsWith('http') || msg.content.startsWith('/uploads/')) return msg.content;
    try {
      const payload = JSON.parse(msg.content);
      return payload.url || payload.href || payload.thumb || payload.hdUrl || null;
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
    
    // Support local upload format
    if (msg.contentType === 'file' && payload.url) {
      return { name: payload.name || 'Tệp đính kèm', size: '', href: payload.url };
    }

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

.glass-header {
  background: var(--color-surface-glass) !important;
  backdrop-filter: blur(12px);
  z-index: 5;
}

.avatar-glow {
  box-shadow: 0 0 0 2px var(--color-canvas), 0 0 0 4px var(--color-primary-soft);
}

.status-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid var(--color-surface);
}

.status-indicator.online {
  background: var(--color-success);
}

.ai-spark-btn {
  background: var(--gradient-brand) !important;
  color: white !important;
  box-shadow: var(--glow-brand);
}

.thread-header {
  border-bottom: 1px solid var(--color-border);
  height: 64px;
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
  transition: all 0.3s ease;
}

.ai-pills-container {
  scrollbar-width: none;
}
.ai-pills-container::-webkit-scrollbar {
  display: none;
}

.ai-pill {
  flex-shrink: 0;
  cursor: pointer;
  transition: transform 0.2s;
}

.ai-pill:hover {
  transform: translateY(-2px);
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
