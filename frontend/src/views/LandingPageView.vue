<template>
  <div class="landing-page">
    <!-- Navbar -->
    <v-app-bar flat class="glass-navbar px-4" height="80">
      <div class="d-flex align-center cursor-pointer" @click="$router.push('/')">
        <v-icon size="36" color="primary" class="mr-2">mdi-lightning-bolt</v-icon>
        <span class="text-h6 font-weight-black text-gradient">ZaloCRM</span>
      </div>
      <v-spacer></v-spacer>
      <div class="d-none d-md-flex align-center gap-6 mr-6">
        <a href="#features" class="nav-link">Tính năng</a>
        <a href="#how-it-works" class="nav-link">Cách hoạt động</a>
        <router-link to="/pricing" class="nav-link">Bảng giá</router-link>
      </div>
      <v-btn
        v-if="!isAuthenticated"
        variant="text"
        class="font-weight-bold mr-2 text-none"
        to="/login"
      >
        Đăng nhập
      </v-btn>
      <v-btn
        v-if="!isAuthenticated"
        color="primary"
        variant="flat"
        class="font-weight-bold text-none rounded-pill px-6"
        to="/register"
      >
        Dùng thử miễn phí
      </v-btn>
      <v-btn
        v-else
        color="primary"
        variant="flat"
        class="font-weight-bold text-none rounded-pill px-6"
        to="/dashboard"
      >
        Vào Dashboard
      </v-btn>
    </v-app-bar>

    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-container text-center">
        <div class="hero-badge mx-auto mb-6">
          <v-icon size="18" color="primary" class="mr-2">mdi-rocket-launch</v-icon>
          <span>Nền tảng CRM toàn diện cho Social Commerce</span>
        </div>
        
        <h1 class="hero-title mb-6">
          Quản lý tin nhắn Zalo, Đơn hàng <br class="d-none d-md-block" />
          <span class="text-gradient">Tích hợp POS thời gian thực</span>
        </h1>
        
        <p class="hero-subtitle mb-8 mx-auto">
          Tối ưu hóa quy trình bán hàng, từ tin nhắn khách hàng, tạo đơn in qua Pancake POS, 
          đến quản lý tài chính và sản xuất chỉ trên một giao diện duy nhất.
        </p>
        
        <div class="d-flex flex-column flex-sm-row justify-center gap-4 mb-12">
          <v-btn
            size="x-large"
            color="primary"
            class="text-none rounded-pill px-8 btn-primary-gradient"
            elevation="4"
            to="/register"
          >
            Bắt đầu miễn phí
            <v-icon end>mdi-arrow-right</v-icon>
          </v-btn>
          <v-btn
            size="x-large"
            variant="outlined"
            class="text-none rounded-pill px-8"
            color="primary"
            to="/login"
          >
            Đăng nhập Workspace
          </v-btn>
        </div>

        <div class="hero-image-container glow-border glass-dark mx-auto">
          <div class="window-controls">
            <span class="dot red"></span>
            <span class="dot yellow"></span>
            <span class="dot green"></span>
          </div>
          <v-img :src="heroIllustration" class="rounded-b-lg" cover></v-img>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="features-section py-16">
      <v-container>
        <div class="text-center mb-16">
          <h2 class="section-title mb-4">Mọi thứ bạn cần để bứt phá doanh thu</h2>
          <p class="section-subtitle mx-auto">Không cần chuyển đổi giữa hàng tá công cụ, ZaloCRM mang đến giải pháp All-in-One.</p>
        </div>

        <v-row>
          <v-col v-for="(feature, index) in features" :key="index" cols="12" md="4">
            <v-card class="feature-card glass-premium h-100 pa-6" elevation="0">
              <div class="feature-icon-wrapper mb-6">
                <v-icon :icon="feature.icon" size="32" color="primary"></v-icon>
              </div>
              <h3 class="text-h6 font-weight-bold mb-3">{{ feature.title }}</h3>
              <p class="text-body-1 text-medium-emphasis">{{ feature.description }}</p>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <!-- POS Integration Highlight -->
    <section class="integration-section py-16">
      <v-container>
        <v-row class="align-center">
          <v-col cols="12" md="6" class="pr-md-12">
            <div class="mb-4">
              <v-chip color="secondary" variant="flat" size="small" class="font-weight-bold mb-4 text-uppercase">Tích hợp sâu</v-chip>
            </div>
            <h2 class="section-title mb-6" style="text-align: left;">Đồng bộ hoàn hảo với <span class="text-gradient">Pancake POS</span></h2>
            <p class="text-body-1 text-medium-emphasis mb-6">
              Bạn đang sử dụng Pancake POS? ZaloCRM kết nối trực tiếp thông qua API, cho phép bạn chọn cửa hàng, tạo đơn in, và đồng bộ trạng thái đơn hàng theo thời gian thực mà không cần rời khỏi khung chat Zalo.
            </p>
            <v-list class="bg-transparent" lines="one">
              <v-list-item class="px-0" v-for="(item, i) in integrationPoints" :key="i">
                <template v-slot:prepend>
                  <v-icon color="success" class="mr-3">mdi-check-circle</v-icon>
                </template>
                <v-list-item-title class="font-weight-medium">{{ item }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-col>
          <v-col cols="12" md="6">
            <div class="pos-illustration glass-dark pa-6 rounded-xl border-glass relative">
              <v-icon size="64" color="primary" class="absolute-center opacity-20">mdi-swap-horizontal</v-icon>
              <div class="d-flex justify-space-between align-center">
                <v-card class="pa-4 rounded-lg flex-1 text-center" color="surface">
                  <v-icon size="48" color="blue">mdi-chat-processing-outline</v-icon>
                  <div class="mt-2 font-weight-bold">ZaloCRM Chat</div>
                </v-card>
                <div class="px-4">
                  <v-icon size="32" class="sync-icon">mdi-sync</v-icon>
                </div>
                <v-card class="pa-4 rounded-lg flex-1 text-center" color="surface">
                  <v-icon size="48" color="orange">mdi-storefront-outline</v-icon>
                  <div class="mt-2 font-weight-bold">Pancake POS</div>
                </v-card>
              </div>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <!-- Final CTA -->
    <section class="cta-section py-16">
      <v-container>
        <div class="cta-box glass-premium text-center pa-10 pa-md-16 rounded-xl relative overflow-hidden">
          <div class="glow-bg absolute-full"></div>
          <h2 class="text-h3 font-weight-black mb-6 relative z-10">Sẵn sàng tăng trưởng cùng ZaloCRM?</h2>
          <p class="text-h6 text-medium-emphasis mb-10 mx-auto relative z-10" style="max-width: 600px;">
            Tham gia cùng hàng trăm doanh nghiệp đang sử dụng ZaloCRM để tự động hóa quy trình chốt đơn và chăm sóc khách hàng.
          </p>
          <v-btn
            size="x-large"
            color="primary"
            class="text-none rounded-pill px-10 btn-primary-gradient relative z-10"
            elevation="8"
            to="/register"
          >
            Tạo Workspace của bạn ngay
          </v-btn>
        </div>
      </v-container>
    </section>

    <!-- Footer -->
    <v-footer class="footer bg-transparent py-8 border-t" style="border-color: rgba(255,255,255,0.05) !important;">
      <v-container>
        <div class="d-flex flex-column flex-md-row justify-space-between align-center">
          <div class="d-flex align-center mb-4 mb-md-0">
            <v-icon color="primary" class="mr-2">mdi-lightning-bolt</v-icon>
            <span class="font-weight-bold">ZaloCRM by Claro.vn</span>
          </div>
          <div class="text-caption text-medium-emphasis">
            &copy; {{ new Date().getFullYear() }} ZaloCRM. All rights reserved.
          </div>
          <div class="d-flex gap-4 mt-4 mt-md-0">
            <router-link to="/privacy-policy" class="text-caption text-medium-emphasis text-decoration-none">Chính sách bảo mật</router-link>
            <router-link to="/data-deletion" class="text-caption text-medium-emphasis text-decoration-none">Xóa dữ liệu</router-link>
          </div>
        </div>
      </v-container>
    </v-footer>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import heroIllustration from '@/assets/hero.png';

const authStore = useAuthStore();
const isAuthenticated = computed(() => authStore.isAuthenticated);

const features = [
  {
    icon: 'mdi-forum-outline',
    title: 'Hội thoại đa kênh',
    description: 'Quản lý tin nhắn Zalo OA, Fanpage tại một nơi. Phân loại KH thông minh, gắn thẻ và lịch hẹn nhanh chóng.'
  },
  {
    icon: 'mdi-cart-outline',
    title: 'Tạo đơn siêu tốc',
    description: 'Chốt đơn ngay trong lúc chat. Tích hợp trực tiếp với API hệ thống để lên đơn in, đồng bộ tồn kho thực tế.'
  },
  {
    icon: 'mdi-finance',
    title: 'Quản lý Tài chính',
    description: 'Kiểm soát dòng tiền, công nợ, chi phí theo từng danh mục. Báo cáo trực quan giúp ra quyết định chính xác.'
  },
  {
    icon: 'mdi-robot-outline',
    title: 'AI Automation',
    description: 'Tự động tóm tắt tin nhắn, trả lời tự động bằng AI, phân luồng khách hàng không cần nhân sự trực 24/7.'
  },
  {
    icon: 'mdi-factory',
    title: 'Quản lý Sản xuất',
    description: 'Theo dõi tiến độ đơn hàng từ lúc chốt đến khi giao. Giảm thiểu sai sót và hàng hoàn trong khâu vận hành.'
  },
  {
    icon: 'mdi-shield-check-outline',
    title: 'Bảo mật Workspace',
    description: 'Phân quyền linh hoạt cho Sale, CSKH, Kế toán. Dữ liệu của bạn được mã hóa và bảo vệ an toàn.'
  }
];

const integrationPoints = [
  'Đồng bộ danh sách Cửa hàng (Shops)',
  'Lấy danh sách Kho (Warehouses) trực tiếp',
  'Tạo đơn In (Print Orders) không độ trễ',
  'Cập nhật trạng thái đơn hàng tự động'
];
</script>

<style scoped>
.landing-page {
  background: var(--color-background);
  color: var(--color-text);
  min-height: 100vh;
  font-family: 'Inter', sans-serif;
  overflow-x: hidden;
}

.glass-navbar {
  background: rgba(var(--color-surface-rgb), 0.7) !important;
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.nav-link {
  color: var(--color-text-secondary);
  text-decoration: none;
  font-weight: 500;
  font-size: 0.95rem;
  transition: color 0.2s ease;
}

.nav-link:hover {
  color: var(--color-text);
}

.text-gradient {
  background: var(--gradient-accent);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.btn-primary-gradient {
  background: var(--gradient-primary);
  color: white;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.btn-primary-gradient:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(var(--color-primary-rgb), 0.3);
}

.hero-section {
  padding: 120px 20px 80px;
  position: relative;
  overflow: hidden;
}

.hero-section::before {
  content: '';
  position: absolute;
  top: -20%;
  left: 50%;
  transform: translateX(-50%);
  width: 800px;
  height: 800px;
  background: radial-gradient(circle, rgba(var(--color-primary-rgb), 0.15) 0%, rgba(var(--color-background-rgb), 0) 70%);
  z-index: 0;
  pointer-events: none;
}

.hero-container {
  max-width: 1000px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
  border-radius: 999px;
  background: rgba(var(--color-primary-rgb), 0.1);
  border: 1px solid rgba(var(--color-primary-rgb), 0.2);
  color: var(--color-primary);
  font-size: 0.85rem;
  font-weight: 600;
}

.hero-title {
  font-size: clamp(2.5rem, 5vw, 4.5rem);
  font-weight: 900;
  line-height: 1.1;
  letter-spacing: -1px;
}

.hero-subtitle {
  font-size: clamp(1.1rem, 2vw, 1.25rem);
  color: var(--color-text-secondary);
  max-width: 700px;
  line-height: 1.6;
}

.hero-image-container {
  max-width: 900px;
  border-radius: 12px;
  overflow: hidden;
  margin-top: 2rem;
}

.window-controls {
  background: rgba(255, 255, 255, 0.05);
  padding: 10px 16px;
  display: flex;
  gap: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.dot.red { background: #ff5f56; }
.dot.yellow { background: #ffbd2e; }
.dot.green { background: #27c93f; }

.glow-border {
  border: 1px solid rgba(var(--color-primary-rgb), 0.3);
  box-shadow: 0 0 30px rgba(var(--color-primary-rgb), 0.15);
}

.glass-dark {
  background: rgba(var(--color-surface-rgb), 0.5);
  backdrop-filter: blur(14px);
}

.glass-premium {
  background: linear-gradient(145deg, rgba(var(--color-surface-elevated-rgb), 0.6), rgba(var(--color-surface-rgb), 0.3));
  border: 1px solid rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  transition: transform 0.3s ease, border-color 0.3s ease;
}

.glass-premium:hover {
  transform: translateY(-5px);
  border-color: rgba(var(--color-primary-rgb), 0.3);
}

.section-title {
  font-size: clamp(2rem, 4vw, 2.5rem);
  font-weight: 800;
  letter-spacing: -0.5px;
}

.section-subtitle {
  font-size: 1.1rem;
  color: var(--color-text-secondary);
  max-width: 600px;
}

.feature-icon-wrapper {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: rgba(var(--color-primary-rgb), 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.pos-illustration {
  background: linear-gradient(145deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.9));
}

.sync-icon {
  animation: spin 4s linear infinite;
}

@keyframes spin {
  100% { transform: rotate(360deg); }
}

.cta-box {
  border: 1px solid rgba(var(--color-primary-rgb), 0.2);
}

.glow-bg {
  background: radial-gradient(circle at center, rgba(var(--color-primary-rgb), 0.15) 0%, transparent 70%);
}

.absolute-full {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.relative {
  position: relative;
}

.z-10 {
  z-index: 10;
}
</style>
