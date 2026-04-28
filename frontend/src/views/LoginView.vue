<template>
  <div class="login-page">
    <div class="login-backdrop">
      <div class="backdrop-orb backdrop-orb--blue"></div>
      <div class="backdrop-orb backdrop-orb--amber"></div>
      <div class="backdrop-grid"></div>
    </div>

    <div class="login-layout">
      <section class="login-hero">
        <div class="hero-pill">
          <v-icon size="18" color="primary">mdi-creation-outline</v-icon>
          <span>Claro AI sales workspace</span>
        </div>

        <div class="hero-copy">
          <p class="hero-overline">Social commerce operations</p>
          <h1 class="hero-title">
            Đăng nhập để quay lại
            <span class="hero-title__accent">bàn điều phối bán hàng</span>
          </h1>
          <p class="hero-description">
            Theo dõi hội thoại, lịch hẹn, trạng thái xử lý và gợi ý AI trong một giao diện duy nhất cho đội sale và CSKH.
          </p>
        </div>

        <div class="hero-stats">
          <article v-for="stat in quickStats" :key="stat.label" class="stat-card">
            <div class="stat-card__value">{{ stat.value }}</div>
            <div class="stat-card__label">{{ stat.label }}</div>
          </article>
        </div>

        <div class="workspace-board">
          <div class="workspace-board__header">
            <div>
              <p class="workspace-board__eyebrow">Realtime workspace</p>
              <h2 class="workspace-board__title">Mọi tín hiệu bán hàng được gom về một màn hình rõ ràng</h2>
            </div>

            <div class="workspace-board__status">
              <span class="status-dot"></span>
              <span>Đồng bộ liên tục</span>
            </div>
          </div>

          <div class="workspace-board__media">
            <v-img :src="heroIllustration" alt="Claro workspace" cover class="workspace-board__image" />

            <div class="workspace-board__floating">
              <div class="workspace-board__floating-label">AI Summary</div>
              <strong>Rút gọn hội thoại dài thành các ý chính để sale phản hồi nhanh hơn</strong>
            </div>
          </div>

          <div class="workspace-board__signals">
            <div v-for="signal in workspaceSignals" :key="signal.label" class="signal-card">
              <div class="signal-card__label">{{ signal.label }}</div>
              <div class="signal-card__value">{{ signal.value }}</div>
              <div class="signal-card__note">{{ signal.note }}</div>
            </div>
          </div>

          <div class="workflow-list">
            <article v-for="item in highlights" :key="item.title" class="workflow-card">
              <div class="workflow-card__icon">
                <v-icon size="20">{{ item.icon }}</v-icon>
              </div>

              <div>
                <div class="workflow-card__title">{{ item.title }}</div>
                <div class="workflow-card__text">{{ item.description }}</div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section class="login-panel-wrap">
        <v-card class="login-panel" elevation="0">
          <div class="login-panel__inner">
            <header class="panel-header">
              <div class="panel-brand">
                <div class="panel-brand__orb">
                  <v-icon size="28" color="white">mdi-lightning-bolt</v-icon>
                </div>

                <div>
                  <div class="panel-brand__eyebrow">Đăng nhập workspace</div>
                  <h2 class="panel-brand__title">Chào mừng trở lại</h2>
                </div>
              </div>

              <p class="panel-brand__description">
                Dùng email công việc hoặc Google Workspace đã được liên kết để vào lại dashboard.
              </p>
            </header>

            <div class="entry-points">
              <div class="entry-point">
                <v-icon size="16">mdi-email-outline</v-icon>
                <span>Email nội bộ</span>
              </div>
              <div class="entry-point">
                <v-icon size="16">mdi-google</v-icon>
                <span>Google Workspace</span>
              </div>
              <div class="entry-point">
                <v-icon size="16">mdi-shield-check-outline</v-icon>
                <span>Phân quyền theo workspace</span>
              </div>
            </div>

            <v-alert
              v-if="error"
              type="error"
              variant="tonal"
              density="comfortable"
              class="panel-alert"
            >
              {{ error }}
            </v-alert>

            <v-form class="login-form" @submit.prevent="handleLogin">
              <div class="field-shell">
                <label class="field-label" for="login-email">Email công việc</label>
                <v-text-field
                  id="login-email"
                  v-model="email"
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
                    <v-icon class="field-icon mr-2">mdi-email-outline</v-icon>
                  </template>
                </v-text-field>
              </div>

              <div class="field-shell">
                <div class="field-label-row">
                  <label class="field-label" for="login-password">Mật khẩu</label>
                  <router-link to="/forgot-password" class="inline-link">Quên mật khẩu?</router-link>
                </div>

                <v-text-field
                  id="login-password"
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  variant="plain"
                  autocomplete="current-password"
                  placeholder="Nhập mật khẩu của bạn"
                  required
                  hide-details
                  class="premium-input"
                >
                  <template #prepend-inner>
                    <v-icon class="field-icon mr-2">mdi-lock-outline</v-icon>
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
                      <v-icon class="field-icon">
                        {{ showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline' }}
                      </v-icon>
                    </v-btn>
                  </template>
                </v-text-field>
              </div>

              <div class="form-meta">
                <div class="form-meta__note">
                  <v-icon size="16">mdi-shield-check-outline</v-icon>
                  <span>Chỉ tài khoản đã được cấp quyền trong workspace mới đăng nhập được.</span>
                </div>

                <router-link to="/register" class="inline-link">Tạo workspace mới</router-link>
              </div>

              <v-btn
                type="submit"
                height="58"
                block
                class="primary-button"
                :loading="loading"
                :disabled="loading || !canSubmit"
              >
                <span>{{ submitLabel }}</span>
                <v-icon end>mdi-arrow-right</v-icon>
              </v-btn>
            </v-form>

            <div class="divider">
              <span class="divider__line"></span>
              <span class="divider__text">Hoặc tiếp tục với</span>
              <span class="divider__line"></span>
            </div>

            <div class="google-area">
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
                class="google-fallback"
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

              <p class="google-hint" :class="{ 'is-ready': googleReady }">
                {{ googleHint }}
              </p>
            </div>

            <v-alert
              v-if="googleDiagnostic.visible"
              :type="googleDiagnostic.level"
              variant="tonal"
              density="comfortable"
              class="panel-alert panel-alert--google"
            >
              <div class="google-diagnostic__title">{{ googleDiagnostic.title }}</div>
              <div class="google-diagnostic__text">{{ googleDiagnostic.detail }}</div>
            </v-alert>

            <div class="integration-note">
              Nếu bạn thấy lỗi <strong>`Google connection expired or failed. Please relink your Google account.`</strong>
              ở trang <strong>Tích hợp</strong>, đó là lỗi OAuth của Google Sheets chứ không phải lỗi đăng nhập Google.
            </div>

            <footer class="panel-footer">
              <span>Chưa có hệ thống cho đội ngũ của bạn?</span>
              <router-link to="/register" class="inline-link">Thiết lập workspace mới</router-link>
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
import { GOOGLE_CLIENT_ID, hasGoogleClientId } from '@/config/google';
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
  { value: '< 5 phút', label: 'Nắm trạng thái lịch hẹn và hội thoại nhanh hơn' },
  { value: '24/7', label: 'AI hỗ trợ ngoài giờ và lúc đội sale quá tải' },
];

const workspaceSignals = [
  { label: 'Inbox hợp nhất', value: '1 workspace', note: 'Chat, CRM và AI trên cùng một màn hình.' },
  { label: 'Nhắc việc', value: 'Theo bước', note: 'Không bỏ quên follow-up hoặc lịch đã hẹn.' },
  { label: 'Đề xuất trả lời', value: 'Realtime', note: 'AI hỗ trợ tóm tắt và gợi ý phản hồi ngay trong luồng chat.' },
];

const highlights = [
  {
    icon: 'mdi-auto-fix',
    title: 'AI Smart Summary',
    description: 'Tóm tắt nhanh bối cảnh để sale không phải đọc lại toàn bộ cuộc hội thoại trước khi trả lời.',
  },
  {
    icon: 'mdi-chart-line',
    title: 'Pipeline rõ ràng',
    description: 'Nhìn được lead mới, lịch hẹn, cơ hội và bước tiếp theo trong một flow thống nhất.',
  },
  {
    icon: 'mdi-robot-outline',
    title: 'Automation đúng lúc',
    description: 'Kích hoạt các tác vụ lặp lại theo điều kiện mà không phải nhảy giữa nhiều tab.',
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
    : 'Nếu nút Google chưa sẵn sàng, hệ thống sẽ thử khởi tạo lại khi bạn bấm.'
);

watch([email, password], () => {
  if (error.value) {
    error.value = '';
  }

  backendUnavailable.value = false;
});

onMounted(async () => {
  try {
    const needsSetup = await authStore.checkSetup();
    if (needsSetup) {
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
      error.value =
        'Máy chủ đăng nhập hiện không phản hồi. Hãy kiểm tra backend, kết nối database và thử lại sau.';
      return;
    }
  }

  if (!hasGoogleClientId()) {
    setGoogleDiagnostic(
      'init',
      'warning',
      'Google Sign-In chưa được cấu hình',
      'Thiếu VITE_GOOGLE_CLIENT_ID ở frontend. Google login sẽ không hoạt động cho tới khi bạn thêm biến môi trường này.'
    );
    return;
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
    client_id: GOOGLE_CLIENT_ID,
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
    error.value = 'Không nhận được xác thực từ Google. Vui lòng thử lại.';
    return;
  }

  setGoogleDiagnostic(
    'backend',
    'info',
    'Đã nhận token từ Google',
    'Đang gửi token tới máy chủ để xác thực qua POST /api/v1/auth/google.'
  );

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
    } else if (isBackendUnavailable(err)) {
      setGoogleDiagnostic(
        'backend',
        'error',
        'Máy chủ chưa phản hồi cho Google Sign-In',
        'Frontend đã nhận token từ Google nhưng backend không hoàn tất bước xác thực.'
      );
    } else {
      setGoogleDiagnostic('backend', 'error', 'Google prompt đã xong nhưng POST /auth/google bị lỗi', backendMessage);
    }

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
    if (isBackendUnavailable(err)) {
      backendUnavailable.value = true;
      error.value = 'Máy chủ đăng nhập hiện không phản hồi. Hãy thử lại sau khi backend sẵn sàng.';
    } else {
      error.value = err.response?.data?.error || 'Đăng nhập thất bại. Kiểm tra lại email và mật khẩu.';
    }
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
      'Thư viện Google chưa khởi tạo xong hoặc bị trình duyệt hay extension chặn trước khi nút đăng nhập được render.'
    );
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
    'Đăng nhập Google giờ dùng nút chính thức của Google thay cho luồng prompt dễ bị bỏ qua.'
  );

  return true;
}
</script>

