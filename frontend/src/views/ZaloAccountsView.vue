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
        Thêm kết nối
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
          <div class="status-indicator" :class="statusColor(getAccountStatus(item))"></div>
          
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
                  {{ item.phone || item.zaloUid || item.fbPageId || 'Đang cập nhật...' }}
                </div>
              </div>
            </div>

            <div class="d-flex align-center justify-space-between mb-4">
              <v-chip
                :color="statusColor(getAccountStatus(item))"
                size="x-small"
                variant="flat"
                class="font-weight-bold text-uppercase"
                style="letter-spacing: 1px;"
              >
                {{ statusText(getAccountStatus(item)) }}
              </v-chip>
              <span class="text-caption text-disabled">ID: {{ item.id.substring(0, 8) }}</span>
            </div>
          </v-card-text>

          <v-divider class="opacity-10" />
          
          <v-card-actions class="pa-3 bg-black-opacity">
            <v-btn
              v-if="isRealtimeZaloAccount(item) && getAccountStatus(item) !== 'connected'"
              icon
              size="small"
              class="action-btn primary"
              @click="loginAccount(item.id)"
              title="Đăng nhập QR"
            >
              <v-icon size="18">mdi-qrcode-scan</v-icon>
            </v-btn>
            <v-btn
              v-if="isRealtimeZaloAccount(item) && item.hasSession"
              icon
              size="small"
              class="action-btn info"
              @click="reconnectAccount(item.id)"
              :title="getAccountStatus(item) === 'connected' ? 'Làm mới kết nối' : 'Kết nối lại nhanh'"
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
        <v-icon size="80" color="disabled">mdi-connection</v-icon>
      </div>
      <h2 class="text-h5 text-disabled mb-2">Chưa có kết nối nào</h2>
      <p class="text-body-1 text-medium-emphasis mb-6">Hãy thêm kênh kết nối đầu tiên để bắt đầu quản lý</p>
      <v-btn color="primary" rounded="lg" class="px-8" @click="showAddDialog = true">Thêm ngay</v-btn>
    </div>

    <!-- Add Dialog (Pancake Style) -->
    <v-dialog v-model="showAddDialog" max-width="900" persistent>
      <v-card class="add-connection-card overflow-hidden" elevation="24">
        <v-btn
          icon="mdi-close"
          variant="text"
          size="small"
          class="close-btn"
          @click="showAddDialog = false"
        ></v-btn>

        <div class="d-flex h-100 flex-column flex-sm-row">
          <!-- Sidebar trái -->
          <div class="sidebar-add-connection pa-4 bg-grey-lighten-4 border-right">
            <div class="text-overline font-weight-bold mb-4 px-2 text-grey">KÊNH KẾT NỐI</div>
            
            <v-list density="comfortable" nav class="bg-transparent pa-0">
              <v-list-item
                :active="addType === 'zalo'"
                active-color="primary"
                rounded="lg"
                class="mb-2 sidebar-item"
                @click="addType = 'zalo'"
              >
                <template v-slot:prepend>
                  <v-avatar size="32" class="mr-3" color="white" elevation="1">
                    <v-img src="https://upload.wikimedia.org/wikipedia/commons/9/91/Icon_of_Zalo.svg" />
                  </v-avatar>
                </template>
                <v-list-item-title class="font-weight-bold">Zalo</v-list-item-title>
              </v-list-item>

              <v-list-item
                :active="addType === 'facebook'"
                active-color="blue-darken-2"
                rounded="lg"
                class="mb-2 sidebar-item"
                @click="addType = 'facebook'"
              >
                <template v-slot:prepend>
                  <v-avatar size="32" class="mr-3" color="blue-lighten-5">
                    <v-icon color="blue-darken-2">mdi-facebook</v-icon>
                  </v-avatar>
                </template>
                <v-list-item-title class="font-weight-bold">Facebook</v-list-item-title>
              </v-list-item>

              <v-divider class="my-3" />

              <v-list-item
                v-for="item in ['Instagram', 'TikTok', 'WhatsApp', 'Telegram']"
                :key="item"
                disabled
                rounded="lg"
                class="mb-2 opacity-50"
              >
                <template v-slot:prepend>
                  <v-avatar size="32" class="mr-3" color="grey-lighten-3">
                    <v-icon color="grey-darken-1" size="20">
                      {{ 
                        item === 'Instagram' ? 'mdi-instagram' : 
                        item === 'TikTok' ? 'mdi-music-note' : 
                        item === 'WhatsApp' ? 'mdi-whatsapp' : 'mdi-telegram'
                      }}
                    </v-icon>
                  </v-avatar>
                </template>
                <v-list-item-title>{{ item }}</v-list-item-title>
                <template v-slot:append>
                  <v-chip size="x-small" color="orange" variant="flat">Beta</v-chip>
                </template>
              </v-list-item>
            </v-list>
          </div>

          <!-- Nội dung phải -->
          <div class="flex-grow-1 d-flex flex-column bg-white content-area">
            <div class="pa-6 border-bottom header-section">
              <div class="d-flex align-center mb-1">
                <v-icon :color="addType === 'zalo' ? 'primary' : 'blue-darken-2'" class="mr-2">
                  {{ addType === 'zalo' ? 'mdi-chat' : 'mdi-facebook' }}
                </v-icon>
                <div class="text-h6 font-weight-bold">Kết nối {{ addType === 'zalo' ? 'Zalo' : 'Facebook' }}</div>
              </div>
              <div class="text-body-2 text-medium-emphasis">Quản lý tập trung tin nhắn và sử dụng AI trợ lý cho {{ addType === 'zalo' ? 'Zalo' : 'Fanpage' }} của bạn.</div>
            </div>

            <div class="pa-8 flex-grow-1 overflow-y-auto">
              <v-window v-model="addType" touchless>
                <!-- Zalo Content -->
                <v-window-item value="zalo">
                  <div class="d-flex flex-column flex-md-row align-center align-md-start justify-center gap-10">
                    <div class="text-center" style="width: 280px">
                      <div v-if="qrError" class="py-4">
                        <v-alert type="error" variant="tonal" class="mb-4 text-left text-caption">{{ qrError }}</v-alert>
                        <v-btn color="primary" variant="flat" rounded="lg" block @click="resetZaloAdd">Thử lại</v-btn>
                      </div>
                      
                      <div v-else-if="qrScanned" class="py-8 scale-in">
                        <div class="avatar-wrapper mb-6">
                          <v-avatar size="120" class="border-gold elevation-10">
                            <v-img :src="qrAvatar || '/default-avatar.png'" />
                          </v-avatar>
                          <div class="scanned-badge">
                            <v-icon size="20" color="white">mdi-check</v-icon>
                          </div>
                        </div>
                        <div class="text-h6 font-weight-bold mb-1">{{ scannedName }}</div>
                        <div class="text-body-2 text-success font-weight-bold">QUÉT THÀNH CÔNG!</div>
                        <p class="text-caption text-medium-emphasis mt-4 px-4">
                          Bấm <strong>Xác nhận</strong> trên điện thoại để hoàn tất.
                        </p>
                        <v-progress-linear indeterminate color="success" rounded height="6" class="mt-6 mx-auto" style="width: 150px" />
                      </div>

                      <div v-else-if="qrImage" class="scale-in">
                        <div class="qr-frame pa-2 mb-4 bg-white rounded-xl d-inline-block border elevation-4">
                          <v-img :src="'data:image/png;base64,' + qrImage" width="240" height="240" aspect-ratio="1" />
                        </div>
                        <div class="text-caption text-medium-emphasis d-flex align-center justify-center">
                          <v-icon size="14" class="mr-1">mdi-update</v-icon>
                          Mã QR sẽ tự động cập nhật
                        </div>
                      </div>

                      <div v-else class="py-12">
                        <v-progress-circular indeterminate color="primary" size="64" width="6" />
                        <p class="mt-4 text-body-1 font-weight-medium">Đang khởi tạo...</p>
                      </div>
                    </div>

                    <div class="flex-grow-1 ml-md-10 mt-10 mt-md-0" style="max-width: 400px">
                      <div class="text-subtitle-1 font-weight-bold mb-6 color-cyan">HƯỚNG DẪN KẾT NỐI</div>
                      
                      <div class="instruction-steps">
                        <div class="step-item d-flex align-start mb-6">
                          <div class="step-num mr-4">1</div>
                          <div>
                            <div class="text-body-2 font-weight-bold mb-1">Mở ứng dụng Zalo</div>
                            <div class="text-caption text-medium-emphasis">Mở ứng dụng Zalo trên điện thoại di động của bạn</div>
                          </div>
                        </div>
                        
                        <div class="step-item d-flex align-start mb-6">
                          <div class="step-num mr-4">2</div>
                          <div>
                            <div class="text-body-2 font-weight-bold mb-1">Chọn quét mã QR</div>
                            <div class="text-caption text-medium-emphasis">Nhấn vào biểu tượng <strong>Quét mã QR</strong> ở góc trên bên phải màn hình.</div>
                          </div>
                        </div>
                        
                        <div class="step-item d-flex align-start">
                          <div class="step-num mr-4">3</div>
                          <div>
                            <div class="text-body-2 font-weight-bold mb-1">Xác nhận đăng nhập</div>
                            <div class="text-caption text-medium-emphasis">Hướng camera vào mã QR và nhấn <strong>Đăng nhập</strong> trên điện thoại.</div>
                          </div>
                        </div>
                      </div>

                      <v-divider class="my-8" />
                      
                      <v-alert
                        icon="mdi-shield-lock-outline"
                        color="green-lighten-5"
                        class="text-caption text-green-darken-3 border-success-subtle"
                        variant="flat"
                        rounded="lg"
                      >
                        Kết nối an toàn qua giao thức mã hóa Zalo. Chúng tôi không lưu trữ mật khẩu của bạn.
                      </v-alert>
                    </div>
                  </div>
                </v-window-item>

                <!-- Facebook Content -->
                <v-window-item value="facebook">
                  <div v-if="!fbPages.length" class="text-center py-12 px-6">
                    <v-avatar size="100" color="blue-lighten-5" class="mb-6 elevation-2">
                      <v-icon color="blue-darken-2" size="48">mdi-facebook</v-icon>
                    </v-avatar>
                    <div class="text-h5 font-weight-bold mb-2">Facebook Messenger</div>
                    <p class="text-body-2 text-medium-emphasis mb-10 mx-auto" style="max-width: 450px">
                      Kết nối các Fanpage bạn đang quản lý để tự động hóa trả lời tin nhắn, bình luận và phân loại khách hàng bằng AI.
                    </p>
                    
                    <v-btn
                      size="x-large"
                      rounded="pill"
                      color="blue-darken-2"
                      class="px-12 text-white font-weight-bold elevation-6"
                      prepend-icon="mdi-facebook"
                      :loading="adding"
                      @click="handleFacebookLogin"
                    >
                      Kết nối ngay
                    </v-btn>

                    <div class="mt-8 text-caption text-disabled d-flex align-center justify-center">
                      <v-icon size="14" class="mr-1 text-success">mdi-check-decagram</v-icon>
                      Chính thức qua Meta Graph API
                    </div>
                  </div>

                  <div v-else class="scale-in">
                    <div class="d-flex align-center justify-space-between mb-6">
                      <div>
                        <div class="text-subtitle-1 font-weight-bold">Chọn Fanpage muốn kết nối</div>
                        <div class="text-caption text-medium-emphasis">Chúng tôi tìm thấy {{ fbPages.length }} trang bạn quản lý</div>
                      </div>
                      <v-btn variant="tonal" size="small" color="primary" rounded="lg" @click="fbPages = []">
                        <v-icon start size="14">mdi-account-switch</v-icon> Đổi tài khoản
                      </v-btn>
                    </div>
                    
                    <v-text-field
                      v-model="fbPageSearch"
                      placeholder="Tìm kiếm tên trang hoặc ID..."
                      variant="outlined"
                      density="comfortable"
                      rounded="lg"
                      prepend-inner-icon="mdi-magnify"
                      class="mb-4"
                      hide-details
                    />

                    <div class="fb-page-list-container border rounded-xl overflow-hidden mt-2">
                      <v-list class="pa-0 overflow-y-auto" max-height="350">
                        <template v-for="(page, i) in filteredFbPages" :key="page.id">
                          <v-list-item class="pa-4 hover-list-item">
                            <template v-slot:prepend>
                              <v-avatar size="56" class="mr-4 border" color="grey-lighten-4">
                                <v-img :src="`https://graph.facebook.com/${page.id}/picture?type=large`" />
                              </v-avatar>
                            </template>
                            
                            <v-list-item-title class="font-weight-bold text-subtitle-1">{{ page.name }}</v-list-item-title>
                            <v-list-item-subtitle class="text-caption text-medium-emphasis">ID: {{ page.id }}</v-list-item-subtitle>

                            <template v-slot:append>
                              <v-btn
                                v-if="!isPageConnected(page.id)"
                                color="primary"
                                size="small"
                                rounded="lg"
                                variant="flat"
                                class="px-6 font-weight-bold"
                                :loading="linkingPageId === page.id"
                                @click="handleLinkFbPage(page)"
                              >
                                Kích hoạt
                              </v-btn>
                              <v-chip v-else color="success" size="small" variant="tonal" class="font-weight-bold px-4" prepend-icon="mdi-check">Đã kết nối</v-chip>
                            </template>
                          </v-list-item>
                          <v-divider v-if="i < filteredFbPages.length - 1" class="opacity-5" />
                        </template>
                      </v-list>
                    </div>
                  </div>
                </v-window-item>
              </v-window>
            </div>
          </div>
        </div>
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
        <v-card-title class="pa-6">Xác nhận xóa kết nối?</v-card-title>
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
.add-connection-card {
  border-radius: 24px !important;
  background: white !important;
  height: 650px;
}

