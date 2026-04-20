<template>
  <div class="chat-contact-panel d-flex flex-column">
    <div class="pa-3 d-flex align-center chat-contact-panel__header">
      <v-icon icon="mdi-account-details" class="mr-2" />
      <span class="font-weight-medium">ThÃ´ng tin khÃ¡ch hÃ ng</span>
      <v-spacer />
      <v-btn icon size="small" variant="text" @click="$emit('close')">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </div>

    <div class="pa-3">
      <div v-if="props.contact" class="d-flex align-center mb-3 ga-2">
        <v-chip
          :color="scoreColor(props.contact.leadScore)"
          size="small"
          variant="tonal"
          prepend-icon="mdi-star"
        >
          {{ props.contact.leadScore ?? 0 }} Ä‘iá»ƒm
        </v-chip>
        <span v-if="props.contact.lastActivity" class="text-caption text-grey">
          {{ relativeTime(props.contact.lastActivity) }}
        </span>
      </div>

      <v-text-field v-model="form.fullName" label="Há» tÃªn" density="compact" variant="outlined" class="mb-2" hide-details />
      <v-text-field v-model="form.phone" label="Sá»‘ Ä‘iá»‡n thoáº¡i" density="compact" variant="outlined" class="mb-2" hide-details />
      <v-text-field v-model="form.email" label="Email" type="email" density="compact" variant="outlined" class="mb-2" hide-details />

      <v-select v-model="form.source" label="Nguá»“n" :items="SOURCE_OPTIONS" item-title="text" item-value="value"
        density="compact" variant="outlined" clearable class="mb-2" hide-details />

      <v-select v-model="form.status" label="Tráº¡ng thÃ¡i" :items="STATUS_OPTIONS" item-title="text" item-value="value"
        density="compact" variant="outlined" clearable class="mb-2" hide-details />

      <v-text-field v-model="form.firstContactDate" label="NgÃ y tiáº¿p nháº­n" type="date"
        density="compact" variant="outlined" class="mb-2" hide-details />

      <v-text-field v-model="form.nextAppointmentDate" label="Háº¹n tÃ¡i khÃ¡m" type="date"
        density="compact" variant="outlined" class="mb-2" hide-details />

      <v-combobox v-model="form.tags" label="Tags" multiple chips closable-chips
        density="compact" variant="outlined" class="mb-2" hide-details />

      <v-textarea v-model="form.notes" label="Ghi chÃº" rows="2" auto-grow
        density="compact" variant="outlined" class="mb-3" hide-details />

      <v-btn color="primary" block :loading="saving" @click="saveContact">LÆ°u thÃ´ng tin</v-btn>

      <v-alert v-if="saveSuccess" type="success" density="compact" class="mt-2" closable @click:close="saveSuccess = false">
        ÄÃ£ lÆ°u thÃ nh cÃ´ng!
      </v-alert>
      <v-alert v-if="saveError" type="error" density="compact" class="mt-2" closable @click:close="saveError = false">
        LÆ°u tháº¥t báº¡i, thá»­ láº¡i!
      </v-alert>

      <AiSummaryCard :summary="aiSummary" :loading="aiSummaryLoading" @refresh="$emit('refresh-ai-summary')" />

      <v-card variant="outlined" class="mb-3">
        <v-card-title class="d-flex align-center text-body-1">
          <v-icon class="mr-2">mdi-chart-bell-curve-cumulative</v-icon>
          Cáº£m xÃºc khÃ¡ch hÃ ng
          <v-spacer />
          <v-btn size="small" variant="text" :loading="aiSentimentLoading" @click="$emit('refresh-ai-sentiment')">LÃ m má»›i</v-btn>
        </v-card-title>
        <v-card-text>
          <AiSentimentBadge :sentiment="aiSentiment" />
          <div v-if="aiSentiment?.reason" class="text-body-2 mt-2">{{ aiSentiment.reason }}</div>
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
  aiSentiment: AiSentiment | null;
  aiSentimentLoading: boolean;
}>();

const emit = defineEmits<{ close: []; saved: []; 'refresh-ai-summary': []; 'refresh-ai-sentiment': [] }>();

const {
  form, saving, saveSuccess, saveError,
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
  if (days === 0) return 'HÃ´m nay';
  if (days === 1) return 'HÃ´m qua';
  return `${days} ngÃ y trÆ°á»›c`;
}
</script>

<style scoped>
.chat-contact-panel {
  width: 320px;
  height: 100%;
  overflow-y: auto;
  flex-shrink: 0;
  border-left: 1px solid var(--color-border);
  background: var(--color-surface-glass);
  backdrop-filter: blur(14px);
}

.chat-contact-panel__header {
  border-bottom: 1px solid var(--color-border);
}
</style>
