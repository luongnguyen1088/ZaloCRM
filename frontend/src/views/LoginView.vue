<template>
  <div class="login-shell">
    <section class="login-showcase">
      <div class="login-badge">
        <v-icon size="18">mdi-sparkles</v-icon>
        ZaloCRM cho đội sale và CSKH
      </div>

      <div class="login-copy">
        <p class="login-overline">Vận hành hội thoại tập trung</p>
        <h1 class="login-title">Đăng nhập để quản lý toàn bộ Zalo OA, lead và lịch hẹn trong một nơi.</h1>
        <p class="login-description">
          Theo dõi phản hồi khách hàng, phân phối hội thoại cho đội ngũ và kích hoạt automation
          mà không phải chuyển qua nhiều công cụ rời rạc.
        </p>
      </div>

      <div class="login-stat-grid">
        <article v-for="stat in quickStats" :key="stat.label" class="login-stat-card">
          <div class="login-stat-value">{{ stat.value }}</div>
          <div class="login-stat-label">{{ stat.label }}</div>
        </article>
      </div>

      <div class="login-preview">
        <div class="login-preview__surface">
          <div class="login-preview__top">
            <div>
              <p class="login-preview__eyebrow">Bảng điều phối</p>
              <h2 class="login-preview__title">Nhìn nhanh trạng thái vận hành</h2>
            </div>
            <v-chip size="small" color="success" variant="tonal">
              <v-icon start size="14">mdi-check-decagram</v-icon>
              Online ổn định
            </v-chip>
          </div>

          <v-img :src="heroIllustration" alt="ZaloCRM illustration" class="login-preview__image" cover />

          <div class="login-feature-list">
            <div v-for="item in highlights" :key="item.title" class="login-feature">
              <div class="login-feature__icon">
                <v-icon size="18">{{ item.icon }}</v-icon>
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

    <v-card class="login-card" elevation="0">
      <div class="login-card__header">
        <div class="login-brand">
          <div class="login-brand__icon">
            <v-icon size="26" color="white">mdi-robot-love-outline</v-icon>
          </div>
          <div>
            <p class="login-brand__name">ZaloCRM</p>
            <p class="login-brand__sub">Bảo mật phiên đăng nhập bằng email hoặc Google</p>
          </div>
        </div>

        <div>
          <h2 class="login-card__title">Chào mừng trở lại</h2>
          <p class="login-card__description">
            Đăng nhập để tiếp tục xử lý hội thoại, theo dõi pipeline và điều phối tài khoản Zalo.
          </p>
        </div>
      </div>

      <v-alert
        v-if="error"
        type="error"
        density="comfortable"
        variant="tonal"
        border="start"
        class="mb-5"
      >
        {{ error }}
      </v-alert>

      <v-form @submit.prevent="handleLogin">
        <v-text-field
          v-model="email"
          label="Email công việc"
          type="email"
          prepend-inner-icon="mdi-email-outline"
          autocomplete="email"
          clearable
          required
          hide-details="auto"
          class="mb-4"
        />

        <v-text-field
          v-model="password"
          :type="showPassword ? 'text' : 'password'"
          label="Mật khẩu"
          prepend-inner-icon="mdi-lock-outline"
          :append-inner-icon="showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
          autocomplete="current-password"
          required
          hide-details="auto"
          class="mb-2"
          @click:append-inner="showPassword = !showPassword"
        />

        <div class="login-meta mb-6">
          <div class="login-meta__item">
            <v-icon size="16">mdi-shield-check-outline</v-icon>
            Kết nối được mã hóa và giữ an toàn trong phiên làm việc.
          </div>
          <router-link to="/register" class="login-meta__link">Tạo tài khoản mới</router-link>
        </div>

        <v-btn
          type="submit"
          color="primary"
          block
          size="x-large"
          :loading="loading"
          :disabled="!canSubmit"
          rounded="xl"
          class="login-submit"
        >
          <v-icon start>mdi-login-variant</v-icon>
          Đăng nhập
        </v-btn>
      </v-form>

      <div class="login-divider">
        <span>hoặc</span>
      </div>

      <v-btn
        block
        variant="outlined"
        size="large"
        rounded="xl"
        class="login-google"
        :disabled="loading || !googleReady"
        @click="loginWithGoogle"
      >
        <v-icon start>mdi-google</v-icon>
        {{ googleReady ? 'Tiếp tục với Google' : 'Đang tải Google Sign-In...' }}
      </v-btn>

      <div class="login-footer">
        <span>Chưa có tài khoản?</span>
        <router-link to="/register" class="login-footer__link">Đăng ký ngay</router-link>
      </div>
    </v-card>
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
  { value: '1 màn hình', label: 'gom hội thoại, lead và lịch hẹn' },
  { value: 'Real-time', label: 'đồng bộ trạng thái Zalo nhiều tài khoản' },
  { value: 'AI-ready', label: 'hỗ trợ tóm tắt và gợi ý phản hồi nhanh' },
];

