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

  // GET /api/v1/facebook/list-pages — list all pages for a user token
  app.get<{ Querystring: { userToken: string } }>(
    '/api/v1/facebook/list-pages',
    async (request, reply) => {
      const { userToken } = request.query;
      if (!userToken) return reply.status(400).send({ error: 'User token is required' });

      try {
        const response = await fetch(`https://graph.facebook.com/v19.0/me/accounts?fields=id,name,access_token,picture&access_token=${userToken}`);
        if (!response.ok) throw new Error('Failed to fetch pages from Facebook');
        
        const data = await response.json() as any;
        return data.data.map((p: any) => ({
          id: p.id,
          name: p.name,
          accessToken: p.access_token,
          avatarUrl: p.picture?.data?.url
        }));
      } catch (err) {
        logger.error('[facebook] List pages error:', err);
        return reply.status(500).send({ error: 'Không thể lấy danh sách Fanpage từ Facebook' });
      }
    }
  );

  // POST /api/v1/facebook/link-page — link a page using a token
  app.post<{ Body: { accessToken: string, pageId?: string } }>(
    '/api/v1/facebook/link-page',
    async (request, reply) => {
      const { accessToken, pageId } = request.body as { accessToken: string, pageId?: string };
      const user = request.user!;

      if (!accessToken) return reply.status(400).send({ error: 'Access token is required' });

      try {
        const fb = new FacebookApi(accessToken);
        const resolvedPageId = pageId || (await fb.getPageInfo()).id;
        const pageInfo = pageId ? { id: pageId, name: 'Fanpage (Manual)', picture: null } : await fb.getPageInfo();

        const account = await prisma.zaloAccount.upsert({
          where: { fbPageId: resolvedPageId },
          update: {
            orgId: user.orgId,
            ownerUserId: user.id,
            channelType: 'facebook',
            displayName: pageInfo.name,
            avatarUrl: pageInfo.picture?.data?.url || 'https://www.facebook.com/images/fb_icon_325x325.png',
            status: 'connected',
            platformConfig: { accessToken },
            lastConnectedAt: new Date(),
          },
          create: {
            orgId: user.orgId,
            ownerUserId: user.id,
            channelType: 'facebook',
            fbPageId: resolvedPageId,
            displayName: pageInfo.name,
            avatarUrl: pageInfo.picture?.data?.url || 'https://www.facebook.com/images/fb_icon_325x325.png',
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
