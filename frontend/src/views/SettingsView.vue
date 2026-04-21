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
          <!-- Users List -->
          <div class="d-flex align-center gap-4 mb-6">
            <h3 class="text-subtitle-1 font-weight-bold">Danh sách nhân viên</h3>
            <v-spacer />
            <v-text-field
              v-model="search"
              prepend-inner-icon="mdi-magnify"
              label="Tìm kiếm..."
              variant="solo-filled"
              flat
              density="compact"
              hide-details
              class="search-bar"
              rounded="lg"
            />
            <v-btn
              v-if="authStore.isAdmin"
              color="primary"
              prepend-icon="mdi-email-plus-outline"
              @click="openInvite"
              class="text-none px-6 action-btn"
              rounded="lg"
              elevation="0"
            >
              Mời nhân viên
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
            class="user-table mb-8"
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

          <!-- Pending Invitations Section -->
          <template v-if="authStore.isAdmin">
            <div class="d-flex align-center gap-4 mb-4 mt-8">
              <h3 class="text-subtitle-1 font-weight-bold">Lời mời đang chờ ({{ pendingInvitations.length }})</h3>
            </div>
            
            <v-data-table
              :headers="invitationHeaders"
              :items="pendingInvitations"
              :loading="invitingLoading"
              no-data-text="Không có lời mời nào đang chờ"
              class="user-table"
              density="comfortable"
            >
               <template #item.status="{ item }">
                  <v-chip size="x-small" :color="inviteStatusColor(item.status)" variant="flat" class="text-uppercase font-weight-bold">
                    {{ item.status }}
                  </v-chip>
               </template>
               <template #item.expiresAt="{ item }">
                  <span class="text-caption">{{ formatDate(item.expiresAt) }}</span>
               </template>
               <template #item.role="{ item }">
                  <span class="text-caption font-weight-bold text-uppercase">{{ item.role }}</span>
               </template>
               <template #item.actions="{ item }">
                  <v-btn icon="mdi-content-copy" size="x-small" variant="text" title="Copy link mời" @click="copyInviteLink(item.token)" />
               </template>
            </v-data-table>
          </template>
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

    <!-- New Invite Dialog (Generic Link Style) -->
    <v-dialog v-model="showInvite" max-width="820" persistent transition="dialog-bottom-transition">
      <v-card class="rounded-xl pa-2 dialog-glass overflow-hidden">
        <v-card-title class="d-flex align-center px-6 pt-4">
          <v-spacer />
          <span class="text-h6 font-weight-bold">Mời quản lý</span>
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" density="comfortable" @click="showInvite = false" />
        </v-card-title>
        
        <v-divider class="mx-6 opacity-50" />

        <v-card-text class="pa-8">
          <v-row>
            <!-- Left Info Column -->
            <v-col cols="12" md="6" class="pr-md-8 border-right">
              <h3 class="text-h6 font-weight-bold mb-2">Vai trò</h3>
              <p class="text-body-2 text-medium-emphasis leading-relaxed">
                {{ selectedRoleInfo.description }}
              </p>
            </v-col>

            <!-- Right Selection Column -->
            <v-col cols="12" md="6" class="pl-md-8">
              <v-radio-group v-model="inviteForm.role" class="role-radio-group" hide-details>
                <v-radio
                  v-for="opt in roleDetailOptions"
                  :key="opt.value"
                  :value="opt.value"
                  color="primary"
                  class="mb-3 role-radio-item"
                >
                  <template #label>
                    <div class="ml-2">
                      <div class="text-body-1 font-weight-bold">{{ opt.label }}</div>
                    </div>
                  </template>
                </v-radio>
              </v-radio-group>
            </v-col>
          </v-row>

          <v-alert v-if="inviteError" type="error" variant="tonal" density="compact" class="mt-8 rounded-lg">{{ inviteError }}</v-alert>
          
          <v-expand-transition>
            <div v-if="generatedLink" class="mt-8 pa-4 invite-link-box rounded-xl border-dashed">
              <div class="d-flex align-center">
                <div class="mr-4 invite-link-icon">
                  <v-icon color="primary">mdi-link-variant</v-icon>
                </div>
                <div class="flex-grow-1 overflow-hidden">
                  <div class="text-caption font-weight-bold text-primary mb-1">LINK MỜI ĐÃ SẴN SÀNG:</div>
                  <div class="text-body-2 text-truncate font-weight-medium">{{ generatedLink }}</div>
                </div>
                <v-btn color="primary" variant="flat" class="ml-4 rounded-lg px-6" @click="copyText(generatedLink)">Sao chép</v-btn>
              </div>
            </div>
          </v-expand-transition>
        </v-card-text>

        <v-divider class="mx-6 opacity-30" />

        <v-card-actions class="pa-6">
          <v-btn 
            block 
            color="primary" 
            :loading="invitingLoading" 
            variant="flat" 
            size="large"
            class="text-none font-weight-bold create-link-btn" 
            rounded="pill" 
            @click="handleInvite"
          >
            <v-icon start>mdi-link-variant</v-icon>
            Tạo một link
          </v-btn>
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
import { ref, computed, onMounted } from 'vue';
import { useUsers, type OrgUser } from '@/composables/use-users';
import { useInvitations } from '@/composables/use-invitations';
import { useAuthStore } from '@/stores/auth';
import TeamManagement from '@/components/settings/TeamManagement.vue';
import OrgSettings from '@/components/settings/OrgSettings.vue';

