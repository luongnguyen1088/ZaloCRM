<template>
  <div class="integrations-component">
    <div class="d-flex align-center justify-space-between mb-8">
      <div>
        <h2 class="text-h5 font-weight-bold mb-1">Tích hợp hệ thống</h2>
        <p class="text-body-2 text-medium-emphasis">Kết nối Claro với các công cụ ngoại vi để tự động hóa quy trình</p>
      </div>
      <v-btn
        color="primary"
        variant="flat"
        rounded="pill"
        prepend-icon="mdi-plus"
        class="text-none px-6 action-btn"
        @click="openCreate"
        elevation="0"
      >
        Thêm tích hợp mới
      </v-btn>
    </div>

    <!-- Error Alert -->
    <v-fade-transition>
      <v-alert
        v-if="error"
        type="error"
        variant="tonal"
        class="mb-6 rounded-xl"
        closable
        @click:close="error = ''"
      >
        {{ error }}
      </v-alert>
    </v-fade-transition>

    <!-- Integrations Grid -->
    <v-row v-if="integrations.length > 0">
      <v-col v-for="item in integrations" :key="item.id" cols="12" md="6" lg="4">
        <v-card variant="outlined" class="integration-card-modern rounded-xl overflow-hidden h-100">
          <div class="card-accent" :style="{ background: typeColor(item.type) }"></div>
          
          <v-card-text class="pa-6">
            <div class="d-flex justify-space-between align-start mb-4">
              <div class="type-icon-box rounded-lg" :style="{ background: typeColor(item.type) + '15' }">
                <v-icon :color="typeColor(item.type)" size="28">{{ typeIcon(item.type) }}</v-icon>
              </div>
              <v-chip
                :color="item.enabled ? 'success' : 'grey'"
                size="x-small"
                variant="flat"
                class="font-weight-black uppercase px-2"
              >
                {{ item.enabled ? 'Active' : 'Disabled' }}
              </v-chip>
            </div>

            <div class="mb-4">
              <h3 class="text-subtitle-1 font-weight-bold mb-0 text-truncate">{{ item.name || typeLabel(item.type) }}</h3>
              <p class="text-caption text-medium-emphasis">{{ typeLabel(item.type) }}</p>
            </div>

            <v-divider class="mb-4 opacity-10" />

            <div class="d-flex align-center text-caption mb-4">
              <v-icon start size="14" color="medium-emphasis">mdi-sync</v-icon>
              <span class="text-medium-emphasis mr-2">Đồng bộ cuối:</span>
              <span class="font-weight-bold">{{ item.lastSyncAt ? formatDate(item.lastSyncAt) : '---' }}</span>
            </div>

            <div v-if="item.syncLogs?.length" class="mini-logs pa-2 rounded-lg bg-surface-muted">
              <div class="d-flex ga-1 overflow-hidden">
                <v-tooltip v-for="log in item.syncLogs.slice(0, 6)" :key="log.id" location="top">
                  <template #activator="{ props }">
                    <div
                      v-bind="props"
                      class="status-dot"
                      :class="log.status"
                    ></div>
                  </template>
                  <span>{{ log.status }} - {{ formatDate(log.createdAt) }} ({{ log.recordCount }} records)</span>
                </v-tooltip>
              </div>
            </div>
          </v-card-text>

          <v-card-actions class="pa-4 pt-0">
            <v-btn
              variant="tonal"
              size="small"
              prepend-icon="mdi-sync"
              class="flex-grow-1 text-none font-weight-bold"
              rounded="lg"
              :loading="syncing === item.id"
              @click="handleSync(item.id)"
            >
              Đồng bộ
            </v-btn>
            <v-btn icon="mdi-cog-outline" size="small" variant="text" color="medium-emphasis" @click="openEdit(item)" />
            <v-btn icon="mdi-trash-can-outline" size="small" variant="text" color="error" @click="confirmDelete(item)" />
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Empty State -->
    <v-card v-else-if="!loading" variant="flat" class="empty-state-card text-center pa-12 rounded-xl border-dashed">
      <v-icon size="64" color="primary-lighten-4" class="mb-4">mdi-transit-connection-variant</v-icon>
      <h3 class="text-h6 font-weight-bold mb-2">Chưa có tích hợp nào</h3>
      <p class="text-body-2 text-medium-emphasis mb-8 mx-auto" style="max-width: 400px">
        Kết nối với Google Sheets, Telegram hoặc các Webhook để đồng bộ dữ liệu khách hàng tự động.
      </p>
      <v-btn
        color="primary"
        variant="tonal"
        rounded="pill"
        prepend-icon="mdi-plus"
        class="text-none px-8"
        @click="openCreate"
      >
        Tạo tích hợp đầu tiên
      </v-btn>
    </v-card>

    <!-- Loading State -->
    <div v-if="loading" class="d-flex justify-center pa-12">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <!-- Edit/Create Dialog -->
    <v-dialog v-model="showDialog" max-width="560" transition="dialog-bottom-transition" persistent>
      <v-card class="rounded-xl pa-2 dialog-glass">
        <v-card-title class="pa-4 d-flex align-center">
          <span class="text-h6 font-weight-bold">{{ editing ? 'Cấu hình Tích hợp' : 'Thêm Tích hợp mới' }}</span>
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" density="comfortable" @click="showDialog = false" />
        </v-card-title>

        <v-card-text class="pa-4">
          <v-select
            v-model="form.type"
            :items="typeOptions"
            item-title="label"
            item-value="value"
            label="Loại kết nối"
            variant="outlined"
            rounded="lg"
            :disabled="editing"
            class="mb-4"
          >
            <template #item="{ props, item }">
              <v-list-item v-bind="props" :prepend-icon="typeIcon(item.value)" />
            </template>
          </v-select>

          <v-text-field
            v-model="form.name"
            label="Tên tích hợp"
            variant="outlined"
            rounded="lg"
            placeholder="VD: Marketing Sheets"
            class="mb-4"
          />

          <v-switch v-model="form.enabled" label="Kích hoạt tích hợp" color="success" hide-details inset class="mb-6 px-2" />

          <v-divider class="mb-6 opacity-10" />

          <!-- Dynamic Instructions -->
          <v-alert variant="tonal" color="primary" density="compact" class="mb-6 rounded-lg text-caption" icon="mdi-information-outline">
            <div v-if="form.type === 'google_sheets'">Tạo Google Sheet, lấy ID từ URL. Cấp quyền truy cập cho API Key hoặc kết nối OAuth.</div>
            <div v-else-if="form.type === 'telegram'">Dùng @BotFather lấy Token. Dùng @userinfobot lấy Chat ID.</div>
            <div v-else-if="form.type === 'n8n' || form.type === 'zapier'">Tạo Webhook node trong {{ form.type === 'n8n' ? 'n8n' : 'Zapier' }} và dán URL vào đây.</div>
          </v-alert>

          <!-- Config Fields -->
          <div v-if="form.type === 'google_sheets'">
             <v-text-field v-model="form.config.spreadsheetId" label="Spreadsheet ID *" variant="outlined" rounded="lg" class="mb-4" />
             <v-text-field v-model="form.config.sheetName" label="Tên Sheet (VD: Sheet1)" variant="outlined" rounded="lg" class="mb-4" />
             <v-text-field v-model="form.config.apiKey" label="API Key (Nếu không dùng OAuth)" type="password" variant="outlined" rounded="lg" />
          </div>

          <div v-else-if="form.type === 'telegram'">
            <v-text-field v-model="form.config.botToken" label="Bot Token *" type="password" variant="outlined" rounded="lg" class="mb-4" />
            <v-text-field v-model="form.config.chatId" label="Chat ID / Group ID *" variant="outlined" rounded="lg" />
          </div>

          <div v-else-if="form.type === 'zapier' || form.type === 'n8n'">
            <v-text-field v-model="form.config.webhookUrl" label="Webhook URL *" variant="outlined" rounded="lg" />
          </div>
          
          <v-alert v-if="dialogError" type="error" variant="tonal" density="compact" class="mt-4 rounded-lg">{{ dialogError }}</v-alert>
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="showDialog = false">Hủy</v-btn>
          <v-btn color="primary" variant="flat" class="px-8 action-btn" rounded="lg" :loading="saving" @click="handleSave">
            {{ editing ? 'Lưu thay đổi' : 'Tạo ngay' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirm -->
    <v-dialog v-model="showDelete" max-width="400">
      <v-card class="rounded-xl pa-2 dialog-glass">
        <v-card-title class="font-weight-bold">Xác nhận xóa</v-card-title>
        <v-card-text>Xóa tích hợp <strong>"{{ selectedItem?.name }}"</strong>? Dữ liệu sẽ không còn được đồng bộ.</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showDelete = false">Đóng</v-btn>
          <v-btn color="error" variant="flat" class="px-6 action-btn" rounded="lg" :loading="saving" @click="handleDelete">Xóa</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { api } from '@/api';
import { GOOGLE_CLIENT_ID, hasGoogleClientId } from '@/config/google';

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
const connections = ref<any[]>([]);
const linkingGoogle = ref(false);
const unlinkingGoogle = ref(false);

const spreadsheetOptions = ref<any[]>([]);
const loadingSpreadsheets = ref(false);
const sheetNameOptions = ref<string[]>([]);
const loadingSheetNames = ref(false);

const isGoogleLinked = computed(() => connections.value.some(c => c.type === 'google'));

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
  { label: 'n8n Workflow', value: 'n8n' },
  { label: 'Zapier Webhook', value: 'zapier' },
  { label: 'Telegram Bot', value: 'telegram' },
];

function typeIcon(type: string) {
  const map: Record<string, string> = {
    google_sheets: 'mdi-google-spreadsheet',
    telegram: 'mdi-send',
    zapier: 'mdi-lightning-bolt',
    n8n: 'mdi-lan',
  };
  return map[type] ?? 'mdi-connection';
}

function typeColor(type: string) {
  const map: Record<string, string> = {
    google_sheets: '#0F9D58',
    telegram: '#0088cc',
    zapier: '#FF4A00',
    n8n: '#FF6D5A',
  };
  return map[type] ?? '#9e9e9e';
}

function typeLabel(type: string) {
  return typeOptions.find((t) => t.value === type)?.label ?? type;
}

function formatDate(date: string) {
  return new Date(date).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
  });
}

