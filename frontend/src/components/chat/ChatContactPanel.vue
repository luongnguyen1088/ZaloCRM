<template>
  <div class="chat-contact-panel d-flex flex-column">
    <div class="pa-3 d-flex align-center chat-contact-panel__header">
      <v-icon icon="mdi-account-details" class="mr-2" />
      <span class="font-weight-medium">Thông tin khách hàng</span>
      <v-spacer />
      <v-btn icon size="small" variant="text" @click="$emit('close')">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </div>

    <div class="pa-4 overflow-y-auto flex-grow-1">
      <div v-if="props.contact" class="d-flex align-center mb-5 ga-2">
        <v-avatar size="64" class="avatar-glow mr-2">
          <v-img :src="props.contact.avatarUrl || ''">
            <template #placeholder>
              <v-icon size="32">mdi-account</v-icon>
            </template>
          </v-img>
        </v-avatar>
        <div>
          <div class="text-h6 font-weight-bold mb-1">{{ props.contact.fullName || 'Khách hàng' }}</div>
          <div class="d-flex align-center ga-2">
            <v-chip
              :color="scoreColor(props.contact.leadScore)"
              size="x-small"
              variant="flat"
              prepend-icon="mdi-star"
            >
              {{ props.contact.leadScore ?? 0 }} điểm
            </v-chip>
            <span v-if="props.contact.lastActivity" class="text-caption text-grey">
              {{ relativeTime(props.contact.lastActivity) }}
            </span>
          </div>
        </div>
      </div>

      <v-divider class="mb-4" />

      <div class="section-label mb-3">Thông tin liên hệ</div>
      <div class="field-group mb-4">
        <v-text-field v-model="form.fullName" label="Họ tên" density="compact" variant="filled" class="mb-2" hide-details flat />
        <v-text-field v-model="form.phone" label="Số điện thoại" density="compact" variant="filled" class="mb-2" hide-details flat />
        <v-text-field v-model="form.email" label="Email" type="email" density="compact" variant="filled" class="mb-2" hide-details flat />
      </div>

      <div class="section-label mb-3">Phân loại & Trạng thái</div>
      <div class="field-group mb-4">
        <v-select v-model="form.source" label="Nguồn khách" :items="SOURCE_OPTIONS" item-title="text" item-value="value"
          density="compact" variant="filled" clearable class="mb-2" hide-details flat />

        <v-select v-model="form.status" label="Trạng thái" :items="STATUS_OPTIONS" item-title="text" item-value="value"
          density="compact" variant="filled" clearable class="mb-2" hide-details flat />
      </div>

      <div class="section-label mb-3">Ghi chú & Tags</div>
      <div class="field-group mb-4">
        <v-combobox v-model="form.tags" label="Thêm thẻ (Tags)" multiple chips closable-chips
          density="compact" variant="filled" class="mb-2" hide-details flat />

        <v-textarea v-model="form.notes" label="Ghi chú nhanh" rows="2" auto-grow
          density="compact" variant="filled" class="mb-3" hide-details flat />
      </div>

      <v-btn color="primary" block variant="flat" :loading="saving" @click="saveContact" class="mb-6 rounded-xl">
        Cập nhật thông tin
      </v-btn>

      <v-divider class="mb-4" />

      <AiSummaryCard 
        :summary="aiSummary" 
        :loading="aiSummaryLoading" 
        :error="aiSummaryError"
        @refresh="$emit('refresh-ai-summary')" 
        class="mb-4" 
      />

      <v-card variant="flat" class="sentiment-card mb-4 rounded-xl">
        <v-card-title class="d-flex align-center text-subtitle-2 font-weight-bold pa-3">
          <v-icon size="18" class="mr-2" color="primary">mdi-brain</v-icon>
          Tâm trạng khách hàng
          <v-spacer />
          <v-btn icon="mdi-refresh" size="x-small" variant="text" :loading="aiSentimentLoading" @click="$emit('refresh-ai-sentiment')" />
        </v-card-title>
        <v-card-text class="pa-3 pt-0">
          <div v-if="aiSentiment" class="animate__animated animate__fadeIn">
            <AiSentimentBadge :sentiment="aiSentiment" />
            <div v-if="aiSentiment?.reason" class="text-caption mt-2 text-grey-darken-1 line-height-1-4">
              {{ aiSentiment.reason }}
            </div>
          </div>
          <div v-else class="text-center py-2">
            <div v-if="aiSentimentError" class="text-caption text-error mb-2 px-2">
              <v-icon size="14" color="error" class="mr-1">mdi-alert-circle-outline</v-icon>
              {{ aiSentimentError }}
            </div>
            <div v-else class="text-caption text-grey mb-2">Chưa có dữ liệu tâm trạng</div>
            <v-btn
              variant="tonal"
              size="small"
              color="primary"
              rounded="pill"
              prepend-icon="mdi-brain"
              :loading="aiSentimentLoading"
              @click="$emit('refresh-ai-sentiment')"
            >
              Phân tích ngay
            </v-btn>
          </div>
        </v-card-text>
      </v-card>

      <ChatAppointments
        v-if="props.contactId"
        :contact-id="props.contactId"
        :appointments="contactAppointments"
        @refresh="reloadAppointments"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { SOURCE_OPTIONS, STATUS_OPTIONS } from '@/composables/use-contacts';
import type { Contact } from '@/composables/use-contacts';
import type { AiSentiment } from '@/composables/use-chat';
import { useChatContactPanel } from '@/composables/use-chat-contact-panel';
import ChatAppointments from './ChatAppointments.vue';
import AiSummaryCard from '@/components/ai/ai-summary-card.vue';
import AiSentimentBadge from '@/components/ai/ai-sentiment-badge.vue';

const props = defineProps<{
  contactId: string | null;
  contact: Contact | null;
  aiSummary: string;
  aiSummaryLoading: boolean;
  aiSummaryError: string;
  aiSentiment: AiSentiment | null;
  aiSentimentLoading: boolean;
  aiSentimentError: string;
}>();

const emit = defineEmits<{ close: []; saved: []; 'refresh-ai-summary': []; 'refresh-ai-sentiment': [] }>();

const {
  form, saving,
  contactAppointments,
  saveContact, reloadAppointments,
} = useChatContactPanel(
  () => props.contactId,
  () => props.contact,
  () => emit('saved'),
);

function scoreColor(score: number) {
  if (score >= 70) return 'success';
  if (score >= 40) return 'orange';
  return 'error';
}

function relativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Hôm nay';
  if (days === 1) return 'Hôm qua';
  return `${days} ngày trước`;
}
</script>

<style scoped>
.chat-contact-panel {
  width: 320px;
  height: 100%;
  flex-shrink: 0;
  border-left: 1px solid var(--color-border);
  background: var(--color-surface-glass);
  backdrop-filter: blur(14px);
}

.chat-contact-panel__header {
  border-bottom: 1px solid var(--color-border);
  height: 64px;
}

.section-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-primary);
  opacity: 0.8;
}

.field-group {
  background: var(--color-surface-muted);
  border-radius: 16px;
  padding: 8px;
  border: 1px solid var(--color-border);
}

.avatar-glow {
  box-shadow: 0 0 0 4px var(--color-primary-soft);
  border: 2px solid white;
}

.sentiment-card {
  background: var(--color-surface-muted) !important;
  border: 1px solid var(--color-border) !important;
}
.line-height-1-4 {
  line-height: 1.4 !important;
}
</style>
