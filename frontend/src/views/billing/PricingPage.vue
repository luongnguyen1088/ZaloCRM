<template>
  <v-container class="py-12 pricing-shell">
    <div class="text-center mb-16 entrance-animation">
      <div class="pricing-badge mb-4 mx-auto">
        <v-icon color="primary" size="18">mdi-shield-crown-outline</v-icon>
        <span class="ml-2">Plans & Pricing</span>
      </div>
      <h1 class="text-h2 font-weight-black text-white mb-4">
        N�ng c?p <span class="text-gradient">Zalo Automation</span>
      </h1>
      <p class="text-h6 text-placeholder mx-auto pricing-intro">
        Chọn gói cước phù hợp để tự động hóa chăm sóc khách hàng trên Zalo và mở rộng doanh thu bền vững.
      </p>
    </div>

    <v-row justify="center" class="pricing-grid">
      <v-col v-for="(plan, index) in plans" :key="plan.id" cols="12" md="4" class="px-4">
        <v-card
          :class="['pricing-card', `plan-${plan.name.toLowerCase()}`, { 'plan-featured': plan.name === 'Pro' }]"
          class="pa-8 d-flex flex-column h-100 entrance-animation"
          :style="{ animationDelay: `${index * 0.1}s` }"
        >
          <div v-if="plan.name === 'Pro'" class="featured-tag">Phổ biến nhất</div>

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
                <div class="text-h6 font-weight-black text-gradient-ai">
                  {{ plan.maxAiTokens.toLocaleString() }} Tokens
                </div>
              </div>
            </div>
          </div>

          <v-list density="compact" class="bg-transparent flex-grow-1 feature-list">
            <v-list-item class="px-0 py-1">
              <template #prepend>
                <v-icon color="success" size="20">mdi-check-circle</v-icon>
              </template>
              <v-list-item-title class="text-white">
                Tối đa <strong>{{ plan.maxZaloAcc }}</strong> tài khoản Zalo
              </v-list-item-title>
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
            :disabled="currentPlanId === plan.id"
            @click="selectPlan(plan)"
          >
            <span>{{ currentPlanId === plan.id ? 'G�i hi?n t?i' : 'N�ng c?p ngay' }}</span>
            <v-icon v-if="currentPlanId !== plan.id" end>mdi-arrow-right</v-icon>
          </v-btn>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="paymentDialog" max-width="560" scrollable content-class="payment-dialog-content">
      <v-card v-if="selectedPlan" class="payment-modal glass-card d-flex flex-column">
        <div class="payment-modal__orb payment-modal__orb--primary"></div>
        <div class="payment-modal__orb payment-modal__orb--accent"></div>

        <div class="pa-8 payment-content">
          <div class="d-flex align-start justify-space-between mb-6">
            <div class="d-flex align-start flex-grow-1">
              <div class="modal-icon mr-4">
                <v-icon size="28" color="primary">mdi-wallet-outline</v-icon>
              </div>
              <div>
                <div class="payment-kicker mb-2">Thanh to�n n�ng c?p</div>
                <h3 class="payment-title">Gói {{ selectedPlan.name }}</h3>
                <p class="payment-subtitle mb-0">
                  Qu�t m� QR d? thanh to�n. H? th?ng s? t? d?ng k�ch ho?t ngay sau khi ghi nh?n giao d?ch.
                </p>
              </div>
            </div>

            <v-btn icon variant="text" size="small" class="payment-close" @click="paymentDialog = false">
              <v-icon size="20">mdi-close</v-icon>
            </v-btn>
          </div>

          <div class="payment-summary mb-5">
            <div>
              <div class="payment-summary__label">Số tiền cần thanh toán</div>
              <div class="payment-summary__amount">{{ formatPrice(selectedPlan.priceMonth) }}</div>
            </div>
            <div class="payment-summary__badge">
              <v-icon size="16" color="success">mdi-check-decagram-outline</v-icon>
              <span>Kích hoạt tự động</span>
            </div>
          </div>

          <div class="payment-body mb-6">
            <div class="payment-qr-panel">
              <div class="payment-panel__label mb-3">M� QR thanh to�n</div>
              <div class="qr-wrapper text-center mb-3 pa-4">
                <v-img
                  src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=ZaloCRM-Payment"
                  width="220"
                  class="mx-auto rounded-xl border-glass"
                />
              </div>
              <div class="payment-qr-caption">
                D�ng ?ng d?ng ng�n h�ng d? qu�t m� v� gi? nguy�n s? ti?n chuy?n kho?n.
              </div>
            </div>

            <div class="payment-details">
              <div class="payment-panel__label mb-3">Thông tin giao dịch</div>

              <div class="payment-info rounded-xl mb-4">
                <div class="payment-info__row">
                  <span class="payment-info__label">Số tiền</span>
                  <span class="payment-info__value">{{ formatPrice(selectedPlan.priceMonth) }}</span>
                </div>
                <div class="payment-info__row">
                  <span class="payment-info__label">Nội dung</span>
                  <span class="payment-info__value payment-info__value--accent">CRMPAY {{ selectedPlan.name }}</span>
                </div>
              </div>

              <div class="payment-steps mb-4">
                <div class="payment-step">
                  <div class="payment-step__index">1</div>
                  <div>M? ?ng d?ng ng�n h�ng v� ch?n <strong>Qu�t QR</strong>.</div>
                </div>
                <div class="payment-step">
                  <div class="payment-step__index">2</div>
                  <div>Kiểm tra lại số tiền và nội dung chuyển khoản trước khi xác nhận.</div>
                </div>
                <div class="payment-step">
                  <div class="payment-step__index">3</div>
                  <div>Nhấn nút bên dưới sau khi chuyển khoản để hệ thống bắt đầu đối soát.</div>
                </div>
              </div>

              <div class="payment-note">
                <v-icon size="18" color="primary">mdi-information-outline</v-icon>
                <span>Gói sẽ được kích hoạt ngay khi hệ thống ghi nhận giao dịch thành công.</span>
              </div>
            </div>
          </div>

        </div>

        <div class="payment-actions pa-8 pt-0">
          <v-btn
            block
            height="54"
            color="primary"
            rounded="xl"
            class="btn-glow payment-confirm"
            @click="confirmPayment"
          >
            T�i d� chuy?n kho?n th�nh c�ng
          </v-btn>
          <v-btn
            block
            variant="tonal"
            rounded="xl"
            class="mt-3 payment-cancel"
            @click="paymentDialog = false"
          >
            Hủy bỏ
          </v-btn>
        </div>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
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
  return `${(price / 1000).toLocaleString()}k`;
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
  alert('H? th?ng dang ki?m tra giao d?ch c?a b?n. Vui l�ng ch? trong gi�y l�t.');
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');

