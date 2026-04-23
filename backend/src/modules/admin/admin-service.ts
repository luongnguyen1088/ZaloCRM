import { prisma } from '../../shared/database/prisma-client.js';

const FALLBACK_AI_TOKENS = 100000;

function getBillingPeriodFallback() {
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { periodStart, periodEnd };
}

async function getOrganizationAiOverview(orgId: string, input?: {
  subscription?: {
    status?: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    plan: { name: string; maxAiTokens: number };
  } | null;
  aiConfig?: { enabled: boolean } | null;
}) {
  const fallback = getBillingPeriodFallback();
  const subscription = input?.subscription;
  const periodStart = subscription?.currentPeriodStart ?? fallback.periodStart;
  const periodEnd = subscription?.currentPeriodEnd ?? fallback.periodEnd;
  const maxTokens = subscription?.status === 'active'
    ? subscription.plan.maxAiTokens
    : FALLBACK_AI_TOKENS;

  const aggregate = await prisma.aiCreditUsage.aggregate({
    where: {
      orgId,
      createdAt: { gte: periodStart, lt: periodEnd },
    },
    _sum: { credits: true },
  });

  const usedTokens = Number(aggregate._sum.credits ?? 0);
  const remainingTokens = Math.max(0, maxTokens - usedTokens);
  const usagePercent = maxTokens > 0 ? Math.min(100, Math.round((usedTokens / maxTokens) * 100)) : 0;

  return {
    enabled: input?.aiConfig?.enabled ?? true,
    planName: subscription?.plan.name ?? 'Free',
    periodStart,
    periodEnd,
    maxTokens,
    usedTokens,
    remainingTokens,
    usagePercent,
  };
}

export async function getAllOrganizations() {
  const organizations = await prisma.organization.findMany({
    include: {
      subscription: {
        include: { plan: true }
      },
      aiConfig: {
        select: { enabled: true }
      },
      members: {
        include: {
          user: {
            select: { email: true, fullName: true }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return await Promise.all(
    organizations.map(async (organization: any) => ({
      ...organization,
      ai: await getOrganizationAiOverview(organization.id, {
        subscription: organization.subscription ? {
          status: organization.subscription.status,
          currentPeriodStart: organization.subscription.currentPeriodStart,
          currentPeriodEnd: organization.subscription.currentPeriodEnd,
          plan: {
            name: organization.subscription.plan.name,
            maxAiTokens: organization.subscription.plan.maxAiTokens,
          },
        } : null,
        aiConfig: organization.aiConfig,
      }),
    })),
  );
}

export async function updateOrgSubscription(orgId: string, planId: string, months: number = 1) {
  const now = new Date();
  const end = new Date();
  end.setMonth(now.getMonth() + months);

  return await prisma.subscription.upsert({
    where: { orgId },
    create: {
      orgId,
      planId,
      status: 'active',
      currentPeriodStart: now,
      currentPeriodEnd: end,
    },
    update: {
      planId,
      status: 'active',
      currentPeriodStart: now,
      currentPeriodEnd: end,
    },
  });
}

export async function getSubscriptionPlans() {
  return await prisma.subscriptionPlan.findMany({
    orderBy: { priceMonth: 'asc' }
  });
}
