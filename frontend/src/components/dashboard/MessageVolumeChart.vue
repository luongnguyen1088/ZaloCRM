<template>
  <v-card class="glass-premium" elevation="0">
    <div class="pa-6">
      <div class="d-flex align-center justify-space-between mb-6">
        <h3 class="text-h6 font-weight-bold chart-title">Lưu lượng hội thoại</h3>
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
import { useTheme } from 'vuetify';
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
import { chartTokens } from '@/theme/ui-tokens';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const props = defineProps<{
  data: { date: string; sent: number; received: number }[];
}>();

const timeframe = ref('7d');
const theme = useTheme();
const palette = computed(() => chartTokens[theme.global.current.value.dark ? 'dark' : 'light']);

const chartData = computed(() => {
  if (!props.data?.length) return null;
  return {
    labels: props.data.map((d) => d.date.slice(5)),
    datasets: [
      {
        label: 'Tin nhắn gửi',
        data: props.data.map((d) => d.sent),
        backgroundColor: palette.value.sent,
        borderRadius: 6,
        barThickness: 10,
      },
      {
        label: 'Tin nhắn nhận',
        data: props.data.map((d) => d.received),
        backgroundColor: palette.value.received,
        borderRadius: 6,
        barThickness: 10,
      },
    ],
  };
});

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        color: palette.value.textMuted,
        boxWidth: 12,
        usePointStyle: true,
        padding: 20,
      },
    },
    tooltip: {
      backgroundColor: palette.value.tooltipBg,
      titleColor: palette.value.tooltipText,
      bodyColor: palette.value.tooltipText,
      padding: 12,
      cornerRadius: 12,
    },
  },
  scales: {
    x: { grid: { display: false }, ticks: { color: palette.value.textSecondary } },
    y: { grid: { color: palette.value.grid }, border: { dash: [4, 4] }, ticks: { color: palette.value.textSecondary } },
  },
}));
</script>

<style scoped>
.glass-premium {
  background: var(--color-surface-elevated) !important;
  border: 1px solid var(--color-border) !important;
  backdrop-filter: blur(12px);
  border-radius: 24px !important;
  box-shadow: var(--shadow-sm);
}

.chart-title {
  color: var(--color-text);
}

.text-placeholder {
  color: var(--color-text-secondary);
}

:deep(.v-btn-group) {
  background: var(--color-overlay) !important;
  border: 1px solid var(--color-border);
  border-radius: 8px;
}

:deep(.v-btn--active) {
  background: var(--color-primary) !important;
  color: var(--color-text-inverse) !important;
}
</style>
