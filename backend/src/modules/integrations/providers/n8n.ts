/**
 * n8n.ts — Trigger n8n workflows with CRM data.
 * Config shape: { webhookUrl: string }
 */
import { prisma } from '../../../shared/database/prisma-client.js';
import { logger } from '../../../shared/utils/logger.js';

interface N8nConfig {
  webhookUrl?: string;
}

export async function triggerN8nWebhook(
  orgId: string,
  config: N8nConfig,
): Promise<{ direction: 'export'; recordCount: number; status: 'success' | 'failed'; errorMessage?: string }> {
  const { webhookUrl } = config;

  if (!webhookUrl) {
    return { direction: 'export', recordCount: 0, status: 'failed', errorMessage: 'Missing n8n webhookUrl' };
  }

  try {
    // Send recent contacts created in last 24h as a sample
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const contacts = await prisma.contact.findMany({
      where: { orgId, createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
      take: 200, // n8n can handle more bulk usually
    });

    const payload = {
      source: 'ZaloCRM',
      event: 'contacts.sync',
      orgId,
      timestamp: new Date().toISOString(),
      count: contacts.length,
      data: contacts.map((c: any) => ({
        id: c.id,
        fullName: c.fullName,
        phone: c.phone,
        email: c.email,
        source: c.source,
        status: c.status,
        tags: c.tags,
        notes: c.notes,
        createdAt: c.createdAt.toISOString(),
      })),
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30_000), // n8n workflows can be slower
    });

    if (!response.ok) {
      const body = await response.text();
      logger.error('[n8n] Error:', body);
      return { direction: 'export', recordCount: 0, status: 'failed', errorMessage: `n8n ${response.status}: ${body.slice(0, 200)}` };
    }

    logger.info(`[n8n] Sent ${contacts.length} contacts to n8n`);
    return { direction: 'export', recordCount: contacts.length, status: 'success' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { direction: 'export', recordCount: 0, status: 'failed', errorMessage: msg };
  }
}
