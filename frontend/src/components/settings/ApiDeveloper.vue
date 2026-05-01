<template>
  <div class="api-developer-component">
    <div class="d-flex align-center mb-8">
      <div class="section-icon-box mr-4">
        <v-icon color="primary">mdi-code-braces</v-icon>
      </div>
      <div>
        <h2 class="text-h5 font-weight-bold mb-1">Dành cho Nhà phát triển</h2>
        <p class="text-body-2 text-medium-emphasis">Quản lý API Key, Webhook và các kết nối kỹ thuật nâng cao</p>
      </div>
    </div>

    <v-row>
      <!-- API KEY & WEBHOOK -->
      <v-col cols="12" md="7">
        <!-- API Key Card -->
        <v-card variant="outlined" class="pa-8 rounded-xl border-glass-modern mb-8 overflow-hidden">
          <div class="d-flex align-center mb-6">
            <v-icon color="primary" class="mr-3">mdi-key-variant</v-icon>
            <span class="text-h6 font-weight-bold">Private API Key</span>
          </div>
          
          <p class="text-body-2 text-medium-emphasis mb-6">
            Sử dụng API Key này để xác thực các yêu cầu từ ứng dụng nội bộ hoặc script của bạn. 
            <strong>Cảnh báo:</strong> Đừng chia sẻ key này cho bất kỳ ai.
          </p>

          <div class="api-key-display pa-4 rounded-xl bg-surface-muted d-flex align-center mb-6 border-dashed">
            <code class="text-primary font-weight-black flex-grow-1 mr-4">{{ apiKey || '********************************' }}</code>
            <v-btn icon="mdi-content-copy" variant="text" size="small" @click="copyKey" :disabled="!apiKey" />
          </div>

          <div class="d-flex justify-end">
            <v-btn
              color="primary"
              variant="tonal"
              rounded="pill"
              class="text-none font-weight-bold px-8"
              :loading="generatingKey"
              @click="generateKey"
            >
              Làm mới API Key
            </v-btn>
          </div>
        </v-card>

        <!-- Webhook Card -->
        <v-card variant="outlined" class="pa-8 rounded-xl border-glass-modern">
          <div class="d-flex align-center mb-6">
            <v-icon color="primary" class="mr-3">mdi-webhook</v-icon>
            <span class="text-h6 font-weight-bold">Webhook Hệ thống</span>
          </div>
          
          <p class="text-body-2 text-medium-emphasis mb-6">
            Hệ thống sẽ gửi thông báo POST đến URL này mỗi khi có sự kiện quan trọng (Tin nhắn mới, Lead mới).
          </p>

          <v-text-field
            v-model="webhookUrl"
            label="Webhook URL"
            placeholder="https://your-server.com/callback"
            variant="outlined"
            rounded="lg"
            class="mb-4"
            hide-details="auto"
            prepend-inner-icon="mdi-link-variant"
          />
          <v-text-field
            v-model="webhookSecret"
            label="Signing Secret"
            type="password"
            variant="outlined"
            rounded="lg"
            class="mb-8"
            hide-details="auto"
            prepend-inner-icon="mdi-shield-lock-outline"
          />

          <div class="d-flex gap-3">
            <v-btn color="primary" variant="flat" rounded="pill" class="px-8 action-btn font-weight-bold" :loading="saving" @click="saveWebhook">
              Lưu cấu hình
            </v-btn>
            <v-btn variant="tonal" color="primary" rounded="pill" class="px-6 font-weight-bold" :loading="testing" @click="testWebhook">
              Gửi Test
            </v-btn>
          </div>
        </v-card>
      </v-col>

      <!-- MCP & DOCS -->
      <v-col cols="12" md="5">
        <!-- MCP Card -->
        <v-card variant="flat" class="pa-8 rounded-xl mcp-card mb-8">
          <div class="d-flex align-center mb-4">
            <v-icon color="secondary" class="mr-3">mdi-robot-outline</v-icon>
            <span class="text-h6 font-weight-bold">Kết nối AI Agent (MCP)</span>
          </div>
          <p class="text-body-2 mb-6 opacity-80">
            Cung cấp quyền truy cập tạm thời cho các Agent như Claude hoặc Antigravity qua SSE.
          </p>

          <div class="mcp-box pa-4 rounded-lg bg-black-opacity mb-4">
            <div class="text-caption font-weight-black text-secondary mb-1 uppercase letter-spacing-1">Connection URL</div>
            <div class="d-flex align-center">
              <div class="text-truncate text-caption flex-grow-1 mr-2 opacity-70">
                {{ mcpUrl || 'Nhấn để tạo URL...' }}
              </div>
              <v-btn icon size="x-small" variant="text" color="secondary" @click="generateMcpUrl" :loading="generatingTicket">
                <v-icon>{{ mcpUrl ? 'mdi-content-copy' : 'mdi-refresh' }}</v-icon>
              </v-btn>
            </div>
          </div>
          <v-alert type="info" variant="tonal" density="compact" class="rounded-lg text-caption" icon="mdi-information">
            URL có hiệu lực trong 10 phút.
          </v-alert>
        </v-card>

        <!-- Help Card -->
        <v-card variant="outlined" class="pa-8 rounded-xl border-glass-modern bg-surface-muted">
          <div class="d-flex align-center mb-4">
            <v-icon color="medium-emphasis" class="mr-3">mdi-book-open-page-variant</v-icon>
            <span class="text-subtitle-1 font-weight-bold">Tài liệu API</span>
          </div>
          <p class="text-body-2 text-medium-emphasis mb-6">
            Tìm hiểu cách sử dụng API của chúng tôi để xây dựng các giải pháp tùy chỉnh cho doanh nghiệp của bạn.
          </p>
          <v-btn variant="outlined" block rounded="pill" href="https://docs.claro.vn" target="_blank" class="text-none">
            Xem API Reference
          </v-btn>
        </v-card>
      </v-col>
    </v-row>

    <v-snackbar v-model="snack.show" :color="snack.color" rounded="pill">
      {{ snack.text }}
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
const snack = ref({ show: false, text: '', color: 'success' });

