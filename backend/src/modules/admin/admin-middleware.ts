import type { FastifyRequest, FastifyReply } from 'fastify';

export async function adminMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as any;
  
  if (!user || !user.isSystemAdmin) {
    return reply.status(403).send({ error: 'Access denied. Admin privileges required.' });
  }
}
