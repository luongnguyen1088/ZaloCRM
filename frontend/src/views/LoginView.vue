<template>
  <div class="login-shell">
    <div class="login-container">
      <section class="login-showcase">
        <div class="entrance-animation-delay-1">
          <div class="login-badge glow-border">
            <v-icon size="18" color="primary">mdi-auto-fix</v-icon>
            <span class="ml-2">Claro cho đội ngũ social commerce</span>
          </div>
        </div>

        <div class="login-copy entrance-animation-delay-2">
          <p class="login-overline">Một workspace cho sale, CSKH và automation</p>
          <h1 class="login-title">
            Đăng nhập để tiếp tục
            <span class="text-gradient">vận hành Claro</span>
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
              <v-img :src="heroIllustration" alt="Claro illustration" cover class="rounded-xl border-glass" />
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

            <div class="login-card__microcopy">
              <div class="login-card__microcopy-item">
                <v-icon size="16" class="mr-2">mdi-shield-check-outline</v-icon>
                <span>Bảo mật theo workspace và phân quyền người dùng.</span>
              </div>
              <div class="login-card__microcopy-item">
                <v-icon size="16" class="mr-2">mdi-google</v-icon>
                <span>Hỗ trợ đăng nhập bằng Google Workspace nếu tài khoản đã được liên kết.</span>
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
                  <span>Không truy cập được? <router-link to="/forgot-password" class="assist-link">Quên mật khẩu?</router-link></span>
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

            <div class="google-signin-block">
              <div
                ref="googleButtonHost"
                class="google-button-host"
                :class="{ 'is-visible': googleReady && googleButtonRendered }"
              ></div>

              <v-btn
                v-if="!googleButtonRendered"
                block
                height="54"
                variant="outlined"
                class="btn-google-glass"
                :loading="googleLoading"
                :disabled="loading"
                @click="retryGoogleButton"
              >
                <v-img
                  width="20"
                  height="20"
                  src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png"
                  class="mr-3"
                />
                <span>{{ googleButtonLabel }}</span>
              </v-btn>
            </div>

            <p class="login-google-hint" :class="{ 'is-ready': googleReady }">
              {{ googleHint }}
            </p>

            <v-alert
              v-if="googleDiagnostic.visible"
              :type="googleDiagnostic.level"
              variant="tonal"
              density="comfortable"
              class="login-google-diagnostic"
            >
              <div class="login-google-diagnostic__title">{{ googleDiagnostic.title }}</div>
              <div class="login-google-diagnostic__text">{{ googleDiagnostic.detail }}</div>
            </v-alert>

            <div class="login-google-diagnostic-note">
              Nếu bạn thấy lỗi <strong>`Google connection expired or failed. Please relink your Google account.`</strong>
              ở trang <strong>Tích hợp</strong>, đó là lỗi OAuth của Google Sheets, không phải lỗi đăng nhập Google.
            </div>

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
      initialize: (config: {
        client_id: string;
        callback: (response: GoogleCredentialResponse) => void;
        use_fedcm_for_prompt?: boolean;
      }) => void;
      renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
    };
  };
}

interface GoogleCredentialResponse {
  credential?: string;
}

type GoogleDiagnosticLevel = 'info' | 'warning' | 'error' | 'success';
type GoogleDiagnosticSource = 'backend' | 'integration' | 'init' | 'callback' | 'render';

const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');
const backendUnavailable = ref(false);
const showPassword = ref(false);
const googleReady = ref(false);
const googleLoading = ref(false);
const googleInitialized = ref(false);
const googleButtonRendered = ref(false);
const googleButtonHost = ref<HTMLElement | null>(null);
const googleDiagnostic = ref({
  visible: false,
  source: 'init' as GoogleDiagnosticSource,
  level: 'info' as GoogleDiagnosticLevel,
  title: '',
  detail: '',
});
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

const canSubmit = computed(() => email.value.trim().length > 0 && password.value.length > 0);
const submitLabel = computed(() => (loading.value ? 'Đang đăng nhập...' : 'Vào Claro'));
const googleButtonLabel = computed(() => {
  if (googleLoading.value) {
    return 'Đang tải Google Sign-In';
  }

  return googleReady.value ? 'Tải lại nút Google' : 'Thử tải Google Sign-In';
});
const googleHint = computed(() =>
  googleReady.value
    ? 'Dành cho tài khoản đã liên kết Google Workspace với hệ thống.'
    : 'Nếu nút Google chưa sẵn sàng, hệ thống sẽ tự khởi tạo lại khi bạn bấm.'
);

watch([email, password], () => {
  if (error.value) {
    error.value = '';
  }
  backendUnavailable.value = false;
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
        router.replace('/dashboard');
        return;
      }
    }
  } catch (err: any) {
    if (isBackendUnavailable(err)) {
      backendUnavailable.value = true;
      error.value = 'Máy chủ đăng nhập hiện không phản hồi. Hãy đảm bảo backend đang chạy và kết nối được database.';
      return;
    }
    if (isBackendUnavailable(err)) {
      backendUnavailable.value = true;
      error.value = 'KhÃ´ng thá»ƒ káº¿t ná»‘i tá»›i mÃ¡y chá»§ Ä‘Äƒng nháº­p. HÃ£y kiá»ƒm tra backend/API rá»“i thá»­ láº¡i.';
    }
  }

  const ready = await ensureGoogleReady();
  if (ready) {
    void renderGoogleButton();
  }
});

