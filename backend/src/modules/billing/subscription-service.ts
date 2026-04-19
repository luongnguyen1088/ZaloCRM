import { prisma } from '../../shared/database/prisma-client.js';
import { logger } from '../../shared/utils/logger.js';

export async function getOrgSubscription(orgId: string) {
  return await prisma.subscription.findUnique({
    where: { orgId },
    include: { plan: true },
  });
}

/**
 * Check if the organization can add more Zalo accounts based on their plan.
 */
export async function canAddZaloAccount(orgId: string): Promise<boolean> {
  const sub = await getOrgSubscription(orgId);
  if (!sub) {
    // Default to free limits if no subscription record found
    const zaloCount = await prisma.zaloAccount.count({ where: { orgId } });
    return zaloCount < 1; 
  }

  const zaloCount = await prisma.zaloAccount.count({ where: { orgId } });
  return zaloCount < sub.plan.maxZaloAcc;
}

/**
 * Update or create organization subscription.
 */
export async function subscribe(orgId: string, planId: string, months: number = 1) {
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
