<template>
  <div class="login-shell">
    <div class="login-container">
      <section class="login-showcase">
        <div class="entrance-animation-delay-1">
          <div class="login-badge glow-border">
            <v-icon size="18" color="primary">mdi-key-variant</v-icon>
            <span class="ml-2">Thiết lập mật khẩu mới</span>
          </div>
        </div>

        <div class="login-copy entrance-animation-delay-2">
          <h1 class="login-title">
            Cập nhật
            <span class="text-gradient">mật mật bảo mật</span>
          </h1>
          <p class="login-description">
            Vui lòng chọn một mật khẩu mạnh mà bạn chưa từng sử dụng trước đây để đảm bảo an toàn cho tài khoản ZaloCRM của bạn.
          </p>
        </div>

        <div class="login-preview entrance-animation-delay-3">
          <div class="login-preview__surface glass-dark">
            <div class="password-requirement-list">
              <div class="req-title">Mật khẩu mạnh cần có:</div>
              <div class="req-item" :class="{ 'met': password.length >= 8 }">
                <v-icon size="18" class="mr-2">{{ password.length >= 8 ? 'mdi-check-circle' : 'mdi-circle-outline' }}</v-icon>
                <span>Tối thiểu 8 ký tự</span>
              </div>
              <div class="req-item" :class="{ 'met': hasUpper }">
                <v-icon size="18" class="mr-2">{{ hasUpper ? 'mdi-check-circle' : 'mdi-circle-outline' }}</v-icon>
                <span>Chứa chữ hoa</span>
              </div>
              <div class="req-item" :class="{ 'met': hasNumber }">
                <v-icon size="18" class="mr-2">{{ hasNumber ? 'mdi-check-circle' : 'mdi-circle-outline' }}</v-icon>
                <span>Chứa con số</span>
              </div>
              <div class="req-item" :class="{ 'met': passwordsMatch && confirmPassword }">
                <v-icon size="18" class="mr-2">{{ passwordsMatch && confirmPassword ? 'mdi-check-circle' : 'mdi-circle-outline' }}</v-icon>
                <span>Mật khẩu khớp nhau</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="login-form-side entrance-animation-delay-2">
        <v-card class="login-card glass-premium" elevation="0">
          <div class="login-card__content">
            <header class="login-card__header">
              <div class="login-card__copy">
                <h2 class="login-card__title">Đặt lại mật khẩu</h2>
                <p class="login-card__subtitle">
                  Nhập mật khẩu mới bên dưới để hoàn tất quá trình khôi phục.
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
              <v-btn block class="btn-primary-gradient mt-4" to="/login">
                Đăng nhập ngay
              </v-btn>
            </v-alert>

            <v-form v-if="!success" @submit.prevent="handleSubmit" class="login-form">
              <div class="input-group mb-4">
                <v-text-field
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  label="Mật khẩu mới"
                  variant="plain"
                  placeholder="********"
                  required
                  hide-details
                  class="premium-input"
                >
                  <template #prepend-inner>
                    <v-icon class="input-icon mr-2">mdi-lock-outline</v-icon>
                  </template>
                  <template #append-inner>
                    <v-btn icon size="small" variant="text" @click="showPassword = !showPassword">
                      <v-icon>{{ showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline' }}</v-icon>
                    </v-btn>
                  </template>
                </v-text-field>
              </div>

              <div class="input-group">
                <v-text-field
                  v-model="confirmPassword"
                  :type="showPassword ? 'text' : 'password'"
                  label="Xác nhận mật khẩu"
                  variant="plain"
                  placeholder="********"
                  required
                  hide-details
                  class="premium-input"
                >
                  <template #prepend-inner>
                    <v-icon class="input-icon mr-2">mdi-lock-check-outline</v-icon>
                  </template>
                </v-text-field>
              </div>

              <v-btn
                type="submit"
                height="58"
                block
                class="btn-primary-gradient mt-8"
                :loading="loading"
                :disabled="loading || !canSubmit"
              >
                <span>Cập nhật mật khẩu</span>
                <v-icon end>mdi-check-bold</v-icon>
              </v-btn>
            </v-form>
          </div>
        </v-card>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const password = ref('');
const confirmPassword = ref('');
const showPassword = ref(false);
const loading = ref(false);
const error = ref('');
const success = ref('');

const token = computed(() => (route.query.token as string) || '');

const hasUpper = computed(() => /[A-Z]/.test(password.value));
const hasNumber = computed(() => /[0-9]/.test(password.value));
const passwordsMatch = computed(() => password.value === confirmPassword.value);
const canSubmit = computed(() => 
  password.value.length >= 8 && 
  hasUpper.value && 
  hasNumber.value && 
  passwordsMatch.value
);

async function handleSubmit() {
  if (!canSubmit.value || !token.value) {
    if (!token.value) error.value = 'Mã xác nhận không tìm thấy. Vui lòng bắt đầu lại từ email.';
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    const res = await authStore.resetPassword({
      token: token.value,
      password: password.value
    });
    success.value = res.data.message || 'Mật khẩu của bạn đã được cập nhật thành công.';
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Đã có lỗi xảy ra. Có thể link đã hết hạn.';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
/* Reuse existing styles */
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
  padding: 32px;
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  backdrop-filter: blur(14px);
  border-radius: 26px;
}

.req-title {
  color: var(--color-text);
  font-weight: 600;
  margin-bottom: 16px;
}

.req-item {
  display: flex;
  align-items: center;
  color: var(--color-text-secondary);
  margin-bottom: 12px;
  transition: all 0.3s ease;
}

.req-item.met {
  color: var(--color-success);
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
}

.premium-input:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px var(--color-primary-soft);
}

.btn-primary-gradient {
  background: var(--gradient-primary) !important;
  color: white !important;
  font-weight: 700 !important;
  border-radius: 14px !important;
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
    padding: 20px;
  }
  .login-showcase {
    display: none;
  }
}
</style>
