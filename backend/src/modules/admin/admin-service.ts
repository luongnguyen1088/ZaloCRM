import { prisma } from '../../shared/database/prisma-client.js';
import { getApprovedTopupTokensForWindow } from '../billing/payment-order-service.js';
import { ensureDefaultSubscriptionPlans } from '../billing/subscription-plan-service.js';

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
  const topupTokens = await getApprovedTopupTokensForWindow(orgId, periodStart, periodEnd);
  const totalTokens = maxTokens + topupTokens;

  const aggregate = await prisma.aiTokenUsage.aggregate({
    where: {
      orgId,
      createdAt: { gte: periodStart, lt: periodEnd },
    },
    _sum: { tokens: true },
  });

  const usedTokens = Number(aggregate._sum.tokens ?? 0);
  const remainingTokens = Math.max(0, totalTokens - usedTokens);
  const usagePercent = totalTokens > 0 ? Math.min(100, Math.round((usedTokens / totalTokens) * 100)) : 0;

  // Calculate Premium Token Entitlement (Claro 2.0: Business gets 800k, Enterprise gets 5M)
  let premiumLimit = 0;
  if (subscription?.plan.name === 'Business') premiumLimit = 800000;
  else if (subscription?.plan.name === 'Enterprise') premiumLimit = 5000000;

  // Query premium usage
  const premiumAggregate = await prisma.aiTokenUsage.aggregate({
    where: {
      orgId,
      createdAt: { gte: periodStart, lt: periodEnd },
      model: { contains: 'sonnet' },
    },
    _sum: { tokens: true },
  });
  const usedPremiumTokens = Number(premiumAggregate._sum.tokens ?? 0);
  const remainingPremiumTokens = Math.max(0, premiumLimit - usedPremiumTokens);

  return {
    enabled: input?.aiConfig?.enabled ?? true,
    planName: subscription?.plan.name ?? 'Free',
    periodStart,
    periodEnd,
    maxTokens: totalTokens,
    baseTokens: maxTokens,
    topupTokens,
    usedTokens,
    remainingTokens,
    usagePercent,
    premiumLimit,
    usedPremiumTokens,
    remainingPremiumTokens,
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
  const current = await prisma.subscription.findUnique({
    where: { orgId },
  });
  const startDate = current?.currentPeriodEnd && current.currentPeriodEnd > now
    ? current.currentPeriodEnd
    : now;
  const end = new Date(startDate);
  end.setMonth(end.getMonth() + months);

  return await prisma.subscription.upsert({
    where: { orgId },
    create: {
      orgId,
      planId,
      status: 'active',
      currentPeriodStart: startDate,
      currentPeriodEnd: end,
    },
    update: {
      planId,
      status: 'active',
      currentPeriodStart: startDate,
      currentPeriodEnd: end,
    },
  });
}

export async function getSubscriptionPlans() {
  await ensureDefaultSubscriptionPlans();
  return await prisma.subscriptionPlan.findMany({
    orderBy: { priceMonth: 'asc' }
  });
}
