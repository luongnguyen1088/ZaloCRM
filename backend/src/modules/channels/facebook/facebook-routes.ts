import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware } from '../../auth/auth-middleware.js';
import { prisma } from '../../../shared/database/prisma-client.js';
import { logger } from '../../../shared/utils/logger.js';
import { FacebookApi } from './facebook-api.js';

/**
 * Facebook account management routes.
 */
export async function facebookRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authMiddleware);

  // POST /api/v1/facebook/link-page — link a page using a token
  app.post<{ Body: { accessToken: string } }>(
    '/api/v1/facebook/link-page',
    async (request, reply) => {
      const { accessToken } = request.body;
      const user = request.user!;

      if (!accessToken) return reply.status(400).send({ error: 'Access token is required' });

      try {
        const fb = new FacebookApi(accessToken);
        const pageInfo = await fb.getPageInfo();

        const account = await prisma.zaloAccount.upsert({
          where: { zaloUid: pageInfo.id }, // We use zaloUid as generic externalId
          update: {
            orgId: user.orgId,
            ownerUserId: user.id,
            type: 'facebook_page',
            displayName: pageInfo.name,
            avatarUrl: pageInfo.picture?.data?.url,
            status: 'connected',
            platformConfig: { accessToken },
            lastConnectedAt: new Date(),
          },
          create: {
            orgId: user.orgId,
            ownerUserId: user.id,
            type: 'facebook_page',
            zaloUid: pageInfo.id,
            displayName: pageInfo.name,
            avatarUrl: pageInfo.picture?.data?.url,
            status: 'connected',
            platformConfig: { accessToken },
            lastConnectedAt: new Date(),
          }
        });

        return account;
      } catch (err: any) {
        logger.error('[facebook] Link page error:', err);
        return reply.status(400).send({ error: 'Không thể liên kết Fanpage. Vui lòng kiểm tra lại Access Token.' });
      }
    }
  );
}
