<template>
  <v-container class="py-12 pricing-shell">
    <div class="text-center mb-16 entrance-animation">
      <div class="pricing-badge mb-4 mx-auto">
        <v-icon color="primary" size="18">mdi-shield-crown-outline</v-icon>
        <span class="ml-2">Plans & Pricing</span>
      </div>
      <h1 class="text-h2 font-weight-black text-white mb-4">Nâng cấp <span class="text-gradient">Zalo Automation</span></h1>
      <p class="text-h6 text-placeholder mx-auto" style="max-width: 600px;">
        Chọn gói cước phù hợp để đột phá doanh thu và tự động hóa quy trình chăm sóc khách hàng trên Zalo.
      </p>
    </div>

    <v-row justify="center" class="pricing-grid">
      <v-col v-for="(plan, index) in plans" :key="plan.id" cols="12" md="4" class="px-4">
        <v-card
          :class="['pricing-card', `plan-${plan.name.toLowerCase()}`, { 'plan-featured': plan.name === 'Pro' }]"
          class="pa-8 d-flex flex-column h-100 entrance-animation"
          :style="{ animationDelay: `${index * 0.1}s` }"
        >
          <div v-if="plan.name === 'Pro'" class="featured-tag">🔥 Phổ biến nhất</div>
          
          <div class="plan-header mb-6">
            <h2 class="plan-name mb-1">{{ plan.name }}</h2>
            <div class="plan-price">
              <span class="currency">đ</span>
              <span class="amount">{{ formatPriceValue(plan.priceMonth) }}</span>
              <span class="period" v-if="plan.priceMonth > 0">/tháng</span>
            </div>
          </div>

          <div class="ai-box mb-8">
            <div class="ai-box__inner">
              <v-icon color="info" size="20">mdi-auto-fix</v-icon>
              <div class="ml-3">
                <div class="text-caption font-weight-bold text-white uppercase">AI POWER</div>
                <div class="text-h6 font-weight-black text-gradient-ai">{{ plan.maxAiTokens.toLocaleString() }} Tokens</div>
              </div>
            </div>
          </div>

          <v-list density="compact" class="bg-transparent flex-grow-1 feature-list">
            <v-list-item class="px-0 py-1">
              <template #prepend>
                <v-icon color="success" size="20">mdi-check-circle</v-icon>
              </template>
              <v-list-item-title class="text-white">Tối đa <strong>{{ plan.maxZaloAcc }}</strong> tài khoản Zalo</v-list-item-title>
            </v-list-item>

            <v-list-item v-for="(feature, idx) in parseFeatures(plan.features)" :key="idx" class="px-0 py-1">
              <template #prepend>
                <v-icon color="success" size="20">mdi-check-circle</v-icon>
              </template>
              <v-list-item-title class="text-white">{{ feature }}</v-list-item-title>
            </v-list-item>
          </v-list>

          <v-btn
            block
            height="56"
            rounded="xl"
            class="mt-8 shadow-glow"
            :class="plan.name === 'Pro' ? 'btn-plan-pro' : 'btn-plan-standard'"
            @click="selectPlan(plan)"
            :disabled="currentPlanId === plan.id"
          >
            <span>{{ currentPlanId === plan.id ? 'Gói hiện tại' : 'Nâng cấp ngay' }}</span>
            <v-icon end v-if="currentPlanId !== plan.id">mdi-arrow-right</v-icon>
          </v-btn>
        </v-card>
      </v-col>
    </v-row>

    <!-- Payment Modal -->
    <v-dialog v-model="paymentDialog" max-width="500">
      <v-card v-if="selectedPlan" class="payment-modal glass-card">
        <div class="pa-8">
          <div class="d-flex align-center mb-6">
            <div class="modal-icon mr-4">
              <v-icon size="32" color="primary">mdi-wallet-outline</v-icon>
            </div>
            <div>
              <h3 class="text-h5 font-weight-bold text-white">Thanh toán nâng cấp</h3>
              <p class="text-caption text-placeholder">Gói {{ selectedPlan.name }}</p>
            </div>
          </div>

          <div class="payment-instructions pa-4 mb-6">
            <p class="text-body-2 text-white mb-4">Vui lòng quét mã QR để thanh toán. Hệ thống sẽ tự động kích hoạt gói <b>{{ selectedPlan.name }}</b> ngay khi nhận được tiền.</p>
            
            <div class="qr-wrapper text-center mb-6 pa-4">
              <v-img src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=ZaloCRM-Payment" width="220" class="mx-auto rounded-xl border-glass"></v-img>
            </div>

            <div class="payment-info pa-4 rounded-lg">
              <div class="d-flex justify-space-between mb-2">
                <span class="text-placeholder">Số tiền:</span>
                <span class="text-white font-weight-bold text-h6">{{ formatPrice(selectedPlan.priceMonth) }}</span>
              </div>
              <div class="d-flex justify-space-between">
                <span class="text-placeholder">Nội dung:</span>
                <span class="text-cyan font-weight-bold">CRMPAY {{ selectedPlan.name }}</span>
              </div>
            </div>
          </div>

          <v-btn block height="54" color="primary" class="btn-glow" @click="confirmPayment">
            Tôi đã chuyển khoản thành công
          </v-btn>
          <v-btn block variant="text" class="mt-2 text-placeholder" @click="paymentDialog = false">Hủy bỏ</v-btn>
        </div>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '@/api/index';

