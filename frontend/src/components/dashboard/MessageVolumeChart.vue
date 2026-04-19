<template>
  <v-card class="glass-premium" elevation="0">
    <div class="pa-6">
      <div class="d-flex align-center justify-space-between mb-6">
        <h3 class="text-h6 font-weight-bold text-white">Lưu lượng hội thoại</h3>
        <v-btn-toggle v-model="timeframe" mandatory density="compact" class="theme-toggle">
          <v-btn value="7d" size="small">7 ngày</v-btn>
          <v-btn value="30d" size="small">30 ngày</v-btn>
        </v-btn-toggle>
      </div>
      <div class="chart-container" style="height: 300px;">
        <Bar v-if="chartData" :data="chartData" :options="chartOptions" />
        <div v-else class="d-flex align-center justify-center h-100 text-placeholder">
          <v-icon class="mr-2">mdi-database-off-outline</v-icon>
          Không có dữ liệu
        </div>
      </div>
    </div>
  </v-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { Bar } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const props = defineProps<{
  data: { date: string; sent: number; received: number }[];
}>();

const timeframe = ref('7d');

const chartData = computed(() => {
  if (!props.data?.length) return null;
  return {
    labels: props.data.map(d => d.date.slice(5)), // MM-DD
    datasets: [
      { 
        label: 'Tin nhắn gửi', 
        data: props.data.map(d => d.sent), 
        backgroundColor: '#00F2FF',
        borderRadius: 6,
        barThickness: 10,
      },
      { 
        label: 'Tin nhắn nhận', 
        data: props.data.map(d => d.received), 
        backgroundColor: '#A855F7',
        borderRadius: 6,
        barThickness: 10,
      },
    ],
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { 
    legend: { 
      position: 'top' as const,
      labels: { color: '#94a3b8', boxWidth: 12, usePointStyle: true, padding: 20 }
    },
    tooltip: {
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
      titleColor: '#fff',
      bodyColor: '#fff',
      padding: 12,
      cornerRadius: 12,
    }
  },
  scales: {
    x: { grid: { display: false }, ticks: { color: '#64748b' } },
    y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, border: { dash: [4, 4] }, ticks: { color: '#64748b' } }
  }
};
</script>

<style scoped>
.glass-premium {
  background: rgba(15, 23, 42, 0.6) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  backdrop-filter: blur(12px);
  border-radius: 24px !important;
}

.text-placeholder {
  color: #64748b;
}

:deep(.v-btn-group) {
  background: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
}

:deep(.v-btn--active) {
  background: #00F2FF !important;
  color: #020617 !important;
}
</style>
