<template>
  <div class="register-shell">
    <div class="register-container">
      <v-card class="register-card glass-premium" elevation="0">
        <div class="register-card__content">
          <header class="mb-10 text-center">
            <div class="brand-logo-container mb-6">
              <div class="logo-orb pink-glow">
                <v-icon size="36" color="white">mdi-rocket-launch-outline</v-icon>
              </div>
            </div>
            <h2 class="register-card__title">Bắt đầu miễn phí</h2>
            <p class="register-card__subtitle">Gia nhập cộng đồng Zalo Automation lớn nhất VN</p>
          </header>

          <v-form @submit.prevent="handleRegister" ref="form" class="mt-6">
            <div class="input-group mb-4">
              <v-text-field 
                v-model="orgName" 
                label="Tên doanh nghiệp / Tổ chức" 
                variant="plain" 
                :rules="[v => !!v || 'Bắt buộc']" 
                hide-details
                class="premium-input"
              >
                <template #prepend-inner>
                  <v-icon color="secondary" class="mr-2">mdi-domain</v-icon>
                </template>
              </v-text-field>
            </div>

            <div class="input-group mb-4">
              <v-text-field 
                v-model="fullName" 
                label="Họ và tên người quản trị" 
                variant="plain" 
                :rules="[v => !!v || 'Bắt buộc']" 
                hide-details
                class="premium-input"
              >
                <template #prepend-inner>
                  <v-icon color="secondary" class="mr-2">mdi-account-outline</v-icon>
                </template>
              </v-text-field>
            </div>

            <div class="input-group mb-4">
              <v-text-field 
                v-model="email" 
                label="Email doanh nghiệp" 
                variant="plain" 
                :rules="[v => !!v || 'Bắt buộc']" 
                hide-details
                class="premium-input"
              >
                <template #prepend-inner>
                  <v-icon color="secondary" class="mr-2">mdi-email-outline</v-icon>
                </template>
              </v-text-field>
            </div>

            <div class="input-group mb-8">
              <v-text-field 
                v-model="password" 
                label="Mật khẩu hệ thống" 
                type="password" 
                variant="plain" 
                :rules="[v => v.length >= 6 || 'Tối thiểu 6 ký tự']" 
                hide-details
                class="premium-input"
              >
                <template #prepend-inner>
                  <v-icon color="secondary" class="mr-2">mdi-lock-outline</v-icon>
                </template>
              </v-text-field>
            </div>
            
            <v-btn 
              type="submit" 
              height="60" 
              block 
              class="btn-primary-gradient mb-8"
              :loading="loading"
            >
              <span>Thiết lập CRM ngay</span>
              <v-icon end>mdi-creation</v-icon>
            </v-btn>
          </v-form>

          <div class="divider-text">
            <span class="line"></span>
            <span class="text">Hoặc đăng nhanh bằng</span>
            <span class="line"></span>
          </div>

          <v-btn
            block
            height="54"
            variant="outlined"
            class="btn-google-glass mt-6"
            @click="loginWithGoogle"
          >
            <v-img width="20" height="20" src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" class="mr-3" />
            <span>Google Workspace</span>
          </v-btn>

          <footer class="mt-12 text-center">
            <p class="text-caption footer-text">
              Đã có tài khoản ZaloCRM?
              <router-link to="/login" class="signup-link">Đăng nhập ngay</router-link>
            </p>
          </footer>
        </div>
      </v-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const orgName = ref('');
const fullName = ref('');
const email = ref('');
const password = ref('');
const loading = ref(false);
const router = useRouter();
const authStore = useAuthStore();

onMounted(() => {
  const googleIdentity = (window as any).google;
  if (googleIdentity?.accounts?.id) {
    googleIdentity.accounts.id.initialize({
      client_id: '926202174216-4v1fml75f5403k79bvoeuau2go3oe1jq.apps.googleusercontent.com',
      callback: handleGoogleCallback,
      use_fedcm_for_prompt: false,
    });
  }
});

async function handleGoogleCallback(response: any) {
  loading.value = true;
  try {
    await authStore.googleLogin(response.credential);
    router.push('/');
  } catch (err) {
    console.error('Registration failed', err);
  } finally {
    loading.value = false;
  }
}

async function handleRegister() {
  loading.value = true;
  try {
    await authStore.register({ 
      orgName: orgName.value, 
      fullName: fullName.value, 
      email: email.value, 
      password: password.value 
    });
    router.push('/');
  } catch (err) {
    console.error('Registration failed', err);
  } finally {
    loading.value = false;
  }
}

function loginWithGoogle() {
  const googleIdentity = (window as any).google;
  if (googleIdentity?.accounts?.id) {
    googleIdentity.accounts.id.prompt();
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');

.register-shell {
  font-family: 'Outfit', sans-serif;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.register-container {
  width: 100%;
  max-width: 580px;
  animation: fadeInSlide 0.8s ease-out forwards;
}

@keyframes fadeInSlide {
  from { opacity: 0; transform: translateY(40px); }
  to { opacity: 1; transform: translateY(0); }
}

.glass-premium {
  background: var(--color-surface-glass) !important;
  border: 1px solid var(--color-border) !important;
  backdrop-filter: blur(24px) saturate(180%);
  border-radius: 32px !important;
  box-shadow: var(--shadow-lg);
}

.register-card__content {
  padding: 48px;
}

.logo-orb {
  width: 72px;
  height: 72px;
  background: var(--gradient-accent);
  border-radius: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto;
  box-shadow: var(--glow-brand);
}

.pink-glow {
  background: var(--gradient-accent);
}

.register-card__title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-text);
}

.register-card__subtitle,
.footer-text {
  color: var(--color-text-secondary);
  margin-top: 8px;
}

.input-group {
  background: var(--color-surface-glass);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 8px 16px;
  transition: all 0.3s ease;
}

.input-group:focus-within {
  border-color: var(--color-primary);
  background: var(--color-surface);
  box-shadow: 0 0 0 4px var(--color-primary-soft);
}

:deep(.v-field__overlay),
:deep(.v-field__outline) {
  display: none;
}

:deep(.v-field__input) {
  color: var(--color-text) !important;
}

:deep(.v-label) {
  color: var(--color-text-secondary) !important;
}

.btn-primary-gradient {
  background: var(--gradient-brand) !important;
  color: var(--color-text-inverse) !important;
  border-radius: 16px !important;
  font-size: 1.1rem !important;
  font-weight: 700 !important;
  text-transform: none !important;
  box-shadow: var(--glow-brand);
}

.divider-text {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 32px;
}

.line {
  flex: 1;
  height: 1px;
  background: var(--color-border);
}

.text {
  color: var(--color-text-secondary);
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
}

.btn-google-glass {
  border: 1px solid var(--color-border) !important;
  background: var(--color-surface-glass) !important;
  color: var(--color-text) !important;
  border-radius: 16px !important;
  text-transform: none !important;
}

.signup-link {
  color: var(--color-accent);
  text-decoration: none;
  font-weight: 700;
}

@media (max-width: 600px) {
  .register-card__content {
    padding: 32px 24px;
  }
}
</style>
