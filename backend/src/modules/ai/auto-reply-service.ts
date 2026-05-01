import { prisma } from '../../shared/database/prisma-client.js';
import { logger } from '../../shared/utils/logger.js';
import { aiReplyAction } from '../automation/actions/ai-reply-action.js';
import { hasMatchingAiReplyRule, type AutomationContext } from '../automation/automation-service.js';
import { getAiConfig, isAiInWorkHours } from './ai-service.js';

const activeAutoReplyTimers = new Map<string, NodeJS.Timeout>();

function getTimerKey(orgId: string, conversationId: string) {
  return `${orgId}:${conversationId}:built-in-ai-reply`;
}

type QueuedAutoReply = {
  orgId: string;
  conversationId: string;
  zaloAccountId: string;
};

async function runQueuedAutoReply(input: QueuedAutoReply) {
  const timerKey = getTimerKey(input.orgId, input.conversationId);
  activeAutoReplyTimers.delete(timerKey);

  try {
    const [config, conversation] = await Promise.all([
      getAiConfig(input.orgId, input.zaloAccountId),
      prisma.conversation.findUnique({
        where: { id: input.conversationId },
        select: {
          id: true,
          orgId: true,
          zaloAccountId: true,
          externalThreadId: true,
          threadType: true,
          unreadCount: true,
          isReplied: true,
          aiPaused: true,
          messages: {
            where: { isDeleted: false },
            orderBy: { sentAt: 'desc' },
            take: 1,
            select: { senderType: true },
          },
        },
      }),
    ]);

    if (!config.enabled || config.aiResponseMode !== 'auto') return;
    if (!(await isAiInWorkHours(input.orgId, input.zaloAccountId))) return;
    if (!conversation || conversation.aiPaused) return;
    if (!conversation.externalThreadId || conversation.unreadCount <= 0 || conversation.isReplied) return;

    const lastMessage = conversation.messages[0];
    if (!lastMessage || lastMessage.senderType !== 'contact') return;

    const sentMessage = await aiReplyAction({
      orgId: input.orgId,
      conversationId: conversation.id,
      zaloAccountId: conversation.zaloAccountId,
      threadId: conversation.externalThreadId,
      threadType: conversation.threadType,
      confidenceThreshold: config.confidenceThreshold,
    });

    if (sentMessage) {
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: new Date(), isReplied: true, unreadCount: 0 },
      });
    }
  } catch (error) {
    logger.error('[ai-auto-reply] Failed to execute built-in auto reply:', error);
  }
}

export async function maybeScheduleBuiltInAiReply(context: AutomationContext) {
  if (context.trigger !== 'message_received' || !context.conversation?.id || !context.conversation.zaloAccountId) return;

  try {
    const [config, inWorkHours, hasLegacyRule, conversation] = await Promise.all([
      getAiConfig(context.orgId, context.conversation.zaloAccountId),
      isAiInWorkHours(context.orgId, context.conversation.zaloAccountId),
      hasMatchingAiReplyRule(context),
      prisma.conversation.findUnique({
        where: { id: context.conversation.id },
        select: { id: true, aiPaused: true },
      }),
    ]);

    if (!config.enabled || config.aiResponseMode !== 'auto') return;
    if (!inWorkHours) return;
    if (conversation?.aiPaused) return;

    if (hasLegacyRule) {
      logger.info(`[ai-auto-reply] Skip built-in auto reply for ${context.conversation.id}: matching automation rule already exists`);
      return;
    }

    const delayMs = Math.max(0, Number(config.autoReplyDelay ?? 0)) * 1000;
    const timerKey = getTimerKey(context.orgId, context.conversation.id);
    const existingTimer = activeAutoReplyTimers.get(timerKey);
    if (existingTimer) {
      clearTimeout(existingTimer);
      activeAutoReplyTimers.delete(timerKey);
    }

    const timeout = setTimeout(() => {
      void runQueuedAutoReply({
        orgId: context.orgId,
        conversationId: context.conversation!.id,
        zaloAccountId: context.conversation!.zaloAccountId!,
      });
    }, delayMs);

    activeAutoReplyTimers.set(timerKey, timeout);
  } catch (error) {
    logger.error('[ai-auto-reply] Failed to schedule built-in auto reply:', error);
  }
}