<style scoped>
.login-page {
  position: relative;
  overflow: hidden;
  min-height: 100vh;
  padding: clamp(24px, 4vw, 40px);
}

.login-backdrop {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.backdrop-orb {
  position: absolute;
  border-radius: 999px;
  filter: blur(90px);
  opacity: 0.55;
}

.backdrop-orb--blue {
  top: -120px;
  left: -40px;
  width: 360px;
  height: 360px;
  background: rgba(42, 106, 255, 0.28);
}

.backdrop-orb--amber {
  right: -120px;
  bottom: 40px;
  width: 340px;
  height: 340px;
  background: rgba(255, 187, 89, 0.22);
}

.backdrop-grid {
  position: absolute;
  inset: 0;
  background-image: linear-gradient(rgba(120, 134, 160, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(120, 134, 160, 0.08) 1px, transparent 1px);
  background-size: 34px 34px;
  mask-image: radial-gradient(circle at center, black 42%, transparent 88%);
}

.login-layout {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 1.08fr) minmax(420px, 0.92fr);
  gap: 52px;
  width: 100%;
  max-width: 1320px;
  margin: 0 auto;
  align-items: start;
}

.login-hero {
  display: grid;
  gap: 24px;
  padding-top: 8px;
}

.hero-pill {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  width: fit-content;
  padding: 12px 18px;
  border-radius: 999px;
  border: 1px solid var(--color-primary-soft-strong);
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(16px);
  color: var(--color-text-secondary);
  box-shadow: var(--glow-brand);
  font-size: 0.88rem;
  font-weight: 700;
}

.hero-copy {
  max-width: 660px;
}

.hero-overline {
  margin-bottom: 14px;
  color: var(--color-accent);
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 1.8px;
  text-transform: uppercase;
}

.hero-title {
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: var(--color-text);
  font-size: clamp(2.7rem, 4.5vw, 4.45rem);
  line-height: 1.08;
  letter-spacing: -2.1px;
  font-weight: 800;
}

.hero-title__accent {
  background: var(--gradient-accent);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-description {
  margin-top: 18px;
  max-width: 620px;
  color: var(--color-text-secondary);
  font-size: 1.02rem;
  line-height: 1.66;
}

.hero-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.stat-card,
.workspace-board,
.login-panel,
.signal-card,
.workflow-card {
  border: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(18px);
  box-shadow: var(--shadow-sm);
}

.stat-card {
  padding: 20px 18px;
  border-radius: 24px;
}

.stat-card__value {
  color: var(--color-text);
  font-size: 1.55rem;
  font-weight: 800;
  letter-spacing: -0.8px;
}

.stat-card__label {
  margin-top: 10px;
  color: var(--color-text-secondary);
  font-size: 0.88rem;
  line-height: 1.55;
}

.workspace-board {
  padding: 24px;
  border-radius: 32px;
}

.workspace-board__header {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: flex-start;
}

.workspace-board__eyebrow {
  margin-bottom: 10px;
  color: var(--color-primary);
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 1.2px;
  text-transform: uppercase;
}

.workspace-board__title {
  max-width: 500px;
  color: var(--color-text);
  font-size: 1.35rem;
  line-height: 1.32;
  font-weight: 700;
}

.workspace-board__status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 999px;
  background: var(--color-success-soft);
  border: 1px solid var(--color-success-border);
  color: var(--color-success);
  font-size: 0.78rem;
  font-weight: 700;
  white-space: nowrap;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: currentColor;
  box-shadow: 0 0 0 6px rgba(34, 197, 94, 0.12);
}

.workspace-board__media {
  position: relative;
  margin-top: 20px;
  height: 270px;
}

.workspace-board__image {
  height: 100%;
  border-radius: 24px;
  border: 1px solid var(--color-border);
}

.workspace-board__media::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 24px;
  background: radial-gradient(circle at top right, rgba(33, 91, 255, 0.32), transparent 48%);
  pointer-events: none;
}

