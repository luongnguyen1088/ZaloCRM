<template>
  <div class="settings-shell pa-6">
    <div class="page-header mb-8">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1 settings-title d-flex align-center">
          <div class="title-icon-wrapper mr-4">
            <v-icon color="white" size="28">mdi-account-cog</v-icon>
          </div>
          Nhân sự & Phân quyền
        </h1>
        <p class="text-subtitle-1 text-medium-emphasis ml-15">Quản lý đội ngũ nhân viên và phân quyền truy cập hệ thống</p>
      </div>
    </div>

    <v-card class="glass-container overflow-visible">
      <v-tabs v-model="tab" color="primary" class="settings-tabs px-4 pt-2">
        <v-tab value="users" class="text-none pill-tab">
          <v-icon start>mdi-account-group-outline</v-icon>
          Nhân viên
        </v-tab>
        <v-tab value="teams" class="text-none pill-tab">
          <v-icon start>mdi-office-building-cog-outline</v-icon>
          Đội nhóm
        </v-tab>
        <v-tab value="org" class="text-none pill-tab">
          <v-icon start>mdi-shield-check-outline</v-icon>
          Tổ chức
        </v-tab>
      </v-tabs>

      <v-divider />

      <v-window v-model="tab" class="pa-6">
        <!-- USERS TAB -->
        <v-window-item value="users">
          <div class="d-flex align-center gap-4 mb-6">
            <v-text-field
              v-model="search"
              prepend-inner-icon="mdi-magnify"
              label="Tìm kiếm nhân viên..."
              variant="solo-filled"
              flat
              density="compact"
              hide-details
              class="search-bar"
              rounded="lg"
            />
            <v-spacer />
            <v-btn
              v-if="authStore.isAdmin"
              color="primary"
              prepend-icon="mdi-account-plus-outline"
              @click="openCreate"
              class="text-none px-6 action-btn"
              rounded="lg"
              elevation="0"
            >
              Thêm nhân viên
            </v-btn>
          </div>

          <v-alert v-if="error" type="error" variant="tonal" class="mb-4 rounded-xl" closable @click:close="error = ''">
            {{ error }}
          </v-alert>

          <v-data-table
            :headers="headers"
            :items="users"
            :loading="loading"
            :search="search"
            no-data-text="Chưa có nhân viên nào"
            class="user-table"
            hover
          >
            <template #item.fullName="{ item }">
              <div class="d-flex align-center py-2">
                <v-avatar color="primary-lighten-4" size="42" class="mr-3 glass-avatar">
                  <span class="text-primary font-weight-bold text-body-2">{{ getInitials(item.fullName) }}</span>
                </v-avatar>
                <div>
                  <div class="font-weight-bold text-body-1">{{ item.fullName }}</div>
                  <div class="text-caption text-medium-emphasis">{{ item.email }}</div>
                </div>
              </div>
            </template>

            <template #item.role="{ item }">
              <v-chip :color="roleColor(item.role)" size="small" variant="tonal" class="font-weight-bold px-3">
                {{ roleLabel(item.role) }}
              </v-chip>
            </template>

            <template #item.isActive="{ item }">
              <div class="d-flex align-center">
                <v-badge
                  dot
                  :color="item.isActive ? 'success' : 'grey'"
                  inline
                  class="mr-2 status-badge"
                  :class="{ 'status-active': item.isActive }"
                />
                <span :class="item.isActive ? 'text-success' : 'text-medium-emphasis'" class="text-caption font-weight-bold">
                  {{ item.isActive ? 'Đang hoạt động' : 'Đã vô hiệu' }}
                </span>
              </div>
            </template>

            <template #item.actions="{ item }">
              <div class="d-flex justify-end gap-1">
                <v-btn
                  v-if="authStore.isAdmin"
                  icon="mdi-pencil-outline"
                  size="small"
                  variant="text"
                  color="primary"
                  title="Chỉnh sửa"
                  @click="openEdit(item)"
                  class="hover-scale"
                />
                <v-btn
                  v-if="authStore.isAdmin"
                  icon="mdi-key-reset"
                  size="small"
                  variant="text"
                  color="warning"
                  title="Đặt lại mật khẩu"
                  @click="openPassword(item)"
                  class="hover-scale"
                />
                <v-btn
                  v-if="authStore.isOwner && item.id !== authStore.user?.id"
                  icon="mdi-delete-outline"
                  size="small"
                  variant="text"
                  color="error"
                  title="Vô hiệu hóa"
                  @click="confirmDelete(item)"
                  class="hover-scale"
                />
              </div>
            </template>
          </v-data-table>
        </v-window-item>

        <!-- TEAMS TAB -->
        <v-window-item value="teams">
          <TeamManagement />
        </v-window-item>

        <!-- ORG TAB -->
        <v-window-item value="org">
          <OrgSettings />
        </v-window-item>
      </v-window>
    </v-card>

    <!-- Dialogs -->
    <v-dialog v-model="showCreate" max-width="480" persistent transition="dialog-bottom-transition">
      <v-card class="rounded-xl pa-2 dialog-glass">
        <v-card-title class="d-flex align-center px-4 pt-4">
          <span class="text-h6 font-weight-bold">Thêm nhân viên mới</span>
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" density="comfortable" @click="showCreate = false" />
        </v-card-title>
        <v-card-text class="pa-4">
          <v-text-field v-model="form.fullName" label="Họ tên *" placeholder="Vd: Nguyễn Văn A" variant="outlined" class="mb-4" hide-details="auto" rounded="lg" />
          <v-text-field v-model="form.email" label="Email *" type="email" placeholder="email@company.com" variant="outlined" class="mb-4" hide-details="auto" rounded="lg" />
          <v-text-field v-model="form.password" label="Mật khẩu *" type="password" variant="outlined" class="mb-4" hide-details="auto" rounded="lg" />
          <v-select v-model="form.role" :items="roleOptions" item-title="label" item-value="value" label="Vai trò hệ thống" variant="outlined" hide-details="auto" rounded="lg" />
          <v-alert v-if="dialogError" type="error" variant="tonal" density="compact" class="mt-4 rounded-lg">{{ dialogError }}</v-alert>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" class="text-none px-6" @click="showCreate = false">Hủy bỏ</v-btn>
          <v-btn color="primary" :loading="saving" variant="flat" class="text-none px-8 action-btn" rounded="lg" @click="handleCreate">Tạo nhân viên</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showEdit" max-width="480" persistent transition="dialog-bottom-transition">
      <v-card class="rounded-xl pa-2 dialog-glass">
        <v-card-title class="d-flex align-center px-4 pt-4">
          <span class="text-h6 font-weight-bold">Chỉnh sửa nhân viên</span>
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" density="comfortable" @click="showEdit = false" />
        </v-card-title>
        <v-card-text class="pa-4">
          <v-text-field v-model="form.fullName" label="Họ tên" variant="outlined" class="mb-4" hide-details="auto" rounded="lg" />
          <v-text-field v-model="form.email" label="Email" type="email" variant="outlined" class="mb-4" hide-details="auto" rounded="lg" />
          <v-select v-if="authStore.isOwner" v-model="form.role" :items="roleOptions" item-title="label" item-value="value" label="Vai trò" variant="outlined" hide-details="auto" rounded="lg" />
          <v-alert v-if="dialogError" type="error" variant="tonal" density="compact" class="mt-4 rounded-lg">{{ dialogError }}</v-alert>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" class="text-none px-6" @click="showEdit = false">Đóng</v-btn>
          <v-btn color="primary" :loading="saving" variant="flat" class="text-none px-8 action-btn" rounded="lg" @click="handleUpdate">Cập nhật</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showPassword" max-width="400" transition="dialog-bottom-transition">
      <v-card class="rounded-xl pa-2 dialog-glass">
        <v-card-title class="text-h6 font-weight-bold px-4 pt-4">Đặt lại mật khẩu</v-card-title>
        <v-card-text class="pa-4">
          <p class="text-body-2 text-medium-emphasis mb-4">Nhập mật khẩu mới cho nhân viên <span class="text-primary font-weight-bold">{{ selectedUser?.fullName }}</span></p>
          <v-text-field v-model="newPassword" label="Mật khẩu mới *" type="password" variant="outlined" autofocus rounded="lg" />
          <v-alert v-if="dialogError" type="error" variant="tonal" density="compact" class="mt-2 rounded-lg">{{ dialogError }}</v-alert>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="showPassword = false">Hủy</v-btn>
          <v-btn color="primary" :loading="saving" variant="flat" class="px-6 action-btn" rounded="lg" @click="handlePassword">Đặt lại</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showDelete" max-width="400">
      <v-card class="rounded-xl pa-2 dialog-glass">
        <v-card-title class="text-h6 font-weight-bold px-4 pt-4">Xác nhận vô hiệu hóa</v-card-title>
        <v-card-text class="pa-4 text-body-1">
          Bạn có chắc chắn muốn vô hiệu hóa tài khoản của <span class="font-weight-bold">{{ selectedUser?.fullName }}</span>? Nhân viên này sẽ không thể đăng nhập vào hệ thống.
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="showDelete = false">Đóng</v-btn>
          <v-btn color="error" :loading="saving" variant="flat" class="px-6 action-btn" rounded="lg" @click="handleDelete">Vô hiệu hóa</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useUsers, type OrgUser } from '@/composables/use-users';
