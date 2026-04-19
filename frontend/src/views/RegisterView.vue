<template>
  <div class="register-shell">
    <v-card width="100%" max-width="520" class="register-card glass-card-heavy entrance-animation" elevation="24">
      <div class="text-center mb-8">
        <div class="brand-icon-wrapper ai-core-orb mx-auto mb-4">
          <v-icon size="36" color="white">mdi-robot-outline</v-icon>
        </div>
        <h1 class="text-h4 font-weight-bold text-white">Bắt đầu với ZaloCRM</h1>
        <p class="text-body-1 text-cyan-light mt-2">Dùng thử miễn phí 7 ngày gói Pro</p>
      </div>

      <v-form @submit.prevent="handleRegister" ref="form" class="mt-6">
        <v-text-field 
          v-model="orgName" 
          label="Tên công ty / Tổ chức" 
          variant="outlined" 
          prepend-inner-icon="mdi-domain" 
          :rules="[v => !!v || 'Bắt buộc']" 
          class="mb-4 custom-input" 
        />
        <v-text-field 
          v-model="fullName" 
          label="Họ và tên người quản trị" 
          variant="outlined" 
          prepend-inner-icon="mdi-account-outline" 
          :rules="[v => !!v || 'Bắt buộc']" 
          class="mb-4 custom-input" 
        />
        <v-text-field 
          v-model="email" 
          label="Email doanh nghiệp" 
          variant="outlined" 
          prepend-inner-icon="mdi-email-outline" 
          :rules="[v => !!v || 'Bắt buộc']" 
          class="mb-4 custom-input" 
        />
        <v-text-field 
          v-model="password" 
          label="Mật khẩu hệ thống" 
          type="password" 
          variant="outlined" 
          prepend-inner-icon="mdi-lock-outline" 
          :rules="[v => v.length >= 6 || 'Tối thiểu 6 ký tự']" 
          class="mb-8 custom-input" 
        />
        
        <v-btn 
          type="submit" 
          color="primary" 
          block 
          size="x-large" 
          :loading="loading" 
          class="register-submit btn-glow"
        >
          <span>Thiết lập CRM ngay</span>
          <v-icon end>mdi-rocket-launch-outline</v-icon>
        </v-btn>
      </v-form>

      <div class="login-divider">
        <span>Hoặc đăng nhanh bằng</span>
      </div>

      <v-btn
        block
        variant="outlined"
        size="large"
        @click="loginWithGoogle"
        class="login-google mb-6"
      >
        <v-icon start color="red">mdi-google</v-icon>
        Tiếp tục với Google
      </v-btn>

      <div class="text-center auth-footer">
        <span class="text-white-op">Đã có tài khoản ZaloCRM?</span>
        <router-link to="/login" class="text-cyan font-weight-bold ml-2">Đăng nhập ngay</router-link>
      </div>
    </v-card>
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
@keyframes fadeInSlideUp {
  from { opacity: 0; transform: translateY(30px); filter: blur(10px); }
  to { opacity: 1; transform: translateY(0); filter: blur(0); }
}

.register-shell {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}

.register-card {
  padding: 40px !important;
  border-radius: 32px !important;
}

.entrance-animation {
  animation: fadeInSlideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.brand-icon-wrapper {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #00F2FF, #0077B6);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 20px rgba(0, 119, 182, 0.3);
}

.text-cyan-light {
  color: rgba(230, 241, 255, 0.6);
}

.text-cyan {
  color: #00f2ff;
  text-decoration: none;
}

.text-white-op {
  color: rgba(255, 255, 255, 0.6);
}

.register-submit {
  height: 60px !important;
  border-radius: 16px !important;
  font-size: 1.1rem !important;
  font-weight: 700 !important;
  text-transform: none !important;
}

.btn-glow:hover {
  box-shadow: 0 0 20px rgba(0, 242, 255, 0.4) !important;
}

.glass-card-heavy {
  background: rgba(17, 34, 64, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(25px);
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
  background: #112240;
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

.auth-footer {
  font-size: 0.95rem;
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

:deep(.v-field) {
  border-radius: 16px !important;
}
</style>
