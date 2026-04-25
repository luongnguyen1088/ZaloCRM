
<template>
  <div class="unified-list d-flex flex-column h-100">
    <!-- Header with Tabs/Filters -->
    <div class="list-header pa-4">
      <div class="d-flex align-center justify-space-between mb-4">
        <h2 class="text-h5 font-weight-black mb-0">Hội thoại</h2>
        <v-btn icon="mdi-plus" size="small" variant="tonal" color="primary" />
      </div>

      <v-text-field
        v-model="internalSearch"
        placeholder="Tìm tên khách hàng, nội dung..."
        prepend-inner-icon="mdi-magnify"
        variant="solo-filled"
        flat
        density="compact"
        hide-details
        clearable
        rounded="xl"
        class="search-bar mb-3"
      />

      <div class="filter-row d-flex ga-2 overflow-x-auto pb-1">
        <v-chip
          v-for="f in statusFilters"
          :key="f.value"
          size="small"
          :variant="activeStatus === f.value ? 'flat' : 'tonal'"
          :color="activeStatus === f.value ? 'primary' : 'secondary'"
          class="font-weight-bold"
          @click="$emit('update:status', f.value)"
        >
          {{ f.label }}
        </v-chip>
      </div>
    </div>

    <!-- Account Selector (Collapsible or compact) -->
    <div class="account-strip px-4 py-2">
      <v-select
        v-model="selectedAccount"
        :items="accounts"
        item-title="displayName"
        item-value="id"
        placeholder="Tất cả tài khoản Zalo"
        density="compact"
        variant="plain"
        hide-details
        clearable
        class="account-select"
        @update:model-value="$emit('filter-account', $event)"
      >
        <template #prepend-inner>
          <v-icon color="primary" size="18" class="mr-1">mdi-account-switch-outline</v-icon>
        </template>
      </v-select>
    </div>

    <!-- Scrollable List -->
    <v-list class="flex-grow-1 overflow-y-auto pa-0 list-root" density="compact">
      <div v-if="loading" class="pa-2">
        <v-skeleton-loader
          v-for="i in 6"
          :key="i"
          type="list-item-avatar-two-line"
          class="bg-transparent mb-1"
        />
      </div>

      <div v-if="conversations.length > 0" class="py-2">
        <ConversationItem
          v-for="conv in conversations"
          :key="conv.id"
          :conv="conv"
          :active="conv.id === selectedId"
          @select="$emit('select', $event)"
        />
      </div>

      <div v-else-if="!loading" class="empty-state pa-12 text-center">
        <v-avatar size="64" color="surface-muted" class="mb-4">
          <v-icon size="32" color="grey">mdi-chat-sleep-outline</v-icon>
        </v-avatar>
        <div class="text-grey-darken-1 font-weight-bold">Không có hội thoại</div>
        <div class="text-caption text-grey">Thử thay đổi bộ lọc hoặc tìm kiếm khác</div>
      </div>
    </v-list>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { Conversation, ZaloAccount } from '../types';
import ConversationItem from './ConversationItem.vue';

const props = defineProps<{
  conversations: Conversation[];
  selectedId: string | null;
  loading: boolean;
  search: string;
  accounts: ZaloAccount[];
  activeStatus: string;
}>();

const emit = defineEmits<{
  (e: 'select', id: string): void;
  (e: 'update:search', val: string): void;
  (e: 'update:status', val: string): void;
  (e: 'filter-account', id: string | null): void;
}>();

const internalSearch = ref(props.search);
watch(internalSearch, (val) => emit('update:search', val || ''));

const selectedAccount = ref<string | null>(null);

const statusFilters = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Chưa đọc', value: 'unread' },
  { label: 'Chưa rep', value: 'unreplied' },
  { label: 'AI suggest', value: 'ai_suggested' },
];
</script>

<style scoped>
.unified-list {
  background: var(--color-surface-glass);
  backdrop-filter: blur(14px);
  border-right: 1px solid var(--color-border);
}

.list-header {
  border-bottom: 1px solid var(--color-border);
}

.search-bar :deep(.v-field) {
  background: var(--color-surface-muted) !important;
}

.filter-row::-webkit-scrollbar {
  display: none;
}

.account-strip {
  border-bottom: 1px solid var(--color-border);
  background: rgba(var(--v-theme-primary), 0.02);
}

.account-select :deep(.v-field__input) {
  font-size: 0.85rem;
  font-weight: 700;
  padding-top: 4px;
  min-height: 32px;
}

.list-root {
  background: transparent !important;
}

.empty-state {
  opacity: 0.7;
}
</style>
