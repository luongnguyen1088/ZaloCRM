<template>
  <div class="my-profile">
    <div class="d-flex align-center mb-6">
      <v-avatar size="80" color="primary" class="mr-6 elevation-4">
        <span class="text-h4 font-weight-bold text-white">{{ getInitials(authStore.user?.fullName || '') }}</span>
      </v-avatar>
      <div>
        <h3 class="text-h5 font-weight-bold mb-1">{{ authStore.user?.fullName }}</h3>
        <p class="text-subtitle-2 text-medium-emphasis mb-0">{{ authStore.user?.email }}</p>
        <v-chip size="small" color="primary" variant="tonal" class="mt-2 font-weight-bold">
          {{ roleLabel(authStore.user?.role || '') }}
        </v-chip>
      </div>
    </div>

    <v-divider class="mb-8 opacity-10" />

    <v-row>
      <v-col cols="12" md="6">
        <v-card variant="outlined" class="pa-6 rounded-xl border-glass h-100">
          <div class="d-flex align-center mb-6">
            <v-icon color="primary" class="mr-3">mdi-account-edit-outline</v-icon>
            <span class="text-subtitle-1 font-weight-bold">Thông tin cá nhân</span>
          </div>
          
          <v-text-field
            v-model="profileForm.fullName"
            label="Họ và tên"
            variant="outlined"
            rounded="lg"
            class="mb-4"
            hide-details="auto"
          />
          <v-text-field
            v-model="profileForm.email"
            label="Email"
            disabled
            variant="outlined"
            rounded="lg"
            class="mb-6"
            hide-details="auto"
            hint="Email không thể thay đổi để đảm bảo tính nhất quán dữ liệu"
            persistent-hint
          />

          <v-btn
            color="primary"
            variant="flat"
            rounded="lg"
            block
            class="text-none font-weight-bold"
            :loading="savingProfile"
            :disabled="!isProfileChanged"
            @click="handleSaveProfile"
          >
            Lưu thay đổi
          </v-btn>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card variant="outlined" class="pa-6 rounded-xl border-glass h-100">
          <div class="d-flex align-center mb-6">
            <v-icon color="warning" class="mr-3">mdi-lock-reset</v-icon>
            <span class="text-subtitle-1 font-weight-bold">Đổi mật khẩu</span>
          </div>
          
          <v-text-field
            v-model="passwordForm.currentPassword"
            label="Mật khẩu hiện tại"
            type="password"
            variant="outlined"
            rounded="lg"
            class="mb-4"
            hide-details="auto"
          />
          <v-text-field
            v-model="passwordForm.newPassword"
            label="Mật khẩu mới"
            type="password"
            variant="outlined"
            rounded="lg"
            class="mb-4"
            hide-details="auto"
          />
          <v-text-field
            v-model="passwordForm.confirmPassword"
            label="Xác nhận mật khẩu"
            type="password"
            variant="outlined"
            rounded="lg"
            class="mb-6"
            hide-details="auto"
          />

          <v-btn
            color="warning"
            variant="flat"
            rounded="lg"
            block
            class="text-none font-weight-bold"
            :loading="savingPassword"
            :disabled="!isPasswordValid"
            @click="handleSavePassword"
          >
            Cập nhật mật khẩu
          </v-btn>
        </v-card>
      </v-col>
    </v-row>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" rounded="pill" elevation="10">
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/api';

const authStore = useAuthStore();
const savingProfile = ref(false);
const savingPassword = ref(false);

const profileForm = ref({
  fullName: authStore.user?.fullName || '',
  email: authStore.user?.email || '',
});

const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
});

const snackbar = ref({
  show: false,
  text: '',
  color: 'success',
});

const isProfileChanged = computed(() => {
  return profileForm.value.fullName !== authStore.user?.fullName;
});

const isPasswordValid = computed(() => {
  return passwordForm.value.currentPassword && 
         passwordForm.value.newPassword && 
         passwordForm.value.newPassword === passwordForm.value.confirmPassword &&
         passwordForm.value.newPassword.length >= 6;
});

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
}

function roleLabel(role: string) {
  if (role === 'owner') return 'Chủ sở hữu';
  if (role === 'admin') return 'Quản trị viên';
  if (role === 'editor') return 'Biên tập viên';
  if (role === 'agent') return 'Live Chat Agent';
  if (role === 'viewer') return 'Chỉ xem';
  return 'Thành viên';
}

async function handleSaveProfile() {
  savingProfile.value = true;
  try {
    await api.put('/users/profile', { fullName: profileForm.value.fullName });
    if (authStore.user) authStore.user.fullName = profileForm.value.fullName;
    showSnackbar('Cập nhật hồ sơ thành công', 'success');
  } catch (err: any) {
    showSnackbar(err.response?.data?.error || 'Lỗi khi cập nhật hồ sơ', 'error');
  } finally {
    savingProfile.value = false;
  }
}

async function handleSavePassword() {
  savingPassword.value = true;
  try {
    await api.put('/users/password', {
      currentPassword: passwordForm.value.currentPassword,
      newPassword: passwordForm.value.newPassword,
    });
    passwordForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' };
    showSnackbar('Đổi mật khẩu thành công', 'success');
  } catch (err: any) {
    showSnackbar(err.response?.data?.error || 'Lỗi khi đổi mật khẩu', 'error');
  } finally {
    savingPassword.value = false;
  }
}

function showSnackbar(text: string, color: string) {
  snackbar.value = { show: true, text, color };
}
</script>

<style scoped>
.border-glass {
  background: var(--color-surface) !important;
  border: 1px solid var(--color-border) !important;
  box-shadow: var(--shadow-sm) !important;
}
</style>
