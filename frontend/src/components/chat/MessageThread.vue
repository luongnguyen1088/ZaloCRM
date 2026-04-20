<template>
  <div class="message-thread d-flex flex-column flex-grow-1 h-100 position-relative">
    <!-- Empty state -->
    <div v-if="!conversation" class="d-flex align-center justify-center flex-grow-1 empty-state">
      <div class="text-center">
        <div class="icon-orb mb-6">
          <v-icon icon="mdi-chat-processing-outline" size="48" color="primary" />
        </div>
        <p class="text-h6 font-weight-bold opacity-60">Chọn một hội thoại để bắt đầu</p>
        <p class="text-body-2 opacity-40">Tư vấn khách hàng nhanh hơn với trợ lý AI</p>
      </div>
    </div>

    <template v-else>
      <!-- Header -->
      <div class="chat-header d-flex align-center pa-4">
        <v-avatar size="44" class="mr-3 border-glass">
          <v-img v-if="conversation.contact?.avatarUrl" :src="conversation.contact.avatarUrl" />
          <v-icon v-else :icon="conversation.threadType === 'group' ? 'mdi-account-group' : 'mdi-account'" />
        </v-avatar>
        
        <div class="flex-grow-1 overflow-hidden">
          <div class="font-weight-bold text-subtitle-1 text-truncate">{{ conversation.contact?.fullName || 'Unknown' }}</div>
          <div class="d-flex align-center">
            <span class="status-dot mr-2"></span>
            <span class="text-caption opacity-60 text-truncate">Gắn với: {{ conversation.zaloAccount?.displayName || 'Zalo' }}</span>
          </div>
        </div>

        <div class="d-flex ga-2">
          <v-btn variant="tonal" border color="primary" rounded="lg" size="small" :loading="aiSuggestionLoading" prepend-icon="mdi-sparkles" @click="$emit('ask-ai')">
            Gợi ý AI
          </v-btn>
          <v-btn
            icon="mdi-information-outline"
            size="small" variant="text"
            :color="showContactPanel ? 'primary' : undefined"
            @click="$emit('toggle-contact-panel')"
            class="rounded-lg"
          />
        </div>
      </div>

      <!-- Messages Area -->
      <div ref="messagesContainer" class="flex-grow-1 overflow-y-auto pa-4 custom-scrollbar bg-chat-active">
        <v-progress-linear v-if="loading" indeterminate color="primary" height="2" class="mb-4" />
        
        <div v-for="(msg, index) in messages" :key="msg.id">
          <!-- Date Separator -->
          <div v-if="shouldShowDate(msg, index)" class="d-flex align-center my-6 opacity-30">
            <v-divider />
            <span class="text-caption px-4 font-weight-bold text-uppercase">{{ formatDateLabel(msg.sentAt) }}</span>
            <v-divider />
          </div>

          <div class="message-row d-flex mb-3" :class="msg.senderType === 'self' ? 'justify-end' : 'justify-start'">
            <div class="message-wrapper" style="max-width: 75%;">
              <!-- Group Member Name -->
              <div v-if="conversation.threadType === 'group' && msg.senderType !== 'self'" class="text-caption mb-1 ml-2 primary--text opacity-80 font-weight-bold">
                {{ msg.senderName || 'Thành viên' }}
              </div>

              <div class="message-bubble" :class="msg.senderType === 'self' ? 'bubble-self' : 'bubble-contact'">
                <!-- Deleted Content -->
                <div v-if="msg.isDeleted" class="deleted-msg">
                  <v-icon size="14" class="mr-1">mdi-cancel</v-icon> Tin nhắn đã được thu hồi
                </div>

                <!-- Media Content -->
                <div v-else-if="getImageUrl(msg)" class="media-container mt-1">
                  <v-img :src="getImageUrl(msg)!" cover class="chat-img rounded-lg" @click="previewImageUrl = getImageUrl(msg)!" height="180" width="240">
                    <template v-slot:placeholder><v-skeleton-loader type="image" /></template>
                  </v-img>
                </div>

                <!-- File Content -->
                <div v-else-if="getFileInfo(msg)" class="file-card-v2 d-flex align-center pa-2">
                  <div class="file-icon mr-3">
                    <v-icon size="24" color="white" icon="mdi-file-document" />
                  </div>
                  <div class="flex-grow-1 overflow-hidden mr-2">
                    <div class="text-body-2 font-weight-bold text-truncate">{{ getFileInfo(msg)!.name }}</div>
                    <div class="text-caption opacity-60">{{ getFileInfo(msg)!.size }}</div>
                  </div>
                  <v-btn v-if="getFileInfo(msg)!.href" icon="mdi-download" size="x-small" variant="tonal" @click="openFile(getFileInfo(msg)!.href)" />
                </div>

                <!-- Reminder Card -->
                <div v-else-if="isReminderMessage(msg)" class="reminder-card-v2 pa-3">
                   <div class="d-flex align-center mb-2">
                    <v-icon size="18" color="warning" class="mr-2">mdi-calendar-check</v-icon>
                    <span class="text-subtitle-2 font-weight-bold text-warning">Lịch nhắc khách</span>
                  </div>
                  <div class="text-body-2 mb-2 font-weight-medium">{{ getReminderTitle(msg) }}</div>
                  <div v-if="getReminderTime(msg)" class="reminder-time-box mb-3 pa-2 rounded">
                    <v-icon size="14" class="mr-2">mdi-clock-outline</v-icon>
                    <span class="text-caption">{{ getReminderTime(msg) }}</span>
                  </div>
                  <v-btn size="small" variant="flat" color="warning" rounded="pill" block prepend-icon="mdi-sync" @click="syncAppointment(msg)">
                    Đồng bộ CRM
                  </v-btn>
                </div>

                <!-- Regular Text -->
                <div v-else class="text-body-2 message-text">{{ parseDisplayContent(msg.content) }}</div>

                <!-- Timestamp -->
                <div class="d-flex align-center justify-end mt-1 opacity-50" style="font-size: 0.65rem;">
                  <span>{{ formatMessageTime(msg.sentAt) }}</span>
                  <v-icon v-if="msg.senderType === 'self'" size="10" class="ml-1" color="primary">mdi-check-all</v-icon>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Area (Inputs) -->
      <div class="chat-footer pa-4">
        <!-- AI Suggestion floating above -->
        <div class="suggestion-wrapper mb-3">
          <AiSuggestionPanel
            :suggestion="aiSuggestion"
            :loading="aiSuggestionLoading"
            :error="aiSuggestionError"
            @generate="$emit('ask-ai')"
            @apply="applySuggestion"
            @refine="handleRefine"
            @close="$emit('clear-ai')"
          />
        </div>

        <div class="d-flex align-end futuristic-input-container pa-1">
          <v-btn icon="mdi-plus" variant="text" size="small" color="primary" class="mb-1 rounded-lg" />
          
          <v-textarea
            v-model="inputText"
            placeholder="Nhập câu trả lời hoặc sử dụng trợ lý..."
            variant="plain"
            density="compact"
            hide-details
            auto-grow
            rows="1"
            max-rows="6"
            @keydown.enter.exact.prevent="handleSend"
            class="mx-2 custom-textarea"
          />

          <div class="d-flex align-center mb-1">
            <v-tooltip text="AI tối ưu lời thoại" location="top">
              <template v-slot:activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon="mdi-auto-fix"
                  size="small"
                  variant="text"
                  color="primary"
                  class="magic-btn mr-1"
                  :loading="aiSuggestionLoading"
                  @click="handleMagicCompose"
                />
              </template>
            </v-tooltip>

            <v-btn color="primary" flat rounded="lg" size="small" :disabled="!inputText.trim()" @click="handleSend" height="36">
              <v-icon class="mr-1">mdi-send</v-icon> Gửi
            </v-btn>
          </div>
        </div>
      </div>
    </template>

    <!-- Dialogs & Snacks -->
    <v-dialog v-model="showImagePreview" max-width="900">
      <v-card flat class="bg-black text-center pa-2" @click="showImagePreview = false">
        <v-img :src="previewImageUrl" max-height="85vh" contain rounded="lg" />
        <div class="text-caption mt-2 text-grey">Bấm bất kỳ đâu để đóng</div>
      </v-card>
    </v-dialog>
    <v-snackbar v-model="syncSnack.show" :color="syncSnack.color" rounded="pill" location="top">{{ syncSnack.text }}</v-snackbar>
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
const showImagePreview = computed({ get: () => !!previewImageUrl.value, set: (v) => { if (!v) previewImageUrl.value = ''; } });
const syncSnack = ref({ show: false, text: '', color: 'success' });

