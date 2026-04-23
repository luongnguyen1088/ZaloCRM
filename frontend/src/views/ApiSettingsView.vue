<template>
  <div class="api-settings-container pb-10">
    <div class="d-flex align-center mb-8">
      <div class="header-icon-box mr-4">
        <v-icon size="32" color="primary">mdi-connection</v-icon>
      </div>
      <div>
        <h1 class="text-h4 font-weight-bold mb-1 outfit-font">Kết nối & AI</h1>
        <p class="text-body-2 text-medium-emphasis mb-0">Quản lý AI platform, webhook và API hệ thống</p>
      </div>
    </div>

    <v-row>
      <v-col cols="12" md="7">
        <v-card class="glass-card ai-control-card mb-6 overflow-hidden" elevation="0">
          <div class="card-glow"></div>
          <v-card-text class="pa-6">
            <div class="d-flex align-center mb-6">
              <v-avatar color="primary" variant="tonal" size="48" class="mr-4">
                <v-icon color="primary">mdi-robot-happy</v-icon>
              </v-avatar>
              <div>
                <h2 class="text-h5 font-weight-bold outfit-font mb-0">AI Assistant</h2>
                <div class="d-flex align-center">
                  <span :class="['status-orb mr-2', aiConfig.enabled ? 'active' : 'inactive']"></span>
                  <span class="text-caption font-weight-medium uppercase tracking-wider">
                    {{ aiConfig.enabled ? 'Đang hoạt động' : 'Đang tắt' }}
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
                <div class="info-label mb-1">Gói</div>
                <div class="info-value d-flex align-center">
                  <v-icon size="20" class="mr-2" color="primary">mdi-shield-crown-outline</v-icon>
                  {{ aiConfig.planName || 'Free' }}
                </div>
              </v-col>
              <v-col cols="6" sm="3">
                <div class="info-label mb-1">Mô hình</div>
                <div class="info-value truncate">{{ aiConfig.model }}</div>
              </v-col>
              <v-col cols="6" sm="3">
                <div class="info-label mb-1">AI Tokens</div>
                <div class="info-value">{{ aiConfig.remainingTokens }} / {{ aiConfig.maxTokens }}</div>
              </v-col>
              <v-col cols="6" sm="3">
                <div class="info-label mb-1">Vận hành</div>
                <div class="info-value">
                  <v-chip
                    size="x-small"
                    :color="aiConfig.platformKeyConfigured ? 'success' : 'warning'"
                    variant="tonal"
                    label
                    class="font-weight-bold"
                  >
                    {{ aiConfig.platformKeyConfigured ? 'PLATFORM AI' : 'CẦN CẤU HÌNH ENV' }}
                  </v-chip>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <v-card class="glass-card mb-6" elevation="0">
          <v-card-title class="pa-6 pb-2 d-flex align-center">
            <v-icon size="24" color="primary" class="mr-3">mdi-webhook</v-icon>
            <span class="outfit-font font-weight-bold">Webhook Events</span>
          </v-card-title>
          <v-card-text class="pa-6 pt-0">
            <p class="text-body-2 text-medium-emphasis mb-6">
              Nhận thông báo thời gian thực khi có tin nhắn mới hoặc khách hàng mới.
            </p>
            <v-text-field
              v-model="webhookUrl"
              label="Webhook URL"
              placeholder="https://your-server.com/webhook"
              variant="outlined"
              density="comfortable"
              class="mb-4"
              bg-color="transparent"
            />
            <v-text-field
              v-model="webhookSecret"
              label="Signing Secret"
              type="password"
              variant="outlined"
              density="comfortable"
              class="mb-6"
              bg-color="transparent"
            />
            <div class="d-flex gap-3">
              <v-btn color="primary" :loading="saving" @click="saveWebhook" class="px-6" rounded="lg">
                Lưu cấu hình
              </v-btn>
              <v-btn variant="outlined" :loading="testing" @click="testWebhook" rounded="lg">
                Gửi test
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="5">
        <v-card class="glass-card mb-6 mcp-connection-card overflow-hidden" elevation="0">
          <div class="mcp-accent-bar"></div>
          <v-card-title class="pa-6 pb-2 d-flex align-center">
            <v-icon size="24" color="secondary" class="mr-3">mdi-robot-outline</v-icon>
            <span class="outfit-font font-weight-bold">Kết nối AI Agent (MCP)</span>
          </v-card-title>
          <v-card-text class="pa-6 pt-0">
            <p class="text-body-2 text-medium-emphasis mb-4">
              Dùng URL này để Antigravity hoặc Claude có thể tự động cấu hình và đào tạo AI cho bạn.
            </p>
            
            <div class="api-key-box pa-4 rounded-lg bg-black-opacity border-glow-secondary">
              <div class="text-caption font-weight-bold text-secondary mb-2 uppercase">Connection URL (SSE)</div>
              <div class="d-flex align-center">
                <div class="mcp-url-text flex-grow-1 mr-2 text-truncate text-body-2">{{ mcpUrl }}</div>
                <v-btn icon size="x-small" variant="text" color="secondary" @click="copyMcpUrl">
                  <v-icon size="18">mdi-content-copy</v-icon>
                </v-btn>
              </div>
            </div>

            <v-alert
              type="info"
              variant="tonal"
              density="compact"
              class="mt-4 text-caption rounded-lg"
              icon="mdi-information-outline"
            >
              Dán URL này vào phần cấu hình MCP của AI Agent để điều khiển CRM từ xa.
            </v-alert>
          </v-card-text>
        </v-card>

        <v-card class="glass-card mb-6 theme-dark-docs" elevation="0">
          <v-card-title class="pa-6 pb-2 d-flex align-center">
            <v-icon size="24" color="primary" class="mr-3">mdi-code-braces</v-icon>
            <span class="outfit-font font-weight-bold">Dành cho lập trình viên</span>
          </v-card-title>
          <v-card-text class="pa-6 pt-0">
            <div class="api-key-box pa-4 mb-6 rounded-lg bg-black-opacity">
              <div class="d-flex align-center justify-space-between mb-2">
                <span class="text-caption font-weight-bold text-medium-emphasis">PRIVATE API KEY</span>
                <v-btn size="small" variant="text" color="primary" :loading="generatingKey" @click="generateKey">
                  Làm mới
                </v-btn>
              </div>
              <div class="d-flex align-center">
                <code class="flex-grow-1 mr-2 text-primary font-weight-bold">{{ apiKey || '****************' }}</code>
                <v-btn icon size="x-small" variant="text" @click="copyKey" :disabled="!apiKey">
                  <v-icon size="18">mdi-content-copy</v-icon>
                </v-btn>
              </div>
            </div>

            <div class="docs-snippet pa-4 rounded-lg bg-black-opacity border-left-glow">
              <div class="text-caption font-weight-bold color-cyan mb-2">QUICK GUIDE</div>
              <pre class="code-pre">Header: X-API-Key: your-key
