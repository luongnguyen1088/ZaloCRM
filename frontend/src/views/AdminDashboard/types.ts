
export type SortOption = 'Ưu tiên sắp hết hạn' | 'Mới tạo gần đây' | 'Nhiều thành viên nhất' | 'Dùng AI nhiều nhất' | 'Tên A-Z';
export type StatusFilter = 'Tất cả trạng thái' | 'Sắp hết hạn' | 'Đã hết hạn' | 'Đang trả phí' | 'Free' | 'AI gần hết quota';

export interface SubscriptionPlan {
  id: string;
  name: string;
  priceMonth: number;
  maxZaloAcc?: number;
  maxAiTokens?: number;
  features?: string | string[];
}

export interface OrganizationMember {
  user?: {
    email?: string;
    fullName?: string;
  };
}

export interface Subscription {
  planId: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  status?: string;
  plan: SubscriptionPlan;
}

export interface AiOverview {
  enabled: boolean;
  planName: string;
  periodStart: string;
  periodEnd: string;
  maxTokens: number;
  usedTokens: number;
  remainingTokens: number;
  usagePercent: number;
}

export interface Organization {
  id: string;
  name: string;
  createdAt: string;
  members?: OrganizationMember[];
  subscription?: Subscription | null;
  ai?: AiOverview | null;
}

export interface SummaryCard {
  label: string;
  value: string;
  hint: string;
  badge: string;
  icon: string;
  color: string;
  tint: string;
}