async function fetchIntegrations() {
  loading.value = true;
  try {
    const { data } = await api.get('/integrations');
    integrations.value = data.integrations;
    connections.value = data.connections || [];
  } catch (err: any) {
    error.value = 'Không thể tải danh sách tích hợp';
  } finally {
    loading.value = false;
  }
}

async function linkGoogleAccount() {
  if (!hasGoogleClientId()) {
    dialogError.value = 'Thiếu VITE_GOOGLE_CLIENT_ID.';
    return;
  }
  const google = (window as any).google;
  if (!google?.accounts?.oauth2) return;

  const client = google.accounts.oauth2.initCodeClient({
    client_id: GOOGLE_CLIENT_ID,
    scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/userinfo.email',
    ux_mode: 'popup',
    callback: async (response: any) => {
      if (response.code) {
        linkingGoogle.value = true;
        try {
          await api.post('/integrations/google/callback', { code: response.code });
          await fetchIntegrations();
        } catch (err: any) {
          dialogError.value = 'Lỗi kết nối Google: ' + (err.response?.data?.error || err.message);
        } finally {
          linkingGoogle.value = false;
        }
      }
    },
  });
  client.requestCode();
}

async function unlinkGoogle() {
  if (!confirm('Hủy kết nối tài khoản Google?')) return;
  unlinkingGoogle.value = true;
  try {
    await api.delete('/integrations/google/connection');
    await fetchIntegrations();
  } catch (err: any) {
    dialogError.value = 'Lỗi khi hủy kết nối';
  } finally {
    unlinkingGoogle.value = false;
  }
}

