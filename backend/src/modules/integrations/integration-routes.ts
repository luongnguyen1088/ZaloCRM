/**
 * integration-routes.ts — CRUD for external integrations + manual sync trigger.
 * All routes require JWT auth, scoped to user's org.
 */
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../../shared/database/prisma-client.js';
import { authMiddleware } from '../auth/auth-middleware.js';
import { logger } from '../../shared/utils/logger.js';
import { requireRole } from '../auth/role-middleware.js';
import { runSync } from './sync-engine.js';
import { OAuth2Client } from 'google-auth-library';
import { config as appConfig } from '../../config/index.js';

const VALID_TYPES = ['google_sheets', 'telegram', 'facebook', 'zapier', 'n8n'] as const;
const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.metadata.readonly'
];

export async function integrationRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authMiddleware);

  const googleClient = new OAuth2Client(
    appConfig.googleClientId,
    'ClientSecretPlaceholder', // This should be in config/env
    'postmessage' // Special value for GSI code flow
  );

  // GET /api/v1/integrations/google/auth-url — get OAuth URL
  app.get('/api/v1/integrations/google/auth-url', async (request: FastifyRequest) => {
    // Note: In a production app, the redirect_uri should be configurable
    // For GSI code flow, we might handle it differently but let's provide a standard one
    return { url: 'https://accounts.google.com/o/oauth2/v2/auth' }; 
  });

  // POST /api/v1/integrations/google/callback — exchange code for tokens
  app.post('/api/v1/integrations/google/callback', { preHandler: requireRole('owner', 'admin') }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { orgId } = request.user!;
      const { code, redirectUri } = request.body as { code: string; redirectUri?: string };

      if (!code) return reply.status(400).send({ error: 'Code is required' });
      if (!appConfig.googleClientId) return reply.status(500).send({ error: 'Google Client ID not configured' });

      // We need the client secret to exchange the code
      // I'll assume it's in config.googleClientSecret
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      if (!clientSecret) return reply.status(500).send({ error: 'Google Client Secret not configured on server' });

      const oauth2Client = new OAuth2Client(
        appConfig.googleClientId,
        clientSecret,
        redirectUri || 'postmessage'
      );

      const { tokens } = await oauth2Client.getToken(code);
      
      await prisma.organizationConnection.upsert({
        where: { orgId_type: { orgId, type: 'google' } },
        update: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
          metadata: { 
            scopes: tokens.scope,
            updatedBy: request.user!.id
          }
        },
        create: {
          orgId,
          type: 'google',
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
          metadata: { 
            scopes: tokens.scope,
            updatedBy: request.user!.id
          }
        }
      });

      return { success: true };
    } catch (err: any) {
      logger.error('[integrations] Google callback error:', err);
      return reply.status(400).send({ error: 'Failed to link Google account: ' + err.message });
    }
  });

  // GET /api/v1/integrations — list all integrations for org
  app.get('/api/v1/integrations', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { orgId } = request.user!;
      const [integrations, connections] = await Promise.all([
        prisma.integration.findMany({
          where: { orgId },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true, orgId: true, type: true, name: true,
            enabled: true, lastSyncAt: true, createdAt: true, updatedAt: true,
            syncLogs: { take: 5, orderBy: { createdAt: 'desc' } },
          },
        }),
        prisma.organizationConnection.findMany({
          where: { orgId },
          select: { type: true, metadata: true, updatedAt: true }
        })
      ]);
      return { integrations, connections };
    } catch (err) {
      logger.error('[integrations] GET list error:', err);
      return reply.status(500).send({ error: 'Failed to fetch integrations' });
    }
  });

  // POST /api/v1/integrations — create integration (admin+)
  app.post('/api/v1/integrations', { preHandler: requireRole('owner', 'admin') }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { orgId } = request.user!;
      const { type, name, config: cfg, enabled } = request.body as {
        type: string; name?: string; config?: Record<string, unknown>; enabled?: boolean;
      };

      if (!type || !VALID_TYPES.includes(type as any)) {
        return reply.status(400).send({ error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}` });
      }

      const integration = await prisma.integration.create({
        data: { orgId, type, name: name || type, config: (cfg ?? {}) as any, enabled: enabled ?? true },
      });
      return reply.status(201).send(integration);
    } catch (err) {
      logger.error('[integrations] POST create error:', err);
      return reply.status(500).send({ error: 'Failed to create integration' });
    }
  });

  // PUT /api/v1/integrations/:id — update integration (admin+)
  app.put('/api/v1/integrations/:id', { preHandler: requireRole('owner', 'admin') }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { orgId } = request.user!;
      const { id } = request.params as { id: string };
      const { name, config: cfg, enabled } = request.body as {
        name?: string; config?: Record<string, unknown>; enabled?: boolean;
      };

      const existing = await prisma.integration.findFirst({ where: { id, orgId } });
      if (!existing) return reply.status(404).send({ error: 'Integration not found' });

      const updated = await prisma.integration.update({
        where: { id },
        data: {
          ...(name !== undefined && { name }),
          ...(cfg !== undefined && { config: cfg as any }),
          ...(enabled !== undefined && { enabled }),
        },
      });
      return updated;
    } catch (err) {
      logger.error('[integrations] PUT update error:', err);
      return reply.status(500).send({ error: 'Failed to update integration' });
    }
  });

  // DELETE /api/v1/integrations/:id — remove integration (admin+)
  app.delete('/api/v1/integrations/:id', { preHandler: requireRole('owner', 'admin') }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { orgId } = request.user!;
      const { id } = request.params as { id: string };

      const existing = await prisma.integration.findFirst({ where: { id, orgId } });
      if (!existing) return reply.status(404).send({ error: 'Integration not found' });

      await prisma.integration.delete({ where: { id } });
      return { success: true };
    } catch (err) {
      logger.error('[integrations] DELETE error:', err);
      return reply.status(500).send({ error: 'Failed to delete integration' });
    }
  });

  // POST /api/v1/integrations/:id/sync — trigger manual sync (admin+)
  app.post('/api/v1/integrations/:id/sync', { preHandler: requireRole('owner', 'admin') }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { orgId } = request.user!;
      const { id } = request.params as { id: string };

      const integration = await prisma.integration.findFirst({ where: { id, orgId } });
      if (!integration) return reply.status(404).send({ error: 'Integration not found' });
      if (!integration.enabled) return reply.status(400).send({ error: 'Integration is disabled' });

      const log = await runSync(integration);
      return log;
    } catch (err) {
      logger.error('[integrations] POST sync error:', err);
      return reply.status(500).send({ error: 'Sync failed' });
    }
  });

  // GET /api/v1/integrations/:id/logs — sync history
  app.get('/api/v1/integrations/:id/logs', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { orgId } = request.user!;
      const { id } = request.params as { id: string };

      const integration = await prisma.integration.findFirst({ where: { id, orgId } });
      if (!integration) return reply.status(404).send({ error: 'Integration not found' });

      const logs = await prisma.syncLog.findMany({
        where: { integrationId: id },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      return logs;
    } catch (err) {
      logger.error('[integrations] GET logs error:', err);
      return reply.status(500).send({ error: 'Failed to fetch sync logs' });
    }
  });
}
