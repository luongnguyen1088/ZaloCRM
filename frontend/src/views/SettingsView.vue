<template>
  <div class="settings-shell pa-6">
    <div class="page-header mb-8">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1 settings-title d-flex align-center">
          <div class="title-icon-wrapper mr-4">
            <v-icon color="white" size="28">mdi-account-cog</v-icon>
          </div>
          Cài đặt
        </h1>
        <p class="text-subtitle-1 text-medium-emphasis ml-15">Quản lý tài khoản cá nhân, đội ngũ và thiết lập tổ chức</p>
      </div>
    </div>

    <v-row class="fill-height mt-2">
      <!-- Sidebar Navigation -->
      <v-col cols="12" md="3" lg="2">
        <v-card class="settings-nav-card pa-2 mb-4">
          <v-list density="comfortable" nav class="bg-transparent pa-0">
            <v-list-item
              v-for="nav in settingsNavigation"
              :key="nav.value"
              :value="nav.value"
              :active="tab === nav.value"
              @click="tab = nav.value"
              rounded="xl"
              class="mb-2 nav-item"
              :color="tab === nav.value ? 'primary' : ''"
              variant="text"
            >
              <template v-slot:prepend>
                <v-icon :icon="nav.icon" class="mr-2" :color="tab === nav.value ? 'primary' : 'medium-emphasis'"></v-icon>
              </template>
              <v-list-item-title class="font-weight-bold">{{ nav.title }}</v-list-item-title>
            </v-list-item>
          </v-list>
          
          <v-divider class="my-4 opacity-10" />
          
          <v-list density="compact" nav class="bg-transparent pa-0">
            <v-list-item
              prepend-icon="mdi-help-circle-outline"
              title="Trung tâm hỗ trợ"
              class="text-caption font-weight-medium opacity-70"
              rounded="xl"
              href="https://docs.claro.vn"
              target="_blank"
            />
          </v-list>
        </v-card>
      </v-col>

      <!-- Main Content Area -->
      <v-col cols="12" md="9" lg="10">
        <v-card class="glass-container fill-height min-h-600">
          <v-window v-model="tab" class="pa-8">
            <!-- PROFILE TAB -->
            <v-window-item value="profile">
              <div class="content-header mb-8">
                <h2 class="text-h5 font-weight-bold mb-1">Hồ sơ cá nhân</h2>
                <p class="text-body-2 text-medium-emphasis">Cập nhật thông tin cá nhân và quản lý bảo mật tài khoản</p>
              </div>
              <MyProfile />
            </v-window-item>

            <!-- USERS TAB -->
            <v-window-item value="users">
              <div class="content-header mb-8 d-flex align-center">
                <div>
                  <h2 class="text-h5 font-weight-bold mb-1">Quản lý nhân sự</h2>
                  <p class="text-body-2 text-medium-emphasis">Mời và phân quyền truy cập cho các thành viên trong đội ngũ</p>
                </div>
                <v-spacer />
                <v-btn
                  v-if="authStore.isAdmin"
                  color="primary"
                  prepend-icon="mdi-email-plus-outline"
                  @click="openInvite"
                  class="text-none px-6 action-btn"
                  rounded="lg"
                  elevation="0"
                  size="large"
                >
                  Mời nhân viên
                </v-btn>
              </div>

              <div class="mb-10">
                <TeamManagement />
              </div>

              <v-divider class="my-10 opacity-10" />

              <!-- Users List Table Section -->
              <div class="d-flex align-center gap-4 mb-6">
                <h3 class="text-h6 font-weight-bold">Danh sách nhân viên</h3>
                <v-spacer />
                <v-text-field
                  v-model="search"
                  prepend-inner-icon="mdi-magnify"
                  label="Tìm kiếm nhân viên..."
                  variant="solo"
                  flat
                  density="comfortable"
                  hide-details
                  class="search-bar"
                  rounded="lg"
                  bg-color="surface-light"
                />
              </div>

              <v-alert v-if="error" type="error" variant="tonal" class="mb-6 rounded-xl" closable @click:close="error = ''">
                {{ error }}
              </v-alert>

              <v-data-table
                :headers="headers"
                :items="users"
                :loading="loading"
                :search="search"
                no-data-text="Chưa có nhân viên nào"
                class="user-table mb-8 custom-data-table"
                hover
              >
                <template #item.fullName="{ item }">
                  <div class="d-flex align-center py-3">
                    <v-avatar color="primary-lighten-4" size="44" class="mr-4 glass-avatar border-glow">
                      <span class="text-primary font-weight-bold text-body-2">{{ getInitials(item.fullName) }}</span>
                    </v-avatar>
                    <div>
                      <div class="font-weight-bold text-body-1">{{ item.fullName }}</div>
                      <div class="text-caption text-medium-emphasis">{{ item.email }}</div>
                    </div>
                  </div>
                </template>

                <template #item.role="{ item }">
                  <v-chip :color="roleColor(item.role)" size="small" variant="flat" class="font-weight-bold px-3">
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
                      variant="tonal"
                      color="primary"
                      title="Chỉnh sửa"
                      @click="openEdit(item)"
                      class="mr-1"
                    />
                    <v-btn
                      v-if="authStore.isAdmin"
                      icon="mdi-key-reset"
                      size="small"
                      variant="tonal"
                      color="warning"
                      title="Đặt lại mật khẩu"
                      @click="openPassword(item)"
                      class="mr-1"
                    />
                    <v-btn
                      v-if="authStore.isOwner && item.id !== authStore.user?.id"
                      icon="mdi-delete-outline"
                      size="small"
                      variant="tonal"
                      color="error"
                      title="Vô hiệu hóa"
                      @click="confirmDelete(item)"
                    />
                  </div>
                </template>
              </v-data-table>

              <!-- Pending Invitations Section -->
              <template v-if="authStore.isAdmin && pendingInvitations.length > 0">
                <div class="d-flex align-center gap-4 mb-4 mt-12">
                  <h3 class="text-h6 font-weight-bold">Lời mời đang chờ ({{ pendingInvitations.length }})</h3>
                </div>
                
                <v-card variant="outlined" class="rounded-xl border-dashed bg-surface-light overflow-hidden">
                  <v-data-table
                    :headers="invitationHeaders"
                    :items="pendingInvitations"
                    :loading="invitingLoading"
                    no-data-text="Không có lời mời nào đang chờ"
                    class="bg-transparent"
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
                        <v-chip size="x-small" variant="outlined" class="text-uppercase font-weight-bold">{{ item.role }}</v-chip>
                    </template>
                    <template #item.actions="{ item }">
                        <v-btn icon="mdi-content-copy" size="small" variant="text" color="primary" title="Copy link mời" @click="copyInviteLink(item.token)" />
                    </template>
                  </v-data-table>
                </v-card>
              </template>
            </v-window-item>

            <!-- ORG TAB -->
            <v-window-item value="org">
              <div class="content-header mb-8">
                <h2 class="text-h5 font-weight-bold mb-1">Thông tin tổ chức</h2>
                <p class="text-body-2 text-medium-emphasis">Quản lý thông tin chung và cấu hình cấp doanh nghiệp</p>
              </div>
              <OrgSettings />
            </v-window-item>

            <!-- BILLING TAB -->
            <v-window-item value="billing">
              <div class="content-header mb-8">
                <h2 class="text-h5 font-weight-bold mb-1">Gói cước & Thanh toán</h2>
                <p class="text-body-2 text-medium-emphasis">Theo dõi hạn mức sử dụng và quản lý các giao dịch</p>
              </div>
              <PlanSummary />
            </v-window-item>

            <!-- INTEGRATIONS TAB -->
            <v-window-item value="integrations">
              <Integrations />
            </v-window-item>

            <!-- DEVELOPER TAB -->
            <v-window-item value="developer">
              <ApiDeveloper />
            </v-window-item>
          </v-window>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialogs remain similar but with slightly polished UI -->
    <!-- New Invite Dialog -->
    <v-dialog v-model="showInvite" max-width="820" persistent transition="dialog-bottom-transition">
      <v-card class="rounded-xl pa-2 dialog-glass-premium overflow-hidden">
        <v-card-title class="d-flex align-center px-6 pt-6">
          <v-spacer />
          <span class="text-h5 font-weight-bold">Mời thành viên mới</span>
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" density="comfortable" @click="showInvite = false" />
        </v-card-title>
        
        <v-card-text class="pa-8 pt-4">
          <v-row>
            <v-col cols="12" md="5" class="pr-md-8 border-right-dashed">
              <h3 class="text-h6 font-weight-bold mb-4 d-flex align-center">
                <v-icon color="primary" class="mr-2">mdi-shield-account-outline</v-icon>
                Chi tiết vai trò
              </h3>
              <div class="role-info-card pa-4 rounded-xl bg-primary-soft-strong">
                <div class="text-subtitle-1 font-weight-bold text-primary mb-2">{{ selectedRoleInfo.label }}</div>
                <p class="text-body-2 text-medium-emphasis leading-relaxed">
                  {{ selectedRoleInfo.description }}
                </p>
              </div>
            </v-col>

            <v-col cols="12" md="7" class="pl-md-8">
              <h3 class="text-h6 font-weight-bold mb-4">Chọn vai trò truy cập</h3>
              <v-radio-group v-model="inviteForm.role" class="role-radio-group-modern" hide-details>
                <div v-for="opt in roleDetailOptions" :key="opt.value" class="mb-3">
                  <v-radio
                    :value="opt.value"
                    color="primary"
                    class="role-radio-item-modern"
                  >
                    <template #label>
                      <div class="ml-2">
                        <div class="text-body-1 font-weight-bold">{{ opt.label }}</div>
                      </div>
                    </template>
                  </v-radio>
                </div>
              </v-radio-group>
            </v-col>
          </v-row>

          <v-alert v-if="inviteError" type="error" variant="tonal" density="compact" class="mt-8 rounded-lg">{{ inviteError }}</v-alert>
          
          <v-expand-transition>
            <div v-if="generatedLink" class="mt-8 pa-6 invite-link-box-premium rounded-xl border-dashed">
              <div class="d-flex align-center">
                <div class="mr-5 invite-link-icon-premium">
                  <v-icon color="primary" size="28">mdi-link-variant</v-icon>
                </div>
                <div class="flex-grow-1 overflow-hidden">
                  <div class="text-caption font-weight-black text-primary mb-1 uppercase letter-spacing-1">LINK MỜI ĐÃ SẴN SÀNG</div>
                  <div class="text-body-1 text-truncate font-weight-bold text-high-emphasis">{{ generatedLink }}</div>
                </div>
                <v-btn color="primary" variant="flat" class="ml-6 rounded-pill px-8" height="48" @click="copyText(generatedLink)">Sao chép</v-btn>
              </div>
            </div>
          </v-expand-transition>
        </v-card-text>

        <v-divider class="opacity-10" />

        <v-card-actions class="pa-8">
          <v-btn 
            block 
            color="primary" 
            :loading="invitingLoading" 
            variant="flat" 
            height="56"
            class="text-none font-weight-bold text-h6" 
            rounded="pill" 
            @click="handleInvite"
          >
            <v-icon start size="24">mdi-plus-circle</v-icon>
            Tạo mã mời
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
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUsers, type OrgUser } from '@/composables/use-users';
import { useInvitations } from '@/composables/use-invitations';
import { useAuthStore } from '@/stores/auth';
import TeamManagement from '@/components/settings/TeamManagement.vue';
import OrgSettings from '@/components/settings/OrgSettings.vue';
import MyProfile from '@/components/settings/MyProfile.vue';
import PlanSummary from '@/components/settings/PlanSummary.vue';
import Integrations from '@/components/settings/Integrations.vue';
import ApiDeveloper from '@/components/settings/ApiDeveloper.vue';

