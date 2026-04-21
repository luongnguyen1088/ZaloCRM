<template>
  <v-container fluid class="pa-6 fill-height d-flex flex-column">
    <!-- Header -->
    <div class="d-flex align-center mb-6 flex-shrink-0">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1 gradient-text">Lịch sử AI Credit</h1>
        <p class="text-medium-emphasis mb-0">Theo dõi chi tiết lượng token và credit đã tiêu thụ</p>
      </div>
      <v-spacer />
      <v-btn variant="outlined" color="primary" prepend-icon="mdi-refresh" rounded="xl" @click="loadData" :loading="loading">
        Làm mới
      </v-btn>
    </div>

    <!-- Summary Cards -->
    <v-row class="mb-6 flex-shrink-0">
      <v-col cols="12" md="4">
        <v-card class="glass-card usage-summary-card h-100" elevation="0">
          <div class="pa-5 d-flex align-center">
            <v-avatar color="primary-lighten-4" size="56" class="mr-4">
              <v-icon color="primary" size="28">mdi-coin</v-icon>
            </v-avatar>
            <div>
              <div class="text-overline opacity-70">Số dư hiện tại</div>
              <div class="text-h4 font-weight-bold primary--text">{{ usageData?.remainingCredits?.toFixed(2) || '0.00' }}</div>
              <div class="text-caption">Đã dùng {{ usageData?.usedCredits?.toFixed(2) || '0' }} / {{ usageData?.maxCredits || '0' }}</div>
            </div>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card class="glass-card usage-summary-card h-100" elevation="0">
          <div class="pa-5 d-flex align-center">
            <v-avatar color="success-lighten-4" size="56" class="mr-4">
              <v-icon color="success" size="28">mdi-text-box-outline</v-icon>
            </v-avatar>
            <div>
              <div class="text-overline opacity-70">Gói cước</div>
              <div class="text-h5 font-weight-bold success--text">{{ usageData?.planName || 'Free' }}</div>
              <div class="text-caption">Tự động làm mới vào mỗi tháng</div>
            </div>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card class="glass-card usage-summary-card h-100" elevation="0">
          <div class="pa-5 d-flex align-center">
            <v-avatar color="info-lighten-4" size="56" class="mr-4">
              <v-icon color="info" size="28">mdi-clock-outline</v-icon>
            </v-avatar>
            <div>
              <div class="text-overline opacity-70">Chu kỳ hiện tại</div>
              <div class="text-body-1 font-weight-bold">
                {{ formatDate(usageData?.periodStart) }} - {{ formatDate(usageData?.periodEnd) }}
              </div>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- History Table -->
    <v-card class="glass-container flex-grow-1 d-flex flex-column overflow-hidden" elevation="0">
      <div class="pa-4 flex-grow-1 overflow-hidden d-flex flex-column">
        <v-data-table
          :headers="headers"
          :items="history"
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
            <v-chip size="x-small" variant="tonal" color="secondary" class="font-weight-bold">
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
import { ref, onMounted } from 'vue';
import { api } from '@/api';

const loading = ref(true);
const history = ref([]);
const usageData = ref<any>(null);

const headers = [
  { title: 'TÍNH NĂNG', key: 'feature', align: 'start' as const },
  { title: 'MODEL', key: 'model' },
  { title: 'TOKEN (IN/OUT)', key: 'tokens', sortable: false },
  { title: 'CREDIT', key: 'credits', align: 'end' as const },
  { title: 'THỜI GIAN', key: 'createdAt', align: 'end' as const },
];

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
  };
  return map[f] || f;
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
