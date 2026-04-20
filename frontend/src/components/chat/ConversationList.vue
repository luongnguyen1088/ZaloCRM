<template>
  <div class="conversation-list d-flex flex-column h-100">
    <!-- Search & Filter Area -->
    <div class="pa-3 flex-shrink-0 glass-header">
      <div class="d-flex align-center mb-2">
        <h2 class="text-subtitle-1 font-weight-bold gradient-text">Hội thoại</h2>
        <v-spacer />
        <v-tooltip text="Lọc theo tài khoản Zalo" location="bottom">
          <template v-slot:activator="{ props }">
            <v-btn v-bind="props" icon size="x-small" variant="text" color="primary" @click="showFilters = !showFilters">
              <v-icon>{{ showFilters ? 'mdi-filter-off-outline' : 'mdi-filter-outline' }}</v-icon>
            </v-btn>
          </template>
        </v-tooltip>
      </div>

      <v-expand-transition>
        <div v-if="showFilters" class="mb-3">
          <v-select
            v-model="selectedAccountId"
            :items="accountOptions"
            item-title="text"
            item-value="value"
            label="Chọn Zalo Shop"
            density="compact"
            variant="outlined"
            hide-details
            rounded="lg"
            class="filter-select"
            @update:model-value="$emit('filter-account', $event)"
          >
            <template v-slot:prepend-inner>
              <v-icon size="small" color="primary">mdi-store-outline</v-icon>
            </template>
          </v-select>
        </div>
      </v-expand-transition>

      <v-text-field
        :model-value="search"
        @update:model-value="$emit('update:search', $event)"
        placeholder="Tìm tên khách hàng, nội dung..."
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
        density="compact"
        rounded="lg"
        hide-details
        clearable
        class="search-bar"
      />
    </div>

    <!-- Conversations List -->
    <div class="flex-grow-1 overflow-y-auto custom-scrollbar">
      <v-progress-linear v-if="loading" indeterminate color="primary" height="2" />

      <v-list class="bg-transparent pa-0" density="comfortable">
        <v-list-item
          v-for="conv in conversations"
          :key="conv.id"
          @click="$emit('select', conv.id)"
          class="conv-item mb-1 px-3"
          :class="{ 'conv-active': conv.id === selectedId }"
          ripple
        >
          <template #prepend>
            <div class="position-relative">
              <v-avatar size="48" class="border-glass">
                <v-img v-if="conv.contact?.avatarUrl" :src="conv.contact.avatarUrl" />
                <v-icon v-else :icon="conv.threadType === 'group' ? 'mdi-account-group' : 'mdi-account'" color="grey" />
              </v-avatar>
              <!-- Online status or account indicator -->
              <div v-if="conv.unreadCount > 0" class="unread-dot pulse"></div>
            </div>
          </template>

          <v-list-item-title class="d-flex align-center pt-1">
            <span class="name-text text-truncate font-weight-bold" :class="conv.unreadCount > 0 ? 'text-white' : 'text-medium-emphasis'">
              {{ conv.threadType === 'group' ? (conv.contact?.fullName || 'Nhóm') : (conv.contact?.fullName || 'Unknown') }}
            </span>
            <v-spacer />
            <span class="time-text">{{ formatTime(conv.lastMessageAt) }}</span>
          </v-list-item-title>

          <v-list-item-subtitle class="d-flex align-center pb-1">
            <span class="preview-text text-truncate flex-grow-1" :class="{ 'unread-text': conv.unreadCount > 0 }">
              {{ lastMessagePreview(conv) }}
            </span>
            
            <div class="d-flex align-center">
              <AiSentimentBadge v-if="parseSentiment(conv)" :sentiment="parseSentiment(conv)" size="x-small" class="ml-2" />
              <div v-if="conv.unreadCount > 0" class="unread-count-badge ml-2">
                {{ conv.unreadCount > 9 ? '9+' : conv.unreadCount }}
              </div>
            </div>
          </v-list-item-subtitle>

          <!-- Account badge at bottom of item -->
          <div class="d-flex align-center mt-n1 pb-1">
             <div v-if="conv.zaloAccount?.displayName" class="account-tag d-flex align-center">
              <v-icon size="10" class="mr-1">mdi-account-circle-outline</v-icon>
              {{ conv.zaloAccount.displayName }}
            </div>
          </div>

          <div v-if="conv.id === selectedId" class="active-indicator"></div>
        </v-list-item>
      </v-list>

      <div v-if="!loading && conversations.length === 0" class="text-center pa-10 opacity-30">
        <v-icon size="48" class="mb-4">mdi-message-off-outline</v-icon>
        <div class="text-body-2">Không có hội thoại nào</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { Conversation, AiSentiment } from '@/composables/use-chat';
