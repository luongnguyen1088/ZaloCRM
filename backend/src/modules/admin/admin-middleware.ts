import type { FastifyRequest, FastifyReply } from 'fastify';

export async function adminMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as { id: string; isSystemAdmin: boolean };
  
  if (!user || !user.isSystemAdmin) {
    return reply.status(403).send({ error: 'Access denied. Admin privileges required.' });
  }
}
