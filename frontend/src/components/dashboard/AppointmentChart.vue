<template>
  <v-card class="dashboard-chart-card" elevation="0">
    <v-card-title class="text-body-1 chart-title">Trạng thái lịch hẹn</v-card-title>
    <v-card-text>
      <Pie v-if="chartData" :data="chartData" :options="chartOptions" style="height: 250px;" />
      <div v-else class="text-center pa-8 chart-empty">Không có dữ liệu</div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useTheme } from 'vuetify';
import { Pie } from 'vue-chartjs';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { chartTokens } from '@/theme/ui-tokens';

ChartJS.register(ArcElement, Tooltip, Legend);

const props = defineProps<{
  data: { status: string; _count: { _all: number } | number }[];
}>();

const theme = useTheme();
const palette = computed(() => chartTokens[theme.global.current.value.dark ? 'dark' : 'light']);

const statusLabels: Record<string, string> = {
  scheduled: 'Đã lên lịch',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
  no_show: 'Vắng mặt',
};

const statusColors = computed<Record<string, string>>(() => ({
  scheduled: palette.value.info,
  completed: palette.value.success,
  cancelled: palette.value.neutral,
  no_show: palette.value.danger,
}));

function getCount(item: { _count: { _all: number } | number }): number {
  return typeof item._count === 'number' ? item._count : item._count._all;
}

const chartData = computed(() => {
  if (!props.data?.length) return null;
  return {
    labels: props.data.map((d) => statusLabels[d.status] || d.status),
    datasets: [{
      data: props.data.map((d) => getCount(d)),
      backgroundColor: props.data.map((d) => statusColors.value[d.status] || palette.value.neutral),
      borderWidth: 0,
    }],
  };
});

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right' as const,
      labels: {
        boxWidth: 12,
        color: palette.value.textSecondary,
      },
    },
    tooltip: {
      backgroundColor: palette.value.tooltipBg,
      titleColor: palette.value.tooltipText,
      bodyColor: palette.value.tooltipText,
    },
  },
}));
</script>

<style scoped>
.dashboard-chart-card {
  background: var(--color-surface-elevated) !important;
  border: 1px solid var(--color-border) !important;
  border-radius: 24px !important;
  box-shadow: var(--shadow-sm);
}

.chart-title {
  color: var(--color-text);
}

.chart-empty {
  color: var(--color-text-secondary);
}
</style>
