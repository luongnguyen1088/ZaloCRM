import { randomUUID } from 'node:crypto';
import { prisma } from '../../../shared/database/prisma-client.js';
import { generateAiOutput } from '../../ai/ai-service.js';
import { zaloPool } from '../../zalo/zalo-pool.js';
import { zaloRateLimiter } from '../../zalo/zalo-rate-limiter.js';
import { logger } from '../../../shared/utils/logger.js';

export async function aiReplyAction(input: {
  orgId: string;
  conversationId: string;
  zaloAccountId: string;
  threadId: string | null;
  threadType: string;
  confidenceThreshold?: number;
}) {
  if (!input.threadId) return null;

  try {
    // 1. Get AI config and runtime state
    const { getAiConfig, isAiInWorkHours } = await import('../../ai/ai-service.js');
    const aiConfig = await getAiConfig(input.orgId, input.zaloAccountId);
    if (!aiConfig.enabled) {
      logger.info(`[automation] AI Reply stopped for ${input.zaloAccountId}: AI is disabled`);
      return null;
    }

    const inWorkHours = await isAiInWorkHours(input.orgId, input.zaloAccountId);
    if (!inWorkHours) {
      logger.info(`[automation] AI Reply stopped for ${input.zaloAccountId}: outside configured work hours`);
      return null;
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: input.conversationId },
      select: { aiPaused: true },
    });
    if (conversation?.aiPaused) {
      logger.info(`[automation] AI Reply stopped for ${input.zaloAccountId}: conversation is paused`);
      return null;
    }

    // 2. Generate response using AI Service (RAG)
    const result = await generateAiOutput({
      orgId: input.orgId,
      conversationId: input.conversationId,
      type: 'reply_draft',
      isAutoReply: true,
    });
    
    const threshold = input.confidenceThreshold ?? aiConfig.confidenceThreshold ?? 0.8;
    logger.info(`[automation] AI for ${input.zaloAccountId}: Confidence ${result.confidence.toFixed(2)} (Threshold: ${threshold}), Mode: ${aiConfig.aiResponseMode}`);

    // 3. IF mode is HYBRID, we STOP HERE (Suggestion is already saved by generateAiOutput)
    if (aiConfig.aiResponseMode === 'hybrid') {
      logger.info(`[automation] AI Reply stopped: mode is HYBRID (draft only)`);
      return null;
    }

    // 4. Check confidence threshold
    if (result.confidence < threshold) {
      logger.info(`[automation] AI Reply suppressed: confidence too low`);
      return null;
    }

    if (!('content' in result)) {
      logger.warn(`[automation] AI Result has no content`);
      return null;
    }

    const content = (result.content as string).trim();
    if (!content) return null;

    // 3. Send through appropriate channel
    const account = await prisma.zaloAccount.findUnique({
      where: { id: input.zaloAccountId },
      select: { channelType: true, platformConfig: true }
    });

    if (!account) return null;

    if (account.channelType === 'facebook') {
      const config = account.platformConfig as { accessToken?: string };
      if (!config?.accessToken) return null;

      const { FacebookApi } = await import('../../channels/facebook/facebook-api.js');
      const fb = new FacebookApi(config.accessToken);
      await fb.sendTextMessage(input.threadId, content);
    } else {
      const instance = zaloPool.getInstance(input.zaloAccountId);
      if (!instance?.api) return null;

      const limits = zaloRateLimiter.checkLimits(input.zaloAccountId);
      if (!limits.allowed) return null;

      zaloRateLimiter.recordSend(input.zaloAccountId);
      const threadType = input.threadType === 'group' ? 1 : 0;
      await instance.api.sendMessage({ msg: content }, input.threadId, threadType);
    }

    // 4. Save to DB
    return await prisma.message.create({
      data: {
        id: randomUUID(),
        conversationId: input.conversationId,
        senderType: 'self',
        senderUid: null,
        senderName: 'AI Assistant',
        content,
        contentType: 'text',
        sentAt: new Date(),
      },
    });
  } catch (error) {
    logger.error('[automation] AI Reply Action failed:', error);
    return null;
  }
}