.workspace-board__floating {
  position: absolute;
  right: 18px;
  bottom: 18px;
  width: min(280px, calc(100% - 36px));
  padding: 16px 18px;
  border-radius: 22px;
  background: rgba(10, 18, 39, 0.78);
  color: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(20px);
}

.workspace-board__floating-label {
  margin-bottom: 8px;
  color: rgba(173, 212, 255, 0.95);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.workspace-board__signals {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-top: 18px;
}

.signal-card {
  border-radius: 20px;
  padding: 16px;
}

.signal-card__label {
  color: var(--color-text-muted);
  font-size: 0.76rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.signal-card__value {
  margin: 8px 0 6px;
  color: var(--color-text);
  font-size: 1rem;
  font-weight: 800;
}

.signal-card__note {
  color: var(--color-text-secondary);
  font-size: 0.84rem;
  line-height: 1.55;
}

.workflow-list {
  display: grid;
  gap: 14px;
  margin-top: 18px;
}

.workflow-card {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  gap: 14px;
  padding: 16px;
  border-radius: 22px;
}

.workflow-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 14px;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  border: 1px solid var(--color-primary-soft-strong);
}

.workflow-card__title {
  color: var(--color-text);
  font-size: 0.98rem;
  font-weight: 700;
}

.workflow-card__text {
  margin-top: 6px;
  color: var(--color-text-secondary);
  font-size: 0.88rem;
  line-height: 1.56;
}

.login-panel-wrap {
  display: flex;
  justify-content: center;
}

.login-panel {
  width: 100%;
  max-width: 520px;
  border-radius: 34px !important;
  background: rgba(255, 255, 255, 0.86) !important;
  box-shadow: var(--shadow-lg) !important;
}

.login-panel__inner {
  padding: 30px;
}

.panel-header {
  margin-bottom: 18px;
}

.panel-brand {
  display: flex;
  gap: 16px;
  align-items: center;
}

.panel-brand__orb {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 62px;
  height: 62px;
  border-radius: 20px;
  background: var(--gradient-brand);
  box-shadow: var(--glow-brand);
}

.panel-brand__eyebrow {
  color: var(--color-primary);
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 1.1px;
  text-transform: uppercase;
}

.panel-brand__title {
  color: var(--color-text);
  font-size: 1.95rem;
  font-weight: 800;
  letter-spacing: -1px;
}

.panel-brand__description {
  margin-top: 14px;
  color: var(--color-text-secondary);
  line-height: 1.62;
}

.entry-points {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 18px;
}

.entry-point {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 18px;
  background: rgba(245, 247, 252, 0.9);
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  font-size: 0.84rem;
  font-weight: 600;
}

.panel-alert {
  margin-bottom: 18px;
  border-radius: 18px;
}

.login-form {
  display: grid;
  gap: 14px;
}

.field-shell {
  padding: 10px 16px;
  border-radius: 20px;
  border: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.75);
  transition: all 0.28s ease;
}

