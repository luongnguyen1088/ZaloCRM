import { randomBytes } from 'node:crypto';
import { prisma } from '../../shared/database/prisma-client.js';

const FALLBACK_AI_TOKENS = 100000;

export type PaymentOrderType = 'subscription_upgrade' | 'ai_topup';
export type PaymentOrderStatus = 'pending' | 'approved' | 'rejected';

function buildReferenceCode() {
  const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
  const suffix = randomBytes(3).toString('hex').toUpperCase();
  return `PO-${timestamp}-${suffix}`;
}

function getFallbackBillingWindow() {
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { periodStart, periodEnd };
}

async function getBillingWindowForOrg(tx: any, orgId: string) {
  const subscription = await tx.subscription.findUnique({
    where: { orgId },
    include: { plan: true },
  });

  if (!subscription) {
    const fallback = getFallbackBillingWindow();
    return {
      planName: 'Free',
      periodStart: fallback.periodStart,
      periodEnd: fallback.periodEnd,
      maxTokens: FALLBACK_AI_TOKENS,
    };
  }

  return {
    planName: subscription.plan.name,
    periodStart: subscription.currentPeriodStart,
    periodEnd: subscription.currentPeriodEnd,
    maxTokens: subscription.status === 'active' ? subscription.plan.maxAiTokens : FALLBACK_AI_TOKENS,
  };
}

export async function getApprovedTopupTokensForWindow(orgId: string, periodStart: Date, periodEnd: Date) {
  const aggregate = await prisma.paymentOrder.aggregate({
    where: {
      orgId,
      orderType: 'ai_topup',
      status: 'approved',
      tokenAmount: { not: null },
      effectiveFrom: { lt: periodEnd },
      effectiveTo: { gt: periodStart },
    },
    _sum: { tokenAmount: true },
  });

  return aggregate._sum.tokenAmount ?? 0;
}

export async function createPaymentOrder(input: {
  orgId: string;
  requestedByUserId?: string;
  requestedByEmail?: string;
  orderType: PaymentOrderType;
  planId?: string;
  planName?: string;
  months?: number;
  tokenAmount?: number;
  amount: number;
  currency?: string;
  paymentContent?: string;
  customerNote?: string;
  metadata?: Record<string, unknown>;
}) {
  if (input.orderType === 'subscription_upgrade' && !input.planId) {
    throw new Error('planId is required for subscription upgrade orders');
  }

  if (input.orderType === 'ai_topup' && !input.tokenAmount) {
    throw new Error('tokenAmount is required for AI top-up orders');
  }

  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error('amount must be greater than zero');
  }

  return await prisma.paymentOrder.create({
    data: {
      orgId: input.orgId,
      requestedByUserId: input.requestedByUserId,
      requestedByEmail: input.requestedByEmail,
      orderType: input.orderType,
      status: 'pending',
      planId: input.planId,
      planName: input.planName,
      months: input.orderType === 'subscription_upgrade' ? input.months || 1 : null,
      tokenAmount: input.orderType === 'ai_topup' ? input.tokenAmount : null,
      amount: input.amount,
      currency: input.currency || 'VND',
      paymentContent: input.paymentContent,
      customerNote: input.customerNote,
      referenceCode: buildReferenceCode(),
      metadata: (input.metadata || {}) as any,
    },
  });
}

export async function listPaymentOrders(filters: {
  orgId?: string;
  status?: PaymentOrderStatus | 'all';
  orderType?: PaymentOrderType | 'all';
  search?: string;
  limit?: number;
}) {
  const where: any = {};

  if (filters.orgId) where.orgId = filters.orgId;
  if (filters.status && filters.status !== 'all') where.status = filters.status;
  if (filters.orderType && filters.orderType !== 'all') where.orderType = filters.orderType;

  if (filters.search?.trim()) {
    const query = filters.search.trim();
    where.OR = [
      { referenceCode: { contains: query, mode: 'insensitive' } },
      { requestedByEmail: { contains: query, mode: 'insensitive' } },
      { paymentContent: { contains: query, mode: 'insensitive' } },
      { planName: { contains: query, mode: 'insensitive' } },
      { org: { name: { contains: query, mode: 'insensitive' } } },
    ];
  }

  return await prisma.paymentOrder.findMany({
    where,
    include: {
      org: {
        select: { id: true, name: true },
      },
    },
    orderBy: [
      { createdAt: 'desc' },
    ],
    take: filters.limit || 100,
  });
}

export async function approvePaymentOrder(orderId: string, reviewer: { id: string; email: string }, adminNote?: string) {
  return await prisma.$transaction(async (tx: any) => {
    const order = await tx.paymentOrder.findUnique({
      where: { id: orderId },
      include: {
        org: {
          select: { id: true, name: true },
        },
      },
    });

    if (!order) {
      throw new Error('Payment order not found');
    }

    if (order.status !== 'pending') {
      throw new Error('Only pending orders can be approved');
    }

    const reviewedAt = new Date();

    if (order.orderType === 'subscription_upgrade') {
      const current = await tx.subscription.findUnique({
        where: { orgId: order.orgId },
      });

      const startDate = current?.currentPeriodEnd && current.currentPeriodEnd > reviewedAt
        ? current.currentPeriodEnd
        : reviewedAt;

      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + (order.months || 1));

      await tx.subscription.upsert({
        where: { orgId: order.orgId },
        create: {
          orgId: order.orgId,
          planId: order.planId,
          status: 'active',
          currentPeriodStart: startDate,
          currentPeriodEnd: endDate,
        },
        update: {
          planId: order.planId,
          status: 'active',
          currentPeriodStart: startDate,
          currentPeriodEnd: endDate,
        },
      });

      return await tx.paymentOrder.update({
        where: { id: orderId },
        data: {
          status: 'approved',
          reviewedByUserId: reviewer.id,
          reviewedByEmail: reviewer.email,
          reviewedAt,
          approvedAt: reviewedAt,
          effectiveFrom: startDate,
          effectiveTo: endDate,
          adminNote,
        },
        include: {
          org: {
            select: { id: true, name: true },
          },
        },
      });
    }

    const billingWindow = await getBillingWindowForOrg(tx, order.orgId);

    return await tx.paymentOrder.update({
      where: { id: orderId },
      data: {
        status: 'approved',
        reviewedByUserId: reviewer.id,
        reviewedByEmail: reviewer.email,
        reviewedAt,
        approvedAt: reviewedAt,
        effectiveFrom: reviewedAt,
        effectiveTo: billingWindow.periodEnd,
        adminNote,
      },
      include: {
        org: {
          select: { id: true, name: true },
        },
      },
    });
  });
}

export async function rejectPaymentOrder(orderId: string, reviewer: { id: string; email: string }, adminNote?: string) {
  const order = await prisma.paymentOrder.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new Error('Payment order not found');
  }

  if (order.status !== 'pending') {
    throw new Error('Only pending orders can be rejected');
  }

  return await prisma.paymentOrder.update({
    where: { id: orderId },
    data: {
      status: 'rejected',
      reviewedByUserId: reviewer.id,
      reviewedByEmail: reviewer.email,
      reviewedAt: new Date(),
      adminNote,
    },
    include: {
      org: {
        select: { id: true, name: true },
      },
    },
  });
}
