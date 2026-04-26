import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../../../shared/database/prisma-client.js';
import { logger } from '../../../shared/utils/logger.js';
import { randomUUID } from 'node:crypto';
import { runAutomationRules } from '../../automation/automation-service.js';
import { config } from '../../../config/index.js';
import type { Server } from 'socket.io';

export async function facebookWebhookRoutes(app: FastifyInstance) {
  // Verification Endpoint (GET)
  app.get('/api/v1/webhooks/facebook', async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as any;
    const mode = query['hub.mode'];
    const token = query['hub.verify_token'];
    const challenge = query['hub.challenge'];

    // Use configured verify token
    const VERIFY_TOKEN = config.fbVerifyToken;

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      logger.info('[facebook] Webhook verified');
      return reply.send(challenge);
    } else {
      return reply.status(403).send('Forbidden');
    }
  });

  // Message Handler (POST)
  app.post('/api/v1/webhooks/facebook', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as any;

    if (body.object === 'page') {
      for (const entry of body.entry) {
        if (!entry.messaging) continue;

        for (const event of entry.messaging) {
          if (event.message && !event.message.is_echo) {
            await handleIncomingMessage(app, event, entry.id);
          }
        }
      }
      return reply.send('EVENT_RECEIVED');
    } else {
      return reply.status(404).send();
    }
  });
}

async function handleIncomingMessage(app: FastifyInstance, event: any, pageId: string) {
  const senderId = event.sender.id;
  const messageText = event.message.text;

  try {
    // 1. Find the Page in our database
    const channelAccount = await prisma.zaloAccount.findFirst({
      where: { fbPageId: pageId, channelType: 'facebook' }
    });

    if (!channelAccount) {
      logger.warn(`[facebook] Received message for unknown page: ${pageId}`);
      return;
    }

    const orgId = channelAccount.orgId;

    // 2. Upsert Contact
    let contact = await prisma.contact.findFirst({
      where: { orgId, facebookPsid: senderId }
    });

    if (!contact) {
      contact = await prisma.contact.create({
        data: {
          orgId,
          facebookPsid: senderId,
          fullName: `Khách Facebook ${senderId.slice(-4)}`,
          source: 'facebook',
          status: 'new'
        }
      });
    }

    // 3. Upsert Conversation
    let conversation = await prisma.conversation.findFirst({
      where: { orgId, zaloAccountId: channelAccount.id, contactId: contact.id }
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          orgId,
          zaloAccountId: channelAccount.id,
          contactId: contact.id,
          threadType: 'user',
          externalThreadId: senderId,
        }
      });
    }

    // 4. Create Message
    const message = await prisma.message.create({
      data: {
        id: randomUUID(),
        conversationId: conversation.id,
        senderType: 'contact',
        senderUid: senderId,
        senderName: contact.fullName || 'FB User',
        content: messageText,
        contentType: 'text',
        sentAt: new Date(event.timestamp),
      }
    });

    // 5. Update Conversation state
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: new Date(),
        unreadCount: { increment: 1 },
        isReplied: false
      }
    });

    // 6. Signal UI via Socket.IO
    const io = (app as any).io as Server;
    io?.emit('chat:message', { 
      accountId: channelAccount.id, 
      message, 
      conversationId: conversation.id 
    });

    // 7. Run Automation Rules
    await runAutomationRules({
      trigger: 'message_received',
      orgId,
      contact: {
        id: contact.id,
        fullName: contact.fullName,
        phone: contact.phone,
        status: contact.status,
        tags: contact.tags,
        notes: contact.notes
      },
      conversation: { id: conversation.id },
      message: { id: message.id, content: messageText, contentType: 'text' }
    });

  } catch (err) {
    logger.error('[facebook] Error handling message:', err);
  }
}
