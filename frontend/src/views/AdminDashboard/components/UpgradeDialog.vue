
<template>
  <v-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" max-width="920">
    <v-card class="upgrade-dialog">
      <div class="upgrade-dialog__hero pa-6 pa-md-7">
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
                <strong>{{ option.label }}</strong>
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
  { value: 1, label: '1 tháng', hint: 'Kích hoạt nhanh' },
  { value: 3, label: '3 tháng', hint: 'Chu kỳ ngắn' },
  { value: 6, label: '6 tháng', hint: 'Ổn định hơn' },
  { value: 12, label: '12 tháng', hint: 'Giảm tần suất gia hạn' },
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
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
  background: linear-gradient(135deg, #0f172a, #13203b 58%, #1d4ed8);
  color: #fff;
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
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: 22px;
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.plan-option:hover, .duration-option:hover {
  transform: translateY(-1px);
  border-color: var(--color-primary-soft-strong);
}

.plan-option--active, .duration-option--active {
  border-color: var(--color-primary) !important;
  background: linear-gradient(180deg, var(--color-primary-soft), var(--color-surface-elevated));
  box-shadow: 0 0 0 1px var(--color-primary-soft-strong);
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
    radial-gradient(circle at top right, rgba(37, 99, 235, 0.1), transparent 36%),
    var(--color-surface-elevated) !important;
  border-radius: 28px !important;
  border: 1px solid var(--color-border) !important;
  box-shadow: var(--shadow-sm);
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