function handleSend() { if (!inputText.value.trim()) return; emit('send', inputText.value); inputText.value = ''; }
function applySuggestion() { if (!props.aiSuggestion) return; inputText.value = props.aiSuggestion; }

function handleMagicCompose() {
  if (inputText.value.trim()) {
    emit('refine-ai', { content: inputText.value, instruction: 'Hoàn thiện và trau chuốt nội dung này cho tôi trực tiếp và thân thiện' });
  } else {
    emit('ask-ai');
  }
}

function handleRefine(instruction: string) { emit('refine-ai', { content: inputText.value, instruction }); }
function formatMessageTime(d: string) { return new Date(d).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }); }

function shouldShowDate(msg: Message, index: number) {
  if (index === 0) return true;
  const prevDate = new Date(props.messages[index-1].sentAt).toDateString();
  const currDate = new Date(msg.sentAt).toDateString();
  return prevDate !== currDate;
}

function formatDateLabel(d: string) {
  const date = new Date(d);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return 'Hôm nay';
  today.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Hôm qua';
  return date.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' });
}

function openFile(url: string) { window.open(url, '_blank'); }

function getImageUrl(msg: Message): string | null {
  if (msg.contentType === 'image' && msg.content) {
    if (msg.content.startsWith('http')) return msg.content;
    try { const p = JSON.parse(msg.content); return p.href || p.thumb || p.hdUrl || null; } catch {}
  }
  if (msg.content?.startsWith('{')) {
    try {
      const p = JSON.parse(msg.content);
      const href = p.href || p.thumb || '';
      if (href && /\.(jpg|jpeg|png|webp|gif)/i.test(href)) return href;
    } catch {}
  }
  return null;
}

