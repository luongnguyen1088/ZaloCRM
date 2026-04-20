<template>
  <v-container fluid class="pa-6">
    <!-- Header Section -->
    <div class="d-flex align-center mb-8">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1">Kết nối đa kênh</h1>
        <p class="text-medium-emphasis mb-0">Quản lý các tài khoản Zalo cá nhân và Facebook Fanpage</p>
      </div>
      <v-spacer />
      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        rounded="lg"
        elevation="4"
        class="px-6"
        @click="showAddDialog = true"
      >
        Thêm tài khoản
      </v-btn>
    </div>

    <!-- Account Grid -->
    <v-row v-if="loading">
      <v-col v-for="i in 3" :key="i" cols="12" md="4">
        <v-skeleton-loader type="card" class="glass-card" />
      </v-col>
    </v-row>

    <v-row v-else-if="accounts.length">
      <v-col v-for="item in accounts" :key="item.id" cols="12" md="4" lg="3">
        <v-card class="glass-card account-card h-100" elevation="0">
          <div class="status-indicator" :class="statusColor(item.liveStatus || item.status)"></div>
          
          <v-card-text class="pa-6">
            <div class="d-flex align-center mb-4">
              <v-avatar size="56" class="mr-4 border-gold">
                <v-img :src="item.avatarUrl || 'https://stc-zaloid.zadn.vn/v2/images/default_avatar.png'" />
                <v-icon
                  v-if="item.type === 'facebook_page'"
                  size="18"
                  color="#1877F2"
                  class="type-icon-badge"
                >
                  mdi-facebook
                </v-icon>
              </v-avatar>
              <div class="overflow-hidden">
                <div class="text-h6 font-weight-bold text-truncate">{{ item.displayName || 'Chưa đặt tên' }}</div>
                <div class="text-caption text-medium-emphasis">
                  <v-icon size="12" class="mr-1">{{ item.type === 'facebook_page' ? 'mdi-facebook' : 'mdi-message-text' }}</v-icon>
                  {{ item.phone || item.zaloUid || 'Đang cập nhật...' }}
                </div>
              </div>
            </div>

            <div class="d-flex align-center justify-space-between mb-4">
              <v-chip
                :color="statusColor(item.liveStatus || item.status)"
                size="x-small"
                variant="flat"
                class="font-weight-bold text-uppercase"
                style="letter-spacing: 1px;"
              >
                {{ statusText(item.liveStatus || item.status) }}
              </v-chip>
              <span class="text-caption text-disabled">ID: {{ item.id.substring(0, 8) }}</span>
            </div>
          </v-card-text>

          <v-divider class="opacity-10" />
          
          <v-card-actions class="pa-3 bg-black-opacity">
            <v-btn
              v-if="item.liveStatus !== 'connected'"
              icon
              size="small"
              class="action-btn primary"
              @click="loginAccount(item.id)"
              title="Đăng nhập QR"
            >
              <v-icon size="18">mdi-qrcode-scan</v-icon>
            </v-btn>
            <v-btn
              v-if="item.liveStatus === 'disconnected' && item.sessionData"
              icon
              size="small"
              class="action-btn info"
              @click="reconnectAccount(item.id)"
              title="Kết nối lại"
            >
              <v-icon size="18">mdi-sync</v-icon>
            </v-btn>
            <v-btn
              v-if="authStore.isAdmin"
              icon
              size="small"
              class="action-btn cyan"
              @click="openAccess(item)"
              title="Phân quyền"
            >
              <v-icon size="18">mdi-shield-account-outline</v-icon>
            </v-btn>
            <v-btn
              icon
              size="small"
              class="action-btn success"
              @click="syncContacts(item.id)"
              :loading="syncing === item.id"
              title="Đồng bộ danh bạ"
            >
              <v-icon size="18">mdi-account-sync-outline</v-icon>
            </v-btn>
            <v-spacer />
            <v-btn
              icon
              size="small"
              color="error"
              variant="text"
              @click="confirmDelete(item)"
              title="Xóa"
            >
              <v-icon size="18">mdi-trash-can-outline</v-icon>
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Empty State -->
    <div v-else class="text-center py-16">
      <div class="empty-state-icon mb-6">
        <v-icon size="80" color="disabled">mdi-cellphone-link-off</v-icon>
      </div>
      <h2 class="text-h5 text-disabled mb-2">Chưa có tài khoản nào</h2>
      <p class="text-body-1 text-medium-emphasis mb-6">Hãy thêm tài khoản Zalo đầu tiên để bắt đầu quản lý</p>
      <v-btn color="primary" rounded="lg" class="px-8" @click="showAddDialog = true">Thêm ngay</v-btn>
    </div>

    <!-- Add Dialog -->
    <v-dialog v-model="showAddDialog" max-width="500">
      <v-card class="glass-card fallout-border" elevation="24">
        <v-card-title class="pa-6">
          <div class="text-h5 font-weight-bold">Thêm kết nối mới</div>
        </v-card-title>
        <v-card-text class="pa-6 pt-0">
          <v-tabs v-model="addType" grow class="mb-6" color="primary">
            <v-tab value="zalo">Zalo Cá nhân</v-tab>
            <v-tab value="facebook">Facebook Fanpage</v-tab>
          </v-tabs>

          <v-window v-model="addType">
            <v-window-item value="zalo">
              <p class="text-body-2 text-medium-emphasis mb-4">Nhập tên để gợi nhớ tài khoản Zalo này.</p>
              <v-text-field
                v-model="newAccountName"
                label="Tên hiển thị"
                placeholder="VD: Zalo CSKH 01"
                variant="outlined"
                rounded="lg"
                @keyup.enter="handleAddAccount"
              />
            </v-window-item>

            <v-window-item value="facebook">
              <v-alert type="info" variant="tonal" density="compact" class="mb-4 text-caption">
                Vui lòng cung cấp Page Access Token. Bạn có thể tạo token này từ trang Meta for Developers.
              </v-alert>
              <v-text-field
                v-model="fbAccessToken"
                label="Page Access Token"
                placeholder="EAAG...."
                variant="outlined"
                rounded="lg"
                type="password"
              />
            </v-window-item>
          </v-window>
        </v-card-text>
        <v-card-actions class="pa-6 pt-0">
          <v-spacer />
          <v-btn variant="text" rounded="lg" @click="showAddDialog = false">Hủy</v-btn>
          <v-btn
            color="primary"
            rounded="xl"
            variant="flat"
            class="px-8"
            :loading="adding"
            @click="handleUniversalAdd"
          >
            Bắt đầu kết nối
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- High-Tech QR Dialog -->
    <v-dialog v-model="showQRDialog" max-width="500" persistent>
      <v-card class="glass-card tech-qr-card overflow-hidden" elevation="24">
        <div class="pa-6 text-center">
          <div class="text-h5 font-weight-bold mb-1">Xác thực Zalo</div>
          <div class="text-caption text-medium-emphasis mb-6">Sử dụng ứng dụng Zalo để quét mã QR bên dưới</div>
          
          <div class="qr-container-outer">
            <!-- Loading State -->
            <div v-if="!qrImage && !qrScanned" class="qr-placeholder d-flex flex-column align-center justify-center">
              <v-progress-circular indeterminate color="primary" size="64" width="6" />
              <div class="mt-4 text-primary font-weight-bold animate-pulse">ĐANG TẠO MÃ QR...</div>
            </div>

            <!-- QR Image with Scanning Animation -->
            <div v-else-if="qrImage && !qrScanned" class="qr-scanner-box">
              <div class="scanner-corner tl"></div>
              <div class="scanner-corner tr"></div>
              <div class="scanner-corner bl"></div>
              <div class="scanner-corner br"></div>
              <div class="scanner-line"></div>
              <img :src="'data:image/png;base64,' + qrImage" alt="Zalo QR" class="qr-image" />
            </div>

            <!-- Scanned Success State -->
            <div v-else-if="qrScanned" class="qr-success-box d-flex flex-column align-center justify-center scale-in">
              <div class="success-ring mb-4">
                <v-icon icon="mdi-check" color="success" size="48" />
              </div>
              <div class="text-h6 font-weight-bold text-success">QUÉT THÀNH CÔNG!</div>
              <div class="text-body-2 mt-2">Xác nhận "Đăng nhập" trên điện thoại:</div>
              <div class="text-h5 color-cyan mt-1 font-weight-black">{{ scannedName || '...' }}</div>
            </div>
          </div>

          <!-- Instructions -->
          <div v-if="!qrScanned" class="instruction-steps mt-8 text-left">
            <div class="step d-flex align-center mb-3">
              <div class="step-num mr-3">1</div>
              <div class="text-body-2">Mở <strong>Zalo</strong> trên điện thoại</div>
            </div>
            <div class="step d-flex align-center mb-3">
              <div class="step-num mr-3">2</div>
              <div class="text-body-2">Nhấn vào biểu tượng <strong>Quét mã QR</strong></div>
            </div>
            <div class="step d-flex align-center">
              <div class="step-num mr-3">3</div>
              <div class="text-body-2">Hướng camera về phía mã QR này</div>
            </div>
          </div>

          <v-alert v-if="qrError" type="error" variant="tonal" density="compact" class="mt-6 rounded-lg">
            {{ qrError }}
          </v-alert>
        </div>

        <v-divider class="opacity-10" />
        <v-card-actions class="pa-6">
          <v-spacer />
          <v-btn variant="tonal" color="white" rounded="lg" class="px-8" @click="cancelQR">Hủy bỏ</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirm -->
    <v-dialog v-model="showDeleteDialog" max-width="400">
      <v-card class="glass-card" elevation="24">
        <v-card-title class="pa-6">Xác nhận xóa tài khoản?</v-card-title>
        <v-card-text class="px-6 pb-6 pt-0">
          Bạn có chắc muốn xóa <strong>{{ deleteTarget?.displayName || deleteTarget?.id }}</strong> khỏi hệ thống?
        </v-card-text>
        <v-card-actions class="pa-6 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="showDeleteDialog = false">Hủy</v-btn>
          <v-btn color="error" variant="flat" :loading="deleting" @click="handleDeleteAccount">Xóa ngay</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Access control dialog -->
    <ZaloAccessDialog
      v-model="showAccessDialog"
      :account-id="accessTarget?.id ?? ''"
      :account-name="accessTarget?.displayName ?? accessTarget?.id ?? ''"
    />
  </v-container>
