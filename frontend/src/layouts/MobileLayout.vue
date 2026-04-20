<template>
  <v-app>
    <OfflineIndicator />

    <v-app-bar density="compact" flat>
      <div class="mobile-brand d-flex align-center ml-3">
        <div class="mobile-brand__orb d-flex align-center justify-center">
          <v-icon size="16" color="white">mdi-robot</v-icon>
        </div>
        <span class="font-weight-bold text-body-1">Zalo<span class="mobile-brand__mark">CRM</span></span>
      </div>

      <v-spacer />

      <NotificationBell />
      <v-btn icon size="small" variant="text" @click="toggleTheme">
        <v-icon size="20">{{ isDark ? 'mdi-weather-sunny' : 'mdi-weather-night' }}</v-icon>
      </v-btn>
      <v-btn icon size="small" variant="text" @click="logout">
        <v-icon size="20">mdi-logout</v-icon>
      </v-btn>
    </v-app-bar>

    <v-main>
      <div class="mobile-content">
        <slot />
      </div>
    </v-main>

    <BottomNav />
  </v-app>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useTheme } from 'vuetify';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
import NotificationBell from '@/components/NotificationBell.vue';
import BottomNav from '@/components/BottomNav.vue';
import OfflineIndicator from '@/components/OfflineIndicator.vue';

const theme = useTheme();
const authStore = useAuthStore();
const router = useRouter();
const isDark = ref(localStorage.getItem('theme') === 'dark');

onMounted(() => {
  theme.global.name.value = isDark.value ? 'dark' : 'light';
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
.mobile-brand {
  gap: 8px;
}

.mobile-brand__orb {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: var(--gradient-brand);
  box-shadow: var(--glow-brand);
}

.mobile-brand__mark {
  color: var(--color-primary);
}

.mobile-content {
  padding-bottom: 72px;
}
</style>
