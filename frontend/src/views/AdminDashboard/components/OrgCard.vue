
<template>
  <v-card class="org-card pa-5 pa-md-6 mb-4">
    <div class="org-card__header">
      <div class="org-card__identity">
        <v-avatar size="52" rounded="xl" :color="getPlanTint(getPlanName(org))">
          <span class="org-card__initial">{{ getOrgInitial(org.name) }}</span>
        </v-avatar>

        <div class="org-card__identity-copy">
          <div class="org-card__title-row">
            <h3 class="org-card__name">{{ org.name }}</h3>
            <v-chip
              :color="getPlanColor(getPlanName(org))"
              variant="tonal"
              size="small"
              class="font-weight-bold"
            >
              {{ getPlanName(org) }}
            </v-chip>
            <v-chip
              :color="getOrgStatus(org).color"
              variant="tonal"
              size="small"
              class="font-weight-bold"
            >
              <v-icon start size="14">{{ getOrgStatus(org).icon }}</v-icon>
              {{ getOrgStatus(org).label }}
            </v-chip>
          </div>

          <div class="org-card__subtitle">
            <span>ID {{ org.id }}</span>
            <span>Tạo {{ formatDate(org.createdAt, 'short') }}</span>
          </div>
        </div>
      </div>

      <div class="org-card__actions">
        <v-btn
          color="primary"
          variant="flat"
          prepend-icon="mdi-rocket-launch-outline"
          rounded="xl"
          class="px-5"
          @click="$emit('upgrade', org)"
        >
          Kích hoạt gói
        </v-btn>
      </div>
    </div>

    <div class="org-meta-grid my-5">
      <div class="meta-tile">
        <span class="meta-tile__label">Người phụ trách</span>
        <strong class="meta-tile__value">{{ getOwner(org).name }}</strong>
        <span class="meta-tile__hint">{{ getOwner(org).email }}</span>
      </div>

      <div class="meta-tile">
        <span class="meta-tile__label">Thành viên</span>
        <strong class="meta-tile__value">{{ org.members?.length || 0 }}</strong>
        <span class="meta-tile__hint">{{ getMemberSummary(org) }}</span>
      </div>

      <div class="meta-tile">
        <span class="meta-tile__label">Gia hạn</span>
        <strong class="meta-tile__value">{{ getRenewalText(org) }}</strong>
        <span class="meta-tile__hint">{{ getRenewalHint(org) }}</span>
      </div>

      <div class="meta-tile">
        <span class="meta-tile__label">Giá trị tháng</span>
        <strong class="meta-tile__value">{{ formatCurrency(getMonthlyValue(org)) }}</strong>
        <span class="meta-tile__hint">{{ getPlanSummary(org) }}</span>
      </div>
    </div>

    <div class="ai-insight-card mb-5">
      <div class="ai-insight-card__head">
        <div>
          <div class="eyebrow mb-2">AI Token</div>
          <div class="ai-insight-card__title">{{ formatToken(getAiRemainingTokens(org)) }} còn lại</div>
          <div class="ai-insight-card__subtitle">
            Đã dùng {{ formatToken(getAiUsedTokens(org)) }} / {{ formatToken(getAiMaxTokens(org)) }} trong chu kỳ hiện tại
          </div>
        </div>

        <div class="ai-insight-card__chips">
          <v-chip
            :color="getAiUsageStatus(org).color"
            variant="tonal"
            size="small"
            class="font-weight-bold"
          >
            <v-icon start size="14">{{ getAiUsageStatus(org).icon }}</v-icon>
            {{ getAiUsageStatus(org).label }}
          </v-chip>
          <v-chip
            :color="isAiEnabled(org) ? 'success' : 'secondary'"
            variant="flat"
            size="small"
            class="font-weight-bold"
          >
            {{ isAiEnabled(org) ? 'AI bật' : 'AI tắt' }}
          </v-chip>
        </div>
      </div>

      <v-progress-linear
        :model-value="getAiUsagePercent(org)"
        :color="getAiUsageStatus(org).color"
        bg-color="rgba(148, 163, 184, 0.18)"
        rounded
        height="10"
        class="my-4"
      />

      <div class="ai-insight-card__grid">
        <div class="ai-mini-stat">
          <span class="ai-mini-stat__label">Sử dụng</span>
          <strong class="ai-mini-stat__value">{{ getAiUsagePercent(org) }}%</strong>
        </div>
        <div class="ai-mini-stat">
          <span class="ai-mini-stat__label">Kế hoạch</span>
          <strong class="ai-mini-stat__value">{{ getAiPlanName(org) }}</strong>
        </div>
        <div class="ai-mini-stat">
          <span class="ai-mini-stat__label">Chu kỳ</span>
          <strong class="ai-mini-stat__value">{{ formatDate(getAiPeriodEnd(org), 'short') }}</strong>
        </div>
      </div>

      <div class="ai-insight-card__note">
        <v-icon size="16" color="primary">mdi-robot-outline</v-icon>
        <span>{{ getAiRecommendation(org) }}</span>
      </div>
    </div>

    <div class="org-card__footer">
      <div class="org-card__footnote">
        <v-icon size="16" color="primary">mdi-information-outline</v-icon>
        <span>{{ getRecommendation(org) }}</span>
      </div>

      <div class="org-card__tags">
        <v-chip size="small" variant="flat" class="tag-chip">
          {{ org.subscription ? 'Đã có subscription' : 'Chưa kích hoạt' }}
        </v-chip>
        <v-chip v-if="isExpiringSoon(org.subscription?.currentPeriodEnd)" size="small" color="warning" variant="tonal">
          Cần gia hạn sớm
        </v-chip>
      </div>
    </div>
  </v-card>
