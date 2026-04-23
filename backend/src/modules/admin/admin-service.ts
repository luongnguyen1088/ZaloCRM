import { prisma } from '../../shared/database/prisma-client.js';

export async function getAllOrganizations() {
  return await prisma.organization.findMany({
    include: {
      subscription: {
        include: { plan: true }
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
