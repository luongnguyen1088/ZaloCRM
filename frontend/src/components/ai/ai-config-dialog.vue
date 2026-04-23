<template>
  <v-dialog :model-value="modelValue" max-width="520" @update:model-value="$emit('update:modelValue', $event)">
    <v-card>
      <v-card-title>Cấu hình AI</v-card-title>
      <v-card-text>
        <v-alert
          :type="config.platformKeyConfigured ? 'info' : 'warning'"
          variant="tonal"
          class="mb-4"
        >
          AI được quản lý bởi ZaloCRM. Người dùng không cần nhập API key riêng.
        </v-alert>

        <v-list density="compact" class="mb-4 rounded-lg border">
          <v-list-item title="Gói hiện tại" :subtitle="config.planName || 'Free'" />
          <v-list-item title="AI Tokens" :subtitle="`${config.remainingTokens ?? config.maxDaily}/${config.maxTokens ?? config.maxDaily} còn lại`" />
          <v-list-item title="Mô hình" :subtitle="`${config.provider} / ${config.model}`" />
        </v-list>

        <v-switch v-model="local.enabled" label="Bật AI cho workspace này" inset color="primary" />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="$emit('update:modelValue', false)">Đóng</v-btn>
        <v-btn color="primary" :loading="loading" @click="$emit('save', { enabled: local.enabled })">Lưu</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue';

const props = defineProps<{
  modelValue: boolean;
  loading: boolean;
  config: {
    provider: string;
    model: string;
    maxDaily: number;
    enabled: boolean;
    managed?: boolean;
    platformKeyConfigured?: boolean;
    planName?: string;
    usedTokens?: number;
    maxTokens?: number;
    remainingTokens?: number;
  };
}>();

defineEmits<{
  'update:modelValue': [value: boolean];
  save: [value: { enabled: boolean }];
}>();

const local = reactive({ enabled: true });

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    local.enabled = props.config.enabled;
  }
});
</script>
