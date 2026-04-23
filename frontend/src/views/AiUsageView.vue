<template>
  <v-container fluid class="pa-6 fill-height d-flex flex-column">
    <!-- Header -->
    <div class="d-flex align-center mb-6 flex-shrink-0">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1 gradient-text">Lịch sử AI Credit</h1>
        <p class="text-medium-emphasis mb-0">Theo dõi chi tiết lượng token và credit đã tiêu thụ</p>
      </div>
      <v-spacer />
      <v-btn
        variant="tonal"
        color="primary"
        prepend-icon="mdi-download"
        rounded="xl"
        class="mr-2"
        @click="exportCSV"
      >
        Xuất CSV
      </v-btn>
      <v-btn variant="outlined" color="primary" prepend-icon="mdi-refresh" rounded="xl" @click="loadData" :loading="loading">
        Làm mới
      </v-btn>
    </div>

    <!-- Summary Cards -->
    <v-row class="mb-6 flex-shrink-0">
      <v-col cols="12" md="3">
        <v-card class="glass-card usage-summary-card h-100" elevation="0">
          <div class="pa-5 d-flex align-center">
            <v-avatar color="primary-lighten-4" size="48" class="mr-4">
              <v-icon color="primary" size="24">mdi-coin</v-icon>
            </v-avatar>
            <div>
              <div class="text-overline opacity-70">Số dư hiện tại</div>
              <div class="text-h5 font-weight-bold primary--text">{{ usageData?.remainingCredits?.toFixed(2) || '0.00' }}</div>
              <div class="text-caption">Đã dùng {{ usageData?.usedCredits?.toFixed(2) || '0' }} / {{ usageData?.maxCredits || '0' }}</div>
            </div>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card class="glass-card usage-summary-card h-100" elevation="0">
          <div class="pa-5 d-flex align-center">
            <v-avatar color="info-lighten-4" size="48" class="mr-4">
              <v-icon color="info" size="24">mdi-text-box-multiple-outline</v-icon>
            </v-avatar>
            <div>
              <div class="text-overline opacity-70">Tổng Token (Tháng)</div>
              <div class="text-h5 font-weight-bold info--text">{{ formatNumber(monthlyTokens) }}</div>
              <div class="text-caption">{{ formatNumber(monthlyInputTokens) }} In / {{ formatNumber(monthlyOutputTokens) }} Out</div>
            </div>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card class="glass-card usage-summary-card h-100" elevation="0">
          <div class="pa-5 d-flex align-center">
            <v-avatar color="success-lighten-4" size="48" class="mr-4">
              <v-icon color="success" size="24">mdi-package-variant-closed</v-icon>
            </v-avatar>
            <div>
              <div class="text-overline opacity-70">Gói cước</div>
              <div class="text-h6 font-weight-bold success--text">{{ usageData?.planName || 'Free' }}</div>
              <div class="text-caption">Hết hạn: {{ formatDate(usageData?.periodEnd) }}</div>
            </div>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card class="glass-card usage-summary-card h-100" elevation="0">
          <div class="pa-5 d-flex align-center">
            <v-avatar color="warning-lighten-4" size="48" class="mr-4">
              <v-icon color="warning" size="24">mdi-trending-up</v-icon>
            </v-avatar>
            <div>
              <div class="text-overline opacity-70">Hiệu suất Token</div>
              <div class="text-h6 font-weight-bold warning--text">~{{ avgTokensPerCredit.toFixed(0) }} T/C</div>
              <div class="text-caption">Trung bình tokens mỗi credit</div>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Charts and Filters -->
    <v-row class="mb-6 flex-shrink-0">
      <v-col cols="12" md="8">
        <v-card class="glass-container pa-4" elevation="0" style="height: 300px;">
          <div class="d-flex align-center mb-4">
            <span class="text-subtitle-1 font-weight-bold">Biểu đồ tiêu thụ (7 ngày qua)</span>
            <v-spacer />
            <v-btn-toggle v-model="chartType" mandatory density="compact" color="primary" variant="tonal">
              <v-btn value="tokens" size="small">Tokens</v-btn>
              <v-btn value="credits" size="small">Credits</v-btn>
            </v-btn-toggle>
          </div>
          <div class="chart-container" style="height: 200px;">
            <Line v-if="chartData" :data="chartData" :options="chartOptions" />
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card class="glass-container pa-4 h-100" elevation="0">
          <span class="text-subtitle-1 font-weight-bold mb-4 d-block">Bộ lọc & Tìm kiếm</span>
          <v-text-field
            v-model="search"
            prepend-inner-icon="mdi-magnify"
            label="Tìm kiếm model, tính năng..."
            variant="outlined"
            density="compact"
            hide-details
            class="mb-3"
            rounded="lg"
          ></v-text-field>
          <v-select
            v-model="filterFeature"
            :items="featureOptions"
            label="Tính năng"
            variant="outlined"
            density="compact"
            hide-details
            class="mb-3"
            rounded="lg"
          ></v-select>
          <v-select
            v-model="filterModel"
            :items="modelOptions"
            label="Model"
            variant="outlined"
            density="compact"
            hide-details
            rounded="lg"
          ></v-select>
        </v-card>
      </v-col>
    </v-row>

    <v-card class="glass-container flex-grow-1 d-flex flex-column overflow-hidden" elevation="0">
      <div class="pa-4 flex-grow-1 overflow-hidden d-flex flex-column">
        <div class="d-flex align-center mb-4 px-2">
          <div class="text-subtitle-2 opacity-70">
            Hiển thị <strong>{{ filteredHistory.length }}</strong> bản ghi
            <span v-if="filteredHistory.length > 0">
              - Tổng cộng <strong>{{ formatNumber(totalFilteredTokens) }}</strong> Tokens
              và <strong>{{ totalFilteredCredits.toFixed(2) }}</strong> Credits
            </span>
          </div>
        </div>
        <v-data-table
          :headers="headers"
          :items="filteredHistory"
          :loading="loading"
          class="usage-table flex-grow-1 custom-scrollbar"
          hover
          fixed-header
        >
          <template v-slot:item.feature="{ item }">
            <div class="d-flex align-center">
              <v-icon size="18" class="mr-2" :color="getFeatureColor(item.feature)">
                {{ getFeatureIcon(item.feature) }}
              </v-icon>
              <span class="text-capitalize">{{ formatFeature(item.feature) }}</span>
            </div>
          </template>

          <template v-slot:item.model="{ item }">
            <v-chip size="x-small" variant="tonal" :color="getProviderColor(item.provider)" class="font-weight-bold">
              {{ item.provider }}: {{ item.model }}
            </v-chip>
          </template>

          <template v-slot:item.tokens="{ item }">
            <div class="text-caption">
              <div class="d-flex justify-space-between" style="width: 100px">
                <span class="opacity-60">In:</span>
                <span>{{ item.inputTokens || 0 }}</span>
              </div>
              <div class="d-flex justify-space-between" style="width: 100px">
                <span class="opacity-60">Out:</span>
                <span>{{ item.outputTokens || 0 }}</span>
              </div>
            </div>
          </template>

          <template v-slot:item.credits="{ item }">
            <div class="d-flex align-center font-weight-bold error--text">
              -{{ item.credits?.toFixed(2) }}
              <v-icon size="14" class="ml-1">mdi-coin</v-icon>
            </div>
          </template>

          <template v-slot:item.createdAt="{ item }">
            <div class="text-caption opacity-70">
              {{ formatDateTime(item.createdAt) }}
            </div>
          </template>

          <template v-slot:no-data>
            <div class="py-12 text-center opacity-40">
              <v-icon size="64" class="mb-4">mdi-history-off</v-icon>
              <div class="text-h6">Chưa có lịch sử sử dụng</div>
            </div>
          </template>
        </v-data-table>
      </div>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { api } from '@/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'vue-chartjs';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface AiUsageRecord {
  id: string;
  feature: string;
  provider: string;
  model: string;
  credits: number;
  inputTokens: number;
  outputTokens: number;
  createdAt: string;
}

