<template>
  <div class="api-settings-container pb-10">
    <!-- Header Section -->
    <div class="d-flex align-center mb-8">
      <div class="header-icon-box mr-4">
        <v-icon size="32" color="primary">mdi-connection</v-icon>
      </div>
      <div>
        <h1 class="text-h4 font-weight-bold mb-1 outfit-font">Kết nối & AI</h1>
        <p class="text-body-2 text-medium-emphasis mb-0">Quản lý sức mạnh AI và các kết nối hệ thống của bạn</p>
      </div>
    </div>

    <v-row>
      <!-- Left Column: AI Control Center -->
      <v-col cols="12" md="7">
        <v-card class="glass-card ai-control-card mb-6 overflow-hidden" elevation="0">
          <div class="card-glow"></div>
          <v-card-text class="pa-6">
            <div class="d-flex align-center mb-6">
              <v-avatar color="rgba(0, 242, 255, 0.1)" size="48" class="mr-4">
                <v-icon color="#00F2FF">mdi-robot-happy</v-icon>
              </v-avatar>
              <div>
                <h2 class="text-h5 font-weight-bold outfit-font mb-0">AI Assistant</h2>
                <div class="d-flex align-center">
                  <span :class="['status-orb mr-2', aiConfig.enabled ? 'active' : 'inactive']"></span>
                  <span class="text-caption font-weight-medium uppercase tracking-wider">
                    {{ aiConfig.enabled ? 'Hệ thống đang hoạt động' : 'Hệ thống đã tắt' }}
                  </span>
                </div>
              </div>
              <v-spacer />
              <v-btn color="primary" variant="flat" rounded="lg" @click="showAiConfig = true" class="px-6">
                <v-icon start>mdi-cog-sync</v-icon>
                Cấu hình
              </v-btn>
            </div>

            <v-divider class="mb-6 border-opacity-25" />

            <v-row>
              <v-col cols="6" sm="3">
                <div class="info-label mb-1">Nhà cung cấp</div>
                <div class="info-value d-flex align-center">
                  <v-icon size="20" class="mr-2" color="primary">
                    {{ aiConfig.provider === 'openrouter' ? 'mdi-hub' : 'mdi-brain' }}
                  </v-icon>
                  {{ aiConfig.provider }}
                </div>
              </v-col>
              <v-col cols="6" sm="3">
                <div class="info-label mb-1">Mô hình AI</div>
                <div class="info-value truncate">{{ aiConfig.model }}</div>
              </v-col>
              <v-col cols="6" sm="3">
                <div class="info-label mb-1">Hạn mức/Ngày</div>
                <div class="info-value">{{ aiConfig.maxDaily }} <small class="text-caption ml-1">tokens</small></div>
              </v-col>
              <v-col cols="6" sm="3">
                <div class="info-label mb-1">API Key</div>
                <div class="info-value">
                  <v-chip
                    size="x-small"
                    :color="hasCurrentProviderKey ? 'success' : 'warning'"
                    variant="tonal"
                    label
                    class="font-weight-bold"
                  >
                    {{ hasCurrentProviderKey ? 'ĐÃ CẤU HÌNH' : 'CHƯA CÓ KEY' }}
                  </v-chip>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- Webhook Section -->
        <v-card class="glass-card mb-6" elevation="0">
          <v-card-title class="pa-6 pb-2 d-flex align-center">
            <v-icon size="24" color="primary" class="mr-3">mdi-webhook</v-icon>
            <span class="outfit-font font-weight-bold">Webhook Events</span>
          </v-card-title>
          <v-card-text class="pa-6 pt-0">
            <p class="text-body-2 text-medium-emphasis mb-6">
              Nhận thông báo tự động (thời gian thực) khi có tin nhắn mới hoặc khách hàng mới.
            </p>
            <v-text-field
              v-model="webhookUrl"
              label="Webhook URL"
              placeholder="https://your-server.com/webhook"
              variant="outlined"
              density="comfortable"
              class="mb-4"
              bg-color="rgba(255,255,255,0.03)"
            />
            <v-text-field
              v-model="webhookSecret"
              label="Mã bảo mật (Signing Secret)"
              type="password"
              variant="outlined"
              density="comfortable"
              class="mb-6"
              bg-color="rgba(255,255,255,0.03)"
            />
            <div class="d-flex gap-3">
              <v-btn color="primary" :loading="saving" @click="saveWebhook" class="px-6" rounded="lg">
                Lưu cấu hình
              </v-btn>
              <v-btn variant="outlined" :loading="testing" @click="testWebhook" rounded="lg">
                Gửi Test Payload
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Right Column: Developers & Docs -->
      <v-col cols="12" md="5">
        <!-- API Docs Card -->
        <v-card class="glass-card mb-6 theme-dark-docs" elevation="0">
          <v-card-title class="pa-6 pb-2 d-flex align-center">
            <v-icon size="24" color="primary" class="mr-3">mdi-code-braces</v-icon>
            <span class="outfit-font font-weight-bold">Dành cho Lập trình viên</span>
          </v-card-title>
          <v-card-text class="pa-6 pt-0">
            <div class="api-key-box pa-4 mb-6 rounded-lg bg-black-opacity">
              <div class="d-flex align-center justify-space-between mb-2">
                <span class="text-caption font-weight-bold text-medium-emphasis">PRIVATE API KEY</span>
                <v-btn
                  size="small"
                  variant="text"
                  color="primary"
                  :loading="generatingKey"
                  @click="generateKey"
                >
                  Làm mới
                </v-btn>
              </div>
              <div class="d-flex align-center">
                <code class="flex-grow-1 mr-2 text-primary font-weight-bold">{{ apiKey || '••••••••••••••••' }}</code>
                <v-btn icon size="x-small" variant="text" @click="copyKey" :disabled="!apiKey">
                  <v-icon size="18">mdi-content-copy</v-icon>
                </v-btn>
              </div>
            </div>

            <div class="docs-snippet pa-4 rounded-lg bg-black-opacity border-left-glow">
              <div class="text-caption font-weight-bold color-cyan mb-2">QUICK GUIDE</div>
              <pre class="code-pre">Header: X-API-Key: your-key

