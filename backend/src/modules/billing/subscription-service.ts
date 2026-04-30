import { prisma } from '../../shared/database/prisma-client.js';
import { logger } from '../../shared/utils/logger.js';

export async function getOrgSubscription(orgId: string) {
  return await prisma.subscription.findUnique({
    where: { orgId },
    include: { plan: true },
  });
}

/**
 * Check if the organization can add more channels (Zalo or Facebook) based on their plan.
 */
export async function canAddChannel(orgId: string): Promise<boolean> {
  const sub = await getOrgSubscription(orgId);
  const limit = sub?.plan.maxZaloAcc ?? 1;

  const totalCount = await prisma.zaloAccount.count({ 
    where: { orgId } 
  });
  
  return totalCount < limit;
}

/**
 * Kept for backward compatibility but using unified logic.
 */
export async function canAddZaloAccount(orgId: string): Promise<boolean> {
  return canAddChannel(orgId);
}

/**
 * Kept for backward compatibility but using unified logic.
 */
export async function canAddFacebookAccount(orgId: string): Promise<boolean> {
  return canAddChannel(orgId);
}

/**
 * Update or create organization subscription.
 */
export async function subscribe(orgId: string, planId: string, months: number = 1) {
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
