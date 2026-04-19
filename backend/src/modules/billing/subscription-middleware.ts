import { FastifyReply, FastifyRequest } from 'fastify';
import { canAddZaloAccount } from './subscription-service.js';

/**
 * Middleware to check if organization has reached Zalo account limit.
 */
export async function checkZaloAccountLimit(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { orgId } = request.user as { orgId: string };
  
  const canAdd = await canAddZaloAccount(orgId);
  if (!canAdd) {
    return reply.status(403).send({
      error: 'limit_reached',
      message: 'You have reached the limit of Zalo accounts for your current plan. Please upgrade to add more.',
    });
  }
}
