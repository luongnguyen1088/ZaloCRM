<template>
  <v-card>
    <v-card-title class="text-body-1">{{ title }}</v-card-title>
    <v-card-text>
      <Line v-if="chartData" :data="chartData" :options="chartOptions" style="height: 220px;" />
      <div v-else class="text-center pa-8 text-grey">Không có dữ liệu</div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useTheme } from 'vuetify';
import { Line } from 'vue-chartjs';
import { chartTokens } from '@/theme/ui-tokens';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const props = defineProps<{
  title: string;
  currentWeek: { date: string; value: number }[];
  previousWeek: { date: string; value: number }[];
}>();

const theme = useTheme();
const dayLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

const palette = computed(() => chartTokens[theme.global.current.value.dark ? 'dark' : 'light']);

const chartData = computed(() => {
  if (!props.currentWeek?.length && !props.previousWeek?.length) return null;
  const labels = props.currentWeek?.length
    ? props.currentWeek.map((_, i) => dayLabels[i] ?? `D${i + 1}`)
    : dayLabels;
  return {
    labels,
    datasets: [
      {
        label: 'Tuần này',
        data: props.currentWeek?.map((d) => d.value) ?? [],
        borderColor: palette.value.sent,
        backgroundColor: palette.value.sent,
        tension: 0.3,
      },
      {
        label: 'Tuần trước',
        data: props.previousWeek?.map((d) => d.value) ?? [],
        borderColor: palette.value.neutral,
        backgroundColor: palette.value.neutral,
        borderDash: [5, 5],
        tension: 0.3,
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
        color: palette.value.textSecondary,
      },
    },
  },
  scales: {
    x: {
      ticks: { color: palette.value.textSecondary },
      grid: { color: palette.value.grid },
    },
    y: {
      ticks: { color: palette.value.textSecondary },
      grid: { color: palette.value.grid },
    },
  },
}));
</script>
