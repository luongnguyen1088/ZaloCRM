<template>
  <div class="conversation-list d-flex flex-column">
    <div class="search-section pa-4">
      <div class="d-flex align-center justify-space-between mb-4">
        <h2 class="text-h5 font-weight-bold mb-0">Tin nhắn</h2>
        <v-btn icon="mdi-plus" size="small" variant="tonal" color="primary" title="Tạo hội thoại mới" />
      </div>
      
      <v-select
        v-model="selectedAccountId"
        :items="accountOptions"
        item-title="text"
        item-value="value"
        placeholder="Tất cả tài khoản Zalo"
        density="compact"
        variant="solo"
        flat
        hide-details
        clearable
        class="mb-3 account-selector"
        @update:model-value="$emit('filter-account', $event)"
      >
        <template #prepend-inner>
          <v-icon color="primary" size="18">mdi-account-switch-outline</v-icon>
        </template>
      </v-select>

      <v-text-field
        :model-value="search"
        @update:model-value="$emit('update:search', $event)"
        placeholder="Tìm tên khách hàng, nội dung..."
        prepend-inner-icon="mdi-magnify"
        variant="solo"
        flat
        density="compact"
        hide-details
        clearable
        class="search-input"
      />
    </div>

    <v-list class="flex-grow-1 overflow-y-auto pa-0" density="compact">
      <v-progress-linear v-if="loading" indeterminate color="primary" />

      <v-list-item
        v-for="conv in conversations"
        :key="conv.id"
        :active="conv.id === selectedId"
        @click="$emit('select', conv.id)"
        class="py-2"
        :class="{ 'conversation-active': conv.id === selectedId, 'conversation-unread': conv.unreadCount > 0 && conv.id !== selectedId }"
      >
        <template #prepend>
          <v-avatar size="40" color="grey-lighten-2">
            <v-icon v-if="conv.threadType === 'group'" icon="mdi-account-group" />
            <v-img v-else-if="conv.contact?.avatarUrl" :src="conv.contact.avatarUrl" />
            <v-icon v-else icon="mdi-account" />
          </v-avatar>
        </template>

        <v-list-item-title class="d-flex align-center">
          <span class="text-truncate" :class="{ 'font-weight-bold': conv.unreadCount > 0 }">
            {{ conv.threadType === 'group' ? (conv.contact?.fullName || 'Nhóm') : (conv.contact?.fullName || 'Unknown') }}
          </span>
          <v-chip v-if="conv.threadType === 'group'" size="x-small" color="info" variant="tonal" class="ml-1">Nhóm</v-chip>
          <v-spacer />
          <span class="text-caption text-grey ml-1">{{ formatTime(conv.lastMessageAt) }}</span>
        </v-list-item-title>

        <v-list-item-subtitle class="d-flex align-center">
          <span class="text-truncate conversation-preview" :class="{ 'font-weight-medium': conv.unreadCount > 0 }">
            {{ lastMessagePreview(conv) }}
          </span>
          <v-spacer />
          <AiSentimentBadge v-if="parseSentiment(conv)" :sentiment="parseSentiment(conv)" class="mr-2" />
          <v-badge
            v-if="conv.unreadCount > 0"
            :content="conv.unreadCount"
            color="error"
            inline
            class="ml-1"
          />
        </v-list-item-subtitle>
      </v-list-item>

      <div v-if="!loading && conversations.length === 0" class="text-center pa-12">
        <v-icon icon="mdi-chat-sleep-outline" size="48" color="grey-lighten-1" class="mb-2" />
        <div class="text-grey">Không tìm thấy hội thoại</div>
      </div>
    </v-list>
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

onMounted(async () => {
  try {
    const res = await api.get('/zalo-accounts');
    const accounts = Array.isArray(res.data) ? res.data : res.data.accounts || [];
    accountOptions.value = accounts.map((a: any) => ({
      text: a.displayName || a.zaloUid || a.id,
      value: a.id,
    }));
  } catch {
    // Non-critical
  }
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

  if (msg.content) {
    try {
      const p = JSON.parse(msg.content);
      if (p.action === 'msginfo.actionlist' && p.title) {
        return prefix + '📅 ' + p.title.slice(0, 50);
      }
    } catch {}
  }

  const text = msg.content || '';
  return prefix + (text.length > 50 ? text.slice(0, 50) + '...' : text);
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
  if (diffMins < 60) return `${diffMins} phút`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} giờ`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Hôm qua';
  if (diffDays < 7) return `${diffDays} ngày`;

  return date.toLocaleDateString('vi-VN');
}
</script>

<style scoped>
.conversation-list {
  width: 100%;
  height: 100%;
  border-right: 1px solid var(--color-border);
  background: var(--color-surface-glass);
  backdrop-filter: blur(14px);
  display: flex;
  flex-direction: column;
}

.search-section {
  border-bottom: 1px solid var(--color-border);
}

.account-selector :deep(.v-field),
.search-input :deep(.v-field) {
  background: var(--color-surface-muted) !important;
  border-radius: 12px !important;
}

.list-root {
  background: transparent !important;
}

.conversation-item {
  padding: 12px !important;
  transition: all 0.2s ease;
  border: 1px solid transparent !important;
}

.conversation-item:hover {
  background: var(--color-primary-soft) !important;
}

.item-active {
  background: var(--color-primary-soft) !important;
  border-color: var(--color-primary-soft-strong) !important;
  box-shadow: var(--shadow-sm);
}

.avatar-border {
  border: 2px solid var(--color-canvas);
  box-shadow: 0 0 0 1px var(--color-border);
}

.unread-dot-badge {
  position: absolute;
  top: 0;
  right: 0;
  width: 12px;
  height: 12px;
  background: var(--color-primary);
  border: 2px solid white;
  border-radius: 50%;
  z-index: 2;
}

.scale-80 {
  transform: scale(0.85);
  transform-origin: right center;
}
</style>
