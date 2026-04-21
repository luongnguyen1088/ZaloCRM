<template>
  <div class="accept-invite-container d-flex align-center justify-center">
    <v-card width="420" class="glass-invite pa-6 rounded-xl" elevation="12">
      <div v-if="loadingVerifying" class="text-center py-10">
        <v-progress-circular indeterminate color="primary" />
        <p class="mt-4 text-body-2">Đang xác thực lời mời...</p>
      </div>

      <div v-else-if="error" class="text-center py-6">
        <v-icon color="error" size="64" class="mb-4">mdi-alert-circle-outline</v-icon>
        <h2 class="text-h5 font-weight-bold mb-2">Lời mời không hợp lệ</h2>
        <p class="text-body-2 text-medium-emphasis mb-6">{{ error }}</p>
        <v-btn to="/login" color="primary" variant="flat" block rounded="lg" class="text-none">Quay lại đăng nhập</v-btn>
      </div>

      <div v-else-if="success" class="text-center py-6">
        <v-icon color="success" size="64" class="mb-4">mdi-check-circle-outline</v-icon>
        <h2 class="text-h5 font-weight-bold mb-2">Kích hoạt thành công!</h2>
        <p class="text-body-2 text-medium-emphasis mb-6">Tài khoản của bạn đã sẵn sàng. Chào mừng bạn gia nhập đội ngũ.</p>
        <v-btn to="/login" color="primary" variant="flat" block rounded="lg" class="text-none">Đăng nhập ngay</v-btn>
      </div>

      <div v-else>
        <div class="text-center mb-8">
          <div class="invite-icon mb-4">
            <v-icon color="white" size="32">mdi-account-plus</v-icon>
          </div>
          <h1 class="text-h5 font-weight-bold">Chào mừng thành viên mới</h1>
          <p class="text-body-2 text-medium-emphasis mt-1">Đang thiết lập tài khoản cho <span class="text-primary font-weight-bold">{{ invitation?.email }}</span></p>
        </div>

        <v-form @submit.prevent="handleAccept">
          <v-text-field
            v-if="!invitation?.email"
            v-model="userEmail"
            label="Địa chỉ Email"
            prepend-inner-icon="mdi-email-outline"
            variant="outlined"
            type="email"
            placeholder="email@company.com"
            class="mb-4"
            hide-details="auto"
            rounded="lg"
            color="primary"
          />

          <v-text-field
            v-model="fullName"
            label="Họ và tên của bạn"
            prepend-inner-icon="mdi-account-outline"
            variant="outlined"
            placeholder="Vd: Nguyễn Văn A"
            class="mb-4"
            hide-details="auto"
            rounded="lg"
            color="primary"
          />
          
          <v-text-field
            v-model="password"
            label="Thiết lập mật khẩu"
            prepend-inner-icon="mdi-lock-outline"
            :type="showPass ? 'text' : 'password'"
            :append-inner-icon="showPass ? 'mdi-eye-off' : 'mdi-eye'"
            @click:append-inner="showPass = !showPass"
            variant="outlined"
            class="mb-6"
            hide-details="auto"
            rounded="lg"
            color="primary"
          />

          <v-btn
            type="submit"
            color="primary"
            block
            size="large"
            :loading="loadingSaving"
            class="text-none font-weight-bold accept-btn"
            rounded="lg"
            elevation="0"
          >
            Kích hoạt tài khoản
          </v-btn>
        </v-form>

        <v-alert v-if="inviteError" type="error" variant="tonal" density="compact" class="mt-4 rounded-lg">
          {{ inviteError }}
        </v-alert>
      </div>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useInvitations } from '@/composables/use-invitations';

const route = useRoute();
const { verifyInvitation, acceptInvitation } = useInvitations();

const token = route.query.token as string;
const invitation = ref<any>(null);
const loadingVerifying = ref(true);
const loadingSaving = ref(false);
const error = ref('');
const userEmail = ref('');
const fullName = ref('');
const password = ref('');
const inviteError = ref('');
const success = ref(false);
const showPass = ref(false);

async function handleAccept() {
  const finalEmail = invitation.value?.email || userEmail.value;

  if (!finalEmail || !fullName.value || !password.value) {
    inviteError.value = 'Vui lòng nhập đầy đủ thông tin';
    return;
  }
  if (password.value.length < 6) {
    inviteError.value = 'Mật khẩu phải từ 6 ký tự trở lên';
    return;
  }

  loadingSaving.value = true;
  inviteError.value = '';
  
  const res = await acceptInvitation({
    token,
    email: finalEmail,
    fullName: fullName.value,
    password: password.value
  });

  loadingSaving.value = false;
  if (res.ok) {
    success.value = true;
  } else {
    inviteError.value = res.error || 'Lỗi kích hoạt tài khoản';
  }
}

onMounted(async () => {
  if (!token) {
    error.value = 'Thiếu mã mời (token)';
    loadingVerifying.value = false;
    return;
  }

  const res = await verifyInvitation(token);
  loadingVerifying.value = false;
  
  if (res.ok) {
    invitation.value = res.invitation;
  } else {
    error.value = res.error || 'Lời mời không hợp lệ hoặc đã hết hạn';
  }
});
</script>

<style scoped>
.accept-invite-container {
  min-height: 100vh;
  background: 
    radial-gradient(circle at 0% 0%, rgba(var(--v-theme-primary), 0.1) 0%, transparent 50%),
    radial-gradient(circle at 100% 100%, rgba(var(--v-theme-secondary), 0.1) 0%, transparent 50%),
    var(--color-canvas);
}

.glass-invite {
  background: var(--color-surface-glass) !important;
  backdrop-filter: blur(20px);
  border: 1px solid var(--color-border-strong) !important;
}

.invite-icon {
  background: var(--gradient-brand);
  width: 64px;
  height: 64px;
  border-radius: 20px;
  display: flex !important;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  box-shadow: var(--shadow-md);
  animation: liquid-morph 8s infinite var(--liquid-ease);
}

.accept-btn {
  height: 52px !important;
  transition: all 0.3s var(--liquid-ease);
}

.accept-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--glow-brand);
}

@keyframes liquid-morph {
  0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
  50% { border-radius: 30% 60% 70% 30% / 50% 60% 30% 50%; }
}
</style>
