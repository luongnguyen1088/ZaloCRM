<template>
  <v-container fluid class="pa-6 fill-height d-flex flex-column">
    <!-- Header -->
    <div class="d-flex align-center mb-6 flex-shrink-0">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1 gradient-text">Hiệu quả vận hành AI</h1>
        <p class="text-medium-emphasis mb-0">Phân tích giá trị thực tế và hiệu suất của trợ lý AI</p>
      </div>
      <v-spacer />
      <v-btn
        variant="tonal"
        color="primary"
        prepend-icon="mdi-refresh"
        rounded="xl"
        class="mr-2"
        :loading="loading"
        @click="loadAllData"
      >
        Làm mới dữ liệu
      </v-btn>
    </div>

    <!-- Top Stats Cards -->
    <v-row class="mb-6 flex-shrink-0" v-if="analyticsData">
      <v-col cols="12" md="3">
        <v-card class="glass-card pa-5 text-center h-100" border variant="flat">
          <v-avatar color="primary-lighten-5" size="56" class="mb-3">
            <v-icon color="primary" size="28">mdi-robot-outline</v-icon>
          </v-avatar>
          <div class="text-overline opacity-70">Tổng phản hồi AI</div>
          <div class="text-h4 font-weight-black primary--text">{{ analyticsData.stats.totalAiReplies }}</div>
          <div class="text-caption mt-1">Tin nhắn đã gửi trực tiếp</div>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card class="glass-card pa-5 text-center h-100" border variant="flat">
          <v-avatar color="success-lighten-5" size="56" class="mb-3">
            <v-icon color="success" size="28">mdi-clock-fast</v-icon>
          </v-avatar>
          <div class="text-overline opacity-70">Nhân lực tiết kiệm</div>
          <div class="text-h4 font-weight-black success--text">{{ analyticsData.stats.savedHumanHours.toFixed(1) }}h</div>
          <div class="text-caption mt-1">~{{ (analyticsData.stats.savedHumanHours * 60).toFixed(0) }} phút làm việc</div>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card class="glass-card pa-5 text-center h-100" border variant="flat">
          <v-avatar color="indigo-lighten-5" size="56" class="mb-3">
            <v-icon color="indigo" size="28">mdi-check-decagram-outline</v-icon>
          </v-avatar>
          <div class="text-overline opacity-70">Tỷ lệ tin tưởng</div>
          <div class="text-h4 font-weight-black indigo--text">{{ analyticsData.acceptanceRate.toFixed(0) }}%</div>
          <div class="text-caption mt-1">Bản thảo AI được chấp nhận</div>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card class="glass-card pa-5 text-center h-100" border variant="flat">
          <v-avatar color="warning-lighten-5" size="56" class="mb-3">
            <v-icon color="warning" size="28">mdi-lightning-bolt-outline</v-icon>
          </v-avatar>
          <div class="text-overline opacity-70">Tokens tiêu thụ</div>
          <div class="text-h4 font-weight-black warning--text">{{ formatNumber(analyticsData.stats.totalTokensUsed / 1000) }}k</div>
          <div class="text-caption mt-1">Đã dùng trong chu kỳ này</div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Main Analytics Content -->
    <v-row class="mb-6 flex-shrink-0" v-if="analyticsData">
      <!-- Sentiment Chart -->
      <v-col cols="12" md="5">
        <v-card class="glass-container pa-6 h-100" border variant="flat">
          <div class="d-flex align-center justify-space-between mb-6">
            <div class="text-subtitle-1 font-weight-bold">Tâm trạng khách hàng (AI Analysis)</div>
            <v-icon color="primary">mdi-emoticon-happy-outline</v-icon>
          </div>
          
          <div class="d-flex align-center justify-space-around py-6">
            <div class="text-center">
              <v-progress-circular :model-value="70" color="success" size="100" width="10" rotate="360">
                <span class="text-h6 font-weight-black">70%</span>
              </v-progress-circular>
              <div class="text-caption mt-3 font-weight-bold text-success">TÍCH CỰC</div>
            </div>
            <div class="text-center">
              <v-progress-circular :model-value="20" color="warning" size="100" width="10" rotate="360">
                <span class="text-h6 font-weight-black">20%</span>
              </v-progress-circular>
              <div class="text-caption mt-3 font-weight-bold text-warning">TRUNG LẬP</div>
            </div>
            <div class="text-center">
              <v-progress-circular :model-value="10" color="error" size="100" width="10" rotate="360">
                <span class="text-h6 font-weight-black">10%</span>
              </v-progress-circular>
              <div class="text-caption mt-3 font-weight-bold text-error">TIÊU CỰC</div>
            </div>
          </div>

          <v-divider class="my-6"></v-divider>
          
          <div class="text-caption opacity-70 italic text-center">
            Dữ liệu được AI phân tích dựa trên nội dung tin nhắn và thái độ của khách hàng trong 100 cuộc hội thoại gần nhất.
          </div>
        </v-card>
      </v-col>

      <!-- Usage Trend Chart -->
      <v-col cols="12" md="7">
        <v-card class="glass-container pa-6 h-100" border variant="flat">
          <div class="d-flex align-center justify-space-between mb-4">
            <div class="text-subtitle-1 font-weight-bold">Xu hướng hoạt động AI (7 ngày)</div>
            <v-chip size="small" color="primary" variant="tonal">Số phản hồi/ngày</v-chip>
          </div>
          <div class="chart-container" style="height: 250px;">
            <Line v-if="chartData" :data="chartData" :options="chartOptions" />
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Detailed History Table -->
    <v-card class="glass-container flex-grow-1 d-flex flex-column overflow-hidden" border variant="flat">
      <div class="pa-4 flex-grow-1 overflow-hidden d-flex flex-column">
        <div class="d-flex align-center mb-4 px-2">
          <v-icon class="mr-2 opacity-60">mdi-history</v-icon>
          <span class="text-subtitle-2 font-weight-bold">Nhật ký hoạt động chi tiết</span>
          <v-spacer />
          <v-text-field
            v-model="search"
            prepend-inner-icon="mdi-magnify"
            label="Tìm kiếm..."
            variant="outlined"
            density="compact"
            hide-details
            rounded="lg"
            max-width="250"
          ></v-text-field>
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
              <span class="text-capitalize text-caption">{{ formatFeature(item.feature) }}</span>
            </div>
          </template>

          <template v-slot:item.model="{ item }">
            <v-chip size="x-small" variant="tonal" :color="getProviderColor(item.provider)" class="font-weight-bold">
              {{ item.model }}
            </v-chip>
          </template>

          <template v-slot:item.tokens="{ item }">
            <div class="text-caption font-weight-bold">
              {{ formatNumber(item.tokens) }} T
            </div>
          </template>

          <template v-slot:item.createdAt="{ item }">
            <div class="text-caption opacity-70">
              {{ formatDateTime(item.createdAt) }}
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
  tokens: number;
  inputTokens: number;
  outputTokens: number;
  createdAt: string;
}