GET  /api/public/contacts
POST /api/public/messages/send</pre>
            </div>
          </v-card-text>
        </v-card>

        <v-card class="glass-card" elevation="0">
          <v-card-text class="pa-6 d-flex align-center">
            <div class="icon-circle primary mr-4">
              <v-icon color="primary">mdi-shield-check</v-icon>
            </div>
            <div>
              <div class="text-subtitle-2 font-weight-bold">Bảo mật cấp cao</div>
              <div class="text-caption text-medium-emphasis">AI key được quản lý tập trung trên hệ thống</div>
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

type AiConfig = {
  provider: string;
  model: string;
  maxDaily: number;
  enabled: boolean;
  managed: boolean;
  platformKeyConfigured: boolean;
  planName: string;
  usedTokens: number;
  maxTokens: number;
  remainingTokens: number;
};

const apiKey = ref('');
const generatingKey = ref(false);
const webhookUrl = ref('');
const webhookSecret = ref('');
const saving = ref(false);
const testing = ref(false);
const showAiConfig = ref(false);
const aiSaving = ref(false);
const aiConfig = ref<AiConfig>({
  provider: 'anthropic',
  model: 'claude-sonnet-4-6',
  maxDaily: 500,
  enabled: true,
  managed: true,
  platformKeyConfigured: false,
  planName: 'Free',
  usedTokens: 0,
  maxTokens: 500000,
  remainingTokens: 500000,
});

