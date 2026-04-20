<template>
  <v-dialog :model-value="modelValue" max-width="520" @update:model-value="$emit('update:modelValue', $event)">
    <v-card>
      <v-card-title>Cấu hình AI</v-card-title>
      <v-card-text>
        <v-progress-linear v-if="loadingProviders" indeterminate class="mb-4" />
        <v-select v-model="local.provider" :items="providerItems" label="Provider" class="mb-3" :disabled="loadingProviders" @update:model-value="onProviderChange" />
        <v-select v-model="local.model" :items="modelOptions" label="Model" class="mb-3" :disabled="loadingProviders" />
        
        <v-text-field 
          v-model="local.apiKey" 
          label="API Key" 
          type="password" 
          :placeholder="hasCurrentKey ? '••••••••••••' : 'Nhập API Key mới'"
          hint="D�n API Key t? nh� cung c?p v�o d�y. N?u b? tr?ng s? d�ng c?u h�nh hi?n t?i."
          persistent-hint
          variant="outlined" 
          class="mb-3" 
        />

        <v-text-field v-model.number="local.maxDaily" type="number" label="Quota mỗi ngày" :min="1" :rules="[v => v >= 1 || 'Tối thiểu 1']" class="mb-3" />
        <v-switch v-model="local.enabled" label="Bật AI" inset color="primary" />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="$emit('update:modelValue', false)">Đóng</v-btn>
        <v-btn color="primary" :loading="loading" @click="$emit('save', local)">Lưu</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, computed, watch } from 'vue';
import { api } from '@/api';

type ProviderModel = { title: string; value: string };
type ProviderInfo = { id: string; name: string; models: ProviderModel[] };

const props = defineProps<{
  modelValue: boolean;
  loading: boolean;
  config: { 
    provider: string; 
    model: string; 
    maxDaily: number; 
    enabled: boolean;
    hasAnthropicKey?: boolean;
    hasGeminiKey?: boolean;
    hasOpenRouterKey?: boolean;
  };
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  save: [value: { provider: string; model: string; maxDaily: number; enabled: boolean; apiKey?: string }];
}>();

const providers = ref<ProviderInfo[]>([]);
const loadingProviders = ref(false);

const hasCurrentKey = computed(() => {
  if (local.provider === 'anthropic') return props.config.hasAnthropicKey;
  if (local.provider === 'gemini') return props.config.hasGeminiKey;
  if (local.provider === 'openrouter') return props.config.hasOpenRouterKey;
  return false;
});

/* Dropdown items derived from API data */
const providerItems = computed(() => providers.value.map((p) => ({ title: p.name, value: p.id })));
const modelOptions = computed(() => {
  const found = providers.value.find((p) => p.id === local.provider);
  return found?.models ?? [];
});

const local = reactive({ provider: 'anthropic', model: '', maxDaily: 500, enabled: true, apiKey: '' });

/* When provider changes, auto-select first model if current is invalid */
function onProviderChange() {
  const valid = modelOptions.value.some((m) => m.value === local.model);
  if (!valid) local.model = modelOptions.value[0]?.value ?? '';
}

/* Fetch available providers from backend */
async function fetchProviders() {
  loadingProviders.value = true;
  try {
    const res = await api.get('/ai/providers');
    providers.value = res.data;
  } catch {
    providers.value = [];
  } finally {
    loadingProviders.value = false;
  }
}

/* Sync config prop → local state ONLY when dialog is newly opened */
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    local.provider = props.config.provider;
    local.model = props.config.model;
    local.maxDaily = props.config.maxDaily;
    local.enabled = props.config.enabled;
    local.apiKey = ''; // Always reset password field on open
    fetchProviders();
  }
});
</script>
