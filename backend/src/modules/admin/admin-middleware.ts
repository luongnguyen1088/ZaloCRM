import type { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../../shared/database/prisma-client.js';

export async function adminMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user as any;
  
  if (!user) {
    return reply.status(401).send({ error: 'Unauthorized' });
  }

  // If JWT says admin, we trust it
  if (user.isSystemAdmin) {
    return;
  }

  // Fallback: Check DB in case JWT is stale (recently promoted)
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { isSystemAdmin: true }
  });

  if (!dbUser || !dbUser.isSystemAdmin) {
    return reply.status(403).send({ error: 'Access denied. Admin privileges required.' });
  }

  // Update request.user for subsequent handlers
  user.isSystemAdmin = true;
}