const loading = ref(true);
const history = ref<AiUsageRecord[]>([]);
const usageData = ref<any>(null);

const headers = [
  { title: 'TÍNH NĂNG', key: 'feature', align: 'start' as const, width: '200px' },
  { title: 'MODEL', key: 'model', width: '250px' },
  { title: 'TOKEN (IN/OUT)', key: 'tokens', sortable: false, width: '150px' },
  { title: 'CREDIT', key: 'credits', align: 'end' as const, width: '120px' },
  { title: 'THỜI GIAN', key: 'createdAt', align: 'end' as const, width: '180px' },
];

const search = ref('');
const filterFeature = ref('Tất cả');
const filterModel = ref('Tất cả');
const chartType = ref<'tokens' | 'credits'>('tokens');

// Computed filters
const filteredHistory = computed(() => {
  return history.value.filter(item => {
    const matchesSearch = !search.value ||
      item.model.toLowerCase().includes(search.value.toLowerCase()) ||
      formatFeature(item.feature).toLowerCase().includes(search.value.toLowerCase());

    const matchesFeature = filterFeature.value === 'Tất cả' || item.feature === filterFeature.value;
    const matchesModel = filterModel.value === 'Tất cả' || item.model === filterModel.value;

    return matchesSearch && matchesFeature && matchesModel;
  });
});

const featureOptions = computed(() => {
  const features = new Set(history.value.map(i => i.feature));
  return ['Tất cả', ...Array.from(features)];
});

const modelOptions = computed(() => {
  const models = new Set(history.value.map(i => i.model));
  return ['Tất cả', ...Array.from(models)];
});

// Statistics
const totalFilteredTokens = computed(() =>
  filteredHistory.value.reduce((acc, curr) => acc + (curr.inputTokens || 0) + (curr.outputTokens || 0), 0)
);

const totalFilteredCredits = computed(() =>
  filteredHistory.value.reduce((acc, curr) => acc + (curr.credits || 0), 0)
);

const monthlyTokens = computed(() =>
  history.value.reduce((acc, curr) => acc + (curr.inputTokens || 0) + (curr.outputTokens || 0), 0)
);

