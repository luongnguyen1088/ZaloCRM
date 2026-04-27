import type { FastifyInstance } from 'fastify';
import { authMiddleware } from '../auth/auth-middleware.js';
import { prisma } from '../../shared/database/prisma-client.js';
import { getOrgSubscription } from './subscription-service.js';
import * as paymentOrderService from './payment-order-service.js';
import { ensureDefaultSubscriptionPlans } from './subscription-plan-service.js';

export async function subscriptionRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authMiddleware);

  // GET /api/v1/billing/subscription — get current org subscription
  app.get('/api/v1/billing/subscription', async (request) => {
    const { orgId } = request.user as { orgId: string };
    return await getOrgSubscription(orgId);
  });

  // GET /api/v1/billing/plans — list available plans
  app.get('/api/v1/billing/plans', async () => {
    await ensureDefaultSubscriptionPlans();
    return await prisma.subscriptionPlan.findMany({
      orderBy: { priceMonth: 'asc' },
    });
  });

  // GET /api/v1/billing/orders — list current org payment orders
  app.get('/api/v1/billing/orders', async (request) => {
    const { orgId } = request.user as { orgId: string };
    const { status, orderType } = request.query as {
      status?: paymentOrderService.PaymentOrderStatus | 'all';
      orderType?: paymentOrderService.PaymentOrderType | 'all';
    };

    return await paymentOrderService.listPaymentOrders({
      orgId,
      status: status || 'all',
      orderType: orderType || 'all',
      limit: 30,
    });
  });

  // POST /api/v1/billing/orders — create a payment order after customer confirms transfer
  app.post('/api/v1/billing/orders', async (request, reply) => {
    const { orgId, id, email } = request.user as { orgId: string; id: string; email: string };
    const body = request.body as {
      orderType?: paymentOrderService.PaymentOrderType;
      planId?: string;
      planName?: string;
      months?: number;
      tokenAmount?: number;
      amount?: number;
      paymentContent?: string;
      customerNote?: string;
      metadata?: Record<string, unknown>;
    };

    if (!body.orderType) {
      return reply.status(400).send({ error: 'orderType is required' });
    }

    try {
      const order = await paymentOrderService.createPaymentOrder({
        orgId,
        requestedByUserId: id,
        requestedByEmail: email,
        orderType: body.orderType,
        planId: body.planId,
        planName: body.planName,
        months: body.months,
        tokenAmount: body.tokenAmount,
        amount: Number(body.amount || 0),
        paymentContent: body.paymentContent,
        customerNote: body.customerNote,
        metadata: body.metadata,
      });

      return {
        id: order.id,
        referenceCode: order.referenceCode,
        status: order.status,
      };
    } catch (err: any) {
      return reply.status(400).send({ error: err.message || 'Failed to create payment order' });
    }
  });
}