.pricing-shell {
  font-family: 'Outfit', sans-serif;
}

.pricing-intro {
  max-width: 600px;
}

.entrance-animation {
  opacity: 0;
  animation: fadeInSlide 0.8s ease-out forwards;
}

@keyframes fadeInSlide {
  from {
    opacity: 0;
    transform: translateY(30px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.pricing-badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 16px;
  background: var(--color-surface-glass);
  border: 1px solid var(--color-border);
  border-radius: 99px;
  box-shadow: var(--shadow-sm);
  color: var(--color-text-secondary);
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
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

.pricing-card {
  position: relative;
  overflow: visible;
  background: var(--color-surface-elevated) !important;
  border: 1px solid var(--color-border) !important;
  border-radius: 32px !important;
  backdrop-filter: blur(12px);
  box-shadow: var(--shadow-sm);
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
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
  padding: 4px 16px;
  background: var(--gradient-brand);
  border-radius: 99px;
  color: var(--color-text-inverse);
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.plan-name {
  color: var(--color-text);
  font-size: 1.5rem;
  font-weight: 800;
}

.plan-price {
  display: flex;
  align-items: baseline;
  color: var(--color-text);
}

.currency {
  margin-right: 4px;
  font-size: 1.5rem;
  font-weight: 600;
}

.amount {
  font-size: 3.5rem;
  font-weight: 800;
  line-height: 1;
}

.period {
  margin-left: 8px;
  color: var(--color-text-secondary);
  font-size: 1rem;
}

.ai-box {
  background: var(--color-overlay);
  border: 1px solid var(--color-border);
  border-radius: 16px;
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
  background: var(--color-surface-glass) !important;
  border: 1px solid var(--color-border) !important;
  color: var(--color-text) !important;
  font-weight: 700 !important;
  text-transform: none !important;
}

.shadow-glow:hover {
  box-shadow: var(--glow-brand) !important;
}

.glass-card {
  position: relative;
  overflow: hidden;
  background: var(--color-surface-elevated) !important;
  border: 1px solid var(--color-border) !important;
  border-radius: 32px !important;
  backdrop-filter: blur(24px) saturate(180%);
  box-shadow: var(--shadow-lg);
  color: var(--color-text);
}

:deep(.payment-dialog-content) {
  width: min(560px, calc(100vw - 24px));
  max-height: calc(100vh - 24px);
  margin: 12px;
}

.payment-modal {
  max-height: calc(100vh - 24px);
}

.payment-content {
  flex: 1 1 auto;
  min-height: 0;
  position: relative;
  z-index: 1;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-gutter: stable;
  -webkit-overflow-scrolling: touch;
}

.payment-content::-webkit-scrollbar {
  width: 10px;
}

.payment-content::-webkit-scrollbar-thumb {
  background: var(--color-border-strong);
  border: 2px solid transparent;
  border-radius: 999px;
  background-clip: content-box;
}

.payment-content::-webkit-scrollbar-track {
  background: transparent;
}

.payment-modal__orb {
  position: absolute;
  border-radius: 999px;
  filter: blur(24px);
  pointer-events: none;
}

.payment-modal__orb--primary {
  top: -56px;
  right: -36px;
  width: 160px;
  height: 160px;
  background: var(--color-primary-soft-strong);
}

.payment-modal__orb--accent {
  bottom: -68px;
  left: -30px;
  width: 150px;
  height: 150px;
  background: var(--color-accent-soft);
}

.modal-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  background: var(--color-primary-soft);
  border: 1px solid var(--color-primary-soft-strong);
  border-radius: 18px;
}

.payment-close {
  margin-right: -8px;
  color: var(--color-text-secondary) !important;
}

.payment-kicker {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  background: var(--color-primary-soft);
  border-radius: 999px;
  color: var(--color-primary-strong);
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.payment-title {
  margin: 0 0 8px;
  color: var(--color-text);
  font-size: 1.6rem;
  font-weight: 800;
  line-height: 1.15;
}

.payment-subtitle {
  max-width: 360px;
  color: var(--color-text-secondary);
  font-size: 0.96rem;
  line-height: 1.65;
}

.payment-summary {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
  background: var(--gradient-hero);
  border: 1px solid var(--color-primary-soft-strong);
  border-radius: 24px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.35);
}

.payment-summary__label,
.payment-panel__label {
  color: var(--color-text-secondary);
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.payment-summary__amount {
  margin-top: 8px;
  color: var(--color-text);
  font-size: 1.9rem;
  font-weight: 800;
  line-height: 1.1;
}

.payment-summary__badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: var(--color-surface-glass);
  border: 1px solid var(--color-success-border);
  border-radius: 999px;
  color: var(--color-success);
  font-size: 0.82rem;
  font-weight: 700;
  white-space: nowrap;
}

.payment-body {
  display: grid;
  gap: 18px;
}

.payment-qr-panel,
.payment-details {
  padding: 20px;
  background: var(--color-surface-glass);
  border: 1px solid var(--color-border);
  border-radius: 24px;
}

.border-glass {
  border: 2px solid var(--color-border);
}

.qr-wrapper {
  background: linear-gradient(180deg, var(--color-surface), var(--color-surface-muted));
  border: 1px solid var(--color-border);
  border-radius: 24px;
  box-shadow: var(--shadow-sm);
}

.payment-qr-caption {
  color: var(--color-text-secondary);
  font-size: 0.92rem;
  line-height: 1.6;
  text-align: center;
}

.payment-info {
  overflow: hidden;
  background: var(--color-overlay);
  border: 1px solid var(--color-border);
}

.payment-info__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
}

.payment-info__row + .payment-info__row {
  border-top: 1px solid var(--color-border);
}

.payment-info__label {
  color: var(--color-text-secondary);
  font-size: 0.95rem;
}

.payment-info__value {
  color: var(--color-text);
  font-size: 1rem;
  font-weight: 800;
  text-align: right;
}

.payment-info__value--accent {
  color: var(--color-primary);
}

.payment-steps {
  display: grid;
  gap: 12px;
}

.payment-step {
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr);
  gap: 12px;
  align-items: start;
  color: var(--color-text);
  font-size: 0.95rem;
  line-height: 1.6;
}

.payment-step__index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: var(--color-primary-soft);
  border: 1px solid var(--color-primary-soft-strong);
  border-radius: 12px;
  color: var(--color-primary-strong);
  font-size: 0.92rem;
  font-weight: 800;
}

