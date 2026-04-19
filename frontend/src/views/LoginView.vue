<template>
  <div class="login-shell">
    <div class="login-container">
      <section class="login-showcase">
        <div class="entrance-animation-delay-1">
          <div class="login-badge ai-core-orb">
            <v-icon size="18" color="cyan-electric">mdi-sparkles</v-icon>
            <span>ZaloCRM cho đội sale và CSKH</span>
          </div>
        </div>

        <div class="login-copy entrance-animation-delay-2">
          <p class="login-overline">Hệ sinh thái vận hành tập trung</p>
          <h1 class="login-title">Quản lý Zalo OA & CRM <br/><span class="text-gradient">Thông minh hơn</span></h1>
          <p class="login-description">
            Hợp nhất hội thoại, tối ưu lead và tự động hóa quy trình chăm sóc khách hàng 
            ngay trên nền tảng Zalo với sức mạnh của AI.
          </p>
        </div>

        <div class="login-stat-grid entrance-animation-delay-3">
          <article v-for="stat in quickStats" :key="stat.label" class="login-stat-card glass-card">
            <div class="login-stat-value text-gradient">{{ stat.value }}</div>
            <div class="login-stat-label">{{ stat.label }}</div>
          </article>
        </div>

        <div class="login-preview entrance-animation-delay-4">
          <div class="login-preview__surface glass-card">
            <div class="login-preview__top">
              <div>
                <p class="login-preview__eyebrow">Bảng điều phối AI</p>
                <h2 class="login-preview__title">Vận hành theo thời gian thực</h2>
              </div>
              <v-chip size="small" color="cyan-electric" variant="tonal" class="pulse-animation">
                <v-icon start size="14">mdi-broadcast</v-icon>
                AI Live Sync
              </v-chip>
            </div>

            <div class="login-preview__illustration">
              <v-img :src="heroIllustration" alt="ZaloCRM illustration" cover class="rounded-xl" />
              <div class="illustration-overlay"></div>
            </div>

            <div class="login-feature-list">
              <div v-for="item in highlights" :key="item.title" class="login-feature">
                <div class="login-feature__icon">
                  <v-icon size="20">{{ item.icon }}</v-icon>
                </div>
                <div>
                  <div class="login-feature__title">{{ item.title }}</div>
                  <div class="login-feature__text">{{ item.description }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div class="login-form-side entrance-animation-delay-2">
        <v-card class="login-card glass-card-heavy" elevation="24">
          <div class="login-card__header">
            <div class="login-brand">
              <div class="login-brand__icon ai-core-orb">
                <v-icon size="32" color="white">mdi-robot-outline</v-icon>
              </div>
              <div>
                <p class="login-brand__name">ZaloCRM <span class="v-badge-pro">PRO</span></p>
                <p class="login-brand__sub">Giải pháp SaaS cho doanh nghiệp</p>
              </div>
            </div>

            <div class="mt-4">
              <h2 class="login-card__title">Chào mừng trở lại</h2>
              <p class="login-card__description">
                Đăng nhập để bắt đầu tăng trưởng doanh thu từ Zalo.
              </p>
            </div>
          </div>

          <v-alert
            v-if="error"
            type="error"
            density="comfortable"
            variant="tonal"
            border="start"
            class="mb-6 rounded-lg"
          >
            {{ error }}
          </v-alert>

          <v-form @submit.prevent="handleLogin" class="mt-4">
            <v-text-field
              v-model="email"
              label="Email công việc"
              type="email"
              variant="outlined"
              prepend-inner-icon="mdi-email-outline"
              autocomplete="email"
              required
              hide-details="auto"
              class="mb-5 custom-input"
            />

            <v-text-field
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              label="Mật khẩu"
              variant="outlined"
              prepend-inner-icon="mdi-lock-outline"
              :append-inner-icon="showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
              autocomplete="current-password"
              required
              hide-details="auto"
              class="mb-3 custom-input"
              @click:append-inner="showPassword = !showPassword"
            />

            <div class="login-meta mb-8">
              <v-checkbox
                label="Ghi nhớ"
                hide-details
                density="compact"
                color="cyan-electric"
              ></v-checkbox>
              <router-link to="/register" class="login-meta__link">Quên mật khẩu?</router-link>
            </div>

            <v-btn
              type="submit"
              color="primary"
              block
              size="x-large"
              :loading="loading"
              :disabled="!canSubmit"
              class="login-submit btn-glow"
            >
              <span>Đăng nhập hệ thống</span>
              <v-icon end>mdi-arrow-right</v-icon>
            </v-btn>
          </v-form>

          <div class="login-divider">
            <span>Hoặc đăng nhanh bằng</span>
          </div>

          <v-btn
            block
            variant="outlined"
            size="large"
            class="login-google"
            :disabled="loading || !googleReady"
            @click="loginWithGoogle"
          >
            <template v-if="googleReady">
              <v-icon start color="red">mdi-google</v-icon>
              <span>Tiếp tục với Google</span>
            </template>
            <template v-else>
              <v-progress-circular indeterminate size="20" width="2" class="mr-2" />
              <span>Đang khởi tạo...</span>
            </template>
          </v-btn>

          <div class="login-footer">
            <span>Chưa có doanh nghiệp trên ZaloCRM?</span>
            <router-link to="/register" class="login-footer__link">Đăng ký tự động</router-link>
          </div>
        </v-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import heroIllustration from '@/assets/hero.png';
import { useAuthStore } from '@/stores/auth';

interface GoogleIdentity {
  accounts?: {
    id?: {
      initialize: (config: { client_id: string; callback: (response: GoogleCredentialResponse) => void }) => void;
      prompt: () => void;
    };
  };
}

interface GoogleCredentialResponse {
  credential?: string;
}

const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');
const showPassword = ref(false);
const googleReady = ref(false);
const router = useRouter();
const authStore = useAuthStore();

const quickStats = [
  { value: '100+', label: 'Zalo OA kết nối' },
  { value: 'Real-time', label: 'Tương tác khách hàng' },
  { value: 'GenAI', label: 'Hỗ trợ hội thoại' },
];

const highlights = [
  {
    icon: 'mdi-message-text-clock-outline',
    title: 'Phản hồi siêu tốc',
    description: 'Tự động phân phối chat cho sale ngay khi có inbox mới.',
  },
  {
    icon: 'mdi-chart-pepper-hot',
    title: 'Pipeline chuyên sâu',
    description: 'Quản lý trạng thái khách hàng từ lạnh sang nóng chuyên nghiệp.',
  },
];

const canSubmit = computed(() => email.value.trim().length > 0 && password.value.length > 0);

watch([email, password], () => {
  if (error.value) {
    error.value = '';
  }
});

onMounted(async () => {
  try {
    const needs = await authStore.checkSetup();
    if (needs) {
      router.replace('/setup');
      return;
    }

    if (authStore.token) {
      await authStore.init();
      if (authStore.isAuthenticated) {
        router.replace('/');
        return;
      }
    }
  } catch {}

  const googleIdentity = getGoogleIdentity();
  if (!googleIdentity?.accounts?.id) {
    // Retry finding google identity in a more robust way
    let attempts = 0;
    const interval = setInterval(() => {
      const identity = getGoogleIdentity();
      if (identity?.accounts?.id || attempts > 10) {
        clearInterval(interval);
        if (identity?.accounts?.id) {
          initGoogle(identity);
        }
      }
      attempts++;
    }, 500);
    return;
  }

  initGoogle(googleIdentity);
});

function initGoogle(identity: any) {
  identity.accounts.id.initialize({
    client_id: '926202174216-4v1fml75f5403k79bvoeuau2go3oe1jq.apps.googleusercontent.com',
    callback: handleGoogleCallback,
  });
  googleReady.value = true;
}

async function handleGoogleCallback(response: GoogleCredentialResponse) {
  if (!response.credential) {
    error.value = 'Không nhận được xác thực từ Google. Vui lòng thử lại.';
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    await authStore.googleLogin(response.credential);
    router.push('/');
  } catch {
    error.value = 'Đăng nhập với Google thất bại. Vui lòng thử lại.';
  } finally {
    loading.value = false;
  }
}

async function handleLogin() {
  if (!canSubmit.value) {
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    await authStore.login(email.value.trim(), password.value);
    router.push('/');
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Đăng nhập thất bại. Kiểm tra lại email và mật khẩu.';
  } finally {
    loading.value = false;
  }
}

function loginWithGoogle() {
  error.value = '';

  const googleIdentity = getGoogleIdentity();
  if (!googleIdentity?.accounts?.id) {
    error.value = 'Google Sign-In chưa sẵn sàng. Vui lòng tải lại trang.';
    return;
  }

  googleIdentity.accounts.id.prompt();
}

function getGoogleIdentity() {
  return (window as Window & { google?: GoogleIdentity }).google;
}
</script>

<style scoped>
/* Keyframes */
@keyframes fadeInSlideUp {
  from { opacity: 0; transform: translateY(30px); filter: blur(10px); }
  to { opacity: 1; transform: translateY(0); filter: blur(0); }
}

@keyframes pulse-soft {
  0%, 100% { box-shadow: 0 0 0 0 rgba(0, 242, 255, 0.4); }
  50% { box-shadow: 0 0 0 10px rgba(0, 242, 255, 0); }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}

/* Base Layout */
.login-shell {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}

.login-container {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 60px;
  width: 100%;
  max-width: 1400px;
  position: relative;
  z-index: 2;
}



/* Entrance Animations */
.entrance-animation-delay-1 { animation: fadeInSlideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
.entrance-animation-delay-2 { animation: fadeInSlideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards; opacity: 0; }
.entrance-animation-delay-3 { animation: fadeInSlideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards; opacity: 0; }
.entrance-animation-delay-4 { animation: fadeInSlideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards; opacity: 0; }

/* Showcase Section */
.login-showcase {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.login-badge {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(5px);
  color: #fff;
  font-weight: 600;
  font-size: 0.95rem;
  margin-bottom: 30px;
}

.login-title {
  font-size: clamp(2.5rem, 5vw, 4.2rem);
  line-height: 1.1;
  font-weight: 800;
  color: #fff;
  letter-spacing: -0.03em;
}

.text-gradient {
  background: linear-gradient(135deg, #00f2ff, #00d2ff, #7ae7ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.login-description {
  margin-top: 24px;
  font-size: 1.25rem;
  color: rgba(230, 241, 255, 0.7);
  max-width: 600px;
  line-height: 1.6;
}

.login-stat-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-top: 40px;
}

.login-stat-card {
  padding: 24px;
  text-align: left;
}

.login-stat-value {
  font-size: 1.6rem;
  font-weight: 800;
}

.login-stat-label {
  margin-top: 8px;
  color: rgba(230, 241, 255, 0.6);
  font-size: 0.9rem;
}

.login-preview {
  margin-top: 50px;
  max-width: 800px;
}

.login-preview__surface {
  padding: 30px;
  position: relative;
  overflow: hidden;
}

.login-preview__top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.login-preview__eyebrow {
  text-transform: uppercase;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: #00f2ff;
}

.login-preview__title {
  font-size: 1.4rem;
  font-weight: 700;
  color: #fff;
  margin-top: 4px;
}

.login-preview__illustration {
  position: relative;
  height: 250px;
  margin-bottom: 24px;
}

.illustration-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(0deg, rgba(10, 25, 47, 0.8) 0%, transparent 50%);
  border-radius: 12px;
}

.login-feature-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.login-feature {
  display: flex;
  gap: 16px;
}

.login-feature__icon {
  width: 44px;
  height: 44px;
  background: rgba(0, 242, 255, 0.1);
  border: 1px solid rgba(0, 242, 255, 0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #00f2ff;
  flex-shrink: 0;
}

.login-feature__title {
  color: #fff;
  font-weight: 700;
  font-size: 1rem;
}

.login-feature__text {
  color: rgba(230, 241, 255, 0.6);
  font-size: 0.85rem;
  line-height: 1.5;
  margin-top: 4px;
}

/* Form Section */
.login-form-side {
  display: flex;
  justify-content: center;
  align-items: center;
}

.login-card {
  width: 100%;
  max-width: 480px;
  padding: 40px !important;
  border-radius: 32px !important;
}

.login-brand {
  display: flex;
  align-items: center;
  gap: 16px;
}

.login-brand__icon {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #0077b6, #00b4d8);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 20px rgba(0, 119, 182, 0.3);
}

.login-brand__name {
  font-size: 1.5rem;
  font-weight: 800;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 8px;
}

.v-badge-pro {
  background: #00f2ff;
  color: #0a192f;
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 4px;
}

.login-brand__sub {
  color: rgba(230, 241, 255, 0.5);
  font-size: 0.9rem;
}

.login-card__title {
  font-size: 2rem;
  font-weight: 800;
  color: #fff;
}

.login-card__description {
  color: rgba(230, 241, 255, 0.6);
  margin-top: 8px;
}

.login-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.login-meta__link {
  color: #00f2ff;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 600;
}

.login-submit {
  height: 60px !important;
  border-radius: 16px !important;
  font-size: 1.1rem !important;
  font-weight: 700 !important;
  letter-spacing: 0.02em !important;
  text-transform: none !important;
}

.btn-glow:hover {
  box-shadow: 0 0 20px rgba(0, 242, 255, 0.4) !important;
}

.login-divider {
  margin: 30px 0;
  position: relative;
  text-align: center;
}

.login-divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  z-index: 1;
}

.login-divider span {
  position: relative;
  z-index: 2;
  background: #112240; /* Match card background approximation */
  padding: 0 15px;
  color: rgba(230, 241, 255, 0.4);
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.login-google {
  height: 54px !important;
  border-radius: 16px !important;
  border-color: rgba(255, 255, 255, 0.1) !important;
  color: #fff !important;
  text-transform: none !important;
  font-weight: 600 !important;
}

.login-google:hover {
  background: rgba(255, 255, 255, 0.05) !important;
  border-color: rgba(255, 255, 255, 0.2) !important;
}

.login-footer {
  margin-top: 30px;
  text-align: center;
  font-size: 0.95rem;
  color: rgba(230, 241, 255, 0.5);
}

.login-footer__link {
  color: #00f2ff;
  text-decoration: none;
  font-weight: 700;
  margin-left: 5px;
}

/* Glassmorphism helpers */
.glass-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(12px);
  border-radius: 24px;
}

.glass-card-heavy {
  background: rgba(17, 34, 64, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(25px);
}

.pulse-animation {
  animation: pulse-soft 2s infinite;
}

/* Custom Input Styling */
:deep(.v-field__outline) {
  --v-field-border-opacity: 0.1;
}

:deep(.v-field--focused .v-field__outline) {
  --v-field-border-opacity: 1;
  color: #00f2ff !important;
}

:deep(.v-label) {
  color: rgba(230, 241, 255, 0.4) !important;
}

:deep(.v-field__input) {
  color: #fff !important;
}

/* Responsive */
@media (max-width: 1200px) {
  .login-container {
    grid-template-columns: 1fr;
    gap: 40px;
  }
  
  .login-showcase {
    text-align: center;
    align-items: center;
  }
  
  .login-stat-grid {
    width: 100%;
    max-width: 600px;
  }
  
  .login-preview {
    display: none; /* Hide preview on tablet to focus on login */
  }
}

@media (max-width: 600px) {
  .login-title {
    font-size: 2rem;
  }
  
  .login-card {
    padding: 24px !important;
  }
  
  .login-stat-grid {
    grid-template-columns: 1fr;
  }
}
</style>
