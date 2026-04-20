<template>
  <div class="settings-shell">
    <h1 class="text-h4 mb-4 settings-title">
      <v-icon class="mr-2 settings-title-icon">mdi-cog-outline</v-icon>
      CÃ i Ä‘áº·t
    </h1>

    <v-tabs v-model="tab" class="mb-4">
      <v-tab value="users">NhÃ¢n viÃªn</v-tab>
      <v-tab value="teams">Äá»™i nhÃ³m</v-tab>
      <v-tab value="org">Tá»• chá»©c</v-tab>
    </v-tabs>

    <v-window v-model="tab">
      <v-window-item value="users">
        <div class="d-flex align-center mb-4">
          <v-btn v-if="authStore.isAdmin" color="primary" prepend-icon="mdi-plus" @click="openCreate">
            ThÃªm nhÃ¢n viÃªn
          </v-btn>
        </div>

        <v-alert v-if="error" type="error" variant="tonal" class="mb-4" closable @click:close="error = ''">
          {{ error }}
        </v-alert>

        <v-card>
          <v-data-table :headers="headers" :items="users" :loading="loading" no-data-text="ChÆ°a cÃ³ nhÃ¢n viÃªn nÃ o">
            <template #item.role="{ item }">
              <v-chip :color="roleColor(item.role)" size="small" variant="flat">{{ roleLabel(item.role) }}</v-chip>
            </template>
            <template #item.isActive="{ item }">
              <v-chip :color="item.isActive ? 'success' : 'default'" size="small" variant="flat">
                {{ item.isActive ? 'Hoáº¡t Ä‘á»™ng' : 'VÃ´ hiá»‡u' }}
              </v-chip>
            </template>
            <template #item.actions="{ item }">
              <v-btn v-if="authStore.isAdmin" icon size="small" title="Chá»‰nh sá»­a" @click="openEdit(item)">
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
              <v-btn v-if="authStore.isAdmin" icon size="small" title="Äáº·t láº¡i máº­t kháº©u" @click="openPassword(item)">
                <v-icon>mdi-lock-reset</v-icon>
              </v-btn>
              <v-btn v-if="authStore.isOwner && item.id !== authStore.user?.id" icon size="small" color="error" title="VÃ´ hiá»‡u hÃ³a" @click="confirmDelete(item)">
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </template>
          </v-data-table>
        </v-card>

        <v-dialog v-model="showCreate" max-width="440">
          <v-card>
            <v-card-title>ThÃªm nhÃ¢n viÃªn</v-card-title>
            <v-card-text>
              <v-text-field v-model="form.fullName" label="Há» tÃªn *" class="mb-2" />
              <v-text-field v-model="form.email" label="Email *" type="email" class="mb-2" />
              <v-text-field v-model="form.password" label="Máº­t kháº©u *" type="password" class="mb-2" />
              <v-select v-model="form.role" :items="roleOptions" item-title="label" item-value="value" label="Vai trÃ²" />
              <v-alert v-if="dialogError" type="error" density="compact" class="mt-2">{{ dialogError }}</v-alert>
            </v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn @click="showCreate = false">Há»§y</v-btn>
              <v-btn color="primary" :loading="saving" @click="handleCreate">Táº¡o</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <v-dialog v-model="showEdit" max-width="440">
          <v-card>
            <v-card-title>Chá»‰nh sá»­a nhÃ¢n viÃªn</v-card-title>
            <v-card-text>
              <v-text-field v-model="form.fullName" label="Há» tÃªn" class="mb-2" />
              <v-text-field v-model="form.email" label="Email" type="email" class="mb-2" />
              <v-select v-if="authStore.isOwner" v-model="form.role" :items="roleOptions" item-title="label" item-value="value" label="Vai trÃ²" />
              <v-alert v-if="dialogError" type="error" density="compact" class="mt-2">{{ dialogError }}</v-alert>
            </v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn @click="showEdit = false">Há»§y</v-btn>
              <v-btn color="primary" :loading="saving" @click="handleUpdate">LÆ°u</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <v-dialog v-model="showPassword" max-width="400">
          <v-card>
            <v-card-title>Äáº·t láº¡i máº­t kháº©u</v-card-title>
            <v-card-text>
              <v-text-field v-model="newPassword" label="Máº­t kháº©u má»›i *" type="password" />
              <v-alert v-if="dialogError" type="error" density="compact" class="mt-2">{{ dialogError }}</v-alert>
            </v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn @click="showPassword = false">Há»§y</v-btn>
              <v-btn color="primary" :loading="saving" @click="handlePassword">Äáº·t láº¡i</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <v-dialog v-model="showDelete" max-width="400">
          <v-card>
            <v-card-title>XÃ¡c nháº­n vÃ´ hiá»‡u hÃ³a</v-card-title>
            <v-card-text>Báº¡n cÃ³ cháº¯c muá»‘n vÃ´ hiá»‡u hÃ³a nhÃ¢n viÃªn "{{ selectedUser?.fullName }}"?</v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn @click="showDelete = false">Há»§y</v-btn>
              <v-btn color="error" :loading="saving" @click="handleDelete">VÃ´ hiá»‡u hÃ³a</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-window-item>

      <v-window-item value="teams">
        <TeamManagement />
      </v-window-item>

      <v-window-item value="org">
        <OrgSettings />
      </v-window-item>
    </v-window>
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
  { label: 'NhÃ¢n viÃªn', value: 'member' },
  { label: 'Quáº£n trá»‹ viÃªn', value: 'admin' },
];

const headers = [
  { title: 'Há» tÃªn', key: 'fullName', sortable: true },
  { title: 'Email', key: 'email' },
  { title: 'Vai trÃ²', key: 'role', sortable: true },
  { title: 'Tráº¡ng thÃ¡i', key: 'isActive', sortable: true },
  { title: 'HÃ nh Ä‘á»™ng', key: 'actions', sortable: false, align: 'end' as const },
];

function roleColor(role: string) {
  if (role === 'owner') return 'primary';
  if (role === 'admin') return 'info';
  return 'default';
}

function roleLabel(role: string) {
  if (role === 'owner') return 'Chá»§ sá»Ÿ há»¯u';
  if (role === 'admin') return 'Quáº£n trá»‹ viÃªn';
  return 'NhÃ¢n viÃªn';
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
  if (!selectedUser.value) return;
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
  color: var(--color-text);
}

.settings-title {
  color: var(--color-text);
}

.settings-title-icon {
  color: var(--color-primary);
}
</style>
