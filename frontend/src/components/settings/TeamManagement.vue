<template>
  <div class="team-management">
    <div class="d-flex align-center mb-6">
      <div>
        <h3 class="text-h6 font-weight-bold mb-0">Danh sách các đội nhóm</h3>
        <p class="text-caption text-medium-emphasis">Tổ chức nhân sự theo phòng ban hoặc dự án</p>
      </div>
      <v-spacer />
      <v-btn
        v-if="authStore.isAdmin"
        color="primary"
        prepend-icon="mdi-plus"
        variant="tonal"
        @click="openCreate"
        class="text-none"
        rounded="lg"
      >
        Tạo đội nhóm
      </v-btn>
    </div>

    <v-alert v-if="error" type="error" variant="tonal" class="mb-4 rounded-xl" closable @click:close="error = ''">
      {{ error }}
    </v-alert>

    <div v-if="loading && teams.length === 0" class="d-flex justify-center py-12">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <div v-if="teams.length === 0 && !loading" class="text-center py-12 empty-state rounded-xl">
      <v-icon size="64" color="grey-lighten-2" class="mb-4">mdi-account-group-outline</v-icon>
      <div class="text-h6 text-medium-emphasis">Chưa có đội nhóm nào</div>
      <div class="text-body-2 text-disabled mb-6">Hãy tạo đội nhóm đầu tiên để quản lý nhân viên hiệu quả hơn</div>
      <v-btn
        v-if="authStore.isAdmin"
        color="primary"
        variant="flat"
        prepend-icon="mdi-plus"
        @click="openCreate"
        class="text-none px-6"
        rounded="lg"
      >
        Tạo đội nhóm ngay
      </v-btn>
    </div>

    <v-expansion-panels v-model="expandedPanel" variant="accordion" class="custom-panels">
      <v-expansion-panel
        v-for="team in teams"
        :key="team.id"
        @click="onPanelClick(team.id)"
        class="mb-3 team-panel"
      >
        <v-expansion-panel-title>
          <div class="d-flex align-center w-100 py-1">
            <div class="team-icon-avatar mr-4">
              <v-icon color="primary" size="24">mdi-account-group</v-icon>
            </div>
            <div>
              <span class="font-weight-bold text-body-1">{{ team.name }}</span>
              <div class="d-flex align-center mt-1">
                <v-chip size="x-small" color="primary" variant="flat" class="mr-2 px-2">
                  {{ memberMap[team.id]?.length ?? 0 }} thành viên
                </v-chip>
                <span class="text-caption text-disabled">ID: {{ team.id.substring(0, 8) }}</span>
              </div>
            </div>
            <v-spacer />
            <template v-if="authStore.isAdmin">
              <div class="actions-wrapper">
                <v-btn icon size="small" variant="text" color="primary" class="mr-1 hover-scale" @click.stop="openEdit(team)" title="Sửa">
                  <v-icon size="20">mdi-pencil-outline</v-icon>
                </v-btn>
                <v-btn icon size="small" variant="text" color="error" class="hover-scale" @click.stop="openDelete(team)" title="Xóa">
                  <v-icon size="20">mdi-delete-outline</v-icon>
                </v-btn>
              </div>
            </template>
          </div>
        </v-expansion-panel-title>
        <v-expansion-panel-text class="mt-2">
          <div class="members-container pa-2 rounded-xl">
            <div class="d-flex align-center mb-4">
              <span class="text-subtitle-2 font-weight-bold text-medium-emphasis">Thành viên đội nhóm</span>
              <v-spacer />
              <v-btn
                v-if="authStore.isAdmin"
                size="small"
                variant="text"
                color="primary"
                prepend-icon="mdi-account-plus-outline"
                @click="openAddMember(team)"
                class="text-none font-weight-bold"
              >
                Thêm thành viên
              </v-btn>
            </div>

            <div class="d-flex flex-wrap gap-2">
              <v-chip
                v-for="m in memberMap[team.id] ?? []"
                :key="m.userId"
                closable
                :close-label="'Xóa ' + m.fullName"
                @click:close="authStore.isAdmin && handleRemoveMember(team.id, m.userId)"
                class="member-chip py-4"
                variant="outlined"
              >
                <v-avatar start color="primary-lighten-4" class="mr-2">
                  <span class="text-primary text-caption font-weight-bold">{{ m.fullName[0].toUpperCase() }}</span>
                </v-avatar>
                <span class="font-weight-medium">{{ m.fullName }}</span>
              </v-chip>
              <div v-if="!memberMap[team.id]?.length && !loading" class="py-4 px-2 text-medium-emphasis text-body-2 d-flex align-center">
                <v-icon start size="18">mdi-information-outline</v-icon>
                Chưa có thành viên nào trong nhóm này
              </div>
            </div>
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <!-- Create team dialog -->
    <v-dialog v-model="showCreate" max-width="440" transition="dialog-bottom-transition">
      <v-card class="rounded-xl pa-2 dialog-glass">
        <v-card-title class="font-weight-bold px-4 pt-4">Tạo đội nhóm mới</v-card-title>
        <v-card-text class="pa-4">
          <p class="text-body-2 text-medium-emphasis mb-4">Tên đội nhóm nên phản ánh đúng chức năng hoặc nhiệm vụ (Vd: Sales, Support, HR...)</p>
          <v-text-field
            v-model="teamName"
            label="Tên đội nhóm *"
            variant="outlined"
            autofocus
            placeholder="Nhập tên đội nhóm..."
            @keyup.enter="handleCreate"
            rounded="lg"
          />
          <v-alert v-if="dialogError" type="error" density="compact" variant="tonal" class="mt-2 rounded-lg">{{ dialogError }}</v-alert>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="showCreate = false">Hủy bỏ</v-btn>
          <v-btn color="primary" :loading="saving" variant="flat" class="px-8 action-btn" rounded="lg" @click="handleCreate">Tạo ngay</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Edit team dialog -->
    <v-dialog v-model="showEdit" max-width="440" transition="dialog-bottom-transition">
      <v-card class="rounded-xl pa-2 dialog-glass">
        <v-card-title class="font-weight-bold px-4 pt-4">Sửa thông tin đội nhóm</v-card-title>
        <v-card-text class="pa-4">
          <v-text-field
            v-model="teamName"
            label="Tên đội nhóm *"
            variant="outlined"
            autofocus
            @keyup.enter="handleUpdate"
            rounded="lg"
          />
          <v-alert v-if="dialogError" type="error" density="compact" variant="tonal" class="mt-2 rounded-lg">{{ dialogError }}</v-alert>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="showEdit = false">Hủy</v-btn>
          <v-btn color="primary" :loading="saving" variant="flat" class="px-8 action-btn" rounded="lg" @click="handleUpdate">Lưu thay đổi</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete confirm dialog -->
    <v-dialog v-model="showDelete" max-width="400">
      <v-card class="rounded-xl pa-2 dialog-glass">
        <v-card-title class="font-weight-bold px-4 pt-4">Xóa đội nhóm</v-card-title>
        <v-card-text class="pa-4">
          Bạn có chắc chắn muốn xóa đội nhóm <span class="text-error font-weight-bold">"{{ selectedTeam?.name }}"</span>?
          <p class="mt-2 text-caption text-medium-emphasis">Hành động này không thể hoàn tác. Các thành viên sẽ bị xóa khỏi nhóm nhưng vẫn giữ tài khoản nhân viên.</p>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="showDelete = false">Đóng</v-btn>
          <v-btn color="error" :loading="saving" variant="flat" class="px-8 action-btn" rounded="lg" @click="handleDelete">Xóa nhóm</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Add member dialog -->
    <v-dialog v-model="showAddMember" max-width="460" transition="dialog-bottom-transition">
      <v-card class="rounded-xl pa-2 dialog-glass">
        <v-card-title class="font-weight-bold px-4 pt-4">Thêm thành viên vào "{{ selectedTeam?.name }}"</v-card-title>
        <v-card-text class="pa-4">
          <v-select
            v-model="selectedUserId"
            :items="availableUsers"
            item-title="fullName"
            item-value="id"
            label="Chọn nhân viên"
            variant="outlined"
            no-data-text="Không có nhân viên nào khả dụng"
            rounded="lg"
            class="mt-2"
          >
            <template #item="{ props, item }">
              <v-list-item v-bind="props" :subtitle="item.raw.email">
                <template #prepend>
                   <v-avatar color="primary-lighten-4" size="32" class="mr-2">
                     <span class="text-primary text-caption font-weight-bold">{{ item.raw.fullName[0] }}</span>
                   </v-avatar>
                </template>
              </v-list-item>
            </template>
          </v-select>
          <v-alert v-if="dialogError" type="error" density="compact" variant="tonal" class="mt-2 rounded-lg">{{ dialogError }}</v-alert>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="showAddMember = false">Hủy</v-btn>
          <v-btn color="primary" :loading="saving" variant="flat" class="px-8 action-btn" rounded="lg" @click="handleAddMember">Thêm vào nhóm</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useTeams, type Team, type TeamMember } from '@/composables/use-teams';
