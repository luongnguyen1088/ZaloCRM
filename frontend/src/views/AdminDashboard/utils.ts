
import type { Organization, SubscriptionPlan } from './types';

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value || 0);
};

export const formatToken = (value: number) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}M tokens`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}k tokens`;
  return `${value} tokens`;
};

export const formatDate = (date: string, style: 'short' | 'long' = 'short') => {
  const parsed = new Date(date);
  return parsed.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: style === 'long' ? 'long' : 'short',
    year: 'numeric',
  });
};

export const daysUntil = (date: string) => {
  const end = new Date(date);
  const now = new Date();
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
};

export const isExpiringSoon = (date?: string) => {
  if (!date) return false;
  const days = daysUntil(date);
  return days >= 0 && days <= 7;
};

export const isExpired = (date?: string) => {
  if (!date) return false;
  return daysUntil(date) < 0;
};

export const getPlanName = (org: Organization) => {
  return org.subscription?.plan?.name || 'Free';
};

export const getPlanColor = (name: string) => {
  if (name === 'Enterprise') return 'warning';
  if (name === 'Business') return 'primary';
  if (name === 'Pro') return 'info';
  return 'secondary';
};

export const getPlanTint = (name: string) => {
  if (name === 'Enterprise') return 'warning-lighten-5';
  if (name === 'Business') return 'primary-lighten-5';
  if (name === 'Pro') return 'info-lighten-5';
  return 'secondary-lighten-5';
};

export const getPlanDot = (name: string) => {
  if (name === 'Enterprise') return 'linear-gradient(135deg, #f59e0b, #f97316)';
  if (name === 'Business') return 'linear-gradient(135deg, #2563eb, #60a5fa)';
  if (name === 'Pro') return 'linear-gradient(135deg, #0ea5e9, #38bdf8)';
  return 'linear-gradient(135deg, #64748b, #94a3b8)';
};

export const getAiOverview = (org: Organization) => {
  return org.ai || {
    enabled: true,
    planName: getPlanName(org),
    periodStart: org.subscription?.currentPeriodStart || new Date().toISOString(),
    periodEnd: org.subscription?.currentPeriodEnd || new Date().toISOString(),
    maxTokens: org.subscription?.plan?.maxAiTokens || 0,
    usedTokens: 0,
    remainingTokens: org.subscription?.plan?.maxAiTokens || 0,
    usagePercent: 0,
  };
};

export const getAiUsedTokens = (org: Organization) => getAiOverview(org).usedTokens || 0;
export const getAiMaxTokens = (org: Organization) => getAiOverview(org).maxTokens || 0;
export const getAiRemainingTokens = (org: Organization) => getAiOverview(org).remainingTokens || 0;
export const getAiUsagePercent = (org: Organization) => getAiOverview(org).usagePercent || 0;
export const getAiPeriodEnd = (org: Organization) => getAiOverview(org).periodEnd || new Date().toISOString();
export const isAiEnabled = (org: Organization) => Boolean(getAiOverview(org).enabled);
export const isAiNearLimit = (org: Organization) => isAiEnabled(org) && getAiUsagePercent(org) >= 80;

export const getOwner = (org: Organization) => {
  const user = org.members?.[0]?.user;
  return {
    name: user?.fullName || 'Chưa có người phụ trách',
    email: user?.email || 'Chưa có email',
  };
};

export const getOrgStatus = (org: Organization) => {
  if (!org.subscription) return { label: 'Free', color: 'secondary', icon: 'mdi-seed-outline' };
  if (isExpired(org.subscription.currentPeriodEnd)) return { label: 'Đã hết hạn', color: 'error', icon: 'mdi-alert-circle-outline' };
  if (isExpiringSoon(org.subscription.currentPeriodEnd)) return { label: 'Sắp hết hạn', color: 'warning', icon: 'mdi-timer-sand' };
  return { label: 'Đang hoạt động', color: 'success', icon: 'mdi-check-circle-outline' };
};

export const parseFeatures = (features?: string | string[]) => {
  if (!features) return [];
  if (Array.isArray(features)) return features;
  try {
    const parsed = JSON.parse(features);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const getPlanCapacity = (plan: SubscriptionPlan) => {
  return `${plan.maxZaloAcc || 0} tài khoản Zalo • ${formatToken(plan.maxAiTokens || 0)} AI`;
};

export const getTopFeature = (plan: SubscriptionPlan) => {
  const feature = parseFeatures(plan.features)[0];
  return feature || 'Gói cơ bản cho vận hành hằng ngày';
};

export const getAiUsageStatus = (org: Organization) => {
  const percent = getAiUsagePercent(org);
  if (percent >= 100) return { label: 'Đã hết quota', color: 'error', icon: 'mdi-alert-octagon' };
  if (percent >= 80) return { label: 'Sắp hết quota', color: 'warning', icon: 'mdi-alert-circle' };
  return { label: 'Trong ngưỡng', color: 'primary', icon: 'mdi-check-circle' };
};