function getFileInfo(msg: Message): { name: string; size: string; href: string } | null {
  if (!msg.content?.startsWith('{')) return null;
  try {
    const p = JSON.parse(msg.content);
    const params = typeof p.params === 'string' ? JSON.parse(p.params) : p.params;
    if (params?.fileExt || params?.fType === 1) {
      const bytes = parseInt(params.fileSize || '0');
      const size = bytes > 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
      return { name: p.title || `file.${params.fileExt || 'unknown'}`, size, href: p.href || '' };
    }
  } catch {}
  return null;
}

function parseDisplayContent(content: string | null): string {
  if (!content) return '';
  if (!content.startsWith('{')) return content;
  try {
    const p = JSON.parse(content);
    return p.title || p.href || content;
  } catch { return content; }
}

function isReminderMessage(msg: Message): boolean {
  if (!msg.content) return false;
  try { const p = JSON.parse(msg.content); return p.action === 'msginfo.actionlist'; } catch { return false; }
}

function getReminderTitle(msg: Message): string {
  try { return JSON.parse(msg.content!).title || ''; } catch { return msg.content || ''; }
}

function getReminderTime(msg: Message): string | null {
  try {
    const p = JSON.parse(msg.content!);
    const params = typeof p.params === 'string' ? JSON.parse(p.params) : p.params;
    for (const h of (params?.highLightsV2 || [])) {
      if (h.ts > 1e12) return new Date(h.ts).toLocaleString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    }
  } catch {}
  return null;
}

async function syncAppointment(msg: Message) {
  if (!props.conversation?.contact?.id) { syncSnack.value = { show: true, text: 'Không có thông tin khách', color: 'error' }; return; }
  try {
    const p = JSON.parse(msg.content!);
    const params = typeof p.params === 'string' ? JSON.parse(p.params) : p.params;
    let ts = 0;
    for (const h of (params?.highLightsV2 || [])) if (h.ts > ts) ts = h.ts;
    if (!ts) { syncSnack.value = { show: true, text: 'Không tìm thấy giờ hẹn', color: 'warning' }; return; }
    const date = new Date(ts);
    await api.post('/appointments', {
      contactId: props.conversation.contact.id,
      appointmentDate: date.toISOString(),
      appointmentTime: date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      notes: `[Zalo] ${p.title || ''}`,
    });
    syncSnack.value = { show: true, text: 'Đồng bộ lịch thành công!', color: 'success' };
  } catch (err: any) {
    syncSnack.value = { show: true, text: 'Đồng bộ thất bại', color: 'error' };
  }
}

watch(() => props.messages.length, async () => { await nextTick(); if (messagesContainer.value) messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight; });
watch(() => props.conversation?.id, () => { clearAiState(); });
function clearAiState() { emit('clear-ai'); }
</script>

<style scoped>
.chat-header {
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  z-index: 10;
}

.bg-chat-active {
  background-image: 
    radial-gradient(circle at 50% -20%, rgba(33, 150, 243, 0.05), transparent 60%),
    url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
}

.status-dot {
  width: 7px;
  height: 7px;
  background: #4CAF50;
  border-radius: 50%;
  box-shadow: 0 0 8px rgba(76, 175, 80, 0.5);
}

.message-bubble {
  padding: 10px 14px;
  border-radius: 18px;
  position: relative;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.bubble-self {
  background: linear-gradient(135deg, #0072FF, #00C6FF);
  color: white;
  border-bottom-right-radius: 4px;
}

.bubble-contact {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.05);
  color: white;
  border-bottom-left-radius: 4px;
}

.message-text {
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

.deleted-msg {
  font-style: italic;
  opacity: 0.5;
  font-size: 0.8rem;
}

.file-card-v2 {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  min-width: 200px;
}
.file-icon {
  background: #34495e;
  padding: 8px;
  border-radius: 8px;
}

.reminder-card-v2 {
  background: rgba(255, 183, 77, 0.05);
  border: 1px solid rgba(255, 183, 77, 0.2);
  border-radius: 16px;
  min-width: 250px;
}
.reminder-time-box {
  background: rgba(255, 183, 77, 0.1);
  color: #FFB74D;
}

.chat-footer {
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.futuristic-input-container {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  transition: all 0.3s ease;
}
.futuristic-input-container:focus-within {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(33, 150, 243, 0.4);
  box-shadow: 0 0 20px rgba(33, 150, 243, 0.05);
}

.custom-textarea {
  font-size: 14.5px;
  color: white;
}

.magic-btn {
  transition: transform 0.3s ease;
}
.magic-btn:hover {
  transform: rotate(15deg) scale(1.15);
  color: #00F2FF !important;
}

.icon-orb {
  width: 100px;
  height: 100px;
  background: radial-gradient(circle, rgba(33, 150, 243, 0.1) 0%, transparent 70%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  border-radius: 50%;
}

.chat-img {
  cursor: zoom-in;
  transition: opacity 0.2s;
}
.chat-img:hover { opacity: 0.9; }

.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
</style>