const mcpUrl = computed(() => {
  const base = window.location.origin;
  return `${base}/api/v1/ai/mcp/sse?token=${localStorage.getItem('token') || ''}`;
});

const snack = ref({ show: false, text: '', color: 'success' });

function showSnack(text: string, color = 'success') {
  snack.value = { show: true, text, color };
}

function normalizeAiConfig(data: any): AiConfig {
  const maxTokens = Number(data.maxTokens ?? data.maxDaily ?? 500000);
  const usedTokens = Number(data.usedTokens ?? data.usedToday ?? 0);
  return {
    provider: data.provider || 'platform',
    model: data.model || '',
    maxDaily: maxTokens,
    enabled: Boolean(data.enabled),
    managed: Boolean(data.managed ?? true),
    platformKeyConfigured: Boolean(data.platformKeyConfigured),
    planName: data.planName || 'Free',
    usedTokens,
    maxTokens,
    remainingTokens: Number(data.remainingTokens ?? data.remaining ?? Math.max(0, maxTokens - usedTokens)),
  };
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
    const res = await api.get(`/ai/config?t=${Date.now()}`);
    aiConfig.value = normalizeAiConfig(res.data);
  } catch (err) {
    console.error('[AI Settings] Failed to load config:', err);
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

async function copyMcpUrl() {
  await navigator.clipboard.writeText(mcpUrl.value);
  showSnack('Đã sao chép Connection URL');
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

async function saveAiConfig(value: { enabled: boolean }) {
  aiSaving.value = true;
  try {
    const res = await api.put('/ai/config', value);
    aiConfig.value = normalizeAiConfig(res.data);
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
  background: var(--color-surface-elevated) !important;
  backdrop-filter: blur(12px);
  border: 1px solid var(--color-border) !important;
  border-radius: 16px !important;
  position: relative;
  box-shadow: var(--shadow-sm);
}

.ai-control-card {
  background: linear-gradient(135deg, var(--color-primary-soft) 0%, var(--color-accent-soft) 100%) !important;
}

.card-glow {
  position: absolute;
  top: -50px;
  right: -50px;
  width: 150px;
  height: 150px;
  background: radial-gradient(circle, var(--color-primary-soft-strong) 0%, transparent 70%);
  filter: blur(20px);
  z-index: 0;
  pointer-events: none;
}

.header-icon-box {
  background: var(--color-primary-soft);
  padding: 12px;
  border-radius: 12px;
  border: 1px solid var(--color-primary-soft-strong);
}

.info-label {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 700;
}

.info-value {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--color-text);
  min-height: 24px;
}

.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-orb {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.status-orb.active {
  background: rgb(var(--v-theme-success));
  box-shadow: 0 0 8px rgba(var(--v-theme-success), 0.5);
}

.status-orb.inactive {
  background: rgb(var(--v-theme-warning));
}

.bg-black-opacity {
  background: rgba(0, 0, 0, 0.05);
}

.api-key-box {
  border: 1px solid rgba(var(--v-theme-primary), 0.1);
}

.mcp-url-text {
  font-family: var(--font-mono, monospace);
  color: rgb(var(--v-theme-secondary));
}

.border-glow-secondary {
  border: 1px solid rgba(var(--v-theme-secondary), 0.2);
}

.theme-dark-docs {
  background: #101827 !important;
  color: white !important;
}

.code-pre {
  margin: 0;
  white-space: pre-wrap;
  font-family: var(--font-mono, monospace);
  font-size: 0.82rem;
}

.color-cyan {
  color: #22d3ee;
}

.border-left-glow {
  border-left: 3px solid #22d3ee;
}

.icon-circle {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: var(--color-primary-soft);
}
</style>
