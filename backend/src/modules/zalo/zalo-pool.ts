/**
 * ZaloAccountPool — singleton that manages live Zalo SDK instances.
 * Handles QR login, session reconnect, message listener lifecycle,
 * and credential persistence to the database.
 *
 * Note: zca-js is imported via createRequire because its TypeScript
 * declarations don't expose named exports in ESM mode.
 */
import { createRequire } from 'module';
import type { Server } from 'socket.io';
import { prisma } from '../../shared/database/prisma-client.js';
import { logger } from '../../shared/utils/logger.js';
import { attachZaloListener, type UserInfoCacheEntry } from './zalo-listener-factory.js';
import { emitWebhook } from '../api/webhook-service.js';
import { zaloReconnectQueue } from './zalo-worker-queue.js';

// zca-js has no reliable ESM type exports — load via CJS interop
const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Zalo } = require('zca-js') as { Zalo: new (opts: { logging: boolean; imageMetadataGetter?: (path: string) => Promise<{ width: number; height: number }> }) => any };
const sizeOf = require('image-size');


interface ZaloCredentials {
  cookie: any;
  imei: string;
  userAgent: string;
}

interface ZaloInstance {
  zalo: any;
  api: any;
  status: 'connected' | 'disconnected' | 'qr_pending' | 'connecting';
  displayName?: string;
  avatarUrl?: string;
  zaloUid?: string;
  lastActivity: Date;
  lastHeartbeat: Date;
}

