import type { FastifyInstance } from 'fastify';
import { authMiddleware } from '../auth/auth-middleware.js';
import { prisma } from '../../shared/database/prisma-client.js';
import { getOrgSubscription } from './subscription-service.js';

export async function subscriptionRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authMiddleware);

  // GET /api/v1/billing/subscription — get current org subscription
  app.get('/api/v1/billing/subscription', async (request) => {
    const { orgId } = request.user as { orgId: string };
    return await getOrgSubscription(orgId);
  });

  // GET /api/v1/billing/plans — list available plans
  app.get('/api/v1/billing/plans', async () => {
    return await prisma.subscriptionPlan.findMany({
      orderBy: { priceMonth: 'asc' },
    });
  });
}
