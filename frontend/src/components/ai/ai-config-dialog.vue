<template>
  <v-dialog :model-value="modelValue" max-width="600" @update:model-value="$emit('update:modelValue', $event)">
    <v-card class="rounded-xl overflow-hidden">
      <v-toolbar color="primary" density="comfortable">
        <v-toolbar-title class="text-subtitle-1 font-weight-bold">Cấu hình AI Assistant</v-toolbar-title>
        <v-btn icon @click="$emit('update:modelValue', false)"><v-icon>mdi-close</v-icon></v-btn>
      </v-toolbar>

      <v-card-text class="pa-6">
        <v-alert
          :type="config.platformKeyConfigured ? 'info' : 'warning'"
          variant="tonal"
          class="mb-6 rounded-lg"
          density="compact"
        >
          AI được quản lý bởi ZaloCRM. Bạn không cần nhập API key riêng.
        </v-alert>

        <div class="section-label mb-2">Tầng 1: Quy tắc hệ thống (Mặc định)</div>
        <v-list density="compact" class="mb-6 rounded-lg border bg-grey-lighten-5">
          <v-list-item title="Gói & Mô hình" :subtitle="`${config.planName} - ${config.provider}/${config.model}`">
            <template #prepend><v-icon color="primary">mdi-shield-check-outline</v-icon></template>
          </v-list-item>
          <v-list-item title="Hạn mức" :subtitle="`${Math.floor((config.remainingTokens ?? 0) / 1500)} / ${Math.floor((config.maxTokens ?? 0) / 1500)} lượt phản hồi`" />
        </v-list>

        <div class="section-label mb-2">Tầng 2: Cá tính & Phong cách (Tùy chỉnh)</div>
        
        <v-select
          v-model="local.languagePolicy"
          :items="languageOptions"
          label="Chính sách ngôn ngữ"
          variant="outlined"
          density="comfortable"
          rounded="lg"
          class="mb-4"
          prepend-inner-icon="mdi-translate"
        />

        <v-textarea
          v-model="local.instructions"
          label="Chỉ dẫn hành vi (Instructions)"
          placeholder="Ví dụ: Luôn gọi khách là 'anh/chị', xưng là 'em'. Luôn sử dụng icon 🌸 và phong cách trẻ trung..."
          variant="outlined"
          rows="5"
          rounded="lg"
          hint="AI sẽ kết hợp chỉ dẫn này với quy tắc hệ thống để phản hồi."
          persistent-hint
          class="mb-6"
        >
          <template #prepend-inner>
            <v-icon color="primary" class="mt-1">mdi-robot-outline</v-icon>
          </template>
        </v-textarea>

        <v-divider class="mb-6" />

        <div class="d-flex align-center">
          <v-switch v-model="local.enabled" label="Kích hoạt AI cho không gian này" inset color="success" hide-details />
        </div>
      </v-card-text>

      <v-card-actions class="pa-6 pt-0">
        <v-spacer />
        <v-btn variant="text" @click="$emit('update:modelValue', false)" class="text-none">Đóng</v-btn>
        <v-btn 
          color="primary" 
          variant="flat"
          :loading="loading" 
          class="px-8 text-none"
          rounded="lg"
          @click="$emit('save', { 
            enabled: local.enabled, 
            instructions: local.instructions, 
            languagePolicy: local.languagePolicy 
          })"
        >Lưu cấu hình</v-btn>
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
    instructions?: string | null;
    languagePolicy?: string;
    managed?: boolean;
    platformKeyConfigured?: boolean;
    planName?: string;
    usedTokens?: number;
    maxTokens?: number;
    remainingTokens?: number;
  };
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  save: [value: { enabled: boolean; instructions: string | null; languagePolicy: string }];
}>();

const local = reactive({ 
  enabled: true, 
  instructions: '' as string | null, 
  languagePolicy: 'auto' 
});

const languageOptions = [
  { title: 'Tự động nhận diện (Khuyên dùng)', value: 'auto' },
  { title: 'Luôn dùng Tiếng Việt', value: 'vi' },
  { title: 'Luôn dùng Tiếng Anh', value: 'en' },
];

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    local.enabled = props.config.enabled;
    local.instructions = props.config.instructions || '';
    local.languagePolicy = props.config.languagePolicy || 'auto';
  }
});
</script>

<style scoped>
.section-label {
  font-size: 0.7rem;
  font-weight: 800;
  color: var(--color-primary);
  text-transform: uppercase;
  letter-spacing: 1px;
}
</style>
