import cron from 'node-cron';
import { Prisma } from '@prisma/client';
import { zaloPool } from './zalo-pool.js';
import { prisma } from '../../shared/database/prisma-client.js';
import { logger } from '../../shared/utils/logger.js';
import { zaloReconnectQueue } from './zalo-worker-queue.js';

export function startZaloHealthCheck(): void {
  // Every 5 minutes: check all accounts with saved sessions
  cron.schedule('*/5 * * * *', async () => {
    try {
      const accounts = await prisma.zaloAccount.findMany({
        where: { sessionData: { not: Prisma.JsonNull } },
        select: { id: true, displayName: true, sessionData: true },
      });

      for (const acc of accounts) {
        const status = zaloPool.getStatus(acc.id);
        if (status !== 'connected' && status !== 'connecting' && status !== 'qr_pending') {
          const session = acc.sessionData as any;
          if (session?.imei) {
            logger.info(`[health-check] Enqueueing reconnect for ${acc.displayName || acc.id}...`);
            zaloReconnectQueue.enqueue(acc.id, async () => {
              await zaloPool.reconnect(acc.id, session);
            });
          }
        }
      }
    } catch (err) {
      logger.error('[health-check] Error during health check:', err);
    }
  });

  // Daily at 04:00 UTC (11:00 AM VN): refresh all sessions to keep cookies alive
  cron.schedule('0 4 * * *', async () => {
    logger.info('[health-check] Daily session refresh starting...');
    try {
      const accounts = await prisma.zaloAccount.findMany({
        where: { sessionData: { not: Prisma.JsonNull } },
        select: { id: true, sessionData: true },
      });

      for (const acc of accounts) {
        const session = acc.sessionData as any;
        if (session?.imei) {
          zaloReconnectQueue.enqueue(acc.id, async () => {
            logger.info(`[health-check] Refreshing session for ${acc.id}`);
            zaloPool.disconnect(acc.id);
            await new Promise((r) => setTimeout(r, 5000));
            await zaloPool.reconnect(acc.id, session);
          });
        }
      }
    } catch (err) {
      logger.error('[health-check] Error during daily refresh:', err);
    }
  });

  logger.info('[health-check] Zalo health check started (using Worker Queue)');
}
