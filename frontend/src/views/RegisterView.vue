<template>
  <v-container class="fill-height justify-center align-center">
    <v-card width="450" rounded="xl" elevation="12" class="pa-8">
      <div class="text-center mb-8">
        <div
          class="d-inline-flex align-center justify-center mb-4"
          style="width: 64px; height: 64px; background: linear-gradient(135deg, #00F2FF, #0077B6); border-radius: 16px;"
        >
          <v-icon size="36" color="white">mdi-robot</v-icon>
        </div>
        <h1 class="text-h4 font-weight-bold">Bắt đầu với ZaloCRM</h1>
        <p class="text-body-1 text-medium-emphasis mt-2">Dùng thử miễn phí 7 ngày gói Pro</p>
      </div>

      <v-form @submit.prevent="handleRegister" ref="form">
        <v-text-field v-model="orgName" label="Tên công ty / Tổ chức" variant="outlined" prepend-inner-icon="mdi-domain" :rules="[v => !!v || 'Bắt buộc']" class="mb-2" rounded="lg" />
        <v-text-field v-model="fullName" label="Họ và tên" variant="outlined" prepend-inner-icon="mdi-account" :rules="[v => !!v || 'Bắt buộc']" class="mb-2" rounded="lg" />
        <v-text-field v-model="email" label="Email doanh nghiệp" variant="outlined" prepend-inner-icon="mdi-email" :rules="[v => !!v || 'Bắt buộc']" class="mb-2" rounded="lg" />
        <v-text-field v-model="password" label="Mật khẩu" type="password" variant="outlined" prepend-inner-icon="mdi-lock" :rules="[v => v.length >= 6 || 'Tối thiểu 6 ký tự']" class="mb-6" rounded="lg" />
        
        <v-btn type="submit" color="primary" block size="large" rounded="lg" :loading="loading" class="mb-4">
          Cài đặt hệ thống ngay
        </v-btn>
      </v-form>

      <div class="d-flex align-center mb-6">
        <v-divider></v-divider>
        <span class="mx-4 text-caption text-medium-emphasis">HOẶC</span>
        <v-divider></v-divider>
      </div>

      <v-btn
        block
        variant="outlined"
        size="large"
        rounded="lg"
        @click="loginWithGoogle"
        class="text-none mb-6"
        style="border-color: #E0E0E0;"
      >
        <v-img src="https://lh3.googleusercontent.com/COxitqS2s1P-bSGo9-9S9_Amvzv02Is9S688f8Yst6V8-of2-of2-of2-of2-of2" width="20" class="mr-2"></v-img>
        Đăng ký bằng Google
      </v-btn>

      <div class="text-center">
        <p class="text-body-2">
          Đã có tài khoản? <router-link to="/login" class="text-primary font-weight-bold">Đăng nhập</router-link>
        </p>
      </div>
    </v-card>
  </v-container>
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
  // @ts-ignore
  google.accounts.id.initialize({
    client_id: '926202174216-4v1fml75f5403k79bvoeuau2go3oe1jq.apps.googleusercontent.com',
    callback: handleGoogleCallback,
  });
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
  // @ts-ignore
  google.accounts.id.prompt();
}
</script>

<style scoped>
.v-btn {
  text-transform: none;
  font-weight: 600;
}
</style>