import { useUsers } from '@/composables/use-users';
import { useAuthStore } from '@/stores/auth';

const { teams, loading, error, fetchTeams, createTeam, updateTeam, deleteTeam, fetchMembers, addMember, removeMember } = useTeams();
const { users, fetchUsers } = useUsers();
const authStore = useAuthStore();

const expandedPanel = ref<number | null>(null);
const memberMap = ref<Record<string, TeamMember[]>>({});

const showCreate = ref(false);
const showEdit = ref(false);
const showDelete = ref(false);
const showAddMember = ref(false);
const saving = ref(false);
const dialogError = ref('');
const teamName = ref('');
const selectedTeam = ref<Team | null>(null);
const selectedUserId = ref<string>('');

// Users not already in the selected team
const availableUsers = computed(() => {
  if (!selectedTeam.value) return users.value;
  const memberIds = new Set((memberMap.value[selectedTeam.value.id] ?? []).map((m) => m.userId));
  return users.value.filter((u) => !memberIds.has(u.id));
});

async function onPanelClick(teamId: string) {
  if (!memberMap.value[teamId]) {
    memberMap.value[teamId] = await fetchMembers(teamId);
  }
}

function openCreate() {
  teamName.value = '';
  dialogError.value = '';
  showCreate.value = true;
}