</template>

<style scoped>
.gradient-text {
  background: var(--gradient-brand);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.glass-card {
  background: var(--color-surface-elevated) !important;
  border: 1px solid var(--color-border) !important;
  backdrop-filter: blur(16px);
  box-shadow: var(--shadow-sm);
  border-radius: 20px !important;
}

.account-card {
  border-radius: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.account-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
  border-color: var(--color-primary) !important;
}

.account-avatar {
  border: 2px solid var(--color-surface);
  box-shadow: var(--shadow-sm);
}

.last-sync {
  font-size: 11px;
  color: var(--color-text-muted);
}

.custom-card-text {
  color: var(--color-text-secondary);
}

.action-btn {
  background: var(--color-surface-muted) !important;
  border: 1px solid var(--color-border);
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: var(--color-primary-soft) !important;
  color: var(--color-primary);
  border-color: var(--color-primary-soft-strong);
  transform: scale(1.1);
}

.action-btn.success:hover {
  color: var(--color-success);
  border-color: var(--color-success-border);
  background: var(--color-success-soft) !important;
}

.action-btn.info:hover {
  color: var(--color-primary);
  border-color: var(--color-primary-soft-strong);
}

.action-btn.cyan:hover {
  color: var(--color-accent);
  border-color: var(--color-accent);
  background: var(--color-accent-soft) !important;
}

.status-indicator {
  position: absolute;
  inset: 18px 18px auto auto;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  box-shadow: 0 0 0 6px var(--color-surface);
}

.status-indicator.success {
  background: var(--color-success);
}

.status-indicator.warning {
  background: var(--color-warning);
}

.status-indicator.error {
  background: var(--color-danger);
}

.bg-black-opacity {
  background: var(--color-overlay);
  border-top: 1px solid var(--color-border);
}

.fallout-border {
  border: 1px solid var(--color-border-strong) !important;
}

.tech-qr-card {
  background: linear-gradient(180deg, var(--color-surface-elevated), var(--color-surface)) !important;
}

.qr-container-outer {
  width: 300px;
  height: 300px;
  margin: 0 auto;
  position: relative;
  background: var(--color-surface-muted);
  border: 1px solid var(--color-border);
  border-radius: 24px;
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qr-scanner-box {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qr-image {
  width: 250px;
  height: 250px;
  border-radius: 12px;
  z-index: 1;
}

.scanner-line {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: var(--color-primary);
  box-shadow: 0 0 15px 2px var(--color-primary-soft-strong);
  z-index: 2;
  animation: scan 2s infinite ease-in-out;
}

@keyframes scan {
  0% { top: 0; opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { top: 100%; opacity: 0; }
}

.scanner-corner {
  position: absolute;
  width: 25px;
  height: 25px;
  border: 3px solid var(--color-primary);
  z-index: 3;
}

.tl { top: -2px; left: -2px; border-right: none; border-bottom: none; border-radius: 12px 0 0 0; }
.tr { top: -2px; right: -2px; border-left: none; border-bottom: none; border-radius: 0 12px 0 0; }
.bl { bottom: -2px; left: -2px; border-right: none; border-top: none; border-radius: 0 0 0 12px; }
.br { bottom: -2px; right: -2px; border-left: none; border-top: none; border-radius: 0 0 12px 0; }

.step-num {
  width: 24px;
  height: 24px;
  background: var(--gradient-brand);
  color: var(--color-text-inverse);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}

.animate-pulse {
  animation: pulse 1.5s infinite ease-in-out;
}

@keyframes pulse {
  0% { opacity: 0.5; }
  50% { opacity: 1; }
  100% { opacity: 0.5; }
}

.scale-in {
  animation: scaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes scaleIn {
  0% { transform: scale(0.8); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.success-ring {
  width: 80px;
  height: 80px;
  border: 4px solid var(--color-success);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.border-gold {
  border: 2px solid var(--color-primary-soft-strong);
}

.color-cyan {
  color: var(--color-primary);
}

.type-icon-badge {
  position: absolute;
  bottom: -2px;
  right: -2px;
  background: white;
  border-radius: 50%;
  padding: 1px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}
</style>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useZaloAccounts, type ZaloAccount } from '@/composables/use-zalo-accounts';
import { useAuthStore } from '@/stores/auth';
import ZaloAccessDialog from '@/components/settings/ZaloAccessDialog.vue';
import { api } from '@/api/index';

const {
  accounts, loading, adding, deleting,
  showQRDialog, qrImage, qrScanned, scannedName, qrError,
  statusColor, statusText,
  fetchAccounts, addAccount, loginAccount, reconnectAccount, deleteAccount,
  cancelQR, setupSocket,
} = useZaloAccounts();

const authStore = useAuthStore();

const showAddDialog = ref(false);
const syncing = ref<string | null>(null);
const showDeleteDialog = ref(false);
const showAccessDialog = ref(false);
const newAccountName = ref('');
const fbAccessToken = ref('');
const addType = ref('zalo');
const deleteTarget = ref<ZaloAccount | null>(null);
const accessTarget = ref<ZaloAccount | null>(null);

async function handleUniversalAdd() {
  if (addType.value === 'zalo') {
    await handleAddAccount();
  } else {
    await handleAddFacebook();
  }
}

async function handleAddFacebook() {
  if (!fbAccessToken.value) return alert('Vui lòng nhập Access Token');
  adding.value = true;
  try {
    await api.post('/facebook/link-page', { accessToken: fbAccessToken.value });
    showAddDialog.value = false;
    fbAccessToken.value = '';
    await fetchAccounts();
  } catch (err: any) {
    alert(err.response?.data?.error || 'Lỗi kết nối Fanpage');
  } finally {
    adding.value = false;
  }
}

async function syncContacts(accountId: string) {
  syncing.value = accountId;
  try {
    const res = await api.post(`/zalo-accounts/${accountId}/sync-contacts`);
    alert(`Đồng bộ thành công: ${res.data.created} mới, ${res.data.updated} cập nhật`);
  } catch (err: any) {
    alert('Đồng bộ thất bại: ' + (err.response?.data?.error || err.message));
  } finally {
    syncing.value = null;
  }
}

async function handleAddAccount() {
  const ok = await addAccount(newAccountName.value);
  if (ok) {
    showAddDialog.value = false;
    newAccountName.value = '';
  }
}

function confirmDelete(account: ZaloAccount) {
  deleteTarget.value = account;
  showDeleteDialog.value = true;
}

function openAccess(account: ZaloAccount) {
  accessTarget.value = account;
  showAccessDialog.value = true;
}

async function handleDeleteAccount() {
  if (!deleteTarget.value) return;
  const ok = await deleteAccount(deleteTarget.value);
  if (ok) {
    showDeleteDialog.value = false;
    deleteTarget.value = null;
  }
}

onMounted(() => {
  fetchAccounts();
  setupSocket();
});
</script>