.payment-note {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px 16px;
  background: var(--color-primary-soft);
  border: 1px solid var(--color-primary-soft-strong);
  border-radius: 18px;
  color: var(--color-text-secondary);
  font-size: 0.92rem;
  line-height: 1.55;
}

.payment-actions {
  position: relative;
  z-index: 1;
  flex: 0 0 auto;
  border-top: 1px solid var(--color-border);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0), var(--color-surface-elevated) 22%);
  backdrop-filter: blur(18px);
}

.btn-glow {
  box-shadow: var(--glow-brand);
}

.payment-confirm {
  font-weight: 800 !important;
  text-transform: none !important;
}

.payment-cancel {
  background: var(--color-overlay) !important;
  border: 1px solid var(--color-border) !important;
  color: var(--color-text-secondary) !important;
  font-weight: 700 !important;
  text-transform: none !important;
}

.pricing-shell :deep(.text-white) {
  color: var(--color-text) !important;
}

.pricing-shell :deep(.text-h2) {
  color: var(--color-text) !important;
}

@media (max-width: 600px) {
  :deep(.payment-dialog-content) {
    width: calc(100vw - 16px);
    max-height: calc(100vh - 16px);
    margin: 8px;
  }

  .payment-modal {
    max-height: calc(100vh - 16px);
  }

  .payment-content,
  .payment-actions {
    padding-left: 20px !important;
    padding-right: 20px !important;
  }

  .payment-content {
    padding-top: 20px !important;
    padding-bottom: 18px !important;
  }

  .payment-actions {
    padding-bottom: 20px !important;
  }

  .payment-title {
    font-size: 1.36rem;
  }

  .payment-summary {
    flex-direction: column;
    align-items: stretch;
  }

  .payment-summary__badge {
    width: fit-content;
  }

  .payment-qr-panel,
  .payment-details {
    padding: 18px;
  }

  .payment-info__row {
    flex-direction: column;
    align-items: flex-start;
  }

  .payment-info__value {
    text-align: left;
  }
}
</style>
