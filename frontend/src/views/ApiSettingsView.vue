<template>
  <div class="api-settings-container pb-10">
    <div class="d-flex align-center mb-8">
      <div class="header-icon-box mr-4">
        <v-icon size="32" color="primary">mdi-code-braces</v-icon>
      </div>
      <div>
        <h1 class="text-h4 font-weight-bold mb-1 outfit-font">Nhà phát triển</h1>
        <p class="text-body-2 text-medium-emphasis mb-0">Webhook, API key và kết nối kỹ thuật cho AI Agent</p>
      </div>
    </div>

    <v-row>
      <v-col cols="12" md="7">
        <v-card class="glass-card mb-6 context-note-card" elevation="0">
          <v-card-text class="pa-6">
            <div class="d-flex align-start">
              <v-avatar color="warning" variant="tonal" size="44" class="mr-4 flex-shrink-0">
                <v-icon color="warning">mdi-compass-outline</v-icon>
              </v-avatar>
              <div>
                <div class="text-subtitle-1 font-weight-bold mb-2">Trang này dành cho cấu hình kỹ thuật</div>
                <p class="text-body-2 text-medium-emphasis mb-3">
                  Dùng khi bạn cần webhook hệ thống, API key riêng hoặc kết nối MCP cho AI Agent.
                </p>
                <p class="text-body-2 text-medium-emphasis mb-0">
                  Các tích hợp nghiệp vụ như Google Sheets, Telegram, Zapier, n8n vẫn nằm ở trang
                  <strong>Tích hợp</strong>.
                </p>
              </div>
            </div>
          </v-card-text>
        </v-card>

        <v-card class="glass-card ai-control-card mb-6 overflow-hidden" elevation="0">
          <div class="card-glow"></div>
          <v-card-text class="pa-6">
            <div class="d-flex align-center mb-0">
              <v-avatar color="primary" variant="tonal" size="48" class="mr-4">
                <v-icon color="primary">mdi-robot-happy</v-icon>
              </v-avatar>
              <div>
                <h2 class="text-h5 font-weight-bold outfit-font mb-0">Lối tắt AI</h2>
                <p class="text-caption text-medium-emphasis mb-0">Đi tới các màn theo dõi usage và huấn luyện AI</p>
              </div>
              <v-spacer />
              <div class="d-flex ga-2">
                <v-btn color="secondary" variant="tonal" rounded="lg" to="/ai-usage">
                  <v-icon start>mdi-chart-line</v-icon>
                  Mức dùng AI
                </v-btn>
                <v-btn color="primary" variant="flat" rounded="lg" to="/ai-training">
                  <v-icon start>mdi-brain</v-icon>
                  Tri thức AI
                </v-btn>
              </div>
            </div>
          </v-card-text>
        </v-card>

        <v-card class="glass-card mb-6" elevation="0">
          <v-card-title class="pa-6 pb-2 d-flex align-center">
            <v-icon size="24" color="primary" class="mr-3">mdi-webhook</v-icon>
            <span class="outfit-font font-weight-bold">Webhook hệ thống</span>
          </v-card-title>
          <v-card-text class="pa-6 pt-0">
            <p class="text-body-2 text-medium-emphasis mb-6">
              Gửi sự kiện ra ngoài hệ thống khi có tin nhắn mới, khách hàng mới hoặc thay đổi quan trọng trong CRM.
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
            <span class="outfit-font font-weight-bold">Kết nối AI Agent từ xa (MCP)</span>
          </v-card-title>
          <v-card-text class="pa-6 pt-0">
            <p class="text-body-2 text-medium-emphasis mb-4">
              Tạo một URL tạm thời để agent như Antigravity hoặc Claude truy cập CRM qua giao thức MCP.
            </p>
            
            <div class="api-key-box pa-4 rounded-lg bg-black-opacity border-glow-secondary">
              <div class="text-caption font-weight-bold text-secondary mb-2 uppercase">Connection URL (SSE)</div>
              <div class="d-flex align-center">
                <div class="mcp-url-text flex-grow-1 mr-2 text-truncate text-body-2">
                  {{ mcpUrl || 'Nhấn để tạo URL kết nối...' }}
                </div>
                <v-btn 
                  icon 
                  size="x-small" 
                  variant="text" 
                  color="secondary" 
                  @click="generateAndCopyMcpUrl"
                  :loading="generatingTicket"
                >
                  <v-icon size="18">{{ mcpUrl ? 'mdi-content-copy' : 'mdi-refresh' }}</v-icon>
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
              URL này có thời hạn ngắn và nên chỉ dùng trong quá trình cấu hình agent.
            </v-alert>
          </v-card-text>
        </v-card>

        <v-card class="glass-card mb-6 theme-dark-docs" elevation="0">
          <v-card-title class="pa-6 pb-2 d-flex align-center">
            <v-icon size="24" color="primary" class="mr-3">mdi-code-braces</v-icon>
            <span class="outfit-font font-weight-bold">API riêng tư</span>
          </v-card-title>
          <v-card-text class="pa-6 pt-0">
            <p class="text-body-2 text-medium-emphasis mb-4">
              Dùng key này khi ứng dụng nội bộ hoặc script của bạn cần gọi API của Claro.
            </p>
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
              <div class="text-subtitle-2 font-weight-bold">Quyền truy cập kỹ thuật</div>
              <div class="text-caption text-medium-emphasis">Webhook, MCP ticket và API key nên chỉ cấp cho người phụ trách kỹ thuật</div>
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

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '@/api';

const apiKey = ref('');
const generatingKey = ref(false);
const webhookUrl = ref('');
const webhookSecret = ref('');
const saving = ref(false);
const testing = ref(false);

const mcpUrl = ref('');
const generatingTicket = ref(false);

async function generateAndCopyMcpUrl() {
  generatingTicket.value = true;
  try {
    const res = await api.post('/ai/mcp/ticket');
    const ticket = res.data.ticket;
    const base = window.location.origin;
    mcpUrl.value = `${base}/api/v1/ai/mcp/sse?ticket=${ticket}`;
    
    await navigator.clipboard.writeText(mcpUrl.value);
    showSnack('Đã tạo và sao chép URL kết nối (hết hạn sau 10 phút)');
  } catch (err) {
    showSnack('Không thể tạo ticket bảo mật', 'error');
  } finally {
    generatingTicket.value = false;
  }
}

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


onMounted(async () => {
  await Promise.all([loadApiKey(), loadWebhook()]);
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
