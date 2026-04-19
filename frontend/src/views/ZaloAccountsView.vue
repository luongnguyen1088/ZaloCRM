<template>
  <v-container fluid class="pa-6">
    <!-- Header Section -->
    <div class="d-flex align-center mb-8">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1">Kết nối Zalo</h1>
        <p class="text-medium-emphasis mb-0">Quản lý và kết nối nhiều tài khoản Zalo cá nhân</p>
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
              </v-avatar>
              <div class="overflow-hidden">
                <div class="text-h6 font-weight-bold text-truncate">{{ item.displayName || 'Chưa đặt tên' }}</div>
                <div class="text-caption text-medium-emphasis">{{ item.phone || item.zaloUid || 'Đang cập nhật...' }}</div>
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
    <v-dialog v-model="showAddDialog" max-width="450">
      <v-card class="glass-card fallout-border" elevation="24">
        <v-card-title class="pa-6">
          <div class="text-h5 font-weight-bold">Thêm tài khoản mới</div>
        </v-card-title>
        <v-card-text class="pa-6 pt-0">
          <p class="text-body-2 text-medium-emphasis mb-4">Nhập tên để gợi nhớ tài khoản này trong hệ thống của bạn.</p>
          <v-text-field
            v-model="newAccountName"
            label="Tên hiển thị"
            placeholder="VD: Zalo CSKH 01"
            variant="outlined"
            rounded="lg"
            hide-details
            autofocus
          />
        </v-card-text>
        <v-card-actions class="pa-6 pt-0">
          <v-spacer />
          <v-btn variant="text" rounded="lg" @click="showAddDialog = false">Hủy</v-btn>
          <v-btn color="primary" rounded="lg" variant="flat" :loading="adding" @click="handleAddAccount">Thêm tài khoản</v-btn>
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
.glass-card {
  background: rgba(255, 255, 255, 0.03) !important;
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  border-radius: 20px !important;
  position: relative;
  overflow: hidden;
}

.account-card {
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.account-card:hover {
  transform: translateY(-8px);
  background: rgba(255, 255, 255, 0.06) !important;
  border-color: rgba(var(--v-theme-primary), 0.5) !important;
  box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.5) !important;
}

.status-indicator {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: #666;
}
.status-indicator.success { background: linear-gradient(90deg, #4CAF50, #8BC34A); }
.status-indicator.error { background: linear-gradient(90deg, #F44336, #E91E63); }
.status-indicator.primary { background: linear-gradient(90deg, #2196F3, #00BCD4); }

.bg-black-opacity {
  background: rgba(0, 0, 0, 0.2);
}

.action-btn {
  background: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.2s ease;
}
.action-btn:hover {
  background: rgba(255, 255, 255, 0.15) !important;
  transform: scale(1.1);
}
.action-btn.primary:hover { color: #2196F3; border-color: #2196F3; }
.action-btn.success:hover { color: #4CAF50; border-color: #4CAF50; }
.action-btn.info:hover { color: #00BCD4; border-color: #00BCD4; }
.action-btn.cyan:hover { color: #00E5FF; border-color: #00E5FF; }

/* QR Scanner Animation */
.qr-container-outer {
  width: 300px;
  height: 300px;
  margin: 0 auto;
  position: relative;
  background: rgba(0, 0, 0, 0.3);
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
  background: rgba(33, 150, 243, 0.8);
  box-shadow: 0 0 15px 2px #2196F3;
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
  border: 3px solid #2196F3;
  z-index: 3;
}
.tl { top: -2px; left: -2px; border-right: none; border-bottom: none; border-radius: 12px 0 0 0; }
.tr { top: -2px; right: -2px; border-left: none; border-bottom: none; border-radius: 0 12px 0 0; }
.bl { bottom: -2px; left: -2px; border-right: none; border-top: none; border-radius: 0 0 0 12px; }
.br { bottom: -2px; right: -2px; border-left: none; border-top: none; border-radius: 0 0 12px 0; }

.step-num {
  width: 24px;
  height: 24px;
  background: #2196F3;
  color: white;
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
  border: 4px solid #4CAF50;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.border-gold {
  border: 2px solid rgba(255, 215, 0, 0.3);
}

.color-cyan {
  color: #00E5FF;
}
</style>

    <!-- Delete confirm dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="400">
      <v-card>
        <v-card-title>Xác nhận xóa</v-card-title>
        <v-card-text>Bạn có chắc muốn xóa tài khoản "{{ deleteTarget?.displayName || deleteTarget?.id }}"?</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="showDeleteDialog = false">Hủy</v-btn>
          <v-btn color="error" :loading="deleting" @click="handleDeleteAccount">Xóa</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Access control dialog -->
    <ZaloAccessDialog
      v-model="showAccessDialog"
      :account-id="accessTarget?.id ?? ''"
      :account-name="accessTarget?.displayName ?? accessTarget?.id ?? ''"
    />
  </div>
</template>

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
const deleteTarget = ref<ZaloAccount | null>(null);
const accessTarget = ref<ZaloAccount | null>(null);

const headers = [
  { title: 'Tên', key: 'displayName', sortable: true },
  { title: 'Zalo UID', key: 'zaloUid' },
  { title: 'SĐT', key: 'phone' },
  { title: 'Trạng thái', key: 'status', sortable: true },
  { title: 'Hành động', key: 'actions', sortable: false, align: 'end' as const },
];

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
