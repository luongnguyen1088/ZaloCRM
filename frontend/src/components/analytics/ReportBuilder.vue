<template>
  <v-card>
    <v-card-title class="text-body-1">BÃ¡o cÃ¡o tÃ¹y chá»‰nh</v-card-title>
    <v-card-text>
      <v-row>
        <v-col cols="12" md="5">
          <v-select
            v-model="selectedMetrics"
            :items="metricOptions"
            label="Chá»‰ sá»‘"
            multiple
            chips
            closable-chips
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-col>
        <v-col cols="12" md="3">
          <v-select
            v-model="groupBy"
            :items="groupByOptions"
            label="NhÃ³m theo"
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-col>
        <v-col cols="12" md="2">
          <v-select
            v-model="filterSource"
            :items="sourceOptions"
            label="Nguá»“n"
            clearable
            density="compact"
            variant="outlined"
            hide-details
          />
        </v-col>
        <v-col cols="12" md="2" class="d-flex gap-2">
          <v-btn color="primary" :loading="loading" :disabled="!selectedMetrics.length" @click="run">
            Cháº¡y
          </v-btn>
          <v-btn variant="outlined" :disabled="!selectedMetrics.length" @click="saveDialog = true">
            LÆ°u
          </v-btn>
        </v-col>
      </v-row>

      <div v-if="result" class="mt-4">
        <Bar :data="resultChartData!" :options="chartOptions" style="height: 300px;" />
      </div>

      <div v-if="savedReports.length" class="mt-6">
        <div class="text-subtitle-2 mb-2">BÃ¡o cÃ¡o Ä‘Ã£ lÆ°u</div>
        <v-list density="compact">
          <v-list-item v-for="r in savedReports" :key="r.id" :title="r.name" :subtitle="r.type">
            <template #append>
              <v-btn icon="mdi-play" size="small" variant="text" @click="$emit('runSaved', r)" />
              <v-btn icon="mdi-delete" size="small" variant="text" color="error" @click="$emit('deleteSaved', r.id)" />
            </template>
          </v-list-item>
        </v-list>
      </div>
    </v-card-text>

    <v-dialog v-model="saveDialog" max-width="400">
      <v-card>
        <v-card-title>LÆ°u bÃ¡o cÃ¡o</v-card-title>
        <v-card-text>
          <v-text-field v-model="reportName" label="TÃªn bÃ¡o cÃ¡o" variant="outlined" density="compact" hide-details />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="saveDialog = false">Há»§y</v-btn>
          <v-btn color="primary" :disabled="!reportName" @click="save">LÆ°u</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useTheme } from 'vuetify';
import { Bar } from 'vue-chartjs';
import { chartTokens } from '@/theme/ui-tokens';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import type { CustomReportResult, SavedReport, ReportConfig } from '@/composables/use-analytics';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const props = defineProps<{
  result: CustomReportResult | null;
  savedReports: SavedReport[];
  loading: boolean;
  dateFrom: string;
  dateTo: string;
}>();

const emit = defineEmits<{
  run: [config: ReportConfig];
  save: [data: { name: string; type: string; config: ReportConfig }];
  runSaved: [report: SavedReport];
  deleteSaved: [id: string];
}>();

const theme = useTheme();
const palette = computed(() => chartTokens[theme.global.current.value.dark ? 'dark' : 'light']);
const selectedMetrics = ref<string[]>([]);
const groupBy = ref('day');
const filterSource = ref<string | null>(null);
const saveDialog = ref(false);
const reportName = ref('');

const metricOptions = [
  { title: 'Tin nháº¯n gá»­i', value: 'messages_sent' },
  { title: 'Tin nháº¯n nháº­n', value: 'messages_received' },
  { title: 'KH má»›i', value: 'contacts_new' },
  { title: 'KH chuyá»ƒn Ä‘á»•i', value: 'contacts_converted' },
  { title: 'Lá»‹ch háº¹n', value: 'appointments' },
  { title: 'TG tráº£ lá»i TB', value: 'avg_response_time' },
];

const groupByOptions = [
  { title: 'Theo ngÃ y', value: 'day' },
  { title: 'Theo tuáº§n', value: 'week' },
  { title: 'Theo thÃ¡ng', value: 'month' },
  { title: 'Theo nhÃ¢n viÃªn', value: 'user' },
  { title: 'Theo nguá»“n', value: 'source' },
];

const sourceOptions = ['FB', 'TT', 'GT', 'CN', 'ZL'];

const datasetColors = computed(() => [
  palette.value.sent,
  palette.value.success,
  palette.value.warning,
  palette.value.danger,
  palette.value.received,
  palette.value.info,
]);

function buildConfig(): ReportConfig {
  return {
    metrics: selectedMetrics.value,
    groupBy: groupBy.value,
    dateRange: { from: props.dateFrom, to: props.dateTo },
    filters: filterSource.value ? { source: filterSource.value } : undefined,
  };
}

function run() {
  emit('run', buildConfig());
}

function save() {
  emit('save', { name: reportName.value, type: 'custom', config: buildConfig() });
  saveDialog.value = false;
  reportName.value = '';
}

const metricLabels: Record<string, string> = {
  messages_sent: 'Tin nháº¯n gá»­i',
  messages_received: 'Tin nháº¯n nháº­n',
  contacts_new: 'KH má»›i',
  contacts_converted: 'KH chuyá»ƒn Ä‘á»•i',
  appointments: 'Lá»‹ch háº¹n',
  avg_response_time: 'TG tráº£ lá»i (s)',
};

const resultChartData = computed(() => {
  if (!props.result) return null;
  return {
    labels: props.result.labels,
    datasets: props.result.datasets.map((ds, i) => ({
      label: metricLabels[ds.metric] ?? ds.metric,
      data: ds.data,
      backgroundColor: datasetColors.value[i % datasetColors.value.length],
    })),
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
      beginAtZero: true,
      ticks: { color: palette.value.textSecondary },
      grid: { color: palette.value.grid },
    },
  },
}));
</script>
