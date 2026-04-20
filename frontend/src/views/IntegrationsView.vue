<template>
  <div class="integrations-shell">
    <div class="d-flex align-center mb-4">
      <h1 class="text-h4 integrations-title">
        <v-icon class="mr-2 integrations-title-icon">mdi-connection</v-icon>
        TÃ­ch há»£p
      </h1>
      <v-spacer />
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreate">ThÃªm tÃ­ch há»£p</v-btn>
    </div>

    <v-alert v-if="error" type="error" variant="tonal" class="mb-4" closable @click:close="error = ''">
      {{ error }}
    </v-alert>

    <v-row>
      <v-col v-for="item in integrations" :key="item.id" cols="12" md="6" lg="4">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon :color="typeColor(item.type)" class="mr-2">{{ typeIcon(item.type) }}</v-icon>
            {{ item.name || typeLabel(item.type) }}
            <v-spacer />
            <v-chip :color="item.enabled ? 'success' : 'default'" size="small" variant="flat">
              {{ item.enabled ? 'Báº­t' : 'Táº¯t' }}
            </v-chip>
          </v-card-title>

          <v-card-subtitle>{{ typeLabel(item.type) }}</v-card-subtitle>

          <v-card-text>
            <div class="text-body-2 mb-2">
              Äá»“ng bá»™ láº§n cuá»‘i: {{ item.lastSyncAt ? new Date(item.lastSyncAt).toLocaleString('vi-VN') : 'ChÆ°a cÃ³' }}
            </div>

            <div v-if="item.syncLogs?.length">
              <div class="text-caption text-medium-emphasis mb-1">Lá»‹ch sá»­ gáº§n Ä‘Ã¢y:</div>
              <v-chip
                v-for="log in item.syncLogs.slice(0, 3)"
                :key="log.id"
                :color="log.status === 'success' ? 'success' : log.status === 'partial' ? 'warning' : 'error'"
                size="x-small"
                variant="tonal"
                class="mr-1 mb-1"
              >
                {{ log.status }} ({{ log.recordCount }})
              </v-chip>
            </div>
          </v-card-text>

          <v-card-actions>
            <v-btn size="small" variant="text" prepend-icon="mdi-sync" :loading="syncing === item.id" @click="handleSync(item.id)">
              Äá»“ng bá»™
            </v-btn>
            <v-btn size="small" variant="text" prepend-icon="mdi-pencil" @click="openEdit(item)">Sá»­a</v-btn>
            <v-spacer />
            <v-btn size="small" variant="text" color="error" prepend-icon="mdi-delete" @click="confirmDelete(item)">XÃ³a</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <v-card v-if="!loading && integrations.length === 0" class="text-center pa-8">
      <v-icon size="64" color="grey">mdi-connection</v-icon>
      <div class="text-h6 mt-4">ChÆ°a cÃ³ tÃ­ch há»£p nÃ o</div>
      <div class="text-body-2 text-medium-emphasis mb-4">Káº¿t ná»‘i Google Sheets, Telegram, Facebook hoáº·c Zapier</div>
      <v-btn color="primary" @click="openCreate">ThÃªm tÃ­ch há»£p Ä‘áº§u tiÃªn</v-btn>
    </v-card>

    <v-dialog v-model="showDialog" max-width="520">
      <v-card>
        <v-card-title>{{ editing ? 'Chá»‰nh sá»­a tÃ­ch há»£p' : 'ThÃªm tÃ­ch há»£p' }}</v-card-title>
        <v-card-text>
          <v-select
            v-model="form.type"
            :items="typeOptions"
            item-title="label"
            item-value="value"
            label="Loáº¡i tÃ­ch há»£p *"
            :disabled="editing"
            class="mb-2"
          />
          <v-text-field v-model="form.name" label="TÃªn hiá»ƒn thá»‹" class="mb-2" />
          <v-switch v-model="form.enabled" label="Báº­t" color="success" class="mb-2" />

          <template v-if="form.type === 'google_sheets'">
            <v-text-field v-model="form.config.spreadsheetId" label="Spreadsheet ID *" class="mb-2" />
            <v-text-field v-model="form.config.apiKey" label="API Key *" type="password" class="mb-2" />
            <v-text-field v-model="form.config.sheetName" label="TÃªn sheet" placeholder="Contacts" />
          </template>

          <template v-if="form.type === 'telegram'">
            <v-text-field v-model="form.config.botToken" label="Bot Token *" type="password" class="mb-2" />
            <v-text-field v-model="form.config.chatId" label="Chat ID *" class="mb-2" />
          </template>

          <template v-if="form.type === 'facebook'">
            <v-text-field v-model="form.config.pageId" label="Page ID *" class="mb-2" />
            <v-text-field v-model="form.config.pageAccessToken" label="Page Access Token *" type="password" />
          </template>

          <template v-if="form.type === 'zapier'">
            <v-text-field v-model="form.config.webhookUrl" label="Webhook URL *" placeholder="https://hooks.zapier.com/..." />
          </template>

          <v-alert v-if="dialogError" type="error" density="compact" class="mt-2">{{ dialogError }}</v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="showDialog = false">Há»§y</v-btn>
          <v-btn color="primary" :loading="saving" @click="handleSave">{{ editing ? 'LÆ°u' : 'Táº¡o' }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showDelete" max-width="400">
      <v-card>
        <v-card-title>XÃ¡c nháº­n xÃ³a</v-card-title>
        <v-card-text>Báº¡n cÃ³ cháº¯c muá»‘n xÃ³a tÃ­ch há»£p "{{ selectedItem?.name }}"?</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="showDelete = false">Há»§y</v-btn>
          <v-btn color="error" :loading="saving" @click="handleDelete">XÃ³a</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '@/api';

interface SyncLog {
  id: string;
  status: string;
  recordCount: number;
  createdAt: string;
}

interface Integration {
  id: string;
  type: string;
  name: string;
  config: Record<string, any>;
  enabled: boolean;
  lastSyncAt: string | null;
  syncLogs: SyncLog[];
}

const integrations = ref<Integration[]>([]);
const loading = ref(false);
const error = ref('');
const saving = ref(false);
const syncing = ref<string | null>(null);
const dialogError = ref('');

const showDialog = ref(false);
const showDelete = ref(false);
const editing = ref(false);
const selectedItem = ref<Integration | null>(null);

const form = ref({
  type: 'google_sheets',
  name: '',
  enabled: true,
  config: {} as Record<string, any>,
});

const typeOptions = [
  { label: 'Google Sheets', value: 'google_sheets' },
  { label: 'Telegram Bot', value: 'telegram' },
  { label: 'Facebook', value: 'facebook' },
  { label: 'Zapier', value: 'zapier' },
];

function typeIcon(type: string) {
  const map: Record<string, string> = {
    google_sheets: 'mdi-google-spreadsheet',
    telegram: 'mdi-send',
    facebook: 'mdi-facebook',
    zapier: 'mdi-lightning-bolt',
  };
  return map[type] ?? 'mdi-connection';
}

function typeColor(type: string) {
  const map: Record<string, string> = {
    google_sheets: '#0F9D58',
    telegram: '#0088cc',
    facebook: '#1877F2',
    zapier: '#FF4A00',
  };
  return map[type] ?? 'secondary';
}

function typeLabel(type: string) {
  return typeOptions.find((t) => t.value === type)?.label ?? type;
}

async function fetchIntegrations() {
  loading.value = true;
  try {
    const { data } = await api.get('/integrations');
    integrations.value = data;
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Lá»—i táº£i danh sÃ¡ch tÃ­ch há»£p';
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  editing.value = false;
  selectedItem.value = null;
  form.value = { type: 'google_sheets', name: '', enabled: true, config: {} };
  dialogError.value = '';
  showDialog.value = true;
}

function openEdit(item: Integration) {
  editing.value = true;
  selectedItem.value = item;
  form.value = { type: item.type, name: item.name, enabled: item.enabled, config: { ...item.config } };
  dialogError.value = '';
  showDialog.value = true;
}

function confirmDelete(item: Integration) {
  selectedItem.value = item;
  showDelete.value = true;
}

async function handleSave() {
  saving.value = true;
  dialogError.value = '';
  try {
    if (editing.value && selectedItem.value) {
      await api.put(`/integrations/${selectedItem.value.id}`, {
        name: form.value.name,
        config: form.value.config,
        enabled: form.value.enabled,
      });
    } else {
      await api.post('/integrations', form.value);
    }
    showDialog.value = false;
    await fetchIntegrations();
  } catch (err: any) {
    dialogError.value = err.response?.data?.error || 'Lá»—i lÆ°u tÃ­ch há»£p';
  } finally {
    saving.value = false;
  }
}

async function handleDelete() {
  if (!selectedItem.value) return;
  saving.value = true;
  try {
    await api.delete(`/integrations/${selectedItem.value.id}`);
    showDelete.value = false;
    await fetchIntegrations();
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Lá»—i xÃ³a tÃ­ch há»£p';
  } finally {
    saving.value = false;
  }
}

async function handleSync(id: string) {
  syncing.value = id;
  try {
    await api.post(`/integrations/${id}/sync`);
    await fetchIntegrations();
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Lá»—i Ä‘á»“ng bá»™';
  } finally {
    syncing.value = null;
  }
}

onMounted(fetchIntegrations);
</script>

<style scoped>
.integrations-shell {
  color: var(--color-text);
}

.integrations-title {
  color: var(--color-text);
}

.integrations-title-icon {
  color: var(--color-primary);
}
</style>