class ZaloAccountPool {
  private instances = new Map<string, ZaloInstance>();
  private io: Server | null = null;
  // Shared user-info cache passed into each listener context
  private userInfoCache = new Map<string, UserInfoCacheEntry>();
  // Circuit breaker: track disconnect timestamps per account
  private disconnectHistory = new Map<string, number[]>();
  private monitorInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startSmartHeartbeat();
  }

  setIO(io: Server): void {
    this.io = io;
  }

  // Activity tracking for Smart Heartbeat
  markActivity(accountId: string): void {
    const inst = this.instances.get(accountId);
    if (inst) {
      inst.lastActivity = new Date();
      logger.debug(`[zalo:${accountId}] Activity detected, refreshing lastActivity`);
    }
  }

  // Initiate QR-based login; emits QR events to frontend via Socket.IO
  async loginQR(accountId: string): Promise<void> {
    const zalo = new Zalo({ 
      logging: false,
      imageMetadataGetter: async (filePath: string) => {
        try {
          const dimensions = sizeOf(filePath);
          return { width: dimensions.width || 0, height: dimensions.height || 0 };
        } catch (err) {
          logger.error(`[zalo] imageMetadataGetter error for ${filePath}:`, err);
          return { width: 0, height: 0 };
        }
      }
    });

    this.instances.set(accountId, { 
      zalo, 
      api: null, 
      status: 'qr_pending', 
      lastActivity: new Date(),
      lastHeartbeat: new Date()
    });

    try {
      const api = await zalo.loginQR({}, (event: any) => {
        switch (event.type) {
          case 0: // QRCodeGenerated
            this.io?.to(`account:${accountId}`).emit('zalo:qr', { accountId, qrImage: event.data.image });
            break;
          case 1: // QRCodeExpired
            this.io?.to(`account:${accountId}`).emit('zalo:qr-expired', { accountId });
            event.actions?.retry();
            break;
          case 2: // QRCodeScanned
            this.io?.to(`account:${accountId}`).emit('zalo:scanned', {
              accountId,
              displayName: event.data.display_name,
              avatar: event.data.avatar,
            });
            // Cập nhật thông tin profile vào instance tạm thời
            const inst = this.instances.get(accountId);
            if (inst) {
              inst.displayName = event.data.display_name;
              inst.avatarUrl = event.data.avatar;
            }
            break;
          case 4: // GotLoginInfo
            this.saveCredentials(accountId, {
              cookie: event.data.cookie,
              imei: event.data.imei,
              userAgent: event.data.userAgent,
            });
            break;
        }
      });

      const instance = this.instances.get(accountId)!;
      instance.api = api;
      instance.status = 'connected';
      instance.lastActivity = new Date();

      const ownId = await api.getOwnId();
      instance.zaloUid = ownId;

      this.attachListener(accountId, api);
      const currentInst = this.instances.get(accountId);
      await this.updateAccountDB(
        accountId, 
        'connected', 
        ownId, 
        currentInst?.displayName, 
        currentInst?.avatarUrl
      );
      this.io?.emit('zalo:connected', { accountId, zaloUid: ownId });
      // Emit webhook (orgId lookup is async, fire-and-forget)
      prisma.zaloAccount.findUnique({ where: { id: accountId }, select: { orgId: true } })
        .then((rec) => rec && emitWebhook(rec.orgId, 'zalo.connected', { accountId }))
        .catch(() => {});
    } catch (err) {
      const instance = this.instances.get(accountId);
      if (instance) instance.status = 'disconnected';
      this.io?.emit('zalo:error', { accountId, error: String(err) });
      throw err;
    }
  }

  // Reconnect with existing credentials
  async reconnect(accountId: string, credentials: ZaloCredentials): Promise<void> {
    const zalo = new Zalo({ 
      logging: false,
      imageMetadataGetter: async (filePath: string) => {
        try {
          const dimensions = sizeOf(filePath);
          return { width: dimensions.width || 0, height: dimensions.height || 0 };
        } catch (err) {
          logger.error(`[zalo] imageMetadataGetter error for ${filePath}:`, err);
          return { width: 0, height: 0 };
        }
      }
    });

    this.instances.set(accountId, { 
      zalo, 
      api: null, 
      status: 'connecting', 
      lastActivity: new Date(),
      lastHeartbeat: new Date()
    });

    try {
      const api = await zalo.login({
        cookie: credentials.cookie,
        imei: credentials.imei,
        userAgent: credentials.userAgent,
      });

      const instance = this.instances.get(accountId)!;
      instance.api = api;
      instance.status = 'connected';
      instance.lastActivity = new Date();

      const ownId = await api.getOwnId();
      instance.zaloUid = ownId;

      this.attachListener(accountId, api);
      await this.updateAccountDB(accountId, 'connected', ownId);
      this.io?.emit('zalo:connected', { accountId, zaloUid: ownId });
      prisma.zaloAccount.findUnique({ where: { id: accountId }, select: { orgId: true } })
        .then((rec) => rec && emitWebhook(rec.orgId, 'zalo.connected', { accountId }))
        .catch(() => {});
    } catch (err) {
      const instance = this.instances.get(accountId);
      if (instance) instance.status = 'disconnected';
      await this.updateAccountDB(accountId, 'qr_pending', null);
      this.io?.emit('zalo:reconnect-failed', { accountId, error: String(err) });
      throw err; // Allow queue to handle retries
    }
  }

  // Delegate listener setup to zalo-listener-factory
  private attachListener(accountId: string, api: any): void {
    attachZaloListener({
      accountId,
      api,
      io: this.io,
      userInfoCache: this.userInfoCache,
      onActivity: (id) => this.markActivity(id),
      onDisconnected: (id) => {
        const inst = this.instances.get(id);
        if (inst) inst.status = 'disconnected';
        this.updateAccountDB(id, 'disconnected', null);
        // Emit webhook for disconnect (fire-and-forget)
        prisma.zaloAccount.findUnique({ where: { id }, select: { orgId: true } })
          .then((rec) => rec && emitWebhook(rec.orgId, 'zalo.disconnected', { accountId: id }))
          .catch(() => {});

        // Circuit breaker: track disconnect count per account
        const now = Date.now();
        const key = `dc_${id}`;
        const history = (this.disconnectHistory.get(key) || []).filter(t => now - t < 5 * 60_000);
        history.push(now);
        this.disconnectHistory.set(key, history);

        if (history.length >= 5) {
          // >5 disconnects in 5 min → stop reconnecting, require QR re-login
          logger.error(`[zalo:${id}] Circuit breaker triggered. Stopped auto-reconnect.`);
          this.updateAccountDB(id, 'qr_pending', null);
          this.io?.emit('zalo:reconnect-failed', { accountId: id, error: 'Session không ổn định, cần đăng nhập lại' });
          this.disconnectHistory.delete(key);
          return; // DON'T reconnect
        }

        // Use Worker Queue for reconnection
        this.enqueueAutoReconnect(id);
      },
    });
  }

  // Smart Heartbeat Logic
  private startSmartHeartbeat(): void {
    if (this.monitorInterval) clearInterval(this.monitorInterval);
    
    this.monitorInterval = setInterval(async () => {
      const now = Date.now();
      for (const [id, inst] of this.instances) {
        if (inst.status !== 'connected' || !inst.api) continue;

        const sinceLastActivity = now - inst.lastActivity.getTime();
        const sinceLastHeartbeat = now - inst.lastHeartbeat.getTime();

        // If active in the last 2 minutes, skip heartbeat
        if (sinceLastActivity < 120_000) continue;

        // Ping if silent for > 2 minutes OR last heartbeat was > 5 minutes ago
        if (sinceLastActivity > 120_000 || sinceLastHeartbeat > 300_000) {
          try {
            logger.debug(`[zalo:${id}] Smart Heartbeat: Pinging...`);
            await inst.api.getOwnId();
            inst.lastHeartbeat = new Date();
          } catch (err) {
            logger.warn(`[zalo:${id}] Smart Heartbeat: Ping failed. Account may be disconnected.`);
            inst.status = 'disconnected';
            this.enqueueAutoReconnect(id);
          }
        }
      }
    }, 30_000); // Check every 30 seconds
  }

  private async enqueueAutoReconnect(accountId: string): Promise<void> {
    const account = await prisma.zaloAccount.findUnique({
      where: { id: accountId },
      select: { sessionData: true },
    });
    const session = account?.sessionData as ZaloCredentials | null;
    
    if (session?.imei) {
      zaloReconnectQueue.enqueue(accountId, async () => {
        await this.reconnect(accountId, session);
      });
    }
  }

  // Persist session credentials to DB
  private saveCredentials(accountId: string, credentials: ZaloCredentials): void {
    prisma.zaloAccount
      .update({ where: { id: accountId }, data: { sessionData: credentials as any } })
      .catch((err) => logger.error(`[zalo:${accountId}] saveCredentials error:`, err));
  }

  // Sync account status and zaloUid to DB
  private async updateAccountDB(
    accountId: string, 
    status: string, 
    zaloUid: string | null,
    displayName?: string,
    avatarUrl?: string
  ): Promise<void> {
    try {
      await prisma.zaloAccount.update({
        where: { id: accountId },
        data: {
          status,
          ...(zaloUid !== null ? { zaloUid } : {}),
          ...(displayName ? { displayName } : {}),
          ...(avatarUrl ? { avatarUrl } : {}),
          ...(status === 'connected' ? { lastConnectedAt: new Date() } : {}),
        },
      });
    } catch (err) {
      logger.error(`[zalo:${accountId}] updateAccountDB error:`, err);
    }
  }

  // Stop listener and remove from pool
  disconnect(accountId: string): void {
    const instance = this.instances.get(accountId);
    if (instance?.api?.listener) {
      try { instance.api.listener.stop(); } catch (err) {}
    }
    this.instances.delete(accountId);
  }

  getStatus(accountId: string): string {
    return this.instances.get(accountId)?.status ?? 'disconnected';
  }

  getAllStatuses(): Record<string, string> {
    const statuses: Record<string, string> = {};
    for (const [id, inst] of this.instances) statuses[id] = inst.status;
    return statuses;
  }

  // Return raw API instance for direct SDK calls (e.g. public API send message)
  getApi(accountId: string): any | null {
    const inst = this.instances.get(accountId);
    return inst?.status === 'connected' ? inst.api : null;
  }

  getInstance(accountId: string): ZaloInstance | undefined {
    return this.instances.get(accountId);
  }
}

export const zaloPool = new ZaloAccountPool();