</template>

<script setup lang="ts">
import type { Organization } from '../types';
import { 
  getPlanTint, getPlanName, getPlanColor, getOrgStatus, formatDate, 
  getOwner, getAiRemainingTokens, getAiUsedTokens, getAiMaxTokens, 
  getAiUsageStatus, isAiEnabled, getAiUsagePercent, getAiPeriodEnd,
  formatToken, formatCurrency, isExpiringSoon
} from '../utils';

defineProps<{
  org: Organization;
}>();

defineEmits<{
  (e: 'upgrade', org: Organization): void;
}>();

const getOrgInitial = (name: string) => name.trim().charAt(0).toUpperCase();

const getMemberSummary = (org: Organization) => {
  const count = org.members?.length || 0;
  return count > 1 ? 'Bao gồm owner và cộng tác viên' : 'Hiện chỉ có 1 tài khoản quản trị';
};

const getPlanSummary = (org: Organization) => {
  const plan = org.subscription?.plan;
  if (!plan) return 'Chưa phát sinh doanh thu';
  return `${plan.maxZaloAcc || 0} tài khoản Zalo • ${formatToken(plan.maxAiTokens || 0)} AI`;
};

const getMonthlyValue = (org: Organization) => org.subscription?.plan?.priceMonth || 0;

const getRenewalText = (org: Organization) => {
  if (!org.subscription) return 'Chưa kích hoạt';
  const end = org.subscription.currentPeriodEnd;
  const days = daysUntil(end);
  if (days < 0) return 'Đã hết hạn';
  if (days <= 7) return `${days} ngày nữa`;
  return formatDate(end, 'short');
};

const getRenewalHint = (org: Organization) => {
  if (!org.subscription) return 'Nên kích hoạt gói đầu tiên';
  const days = daysUntil(org.subscription.currentPeriodEnd);
  if (days < 0) return 'Subscription đã quá hạn';
  if (days <= 7) return 'Nằm trong vùng cần gia hạn';
  return 'Thời hạn vẫn an toàn';
};

const daysUntil = (date: string) => {
  const end = new Date(date);
  const now = new Date();
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
};

const getRecommendation = (org: Organization) => {
  const end = org.subscription?.currentPeriodEnd;
  const days = end ? daysUntil(end) : null;
  
  if (!org.subscription) return 'Tổ chức chưa có gói trả phí, phù hợp để kích hoạt nhanh từ admin.';
  if (days !== null && days < 0) return 'Nên cập nhật subscription ngay để tránh gián đoạn sử dụng.';
  if (days !== null && days <= 7) return 'Tổ chức này đang gần mốc hết hạn, nên ưu tiên gia hạn trước.';
  if (isAiNearLimit(org)) return 'Quota AI đang cao, nên cân nhắc upsell hoặc nạp thêm token trước khi nhu cầu tăng đột biến.';
  if ((org.members?.length || 0) >= 5 && getPlanName(org) === 'Free') return 'Đội ngũ đã có quy mô sử dụng, đây là ứng viên upsell tốt.';
  return 'Subscription đang ổn định và không có tín hiệu rủi ro ngắn hạn.';
};