.field-shell:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px var(--color-primary-soft);
  background: rgba(255, 255, 255, 0.96);
}

.field-label-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.field-label {
  display: block;
  margin-bottom: 4px;
  color: var(--color-text-secondary);
  font-size: 0.84rem;
  font-weight: 700;
}

.field-icon {
  color: var(--color-text-secondary);
}

.premium-input {
  width: 100%;
}

.password-toggle {
  color: var(--color-text-secondary) !important;
}

:deep(.v-field__overlay),
:deep(.v-field__outline) {
  display: none;
}

:deep(.v-field__input) {
  padding-top: 6px;
  color: var(--color-text) !important;
  font-size: 1rem;
}

:deep(.v-field input::placeholder) {
  color: var(--color-text-muted);
  opacity: 1;
}

.form-meta {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: center;
  margin: 2px 0 6px;
}

.form-meta__note {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--color-text-secondary);
  font-size: 0.82rem;
  line-height: 1.5;
}

.inline-link {
  color: var(--color-accent);
  font-weight: 700;
  text-decoration: none;
  white-space: nowrap;
}

.primary-button {
  border-radius: 20px !important;
  background: var(--gradient-brand) !important;
  color: var(--color-text-inverse) !important;
  font-size: 1.02rem !important;
  font-weight: 700 !important;
  text-transform: none !important;
  letter-spacing: -0.2px;
  transition: transform 0.25s ease, box-shadow 0.25s ease !important;
}

