/**
 * Main application entry point.
 * Bootstraps Fastify server with all plugins, Socket.IO, and route handlers.
 * Optimized for production routing and SPA fallback.
 */
import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import fastifyMultipart from '@fastify/multipart';
import { Server } from 'socket.io';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { Prisma } from '@prisma/client';
import { config } from './config/index.js';
import { prisma } from './shared/database/prisma-client.js';
import { logger } from './shared/utils/logger.js';
import { authRoutes } from './modules/auth/auth-routes.js';
import { zaloRoutes } from './modules/zalo/zalo-routes.js';
import { chatRoutes } from './modules/chat/chat-routes.js';
import { contactRoutes } from './modules/contacts/contact-routes.js';
import { contactSubResourceRoutes } from './modules/contacts/contact-sub-resource-routes.js';
import { appointmentRoutes } from './modules/contacts/appointment-routes.js';
import { globalErrorHandler } from './shared/utils/error-handler.js';
import { startAppointmentReminder } from './modules/contacts/appointment-reminder.js';
import { dashboardRoutes } from './modules/dashboard/dashboard-routes.js';
import { reportRoutes } from './modules/dashboard/report-routes.js';
import { userRoutes } from './modules/auth/user-routes.js';
import { teamRoutes } from './modules/auth/team-routes.js';
import { orgRoutes } from './modules/auth/org-routes.js';
import { zaloAccessRoutes } from './modules/zalo/zalo-access-routes.js';
import { zaloSyncRoutes } from './modules/zalo/zalo-sync-routes.js';
import { zaloPool } from './modules/zalo/zalo-pool.js';
import { registerZaloSocketHandlers } from './modules/zalo/zalo-socket.js';
import { notificationRoutes } from './modules/notifications/notification-routes.js';
import { searchRoutes } from './modules/search/search-routes.js';
import { startZaloHealthCheck } from './modules/zalo/zalo-health-check.js';
import { publicApiRoutes } from './modules/api/public-api-routes.js';
import { webhookSettingsRoutes } from './modules/api/webhook-settings-routes.js';
import { startContactIntelligence } from './modules/contacts/contact-intelligence.js';
import { analyticsRoutes } from './modules/analytics/analytics-routes.js';
import { savedReportRoutes } from './modules/analytics/saved-report-routes.js';
import { integrationRoutes } from './modules/integrations/integration-routes.js';
import { automationRoutes } from './modules/automation/automation-routes.js';
import { templateRoutes } from './modules/automation/template-routes.js';
import { aiRoutes } from './modules/ai/ai-routes.js';
import { subscriptionRoutes } from './modules/billing/subscription-routes.js';
import { adminRoutes } from './modules/admin/admin-routes.js';
import { facebookRoutes } from './modules/channels/facebook/facebook-routes.js';
import { facebookWebhookRoutes } from './modules/channels/facebook/facebook-webhook.js';
import { invitationRoutes } from './modules/auth/invitation-routes.js';
import { authMiddleware } from './modules/auth/auth-middleware.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function bootstrap() {
  const app = Fastify({ 
    logger: true, // Enabled for production debugging
    disableRequestLogging: false,
    bodyLimit: 10 * 1024 * 1024 // 10MB limit
  });

  // ── Plugins ──────────────────────────────────────────────────────────────

  await app.register(cors, {
    origin: config.isProduction ? config.appUrl : true,
    credentials: true,
  });

  await app.register(fastifyJwt, {
    secret: config.jwtSecret,
  });

  await app.register(rateLimit, {
    max: 1000,
    timeWindow: '1 minute',
    allowList: (request: { url: string }) => !request.url.startsWith('/api/'),
  });

  await app.register(fastifyMultipart, {
    limits: { fileSize: 10 * 1024 * 1024 },
  });

  // Serve uploaded files
  await app.register(fastifyStatic, {
    root: path.join(__dirname, '../uploads'),
    prefix: '/uploads/',
    decorateReply: false,
  });

  // ── Socket.IO ─────────────────────────────────────────────────────────────

  const io = new Server(app.server, {
    cors: {
      origin: config.isProduction ? config.appUrl : '*',
      credentials: true,
    },
  });
  app.decorate('io', io);
  zaloPool.setIO(io);
  registerZaloSocketHandlers(io);

  // ── Authentication Hook ──────────────────────────────────────────────────

  app.addHook('onRequest', async (request, reply) => {
    const url = request.url.split('?')[0];
    
    // Only protect API routes
    if (!url.startsWith('/api/')) return;

    // Public API bypass
    if (
      url === '/api/v1/status' ||
      url.startsWith('/api/v1/setup/') ||
      url.startsWith('/api/v1/auth/') ||
      url.startsWith('/api/v1/public/') ||
      url.startsWith('/api/v1/webhooks/')
    ) return;

    try {
      await authMiddleware(request, reply);
    } catch (err) {
      // Handled by middleware
    }
  });

  // ── API Routes ────────────────────────────────────────────────────────────

  app.get('/health', async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', db: 'connected' };
    } catch {
      return { status: 'error', db: 'disconnected' };
    }
  });

  app.get('/api/v1/status', async () => {
    return { version: '1.0.0', name: 'Zalo CRM', env: config.nodeEnv };
  });

  // Register All Module Routes
  await app.register(authRoutes);
  await app.register(zaloRoutes);
  await app.register(chatRoutes);
  await app.register(contactRoutes);
  await app.register(contactSubResourceRoutes);
  await app.register(appointmentRoutes);
  await app.register(dashboardRoutes);
  await app.register(reportRoutes);
  await app.register(userRoutes);
  await app.register(teamRoutes);
  await app.register(orgRoutes);
  await app.register(zaloAccessRoutes);
  await app.register(zaloSyncRoutes);
  await app.register(notificationRoutes);
  await app.register(searchRoutes);
  await app.register(publicApiRoutes);
  await app.register(webhookSettingsRoutes);
  await app.register(analyticsRoutes);
  await app.register(savedReportRoutes);
  await app.register(integrationRoutes);
  await app.register(automationRoutes);
  await app.register(templateRoutes);
  await app.register(aiRoutes);
  await app.register(subscriptionRoutes);
  await app.register(facebookRoutes);
  await app.register(facebookWebhookRoutes);
  await app.register(invitationRoutes);
  await app.register(adminRoutes);

  // ── Static Files & SPA Fallback ───────────────────────────────────────────

  if (config.isProduction) {
    const staticPath = path.join(__dirname, '../static');
    
    await app.register(fastifyStatic, {
      root: staticPath,
      prefix: '/',
      wildcard: true,
      index: 'index.html', // Automatically serve index.html for /
    });

    // Handle SPA fallback for unknown routes (browser navigation)
    app.setNotFoundHandler(async (request, reply) => {
      // If request is for an API that doesn't exist, return 404 JSON
      if (request.url.startsWith('/api/') || request.url === '/health') {
        return reply.status(404).send({ error: 'not_found', path: request.url });
      }
      
      // Otherwise, serve index.html for the frontend router to handle
      try {
        return await reply.sendFile('index.html');
      } catch {
        return reply.status(404).send({ error: 'frontend_assets_missing' });
      }
    });
  }

  // ── Start ─────────────────────────────────────────────────────────────────

  app.setErrorHandler(globalErrorHandler);

  try {
    await app.listen({ port: config.port, host: config.host });
    logger.info(`Zalo CRM running on http://${config.host}:${config.port}`);
    startAppointmentReminder(io);
    startZaloHealthCheck();
    startContactIntelligence();
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }

  // Reconnect logic
  try {
    const accounts = await prisma.zaloAccount.findMany({
      where: { sessionData: { not: Prisma.JsonNull } },
    });
    for (const account of accounts) {
      zaloPool.reconnect(account.id, account.sessionData as any).catch(() => {});
    }
  } catch (err) {
    logger.error('Failed to load accounts for reconnect:', err);
  }
}

process.on('uncaughtException', (err) => logger.error('Uncaught Exception:', err));
process.on('unhandledRejection', (reason) => logger.error('Unhandled Rejection:', reason));

bootstrap();
