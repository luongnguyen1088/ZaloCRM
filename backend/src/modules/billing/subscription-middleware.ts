import { FastifyReply, FastifyRequest } from 'fastify';
import { canAddChannel } from './subscription-service.js';

/**
 * Middleware to check if organization has reached total connection limit.
 */
export async function checkChannelLimit(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { orgId } = request.user as { orgId: string };
  
  const canAdd = await canAddChannel(orgId);
  if (!canAdd) {
    return reply.status(403).send({
      error: 'limit_reached',
      message: 'Bạn đã đạt giới hạn số lượng kênh kết nối cho gói cước hiện tại. Vui lòng nâng cấp để thêm mới.',
    });
  }
}

/**
 * Kept for backward compatibility.
 */
export const checkZaloAccountLimit = checkChannelLimit;
export const checkFacebookAccountLimit = checkChannelLimit;