async function fetchSpreadsheets() {
  if (!isGoogleLinked.value) return;
  loadingSpreadsheets.value = true;
  try {
    const { data } = await api.get('/integrations/google/spreadsheets');
    spreadsheetOptions.value = data;
  } catch (err: any) {
    dialogError.value = 'Không thể tải danh sách Sheets';
  } finally {
    loadingSpreadsheets.value = false;
  }
}

async function fetchSheetNames(spreadsheetId: string) {
  if (!isGoogleLinked.value || !spreadsheetId) return;
  loadingSheetNames.value = true;
  try {
    const { data } = await api.get(`/integrations/google/spreadsheets/${spreadsheetId}/sheets`);
    sheetNameOptions.value = data;
  } catch (err: any) {
    dialogError.value = 'Không thể tải danh sách bảng';
  } finally {
    loadingSheetNames.value = false;
  }
}

watch(() => form.value.type, (newType) => {
  if (showDialog.value && newType === 'google_sheets' && isGoogleLinked.value) {
    fetchSpreadsheets();
  }
});

watch(() => form.value.config.spreadsheetId, (newId) => {
  if (form.value.type === 'google_sheets' && isGoogleLinked.value && newId) {
    fetchSheetNames(newId);
  }
});

function openCreate() {
  editing.value = false;
  form.value = { type: 'google_sheets', name: '', enabled: true, config: {} };
  dialogError.value = '';
  showDialog.value = true;
  if (isGoogleLinked.value) fetchSpreadsheets();
}