import { useAuthStore } from '@/stores/auth';
import TeamManagement from '@/components/settings/TeamManagement.vue';
import OrgSettings from '@/components/settings/OrgSettings.vue';

const { users, loading, error, fetchUsers, createUser, updateUser, resetPassword, deleteUser } = useUsers();
const authStore = useAuthStore();

const tab = ref('users');
const search = ref('');
const showCreate = ref(false);
const showEdit = ref(false);
const showPassword = ref(false);
const showDelete = ref(false);
const saving = ref(false);
const dialogError = ref('');
const newPassword = ref('');
const selectedUser = ref<OrgUser | null>(null);

const form = ref({ fullName: '', email: '', password: '', role: 'member' });

const roleOptions = [
  { label: 'Nhân viên', value: 'member' },
  { label: 'Quản trị viên', value: 'admin' },
];

const headers = [
  { title: 'Nhân viên', key: 'fullName', sortable: true },
  { title: 'Vai trò', key: 'role', sortable: true },
  { title: 'Trạng thái', key: 'isActive', sortable: true },
  { title: 'Hành động', key: 'actions', sortable: false, align: 'end' as const },
];

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
}

function roleColor(role: string) {
  if (role === 'owner') return 'deep-purple-accent-4';
  if (role === 'admin') return 'indigo-accent-3';
  return 'blue-grey-darken-1';
}

