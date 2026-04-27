import { prisma } from '../../shared/database/prisma-client.js';

const DEFAULT_SUBSCRIPTION_PLANS = [
  {
    name: 'Free',
    priceMonth: 0,
    maxZaloAcc: 1,
    maxAiTokens: 50000,
    features: ['CRM cơ bản', '1 tài khoản Zalo', 'AI Assistant (Model cơ bản)', '~30 lượt phản hồi AI/tháng'],
  },
  {
    name: 'Pro',
    priceMonth: 200000,
    maxZaloAcc: 5,
    maxAiTokens: 1500000,
    features: ['Đầy đủ CRM', '5 tài khoản Zalo', 'AI Assistant (Tốc độ cao)', 'Automation', '~1,000 lượt phản hồi AI/tháng'],
  },
  {
    name: 'Enterprise',
    priceMonth: 1000000,
    maxZaloAcc: 50,
    maxAiTokens: 15000000,
    features: ['Vô hạn CRM', '50 tài khoản Zalo', 'AI Assistant (Claude 3.5 Sonnet)', 'Ưu tiên hỗ trợ', '~10,000 lượt phản hồi AI/tháng'],
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

