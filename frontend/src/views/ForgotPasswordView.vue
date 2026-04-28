<template>
  <div class="login-shell">
    <div class="login-container">
      <section class="login-showcase">
        <div class="entrance-animation-delay-1">
          <div class="login-badge glow-border">
            <v-icon size="18" color="primary">mdi-shield-lock-outline</v-icon>
            <span class="ml-2">Bảo vệ tài khoản Claro</span>
          </div>
        </div>

        <div class="login-copy entrance-animation-delay-2">
          <h1 class="login-title">
            Khôi phục
            <span class="text-gradient">quyền truy cập</span>
          </h1>
          <p class="login-description">
            Nhập email công việc của bạn. Nếu tài khoản tồn tại, chúng tôi sẽ gửi hướng dẫn để bạn có thể đặt lại mật khẩu và quay lại làm việc ngay.
          </p>
        </div>

        <div class="login-preview entrance-animation-delay-3">
          <div class="login-preview__surface glass-dark">
            <div class="login-preview__illustration">
              <v-icon size="120" color="primary" class="security-hero-icon">mdi-account-key-outline</v-icon>
              <div class="glow-layer"></div>
            </div>
            <div class="security-tips">
              <div class="security-tip">
                <v-icon size="20" color="success" class="mr-3">mdi-check-circle-outline</v-icon>
                <span>Xác thực qua email chính chủ</span>
              </div>
              <div class="security-tip">
                <v-icon size="20" color="success" class="mr-3">mdi-check-circle-outline</v-icon>
                <span>Link hết hạn sau 1 giờ</span>
              </div>
              <div class="security-tip">
                <v-icon size="20" color="success" class="mr-3">mdi-check-circle-outline</v-icon>
                <span>Mật khẩu mới yêu cầu độ bảo mật cao</span>
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
                <v-btn icon variant="text" to="/login" class="back-btn">
                  <v-icon>mdi-arrow-left</v-icon>
                </v-btn>
              </div>

              <div class="login-card__copy">
                <h2 class="login-card__title">Quên mật khẩu?</h2>
                <p class="login-card__subtitle">
                  Đừng lo, chỉ mất vài phút để chúng tôi giúp bạn đặt lại mật khẩu mới.
                </p>
              </div>
            </header>

            <v-alert
              v-if="error"
              type="error"
              variant="tonal"
              density="comfortable"
              class="login-error"
            >
              {{ error }}
            </v-alert>

            <v-alert
              v-if="success"
              type="success"
              variant="tonal"
              density="comfortable"
              class="login-success"
            >
              {{ success }}
              <div v-if="devToken" class="mt-4 dev-token-box">
                <p class="text-caption mb-1"><strong>Dev Mode:</strong> Vì chưa cấu hình SMTP, mã reset của bạn là:</p>
                <code>{{ devToken }}</code>
                <v-btn size="small" variant="text" color="primary" class="mt-2" :to="`/reset-password?token=${devToken}`">
                  Đi đến trang đặt lại mật khẩu
                </v-btn>
              </div>
            </v-alert>

            <v-form v-if="!success" @submit.prevent="handleSubmit" class="login-form">
              <div class="input-group">
                <v-text-field
                  v-model="email"
                  label="Email của bạn"
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

              <v-btn
                type="submit"
                height="58"
                block
                class="btn-primary-gradient mt-6"
                :loading="loading"
                :disabled="loading || !email"
              >
                <span>Gửi hướng dẫn</span>
                <v-icon end>mdi-send-outline</v-icon>
              </v-btn>
            </v-form>

            <footer class="login-footer">
              <p class="footer-text">
                Nhớ lại mật khẩu?
                <router-link to="/login" class="signup-link">Quay lại đăng nhập</router-link>
              </p>
            </footer>
          </div>
        </v-card>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';

const email = ref('');
const loading = ref(false);
const error = ref('');
const success = ref('');
const devToken = ref('');
const authStore = useAuthStore();

async function handleSubmit() {
  if (!email.value) return;

  loading.value = true;
  error.value = '';
  success.value = '';
  devToken.value = '';

  try {
    const res = await authStore.forgotPassword(email.value.trim());
    success.value = res.data.message || 'Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu vào email của bạn. Vui lòng kiểm tra hộp thư (và cả thư rác).';
    if (res.data.token) {
      devToken.value = res.data.token;
    }
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Đã có lỗi xảy ra. Vui lòng thử lại sau.';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
/* Reuse existing login styles */
.login-shell {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
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
  border: 1px solid var(--color-primary-soft-strong);
  box-shadow: var(--glow-brand);
}

.login-title {
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

.login-preview__surface {
  margin-top: 40px;
  padding: 40px;
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  backdrop-filter: blur(14px);
  border-radius: 26px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.security-hero-icon {
  margin-bottom: 30px;
  filter: drop-shadow(0 0 20px var(--color-primary-soft));
}

.security-tips {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

.security-tip {
  display: flex;
  align-items: center;
  color: var(--color-text-secondary);
  font-weight: 500;
}

.login-card {
  padding: 40px;
  background: var(--color-surface-glass) !important;
  border: 1px solid var(--color-border) !important;
  backdrop-filter: blur(20px) !important;
  border-radius: 32px !important;
}

.login-card__title {
  font-size: 1.8rem;
  font-weight: 700;
  margin-top: 16px;
  color: var(--color-text);
}

.login-card__subtitle {
  color: var(--color-text-secondary);
  margin-top: 8px;
  margin-bottom: 24px;
}

.premium-input {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  padding: 8px 16px;
  transition: all 0.3s ease;
}

.premium-input:focus-within {
  background: rgba(255, 255, 255, 0.06);
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px var(--color-primary-soft);
}

.btn-primary-gradient {
  background: var(--gradient-primary) !important;
  color: white !important;
  font-weight: 700 !important;
  text-transform: none !important;
  letter-spacing: 0.5px !important;
  border-radius: 14px !important;
  box-shadow: var(--shadow-lg) !important;
}

.login-footer {
  margin-top: 32px;
  text-align: center;
}

.signup-link {
  color: var(--color-primary);
  font-weight: 600;
  text-decoration: none;
}

.dev-token-box {
  background: rgba(0, 0, 0, 0.2);
  padding: 12px;
  border-radius: 8px;
  border: 1px dashed var(--color-primary);
}

code {
  background: #2d2d2d;
  color: #f8f8f2;
  padding: 4px 8px;
  border-radius: 4px;
  font-family: monospace;
  word-break: break-all;
}

@keyframes fadeInSlide {
  from { opacity: 0; transform: translateY(32px); }
  to { opacity: 1; transform: translateY(0); }
}

.entrance-animation-delay-1 { animation: fadeInSlide 0.8s ease-out forwards; }
.entrance-animation-delay-2 { animation: fadeInSlide 0.8s ease-out 0.08s forwards; opacity: 0; }
.entrance-animation-delay-3 { animation: fadeInSlide 0.8s ease-out 0.16s forwards; opacity: 0; }

@media (max-width: 960px) {
  .login-container {
    grid-template-columns: 1fr;
    gap: 40px;
    padding: 20px;
  }
  .login-showcase {
    display: none;
  }
}
</style>
