import { prisma } from '../../shared/database/prisma-client.js';

const DEFAULT_SUBSCRIPTION_PLANS = [
  {
    name: 'Free',
    priceMonth: 0,
    maxZaloAcc: 1,
    maxAiTokens: 150000,
    features: ['CRM cơ bản', '1 tài khoản Zalo/Facebook', '150,000 Tokens AI (Haiku/Flash)', 'Hỗ trợ cộng đồng'],
  },
  {
    name: 'Pro',
    priceMonth: 250000,
    maxZaloAcc: 5,
    maxAiTokens: 2500000,
    features: ['Đầy đủ CRM & Automation', '5 tài khoản Zalo/Facebook', '2,500,000 Tokens AI (Haiku/Flash)', 'Ưu tiên hỗ trợ 24/7'],
  },
  {
    name: 'Business',
    priceMonth: 650000,
    maxZaloAcc: 12,
    maxAiTokens: 8000000,
    features: ['Tính năng Business nâng cao', '12 tài khoản Zalo/Facebook', '8,000,000 Tokens AI', 'Bao gồm 800k Premium Tokens (Sonnet)', 'Quản lý Team & Phân quyền'],
  },
  {
    name: 'Enterprise',
    priceMonth: 2000000,
    maxZaloAcc: 50,
    maxAiTokens: 30000000,
    features: ['Giải pháp Enterprise toàn diện', '50 tài khoản Zalo/Facebook', '30,000,000 Tokens AI', 'Bao gồm 5M Premium Tokens (Sonnet)', 'Dedicated account manager', 'API Access & Webhooks'],
  },
];

export async function ensureDefaultSubscriptionPlans() {
  await Promise.all(
    DEFAULT_SUBSCRIPTION_PLANS.map((plan) =>
      prisma.subscriptionPlan.upsert({
        where: { name: plan.name },
        update: {
          priceMonth: plan.priceMonth,
          maxZaloAcc: plan.maxZaloAcc,
          maxAiTokens: plan.maxAiTokens,
          features: plan.features,
        },
        create: {
          name: plan.name,
          priceMonth: plan.priceMonth,
          maxZaloAcc: plan.maxZaloAcc,
          maxAiTokens: plan.maxAiTokens,
          features: plan.features,
        },
      }),
    ),
  );
}
