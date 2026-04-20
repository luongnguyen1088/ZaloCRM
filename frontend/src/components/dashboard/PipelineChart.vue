<template>
  <v-card class="dashboard-chart-card" elevation="0">
    <v-card-title class="text-body-1 chart-title">Pipeline khách hàng</v-card-title>
    <v-card-text>
      <Doughnut v-if="chartData" :data="chartData" :options="chartOptions" style="height: 250px;" />
      <div v-else class="text-center pa-8 chart-empty">Không có dữ liệu</div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useTheme } from 'vuetify';
import { Doughnut } from 'vue-chartjs';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { chartTokens } from '@/theme/ui-tokens';

ChartJS.register(ArcElement, Tooltip, Legend);

const props = defineProps<{
  data: { status: string | null; _count: { _all: number } | number }[];
}>();

const theme = useTheme();
const palette = computed(() => chartTokens[theme.global.current.value.dark ? 'dark' : 'light']);

const statusLabels: Record<string, string> = {
  new: 'Mới',
  contacted: '�� li�n h?',
  interested: 'Quan t�m',
  converted: 'Chuyển đổi',
  lost: 'Mất',
};

const statusColors = computed<Record<string, string>>(() => ({
  new: palette.value.neutral,
  contacted: palette.value.info,
  interested: palette.value.warning,
  converted: palette.value.success,
  lost: palette.value.danger,
}));

function getCount(item: { _count: { _all: number } | number }): number {
  return typeof item._count === 'number' ? item._count : item._count._all;
}

const chartData = computed(() => {
  if (!props.data?.length) return null;
  const filtered = props.data.filter((d) => d.status);
  if (!filtered.length) return null;
  return {
    labels: filtered.map((d) => statusLabels[d.status || ''] || d.status),
    datasets: [{
      data: filtered.map((d) => getCount(d)),
      backgroundColor: filtered.map((d) => statusColors.value[d.status || ''] || palette.value.neutral),
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
