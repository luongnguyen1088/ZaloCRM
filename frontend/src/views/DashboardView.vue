<template>
  <div class="dashboard-shell">
    <!-- Header with AI Greeting -->
    <header class="dashboard-header mb-8 entrance-animation">
      <div class="d-flex align-center justify-space-between">
        <div>
          <h1 class="text-h3 font-weight-black text-white mb-1">
            Chào buổi sáng, <span class="text-gradient">{{ authStore.user?.fullName?.split(' ').pop() || 'Admin' }}</span>!
          </h1>
          <p class="text-subtitle-1 text-placeholder">
            Hôm nay hệ thống đã tự động xử lý <span class="text-cyan font-weight-bold">1,240</span> hội thoại mới.
          </p>
        </div>
        <div class="header-actions">
          <v-btn
            variant="flat"
            class="btn-ai-glow mr-4"
            prepend-icon="mdi-sparkles"
            @click="router.push('/automation')"
          >
            Tối ưu bằng AI
          </v-btn>
          <v-btn icon variant="outlined" class="border-glass">
            <v-icon>mdi-filter-variant</v-icon>
          </v-btn>
        </div>
      </div>
    </header>

    <v-progress-linear v-if="loading" indeterminate color="cyan" class="mb-4 rounded-pill" height="2" />

    <!-- Main KPI Grid -->
    <KpiCards :kpi="kpi" class="mb-8 entrance-animation-delay-1" />

    <!-- Analytics Section -->
    <v-row class="mb-8">
      <v-col cols="12" md="8" class="entrance-animation-delay-2">
        <MessageVolumeChart :data="messageVolume" class="h-100" />
      </v-col>
      <v-col cols="12" md="4" class="entrance-animation-delay-2">
        <PipelineChart :data="pipeline" class="h-100" />
      </v-col>
    </v-row>

    <v-row class="entrance-animation-delay-3">
      <v-col cols="12" md="6">
        <SourceChart :data="sources" />
      </v-col>
      <v-col cols="12" md="6">
        <AppointmentChart :data="appointments" />
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import KpiCards from '@/components/dashboard/KpiCards.vue';
import MessageVolumeChart from '@/components/dashboard/MessageVolumeChart.vue';
import PipelineChart from '@/components/dashboard/PipelineChart.vue';
import SourceChart from '@/components/dashboard/SourceChart.vue';
import AppointmentChart from '@/components/dashboard/AppointmentChart.vue';
import { useDashboard } from '@/composables/use-dashboard';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();
const {
  kpi, messageVolume, pipeline, sources, appointments,
  loading, fetchAll,
} = useDashboard();

onMounted(() => fetchAll());
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');

.dashboard-shell {
  font-family: 'Outfit', sans-serif;
  padding: 10px;
}

.text-gradient {
  background: linear-gradient(135deg, #00f2ff, #a855f7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.text-placeholder {
  color: #94a3b8;
}

.text-cyan {
  color: #00f2ff;
}

.entrance-animation {
  animation: fadeInSlideUp 0.8s ease-out forwards;
}

.entrance-animation-delay-1 { animation: fadeInSlideUp 0.8s ease-out 0.1s forwards; opacity: 0; }
.entrance-animation-delay-2 { animation: fadeInSlideUp 0.8s ease-out 0.2s forwards; opacity: 0; }
.entrance-animation-delay-3 { animation: fadeInSlideUp 0.8s ease-out 0.3s forwards; opacity: 0; }

@keyframes fadeInSlideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.btn-ai-glow {
  background: linear-gradient(135deg, #00f2ff, #7c3aed) !important;
  color: #fff !important;
  font-weight: 700 !important;
  text-transform: none !important;
  border-radius: 12px !important;
  box-shadow: 0 0 20px rgba(0, 242, 255, 0.2);
}

.border-glass {
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  color: #fff !important;
}
</style>
