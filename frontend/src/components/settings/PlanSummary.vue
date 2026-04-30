<template>
  <div class="plan-summary">
    <div v-if="loading" class="d-flex justify-center py-12">
      <v-progress-circular indeterminate color="primary" />
    </div>
    
    <div v-else-if="currentPlan">
      <div class="d-flex align-center justify-space-between mb-8">
        <div>
          <h3 class="text-h6 font-weight-bold mb-1">Gói dịch vụ hiện tại</h3>
          <p class="text-caption text-medium-emphasis">Thông tin chi tiết về quyền lợi và hạn mức của bạn</p>
        </div>
        <v-chip color="primary" variant="flat" class="font-weight-bold px-4" size="large">
          {{ currentPlan.name }}
        </v-chip>
      </div>

      <v-row>
        <!-- Info Cards -->
        <v-col cols="12" md="4">
          <v-card variant="outlined" class="pa-6 rounded-xl border-glass h-100">
            <div class="text-caption text-uppercase font-weight-bold text-medium-emphasis mb-2">Kênh kết nối</div>
            <div class="text-h4 font-weight-black mb-1">{{ currentPlan.maxZaloAcc }}</div>
            <div class="text-caption text-primary">Tối đa các kênh Zalo/Facebook</div>
          </v-card>
        </v-col>

        <v-col cols="12" md="4">
          <v-card variant="outlined" class="pa-6 rounded-xl border-glass h-100">
            <div class="text-caption text-uppercase font-weight-bold text-medium-emphasis mb-2">Hạn mức AI</div>
            <div class="text-h4 font-weight-black mb-1">{{ formatNumber(currentPlan.maxAiTokens) }}</div>
            <div class="text-caption text-primary">Tokens AI mỗi tháng</div>
          </v-card>
        </v-col>

        <v-col cols="12" md="4">
          <v-card variant="outlined" class="pa-6 rounded-xl border-glass h-100">
            <div class="text-caption text-uppercase font-weight-bold text-medium-emphasis mb-2">Chi phí</div>
            <div class="text-h4 font-weight-black mb-1">{{ formatCurrency(currentPlan.priceMonth) }}</div>
            <div class="text-caption text-primary">VND / tháng</div>
          </v-card>
        </v-col>
      </v-row>

      <v-divider class="my-8 opacity-10" />

      <div class="bg-primary-soft pa-6 rounded-xl d-flex align-center justify-space-between">
        <div class="d-flex align-center">
          <v-icon color="primary" size="32" class="mr-4">mdi-rocket-launch-outline</v-icon>
          <div>
            <div class="text-subtitle-1 font-weight-bold">Muốn mở rộng quy mô kinh doanh?</div>
            <div class="text-body-2 text-medium-emphasis">Nâng cấp gói cước để nhận thêm nhiều quyền lợi và ưu tiên hỗ trợ.</div>
          </div>
        </div>
        <v-btn color="primary" variant="flat" rounded="lg" to="/pricing" class="px-8 font-weight-bold text-none">
          Xem các gói cước
        </v-btn>
      </div>
    </div>

    <v-alert v-else type="warning" variant="tonal" class="rounded-xl">
      Không tìm thấy thông tin gói cước. Vui lòng liên hệ quản trị viên.
    </v-alert>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '@/api';

const loading = ref(true);
const currentPlan = ref<any>(null);

async function fetchPlan() {
  try {
    const res = await api.get('/organization');
    currentPlan.value = res.data.subscription?.plan;
  } catch (err) {
    console.error('Failed to fetch plan:', err);
  } finally {
    loading.value = false;
  }
}

function formatNumber(n: number) {
  if (!n) return '0';
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(0) + 'K';
  return n.toString();
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('vi-VN').format(n);
}

onMounted(fetchPlan);
</script>

<style scoped>
.border-glass {
  background: var(--color-surface) !important;
  border: 1px solid var(--color-border) !important;
}
.bg-primary-soft {
  background: var(--color-primary-soft);
}
</style>