const highlights = [
  {
    icon: 'mdi-message-processing-outline',
    title: 'Hội thoại tập trung',
    description: 'Không bỏ sót inbox khi nhiều nhân viên cùng chăm sóc khách hàng.',
  },
  {
    icon: 'mdi-account-multiple-outline',
    title: 'Phân tuyến rõ ràng',
    description: 'Giao lead và lịch hẹn theo đội ngũ, trạng thái và khối lượng xử lý.',
  },
  {
    icon: 'mdi-flash-outline',
    title: 'Automation liền mạch',
    description: 'Kích hoạt template, nhắc lịch và hành động sau bán ngay trong CRM.',
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
    return;
  }

  googleIdentity.accounts.id.initialize({
    client_id: '926202174216-4v1fml75f5403k79bvoeuau2go3oe1jq.apps.googleusercontent.com',
    callback: handleGoogleCallback,
  });
  googleReady.value = true;
});

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
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(380px, 460px);
  gap: 28px;
  align-items: stretch;
}

.login-showcase {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 28px 12px 28px 0;
  color: rgba(230, 241, 255, 0.96);
}

.login-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
  margin-bottom: 20px;
  padding: 10px 14px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(11, 24, 44, 0.4);
  backdrop-filter: blur(14px);
  font-size: 0.9rem;
  font-weight: 600;
}

.login-copy {
  max-width: 640px;
}

.login-overline {
  margin-bottom: 10px;
  color: rgba(0, 242, 255, 0.92);
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.login-title {
  margin: 0;
  color: #fff;
  font-size: clamp(2.3rem, 5vw, 4.4rem);
  line-height: 1.02;
  letter-spacing: -0.05em;
}

.login-description {
  margin-top: 20px;
  max-width: 620px;
  font-size: 1.05rem;
  line-height: 1.7;
  color: rgba(214, 225, 244, 0.84);
}

.login-stat-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-top: 30px;
}

.login-stat-card {
  padding: 18px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  background: rgba(11, 24, 44, 0.48);
  backdrop-filter: blur(16px);
}

.login-stat-value {
  color: #fff;
  font-size: 1.15rem;
  font-weight: 700;
}

.login-stat-label {
  margin-top: 8px;
  color: rgba(214, 225, 244, 0.72);
  line-height: 1.55;
}

.login-preview {
  margin-top: 26px;
  max-width: 760px;
}

.login-preview__surface {
  position: relative;
  overflow: hidden;
  padding: 22px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 30px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(11, 24, 44, 0.42)),
    rgba(11, 24, 44, 0.36);
  backdrop-filter: blur(18px);
  box-shadow: 0 30px 80px rgba(3, 9, 20, 0.34);
}

.login-preview__surface::after {
  content: '';
  position: absolute;
  inset: auto -60px -80px auto;
  width: 220px;
  height: 220px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(0, 242, 255, 0.2), transparent 70%);
}

.login-preview__top {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
}

.login-preview__eyebrow {
  color: rgba(190, 205, 226, 0.74);
  font-size: 0.8rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.login-preview__title {
  margin-top: 6px;
  color: #fff;
  font-size: 1.35rem;
  font-weight: 700;
}

.login-preview__image {
  margin: 22px 0 20px;
  height: 220px;
  border-radius: 24px;
  background:
    radial-gradient(circle at top, rgba(255, 255, 255, 0.08), rgba(11, 24, 44, 0.08)),
    linear-gradient(135deg, rgba(0, 242, 255, 0.08), rgba(59, 92, 255, 0.14));
}

.login-feature-list {
  display: grid;
  gap: 14px;
}

.login-feature {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr);
  gap: 12px;
  align-items: flex-start;
}

.login-feature__icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 14px;
  color: #0a192f;
  background: linear-gradient(135deg, #00f2ff, #7ae7ff);
}

.login-feature__title {
  color: #fff;
  font-weight: 700;
}

.login-feature__text {
  margin-top: 4px;
  color: rgba(214, 225, 244, 0.72);
  line-height: 1.55;
}

.login-card {
  align-self: center;
  padding: 28px;
  border-radius: 32px !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  background:
    linear-gradient(180deg, rgba(17, 34, 64, 0.92), rgba(12, 27, 50, 0.86)) !important;
  box-shadow: 0 24px 60px rgba(4, 10, 24, 0.34);
}

.login-card__header {
  display: grid;
  gap: 18px;
  margin-bottom: 24px;
}

.login-brand {
  display: flex;
  gap: 14px;
  align-items: center;
}