function openEdit(team: Team) {
  selectedTeam.value = team;
  teamName.value = team.name;
  dialogError.value = '';
  showEdit.value = true;
}

function openDelete(team: Team) {
  selectedTeam.value = team;
  showDelete.value = true;
}

function openAddMember(team: Team) {
  selectedTeam.value = team;
  selectedUserId.value = '';
  dialogError.value = '';
  showAddMember.value = true;
}

async function handleCreate() {
  if (!teamName.value.trim()) {
    dialogError.value = 'Vui lòng nhập tên đội nhóm';
    return;
  }
  saving.value = true;
  dialogError.value = '';
  const res = await createTeam(teamName.value.trim());
  saving.value = false;
  if (res.ok) { showCreate.value = false; } else { dialogError.value = res.error || ''; }
}

async function handleUpdate() {
  if (!selectedTeam.value || !teamName.value.trim()) return;
  saving.value = true;
  dialogError.value = '';
  const res = await updateTeam(selectedTeam.value.id, teamName.value.trim());
  saving.value = false;
  if (res.ok) { showEdit.value = false; } else { dialogError.value = res.error || ''; }
}

async function handleDelete() {
  if (!selectedTeam.value) return;
  saving.value = true;
  const res = await deleteTeam(selectedTeam.value.id);
  saving.value = false;
  if (res.ok) {
    showDelete.value = false;
    delete memberMap.value[selectedTeam.value.id];
  }
}

async function handleAddMember() {
  if (!selectedTeam.value || !selectedUserId.value) return;
  saving.value = true;
  dialogError.value = '';
  const res = await addMember(selectedTeam.value.id, selectedUserId.value);
  saving.value = false;
  if (res.ok) {
    memberMap.value[selectedTeam.value.id] = await fetchMembers(selectedTeam.value.id);
    showAddMember.value = false;
  } else {
    dialogError.value = res.error || '';
  }
}

async function handleRemoveMember(teamId: string, userId: string) {
  const res = await removeMember(teamId, userId);
  if (res.ok) {
    memberMap.value[teamId] = await fetchMembers(teamId);
  }
}

onMounted(async () => {
  await Promise.all([fetchTeams(), fetchUsers()]);
});
</script>

<style scoped>
.team-management {
  color: var(--color-text);
}

.empty-state {
  background: var(--color-surface-muted);
  border: 2px dashed var(--color-border);
}

.custom-panels {
  background: transparent !important;
}

.team-panel {
  background: var(--color-surface) !important;
  border: 1px solid var(--color-border) !important;
  border-radius: 16px !important;
  overflow: hidden;
  transition: all 0.3s var(--liquid-ease) !important;
}

.team-panel:hover {
  border-color: var(--color-primary-soft-strong) !important;
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}

.v-expansion-panel--active.team-panel {
  border-color: var(--color-primary) !important;
  box-shadow: var(--shadow-md);
}

.team-icon-avatar {
  background: var(--color-primary-soft);
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.members-container {
  background: var(--color-surface-muted);
  border: 1px solid var(--color-border);
}

.member-chip {
  background: var(--color-surface) !important;
  border: 1px solid var(--color-border) !important;
  transition: all 0.2s var(--liquid-ease);
}

.member-chip:hover {
  border-color: var(--color-primary) !important;
  transform: translateY(-1px);
}

.hover-scale:hover {
  transform: scale(1.2);
}

.dialog-glass {
  background: var(--color-surface-glass) !important;
  backdrop-filter: blur(24px) !important;
  border: 1px solid var(--color-border-strong) !important;
}

.action-btn {
  transition: all 0.3s var(--liquid-ease);
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--glow-brand);
}

.gap-2 { gap: 0.5rem; }
</style>
