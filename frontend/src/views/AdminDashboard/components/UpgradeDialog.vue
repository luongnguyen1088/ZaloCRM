
<template>
  <v-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" max-width="920" scrollable>
    <v-card class="upgrade-dialog">
      <div class="upgrade-dialog__hero flex-shrink-0 pa-6 pa-md-7 position-relative overflow-hidden">
        <div class="upgrade-dialog__hero-bg"></div>
        <div class="upgrade-dialog__hero-content position-relative">
          <div class="upgrade-dialog__hero-copy">
            <div class="eyebrow eyebrow--light mb-2">Kích hoạt thuê bao</div>
            <h3 class="upgrade-dialog__title mb-2">
              {{ selectedOrg?.name || 'Chọn tổ chức' }}
            </h3>
            <p class="upgrade-dialog__subtitle">
              Thay đổi gói cước và cập nhật thời hạn sử dụng ngay lập tức cho tổ chức được chọn.
            </p>
          </div>

          <div v-if="selectedOrg" class="upgrade-dialog__hero-meta">
            <div class="upgrade-stat">
              <span class="upgrade-stat__label">Gói hiện tại</span>
              <strong class="upgrade-stat__value">{{ getPlanName(selectedOrg) }}</strong>
            </div>
            <div class="upgrade-stat">
              <span class="upgrade-stat__label">Gia hạn hiện tại</span>
              <strong class="upgrade-stat__value">{{ getRenewalText(selectedOrg) }}</strong>
            </div>
          </div>
        </div>
      </div>

      <v-card-text class="pa-0">
        <div class="pa-6 pa-md-7">
          <v-alert
          v-if="error"
          type="error"
          variant="tonal"
          class="mb-5 rounded-xl"
        >
          {{ error }}
        </v-alert>

        <div class="upgrade-layout">
          <div>
            <div class="dialog-section-head mb-4">
              <div class="eyebrow mb-2">Bước 1</div>
              <h4 class="dialog-section-title">Chọn gói cước áp dụng</h4>
            </div>

            <div class="plan-grid">
              <button
                v-for="plan in plans"
                :key="plan.id"
                type="button"
                :class="['plan-option', { 'plan-option--active': form.planId === plan.id }]"
                @click="form.planId = plan.id"
              >
                <div class="plan-option__top">
                  <v-chip :color="getPlanColor(plan.name)" variant="tonal" size="small" class="font-weight-bold">
                    {{ plan.name }}
                  </v-chip>
                  <v-icon v-if="form.planId === plan.id" color="primary" size="20">
                    mdi-check-circle
                  </v-icon>
                </div>

                <strong class="plan-option__price">{{ formatCurrency(plan.priceMonth) }}</strong>
                <span class="plan-option__hint">{{ getPlanCapacity(plan) }}</span>
                <span class="plan-option__hint">{{ getTopFeature(plan) }}</span>
              </button>
            </div>

            <div class="dialog-section-head mt-7 mb-4">
              <div class="eyebrow mb-2">Bước 2</div>
              <h4 class="dialog-section-title">Chọn thời gian gia hạn</h4>
            </div>

            <div class="duration-grid">
              <button
                v-for="option in durationOptions"
                :key="option.value"
                type="button"
                :class="['duration-option', { 'duration-option--active': form.months === option.value }]"
                @click="form.months = option.value"
              >
                <div class="d-flex align-center justify-space-between mb-1">
                  <strong>{{ option.label }}</strong>
                  <v-chip v-if="option.badge" color="success" size="x-small" variant="flat" class="font-weight-bold px-2">
                    {{ option.badge }}
                  </v-chip>
                </div>
                <span>{{ option.hint }}</span>
              </button>
            </div>
          </div>

          <v-card class="upgrade-summary pa-5 pa-md-6" rounded="xl">
            <div class="eyebrow mb-2">Tóm tắt cập nhật</div>
            <h4 class="dialog-section-title mb-5">Subscription preview</h4>

            <div class="summary-stack">
              <div class="summary-row">
                <span>Tổ chức</span>
                <strong>{{ selectedOrg?.name || '—' }}</strong>
              </div>
              <div class="summary-row">
                <span>Gói mới</span>
                <strong>{{ selectedPlan?.name || '—' }}</strong>
              </div>
              <div class="summary-row">
                <span>Giá trị tháng</span>
                <strong>{{ formatCurrency(selectedPlan?.priceMonth || 0) }}</strong>
              </div>
              <div class="summary-row">
                <span>Gia hạn thêm</span>
                <strong>{{ form.months }} tháng</strong>
              </div>
              <div class="summary-row">
                <span>Ngày hết hạn mới</span>
                <strong>{{ previewExpiryDate }}</strong>
              </div>
            </div>

            <div v-if="selectedPlan" class="summary-callout mt-5">
              <v-icon size="18" color="primary">mdi-sparkles</v-icon>
              <span>{{ getPlanCapacity(selectedPlan) }} • {{ getTopFeature(selectedPlan) }}</span>
            </div>

            <v-btn
              block
              size="large"
              color="primary"
              variant="flat"
              rounded="xl"
              class="mt-6"
              :loading="loading"
              :disabled="!selectedOrg || !form.planId"
              @click="handleConfirm"
            >
              Xác nhận kích hoạt
            </v-btn>

            <v-btn
              block
              variant="text"
              rounded="xl"
              class="mt-3"
              @click="$emit('update:modelValue', false)"
            >
              Đóng
            </v-btn>
          </v-card>
        </div>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { Organization, SubscriptionPlan } from '../types';