const getAiRecommendation = (org: Organization) => {
  if (!isAiEnabled(org)) return 'AI đang bị tắt ở tổ chức này, quota hiện chưa được khai thác.';
  if (getAiMaxTokens(org) <= 0) return 'Tổ chức chưa có quota AI hiệu lực trong chu kỳ hiện tại.';
  if (getAiUsagePercent(org) >= 100) return 'Đã dùng hết quota AI, nên xử lý top-up hoặc nâng gói ngay.';
  if (getAiUsagePercent(org) >= 80) return 'Đang ở vùng rủi ro cao, nên theo dõi sát trước ngày reset quota.';
  if (getAiUsedTokens(org) === 0) return 'Quota AI chưa được dùng, có thể cần onboarding hoặc kích hoạt use case rõ hơn.';
  return 'Mức tiêu thụ AI đang trong ngưỡng an toàn.';
};

const getAiPlanName = (org: Organization) => {
  return org.ai?.planName || getPlanName(org);
};

const isAiNearLimit = (org: Organization) => isAiEnabled(org) && getAiUsagePercent(org) >= 80;
</script>

<style scoped>
.org-card {
  border-radius: 28px !important;
  border: 1px solid var(--color-border) !important;
  background:
    radial-gradient(circle at top right, rgba(37, 99, 235, 0.08), transparent 24%),
    var(--color-surface-elevated) !important;
  box-shadow: var(--shadow-sm);
}

.org-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.org-card__identity {
  display: flex;
  gap: 16px;
  min-width: 0;
}

.org-card__identity-copy {
  min-width: 0;
}

.org-card__title-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.org-card__name {
  margin: 0;
  color: var(--color-text);
  font-size: 1.3rem;
  font-weight: 850;
}

.org-card__subtitle {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 10px;
  color: var(--color-text-secondary);
  font-size: 0.92rem;
  line-height: 1.5;
}

.org-card__initial {
  color: var(--color-text);
  font-size: 1.1rem;
  font-weight: 900;
}

.org-meta-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.meta-tile {
  padding: 18px;
  background: var(--color-overlay);
  border: 1px solid var(--color-border);
  border-radius: 22px;
}

.meta-tile__label {
  display: block;
  color: var(--color-text-secondary);
  font-size: 0.84rem;
  font-weight: 700;
}

.meta-tile__value {
  display: block;
  margin-top: 8px;
  color: var(--color-text);
  font-size: 1.16rem;
  font-weight: 900;
  line-height: 1.1;
}

.meta-tile__hint {
  display: block;
  margin-top: 8px;
  color: var(--color-text-secondary);
  font-size: 0.92rem;
  line-height: 1.5;
}

.ai-insight-card {
  padding: 18px 20px;
  background: linear-gradient(180deg, var(--color-primary-soft), var(--color-overlay));
  border: 1px solid var(--color-border);
  border-radius: 22px;
}

.ai-insight-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.ai-insight-card__title {
  color: var(--color-text);
  font-size: 1.35rem;
  font-weight: 900;
  line-height: 1.15;
}

.ai-insight-card__subtitle {
  margin-top: 8px;
  color: var(--color-text-secondary);
  font-size: 0.92rem;
  line-height: 1.6;
}

.ai-insight-card__chips {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.ai-insight-card__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.ai-mini-stat {
  padding: 14px;
  background: rgba(255, 255, 255, 0.42);
  border: 1px solid var(--color-border);
  border-radius: 18px;
}

.v-theme--dark .ai-mini-stat {
  background: rgba(15, 23, 42, 0.28);
}

.ai-mini-stat__label {
  display: block;
  color: var(--color-text-secondary);
  font-size: 0.8rem;
  font-weight: 700;
}

.ai-mini-stat__value {
  display: block;
  margin-top: 8px;
  color: var(--color-text);
  font-size: 1rem;
  font-weight: 850;
}

.ai-insight-card__note {
  display: inline-flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 14px;
  color: var(--color-text-secondary);
  font-size: 0.92rem;
  line-height: 1.6;
}

.org-card__footer {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.org-card__footnote {
  display: inline-flex;
  align-items: flex-start;
  gap: 8px;
  max-width: 620px;
  color: var(--color-text-secondary);
  font-size: 0.95rem;
  line-height: 1.6;
}

.org-card__tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.tag-chip {
  background: var(--color-overlay) !important;
  color: var(--color-text-secondary) !important;
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

@media (max-width: 1360px) {
  .org-meta-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .org-card {
    padding: 22px !important;
  }
  .org-card__header, .org-card__footer {
    flex-direction: column;
    align-items: flex-start;
  }
  .org-meta-grid, .ai-insight-card__grid {
    grid-template-columns: 1fr;
  }
  .org-card__actions, .org-card__actions .v-btn {
    width: 100%;
  }
  .org-card__tags {
    justify-content: flex-start;
  }
}
</style>
