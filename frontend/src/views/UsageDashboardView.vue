<template>
  <v-container fluid class="pa-6 fill-height d-flex flex-column usage-dashboard">
    <!-- Header -->
    <div class="d-flex align-center mb-6 flex-shrink-0">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1 gradient-text">Mức dùng & Gói cước</h1>
        <p class="text-medium-emphasis mb-0">Quản lý hạn mức, theo dõi hiệu quả AI và đăng ký dịch vụ</p>
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
        Làm mới
      </v-btn>
      <v-btn
        color="primary"
        variant="flat"
        prepend-icon="mdi-crown"
        rounded="xl"
        to="/pricing"
      >
        Nâng cấp gói
      </v-btn>
    </div>

    <!-- 1. Top Section: Quotas & Subscription Info -->
    <v-row class="mb-6 flex-shrink-0">
      <!-- Active Plan Card -->
      <v-col cols="12" md="4">
        <v-card class="glass-card pa-6 h-100 plan-info-card" border variant="flat">
          <div class="d-flex align-center justify-space-between mb-4">
            <div class="text-subtitle-1 font-weight-bold">Gói dịch vụ</div>
            <v-chip color="primary" variant="flat" size="small" class="font-weight-bold">
              {{ aiUsage?.planName || 'Đang tải...' }}
            </v-chip>
          </div>
          
          <div class="plan-price mb-6">
            <span class="text-h3 font-weight-black">{{ formatPrice(subscription?.plan?.priceMonth || 0) }}</span>
            <span class="text-caption text-medium-emphasis ml-1">/ tháng</span>
          </div>

          <div class="plan-meta ga-3 d-flex flex-column">
            <div class="d-flex align-center">
              <v-icon size="18" color="success" class="mr-2">mdi-check-circle-outline</v-icon>
              <span class="text-body-2">Chu kỳ: {{ formatDate(aiUsage?.periodStart) }} - {{ formatDate(aiUsage?.periodEnd) }}</span>
            </div>
            <div class="d-flex align-center">
              <v-icon size="18" :color="aiUsage?.enabled ? 'success' : 'error'" class="mr-2">
                {{ aiUsage?.enabled ? 'mdi-check-circle-outline' : 'mdi-alert-circle-outline' }}
              </v-icon>
              <span class="text-body-2">Trạng thái AI: {{ aiUsage?.enabled ? 'Đang hoạt động' : 'Đã dừng' }}</span>
            </div>
          </div>

          <v-divider class="my-6 opacity-10"></v-divider>

          <v-btn block variant="tonal" color="primary" rounded="lg" to="/pricing" class="text-none font-weight-bold">
            Xem chi tiết bảng giá
          </v-btn>
        </v-card>
      </v-col>

      <!-- Quota Gauges -->
      <v-col cols="12" md="8">
        <v-card class="glass-card pa-6 h-100" border variant="flat">
          <div class="text-subtitle-1 font-weight-bold mb-6">Hạn mức tài nguyên</div>
          
          <v-row>
            <!-- AI Tokens Gauge -->
            <v-col cols="12" sm="4" class="text-center">
              <div class="gauge-wrapper mb-3">
                <v-progress-circular
                  :model-value="tokenPercent"
                  :color="getProgressColor(tokenPercent)"
                  size="120"
                  width="12"
                  rotate="360"
                >
                  <div class="d-flex flex-column align-center">
                    <span class="text-h6 font-weight-black">{{ tokenPercent }}%</span>
                  </div>
                </v-progress-circular>
              </div>
              <div class="text-subtitle-2 font-weight-bold">Tokens AI</div>
              <div class="text-caption opacity-70">{{ formatCompact(aiUsage?.usedTokens || 0) }} / {{ formatCompact(aiUsage?.maxTokens || 0) }}</div>
            </v-col>

            <!-- Premium Tokens Gauge -->
            <v-col cols="12" sm="4" class="text-center">
              <div class="gauge-wrapper mb-3">
                <v-progress-circular
                  :model-value="premiumPercent"
                  :color="getProgressColor(premiumPercent, 'premium')"
                  size="120"
                  width="12"
                  rotate="360"
                >
                  <div class="d-flex flex-column align-center">
                    <span class="text-h6 font-weight-black">{{ premiumPercent }}%</span>
                  </div>
                </v-progress-circular>
              </div>
              <div class="text-subtitle-2 font-weight-bold">Premium (Sonnet)</div>
              <div class="text-caption opacity-70">{{ formatCompact(aiUsage?.usedPremiumTokens || 0) }} / {{ formatCompact(aiUsage?.premiumLimit || 0) }}</div>
            </v-col>

            <!-- Channels Gauge -->
            <v-col cols="12" sm="4" class="text-center">
              <div class="gauge-wrapper mb-3">
                <v-progress-circular
                  :model-value="channelPercent"
                  color="indigo"
                  size="120"
                  width="12"
                  rotate="360"
                >
                  <div class="d-flex flex-column align-center">
                    <span class="text-h6 font-weight-black">{{ channelPercent }}%</span>
                  </div>
                </v-progress-circular>
              </div>
              <div class="text-subtitle-2 font-weight-bold">Kênh kết nối</div>
              <div class="text-caption opacity-70">{{ channelCount }} / {{ subscription?.plan?.maxZaloAcc || 1 }}</div>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
    </v-row>

    <!-- 2. Mid Section: AI ROI & Performance -->
    <v-row class="mb-6 flex-shrink-0" v-if="analyticsData">
      <v-col cols="12" md="3">
        <v-card class="glass-card pa-5 d-flex align-center ga-4" border variant="flat">
          <v-avatar color="primary-lighten-5" size="48" rounded="lg">
            <v-icon color="primary">mdi-robot-outline</v-icon>
          </v-avatar>
          <div>
            <div class="text-caption opacity-70">Tổng phản hồi AI</div>
            <div class="text-h5 font-weight-black">{{ analyticsData.stats.totalAiReplies }}</div>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card class="glass-card pa-5 d-flex align-center ga-4" border variant="flat">
          <v-avatar color="success-lighten-5" size="48" rounded="lg">
            <v-icon color="success">mdi-clock-fast</v-icon>
          </v-avatar>
          <div>
            <div class="text-caption opacity-70">Nhân lực tiết kiệm</div>
            <div class="text-h5 font-weight-black">{{ analyticsData.stats.savedHumanHours.toFixed(1) }}h</div>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card class="glass-card pa-5 d-flex align-center ga-4" border variant="flat">
          <v-avatar color="indigo-lighten-5" size="48" rounded="lg">
            <v-icon color="indigo">mdi-check-decagram-outline</v-icon>
          </v-avatar>
          <div>
            <div class="text-caption opacity-70">Tỷ lệ tin tưởng</div>
            <div class="text-h5 font-weight-black">{{ analyticsData.acceptanceRate.toFixed(0) }}%</div>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card class="glass-card pa-5 d-flex align-center ga-4" border variant="flat">
          <v-avatar color="warning-lighten-5" size="48" rounded="lg">
            <v-icon color="warning">mdi-account-group-outline</v-icon>
          </v-avatar>
          <div>
            <div class="text-caption opacity-70">Đội ngũ (Staff)</div>
            <div class="text-h5 font-weight-black">{{ userCount }}</div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- 3. Bottom Section: History & Trends -->
    <v-row class="flex-grow-1 overflow-hidden">
      <v-col cols="12" md="7" class="d-flex flex-column overflow-hidden">
        <v-card class="glass-container flex-grow-1 d-flex flex-column overflow-hidden" border variant="flat">
          <div class="pa-4 flex-grow-1 overflow-hidden d-flex flex-column">
            <div class="d-flex align-center mb-4 px-2">
              <v-icon class="mr-2 opacity-60">mdi-history</v-icon>
              <span class="text-subtitle-2 font-weight-bold">Nhật ký tiêu thụ Token</span>
              <v-spacer />
              <v-text-field
                v-model="search"
                prepend-inner-icon="mdi-magnify"
                label="Tìm kiếm..."
                variant="outlined"
                density="compact"
                hide-details
                rounded="lg"
                max-width="200"
              ></v-text-field>
            </div>

            <v-data-table
              :headers="headers"
              :items="filteredHistory"
              :loading="loading"
              class="usage-table flex-grow-1 custom-scrollbar"
              hover
              fixed-header
              density="compact"
            >
              <template v-slot:item.feature="{ item }">
                <div class="d-flex align-center">
                  <v-icon size="14" class="mr-2" :color="getFeatureColor(item.feature)">
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
                <span class="text-caption font-weight-bold">{{ formatNumber(item.tokens) }}</span>
              </template>
              <template v-slot:item.createdAt="{ item }">
                <span class="text-caption opacity-60">{{ formatDateTime(item.createdAt) }}</span>
              </template>
            </v-data-table>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="5" class="d-flex flex-column overflow-hidden">
        <v-card class="glass-container pa-6 mb-4" border variant="flat">
          <div class="text-subtitle-2 font-weight-bold mb-4">Xu hướng hoạt động AI</div>
          <div class="chart-container" style="height: 180px;">
            <Line v-if="chartData" :data="chartData" :options="chartOptions" />
          </div>
        </v-card>

        <v-card class="glass-container pa-5 flex-grow-1" border variant="flat">
          <div class="text-subtitle-2 font-weight-bold mb-4">Tâm trạng khách hàng</div>
          <div class="d-flex align-center justify-space-between ga-2">
            <div class="text-center flex-grow-1">
              <div class="text-h6 font-weight-black text-success">70%</div>
              <div class="text-caption">Tích cực</div>
            </div>
            <div class="text-center flex-grow-1">
              <div class="text-h6 font-weight-black text-warning">20%</div>
              <div class="text-caption">Trung lập</div>
            </div>
            <div class="text-center flex-grow-1">
              <div class="text-h6 font-weight-black text-error">10%</div>
              <div class="text-caption">Tiêu cực</div>
            </div>
          </div>
          <v-progress-linear
            class="mt-4 rounded-pill"
            height="8"
            :model-value="70"
            color="success"
          >
            <template v-slot:default>
              <v-progress-linear :model-value="90" color="warning"></v-progress-linear>
              <v-progress-linear :model-value="100" color="error"></v-progress-linear>
            </template>
          </v-progress-linear>
          <div class="text-caption opacity-60 mt-4 italic text-center">
            Dựa trên 100 hội thoại gần nhất được AI phân tích.
          </div>
        </v-card>
      </v-col>
    </v-row>
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