import { 
  getPlanName, getPlanColor, formatCurrency, getPlanCapacity, getTopFeature, formatDate 
} from '../utils';

const props = defineProps<{
  modelValue: boolean;
  selectedOrg: Organization | null;
  plans: SubscriptionPlan[];
  loading?: boolean;
  error?: string | null;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'confirm', form: { planId: string; months: number }): void;
}>();

const durationOptions = [
  { value: 1, label: '1 tháng', hint: 'Kích hoạt nhanh', badge: null },
  { value: 3, label: '3 tháng', hint: 'Chu kỳ ngắn', badge: null },
  { value: 6, label: '6 tháng', hint: 'Ổn định hơn', badge: 'Tặng 10%' },
  { value: 12, label: '12 tháng', hint: 'Giảm tần suất', badge: 'Tặng 20%' },
];

const form = ref({
  planId: '',
  months: 1,
});

const selectedPlan = computed(() => {
  return props.plans.find((p) => p.id === form.value.planId) || null;
});

const previewExpiryDate = computed(() => {
  if (!props.selectedOrg) return '—';
  const now = new Date();
  const currentEnd = props.selectedOrg.subscription?.currentPeriodEnd ? new Date(props.selectedOrg.subscription.currentPeriodEnd) : null;
  const startDate = currentEnd && currentEnd > now ? currentEnd : now;
  const futureDate = new Date(startDate);
  futureDate.setMonth(futureDate.getMonth() + form.value.months);
  return formatDate(futureDate.toISOString(), 'long');
});

const getRenewalText = (org: Organization) => {
  if (!org.subscription) return 'Chưa kích hoạt';
  return formatDate(org.subscription.currentPeriodEnd, 'short');
};

watch(() => props.selectedOrg, (newOrg) => {
  if (newOrg) {
    form.value.planId = newOrg.subscription?.planId || props.plans[0]?.id || '';
    form.value.months = 1;
  }
}, { immediate: true });

const handleConfirm = () => {
  emit('confirm', { ...form.value });
};
</script>

<style scoped>
.upgrade-dialog {
  overflow: hidden;
  border-radius: 32px !important;
  border: 1px solid var(--color-border) !important;
}

.upgrade-dialog__hero {
  background: linear-gradient(135deg, #0f172a, #13203b 58%, #1d4ed8);
  color: #fff;
}

.upgrade-dialog__hero-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(29, 78, 216, 0.8));
}

.upgrade-dialog__hero-bg::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle at 30% 50%, rgba(56, 189, 248, 0.15) 0%, transparent 50%),
              radial-gradient(circle at 70% 30%, rgba(99, 102, 241, 0.2) 0%, transparent 50%);
  animation: bgPulse 12s ease-in-out infinite alternate;
}