.primary-button:hover {
  transform: translateY(-1px);
  box-shadow: var(--glow-brand) !important;
}

.divider {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 20px 0 12px;
}

.divider__line {
  flex: 1;
  height: 1px;
  background: var(--color-border);
}

.divider__text {
  color: var(--color-text-muted);
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.google-area {
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

.google-fallback {
  border-radius: 18px !important;
  border: 1px solid var(--color-border) !important;
  background: rgba(255, 255, 255, 0.7) !important;
  color: var(--color-text) !important;
  font-weight: 700 !important;
  text-transform: none !important;
}

.google-hint {
  min-height: 2.7em;
  margin-top: 12px;
  color: var(--color-text-secondary);
  font-size: 0.82rem;
  line-height: 1.55;
}

.google-hint.is-ready {
  color: var(--color-success);
}

.panel-alert--google {
  margin-top: 8px;
  margin-bottom: 0;
}

.google-diagnostic__title {
  margin-bottom: 4px;
  font-weight: 700;
}

.google-diagnostic__text {
  font-size: 0.82rem;
  line-height: 1.55;
}

.integration-note {
  margin-top: 10px;
  padding: 13px 15px;
  border-radius: 18px;
  border: 1px solid var(--color-border);
  background: rgba(245, 247, 252, 0.9);
  color: var(--color-text-secondary);
  font-size: 0.82rem;
  line-height: 1.6;
}

.panel-footer {
  display: flex;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 20px;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  text-align: center;
}

@media (min-width: 1201px) {
  .login-panel-wrap {
    position: sticky;
    top: 18px;
    align-self: start;
  }
}

@media (max-width: 1200px) {
  .login-layout {
    grid-template-columns: 1fr;
    max-width: 760px;
    gap: 30px;
  }

  .login-panel-wrap {
    order: 1;
  }

  .login-hero {
    order: 2;
  }
}

@media (max-width: 760px) {
  .login-page {
    padding: 18px;
  }

  .hero-title {
    font-size: 2.5rem;
    letter-spacing: -1.3px;
    line-height: 1.1;
  }

  .hero-description {
    font-size: 1rem;
  }

  .hero-stats,
  .workspace-board__signals {
    grid-template-columns: 1fr;
  }

  .workspace-board,
  .login-panel__inner {
    padding: 22px;
  }

  .workspace-board__header,
  .field-label-row,
  .form-meta,
  .panel-brand {
    flex-direction: column;
    align-items: flex-start;
  }

  .workspace-board__media {
    height: 220px;
  }

  .workspace-board__floating {
    right: 12px;
    bottom: 12px;
    width: calc(100% - 24px);
  }

  .panel-brand__title {
    font-size: 1.72rem;
  }

  .entry-points {
    display: grid;
  }
}
</style>