function initGoogle(identity: GoogleIdentity) {
  if (googleInitialized.value) {
    googleReady.value = true;
    return;
  }

  identity.accounts?.id?.initialize({
    client_id: '926202174216-4v1fml75f5403k79bvoeuau2go3oe1jq.apps.googleusercontent.com',
    callback: handleGoogleCallback,
    use_fedcm_for_prompt: false,
  });
  googleInitialized.value = true;
  googleReady.value = true;
}

async function handleGoogleCallback(response: GoogleCredentialResponse) {
  if (!response.credential) {
    setGoogleDiagnostic(
      'callback',
      'warning',
      'Google đã mở prompt nhưng không trả về token',
      'Người dùng có thể đã đóng popup, hủy chọn tài khoản hoặc trình duyệt chặn bước xác thực cuối.'
    );
    console.warn('[Google Login] Callback returned without credential');
    error.value = 'Không nhận được xác thực từ Google. Vui lòng thử lại.';
    return;
  }

  setGoogleDiagnostic(
    'backend',
    'info',
    'Đã nhận token từ Google',
    'Đang gửi token tới máy chủ để xác thực qua POST /api/v1/auth/google.'
  );
  console.info('[Google Login] Credential received, sending POST /auth/google');
  loading.value = true;
  error.value = '';

  try {
    await authStore.googleLogin(response.credential);
    setGoogleDiagnostic(
      'backend',
      'success',
      'Đăng nhập Google thành công',
      'Máy chủ đã xác thực tài khoản Google và tạo phiên đăng nhập thành công.'
    );
    console.info('[Google Login] POST /auth/google succeeded');
    router.push('/dashboard');
  } catch (err: any) {
    const backendMessage = err.response?.data?.error || err.message || 'Đăng nhập với Google thất bại.';
    const normalized = String(backendMessage).toLowerCase();

    if (normalized.includes('google connection expired') || normalized.includes('relink your google account')) {
      setGoogleDiagnostic(
        'integration',
        'warning',
        'Đây là lỗi Google Sheets integration, không phải lỗi đăng nhập',
        'Token OAuth của Google Sheets ở trang Tích hợp đã hết hạn. Việc đó không phải là bước POST /auth/google của màn đăng nhập.'
      );
    } else {
      setGoogleDiagnostic(
        'backend',
        'error',
        'Google prompt đã xong nhưng POST /auth/google bị lỗi',
        backendMessage
      );
    }

    console.error('[Google Login] POST /auth/google failed:', backendMessage, err);
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
    router.push('/dashboard');
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Đăng nhập thất bại. Kiểm tra lại email và mật khẩu.';
  } finally {
    loading.value = false;
  }
}

function isBackendUnavailable(err: any) {
  if (!err) {
    return false;
  }

  if (!err.response) {
    return true;
  }

  return Number(err.response.status) >= 500;
}

async function retryGoogleButton() {
  error.value = '';
  clearGoogleDiagnostic();

  setGoogleDiagnostic(
    'init',
    'info',
    'Đang chuẩn bị nút Google Sign-In',
    'Hệ thống đang kiểm tra thư viện Google và thử render lại nút đăng nhập chính thức.'
  );
  const ready = await ensureGoogleReady({ force: true });
  if (!ready) {
    setGoogleDiagnostic(
      'init',
      'warning',
      'Google Sign-In chưa sẵn sàng',
      'Thư viện Google chưa khởi tạo xong hoặc bị trình duyệt/extension chặn trước khi nút đăng nhập được render.'
    );
    console.warn('[Google Login] Google library is not ready');
    error.value = 'Google Sign-In chưa sẵn sàng. Vui lòng thử lại sau vài giây hoặc tải lại trang.';
    return;
  }

  const rendered = await renderGoogleButton();
  if (!rendered) {
    setGoogleDiagnostic(
      'render',
      'warning',
      'Không thể render nút Google Sign-In',
      'Thư viện Google đã tải nhưng không render được nút đăng nhập. Kiểm tra trình duyệt, extension hoặc CSP của site.'
    );
    console.warn('[Google Login] Google button render failed');
  }
}

function getGoogleIdentity() {
  return (window as Window & { google?: GoogleIdentity }).google;
}

async function ensureGoogleReady(options?: { force?: boolean }) {
  if (googleReady.value) {
    return true;
  }

  googleLoading.value = true;

  try {
    const availableIdentity = getGoogleIdentity();
    if (availableIdentity?.accounts?.id) {
      initGoogle(availableIdentity);
      return true;
    }

    const script = getGoogleScript();
    if (script && options?.force && !script.dataset.retryBound) {
      script.dataset.retryBound = 'true';
      script.addEventListener(
        'load',
        () => {
          const identity = getGoogleIdentity();
          if (identity?.accounts?.id) {
            initGoogle(identity);
          }
        },
        { once: true }
      );
    }

    const identity = await waitForGoogleIdentity(options?.force ? 30 : 16);
    if (!identity?.accounts?.id) {
      googleReady.value = false;
      return false;
    }

    initGoogle(identity);
    return true;
  } finally {
    googleLoading.value = false;
  }
}