.login-brand__icon {
  display: grid;
  place-items: center;
  width: 54px;
  height: 54px;
  border-radius: 18px;
  background: linear-gradient(135deg, #00f2ff, #0077b6);
  box-shadow: 0 18px 34px rgba(0, 242, 255, 0.18);
}

.login-brand__name {
  color: #fff;
  font-size: 1.15rem;
  font-weight: 700;
}

.login-brand__sub {
  margin-top: 4px;
  color: rgba(214, 225, 244, 0.72);
  line-height: 1.5;
}

.login-card__title {
  margin: 0;
  color: #fff;
  font-size: 1.95rem;
  font-weight: 700;
}

.login-card__description {
  margin-top: 10px;
  color: rgba(214, 225, 244, 0.74);
  line-height: 1.65;
}

.login-meta {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.login-meta__item {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  color: rgba(214, 225, 244, 0.78);
  font-size: 0.92rem;
}

.login-meta__link,
.login-footer__link {
  color: #7ae7ff;
  font-weight: 700;
  text-decoration: none;
}

.login-meta__link:hover,
.login-footer__link:hover {
  text-decoration: underline;
}

.login-submit {
  min-height: 54px;
  font-size: 1rem;
  font-weight: 700;
}

.login-divider {
  position: relative;
  margin: 24px 0;
  text-align: center;
}

.login-divider::before {
  content: '';
  position: absolute;
  inset: 50% 0 auto;
  border-top: 1px solid rgba(255, 255, 255, 0.09);
}

.login-divider span {
  position: relative;
  padding: 0 14px;
  background: rgba(16, 32, 58, 0.96);
  color: rgba(214, 225, 244, 0.66);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.78rem;
}

.login-google {
  min-height: 52px;
  border-color: rgba(255, 255, 255, 0.12) !important;
  color: rgba(230, 241, 255, 0.96);
}

.login-footer {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 22px;
  color: rgba(214, 225, 244, 0.72);
}

:deep(.v-field) {
  background: rgba(255, 255, 255, 0.04);
}

:deep(.v-field__outline) {
  --v-field-border-opacity: 0.18;
}

:deep(.v-field--focused) {
  box-shadow: 0 0 0 4px rgba(0, 242, 255, 0.08);
}

:global(.v-theme--light) .login-showcase {
  color: #0f172a;
}

:global(.v-theme--light) .login-badge,
:global(.v-theme--light) .login-stat-card,
:global(.v-theme--light) .login-preview__surface {
  border-color: rgba(15, 23, 42, 0.08);
  background: rgba(255, 255, 255, 0.74);
}

:global(.v-theme--light) .login-title,
:global(.v-theme--light) .login-preview__title,
:global(.v-theme--light) .login-feature__title,
:global(.v-theme--light) .login-stat-value {
  color: #081222;
}

:global(.v-theme--light) .login-description,
:global(.v-theme--light) .login-stat-label,
:global(.v-theme--light) .login-feature__text,
:global(.v-theme--light) .login-overline,
:global(.v-theme--light) .login-preview__eyebrow {
  color: rgba(15, 23, 42, 0.74);
}

:global(.v-theme--light) .login-card {
  border-color: rgba(15, 23, 42, 0.08) !important;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.97), rgba(245, 248, 252, 0.96)) !important;
}

:global(.v-theme--light) .login-brand__name,
:global(.v-theme--light) .login-card__title {
  color: #081222;
}

:global(.v-theme--light) .login-brand__sub,
:global(.v-theme--light) .login-card__description,
:global(.v-theme--light) .login-meta__item,
:global(.v-theme--light) .login-footer {
  color: rgba(15, 23, 42, 0.7);
}

:global(.v-theme--light) .login-divider::before {
  border-top-color: rgba(15, 23, 42, 0.09);
}

:global(.v-theme--light) .login-divider span {
  background: rgba(252, 253, 255, 0.98);
  color: rgba(15, 23, 42, 0.55);
}

:global(.v-theme--light) .login-google {
  border-color: rgba(15, 23, 42, 0.1) !important;
  color: #081222;
}

:global(.v-theme--light) :deep(.v-field) {
  background: rgba(15, 23, 42, 0.02);
}

@media (max-width: 1100px) {
  .login-shell {
    grid-template-columns: 1fr;
  }

  .login-showcase {
    padding: 6px 0 0;
  }

  .login-card {
    width: min(100%, 520px);
    justify-self: center;
  }
}

@media (max-width: 760px) {
  .login-title {
    font-size: clamp(2rem, 10vw, 2.8rem);
  }

  .login-stat-grid {
    grid-template-columns: 1fr;
  }

  .login-preview__top,
  .login-meta,
  .login-footer {
    flex-direction: column;
    align-items: flex-start;
  }

  .login-footer {
    align-items: center;
  }

  .login-card {
    width: 100%;
    padding: 22px 18px;
    border-radius: 26px !important;
  }

  .login-preview__surface {
    padding: 18px;
    border-radius: 24px;
  }

  .login-preview__image {
    height: 180px;
  }
}
</style>