function roleLabel(role: string) {
  if (role === 'owner') return 'Chủ sở hữu';
  if (role === 'admin') return 'Quản trị viên';
  return 'Nhân viên';
}

function openCreate() {
  form.value = { fullName: '', email: '', password: '', role: 'member' };
  dialogError.value = '';
  showCreate.value = true;
}

function openEdit(user: OrgUser) {
  selectedUser.value = user;
  form.value = { fullName: user.fullName, email: user.email, password: '', role: user.role };
  dialogError.value = '';
  showEdit.value = true;
}

function openPassword(user: OrgUser) {
  selectedUser.value = user;
  newPassword.value = '';
  dialogError.value = '';
  showPassword.value = true;
}

function confirmDelete(user: OrgUser) {
  selectedUser.value = user;
  showDelete.value = true;
}

async function handleCreate() {
  if (!form.value.fullName || !form.value.email || !form.value.password) {
    dialogError.value = 'Vui lòng điền đầy đủ thông tin bắt buộc';
    return;
  }
  saving.value = true;
  dialogError.value = '';
  const res = await createUser(form.value);
  saving.value = false;
  if (res.ok) { showCreate.value = false; } else { dialogError.value = res.error || ''; }
}

async function handleUpdate() {
  if (!selectedUser.value) return;
  saving.value = true;
  dialogError.value = '';
  const res = await updateUser(selectedUser.value.id, { fullName: form.value.fullName, email: form.value.email, role: form.value.role });
  saving.value = false;
  if (res.ok) { showEdit.value = false; } else { dialogError.value = res.error || ''; }
}