function waitForGoogleIdentity(maxAttempts: number) {
  return new Promise<GoogleIdentity | undefined>((resolve) => {
    let attempts = 0;
    const interval = window.setInterval(() => {
      const identity = getGoogleIdentity();
      if (identity?.accounts?.id || attempts >= maxAttempts) {
        window.clearInterval(interval);
        resolve(identity);
      }
      attempts += 1;
    }, 400);
  });
}

function getGoogleScript() {
  return document.querySelector<HTMLScriptElement>('script[src*="accounts.google.com/gsi/client"]');
}

function setGoogleDiagnostic(
  source: GoogleDiagnosticSource,
  level: GoogleDiagnosticLevel,
  title: string,
  detail: string
) {
  googleDiagnostic.value = {
    visible: true,
    source,
    level,
    title,
    detail,
  };
}

function clearGoogleDiagnostic() {
  googleDiagnostic.value.visible = false;
}

async function renderGoogleButton() {
  if (!googleReady.value) {
    return false;
  }

  const host = googleButtonHost.value;
  const identity = getGoogleIdentity();
  const renderer = identity?.accounts?.id?.renderButton;

  if (!host || !renderer) {
    googleButtonRendered.value = false;
    return false;
  }

  host.innerHTML = '';
  const width = Math.max(Math.round(host.getBoundingClientRect().width || 360), 280);

  renderer(host, {
    type: 'standard',
    theme: 'outline',
    size: 'large',
    text: 'continue_with',
    shape: 'pill',
    logo_alignment: 'left',
    width,
  });

  googleButtonRendered.value = true;
  setGoogleDiagnostic(
    'render',
    'success',
    'Nút Google đã sẵn sàng',
    'Đăng nhập Google giờ dùng nút chính thức của Google thay cho luồng prompt dễ bị skip.'
  );
  console.info('[Google Login] Official Google button rendered');
  return true;
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
  align-items: start;
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

.login-card__microcopy {
  display: grid;
  gap: 10px;
  margin-bottom: 20px;
  padding: 14px 16px;
  border-radius: 20px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}

.login-card__microcopy-item {
  display: inline-flex;
  align-items: flex-start;
  color: var(--color-text-secondary);
  font-size: 0.84rem;
  line-height: 1.5;
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

.google-signin-block {
  margin-top: 2px;
}

.google-button-host {
  display: none;
  min-height: 54px;
  width: 100%;
}

.google-button-host.is-visible {
  display: block;
}

:deep(.google-button-host > div) {
  width: 100% !important;
}

.login-google-hint {
  margin-top: 12px;
  font-size: 0.82rem;
  line-height: 1.55;
  min-height: 2.6em;
}

.login-google-hint.is-ready {
  color: var(--color-success);
}

.login-google-diagnostic {
  margin-top: 10px;
  border-radius: 18px;
}

.login-google-diagnostic__title {
  font-weight: 700;
  margin-bottom: 4px;
}

.login-google-diagnostic__text,
.login-google-diagnostic-note {
  font-size: 0.82rem;
  line-height: 1.55;
}

.login-google-diagnostic-note {
  margin-top: 10px;
  padding: 12px 14px;
  border-radius: 16px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
}

.login-footer {
  margin-top: 26px;
  text-align: center;
}

.footer-text {
  font-size: 0.9rem;
  line-height: 1.6;
}

@media (min-width: 1201px) {
  .login-form-side {
    position: sticky;
    top: clamp(20px, 4vh, 40px);
    align-self: start;
  }
}

@media (max-height: 920px) and (min-width: 1201px) {
  .login-container {
    gap: 52px;
  }

  .login-badge {
    margin-bottom: 20px;
  }

  .login-title {
    font-size: clamp(2.7rem, 4.5vw, 4rem);
  }

  .login-description {
    margin-top: 18px;
    font-size: 1rem;
    line-height: 1.62;
  }

  .login-stat-grid {
    margin-top: 30px;
    gap: 14px;
  }

  .login-stat-card {
    padding: 18px 18px;
  }

  .login-preview {
    margin-top: 24px;
  }

  .login-preview__surface {
    padding: 22px;
  }

  .login-preview__top {
    margin-bottom: 18px;
  }

  .login-preview__illustration {
    height: 220px;
  }

  .login-preview__metrics {
    gap: 12px;
    margin: 18px 0 18px;
  }

  .login-preview__metric {
    padding: 12px 14px;
  }

  .login-feature-list {
    gap: 12px;
  }
}

@media (max-height: 820px) and (min-width: 1201px) {
  .login-container {
    gap: 42px;
  }

  .login-stat-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .login-preview__metrics {
    display: none;
  }

  .login-preview__illustration {
    height: 188px;
  }

  .login-preview__callout {
    padding: 12px 14px;
  }

  .login-feature__text {
    margin-top: 4px;
  }
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
