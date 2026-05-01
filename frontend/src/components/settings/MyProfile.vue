<template>
  <div class="my-profile">
    <v-card variant="flat" class="profile-hero-card pa-8 mb-8 rounded-xl d-flex align-center overflow-hidden">
      <div class="hero-bg-accent"></div>
      <v-avatar size="100" class="mr-8 avatar-premium elevation-8">
        <v-img v-if="authStore.user?.avatar" :src="authStore.user.avatar"></v-img>
        <span v-else class="text-h3 font-weight-bold text-white">{{ getInitials(authStore.user?.fullName || '') }}</span>
      </v-avatar>
      <div class="z-index-1">
        <h3 class="text-h4 font-weight-bold mb-1 text-high-emphasis">{{ authStore.user?.fullName }}</h3>
        <p class="text-subtitle-1 text-medium-emphasis mb-2 d-flex align-center">
          <v-icon size="18" class="mr-2">mdi-email-outline</v-icon>
          {{ authStore.user?.email }}
        </p>
        <div class="d-flex align-center gap-2">
          <v-chip size="small" :color="roleColor(authStore.user?.role || '')" variant="flat" class="font-weight-black uppercase">
            {{ roleLabel(authStore.user?.role || '') }}
          </v-chip>
          <v-chip size="small" variant="tonal" class="font-weight-bold">
            ID: {{ authStore.user?.id.substring(0, 8) }}
          </v-chip>
        </div>
      </div>
      <v-spacer />
      <v-btn icon="mdi-camera-outline" variant="tonal" color="primary" class="avatar-edit-btn" title="Thay đổi ảnh đại diện" />
    </v-card>

    <v-row>
      <v-col cols="12" md="6">
        <v-card variant="outlined" class="pa-8 rounded-xl border-glass-modern h-100">
          <div class="d-flex align-center mb-8">
            <div class="section-icon-box mr-4">
              <v-icon color="primary">mdi-account-edit</v-icon>
            </div>
            <div>
              <span class="text-h6 font-weight-bold">Thông tin cá nhân</span>
              <p class="text-caption text-medium-emphasis">Thông tin định danh của bạn trên hệ thống</p>
            </div>
          </div>
          
          <v-text-field
            v-model="profileForm.fullName"
            label="Họ và tên"
            variant="outlined"
            rounded="lg"
            class="mb-6"
            hide-details="auto"
            prepend-inner-icon="mdi-account-outline"
          />
          <v-text-field
            v-model="profileForm.email"
            label="Địa chỉ Email"
            disabled
            variant="outlined"
            rounded="lg"
            class="mb-8"
            hide-details="auto"
            prepend-inner-icon="mdi-email-lock-outline"
            hint="Email được quản lý bởi quản trị viên tổ chức"
            persistent-hint
          />

          <v-btn
            color="primary"
            variant="flat"
            rounded="pill"
            block
            height="48"
            class="text-none font-weight-bold action-btn"
            :loading="savingProfile"
            :disabled="!isProfileChanged"
            @click="handleSaveProfile"
          >
            Lưu thay đổi hồ sơ
          </v-btn>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card variant="outlined" class="pa-8 rounded-xl border-glass-modern h-100">
          <div class="d-flex align-center mb-8">
            <div class="section-icon-box mr-4 warning-box">
              <v-icon color="warning">mdi-shield-lock-outline</v-icon>
            </div>
            <div>
              <span class="text-h6 font-weight-bold">Bảo mật tài khoản</span>
              <p class="text-caption text-medium-emphasis">Cập nhật mật khẩu để bảo vệ tài khoản</p>
            </div>
          </div>
          
          <v-text-field
            v-model="passwordForm.currentPassword"
            label="Mật khẩu hiện tại"
            type="password"
            variant="outlined"
            rounded="lg"
            class="mb-4"
            hide-details="auto"
            prepend-inner-icon="mdi-lock-outline"
          />
          <v-text-field
            v-model="passwordForm.newPassword"
            label="Mật khẩu mới"
            type="password"
            variant="outlined"
            rounded="lg"
            class="mb-4"
            hide-details="auto"
            prepend-inner-icon="mdi-lock-reset"
          />
          <v-text-field
            v-model="passwordForm.confirmPassword"
            label="Xác nhận mật khẩu mới"
            type="password"
            variant="outlined"
            rounded="lg"
            class="mb-8"
            hide-details="auto"
            prepend-inner-icon="mdi-check-shield-outline"
          />

          <v-btn
            color="warning"
            variant="flat"
            rounded="pill"
            block
            height="48"
            class="text-none font-weight-bold action-btn"
            :loading="savingPassword"
            :disabled="!isPasswordValid"
            @click="handleSavePassword"
          >
            Cập nhật mật khẩu ngay
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

function roleColor(role: string) {
  if (role === 'owner') return 'deep-purple-accent-4';
  if (role === 'admin') return 'indigo-accent-3';
  if (role === 'editor') return 'cyan-darken-1';
  if (role === 'agent') return 'teal-darken-1';
  if (role === 'viewer') return 'blue-grey-darken-1';
  return 'blue-grey-lighten-1';
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
.profile-hero-card {
  background: var(--color-surface-elevated) !important;
  border: 1px solid var(--color-border) !important;
  position: relative;
}

.hero-bg-accent {
  position: absolute;
  top: -50px;
  right: -50px;
  width: 200px;
  height: 200px;
  background: var(--gradient-brand-soft);
  filter: blur(60px);
  opacity: 0.5;
  border-radius: 50%;
}

.avatar-premium {
  background: var(--gradient-brand);
  border: 4px solid white;
}

.avatar-edit-btn {
  align-self: flex-start;
}

.border-glass-modern {
  background: var(--color-surface) !important;
  border: 1px solid var(--color-border) !important;
  box-shadow: var(--shadow-sm) !important;
  transition: all 0.3s ease;
}

.border-glass-modern:hover {
  border-color: var(--color-primary-soft-strong) !important;
  box-shadow: var(--shadow-md) !important;
}

.section-icon-box {
  width: 44px;
  height: 44px;
  background: var(--color-primary-soft);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.warning-box {
  background: var(--color-warning-soft);
}

.action-btn {
  transition: all 0.3s var(--liquid-ease);
}

.action-btn:hover {
  transform: translateY(-2px);
}

.z-index-1 { z-index: 1; }
.uppercase { text-transform: uppercase; }
.gap-2 { gap: 0.5rem; }
</style>