@keyframes bgPulse {
  0% { transform: scale(1) translate(0, 0); }
  100% { transform: scale(1.1) translate(-2%, 2%); }
}

.upgrade-dialog__hero-content {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
  width: 100%;
}

.upgrade-dialog__hero-copy {
  min-width: 0;
}

.upgrade-dialog__title {
  color: #fff;
  font-size: clamp(1.65rem, 3vw, 2.2rem);
  font-weight: 900;
  letter-spacing: -0.03em;
  margin: 0;
}

.upgrade-dialog__subtitle {
  max-width: 560px;
  color: rgba(255, 255, 255, 0.78);
  font-size: 1rem;
  line-height: 1.75;
}

.upgrade-dialog__hero-meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(150px, 1fr));
  gap: 12px;
  width: min(360px, 100%);
}

.upgrade-stat {
  padding: 16px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  backdrop-filter: blur(14px);
}

.upgrade-stat__label {
  display: block;
  color: rgba(255, 255, 255, 0.68);
  font-size: 0.8rem;
  font-weight: 700;
}

.upgrade-stat__value {
  display: block;
  margin-top: 8px;
  font-size: 1.08rem;
  font-weight: 900;
}

.upgrade-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(280px, 0.95fr);
  gap: 22px;
}

.plan-grid, .duration-grid {
  display: grid;
  gap: 14px;
}

.plan-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.duration-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.plan-option, .duration-option {
  padding: 18px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 22px;
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  overflow: hidden;
}

.plan-option:hover, .duration-option:hover {
  transform: translateY(-2px);
  border-color: var(--color-primary-soft-strong);
  box-shadow: 0 8px 24px -8px rgba(var(--v-theme-primary), 0.15);
}

.plan-option--active, .duration-option--active {
  border-color: var(--color-primary) !important;
  background: linear-gradient(145deg, var(--color-surface), var(--color-primary-soft));
  box-shadow: 0 0 0 2px var(--color-primary) !important;
}

.plan-option--active::before, .duration-option--active::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at top right, rgba(var(--v-theme-primary), 0.1), transparent 70%);
  pointer-events: none;
}

.plan-option__price, .duration-option strong {
  display: block;
  color: var(--color-text);
  font-size: 1.05rem;
  font-weight: 850;
}

.plan-option__hint, .duration-option span {
  display: block;
  margin-top: 8px;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  line-height: 1.5;
}

.plan-option__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.upgrade-summary {
  align-self: start;
  background:
    radial-gradient(circle at top right, rgba(var(--v-theme-primary), 0.08), transparent 40%),
    var(--color-surface) !important;
  border-radius: 28px !important;
  border: 1px solid var(--color-border) !important;
  box-shadow: 0 12px 32px -12px rgba(0, 0, 0, 0.08);
  position: sticky;
  top: 24px;
}

.summary-stack {
  display: grid;
  gap: 12px;
}

.summary-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-border);
}

.summary-row span {
  color: var(--color-text-secondary);
  font-size: 0.92rem;
}

.summary-row strong {
  color: var(--color-text);
  font-size: 0.96rem;
  font-weight: 850;
  text-align: right;
}

.summary-callout {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px 16px;
  background: var(--color-primary-soft);
  border: 1px solid var(--color-primary-soft-strong);
  border-radius: 18px;
  color: var(--color-primary-strong);
  font-size: 0.95rem;
  line-height: 1.6;
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--color-primary-strong);
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.eyebrow--light {
  color: rgba(255, 255, 255, 0.76);
}

.dialog-section-head {
  margin-bottom: 16px;
}

.dialog-section-title {
  color: var(--color-text);
  font-weight: 900;
  letter-spacing: -0.03em;
  margin: 0;
  font-size: 1.25rem;
}

@media (max-width: 1200px) {
  .upgrade-layout {
    grid-template-columns: 1fr;
  }
  .plan-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .upgrade-dialog__hero {
    padding: 22px !important;
    flex-direction: column;
    align-items: flex-start;
  }
  .upgrade-dialog__hero-meta {
    grid-template-columns: 1fr;
    width: 100%;
  }
  .plan-grid, .duration-grid {
    grid-template-columns: 1fr;
  }
  .summary-row {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
