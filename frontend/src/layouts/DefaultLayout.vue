<template>
  <v-app :class="{ 'liquid-bg': isDark }">
    <v-app-bar density="comfortable" flat>
      <v-app-bar-nav-icon @click="drawer = !drawer" />

      <div class="brand-lockup d-flex align-center">
        <div class="brand-orb ai-core-orb d-flex align-center justify-center">
          <v-icon size="18" color="white">mdi-brain</v-icon>
        </div>
        <v-app-bar-title class="brand-title">
          <span class="brand-title__base">Zalo</span><span class="brand-title__mark">CRM</span>
        </v-app-bar-title>
      </div>

      <!-- Organization Switcher -->
      <v-menu v-if="authStore.user && authStore.user.memberships.length > 0" offset-y transition="scale-transition">
        <template v-slot:activator="{ props }">
          <v-btn v-bind="props" variant="tonal" color="primary" rounded="pill" class="ml-4 px-4 text-none" density="comfortable">
            <v-icon start size="small">mdi-domain</v-icon>
            {{ authStore.user.org?.name || 'Chọn tổ chức' }}
            <v-icon end size="small">mdi-chevron-down</v-icon>
          </v-btn>
        </template>
        <v-list density="compact" min-width="200" class="rounded-lg py-2">
          <v-list-subheader class="text-uppercase font-weight-bold" style="font-size: 10px;">Tổ chức của bạn</v-list-subheader>
          <v-list-item
            v-for="member in authStore.user.memberships"
            :key="member.orgId"
            @click="authStore.switchOrg(member.orgId)"
            :active="member.orgId === authStore.user.orgId"
            rounded="lg"
            class="mx-2 mb-1"
          >
            <template v-slot:prepend>
              <v-avatar size="24" color="primary-lighten-4" class="mr-2">
                <span class="text-caption font-weight-bold">{{ member.org.name.charAt(0) }}</span>
              </v-avatar>
            </template>
            <v-list-item-title class="text-body-2">{{ member.org.name }}</v-list-item-title>
            <v-list-item-subtitle style="font-size: 10px;">{{ member.role === 'owner' ? 'Chủ sở hữu' : 'Thành viên' }}</v-list-item-subtitle>
            <template v-slot:append v-if="member.orgId === authStore.user.orgId">
              <v-icon size="x-small" color="primary">mdi-check</v-icon>
            </template>
          </v-list-item>

          <v-divider class="my-2" />
          
          <v-list-item rounded="lg" class="mx-2 mb-1" color="primary" @click="showNewOrgDialog = true">
            <template v-slot:prepend>
              <v-icon size="small" class="mr-2">mdi-plus-circle-outline</v-icon>
            </template>
            <v-list-item-title class="text-body-2 font-weight-bold">Thêm tổ chức mới</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>

      <!-- New Org Dialog -->
      <v-dialog v-model="showNewOrgDialog" max-width="400">
        <v-card class="pa-4 rounded-xl">
          <v-card-title class="text-h6 font-weight-bold">Tạo tổ chức mới</v-card-title>
          <v-card-text class="pa-4">
            <p class="text-body-2 text-medium-emphasis mb-4">Bạn có thể tạo một không gian làm việc riêng biệt cho một công ty hoặc dự án khác.</p>
            <v-text-field
              v-model="newOrgName"
              label="Tên tổ chức / Công ty"
              variant="outlined"
              placeholder="Vd: Apple Inc."
              autofocus
              hide-details="auto"
              rounded="lg"
            />
          </v-card-text>
          <v-card-actions class="pa-4">
            <v-spacer />
            <v-btn variant="text" @click="showNewOrgDialog = false" class="text-none">Hủy</v-btn>
            <v-btn
              color="primary"
              variant="flat"
              class="px-6 text-none"
              rounded="lg"
              :loading="creatingOrg"
              :disabled="!newOrgName.trim()"
              @click="handleCreateOrg"
            >Tạo ngay</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <GlobalSearch class="mx-2" />

      <v-spacer />

      <div class="status-chip d-flex align-center mr-4 px-3 py-1 rounded-pill">
        <span class="status-dot-mini"></span>
        <span class="status-chip__label text-caption font-weight-bold">ONLINE</span>
      </div>

      <span class="text-body-2 mr-3" v-if="authStore.user">{{ authStore.user.fullName }}</span>
      <NotificationBell />
      <v-btn icon variant="text" to="/api-settings" class="mr-1">
        <v-icon>mdi-cog-outline</v-icon>
      </v-btn>
      <v-btn icon variant="text" @click="toggleTheme">
        <v-icon>{{ isDark ? 'mdi-weather-sunny' : 'mdi-weather-night' }}</v-icon>
      </v-btn>
      <v-btn icon variant="text" @click="logout">
        <v-icon>mdi-logout</v-icon>
      </v-btn>
    </v-app-bar>

    <v-navigation-drawer v-model="drawer" :rail="rail" permanent @click="rail = false" color="background" class="border-right">
      <v-list density="compact" nav class="mt-2 sidebar-list">
        <v-list-item
          v-for="item in computedMenuItems"
          :key="item.path"
          :to="item.path"
          :prepend-icon="item.icon"
          :title="item.title"
          :value="item.path"
          rounded="xl"
          class="mb-1 mx-2"
        />
      </v-list>

      <template #append>
        <v-list density="compact" nav>
          <v-list-item
            prepend-icon="mdi-chevron-left"
            title="Thu gọn"
            @click.stop="rail = !rail"
            rounded="xl"
            class="mx-2"
          />
        </v-list>
      </template>
    </v-navigation-drawer>

    <v-main>
      <v-container fluid>
        <slot />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useTheme } from 'vuetify';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
