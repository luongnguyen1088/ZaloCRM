<template>
  <div class="login-shell">
    <div class="login-container">
      <section class="login-showcase">
        <div class="entrance-animation-delay-1">
          <div class="login-badge glow-border">
            <v-icon size="18" color="primary">mdi-auto-fix</v-icon>
            <span class="ml-2">ZaloCRM cho đội ngũ social commerce</span>
          </div>
        </div>

        <div class="login-copy entrance-animation-delay-2">
          <p class="login-overline">Một workspace cho sale, CSKH và automation</p>
          <h1 class="login-title">
            Đăng nhập để tiếp tục
            <span class="text-gradient">vận hành ZaloCRM</span>
          </h1>
          <p class="login-description">
            Theo dõi hội thoại, chốt lịch hẹn, phân tích hiệu suất và kích hoạt AI trong cùng một giao diện
            dành cho đội ngũ đang chạy Zalo hằng ngày.
          </p>
        </div>

        <div class="login-stat-grid entrance-animation-delay-3">
          <article v-for="stat in quickStats" :key="stat.label" class="login-stat-card glass-dark">
            <div class="login-stat-value">{{ stat.value }}</div>
            <div class="login-stat-label">{{ stat.label }}</div>
          </article>
        </div>

        <div class="login-preview entrance-animation-delay-4">
          <div class="login-preview__surface glass-dark">
            <div class="login-preview__top">
              <div>
                <p class="login-preview__eyebrow">Realtime workspace</p>
                <h2 class="login-preview__title">Mọi tín hiệu bán hàng được gom về một màn hình</h2>
              </div>
              <div class="live-indicator">
                <div class="pulse-dot"></div>
                <span>Đồng bộ theo thời gian thực</span>
              </div>
            </div>

            <div class="login-preview__illustration">
              <v-img :src="heroIllustration" alt="ZaloCRM illustration" cover class="rounded-xl border-glass" />
              <div class="glow-layer"></div>
              <div class="login-preview__callout glass-dark">
                <span class="login-preview__callout-label">AI Summary</span>
                <strong class="login-preview__callout-title">Rút gọn hội thoại dài thành 3 ý chính cho sale</strong>
              </div>
            </div>

            <div class="login-preview__metrics">
              <div v-for="metric in overviewMetrics" :key="metric.label" class="login-preview__metric">
                <div class="login-preview__metric-value">{{ metric.value }}</div>
                <div class="login-preview__metric-label">{{ metric.label }}</div>
              </div>
            </div>

            <div class="login-feature-list">
              <div v-for="item in highlights" :key="item.title" class="login-feature">
                <div class="feature-icon-shell">
                  <v-icon size="20" class="feature-icon">{{ item.icon }}</v-icon>
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

      <section class="login-form-side entrance-animation-delay-2">
        <v-card class="login-card glass-premium" elevation="0">
          <div class="login-card__content">
            <header class="login-card__header">
              <div class="brand-logo-container">
                <div class="logo-orb">
                  <v-icon size="34" color="white">mdi-lightning-bolt</v-icon>
                </div>
              </div>

              <div class="login-card__copy">
                <div class="login-card__eyebrow">Đăng nhập workspace</div>
                <h2 class="login-card__title">Chào mừng trở lại</h2>
                <p class="login-card__subtitle">
                  Dùng email công việc đã được cấp quyền để vào lại dashboard và tiếp tục phiên làm việc.
                </p>
              </div>
            </header>

            <div class="login-trust-row">
              <div v-for="item in platformSignals" :key="item.text" class="login-trust-item">
                <v-icon size="16" class="login-trust-item__icon">{{ item.icon }}</v-icon>
                <span>{{ item.text }}</span>
              </div>
            </div>

            <v-alert
              v-if="error"
              type="error"
              variant="tonal"
              density="comfortable"
              class="login-error"
            >
              {{ error }}
            </v-alert>

            <v-form @submit.prevent="handleLogin" class="login-form">
              <div class="input-group">
                <v-text-field
                  v-model="email"
                  label="Email công việc"
                  type="email"
                  variant="plain"
                  autocomplete="email"
                  placeholder="name@company.com"
                  autofocus
                  clearable
                  required
                  hide-details
                  class="premium-input"
                >
                  <template #prepend-inner>
                    <v-icon class="input-icon mr-2">mdi-email-outline</v-icon>
                  </template>
                </v-text-field>
              </div>

              <div class="input-group">
                <v-text-field
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  label="Mật khẩu"
                  variant="plain"
                  autocomplete="current-password"
                  placeholder="Nhập mật khẩu của bạn"
                  required
                  hide-details
                  class="premium-input"
                >
                  <template #prepend-inner>
                    <v-icon class="input-icon mr-2">mdi-lock-outline</v-icon>
                  </template>
                  <template #append-inner>
                    <v-btn
                      type="button"
                      icon
                      size="small"
                      variant="text"
                      class="password-toggle"
                      @click="showPassword = !showPassword"
                    >
                      <v-icon class="input-icon">
                        {{ showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline' }}
                      </v-icon>
                    </v-btn>
                  </template>
                </v-text-field>
              </div>

              <div class="login-assistance">
                <div class="login-assistance__note">
                  <v-icon size="16" class="mr-2">mdi-shield-check-outline</v-icon>
                  <span>Không truy cập được? Liên hệ quản trị viên workspace để cấp lại quyền.</span>
                </div>
                <router-link to="/register" class="assist-link">Tạo workspace mới</router-link>
              </div>

              <v-btn
                type="submit"
                height="58"
                block
                class="btn-primary-gradient"
                :loading="loading"
                :disabled="loading || !canSubmit"
              >
                <span>{{ submitLabel }}</span>
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
              class="btn-google-glass"
              :disabled="loading || !googleReady"
              @click="loginWithGoogle"
            >
              <v-img
                width="20"
                height="20"
                src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png"
                class="mr-3"
              />
              <span>{{ googleButtonLabel }}</span>
            </v-btn>

            <p class="login-google-hint" :class="{ 'is-ready': googleReady }">
              {{ googleHint }}
            </p>

            <footer class="login-footer">
              <p class="footer-text">
                Chưa có hệ thống cho đội ngũ của bạn?
                <router-link to="/register" class="signup-link">Thiết lập workspace mới</router-link>
              </p>
            </footer>
          </div>
        </v-card>
      </section>
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
  { value: '70%', label: 'Giảm thời gian phản hồi lead mới' },
  { value: '< 5 phút', label: 'Nắm được trạng thái lịch hẹn và hội thoại' },
  { value: '24/7', label: 'AI hỗ trợ ngoài giờ và lúc quá tải' },
];

const overviewMetrics = [
  { value: '1 dashboard', label: 'Gom sales, CSKH, OA và automation' },
  { value: '3 lớp', label: 'Theo dõi KPI, lịch hẹn và pipeline theo thời gian thực' },
  { value: 'AI-ready', label: 'Tóm tắt, gợi ý và phản hồi nhanh ngay trong luồng chat' },
];

const highlights = [
  {
    icon: 'mdi-auto-fix',
    title: 'AI Smart Summary',
    description: 'Tự động rút gọn hội thoại để đội sale nắm đúng nhu cầu trước khi trả lời.',
  },
  {
    icon: 'mdi-chart-line',
    title: 'Pipeline rõ ràng',
    description: 'Theo dõi từng bước từ lead mới, lịch hẹn đến chuyển đổi ngay trên một flow.',
  },
  {
    icon: 'mdi-robot-outline',
    title: 'Automation theo điều kiện',
    description: 'Kích hoạt các action lặp lại mà không phải chuyển tab hoặc thao tác thủ công.',
  },
];

const platformSignals = [
  { icon: 'mdi-shield-check-outline', text: 'Bảo mật theo workspace' },
  { icon: 'mdi-lightning-bolt-outline', text: 'Vào lại phiên làm việc nhanh' },
  { icon: 'mdi-google', text: 'Hỗ trợ Google Workspace' },
];

const canSubmit = computed(() => email.value.trim().length > 0 && password.value.length > 0);
const submitLabel = computed(() => (loading.value ? 'Đang đăng nhập...' : 'Vào ZaloCRM'));
const googleButtonLabel = computed(() => (googleReady.value ? 'Tiếp tục với Google Workspace' : 'Đang khởi tạo Google'));
const googleHint = computed(() =>
  googleReady.value
    ? 'Dành cho tài khoản đã liên kết Google Workspace với hệ thống.'
    : 'Google Sign-In đang tải. Bạn vẫn có thể đăng nhập bằng email và mật khẩu.'
);

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

function initGoogle(identity: GoogleIdentity) {
  identity.accounts?.id?.initialize({
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
.login-shell {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.login-container {
  display: grid;
  grid-template-columns: minmax(0, 1.08fr) minmax(420px, 0.92fr);
  gap: 72px;
  width: 100%;
  max-width: 1300px;
  align-items: center;
}

.login-showcase {
  display: flex;
  flex-direction: column;
}

.login-form-side {
  display: flex;
  justify-content: center;
}

@keyframes fadeInSlide {
  from {
    opacity: 0;
    transform: translateY(32px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }

  50% {
    transform: scale(1.5);
    opacity: 0.5;
  }

  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.entrance-animation-delay-1 {
  animation: fadeInSlide 0.8s ease-out forwards;
}

.entrance-animation-delay-2 {
  animation: fadeInSlide 0.8s ease-out 0.08s forwards;
  opacity: 0;
}

.entrance-animation-delay-3 {
  animation: fadeInSlide 0.8s ease-out 0.16s forwards;
  opacity: 0;
}

.entrance-animation-delay-4 {
  animation: fadeInSlide 0.8s ease-out 0.24s forwards;
  opacity: 0;
}

.login-badge {
  display: inline-flex;
  align-items: center;
  padding: 10px 18px;
  border-radius: 999px;
  background: var(--color-surface-glass);
  color: var(--color-text-secondary);
  font-size: 0.88rem;
  font-weight: 600;
  margin-bottom: 28px;
  backdrop-filter: blur(12px);
}

.glow-border {
  border: 1px solid var(--color-primary-soft-strong);
  box-shadow: var(--glow-brand);
}

.login-overline {
  color: var(--color-accent);
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: 1.8px;
  font-size: 0.82rem;
  margin-bottom: 14px;
}

.login-title {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: clamp(3rem, 5.5vw, 4.8rem);
  font-weight: 800;
  line-height: 1;
  color: var(--color-text);
  letter-spacing: -2.4px;
  max-width: 620px;
}

.text-gradient {
  background: var(--gradient-accent);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.login-description {
  margin-top: 24px;
  font-size: 1.08rem;
  color: var(--color-text-secondary);
  max-width: 600px;
  line-height: 1.72;
}

.login-stat-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  margin-top: 42px;
}

.glass-dark {
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  backdrop-filter: blur(14px);
  border-radius: 26px;
  box-shadow: var(--shadow-sm);
}

.login-stat-card {
  padding: 22px 20px;
}

.login-stat-value {
  font-size: 1.55rem;
  font-weight: 800;
  color: var(--color-text);
  letter-spacing: -0.8px;
}

.login-stat-label {
  color: var(--color-text-secondary);
  font-size: 0.88rem;
  line-height: 1.5;
  margin-top: 10px;
}

.login-preview {
  margin-top: 40px;
}

.login-preview__surface {
  padding: 28px;
}

.login-preview__top {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: flex-start;
  margin-bottom: 24px;
}

.login-preview__eyebrow {
  color: var(--color-primary);
  text-transform: uppercase;
  font-weight: 700;
  font-size: 0.76rem;
  letter-spacing: 1.1px;
  margin-bottom: 10px;
}

.login-preview__title,
.login-feature__title,
.login-card__title {
  color: var(--color-text);
  font-weight: 700;
}

.login-preview__title {
  font-size: 1.4rem;
  line-height: 1.3;
  max-width: 460px;
}

.live-indicator {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--color-success-soft);
  border: 1px solid var(--color-success-border);
  border-radius: 999px;
  color: var(--color-success);
  font-size: 0.76rem;
  font-weight: 700;
  white-space: nowrap;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  background: var(--color-success);
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.login-preview__illustration {
  position: relative;
  height: 268px;
}

.border-glass {
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
}

.glow-layer {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 100% 0%, var(--color-primary-soft-strong), transparent 72%);
  pointer-events: none;
}

.login-preview__callout {
  position: absolute;
  right: 18px;
  bottom: 18px;
  width: min(260px, calc(100% - 36px));
  padding: 14px 16px;
}

.login-preview__callout-label {
  display: inline-block;
  color: var(--color-primary);
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 6px;
}

.login-preview__callout-title {
  display: block;
  color: var(--color-text);
  line-height: 1.45;
  font-size: 0.94rem;
}

.login-preview__metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin: 22px 0 24px;
}

.login-preview__metric {
  padding: 14px 16px;
  border-radius: 18px;
  background: var(--color-surface-glass);
  border: 1px solid var(--color-border);
}

.login-preview__metric-value {
  font-size: 0.95rem;
  font-weight: 800;
  color: var(--color-text);
  margin-bottom: 6px;
}

.login-preview__metric-label {
  font-size: 0.82rem;
  line-height: 1.5;
  color: var(--color-text-secondary);
}

.login-feature-list {
  display: grid;
  gap: 16px;
}

.login-feature {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr);
  gap: 14px;
  align-items: start;
}

.feature-icon-shell {
  width: 40px;
  height: 40px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary-soft);
  border: 1px solid var(--color-primary-soft-strong);
}

.feature-icon {
  color: var(--color-primary);
}

.login-feature__title {
  font-size: 0.98rem;
}

.login-feature__text {
  font-size: 0.88rem;
  line-height: 1.58;
  margin-top: 6px;
}

.login-card {
  width: 100%;
  max-width: 520px;
}

.glass-premium {
  background: var(--color-surface-glass) !important;
  border: 1px solid var(--color-border) !important;
  backdrop-filter: blur(24px) saturate(180%);
  border-radius: 32px !important;
  box-shadow: var(--shadow-lg);
  padding: 4px;
}

.login-card__content {
  padding: 38px;
}

.login-card__header {
  display: flex;
  gap: 18px;
  align-items: flex-start;
  margin-bottom: 24px;
}

.brand-logo-container {
  flex-shrink: 0;
}

.logo-orb {
  width: 68px;
  height: 68px;
  background: var(--gradient-accent);
  border-radius: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: var(--glow-brand);
}

.login-card__copy {
  min-width: 0;
}

.login-card__eyebrow {
  color: var(--color-primary);
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 1.1px;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.login-card__title {
  font-size: 2rem;
  letter-spacing: -1px;
}

.login-card__subtitle,
.login-feature__text,
.footer-text,
.login-google-hint,
.login-assistance__note {
  color: var(--color-text-secondary);
}

.login-card__subtitle {
  margin-top: 8px;
  line-height: 1.6;
}

.login-trust-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
}

.login-trust-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 12px;
  border-radius: 999px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  font-size: 0.82rem;
  font-weight: 600;
}

.login-trust-item__icon {
  color: var(--color-primary);
}

.login-error {
  margin-bottom: 18px;
  border-radius: 18px;
}

.login-form {
  display: grid;
  gap: 14px;
}

.input-group {
  background: var(--color-surface-glass);
  border: 1px solid var(--color-border);
  border-radius: 18px;
  padding: 10px 16px;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.input-group:focus-within {
  background: var(--color-surface);
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px var(--color-primary-soft);
}

.premium-input {
  width: 100%;
}

.input-icon {
  color: var(--color-text-secondary);
}

.password-toggle {
  color: var(--color-text-secondary) !important;
}

:deep(.v-field__overlay),
:deep(.v-field__outline) {
  display: none;
}

:deep(.v-field__input) {
  color: var(--color-text) !important;
  font-size: 1rem;
  padding-top: 10px;
}

:deep(.v-label) {
  color: var(--color-text-secondary) !important;
}

:deep(.v-field input::placeholder) {
  color: var(--color-text-muted);
  opacity: 1;
}

.login-assistance {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  margin: 4px 0 6px;
}

.login-assistance__note {
  display: inline-flex;
  align-items: center;
  font-size: 0.84rem;
  line-height: 1.5;
}

.assist-link,
.signup-link {
  color: var(--color-accent);
  text-decoration: none;
  font-weight: 700;
  white-space: nowrap;
}

.btn-primary-gradient {
  background: var(--gradient-brand) !important;
  color: var(--color-text-inverse) !important;
  border-radius: 18px !important;
  font-size: 1.02rem !important;
  font-weight: 700 !important;
  text-transform: none !important;
  letter-spacing: -0.4px;
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1) !important;
}

.btn-primary-gradient:hover {
  transform: translateY(-2px);
  box-shadow: var(--glow-brand) !important;
}

.divider-text {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 24px 0 14px;
}

.line {
  flex: 1;
  height: 1px;
  background: var(--color-border);
}

.text {
  color: var(--color-text-secondary);
  font-size: 0.76rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.btn-google-glass {
  border: 1px solid var(--color-border) !important;
  background: var(--color-surface-glass) !important;
  color: var(--color-text) !important;
  border-radius: 18px !important;
  text-transform: none !important;
  font-weight: 700 !important;
}

.btn-google-glass:hover {
  background: var(--color-surface) !important;
}

.login-google-hint {
  margin-top: 12px;
  font-size: 0.82rem;
  line-height: 1.55;
}

.login-google-hint.is-ready {
  color: var(--color-success);
}

.login-footer {
  margin-top: 26px;
  text-align: center;
}

.footer-text {
  font-size: 0.9rem;
  line-height: 1.6;
}

@media (max-width: 1200px) {
  .login-container {
    grid-template-columns: 1fr;
    gap: 30px;
    max-width: 720px;
  }

  .login-showcase {
    order: 2;
  }

  .login-form-side {
    order: 1;
  }

  .login-card {
    max-width: 100%;
  }

  .login-preview {
    margin-top: 12px;
  }
}

@media (max-width: 760px) {
  .login-title {
    font-size: 2.8rem;
    letter-spacing: -1.6px;
  }

  .login-description {
    font-size: 1rem;
  }

  .login-stat-grid,
  .login-preview__metrics {
    grid-template-columns: 1fr;
  }

  .login-preview__top,
  .login-assistance,
  .login-card__header {
    flex-direction: column;
  }

  .login-assistance {
    align-items: flex-start;
  }

  .login-card__content {
    padding: 28px 22px;
  }

  .login-preview__surface {
    padding: 22px;
  }

  .login-preview__illustration {
    height: 220px;
  }

  .login-preview__callout {
    right: 12px;
    bottom: 12px;
    width: calc(100% - 24px);
  }
}
</style>
