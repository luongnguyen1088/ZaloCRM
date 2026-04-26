import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { authMiddleware } from '../auth/auth-middleware.js';
import { requireRole } from '../auth/role-middleware.js';
import { requireZaloAccess } from '../zalo/zalo-access-middleware.js';
import { getAiConfig, getAiUsage, getAiUsageHistory, updateAiConfig, generateAiOutput, generateAiOutputStreaming, getAiAnalytics } from './ai-service.js';
import { getAvailableProviders } from './provider-registry.js';
import { logger } from '../../shared/utils/logger.js';
import { prisma } from '../../shared/database/prisma-client.js';
import { knowledgeRoutes } from './knowledge/knowledge-routes.js';
import { mcpRoutes } from './mcp/mcp-routes.js';

async function assertConversationReadAccess(request: FastifyRequest, reply: FastifyReply, conversationId: string) {
  const user = request.user!;
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, orgId: user.orgId },
    select: { id: true, zaloAccountId: true },
  });
  if (!conversation) {
    reply.status(404).send({ error: 'Conversation not found' });
    return null;
  }
  if (['owner', 'admin'].includes(user.role)) return conversation;

  const access = await prisma.zaloAccountAccess.findFirst({
    where: { zaloAccountId: conversation.zaloAccountId, userId: user.id },
    select: { permission: true },
  });
  if (!access) {
    reply.status(403).send({ error: 'Không có quyền truy cập tài khoản Zalo này' });
    return null;
  }
  return conversation;
}

function getStatusFromError(err: unknown, fallback: string) {
  const message = err instanceof Error ? err.message : fallback;
  const status = message.includes('quota exceeded') ? 429 : message.includes('not found') ? 404 : message.includes('disabled') || message.includes('configured') ? 400 : 500;
  return { message, status };
}

function sendHandledError(reply: FastifyReply, err: unknown, fallback: string) {
  const handled = getStatusFromError(err, fallback);
  const safeMessage = handled.status === 500 ? fallback : handled.message;
  return reply.status(handled.status).send({ error: safeMessage });
}

export async function aiRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authMiddleware);

  /* Returns available AI providers + their models (based on .env config) */
  app.get('/api/v1/ai/providers', async () => {
    return getAvailableProviders();
  });

  app.get('/api/v1/ai/config', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      return await getAiConfig(request.user!.orgId);
    } catch (err) {
      logger.error('[ai] Get config error:', err);
      return reply.status(500).send({ error: 'Failed to fetch AI config' });
    }
  });

  app.put('/api/v1/ai/config', { preHandler: requireRole('owner', 'admin') }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = request.body as any;
      return await updateAiConfig(request.user!.orgId, body);
    } catch (err) {
      logger.error('[ai] Update config error:', err);
      return reply.status(500).send({ error: 'Failed to update AI config' });
    }
  });

  app.get('/api/v1/ai/usage', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      return await getAiUsage(request.user!.orgId);
    } catch (err) {
      logger.error('[ai] Usage error:', err);
      return reply.status(500).send({ error: 'Failed to fetch AI usage' });
    }
  });

  app.get('/api/v1/ai/usage/history', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { limit } = request.query as { limit?: string };
      return await getAiUsageHistory(request.user!.orgId, limit ? parseInt(limit) : 50);
    } catch (err) {
      logger.error('[ai] Usage history error:', err);
      return reply.status(500).send({ error: 'Failed to fetch AI usage history' });
    }
  });

  app.get('/api/v1/ai/analytics', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      return await getAiAnalytics(request.user!.orgId);
    } catch (err) {
      logger.error('[ai] Analytics error:', err);
      return reply.status(500).send({ error: 'Failed to fetch AI analytics' });
    }
  });

  app.post('/api/v1/ai/suggest/stream', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = request.body as { conversationId?: string; messageId?: string; customPrompt?: string; originalContent?: string };
      if (!body.conversationId) return reply.status(400).send({ error: 'conversationId is required' });

      const access = await assertConversationReadAccess(request, reply, body.conversationId);
      if (!access) return;

      // Set headers for Server-Sent Events (SSE)
      reply.raw.setHeader('Content-Type', 'text/event-stream');
      reply.raw.setHeader('Cache-Control', 'no-cache');
      reply.raw.setHeader('Connection', 'keep-alive');
      reply.raw.flushHeaders();

      await generateAiOutputStreaming({
        orgId: request.user!.orgId,
        conversationId: body.conversationId,
        messageId: body.messageId,
        type: 'reply_draft',
        customPrompt: body.customPrompt,
        originalContent: body.originalContent,
        onChunk: (chunk) => {
          reply.raw.write(`data: ${JSON.stringify({ chunk })}\n\n`);
        }
      });
      reply.raw.write('data: [DONE]\n\n');
      reply.raw.end();
    } catch (err) {
      logger.error('[ai] Streaming error:', err);
      // If we already started the stream, we send the error as a data event
      const handled = getStatusFromError(err, 'Streaming failed');
      try {
        if (!reply.raw.writableEnded) {
          reply.raw.write(`data: ${JSON.stringify({ error: handled.message })}\n\n`);
          reply.raw.end();
        }
      } catch (e) { /* ignore */ }
    }
  });

  app.post('/api/v1/ai/suggest', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = request.body as { conversationId?: string; messageId?: string; customPrompt?: string; originalContent?: string };
      if (!body.conversationId) return reply.status(400).send({ error: 'conversationId is required' });
      const access = await assertConversationReadAccess(request, reply, body.conversationId);
      if (!access) return;
      return await generateAiOutput({ 
        orgId: request.user!.orgId, 
        conversationId: body.conversationId, 
        messageId: body.messageId, 
        type: 'reply_draft',
        customPrompt: body.customPrompt,
        originalContent: body.originalContent
      });
    } catch (err) {
      logger.error('[ai] Suggest error:', err);
      return sendHandledError(reply, err, 'Failed to generate AI suggestion');
    }
  });

  app.post('/api/v1/ai/summarize/:id', { preHandler: requireZaloAccess('read') }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      return await generateAiOutput({ orgId: request.user!.orgId, conversationId: id, type: 'summary' });
    } catch (err) {
      logger.error('[ai] Summary error:', err);
      return sendHandledError(reply, err, 'Failed to summarize conversation');
    }
  });

  app.post('/api/v1/ai/sentiment/:id', { preHandler: requireZaloAccess('read') }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      return await generateAiOutput({ orgId: request.user!.orgId, conversationId: id, type: 'sentiment' });
    } catch (err) {
      logger.error('[ai] Sentiment error:', err);
      return sendHandledError(reply, err, 'Failed to analyze sentiment');
    }
  });

  // Knowledge Management
  await app.register(knowledgeRoutes, { prefix: '/api/v1/ai/knowledge' });

  // Remote MCP
  await app.register(mcpRoutes);
}
