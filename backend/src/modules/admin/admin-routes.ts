import type { FastifyInstance } from 'fastify';
import { authMiddleware } from '../auth/auth-middleware.js';
import { adminMiddleware } from './admin-middleware.js';
import * as adminService from './admin-service.js';

export async function adminRoutes(app: FastifyInstance): Promise<void> {
  // Apply both auth and admin check
  app.addHook('preHandler', authMiddleware);
  app.addHook('preHandler', adminMiddleware);

  // GET /api/v1/admin/organizations
  app.get('/api/v1/admin/organizations', async () => {
    return await adminService.getAllOrganizations();
  });

  // GET /api/v1/admin/plans
  app.get('/api/v1/admin/plans', async () => {
    return await adminService.getSubscriptionPlans();
  });

  // POST /api/v1/admin/organizations/:orgId/subscribe
  app.post('/api/v1/admin/organizations/:orgId/subscribe', async (request, reply) => {
    const { orgId } = request.params as { orgId: string };
    const { planId, months } = request.body as { planId: string; months?: number };

    if (!planId) {
      return reply.status(400).send({ error: 'planId is required' });
    }

    try {
      const result = await adminService.updateOrgSubscription(orgId, planId, months || 1);
      return { message: 'Subscription updated successfully', data: result };
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });
}