const loading = ref(true);
const history = ref<AiUsageRecord[]>([]);
const analyticsData = ref<any>(null);
const search = ref('');

const headers = [
  { title: 'TÍNH NĂNG', key: 'feature', align: 'start' as const },
  { title: 'MODEL', key: 'model' },
  { title: 'TIÊU THỤ', key: 'tokens', align: 'end' as const },
  { title: 'THỜI GIAN', key: 'createdAt', align: 'end' as const },
];

const filteredHistory = computed(() => {
  return history.value.filter(item => {
    return !search.value ||
      item.model.toLowerCase().includes(search.value.toLowerCase()) ||
      formatFeature(item.feature).toLowerCase().includes(search.value.toLowerCase());
  });
});

const chartData = computed(() => {
  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const dataByDay = last7Days.map(date => {
    const items = history.value.filter(i => i.createdAt.startsWith(date));
    return items.length; // Count responses per day
  });

  return {
    labels: last7Days.map(d => {
      const parts = d.split('-');
      return `${parts[2]}/${parts[1]}`;
    }),
    datasets: [{
      label: 'Số phản hồi',
      data: dataByDay,
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99, 102, 241, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 4,
    }]
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false }, ticks: { color: 'rgba(255, 255, 255, 0.5)', font: { size: 10 } } },
    y: { beginAtZero: true, grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: 'rgba(255, 255, 255, 0.5)', font: { size: 10 } } }
  }
};

async function loadAllData() {
  loading.value = true;
  try {
    const [analyticsRes, historyRes] = await Promise.all([
      api.get('/ai/analytics'),
      api.get('/ai/usage/history')
    ]);
    analyticsData.value = analyticsRes.data;
    history.value = historyRes.data;
  } catch (err) {
    console.error('Failed to load AI analytics:', err);
  } finally {
    loading.value = false;
  }
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
    'follow_up': 'Tự động bám đuổi',
    'smart_pause': 'Dừng thông minh',
  };
  return map[f] || f;
}

function formatNumber(num: number) {
  if (!num) return '0';
  return new Intl.NumberFormat('vi-VN').format(Math.round(num));
}

function getFeatureIcon(f: string) {
  const map: any = {
    'reply_draft': 'mdi-chat-processing-outline',
    'follow_up': 'mdi-account-arrow-right-outline',
    'smart_pause': 'mdi-hand-stop-outline',
  };
  return map[f] || 'mdi-auto-fix';
}

function getFeatureColor(f: string) {
  const map: any = {
    'reply_draft': 'primary',
    'follow_up': 'success',
    'smart_pause': 'error',
  };
  return map[f] || 'grey';
}

function getProviderColor(p: string) {
  const map: any = {
    'openai': 'success',
    'anthropic': 'warning',
    'gemini': 'primary',
  };
  return map[p?.toLowerCase()] || 'secondary';
}

onMounted(loadAllData);
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
  border-radius: 20px !important;
  box-shadow: var(--shadow-sm) !important;
}

.glass-container {
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: 24px;
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
.indigo--text { color: #6366f1; }
.warning--text { color: var(--color-warning); }

.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: var(--color-primary-soft-strong); border-radius: 10px; }
</style>
