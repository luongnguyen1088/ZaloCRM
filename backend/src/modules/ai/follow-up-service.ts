import { prisma } from '../../shared/database/prisma-client.js';
import { AiService } from './ai-service.js';
import { zaloPool } from '../zalo/zalo-pool.js';
import { logger } from '../../shared/utils/logger.js';

export class FollowUpService {
  private static intervalId: NodeJS.Timeout | null = null;

  /**
   * Start the follow-up checker
   */
  static start() {
    if (this.intervalId) return;
    
    logger.info('Starting Auto Follow-up checker (1 minute interval)');
    this.intervalId = setInterval(() => this.checkFollowUps(), 60 * 1000);
  }

  /**
   * Stop the follow-up checker
   */
  static stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Main logic to find and process follow-ups
   */
  private static async checkFollowUps() {
    try {
      const now = new Date();

      // 1. Find all active AI configs with follow-up enabled
      const activeConfigs = await prisma.aiConfig.findMany({
        where: {
          enabled: true,
          followUpEnabled: true
        }
      });

      for (const config of activeConfigs) {
        // 2. Find conversations for this org that need follow-up
        const conversations = await prisma.conversation.findMany({
          where: {
            orgId: config.orgId,
            isReplied: true, // Last message was from shop
            aiPaused: false, // Skip paused conversations
            followUpCount: { lt: config.followUpMaxMessages },
            lastMessageAt: {
              lt: new Date(now.getTime() - config.followUpInterval * 60 * 1000)
            },
            // Ensure we don't follow up too quickly after the last follow up
            OR: [
              { lastFollowUpAt: null },
              {
                lastFollowUpAt: {
                  lt: new Date(now.getTime() - config.followUpInterval * 60 * 1000)
                }
              }
            ]
          },
          include: {
            zaloAccount: true,
            messages: {
              orderBy: { sentAt: 'desc' },
              take: 10
            }
          }
        });

        for (const conv of conversations) {
          await this.processFollowUp(conv, config);
        }

        // 3. Auto-resume paused conversations if enabled
        if (config.autoResumeEnabled) {
          const pausedConvs = await prisma.conversation.findMany({
            where: {
              orgId: config.orgId,
              aiPaused: true,
              aiPausedAt: {
                lt: new Date(now.getTime() - config.autoResumeMinutes * 60 * 1000)
              }
            }
          });

          for (const conv of pausedConvs) {
            logger.info(`Auto-resuming AI for conversation ${conv.id} after ${config.autoResumeMinutes} minutes`);
            await prisma.conversation.update({
              where: { id: conv.id },
              data: {
                aiPaused: false,
                aiPauseReason: null
              }
            });
          }
        }
      }
    } catch (error) {
      logger.error('Error in checkFollowUps:', error);
    }
  }

  /**
   * Generate and send follow-up message
   */
  private static async processFollowUp(conv: any, config: any) {
    try {
      logger.info(`Processing follow-up for conversation ${conv.id} (Count: ${conv.followUpCount})`);

      let followUpContent = '';

      if (config.followUpType === 'manual' && config.followUpManualContent) {
        followUpContent = config.followUpManualContent;
      } else {
        // Generate AI Follow-up
        const history = conv.messages.reverse().map((m: any) => ({
          role: m.senderType === 'user' ? 'user' : 'assistant',
          content: m.content || ''
        }));

        const systemPrompt = `You are a helpful assistant. The customer hasn't replied to your previous message. 
        Your task is to write a GENTLE, polite, and non-pushy follow-up message to check if they have any more questions or if they are still interested.
        Keep it natural and helpful. Avoid sounding like a robot or being too demanding.
        LANGUAGE: Vietnamese (unless the conversation is clearly in another language).
        DO NOT use Markdown.`;

        // We use a simplified prompt for follow-up to keep it light
        const aiOutput = await AiService.generateRawOutput(config.orgId, systemPrompt, history);
        followUpContent = aiOutput.content;
      }

      if (!followUpContent) return;

      // Send via Zalo
      const instance = zaloPool.getApi(conv.zaloAccountId);
      if (!instance) {
        logger.warn(`Cannot send follow-up: Zalo account ${conv.zaloAccountId} not connected`);
        return;
      }

      const threadType = conv.threadType === 'group' ? 1 : 0;
      
      // Helper to find the correct method name (similar to chat-routes.ts)
      const sendTextFn = (typeof instance.sendTextMessage === 'function') 
        ? instance.sendTextMessage.bind(instance)
        : (typeof instance.sendMessage === 'function')
          ? instance.sendMessage.bind(instance)
          : null;

      if (sendTextFn) {
        try {
          await sendTextFn(followUpContent, conv.externalThreadId, threadType);
        } catch (e) {
          // Some versions of the SDK require an object
          await sendTextFn({ msg: followUpContent }, conv.externalThreadId, threadType);
        }
      } else {
        logger.error('Zalo API does not support sending text messages (no method found)');
        return;
      }

      // Update conversation state
      await prisma.conversation.update({
        where: { id: conv.id },
        data: {
          followUpCount: { increment: 1 },
          lastFollowUpAt: new Date(),
          // We keep isReplied as true because we just sent another message
        }
      });

      logger.info(`Follow-up sent successfully to ${conv.externalThreadId}`);
    } catch (error) {
      logger.error(`Failed to process follow-up for ${conv.id}:`, error);
    }
  }

  /**
   * Reset follow-up state when customer messages back
   */
  static async resetFollowUp(conversationId: string) {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        followUpCount: 0,
        lastFollowUpAt: null,
        nextFollowUpAt: null
      }
    });
  }
}
