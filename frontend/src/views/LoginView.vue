<template>
  <div class="login-shell">
    <div class="login-container">
      <!-- Left side: Value Proposition -->
      <section class="login-showcase">
        <div class="entrance-animation-delay-1">
          <div class="login-badge glow-border">
            <v-icon size="18" color="#00F2FF">mdi-auto-fix</v-icon>
            <span class="ml-2">Next-Gen Zalo Automation</span>
          </div>
        </div>

        <div class="login-copy entrance-animation-delay-2">
          <p class="login-overline">The OS for Social Commerce</p>
          <h1 class="login-title">Vận hành Zalo <br/><span class="text-gradient">Đẳng cấp AI</span></h1>
          <p class="login-description">
            Tối ưu hóa phễu bán hàng, quản lý đội ngũ sale và kích hoạt 
            AI Chatbot tóm tắt nhu cầu khách hàng tự động 24/7.
          </p>
        </div>

        <div class="login-stat-grid entrance-animation-delay-3">
          <article v-for="stat in quickStats" :key="stat.label" class="login-stat-card glass-dark">
            <div class="login-stat-value text-gradient">{{ stat.value }}</div>
            <div class="login-stat-label">{{ stat.label }}</div>
          </article>
        </div>

        <div class="login-preview entrance-animation-delay-4">
          <div class="login-preview__surface glass-dark">
            <div class="login-preview__top mb-6">
              <div>
                <p class="login-preview__eyebrow">Real-time Dashboard</p>
                <h2 class="login-preview__title">Dữ liệu hội thoại tập trung</h2>
              </div>
              <div class="live-indicator">
                <div class="pulse-dot"></div>
                <span>Hệ thống sẵn sàng</span>
              </div>
            </div>

            <div class="login-preview__illustration">
              <v-img :src="heroIllustration" alt="ZaloCRM illustration" cover class="rounded-xl border-glass" />
              <div class="glow-layer"></div>
            </div>

            <div class="login-feature-list mt-6">
              <div v-for="item in highlights" :key="item.title" class="login-feature">
                <v-icon size="24" class="feature-icon">{{ item.icon }}</v-icon>
                <div>
                  <div class="login-feature__title">{{ item.title }}</div>
                  <div class="login-feature__text">{{ item.description }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Right side: Auth Form -->
      <div class="login-form-side entrance-animation-delay-2">
        <v-card class="login-card glass-premium" elevation="0">
          <div class="login-card__content">
            <header class="mb-10 text-center">
              <div class="brand-logo-container mb-6">
                <div class="logo-orb">
                  <v-icon size="36" color="white">mdi-lightning-bolt</v-icon>
                </div>
              </div>
              <h2 class="login-card__title">Chào mừng trở lại</h2>
              <p class="login-card__subtitle">Chào mừng bạn gia nhập kỷ nguyên CRM mới</p>
            </header>

            <v-alert
              v-if="error"
              type="error"
              variant="tonal"
              density="compact"
              class="mb-6 rounded-lg text-caption"
            >
              {{ error }}
            </v-alert>

            <v-form @submit.prevent="handleLogin">
              <div class="input-group mb-4">
                <v-text-field
                  v-model="email"
                  label="Email công việc"
                  type="email"
                  variant="plain"
                  autocomplete="email"
                  required
                  hide-details
                  class="premium-input"
                >
                  <template #prepend-inner>
                    <v-icon color="#94a3b8" class="mr-2">mdi-email-outline</v-icon>
                  </template>
                </v-text-field>
              </div>

              <div class="input-group mb-4">
                <v-text-field
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  label="Mật khẩu"
                  variant="plain"
                  autocomplete="current-password"
                  required
                  hide-details
                  class="premium-input"
                >
                  <template #prepend-inner>
                    <v-icon color="#94a3b8" class="mr-2">mdi-lock-outline</v-icon>
                  </template>
                  <template #append-inner>
                    <v-btn icon size="small" variant="text" @click="showPassword = !showPassword">
                      <v-icon color="#94a3b8">{{ showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline' }}</v-icon>
                    </v-btn>
                  </template>
                </v-text-field>
              </div>

              <div class="login-options mb-8">
                <v-checkbox
                  label="Ghi nhớ tôi"
                  hide-details
                  density="compact"
                  color="#00F2FF"
                  class="text-caption custom-cb"
                ></v-checkbox>
                <router-link to="/register" class="forgot-link">Quên mật khẩu?</router-link>
              </div>

              <v-btn
                type="submit"
                height="60"
                block
                class="btn-primary-gradient mb-8"
                :loading="loading"
                :disabled="!canSubmit"
              >
                <span>Vào hệ thống</span>
                <v-icon end>mdi-chevron-right</v-icon>
              </v-btn>
            </v-form>

            <div class="divider-text">
              <span class="line"></span>
              <span class="text">Hoặc tiếp tục với</span>
              <span class="line"></span>
            </div>

            <v-btn
              block
              height="54"
              variant="outlined"
              class="btn-google-glass mt-6"
              :disabled="loading || !googleReady"
              @click="loginWithGoogle"
            >
              <v-img width="20" height="20" src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" class="mr-3" />
              <span>Google Account</span>
            </v-btn>

            <footer class="mt-12 text-center">
              <p class="text-caption footer-text">
                Dành cho doanh nghiệp Zalo?
                <router-link to="/register" class="signup-link">Đăng ký tự động</router-link>
              </p>
            </footer>
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
  { value: '70%', label: 'Giảm thời gian phản hồi' },
  { value: '3x', label: 'Tỉ suất chuyển đổi lead' },
  { value: '∞', label: 'Tự động hóa 24/7' },
];

const highlights = [
  {
    icon: 'mdi-auto-fix',
    title: 'AI Smart Summary',
    description: 'Tự động tóm tắt nội dung hội thoại quan trọng.',
  },
  {
    icon: 'mdi-account-group-outline',
    title: 'Multi-Tenant Unified',
    description: 'Quản lý hàng trăm Zalo OA trong một giao diện.',
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
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');

.login-shell {
  font-family: 'Outfit', sans-serif;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.login-container {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 80px;
  width: 100%;
  max-width: 1300px;
}

/* Animations */
@keyframes fadeInSlide {
  from { opacity: 0; transform: translateY(40px); }
  to { opacity: 1; transform: translateY(0); }
}

.entrance-animation-delay-1 { animation: fadeInSlide 0.8s ease-out forwards; }
.entrance-animation-delay-2 { animation: fadeInSlide 0.8s ease-out 0.1s forwards; opacity: 0; }
.entrance-animation-delay-3 { animation: fadeInSlide 0.8s ease-out 0.2s forwards; opacity: 0; }
.entrance-animation-delay-4 { animation: fadeInSlide 0.8s ease-out 0.3s forwards; opacity: 0; }

/* Left Side UI */
.login-badge {
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
  border-radius: 99px;
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  font-size: 0.85rem;
  font-weight: 500;
  margin-bottom: 32px;
}

.glow-border {
  border: 1px solid rgba(0, 242, 255, 0.3);
  box-shadow: 0 0 15px rgba(0, 242, 255, 0.1);
}

.login-title {
  font-size: clamp(3rem, 6vw, 4.8rem);
  font-weight: 800;
  line-height: 1.1;
  color: #fff;
  letter-spacing: -2px;
}

.text-gradient {
  background: linear-gradient(135deg, #00f2ff, #a855f7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.login-overline {
  color: #a855f7;
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: 2px;
  font-size: 0.9rem;
  margin-bottom: 12px;
}

.login-description {
  margin-top: 24px;
  font-size: 1.25rem;
  color: #94a3b8;
  max-width: 580px;
  line-height: 1.6;
}

.login-stat-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-top: 48px;
}

.glass-dark {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(12px);
  border-radius: 20px;
  padding: 24px;
}

.login-stat-value {
  font-size: 1.8rem;
  font-weight: 700;
}

.login-stat-label {
  color: #64748b;
  font-size: 0.85rem;
  margin-top: 8px;
}

.login-preview {
  margin-top: 60px;
}

.login-preview__eyebrow {
  color: #00f2ff;
  text-transform: uppercase;
  font-weight: 600;
  font-size: 0.75rem;
  letter-spacing: 1px;
}

.login-preview__title {
  color: #fff;
  font-size: 1.4rem;
  font-weight: 700;
}

.live-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: rgba(34, 197, 94, 0.1);
  border-radius: 8px;
  color: #4ade80;
  font-size: 0.75rem;
  font-weight: 600;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  background: #22c55e;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.5); opacity: 0.5; }
  100% { transform: scale(1); opacity: 1; }
}

.login-preview__illustration {
  position: relative;
  height: 240px;
}

.border-glass {
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.glow-layer {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 100% 0%, rgba(0, 242, 255, 0.15), transparent 70%);
  pointer-events: none;
}

.feature-icon {
  color: #00f2ff;
  margin-right: 16px;
  margin-top: 2px;
}

.login-feature {
  display: flex;
  align-items: flex-start;
}

.login-feature__title {
  color: #fff;
  font-weight: 600;
}

.login-feature__text {
  color: #64748b;
  font-size: 0.85rem;
  margin-top: 4px;
}

/* Right Side Form */
.glass-premium {
  background: rgba(2, 6, 23, 0.7) !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
  backdrop-filter: blur(24px) saturate(180%);
  border-radius: 32px !important;
  padding: 4px;
}

.login-card__content {
  padding: 48px;
}

.logo-orb {
  width: 72px;
  height: 72px;
  background: linear-gradient(135deg, #00f2ff, #7c3aed);
  border-radius: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto;
  box-shadow: 0 0 30px rgba(0, 242, 255, 0.2);
}

.login-card__title {
  font-size: 2rem;
  font-weight: 700;
  color: #fff;
}

.login-card__subtitle {
  color: #94a3b8;
  margin-top: 8px;
}

/* Form Inputs */
.input-group {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 8px 16px;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.input-group:focus-within {
  background: rgba(255, 255, 255, 0.05);
  border-color: #00f2ff;
  box-shadow: 0 0 20px rgba(0, 242, 255, 0.1);
}

.premium-input {
  width: 100%;
}

:deep(.v-field__input) {
  color: #fff !important;
  font-size: 1rem;
}

:deep(.v-label) {
  color: #64748b !important;
}

.login-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.forgot-link {
  color: #a855f7;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.85rem;
}

.btn-primary-gradient {
  background: linear-gradient(135deg, #00f2ff, #7c3aed) !important;
  color: #fff !important;
  border-radius: 16px !important;
  font-size: 1.1rem !important;
  font-weight: 700 !important;
  text-transform: none !important;
  letter-spacing: -0.5px;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1) !important;
}

.btn-primary-gradient:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(0, 242, 255, 0.2) !important;
}

.divider-text {
  display: flex;
  align-items: center;
  gap: 16px;
}

.line {
  flex: 1;
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
}

.text {
  color: #475569;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.btn-google-glass {
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  background: rgba(255, 255, 255, 0.02) !important;
  color: #fff !important;
  border-radius: 16px !important;
  text-transform: none !important;
  font-weight: 600 !important;
}

.btn-google-glass:hover {
  background: rgba(255, 255, 255, 0.05) !important;
}

.signup-link {
  color: #00f2ff;
  text-decoration: none;
  font-weight: 700;
}

.footer-text {
  color: #64748b;
}

/* Responsive */
@media (max-width: 1200px) {
  .login-container {
    grid-template-columns: 1fr;
    gap: 40px;
    padding: 20px;
  }
  .login-showcase {
    text-align: center;
    align-items: center;
  }
  .login-preview {
    display: none;
  }
}

@media (max-width: 600px) {
  .login-card__content {
    padding: 32px 24px;
  }
  .login-title {
    font-size: 2.8rem;
  }
}
</style>