const monthlyInputTokens = computed(() =>
  history.value.reduce((acc, curr) => acc + (curr.inputTokens || 0), 0)
);

const monthlyOutputTokens = computed(() =>
  history.value.reduce((acc, curr) => acc + (curr.outputTokens || 0), 0)
);

const avgTokensPerCredit = computed(() => {
  const totalCredits = history.value.reduce((acc, curr) => acc + (curr.credits || 0), 0);
  if (totalCredits === 0) return 0;
  return monthlyTokens.value / totalCredits;
});

// Chart data
const chartData = computed(() => {
  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const dataByDay = last7Days.map(date => {
    const items = history.value.filter(i => i.createdAt.startsWith(date));
    if (chartType.value === 'tokens') {
      return items.reduce((acc, curr) => acc + (curr.inputTokens || 0) + (curr.outputTokens || 0), 0);
    } else {
      return items.reduce((acc, curr) => acc + (curr.credits || 0), 0);
    }
  });

  return {
    labels: last7Days.map(d => {
      const parts = d.split('-');
      return `${parts[2]}/${parts[1]}`;
    }),
    datasets: [{
      label: chartType.value === 'tokens' ? 'Tokens' : 'Credits',
      data: dataByDay,
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99, 102, 241, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointHoverRadius: 6,
    }]
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      mode: 'index' as const,
      intersect: false,
      padding: 12,
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
      titleFont: { size: 13, weight: 'bold' as const },
      bodyFont: { size: 12 },
    }
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: 'rgba(255, 255, 255, 0.5)', font: { size: 10 } }
    },
    y: {
      beginAtZero: true,
      grid: { color: 'rgba(255, 255, 255, 0.05)' },
      ticks: { color: 'rgba(255, 255, 255, 0.5)', font: { size: 10 } }
    }
  }
};

async function loadData() {
  loading.value = true;
  try {
    const [usageRes, historyRes] = await Promise.all([
      api.get('/ai/usage'),
      api.get('/ai/usage/history')
    ]);
    usageData.value = usageRes.data;
    history.value = historyRes.data;
  } catch (err) {
    console.error('Failed to load AI usage data:', err);
  } finally {
    loading.value = false;
  }
}

function formatDate(dateStr: string) {
  if (!dateStr) return '...';
  return new Date(dateStr).toLocaleDateString('vi-VN');
}

function formatDateTime(dateStr: string) {
  if (!dateStr) return '...';
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN') + ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function formatFeature(f: string) {
  const map: any = {
    'reply_draft': 'Soạn câu trả lời',
    'summary': 'Tóm tắt hội thoại',
    'sentiment': 'Phân tích cảm xúc',
    'categorize': 'Phân loại tri thức',
    'translate': 'Dịch thuật',
    'expand': 'Mở rộng ý',
  };
  return map[f] || f;
}

function formatNumber(num: number) {
  if (!num) return '0';
  return new Intl.NumberFormat('vi-VN').format(Math.round(num));
}

function exportCSV() {
  const headers = ['Tính năng', 'Model', 'Provider', 'Input Tokens', 'Output Tokens', 'Credits', 'Thời gian'];
  const rows = filteredHistory.value.map(item => [
    formatFeature(item.feature),
    item.model,
    item.provider,
    item.inputTokens,
    item.outputTokens,
    item.credits,
    formatDateTime(item.createdAt)
  ]);

  const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `ai_usage_history_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function getFeatureIcon(f: string) {
  const map: any = {
    'reply_draft': 'mdi-chat-processing-outline',
    'summary': 'mdi-text-box-search-outline',
    'sentiment': 'mdi-emoticon-outline',
    'categorize': 'mdi-tag-outline',
  };
  return map[f] || 'mdi-auto-fix';
}

function getFeatureColor(f: string) {
  const map: any = {
    'reply_draft': 'primary',
    'summary': 'info',
    'sentiment': 'warning',
    'categorize': 'success',
  };
  return map[f] || 'grey';
}

function getProviderColor(p: string) {
  const map: any = {
    'openai': 'success',
    'anthropic': 'warning',
    'gemini': 'primary',
    'google': 'primary',
    'mistral': 'error',
    'deepseek': 'info',
  };
  return map[p?.toLowerCase()] || 'secondary';
}

onMounted(loadData);
</script>

<style scoped>
.gradient-text {
  background: var(--gradient-brand);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.glass-card {
  background: var(--color-surface) !important;
  border: 1px solid var(--color-border) !important;
  border-radius: 16px !important;
  transition: transform 0.2s ease;
}

.usage-summary-card:hover {
  transform: translateY(-4px);
}

.glass-container {
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  backdrop-filter: blur(16px);
}

.usage-table :deep(.v-table__wrapper) {
  background: transparent !important;
}

.usage-table :deep(th) {
  background: var(--color-surface-elevated) !important;
  font-size: 11px !important;
  font-weight: 800 !important;
  color: var(--color-text-secondary) !important;
  letter-spacing: 0.5px;
}

.primary--text { color: var(--color-primary); }
.success--text { color: var(--color-success); }
.error--text { color: var(--color-error); }

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: var(--color-primary-soft-strong);
  border-radius: 10px;
}
</style>
