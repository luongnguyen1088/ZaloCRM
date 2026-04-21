<template>
  <div class="org-settings">
    <div class="d-flex align-center mb-6">
      <div>
        <h3 class="text-h6 font-weight-bold mb-0">Cấu hình Tổ chức</h3>
        <p class="text-caption text-medium-emphasis">Thông tin cơ bản về công ty và định danh thương hiệu</p>
      </div>
    </div>

    <v-card class="pa-6 rounded-xl info-card" variant="outlined">
      <div class="d-flex align-center mb-6">
        <div class="org-icon-avatar mr-4">
          <v-icon color="primary" size="28">mdi-shield-crown-outline</v-icon>
        </div>
        <div>
          <div class="text-subtitle-1 font-weight-bold">Tên thương hiệu / Công ty</div>
          <div class="text-caption text-disabled">Sử dụng để hiển thị trên email, hóa đơn và báo cáo</div>
        </div>
      </div>

      <v-text-field
        v-model="orgName"
        label="Tên tổ chức"
        :disabled="!authStore.isOwner || saving"
        variant="outlined"
        placeholder="Vd: Công ty TNHH ZaloCRM"
        class="mb-4"
        rounded="lg"
        hide-details="auto"
      />

      <v-alert v-if="error" type="error" density="compact" variant="tonal" class="mb-4 rounded-lg">{{ error }}</v-alert>
      <v-alert v-if="saved" type="success" density="compact" variant="tonal" class="mb-4 rounded-lg">Cập nhật thông tin thành công</v-alert>
      
      <div class="d-flex align-center mt-6">
        <v-spacer />
        <v-btn
          v-if="authStore.isOwner"
          color="primary"
          :loading="saving"
          :disabled="!orgName.trim() || orgName === originalName"
          @click="handleSave"
          variant="flat"
          class="px-10 text-none action-btn"
          rounded="lg"
        >
          Lưu thay đổi
        </v-btn>
        <div v-else class="text-medium-emphasis text-body-2 d-flex align-center">
          <v-icon start size="18" color="warning">mdi-lock-outline</v-icon>
          Chỉ chủ sở hữu mới có quyền thay đổi thông tin này.
        </div>
      </div>
    </v-card>

    <div class="mt-8">
      <v-card class="pa-6 rounded-xl border-dashed bg-transparent" variant="outlined">
        <div class="d-flex align-center">
          <v-icon size="32" color="primary-lighten-2" class="mr-4">mdi-security</v-icon>
          <div>
            <div class="text-subtitle-2 font-weight-bold">Bảo mật & Quyền riêng tư</div>
            <div class="text-caption text-medium-emphasis">Dữ liệu của bạn được mã hóa và bảo vệ theo tiêu chuẩn quốc tế.</div>
          </div>
        </div>
      </v-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '@/api/index';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const orgName = ref('');
const originalName = ref('');
const saving = ref(false);
const error = ref('');
const saved = ref(false);

async function fetchOrg() {
  try {
    const res = await api.get('/organization');
    orgName.value = res.data.name ?? '';
    originalName.value = orgName.value;
  } catch {
    // silently ignore — endpoint may not exist yet
  }
}

async function handleSave() {
  saving.value = true;
  error.value = '';
  saved.value = false;
  try {
    await api.put('/organization', { name: orgName.value.trim() });
    saved.value = true;
    originalName.value = orgName.value.trim();
    setTimeout(() => { saved.value = false; }, 3000);
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Lỗi khi lưu thông tin tổ chức';
  } finally {
    saving.value = false;
  }
}

onMounted(fetchOrg);
</script>

<style scoped>
.org-settings {
  max-width: 600px;
}

.info-card {
  background: var(--color-surface) !important;
  border: 1px solid var(--color-border) !important;
  box-shadow: var(--shadow-sm) !important;
}

.org-icon-avatar {
  background: var(--color-primary-soft);
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.border-dashed {
  border-style: dashed !important;
  border-width: 2px !important;
}

.action-btn {
  transition: all 0.3s var(--liquid-ease);
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--glow-brand);
}
</style>