function openEdit(item: Integration) {
  editing.value = true;
  selectedItem.value = item;
  form.value = { type: item.type, name: item.name, enabled: item.enabled, config: { ...item.config } };
  dialogError.value = '';
  showDialog.value = true;
  if (item.type === 'google_sheets' && isGoogleLinked.value) {
    fetchSpreadsheets();
    if (item.config?.spreadsheetId) fetchSheetNames(item.config.spreadsheetId);
  }
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
      await api.put(`/integrations/${selectedItem.value.id}`, form.value);
    } else {
      await api.post('/integrations', form.value);
    }
    showDialog.value = false;
    await fetchIntegrations();
  } catch (err: any) {
    dialogError.value = err.response?.data?.error || 'Lỗi khi lưu';
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
    error.value = 'Lỗi khi xóa';
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
    error.value = 'Lỗi đồng bộ';
  } finally {
    syncing.value = null;
  }
}

onMounted(fetchIntegrations);
</script>

<style scoped>
.integration-card-modern {
  background: var(--color-surface) !important;
  border: 1px solid var(--color-border) !important;
  position: relative;
  transition: all 0.3s var(--liquid-ease);
}

.integration-card-modern:hover {
  border-color: var(--color-primary-soft-strong) !important;
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}

.card-accent {
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
}

.type-icon-box {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mini-logs {
  border: 1px solid var(--color-border);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.status-dot.success { background: #10B981; }
.status-dot.error { background: #EF4444; }
.status-dot.warning { background: #F59E0B; }

.empty-state-card {
  background: var(--color-surface-glass);
  border: 2px dashed var(--color-border-strong) !important;
}

.action-btn {
  transition: all 0.3s ease;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--glow-brand);
}

.dialog-glass {
  background: rgba(var(--v-theme-surface), 0.9) !important;
  backdrop-filter: blur(24px);
}

.uppercase { text-transform: uppercase; }
</style>
