import type { FastifyInstance } from 'fastify';
import { authMiddleware } from '../../auth/auth-middleware.js';
import * as service from './knowledge-service.js';

export async function knowledgeRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authMiddleware);

  fastify.get('/', async (request) => {
    const orgId = request.user!.orgId;
    return service.getAiKnowledgeList(orgId);
  });

  fastify.post('/', async (request: any) => {
    const orgId = request.user!.orgId;
    return service.createAiKnowledge(orgId, request.body);
  });

  fastify.put('/:id', async (request: any) => {
    const orgId = request.user!.orgId;
    const { id } = request.params;
    return service.updateAiKnowledge(orgId, id, request.body);
  });

  fastify.delete('/:id', async (request: any) => {
    const orgId = request.user!.orgId;
    const { id } = request.params;
    await service.deleteAiKnowledge(orgId, id);
    return { success: true };
  });
}