import NotificationBell from '@/components/NotificationBell.vue';
import GlobalSearch from '@/components/GlobalSearch.vue';

const theme = useTheme();
const authStore = useAuthStore();
const router = useRouter();

const drawer = ref(true);
const rail = ref(false);
const isDark = ref(localStorage.getItem('theme') === 'dark');

// New Org Creation
const showNewOrgDialog = ref(false);
const newOrgName = ref('');
const creatingOrg = ref(false);

async function handleCreateOrg() {
  if (!newOrgName.value.trim()) return;
  creatingOrg.value = true;
  try {
    await authStore.createOrg(newOrgName.value.trim());
    showNewOrgDialog.value = false;
    newOrgName.value = '';
  } catch (err) {
    console.error('Failed to create organization:', err);
  } finally {
    creatingOrg.value = false;
  }
}

onMounted(() => {
  theme.global.name.value = isDark.value ? 'dark' : 'light';
});

const menuItems = [
  { title: 'Dashboard', icon: 'mdi-view-dashboard-outline', path: '/' },
  { title: 'Tin nhắn', icon: 'mdi-message-text-outline', path: '/chat' },
  { title: 'Khách hàng', icon: 'mdi-account-group-outline', path: '/contacts' },
  { title: 'Tài khoản Zalo', icon: 'mdi-cellphone-link', path: '/zalo-accounts' },
  { title: 'Lịch hẹn', icon: 'mdi-calendar-clock-outline', path: '/appointments' },
  { title: 'Báo cáo', icon: 'mdi-chart-arc', path: '/reports' },
  { title: 'Phân tích', icon: 'mdi-chart-timeline-variant-shimmer', path: '/analytics' },
  { title: 'Nhân sự & Phân quyền', icon: 'mdi-account-cog-outline', path: '/settings' },
  { title: 'Kết nối & Cấu hình AI', icon: 'mdi-cog-outline', path: '/api-settings' },
  { title: 'Đào tạo AI', icon: 'mdi-school-outline', path: '/ai-training' },
  { title: 'Lịch sử AI', icon: 'mdi-history', path: '/ai-usage' },
  { title: 'Tích hợp', icon: 'mdi-connection', path: '/integrations' },
  { title: 'Automation', icon: 'mdi-robot-outline', path: '/automation' },
  { title: 'Gói cước', icon: 'mdi-crown-outline', path: '/pricing' },
];

const computedMenuItems = computed(() => {
  const items = [...menuItems];
  if (authStore.isSuperAdmin) {
    items.push({ title: 'Hệ thống Quản trị', icon: 'mdi-shield-crown-outline', path: '/admin' });
    items.push({ title: 'Duyệt Thanh Toán', icon: 'mdi-receipt-text-check-outline', path: '/admin/orders' });
  }
  return items;
});

function toggleTheme() {
  isDark.value = !isDark.value;
  theme.global.name.value = isDark.value ? 'dark' : 'light';
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light');
}

function logout() {
  authStore.logout();
  router.push('/login');
}
</script>

<style scoped>
.brand-lockup {
  gap: 12px;
}

.brand-orb {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: var(--gradient-brand);
  box-shadow: var(--glow-brand);
}

.brand-title :deep(.v-toolbar-title__placeholder) {
  display: flex;
  align-items: center;
  gap: 2px;
}

.brand-title__base {
  color: var(--color-text);
  font-weight: 800;
}

.brand-title__mark {
  color: var(--color-primary);
  font-weight: 900;
}

.status-chip {
  background: var(--color-success-soft);
  border: 1px solid var(--color-success-border);
}

.status-dot-mini {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-success);
  display: inline-block;
  margin-right: 8px;
  box-shadow: 0 0 0 4px var(--color-success-soft);
}

.status-chip__label {
  color: var(--color-success);
  letter-spacing: 0.5px;
  font-size: 0.65rem !important;
}
</style>
