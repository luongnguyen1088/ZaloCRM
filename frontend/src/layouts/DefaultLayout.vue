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
          v-for="item in menuItems"
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
            title="Thu gá»n"
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
import { ref, onMounted } from 'vue';
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

onMounted(() => {
  theme.global.name.value = isDark.value ? 'dark' : 'light';
});

const menuItems = [
  { title: 'Dashboard', icon: 'mdi-view-dashboard-outline', path: '/' },
  { title: 'Tin nháº¯n', icon: 'mdi-message-text-outline', path: '/chat' },
  { title: 'KhÃ¡ch hÃ ng', icon: 'mdi-account-group-outline', path: '/contacts' },
  { title: 'TÃ i khoáº£n Zalo', icon: 'mdi-cellphone-link', path: '/zalo-accounts' },
  { title: 'Lá»‹ch háº¹n', icon: 'mdi-calendar-clock-outline', path: '/appointments' },
  { title: 'BÃ¡o cÃ¡o', icon: 'mdi-chart-arc', path: '/reports' },
  { title: 'PhÃ¢n tÃ­ch', icon: 'mdi-chart-timeline-variant-shimmer', path: '/analytics' },
  { title: 'NhÃ¢n sá»± & PhÃ¢n quyá»n', icon: 'mdi-account-cog-outline', path: '/settings' },
  { title: 'Káº¿t ná»‘i & Cáº¥u hÃ¬nh AI', icon: 'mdi-cog-outline', path: '/api-settings' },
  { title: 'ÄÃ o táº¡o AI', icon: 'mdi-school-outline', path: '/ai-training' },
  { title: 'TÃ­ch há»£p', icon: 'mdi-connection', path: '/integrations' },
  { title: 'Automation', icon: 'mdi-robot-outline', path: '/automation' },
  { title: 'GÃ³i cÆ°á»›c', icon: 'mdi-crown-outline', path: '/pricing' },
];

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
  box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.12);
}

.status-chip__label {
  color: var(--color-success);
  letter-spacing: 0.5px;
  font-size: 0.65rem !important;
}
</style>