import { api } from '@/api/index';
import AiSentimentBadge from '@/components/ai/ai-sentiment-badge.vue';

defineProps<{
  conversations: Conversation[];
  selectedId: string | null;
  loading: boolean;
  search: string;
}>();

defineEmits<{
  select: [id: string];
  'update:search': [value: string];
  'filter-account': [accountId: string | null];
}>();

const accountOptions = ref<{ text: string; value: string }[]>([]);
const selectedAccountId = ref<string | null>(null);
const showFilters = ref(false);

onMounted(async () => {
  try {
    const res = await api.get('/zalo-accounts');
    const accounts = Array.isArray(res.data) ? res.data : res.data.accounts || [];
    accountOptions.value = accounts.map((a: any) => ({
      text: a.displayName || a.zaloUid || a.id,
      value: a.id,
    }));
  } catch { /* ignore */ }
});

function lastMessagePreview(conv: Conversation): string {
  const msg = conv.messages?.[0];
  if (!msg) return '';
  if (msg.isDeleted) return '(đã thu hồi)';
  const prefix = msg.senderType === 'self' ? 'Bạn: ' : '';

  switch (msg.contentType) {
    case 'image': return prefix + '📷 Hình ảnh';
    case 'sticker': return prefix + '🏷️ Sticker';
    case 'video': return prefix + '🎥 Video';
    case 'voice': return prefix + '🎤 Tin nhắn thoại';
    case 'gif': return prefix + 'GIF';
    case 'file': return prefix + '📎 Tệp đính kèm';
    case 'link': return prefix + '🔗 Liên kết';
  }

  const text = msg.content || '';
  return prefix + (text.length > 40 ? text.slice(0, 40) + '...' : text);
}

function parseSentiment(conv: Conversation): AiSentiment | null {
  const raw = (conv.contact as any)?.metadata?.aiSentiment;
  if (!raw) return null;
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    return null;
  }
}

function formatTime(dateStr: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Vừa xong';
  if (diffMins < 60) return `${diffMins}p`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Hqua';
  if (diffDays < 7) return `${diffDays}n`;

  return date.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' });
}
</script>

<style scoped>
.glass-header {
  background: #ffffff;
  border-bottom: 1px solid #f1f5f9;
}

.gradient-text {
  background: linear-gradient(90deg, #1e293b, #64748b);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.filter-select :deep(.v-field) {
  border-radius: 10px !important;
  font-size: 13px;
  background: #f8fafc !important;
  border-color: #e2e8f0 !important;
}

.search-bar :deep(.v-field) {
  border-radius: 10px !important;
  font-size: 13px;
  background: #f8fafc !important;
  border-color: #e2e8f0 !important;
}

.conv-item {
  transition: all 0.2s ease;
  position: relative;
  cursor: pointer;
  border-radius: 12px;
  margin: 0 8px;
}

.conv-item:hover {
  background: #f1f5f9 !important;
}

.conv-active {
  background: #eff6ff !important;
}

.active-indicator {
  position: absolute;
  left: -8px;
  top: 20%;
  bottom: 20%;
  width: 4px;
  background: #2563eb;
  border-radius: 0 4px 4px 0;
}

.border-glass {
  border: 1px solid #e2e8f0;
}

.unread-dot {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 11px;
  height: 11px;
  background: #ef4444;
  border: 2px solid #ffffff;
  border-radius: 50%;
  z-index: 2;
}

.unread-count-badge {
  background: #ef4444;
  color: white;
  font-size: 10px;
  min-width: 18px;
  height: 18px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.pulse {
  animation: pulse-animation 2s infinite;
}

@keyframes pulse-animation {
  0% { box-shadow: 0 0 0 0px rgba(239, 68, 68, 0.4); }
  70% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
  100% { box-shadow: 0 0 0 0px rgba(239, 68, 68, 0); }
}

.name-text { font-size: 14.5px; color: #0f172a; }
.preview-text { font-size: 12.5px; color: #64748b; }
.unread-text { color: #0f172a !important; font-weight: 600; }
.time-text { font-size: 11px; color: #94a3b8; }

.account-tag {
  font-size: 10px;
  padding: 1px 8px;
  border-radius: 6px;
  background: #f1f5f9;
  color: #475569;
  margin-top: 4px;
  font-weight: 500;
  border: 1px solid #e2e8f0;
}

.custom-scrollbar::-webkit-scrollbar { width: 3px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
</style>