const { users, loading, error, fetchUsers, updateUser, resetPassword, deleteUser } = useUsers();
const { invitations, loading: invitingLoading, fetchInvitations, createInvitation } = useInvitations();
const authStore = useAuthStore();

const tab = ref('users');
const search = ref('');
const showInvite = ref(false);
const showEdit = ref(false);
const showPassword = ref(false);
const showDelete = ref(false);
const saving = ref(false);
const dialogError = ref('');
const inviteError = ref('');
const generatedLink = ref('');
const newPassword = ref('');
const selectedUser = ref<OrgUser | null>(null);

const form = ref({ fullName: '', email: '', role: 'member' });
const inviteForm = ref({ role: 'admin' });

const roleDetailOptions = [
  { 
    label: 'Quản trị viên', 
    value: 'admin',
    description: 'Quản trị viên kiểm soát quản lý các vai trò trên Bot. Họ cũng có thể vô hiệu hóa và sao chép bot, chia sẻ nội dung của nó, tạo và cài đặt các mẫu, quản lý lập hóa đơn và thanh toán.'
  },
  { 
    label: 'Biên tập viên', 
    value: 'editor',
    description: 'Biên tập viên có quyền chỉnh sửa nội dung, kịch bản chatbot và quản lý khách hàng nhưng không có quyền thay đổi cài đặt hệ thống hay thanh toán.'
  },
  { 
    label: 'Live Chat Agent', 
    value: 'agent',
    description: 'Nhân viên hỗ trợ có quyền truy cập vào phần Chat để trả lời khách hàng, quản lý thông tin khách hàng và đặt lịch hẹn.'
  },
  { 
    label: 'Chỉ xem', 
    value: 'viewer',
    description: 'Quyền chỉ xem cho phép người dùng xem các báo cáo, thông số và nội dung nhưng không được phép chỉnh sửa hay nhắn tin.'
  },
];

const selectedRoleInfo = computed(() => {
  return roleDetailOptions.find(opt => opt.value === inviteForm.value.role) || roleDetailOptions[0];
});

const roleOptions = roleDetailOptions.map(opt => ({ label: opt.label, value: opt.value }));

const headers = [
  { title: 'Nhân viên', key: 'fullName', sortable: true },
  { title: 'Vai trò', key: 'role', sortable: true },
  { title: 'Trạng thái', key: 'isActive', sortable: true },
  { title: 'Hành động', key: 'actions', sortable: false, align: 'end' as const },
];

const invitationHeaders = [
  { title: 'Email', key: 'email' },
  { title: 'Vai trò', key: 'role' },
  { title: 'Thời hạn', key: 'expiresAt' },
  { title: 'Trạng thái', key: 'status' },
  { title: '', key: 'actions', sortable: false, align: 'end' as const },
];

const pendingInvitations = computed(() => {
  return invitations.value.filter(i => i.status === 'pending');
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
  return 'Nhân viên';
}

function inviteStatusColor(status: string) {
  if (status === 'pending') return 'warning';
  if (status === 'accepted') return 'success';
  return 'grey';
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleString('vi-VN', { 
    day: '2-digit', month: '2-digit', 
    hour: '2-digit', minute: '2-digit' 
  });
}

function openInvite() {
  inviteForm.value = { email: '', role: 'member' };
  inviteError.value = '';
  generatedLink.value = '';
  showInvite.value = true;
}

function openEdit(user: OrgUser) {
  selectedUser.value = user;
  form.value = { fullName: user.fullName, email: user.email, role: user.role };
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

async function handleInvite() {
  if (!inviteForm.value.email) {
    inviteError.value = 'Vui lòng nhập email';
    return;
  }
  const res = await createInvitation(inviteForm.value);
  if (res.ok) {
    generatedLink.value = res.debugLink || '';
    if (!res.debugLink) showInvite.value = false;
  } else {
    inviteError.value = res.error || '';
  }
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

function copyInviteLink(token: string) {
  const link = `${window.location.origin}/accept-invite?token=${token}`;
  copyText(link);
}

function copyText(text: string) {
  navigator.clipboard.writeText(text);
}

onMounted(() => {
  fetchUsers();
  if (authStore.isAdmin) fetchInvitations();
});
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

.border-right {
  border-right: 1px solid var(--color-border);
}

.role-radio-item {
  padding: 12px 16px;
  border-radius: 12px;
  background: var(--color-surface-elevated);
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.role-radio-item:hover {
  background: var(--color-primary-soft);
}

:deep(.v-selection-control--active) .role-radio-item {
  border-color: var(--color-primary);
  background: var(--color-primary-soft);
}

.invite-link-box {
  background: var(--color-primary-soft);
  border: 2px dashed var(--color-primary-soft-strong);
}

.invite-link-icon {
  width: 48px;
  height: 48px;
  background: white;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-sm);
}

.create-link-btn {
  height: 56px !important;
  font-size: 1.1rem !important;
  letter-spacing: 0.02em;
  text-transform: none;
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

.bg-primary-soft {
  background: var(--color-primary-soft);
}

.gap-4 { gap: 1rem; }
.gap-1 { gap: 0.25rem; }

@keyframes liquid-morph {
  0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
  50% { border-radius: 30% 60% 70% 30% / 50% 60% 30% 50%; }
}
</style>
