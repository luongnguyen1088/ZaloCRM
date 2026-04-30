import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'node:crypto';
import type { Server } from 'socket.io';
import { prisma } from '../../../shared/database/prisma-client.js';
import { logger } from '../../../shared/utils/logger.js';
import { config } from '../../../config/index.js';
import { runAutomationRules } from '../../automation/automation-service.js';
import { AiService } from '../../ai/ai-service.js';
import { FacebookApi } from './facebook-api.js';

export async function facebookWebhookRoutes(app: FastifyInstance) {
  app.get('/api/v1/webhooks/facebook', async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as any;
    const mode = query['hub.mode'];
    const token = query['hub.verify_token'];
    const challenge = query['hub.challenge'];
    const verifyToken = config.fbVerifyToken;

    if (mode === 'subscribe' && token === verifyToken) {
      logger.info('[facebook] Webhook verified');
      return reply.send(challenge);
    }

    return reply.status(403).send('Forbidden');
  });

  app.post('/api/v1/webhooks/facebook', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as any;

    if (body.object !== 'page') {
      return reply.status(404).send();
    }

    for (const entry of body.entry || []) {
      if (!entry.messaging) continue;

      for (const event of entry.messaging) {
        if (event.message && !event.message.is_echo) {
          await handleIncomingMessage(app, event, entry.id);
        }
      }
    }

    return reply.send('EVENT_RECEIVED');
  });
}

async function handleIncomingMessage(app: FastifyInstance, event: any, pageId: string) {
  const senderId = event.sender.id;
  const messageText = event.message.text || '';
  const sentAt = event.timestamp ? new Date(event.timestamp) : new Date();

  try {
    const channelAccount = await prisma.zaloAccount.findFirst({
      where: { fbPageId: pageId, channelType: 'facebook' }
    });

    if (!channelAccount) {
      logger.warn(`[facebook] Received message for unknown page: ${pageId}`);
      return;
    }

    const orgId = channelAccount.orgId;
    const pageAccessToken = (channelAccount.platformConfig as any)?.accessToken as string | undefined;
    const profile = pageAccessToken
      ? await resolveFacebookContactProfile(pageAccessToken, senderId, event.message?.mid)
      : null;
    const resolvedName = profile?.fullName || `Khach Facebook ${senderId.slice(-4)}`;
    const resolvedAvatarUrl = profile?.avatarUrl || null;

    let contact = await prisma.contact.findFirst({
      where: { orgId, facebookPsid: senderId }
    });

    if (!contact) {
      contact = await prisma.contact.create({
        data: {
          orgId,
          facebookPsid: senderId,
          fullName: resolvedName,
          avatarUrl: resolvedAvatarUrl,
          source: 'facebook',
          status: 'new'
        }
      });
    } else if (shouldRefreshFacebookContact(contact, resolvedName, resolvedAvatarUrl)) {
      contact = await prisma.contact.update({
        where: { id: contact.id },
        data: {
          fullName: resolvedName,
          avatarUrl: resolvedAvatarUrl ?? contact.avatarUrl,
        }
      });
    }

    void prisma.contact.update({
      where: { id: contact.id },
      data: { lastActivity: sentAt },
    }).catch(() => {});

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

    const message = await prisma.message.create({
      data: {
        id: randomUUID(),
        conversationId: conversation.id,
        zaloMsgId: event.message?.mid || null,
        senderType: 'contact',
        senderUid: senderId,
        senderName: contact.fullName || 'FB User',
        content: messageText,
        contentType: 'text',
        sentAt,
      }
    });

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: sentAt,
        unreadCount: { increment: 1 },
        isReplied: false
      }
    });

    const io = (app as any).io as Server;
    io?.emit('chat:message', {
      accountId: channelAccount.id,
      message,
      conversationId: conversation.id
    });

    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { id: true, name: true },
    });
    const conversationDetails = await prisma.conversation.findUnique({
      where: { id: conversation.id },
      select: {
        id: true,
        unreadCount: true,
        externalThreadId: true,
        threadType: true,
        zaloAccountId: true,
      },
    });

    void runAutomationRules({
      trigger: 'message_received',
      orgId,
      org,
      contact: {
        id: contact.id,
        fullName: contact.fullName,
        phone: contact.phone,
        status: contact.status,
        source: contact.source,
        assignedUserId: contact.assignedUserId,
        tags: contact.tags,
        notes: contact.notes
      },
      conversation: conversationDetails
        ? {
            id: conversationDetails.id,
            unreadCount: conversationDetails.unreadCount,
            threadId: conversationDetails.externalThreadId,
            threadType: conversationDetails.threadType,
            zaloAccountId: conversationDetails.zaloAccountId,
          }
        : null,
      message: { id: message.id, content: messageText, contentType: 'text', senderType: 'contact' }
    });

    void AiService.checkStopConditions(orgId, conversation.id, messageText);
    void AiService.extractLeadInfo(orgId, conversation.id, messageText);
  } catch (err) {
    logger.error('[facebook] Error handling message:', err);
  }
}

async function resolveFacebookContactProfile(pageAccessToken: string, senderId: string, messageId?: string) {
  const fb = new FacebookApi(pageAccessToken);
  const directProfile = await fb.getUserProfile(senderId);
  if (directProfile?.fullName || directProfile?.avatarUrl) {
    return directProfile;
  }

  if (!messageId) {
    return null;
  }

  return await fb.getMessageSenderProfile(messageId);
}

function shouldRefreshFacebookContact(
  contact: { fullName: string | null; avatarUrl: string | null },
  nextName: string,
  nextAvatarUrl: string | null,
) {
  const currentName = contact.fullName?.trim() || '';
  const normalizedName = currentName.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const hasPlaceholderName = /^Khach Facebook \d{4}$/.test(normalizedName);
  const shouldUpdateName = !!nextName && (hasPlaceholderName || currentName !== nextName);
  const shouldUpdateAvatar = !!nextAvatarUrl && contact.avatarUrl !== nextAvatarUrl;

  return shouldUpdateName || shouldUpdateAvatar;
}