GET  /api/public/contacts
POST /api/public/messages/send
GET  /api/public/appointments</pre>
            </div>
          </v-card-text>
        </v-card>

        <!-- Stats Card -->
        <v-card class="glass-card" elevation="0">
          <v-card-text class="pa-6 d-flex align-center">
            <div class="icon-circle primary mr-4">
              <v-icon color="primary">mdi-shield-check</v-icon>
            </div>
            <div>
              <div class="text-subtitle-2 font-weight-bold">Bảo mật cấp cao</div>
              <div class="text-caption text-medium-emphasis">Dữ liệu được mã hóa chuẩn AES-256 nội bộ</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-snackbar v-model="snack.show" :color="snack.color" :timeout="3000" rounded="lg">
      <div class="d-flex align-center">
        <v-icon class="mr-2">
          {{ snack.color === 'error' ? 'mdi-alert-circle' : 'mdi-check-circle' }}
        </v-icon>
        {{ snack.text }}
      </div>
    </v-snackbar>

    <AiConfigDialog
      v-model="showAiConfig"
      :loading="aiSaving"
      :config="aiConfig"
      @save="saveAiConfig"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { api } from '@/api';
import AiConfigDialog from '@/components/ai/ai-config-dialog.vue';

// ... rest of refs

const hasCurrentProviderKey = computed(() => {
  const p = aiConfig.value.provider.toLowerCase();
  if (p === 'anthropic') return aiConfig.value.hasAnthropicKey;
  if (p === 'gemini') return aiConfig.value.hasGeminiKey;
  if (p === 'openrouter') return aiConfig.value.hasOpenRouterKey;
  return false;
});

const apiKey = ref('');
const generatingKey = ref(false);
const webhookUrl = ref('');
const webhookSecret = ref('');
const saving = ref(false);
const testing = ref(false);
const showAiConfig = ref(false);
const aiSaving = ref(false);
const aiConfig = ref({ 
  provider: 'anthropic', 
  model: 'claude-sonnet-4-6', 
  maxDaily: 500, 
  enabled: true,
  hasAnthropicKey: false,
  hasGeminiKey: false,
  hasOpenRouterKey: false,
});

const snack = ref({ show: false, text: '', color: 'success' });

function showSnack(text: string, color = 'success') {
  snack.value = { show: true, text, color };
}

async function loadApiKey() {
  try {
    const res = await api.get('/settings/api-key');
    apiKey.value = res.data.apiKey ?? '';
  } catch {
    apiKey.value = '';
  }
}

async function loadWebhook() {
  try {
    const res = await api.get('/settings/webhook');
    webhookUrl.value = res.data.webhookUrl ?? '';
    webhookSecret.value = res.data.webhookSecret ?? '';
  } catch {
    webhookUrl.value = '';
    webhookSecret.value = '';
  }
}

