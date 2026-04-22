/**
 * chat-routes.ts — REST API for conversations and messages.
 * All routes require JWT auth and are scoped to the user's org.
 */
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../../shared/database/prisma-client.js';
import { authMiddleware } from '../auth/auth-middleware.js';
import { requireZaloAccess } from '../zalo/zalo-access-middleware.js';
import { zaloPool } from '../zalo/zalo-pool.js';
import { zaloRateLimiter } from '../zalo/zalo-rate-limiter.js';
import { logger } from '../../shared/utils/logger.js';
import { randomUUID } from 'node:crypto';
import type { Server } from 'socket.io';
import fs from 'node:fs';
import { pipeline } from 'node:stream/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, '../../../uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

type QueryParams = Record<string, string>;

export async function chatRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authMiddleware);

  // ── List conversations (paginated) ──────────────────────────────────────
  app.get('/api/v1/conversations', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user!;
    const { page = '1', limit = '50', search = '', accountId = '' } = request.query as QueryParams;

    const where: any = { orgId: user.orgId };
    if (accountId) where.zaloAccountId = accountId;
    if (search) {
      where.contact = {
        OR: [
          { fullName: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } },
        ],
      };
    }

    // Members can only see conversations from Zalo accounts they have access to
    if (user.role === 'member') {
      const accessibleAccounts = await prisma.zaloAccountAccess.findMany({
        where: { userId: user.id },
        select: { zaloAccountId: true },
      });
      where.zaloAccountId = { in: accessibleAccounts.map((a) => a.zaloAccountId) };
    }

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where,
        include: {
          contact: { select: { id: true, fullName: true, phone: true, avatarUrl: true, zaloUid: true } },
          zaloAccount: { select: { id: true, displayName: true, zaloUid: true } },
          messages: {
            take: 1,
            orderBy: { sentAt: 'desc' },
            select: { content: true, contentType: true, senderType: true, sentAt: true, isDeleted: true },
          },
        },
        orderBy: { lastMessageAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
      prisma.conversation.count({ where }),
    ]);

    return { conversations, total, page: parseInt(page), limit: parseInt(limit) };
  });

  // ── Get single conversation ──────────────────────────────────────────────
  app.get('/api/v1/conversations/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user!;
    const { id } = request.params as { id: string };

    const conversation = await prisma.conversation.findFirst({
      where: { id, orgId: user.orgId },
      include: {
        contact: true,
        zaloAccount: { select: { id: true, displayName: true, zaloUid: true, status: true } },
      },
    });
    if (!conversation) return reply.status(404).send({ error: 'Not found' });

    return conversation;
  });

  // ── List messages for a conversation (paginated, newest first) ──────────
  app.get('/api/v1/conversations/:id/messages', { preHandler: requireZaloAccess('read') }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user!;
    const { id } = request.params as { id: string };
    const { page = '1', limit = '50' } = request.query as QueryParams;

    const conversation = await prisma.conversation.findFirst({
      where: { id, orgId: user.orgId },
      select: { id: true },
    });
    if (!conversation) return reply.status(404).send({ error: 'Conversation not found' });

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { conversationId: id },
        orderBy: { sentAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
      prisma.message.count({ where: { conversationId: id } }),
    ]);

    return { messages: messages.reverse(), total, page: parseInt(page), limit: parseInt(limit) };
  });

  // ── Upload file ──────────────────────────────────────────────────────────
    try {
      const data = await (request as any).file();
      if (!data) return reply.status(400).send({ error: 'No file uploaded' });

      const ext = path.extname(data.filename);
      const fileName = `${randomUUID()}${ext}`;
      const filePath = path.join(UPLOADS_DIR, fileName);

      await pipeline(data.file, fs.createWriteStream(filePath));

      const publicUrl = `/uploads/${fileName}`;
      return { url: publicUrl, filename: data.filename, mimetype: data.mimetype };
    } catch (err) {
      logger.error('[chat] Upload error:', err);
      return reply.status(500).send({ error: 'Failed to upload file' });
    }
  });

  // ── Send message ─────────────────────────────────────────────────────────
  app.post('/api/v1/conversations/:id/messages', { preHandler: requireZaloAccess('chat') }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user!;
    const { id } = request.params as { id: string };
    const { content, contentType = 'text', attachments = [] } = request.body as { 
      content: string; 
      contentType?: 'text' | 'image' | 'file';
      attachments?: any[];
    };

    if (contentType === 'text' && !content?.trim()) return reply.status(400).send({ error: 'Content required' });

    const conversation = await prisma.conversation.findFirst({
      where: { id, orgId: user.orgId },
      include: { zaloAccount: true },
    });
    if (!conversation) return reply.status(404).send({ error: 'Conversation not found' });

    try {
      const threadId = conversation.externalThreadId || '';
      
      // Handle Facebook Page Message
      if (conversation.zaloAccount.type === 'facebook_page') {
        const config = conversation.zaloAccount.platformConfig as { accessToken?: string };
        if (!config?.accessToken) return reply.status(400).send({ error: 'Facebook configuration error' });

        const { FacebookApi } = await import('../channels/facebook/facebook-api.js');
        const fb = new FacebookApi(config.accessToken);
        if (contentType === 'image' && attachments.length > 0) {
          // Note: Facebook requires public URL for attachments
          // If we are on local, this might need a tunnel or S3
          await fb.sendTextMessage(threadId, `[Image]: ${attachments[0].url}`);
        } else {
          await fb.sendTextMessage(threadId, content);
        }
      } 
      // Handle Zalo Personal Message (Default)
      else {
        const instance = zaloPool.getInstance(conversation.zaloAccountId);
        if (!instance?.api) return reply.status(400).send({ error: 'Zalo account not connected' });

        // Rate limit check
        const limits = zaloRateLimiter.checkLimits(conversation.zaloAccountId);
        if (!limits.allowed) return reply.status(429).send({ error: limits.reason });

        const threadType = conversation.threadType === 'group' ? 1 : 0;
        zaloRateLimiter.recordSend(conversation.zaloAccountId);

        if (contentType === 'image' && attachments.length > 0) {
          const fileUrl = attachments[0].url;
          const fileName = fileUrl.replace('/uploads/', '');
          const fullPath = path.join(UPLOADS_DIR, fileName);
          logger.info(`[chat] Sending image to ${threadId}: ${fullPath}`);
          await instance.api.sendImage(fullPath, threadId, threadType);
          logger.info(`[chat] Image sent successfully to ${threadId}`);
        } else if (contentType === 'file' && attachments.length > 0) {
          const fileUrl = attachments[0].url;
          const fileName = fileUrl.replace('/uploads/', '');
          const fullPath = path.join(UPLOADS_DIR, fileName);
          logger.info(`[chat] Sending file to ${threadId}: ${fullPath}`);
          await instance.api.sendFile(fullPath, threadId, threadType);
          logger.info(`[chat] File sent successfully to ${threadId}`);
        } else {
          await instance.api.sendTextMessage(content, threadId, threadType);
        }
      }

      const message = await prisma.message.create({
        data: {
          id: randomUUID(),
          conversationId: id,
          senderType: 'self',
          senderUid: conversation.zaloAccount.zaloUid || '',
          senderName: 'Staff',
          content: contentType === 'text' ? content : JSON.stringify(attachments[0] || {}),
          contentType,
          sentAt: new Date(),
          repliedByUserId: user.id,
        },
      });

      await prisma.conversation.update({
        where: { id },
        data: { lastMessageAt: new Date(), isReplied: true, unreadCount: 0 },
      });

      const io = (app as any).io as Server;
      io?.emit('chat:message', { accountId: conversation.zaloAccountId, message, conversationId: id });

      return message;
    } catch (err) {
      logger.error('[chat] Send message error:', err);
      return reply.status(500).send({ error: 'Failed to send message' });
    }
  });

  // ── Mark conversation as read ────────────────────────────────────────────
  app.post('/api/v1/conversations/:id/mark-read', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user!;
    const { id } = request.params as { id: string };

    await prisma.conversation.updateMany({
      where: { id, orgId: user.orgId },
      data: { unreadCount: 0 },
    });

    return { success: true };
  });
}