const loading = ref(true);
const aiUsage = ref<any>(null);
const subscription = ref<any>(null);
const history = ref<any[]>([]);
const analyticsData = ref<any>(null);
const channelCount = ref(0);
const userCount = ref(0);
const search = ref('');

const headers = [
  { title: 'TÍNH NĂNG', key: 'feature' },
  { title: 'MODEL', key: 'model' },
  { title: 'TOKENS', key: 'tokens', align: 'end' as const },
  { title: 'THỜI GIAN', key: 'createdAt', align: 'end' as const },
];

const tokenPercent = computed(() => {
  if (!aiUsage.value || !aiUsage.value.maxTokens) return 0;
  return Math.min(100, Math.round((aiUsage.value.usedTokens / aiUsage.value.maxTokens) * 100));
});

const premiumPercent = computed(() => {
  if (!aiUsage.value || !aiUsage.value.premiumLimit) return 0;
  return Math.min(100, Math.round((aiUsage.value.usedPremiumTokens / aiUsage.value.premiumLimit) * 100));
});

const channelPercent = computed(() => {
  const limit = subscription.value?.plan?.maxZaloAcc || 1;
  return Math.min(100, Math.round((channelCount.value / limit) * 100));
});

async function loadAllData() {
  loading.value = true;
  try {
    const [usageRes, subRes, analyticsRes, historyRes, channelsRes, usersRes] = await Promise.all([
      api.get('/ai/usage'),
      api.get('/billing/subscription'),
      api.get('/ai/analytics'),
      api.get('/ai/usage/history'),
      api.get('/zalo-accounts'),
      api.get('/users')
    ]);
    
    aiUsage.value = usageRes.data;
    subscription.value = subRes.data;
    analyticsData.value = analyticsRes.data;
    history.value = historyRes.data;
    channelCount.value = channelsRes.data.length || 0;
    userCount.value = usersRes.data.users?.length || 0;
  } catch (err) {
    console.error('Failed to load usage data:', err);
  } finally {
    loading.value = false;
  }
}

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
    return items.length;
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
    x: { grid: { display: false }, ticks: { color: 'rgba(128, 128, 128, 0.5)', font: { size: 10 } } },
    y: { beginAtZero: true, grid: { color: 'rgba(128, 128, 128, 0.05)' }, ticks: { color: 'rgba(128, 128, 128, 0.5)', font: { size: 10 } } }
  }
};