async function loadAiConfig() {
  try {
    const res = await api.get('/ai/config');
    aiConfig.value = {
      provider: res.data.provider,
      model: res.data.model,
      maxDaily: res.data.maxDaily,
      enabled: res.data.enabled,
      hasAnthropicKey: res.data.hasAnthropicKey,
      hasGeminiKey: res.data.hasGeminiKey,
      hasOpenRouterKey: res.data.hasOpenRouterKey,
    };
  } catch {
    aiConfig.value = { 
      provider: 'anthropic', 
      model: 'claude-sonnet-4-6', 
      maxDaily: 500, 
      enabled: true,
      hasAnthropicKey: false,
      hasGeminiKey: false,
      hasOpenRouterKey: false,
    };
  }
}

async function generateKey() {
  generatingKey.value = true;
  try {
    const res = await api.post('/settings/api-key/generate');
    apiKey.value = res.data.apiKey ?? '';
    showSnack('API key mới đã được tạo');
  } catch {
    showSnack('Tạo key thất bại', 'error');
  } finally {
    generatingKey.value = false;
  }
}

async function copyKey() {
  if (!apiKey.value) return;
  await navigator.clipboard.writeText(apiKey.value);
  showSnack('Đã sao chép API key');
}

async function saveWebhook() {
  saving.value = true;
  try {
    await api.put('/settings/webhook', {
      webhookUrl: webhookUrl.value,
      webhookSecret: webhookSecret.value,
    });
    showSnack('Đã lưu cấu hình webhook');
  } catch {
    showSnack('Lưu thất bại', 'error');
  } finally {
    saving.value = false;
  }
}

async function testWebhook() {
  testing.value = true;
  try {
    await api.post('/settings/webhook/test');
    showSnack('Gửi test webhook thành công');
  } catch {
    showSnack('Test webhook thất bại', 'error');
  } finally {
    testing.value = false;
  }
}

async function saveAiConfig(value: { provider: string; model: string; maxDaily: number; enabled: boolean; apiKey?: string }) {
  aiSaving.value = true;
  try {
    const res = await api.put('/ai/config', value);
    aiConfig.value = {
      provider: res.data.provider,
      model: res.data.model,
      maxDaily: res.data.maxDaily,
      enabled: res.data.enabled,
      hasAnthropicKey: res.data.hasAnthropicKey,
      hasGeminiKey: res.data.hasGeminiKey,
      hasOpenRouterKey: res.data.hasOpenRouterKey,
    };
    showAiConfig.value = false;
    showSnack('Đã lưu cấu hình AI');
  } catch {
    showSnack('Lưu cấu hình AI thất bại', 'error');
  } finally {
    aiSaving.value = false;
  }
}

onMounted(async () => {
  await Promise.all([loadApiKey(), loadWebhook(), loadAiConfig()]);
});
</script>

<style scoped>
.api-settings-container {
  max-width: 1200px;
  margin: 0 auto;
}

.glass-card {
  background: rgba(255, 255, 255, 0.05) !important;
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 16px !important;
  position: relative;
}

.ai-control-card {
  background: linear-gradient(135deg, rgba(0, 242, 255, 0.05) 0%, rgba(0, 119, 182, 0.05) 100%) !important;
}

.card-glow {
  position: absolute;
  top: -50px;
  right: -50px;
  width: 150px;
  height: 150px;
  background: radial-gradient(circle, rgba(0, 242, 255, 0.15) 0%, transparent 70%);
  filter: blur(20px);
  z-index: 0;
  pointer-events: none;
}

.header-icon-box {
  background: rgba(0, 242, 255, 0.1);
  padding: 12px;
  border-radius: 12px;
  border: 1px solid rgba(0, 242, 255, 0.2);
}

.status-orb {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.status-orb.active {
  background: #00F2FF;
  box-shadow: 0 0 8px #00F2FF;
}

.status-orb.inactive {
  background: #ff5252;
}

.info-label {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-weight: 600;
  font-size: 0.95rem;
}

.bg-black-opacity {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.border-left-glow {
  border-left: 3px solid #00F2FF !important;
}

.code-pre {
  font-family: 'Fira Code', monospace;
  font-size: 0.8rem;
  color: #a9b7c6;
  white-space: pre-wrap;
  line-height: 1.6;
}

.icon-circle {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-circle.primary {
  background: rgba(0, 242, 255, 0.1);
}

.truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.color-cyan {
  color: #00F2FF;
}

.uppercase {
  text-transform: uppercase;
}

.tracking-wider {
  letter-spacing: 1px;
}

:deep(.v-field) {
  border-radius: 10px !important;
}
</style>