.sidebar-add-connection {
  width: 240px;
  flex-shrink: 0;
  border-right: 1px solid rgba(0, 0, 0, 0.05);
}

.sidebar-item {
  transition: all 0.2s ease;
}

.sidebar-item:hover:not(.v-list-item--active) {
  background: rgba(0, 0, 0, 0.03);
}

.content-area {
  min-width: 0;
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
  color: #999;
}

.header-section {
  background: linear-gradient(to bottom, #fafafa, #ffffff);
}

.qr-frame {
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.05) !important;
}

.step-num {
  width: 28px;
  height: 28px;
  background: #f0f0f0;
  color: #666;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
}

.instruction-steps .step-item:nth-child(1) .step-num,
.instruction-steps .step-item:nth-child(2) .step-num,
.instruction-steps .step-item:nth-child(3) .step-num {
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.avatar-wrapper {
  position: relative;
  display: inline-block;
}

.scanned-badge {
  position: absolute;
  bottom: 0;
  right: 0;
  background: var(--color-success);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 4px solid white;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hover-list-item {
  transition: background 0.2s ease;
}

.hover-list-item:hover {
  background: #fcfcfc;
}

.fb-page-list-container {
  border: 1px solid rgba(0, 0, 0, 0.05);
}

/* Glass & Tech Styles from previous design */
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

.status-indicator {
  position: absolute;
  inset: 18px 18px auto auto;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  box-shadow: 0 0 0 6px var(--color-surface);
}

.status-indicator.success { background: var(--color-success); }
.status-indicator.warning { background: var(--color-warning); }
.status-indicator.error { background: var(--color-danger); }

.bg-black-opacity {
  background: var(--color-overlay);
  border-top: 1px solid var(--color-border);
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

.animate-pulse { animation: pulse 1.5s infinite ease-in-out; }
@keyframes pulse {
  0% { opacity: 0.5; }
  50% { opacity: 1; }
  100% { opacity: 0.5; }
}

.scale-in { animation: scaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
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

.border-gold { border: 2px solid var(--color-primary-soft-strong); }
.color-cyan { color: var(--color-primary); }

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
import { ref, onMounted, computed, watch, nextTick } from 'vue';
import { useZaloAccounts, type ZaloAccount } from '@/composables/use-zalo-accounts';
import { useAuthStore } from '@/stores/auth';
import ZaloAccessDialog from '@/components/settings/ZaloAccessDialog.vue';
import { api } from '@/api/index';

const {
  accounts, loading, adding, deleting,
  showQRDialog, qrImage, qrScanned, scannedName, qrAvatar, qrError,
  getAccountStatus, isRealtimeZaloAccount, statusColor, statusText,
  fetchAccounts, addAccount, loginAccount, reconnectAccount, deleteAccount,
  cancelQR, setupSocket,
} = useZaloAccounts();

const authStore = useAuthStore();

const showAddDialog = ref(false);
const syncing = ref<string | null>(null);
const showDeleteDialog = ref(false);
const showAccessDialog = ref(false);
const newAccountName = ref('');
const fbPages = ref<any[]>([]);
const fbPageSearch = ref('');
const linkingPageId = ref<string | null>(null);
const addType = ref('zalo');
const deleteTarget = ref<ZaloAccount | null>(null);
const accessTarget = ref<ZaloAccount | null>(null);
const facebookOauthPopup = ref<Window | null>(null);
const isAutoAddingZalo = ref(false);

function resetZaloAdd() {
  qrImage.value = '';
  qrScanned.value = false;
  scannedName.value = '';
  qrError.value = '';
  isAutoAddingZalo.value = false;
  const currentType = addType.value;
  addType.value = '';
  nextTick(() => {
    addType.value = currentType;
  });
}

// Tự động kích hoạt luồng quét mã Zalo khi chọn tab Zalo trong Dialog thêm mới
watch([showAddDialog, addType], async ([newShow, newType]) => {
  if (newShow && newType === 'zalo' && !isAutoAddingZalo.value) {
    isAutoAddingZalo.value = true;
    try {
      const resp = await api.post('/zalo-accounts', { displayName: 'Đang kết nối...' });
      const newAcc = resp.data;
      await fetchAccounts();
      loginAccount(newAcc.id, true); // silent = true
    } catch (err: any) {
      qrError.value = err.response?.data?.error || 'Không thể khởi tạo kết nối Zalo';
    }
  } else if (!newShow) {
    qrImage.value = '';
    qrScanned.value = false;
    scannedName.value = '';
    qrError.value = '';
    isAutoAddingZalo.value = false;
  }
});

// Đóng dialog thêm mới khi Zalo đã kết nối thành công (thông qua silent login)
watch(showQRDialog, (val) => {
  if (!val && showAddDialog.value && addType.value === 'zalo' && qrScanned.value) {
    showAddDialog.value = false;
  }
});

type FacebookOAuthMessage = {
  source: 'facebook-oauth-callback';
  code?: string;
  state?: string | null;
  error?: string | null;
  errorDescription?: string | null;
};

const filteredFbPages = computed(() => {
  if (!fbPageSearch.value) return fbPages.value;
  const s = fbPageSearch.value.toLowerCase();
  return fbPages.value.filter(p => p.name.toLowerCase().includes(s) || p.id.includes(s));
});

function isPageConnected(pageId: string) {
  return accounts.value.some(a => a.fbPageId === pageId);
}

async function loadFbPages(token: string) {
  adding.value = true;
  try {
    const res = await api.get('/facebook/list-pages', { params: { userToken: token } });
    fbPages.value = res.data;
  } catch (err: any) {
    alert(err.response?.data?.error || 'Lỗi lấy danh sách Fanpage');
  } finally {
    adding.value = false;
  }
}

async function handleFacebookLogin() {
  adding.value = true;

  try {
    const redirectUri = `${window.location.origin}/facebook/callback`;
    const state = window.crypto.randomUUID();
    const configRes = await api.get('/facebook/oauth/config');
    const { appId, apiVersion } = configRes.data as { appId: string; apiVersion: string };
    const scopes = [
      'pages_messaging',
      'pages_show_list',
      'pages_manage_metadata',
    ].join(',');

    const oauthUrl = new URL(`https://www.facebook.com/${apiVersion}/dialog/oauth`);
    oauthUrl.search = new URLSearchParams({
      client_id: appId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scopes,
      state,
    }).toString();

    const popup = window.open(
      oauthUrl.toString(),
      'facebook-login',
      'width=640,height=760,menubar=no,toolbar=no,status=no'
    );

    if (!popup) {
      throw new Error('Trinh duyet da chan popup dang nhap Facebook.');
    }

    facebookOauthPopup.value = popup;
    const code = await waitForFacebookOauthCode(state, popup) as string;
    const exchangeRes = await api.post('/facebook/oauth/exchange-code', {
      code,
      redirectUri,
    });

    await loadFbPages(exchangeRes.data.accessToken);
  } catch (err: any) {
    alert(err.response?.data?.error || err.message || 'Loi ket noi Facebook Fanpage');
  } finally {
    facebookOauthPopup.value?.close();
    facebookOauthPopup.value = null;
    adding.value = false;
  }
}

function waitForFacebookOauthCode(expectedState: string, popup: Window) {
  return new Promise<string>((resolve, reject) => {
    let settled = false;

    const cleanup = () => {
      window.clearTimeout(timeout);
      window.clearInterval(popupWatch);
      window.removeEventListener('message', onMessage);
    };

    const finish = (handler: () => void) => {
      if (settled) return;
      settled = true;
      cleanup();
      handler();
    };

    const timeout = window.setTimeout(() => {
      finish(() => reject(new Error('Het thoi gian dang nhap Facebook. Vui long thu lai.')));
    }, 120000);

    const popupWatch = window.setInterval(() => {
      if (popup.closed) {
        finish(() => reject(new Error('Ban da dong cua so dang nhap Facebook.')));
      }
    }, 400);

    const onMessage = (event: MessageEvent<FacebookOAuthMessage>) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.source !== 'facebook-oauth-callback') return;

      finish(() => {
        if (event.data.state !== expectedState) {
          reject(new Error('OAuth state khong hop le.'));
          return;
        }

        if (event.data.error) {
          reject(new Error(event.data.errorDescription || event.data.error));
          return;
        }

        if (!event.data.code) {
          reject(new Error('Facebook khong tra ve ma xac thuc.'));
          return;
        }

        resolve(event.data.code);
      });
    };

    window.addEventListener('message', onMessage);
  });
}

async function handleLinkFbPage(page: any) {
  linkingPageId.value = page.id;
  try {
    await api.post('/facebook/link-page', { 
      accessToken: page.accessToken,
      pageId: page.id,
      pageName: page.name,
      avatarUrl: page.avatarUrl,
    });
    await fetchAccounts();
  } catch (err: any) {
    alert(err.response?.data?.error || 'Lỗi kết nối Fanpage');
  } finally {
    linkingPageId.value = null;
  }
}

async function handleUniversalAdd() {
  if (addType.value === 'zalo') {
    await handleAddAccount();
  } else {
    // Facebook uses inline activation from list
  }
}

async function syncContacts(accountId: string) {
  syncing.value = accountId;
  try {
    const account = accounts.value.find(item => item.id === accountId);

    if (account?.channelType === 'facebook') {
      await api.post(`/facebook/accounts/${accountId}/subscribe-webhooks`);
      await fetchAccounts();
      alert('Đã đồng bộ lại webhook Fanpage. Hãy thử nhắn tin vào trang thêm một lần nữa.');
      return;
    }

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
