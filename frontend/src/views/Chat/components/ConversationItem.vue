
<template>
  <v-list-item
    :active="active"
    class="conversation-item mb-1 mx-2"
    :class="{ 'item-active': active, 'item-unread': conv.unreadCount > 0 && !active }"
    @click="$emit('select', conv.id)"
    rounded="xl"
  >
    <template #prepend>
      <div class="avatar-wrapper mr-3">
        <v-avatar size="48" class="avatar-main">
          <v-img v-if="conv.contact?.avatarUrl" :src="conv.contact.avatarUrl || ''" />
          <v-icon v-else :icon="conv.threadType === 'group' ? 'mdi-account-group' : 'mdi-account'" />
        </v-avatar>
        
        <!-- Zalo Account Badge -->
        <v-avatar size="20" class="account-badge" color="surface">
          <v-img v-if="conv.zaloAccount?.avatarUrl" :src="conv.zaloAccount.avatarUrl" />
          <v-icon v-else size="12" color="primary">mdi-zalo</v-icon>
          <v-tooltip activator="parent" location="bottom">
            {{ conv.zaloAccount?.displayName || 'Zalo Account' }}
          </v-tooltip>
        </v-avatar>
      </div>
    </template>

    <v-list-item-title class="d-flex align-center">
      <span class="text-truncate font-weight-bold" :class="{ 'text-primary': conv.unreadCount > 0 }">
        {{ conv.contact?.fullName || 'Khách hàng' }}
      </span>
      <v-spacer />
      <span class="text-caption text-grey-darken-1">{{ formatTime(conv.lastMessageAt) }}</span>
    </v-list-item-title>

    <v-list-item-subtitle class="d-flex align-center mt-1">
      <span class="text-truncate flex-grow-1" :class="{ 'text-high-emphasis font-weight-medium': conv.unreadCount > 0 }">
        {{ lastMessagePreview(conv) }}
      </span>
      <div class="d-flex align-center ml-2">
        <AiSentimentBadge v-if="sentiment" :sentiment="sentiment" class="sentiment-mini mr-1" />
        <v-badge
          v-if="conv.unreadCount > 0"
          :content="conv.unreadCount"
          color="primary"
          inline
          class="unread-pill"
        />
      </div>
    </v-list-item-subtitle>
  </v-list-item>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Conversation } from '../types';
import { formatTime, lastMessagePreview, parseSentiment } from '../utils';
import AiSentimentBadge from '@/components/ai/ai-sentiment-badge.vue';

const props = defineProps<{
  conv: Conversation;
  active: boolean;
}>();

defineEmits<{
  (e: 'select', id: string): void;
}>();

const sentiment = computed(() => parseSentiment(props.conv));
</script>

<style scoped>
.conversation-item {
  padding: 12px 16px !important;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid transparent !important;
  background: transparent !important;
}

.conversation-item:hover {
  background: var(--color-surface-muted) !important;
  transform: translateX(4px);
}

.item-active {
  background: var(--color-primary-soft) !important;
  border-color: var(--color-primary-soft-strong) !important;
  box-shadow: var(--shadow-sm);
}

.item-unread {
  background: var(--color-surface-elevated) !important;
}

.avatar-wrapper {
  position: relative;
}

.avatar-main {
  border: 2px solid var(--color-border);
  box-shadow: var(--shadow-sm);
}

.account-badge {
  position: absolute;
  bottom: -2px;
  right: -2px;
  border: 2px solid var(--color-surface-elevated);
  box-shadow: var(--shadow-xs);
}

.sentiment-mini {
  transform: scale(0.75);
  transform-origin: right center;
}

.unread-pill :deep(.v-badge__badge) {
  font-size: 10px;
  height: 18px;
  min-width: 18px;
  padding: 0 4px;
}
</style>