async function handlePassword() {
  if (!selectedUser.value || !newPassword.value) return;
  saving.value = true;
  dialogError.value = '';
  const res = await resetPassword(selectedUser.value.id, newPassword.value);
  saving.value = false;
  if (res.ok) { showPassword.value = false; } else { dialogError.value = res.error || ''; }
}

async function handleDelete() {
  if (!selectedUser.value) return;
  saving.value = true;
  const res = await deleteUser(selectedUser.value.id);
  saving.value = false;
  if (res.ok) { showDelete.value = false; }
}

onMounted(fetchUsers);
</script>

<style scoped>
.settings-shell {
  min-height: 100%;
  background: var(--color-canvas);
}

.title-icon-wrapper {
  background: var(--gradient-brand);
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-sm);
  animation: liquid-morph 8s infinite var(--liquid-ease);
}

.glass-container {
  background: var(--color-surface-glass) !important;
  backdrop-filter: blur(20px);
  border: 1px solid var(--color-border) !important;
  border-radius: 24px !important;
  box-shadow: var(--shadow-md) !important;
  overflow: hidden;
}

.settings-tabs {
  border-bottom: none;
}

.pill-tab {
  opacity: 0.7;
  transition: all 0.3s var(--liquid-ease);
}

.v-tab--selected.pill-tab {
  opacity: 1;
  font-weight: 700;
}

.search-bar {
  max-width: 320px;
}

.user-table {
  background: transparent !important;
}

:deep(.v-data-table__th) {
  font-weight: 700 !important;
  text-transform: uppercase;
  font-size: 0.7rem !important;
  letter-spacing: 0.08em;
  color: var(--color-text-muted) !important;
  background: transparent !important;
  padding: 16px !important;
  border-bottom: 2px solid var(--color-border) !important;
}

:deep(.v-data-table__tr) {
  transition: all 0.2s var(--liquid-ease);
}

:deep(.v-data-table__tr:hover) {
  background: var(--color-primary-soft) !important;
  transform: scale(1.002);
}

:deep(.v-data-table__td) {
  padding: 16px !important;
  border-bottom: 1px solid var(--color-border) !important;
}

.glass-avatar {
  border: 1px solid var(--color-primary-soft-strong);
  box-shadow: var(--shadow-sm);
}

.status-badge {
  transform: scale(1.2);
}

.status-active :deep(.v-badge__badge) {
  box-shadow: 0 0 0 4px var(--color-success-soft);
  animation: pulse-success 2s infinite;
}

@keyframes pulse-success {
  0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
  70% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
  100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
}

.action-btn {
  transition: all 0.3s var(--liquid-ease);
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--glow-brand);
}

.hover-scale:hover {
  transform: scale(1.15);
}

.dialog-glass {
  background: var(--color-surface-glass) !important;
  backdrop-filter: blur(24px) !important;
  border: 1px solid var(--color-border-strong) !important;
}

.gap-4 { gap: 1rem; }
.gap-1 { gap: 0.25rem; }

@keyframes liquid-morph {
  0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
  50% { border-radius: 30% 60% 70% 30% / 50% 60% 30% 50%; }
}
</style>