const plans = ref<any[]>([]);
const currentPlanId = ref<string | null>(null);
const paymentDialog = ref(false);
const selectedPlan = ref<any>(null);

const fetchPlans = async () => {
  try {
    const res = await api.get('/billing/plans');
    plans.value = res.data;
  } catch (err) {
    console.error('Failed to fetch plans', err);
  }
};

const fetchSubscription = async () => {
  try {
    const res = await api.get('/billing/subscription');
    if (res.data) {
      currentPlanId.value = res.data.planId;
    }
  } catch (err) {
    console.error('Failed to fetch subscription', err);
  }
};

onMounted(() => {
  fetchPlans();
  fetchSubscription();
});

const formatPriceValue = (price: number) => {
  if (price === 0) return '0';
  return (price / 1000).toLocaleString() + 'k';
};

const formatPrice = (price: number) => {
  if (price === 0) return 'Miễn phí';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

const parseFeatures = (features: any) => {
  if (typeof features === 'string') {
    return JSON.parse(features);
  }
  return features || [];
};

const selectPlan = (plan: any) => {
  selectedPlan.value = plan;
  paymentDialog.value = true;
};

const confirmPayment = () => {
  paymentDialog.value = false;
  alert('Hệ thống đang kiểm tra giao dịch của bạn. Vui lòng chờ trong giây lát!');
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');

.pricing-shell {
  font-family: 'Outfit', sans-serif;
}

.entrance-animation {
  opacity: 0;
  animation: fadeInSlide 0.8s ease-out forwards;
}

@keyframes fadeInSlide {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

.pricing-badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 16px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid var(--color-border);
  border-radius: 99px;
  color: var(--color-text-secondary);
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  box-shadow: var(--shadow-sm);
}

.text-gradient {
  background: var(--gradient-accent);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.text-gradient-ai {
  background: linear-gradient(135deg, var(--color-primary), var(--color-success));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.text-placeholder {
  color: var(--color-text-secondary);
}

.text-cyan {
  color: var(--color-primary);
}

/* Pricing Card Styles */
.pricing-card {
  position: relative;
  background: var(--color-surface-elevated) !important;
  border: 1px solid var(--color-border) !important;
  backdrop-filter: blur(12px);
  border-radius: 32px !important;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: visible;
  box-shadow: var(--shadow-sm);
}

.pricing-card:hover {
  transform: translateY(-8px);
  border-color: var(--color-primary-soft-strong) !important;
}

.plan-featured {
  border: 2px solid var(--color-primary) !important;
  box-shadow: var(--glow-brand);
}

.featured-tag {
  position: absolute;
  top: -14px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--gradient-brand);
  color: var(--color-text-inverse);
  padding: 4px 16px;
  border-radius: 99px;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.plan-name {
  color: var(--color-text);
  font-weight: 800;
  font-size: 1.5rem;
}

.plan-price {
  display: flex;
  align-items: baseline;
  color: var(--color-text);
}

.currency {
  font-size: 1.5rem;
  font-weight: 600;
  margin-right: 4px;
}

.amount {
  font-size: 3.5rem;
  font-weight: 800;
  line-height: 1;
}

.period {
  color: var(--color-text-secondary);
  margin-left: 8px;
  font-size: 1rem;
}

.ai-box {
  background: var(--color-overlay);
  border-radius: 16px;
  border: 1px solid var(--color-border);
}

.ai-box__inner {
  display: flex;
  align-items: center;
  padding: 12px 16px;
}

.btn-plan-pro {
  background: var(--gradient-brand) !important;
  color: var(--color-text-inverse) !important;
  font-weight: 800 !important;
  text-transform: none !important;
}

.btn-plan-standard {
  background: rgba(255, 255, 255, 0.72) !important;
  border: 1px solid var(--color-border) !important;
  color: var(--color-text) !important;
  font-weight: 700 !important;
  text-transform: none !important;
}

.shadow-glow:hover {
  box-shadow: var(--glow-brand) !important;
}

/* Modal Styles */
.glass-card {
  background: rgba(255, 255, 255, 0.88) !important;
  border: 1px solid rgba(255, 255, 255, 0.72) !important;
  backdrop-filter: blur(24px) saturate(180%);
  border-radius: 32px !important;
  color: var(--color-text);
  box-shadow: var(--shadow-lg);
}

.modal-icon {
  width: 56px;
  height: 56px;
  background: var(--color-primary-soft);
  border: 1px solid var(--color-primary-soft-strong);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.border-glass {
  border: 2px solid var(--color-border);
}

.payment-info {
  background: var(--color-overlay);
  border: 1px solid var(--color-border);
}

.btn-glow {
  box-shadow: var(--glow-brand);
}

.pricing-shell :deep(.text-white) {
  color: var(--color-text) !important;
}

.pricing-shell :deep(.text-h2) {
  color: var(--color-text) !important;
}
</style>
