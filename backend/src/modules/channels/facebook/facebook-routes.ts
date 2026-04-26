import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware } from '../../auth/auth-middleware.js';
import { prisma } from '../../../shared/database/prisma-client.js';
import { logger } from '../../../shared/utils/logger.js';
import { FacebookApi } from './facebook-api.js';
import { config } from '../../../config/index.js';

/**
 * Facebook account management routes.
 */
export async function facebookRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authMiddleware);

  app.get(
    '/api/v1/facebook/oauth/config',
    async (_request, reply) => {
      if (!config.fbAppId) {
        return reply.status(503).send({ error: 'Facebook App ID is not configured' });
      }

      return {
        appId: config.fbAppId,
        apiVersion: 'v19.0',
      };
    }
  );

  app.post<{ Body: { code: string; redirectUri: string } }>(
    '/api/v1/facebook/oauth/exchange-code',
    async (request, reply) => {
      const { code, redirectUri } = request.body;

      if (!code || !redirectUri) {
        return reply.status(400).send({ error: 'Code and redirectUri are required' });
      }

      if (!config.fbAppId || !config.fbAppSecret) {
        return reply.status(503).send({ error: 'Facebook OAuth is not configured on the server' });
      }

      try {
        const redirectUrl = new URL(redirectUri);
        const requestOrigin = request.headers.origin;

        if (!['http:', 'https:'].includes(redirectUrl.protocol)) {
          return reply.status(400).send({ error: 'Invalid redirectUri protocol' });
        }

        if (requestOrigin && redirectUrl.origin !== requestOrigin) {
          return reply.status(400).send({ error: 'redirectUri origin mismatch' });
        }

        const exchangeUrl = new URL('https://graph.facebook.com/v19.0/oauth/access_token');
        exchangeUrl.search = new URLSearchParams({
          client_id: config.fbAppId,
          client_secret: config.fbAppSecret,
          redirect_uri: redirectUri,
          code,
        }).toString();

        const response = await fetch(exchangeUrl);
        const data = await response.json() as {
          access_token?: string;
          error?: { message?: string };
        };

        if (!response.ok || !data.access_token) {
          logger.error('[facebook] Exchange code error:', data);
          return reply.status(400).send({
            error: data.error?.message || 'Khong the dang nhap Facebook. Vui long kiem tra cau hinh OAuth.',
          });
        }

        return { accessToken: data.access_token };
      } catch (err) {
        logger.error('[facebook] Exchange code exception:', err);
        return reply.status(400).send({ error: 'Facebook OAuth callback khong hop le' });
      }
    }
  );

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

  app.post<{ Params: { id: string } }>(
    '/api/v1/facebook/accounts/:id/subscribe-webhooks',
    async (request, reply) => {
      const { id } = request.params;
      const user = request.user!;

      const account = await prisma.zaloAccount.findFirst({
        where: {
          id,
          orgId: user.orgId,
          channelType: 'facebook',
        },
        select: {
          id: true,
          fbPageId: true,
          platformConfig: true,
        },
      });

      if (!account) {
        return reply.status(404).send({ error: 'Khong tim thay Fanpage da ket noi' });
      }

      const pageId = account.fbPageId;
      const accessToken = (account.platformConfig as any)?.accessToken;

      if (!pageId || !accessToken) {
        return reply.status(400).send({ error: 'Fanpage nay chua co du token hoac pageId de dong bo webhook' });
      }

      try {
        const fb = new FacebookApi(accessToken);
        await fb.subscribeAppToPage(pageId);

        await prisma.zaloAccount.update({
          where: { id: account.id },
          data: {
            status: 'connected',
            lastConnectedAt: new Date(),
          },
        });

        return { success: true, pageId };
      } catch (err: any) {
        logger.error('[facebook] Re-subscribe page webhook error:', err);
        return reply.status(400).send({ error: 'Khong the dong bo lai webhook Fanpage. Vui long ket noi lai trang.' });
      }
    }
  );

  // POST /api/v1/facebook/link-page — link a page using a token
  app.post<{ Body: { accessToken: string; pageId?: string; pageName?: string; avatarUrl?: string } }>(
    '/api/v1/facebook/link-page',
    async (request, reply) => {
      const { accessToken, pageId, pageName, avatarUrl } = request.body as {
        accessToken: string;
        pageId?: string;
        pageName?: string;
        avatarUrl?: string;
      };
      const user = request.user!;

      if (!accessToken) return reply.status(400).send({ error: 'Access token is required' });

      try {
        const fb = new FacebookApi(accessToken);
        const resolvedPageId = pageId || (await fb.getPageInfo()).id;
        const resolvedPageName = pageName?.trim() || 'Facebook Fanpage';
        const resolvedAvatarUrl = avatarUrl || 'https://www.facebook.com/images/fb_icon_325x325.png';

        await fb.subscribeAppToPage(resolvedPageId);

        const account = await prisma.zaloAccount.upsert({
          where: { fbPageId: resolvedPageId },
          update: {
            orgId: user.orgId,
            ownerUserId: user.id,
            channelType: 'facebook',
            displayName: resolvedPageName,
            avatarUrl: resolvedAvatarUrl,
            status: 'connected',
            platformConfig: { accessToken },
            lastConnectedAt: new Date(),
          },
          create: {
            orgId: user.orgId,
            ownerUserId: user.id,
            channelType: 'facebook',
            fbPageId: resolvedPageId,
            displayName: resolvedPageName,
            avatarUrl: resolvedAvatarUrl,
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