function getProgressColor(percent: number, type = 'normal') {
  if (percent > 90) return 'error';
  if (percent > 75) return 'warning';
  return type === 'premium' ? 'amber-darken-2' : 'primary';
}

function formatPrice(p: number) {
  if (p === 0) return 'Miễn phí';
  return new Intl.NumberFormat('vi-VN').format(p) + 'đ';
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

function formatCompact(n: number) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(0) + 'k';
  return n.toString();
}

function formatNumber(num: number) {
  return new Intl.NumberFormat('vi-VN').format(Math.round(num));
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
.usage-dashboard {
  background: var(--color-canvas);
}

.gradient-text {
  background: var(--gradient-brand);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.glass-card {
  background: var(--color-surface) !important;
  border: 1px solid var(--color-border) !important;
  border-radius: 24px !important;
  box-shadow: var(--shadow-sm) !important;
  transition: transform 0.2s;
}

.plan-info-card {
  background: linear-gradient(135deg, var(--color-primary-soft) 0%, var(--color-surface) 100%) !important;
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
  font-size: 10px !important;
  font-weight: 800 !important;
  color: var(--color-text-secondary) !important;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.gauge-wrapper {
  position: relative;
  display: inline-block;
}

.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: var(--color-primary-soft-strong); border-radius: 10px; }
</style>