const { users, loading, error, fetchUsers, updateUser, resetPassword, deleteUser } = useUsers();
const { invitations, loading: invitingLoading, fetchInvitations, createInvitation } = useInvitations();
const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();

const tab = ref(route.query.tab?.toString() || 'profile');

// Sync tab with query param
watch(() => route.query.tab, (newTab) => {
  if (newTab) tab.value = newTab.toString();
});

watch(tab, (newVal) => {
  router.replace({ query: { ...route.query, tab: newVal } });
});
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

const settingsNavigation = [
  { title: 'Hồ sơ cá nhân', value: 'profile', icon: 'mdi-account-circle-outline' },
  { title: 'Nhân sự & Đội ngũ', value: 'users', icon: 'mdi-account-group-outline' },
  { title: 'Thiết lập tổ chức', value: 'org', icon: 'mdi-shield-check-outline' },
  { title: 'Gói cước & Billing', value: 'billing', icon: 'mdi-crown-outline' },
  { title: 'Tích hợp hệ thống', value: 'integrations', icon: 'mdi-transit-connection-variant' },
  { title: 'Nhà phát triển', value: 'developer', icon: 'mdi-code-braces' },
];

const headers = [
  { title: 'Nhân viên', key: 'fullName', sortable: true },
  { title: 'Vai trò', key: 'role', sortable: true },
  { title: 'Trạng thái', key: 'isActive', sortable: true },
  { title: '', key: 'actions', sortable: false, align: 'end' as const },
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
  inviteForm.value = { role: 'admin' };
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
  const res = await createInvitation(inviteForm.value);
  if (res.ok) {
    generatedLink.value = res.inviteLink || '';
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
  min-height: 100vh;
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

.settings-nav-card {
  background: var(--color-surface-glass) !important;
  backdrop-filter: blur(16px);
  border: 1px solid var(--color-border) !important;
  border-radius: 20px !important;
}

.nav-item {
  transition: all 0.3s ease;
}

.nav-item :deep(.v-list-item-title) {
  font-size: 0.95rem;
}

.glass-container {
  background: var(--color-surface-glass) !important;
  backdrop-filter: blur(20px);
  border: 1px solid var(--color-border) !important;
  border-radius: 24px !important;
  box-shadow: var(--shadow-md) !important;
}

.min-h-600 {
  min-height: 600px;
}

.search-bar {
  max-width: 320px;
}

.custom-data-table {
  background: transparent !important;
}

:deep(.v-data-table-header__content) {
  font-weight: 800 !important;
  text-transform: uppercase;
  font-size: 0.75rem !important;
  letter-spacing: 0.05em;
  color: var(--color-text-muted) !important;
}

:deep(.v-data-table__tr:hover) {
  background: var(--color-primary-soft) !important;
}

.glass-avatar {
  border: 2px solid var(--color-primary-soft-strong);
}

.border-glow {
  box-shadow: 0 0 15px var(--color-primary-soft);
}

.status-active :deep(.v-badge__badge) {
  box-shadow: 0 0 0 4px var(--color-success-soft);
  animation: pulse-success 2s infinite;
}

@keyframes pulse-success {
  0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
  100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
}

.dialog-glass-premium {
  background: rgba(var(--v-theme-surface), 0.85) !important;
  backdrop-filter: blur(32px) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5) !important;
}

.border-right-dashed {
  border-right: 1px dashed var(--color-border-strong);
}

.role-info-card {
  border: 1px solid var(--color-primary-soft-strong);
}

.role-radio-item-modern {
  padding: 16px;
  border-radius: 16px;
  background: var(--color-surface-elevated);
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.role-radio-item-modern:hover {
  background: var(--color-primary-soft);
}

:deep(.v-selection-control--active) .role-radio-item-modern {
  border-color: var(--color-primary);
  background: var(--color-primary-soft-strong);
}

.invite-link-box-premium {
  background: linear-gradient(135deg, var(--color-primary-soft), transparent);
  border-color: var(--color-primary-soft-strong) !important;
}

.invite-link-icon-premium {
  width: 64px;
  height: 64px;
  background: white;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-md);
}

.action-btn {
  transition: all 0.4s var(--liquid-ease);
}

.action-btn:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: var(--glow-brand);
}

@keyframes liquid-morph {
  0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
  50% { border-radius: 30% 60% 70% 30% / 50% 60% 30% 50%; }
}

.uppercase { text-transform: uppercase; }
.letter-spacing-1 { letter-spacing: 1px; }
</style>
