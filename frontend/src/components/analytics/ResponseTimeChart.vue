<template>
  <v-card>
    <v-card-title class="text-body-1">Thời gian trả lời trung bình</v-card-title>
    <v-card-text>
      <Line v-if="chartData" :data="chartData" :options="chartOptions" style="height: 250px;" />
      <div v-else class="text-center pa-8 text-grey">Không có dữ liệu</div>
      <div v-if="data?.overall" class="text-caption text-grey mt-2 text-center">
        Trung bình tổng: {{ formatTime(data.overall) }}
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useTheme } from 'vuetify';
import { Line } from 'vue-chartjs';
import { chartTokens, hexToRgba } from '@/theme/ui-tokens';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import type { ResponseTimeData } from '@/composables/use-analytics';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const props = defineProps<{ data: ResponseTimeData | null }>();
const theme = useTheme();

const palette = computed(() => chartTokens[theme.global.current.value.dark ? 'dark' : 'light']);

const chartData = computed(() => {
  if (!props.data?.daily?.length) return null;
  return {
    labels: props.data.daily.map((d) => d.date.slice(5)),
    datasets: [
      {
        label: 'TG trả lời (giây)',
        data: props.data.daily.map((d) => d.avgSeconds),
        borderColor: palette.value.sent,
        backgroundColor: hexToRgba(palette.value.sent, theme.global.current.value.dark ? 0.16 : 0.12),
        fill: true,
        tension: 0.3,
      },
    ],
  };
});

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx: any) => formatTime(ctx.raw),
      },
    },
  },
  scales: {
    x: {
      ticks: { color: palette.value.textSecondary },
      grid: { color: palette.value.grid },
    },
    y: {
      beginAtZero: true,
      title: { display: true, text: 'Giây', color: palette.value.textSecondary },
      ticks: { color: palette.value.textSecondary },
      grid: { color: palette.value.grid },
    },
  },
}));

function formatTime(seconds: number | null): string {
  if (seconds == null) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s} giây`;
  return `${m} phút ${s} giây`;
}
</script>
