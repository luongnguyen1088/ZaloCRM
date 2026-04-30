import { randomUUID } from 'node:crypto';
import { prisma } from '../../../shared/database/prisma-client.js';
import { logger } from '../../../shared/utils/logger.js';
import { FacebookApi } from './facebook-api.js';

interface BackfillOptions {
  conversationLimit?: number;
  messageLimit?: number;
}

export async function backfillFacebookRecentHistory(
  accountId: string,
  options: BackfillOptions = {},
) {
  const conversationLimit = options.conversationLimit ?? 15;
  const messageLimit = options.messageLimit ?? 30;

  const account = await prisma.zaloAccount.findUnique({
    where: { id: accountId },
    select: {
      id: true,
      orgId: true,
      fbPageId: true,
      displayName: true,
      platformConfig: true,
    },
  });

  const pageId = account?.fbPageId;
  const accessToken = (account?.platformConfig as { accessToken?: string } | null)?.accessToken;

  if (!account || !pageId || !accessToken) {
    logger.warn(`[facebook-history] Skipped backfill for ${accountId}: missing account, pageId, or access token.`);
    return null;
  }

  const fb = new FacebookApi(accessToken);
  const conversations = await fb.listRecentConversations(pageId, conversationLimit);

  let contactsCreated = 0;
  let contactsUpdated = 0;
  let conversationsCreated = 0;
  let messagesImported = 0;

  for (const remoteConversation of conversations) {
    try {
      const participant = remoteConversation.participants?.data?.find((item) => item.id && item.id !== pageId);
      if (!participant?.id) continue;

      const contactName = participant.name?.trim() || `Khach Facebook ${participant.id.slice(-4)}`;
      let contact = await prisma.contact.findFirst({
        where: { orgId: account.orgId, facebookPsid: participant.id },
        select: { id: true, fullName: true, avatarUrl: true },
      });

      if (!contact) {
        let avatarUrl: string | null = null;
        try {
          const profile = await fb.getUserProfile(participant.id);
          avatarUrl = profile?.avatarUrl || null;
        } catch {
          avatarUrl = null;
        }

        contact = await prisma.contact.create({
          data: {
            id: randomUUID(),
            orgId: account.orgId,
            facebookPsid: participant.id,
            fullName: contactName,
            avatarUrl,
            source: 'facebook',
            sourceDate: new Date(),
            status: 'new',
          },
          select: { id: true, fullName: true, avatarUrl: true },
        });
        contactsCreated++;
      } else if (contact.fullName !== contactName && !!participant.name?.trim()) {
        contact = await prisma.contact.update({
          where: { id: contact.id },
          data: { fullName: contactName },
          select: { id: true, fullName: true, avatarUrl: true },
        });
        contactsUpdated++;
      }

      let conversation = await prisma.conversation.findFirst({
        where: {
          zaloAccountId: account.id,
          externalThreadId: participant.id,
        },
        select: { id: true, lastMessageAt: true },
      });

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            id: randomUUID(),
            orgId: account.orgId,
            zaloAccountId: account.id,
            contactId: contact.id,
            threadType: 'user',
            externalThreadId: participant.id,
            lastMessageAt: remoteConversation.updated_time ? new Date(remoteConversation.updated_time) : null,
            unreadCount: 0,
            isReplied: true,
          },
          select: { id: true, lastMessageAt: true },
        });
        conversationsCreated++;
      }

      const remoteMessages = await fb.listConversationMessages(remoteConversation.id, messageLimit);
      const candidateIds = remoteMessages.map((item) => item.id).filter(Boolean);
      const existingIds = new Set(
        candidateIds.length === 0
          ? []
          : (
              await prisma.message.findMany({
                where: {
                  conversationId: conversation.id,
                  zaloMsgId: { in: candidateIds },
                },
                select: { zaloMsgId: true },
              })
            )
              .map((item) => item.zaloMsgId)
              .filter((value): value is string => Boolean(value)),
      );

      const messagesToCreate = remoteMessages
        .filter((item) => item.id && !existingIds.has(item.id))
        .map((item) => {
          const isSelf = item.from?.id === pageId;
          const sentAt = item.created_time ? new Date(item.created_time) : new Date();

          return {
            id: randomUUID(),
            conversationId: conversation!.id,
            zaloMsgId: item.id,
            senderType: isSelf ? 'self' : 'contact',
            senderUid: item.from?.id || participant.id,
            senderName: isSelf
              ? (account.displayName || 'Facebook Page')
              : (item.from?.name || contact.fullName || contactName),
            content: item.message?.trim() || '[Attachment]',
            contentType: 'text',
            attachments: [],
            sentAt,
          };
        });

      if (messagesToCreate.length > 0) {
        await prisma.message.createMany({ data: messagesToCreate });
        messagesImported += messagesToCreate.length;
      }

      const latestImportedAt = messagesToCreate.reduce<Date | null>((latest, item) => {
        return !latest || item.sentAt > latest ? item.sentAt : latest;
      }, null);

      const latestRemoteAt = remoteConversation.updated_time ? new Date(remoteConversation.updated_time) : null;
      const nextLastMessageAt = [conversation.lastMessageAt, latestImportedAt, latestRemoteAt]
        .filter((value): value is Date => Boolean(value))
        .sort((a, b) => b.getTime() - a.getTime())[0];

      if (nextLastMessageAt && (!conversation.lastMessageAt || nextLastMessageAt.getTime() !== conversation.lastMessageAt.getTime())) {
        await prisma.conversation.update({
          where: { id: conversation.id },
          data: {
            lastMessageAt: nextLastMessageAt,
            contactId: contact.id,
          },
        });
      }

      if (latestImportedAt) {
        await prisma.contact.update({
          where: { id: contact.id },
          data: { lastActivity: latestImportedAt },
        });
      }
    } catch (err) {
      logger.warn(`[facebook-history] Failed to backfill one conversation for account ${accountId}:`, err);
    }
  }

  const summary = {
    conversationsFetched: conversations.length,
    contactsCreated,
    contactsUpdated,
    conversationsCreated,
    messagesImported,
  };

  logger.info(`[facebook-history] Backfill completed for account ${accountId}: ${JSON.stringify(summary)}`);
  return summary;
}