function showSnack(text: string, color = 'success') {
  snack.value = { show: true, text, color };
}

async function loadData() {
  try {
    const [keyRes, webhookRes] = await Promise.all([
      api.get('/settings/api-key'),
      api.get('/settings/webhook')
    ]);
    apiKey.value = keyRes.data.apiKey ?? '';
    webhookUrl.value = webhookRes.data.webhookUrl ?? '';
    webhookSecret.value = webhookRes.data.webhookSecret ?? '';
  } catch (err) {}
}

async function generateKey() {
  generatingKey.value = true;
  try {
    const res = await api.post('/settings/api-key/generate');
    apiKey.value = res.data.apiKey;
    showSnack('Đã tạo API Key mới');
  } catch {
    showSnack('Lỗi khi tạo key', 'error');
  } finally {
    generatingKey.value = false;
  }
}

async function copyKey() {
  await navigator.clipboard.writeText(apiKey.value);
  showSnack('Đã sao chép API Key');
}

async function saveWebhook() {
  saving.value = true;
  try {
    await api.put('/settings/webhook', { webhookUrl: webhookUrl.value, webhookSecret: webhookSecret.value });
    showSnack('Đã lưu cấu hình webhook');
  } catch {
    showSnack('Lỗi khi lưu webhook', 'error');
  } finally {
    saving.value = false;
  }
}

async function testWebhook() {
  testing.value = true;
  try {
    await api.post('/settings/webhook/test');
    showSnack('Đã gửi yêu cầu test');
  } catch {
    showSnack('Test thất bại', 'error');
  } finally {
    testing.value = false;
  }
}

async function generateMcpUrl() {
  generatingTicket.value = true;
  try {
    const res = await api.post('/ai/mcp/ticket');
    mcpUrl.value = `${window.location.origin}/api/v1/ai/mcp/sse?ticket=${res.data.ticket}`;
    await navigator.clipboard.writeText(mcpUrl.value);
    showSnack('Đã tạo và sao chép URL MCP');
  } catch {
    showSnack('Lỗi khi tạo MCP URL', 'error');
  } finally {
    generatingTicket.value = false;
  }
}

onMounted(loadData);
</script>

<style scoped>
.section-icon-box {
  width: 44px;
  height: 44px;
  background: var(--color-primary-soft);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.border-glass-modern {
  background: var(--color-surface) !important;
  border: 1px solid var(--color-border) !important;
  box-shadow: var(--shadow-sm) !important;
}

.api-key-display {
  background: var(--color-surface-elevated) !important;
  border: 1px solid var(--color-border);
}

.mcp-card {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%) !important;
  color: white !important;
}

.mcp-box {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.bg-black-opacity {
  background: rgba(0, 0, 0, 0.05);
}

.action-btn {
  transition: all 0.3s var(--liquid-ease);
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--glow-brand);
}

.uppercase { text-transform: uppercase; }
.letter-spacing-1 { letter-spacing: 1px; }
</style>
