<template>
  <div class="integrations-page px-6 py-8">
    <!-- Header Section -->
    <header class="d-flex align-center justify-space-between mb-8">
      <div>
        <h1 class="text-h3 font-weight-black mb-2 gradient-text d-flex align-center">
          <v-icon size="40" class="mr-3 text-primary">mdi-transit-connection-variant</v-icon>
          Tích hợp
        </h1>
        <p class="text-subtitle-1 text-medium-emphasis">Kết nối ZaloCRM với các công cụ mạnh mẽ để tự động hóa quy trình làm việc của bạn.</p>
      </div>
      <v-btn
        color="primary"
        size="large"
        rounded="xl"
        prepend-icon="mdi-plus"
        elevation="4"
        class="add-btn font-weight-bold"
        @click="openCreate"
      >
        Thêm tích hợp mới
      </v-btn>
    </header>

    <!-- Error Alert -->
    <v-fade-transition>
      <v-alert
        v-if="error"
        type="error"
        variant="tonal"
        class="mb-6 rounded-xl border-error"
        closable
        @click:close="error = ''"
      >
        {{ error }}
      </v-alert>
    </v-fade-transition>

    <!-- Integrations Grid -->
    <v-row v-if="integrations.length > 0">
      <v-col v-for="item in integrations" :key="item.id" cols="12" md="6" lg="4">
        <v-card class="integration-card rounded-xl border overflow-hidden h-100">
          <!-- Card Header Decoration -->
          <div class="card-edge-accent" :style="{ background: typeColor(item.type) }"></div>
          
          <v-card-text class="pa-6">
            <div class="d-flex justify-space-between align-start mb-4">
              <div class="type-icon-wrapper rounded-lg" :style="{ background: typeColor(item.type) + '15' }">
                <v-icon :color="typeColor(item.type)" size="32">{{ typeIcon(item.type) }}</v-icon>
              </div>
              <v-chip
                :color="item.enabled ? 'success' : 'grey'"
                size="small"
                variant="flat"
                class="font-weight-bold px-3"
              >
                {{ item.enabled ? 'Đang hoạt động' : 'Đã tắt' }}
              </v-chip>
            </div>

            <div class="mb-4">
              <h3 class="text-h6 font-weight-bold mb-1">{{ item.name || typeLabel(item.type) }}</h3>
              <p class="text-caption text-medium-emphasis">{{ typeLabel(item.type) }}</p>
            </div>

            <v-divider class="mb-4 opacity-10" />

            <!-- Last Sync Status -->
            <div class="d-flex align-center text-body-2 mb-4">
              <v-icon start size="16" color="medium-emphasis">mdi-sync-circle</v-icon>
              <span class="text-medium-emphasis mr-2">Đồng bộ cuối:</span>
              <span class="font-weight-medium">{{ item.lastSyncAt ? formatDate(item.lastSyncAt) : 'Chưa có' }}</span>
            </div>

            <!-- Recent Logs -->
            <div v-if="item.syncLogs?.length" class="logs-section pa-3 rounded-lg bg-surface-muted border border-dashed">
              <div class="text-caption font-weight-bold mb-2 d-flex align-center">
                <v-icon start size="14">mdi-history</v-icon>
                Lịch sử gần đây
              </div>
              <div class="d-flex flex-wrap ga-1">
                <v-tooltip v-for="log in item.syncLogs.slice(0, 5)" :key="log.id" location="top">
                  <template #activator="{ props }">
                    <v-chip
                      v-bind="props"
                      :color="log.status === 'success' ? 'success' : log.status === 'partial' ? 'warning' : 'error'"
                      size="x-small"
                      variant="flat"
                      class="px-2"
                    >
                      {{ log.recordCount }}
                    </v-chip>
                  </template>
                  <span>{{ log.status }} - {{ formatDate(log.createdAt) }}</span>
                </v-tooltip>
              </div>
            </div>
          </v-card-text>

          <v-card-actions class="pa-4 pt-0">
            <v-btn
              variant="tonal"
              prepend-icon="mdi-sync"
              class="flex-grow-1"
              rounded="lg"
              :loading="syncing === item.id"
              @click="handleSync(item.id)"
            >
              Đồng bộ ngay
            </v-btn>
            <v-btn
              icon="mdi-pencil-outline"
              variant="text"
              color="medium-emphasis"
              @click="openEdit(item)"
            />
            <v-btn
              icon="mdi-delete-outline"
              variant="text"
              color="error"
              @click="confirmDelete(item)"
            />
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Empty State -->
    <v-card v-else-if="!loading" class="empty-state text-center pa-12 rounded-xl border border-dashed">
      <div class="empty-icon-container mb-6 mx-auto">
        <v-icon size="64" color="primary">mdi-connection</v-icon>
      </div>
      <h3 class="text-h5 font-weight-bold mb-2">Bắt đầu kết nối dữ liệu</h3>
      <p class="text-body-1 text-medium-emphasis mb-8 mx-auto" style="max-width: 480px">
        Tích hợp ZaloCRM với các nền tảng khác để tự động hóa quy trình nhập liệu và chăm sóc khách hàng.
      </p>
      <v-btn
        color="primary"
        size="large"
        rounded="xl"
        prepend-icon="mdi-plus"
        @click="openCreate"
      >
        Tạo tích hợp đầu tiên
      </v-btn>
    </v-card>

    <!-- Loading State -->
    <div v-if="loading" class="d-flex justify-center pa-12">
      <v-progress-circular indeterminate color="primary" size="64" />
    </div>

    <!-- Edit/Create Dialog -->
    <v-dialog v-model="showDialog" max-width="560" transition="dialog-bottom-transition" persistent>
      <v-card class="rounded-xl border overflow-hidden">
        <v-card-title class="pa-6 pb-2 d-flex align-center">
          <div class="title-icon-box mr-4 rounded-lg bg-primary-soft">
            <v-icon color="primary">{{ editing ? 'mdi-pencil' : 'mdi-plus' }}</v-icon>
          </div>
          <span class="text-h5 font-weight-bold">{{ editing ? 'Cấu hình Tích hợp' : 'Tạo Tích hợp mới' }}</span>
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" size="small" @click="showDialog = false" />
        </v-card-title>

        <v-card-text class="pa-6 pt-4">
          <div class="text-subtitle-2 font-weight-bold mb-4 d-flex align-center">
            <v-icon start size="16">mdi-information-outline</v-icon>
            Thông tin chung
          </div>
          
          <v-select
            v-model="form.type"
            :items="typeOptions"
            item-title="label"
            item-value="value"
            label="Loại kết nối *"
            variant="filled"
            rounded="lg"
            :disabled="editing"
            class="mb-4"
          >
            <template #item="{ props, item }">
              <v-list-item v-bind="props" :prepend-icon="typeIcon(item.value)" :title="item.label" />
            </template>
          </v-select>

          <v-text-field
            v-model="form.name"
            label="Tên gợi nhớ (VD: Google Sheets Marketing)"
            variant="filled"
            rounded="lg"
            class="mb-4"
          />

          <div class="d-flex align-center mb-6 pa-3 rounded-lg bg-surface-muted">
            <v-switch v-model="form.enabled" label="Kích hoạt tích hợp này" color="success" hide-details inset />
          </div>

          <v-divider class="mb-6 opacity-10" />

          <div class="text-subtitle-2 font-weight-bold mb-4 d-flex align-center">
            <v-icon start size="16">mdi-cog-outline</v-icon>
            Cấu hình kỹ thuật
          </div>

          <v-fade-transition mode="out-in">
            <!-- Google Sheets Config -->
            <div v-if="form.type === 'google_sheets'" :key="'gs'">
              <v-text-field v-model="form.config.spreadsheetId" label="Spreadsheet ID *" variant="outlined" rounded="lg" class="mb-4" />
              <v-text-field v-model="form.config.apiKey" label="API Key *" type="password" variant="outlined" rounded="lg" class="mb-4" />
              <v-text-field v-model="form.config.sheetName" label="Tên Sheet (VD: Sheet1)" variant="outlined" rounded="lg" />
            </div>

            <!-- Telegram Config -->
            <div v-else-if="form.type === 'telegram'" :key="'tg'">
              <v-text-field v-model="form.config.botToken" label="Telegram Bot Token *" type="password" variant="outlined" rounded="lg" class="mb-4" />
              <v-text-field v-model="form.config.chatId" label="Chat ID / Group ID *" variant="outlined" rounded="lg" />
            </div>

            <!-- Facebook Config -->
            <div v-else-if="form.type === 'facebook'" :key="'fb'">
              <v-text-field v-model="form.config.pageId" label="Facebook Page ID *" variant="outlined" rounded="lg" class="mb-4" />
              <v-text-field v-model="form.config.pageAccessToken" label="Page Access Token *" type="password" variant="outlined" rounded="lg" />
            </div>

            <!-- Webhook Config (Zapier / n8n) -->
            <div v-else-if="form.type === 'zapier' || form.type === 'n8n'" :key="'webhook'">
              <v-text-field
                v-model="form.config.webhookUrl"
                :label="form.type === 'zapier' ? 'Zapier Webhook URL *' : 'n8n Webhook URL *'"
                placeholder="https://hooks..."
                variant="outlined"
                rounded="lg"
                prepend-inner-icon="mdi-link-variant"
              />
              <p class="text-caption text-medium-emphasis mt-2 px-2">
                Hệ thống sẽ gửi một yêu cầu POST chứa dữ liệu JSON của khách hàng đến URL này mỗi khi quá trình đồng bộ được kích hoạt.
              </p>
            </div>
          </v-fade-transition>

          <v-alert v-if="dialogError" type="error" variant="tonal" density="compact" class="mt-4 rounded-lg">
            {{ dialogError }}
          </v-alert>
        </v-card-text>

        <v-divider class="opacity-10" />

        <v-card-actions class="pa-6">
          <v-spacer />
          <v-btn variant="text" rounded="lg" class="px-6" @click="showDialog = false">Hủy</v-btn>
          <v-btn color="primary" variant="flat" size="large" rounded="xl" class="px-10 font-weight-bold" :loading="saving" @click="handleSave">
            {{ editing ? 'Cập nhật cấu hình' : 'Tạo tích hợp' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirm -->
    <v-dialog v-model="showDelete" max-width="400">
      <v-card class="rounded-xl pa-2">
        <v-card-title class="d-flex align-center">
          <v-icon color="error" class="mr-3">mdi-alert-circle-outline</v-icon>
          Xác nhận xóa
        </v-card-title>
        <v-card-text>Bạn có chắc chắn muốn xóa tích hợp <strong>"{{ selectedItem?.name }}"</strong>? Hành động này không thể hoàn tác.</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showDelete = false">Quay lại</v-btn>
          <v-btn color="error" variant="tonal" rounded="lg" :loading="saving" @click="handleDelete">Có, Xóa ngay</v-btn>
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
  { label: 'n8n Workflow', value: 'n8n' },
  { label: 'Zapier Webhook', value: 'zapier' },
  { label: 'Telegram Bot', value: 'telegram' },
  { label: 'Facebook', value: 'facebook' },
];

function typeIcon(type: string) {
  const map: Record<string, string> = {
    google_sheets: 'mdi-google-spreadsheet',
    telegram: 'mdi-send',
    facebook: 'mdi-facebook',
    zapier: 'mdi-lightning-bolt',
    n8n: 'mdi-lan',
  };
  return map[type] ?? 'mdi-connection';
}

function typeColor(type: string) {
  const map: Record<string, string> = {
    google_sheets: '#0F9D58',
    telegram: '#0088cc',
    facebook: '#1877F2',
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
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

async function fetchIntegrations() {
  loading.value = true;
  try {
    const { data } = await api.get('/integrations');
    integrations.value = data;
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Lỗi tải danh sách tích hợp';
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
    dialogError.value = err.response?.data?.error || 'Lỗi lưu tích hợp';
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
    error.value = err.response?.data?.error || 'Lỗi xóa tích hợp';
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
    error.value = err.response?.data?.error || 'Lỗi đồng bộ';
  } finally {
    syncing.value = null;
  }
}

onMounted(fetchIntegrations);
</script>

<style scoped>
.integration-card {
  background: var(--color-surface);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.integration-card:hover {
  transform: translateY(-8px);
  border-color: var(--color-primary-soft-strong) !important;
  box-shadow: 0 12px 24px -8px rgba(var(--v-theme-primary), 0.15) !important;
}

.card-edge-accent {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
}

.type-icon-wrapper {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logs-section {
  background: var(--color-surface-muted);
}

.empty-state {
  max-width: 800px;
  margin: 40px auto;
  border-color: var(--color-border-strong) !important;
}

.empty-icon-container {
  width: 120px;
  height: 120px;
  background: var(--color-primary-soft);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.title-icon-box {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bg-primary-soft {
  background: var(--color-primary-soft);
}

.gradient-text {
  background: var(--gradient-brand);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
</style>
