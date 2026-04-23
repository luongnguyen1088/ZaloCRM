import { randomUUID } from 'crypto';

interface McpTicket {
  orgId: string;
  userId: string;
  expiresAt: number;
}

// In-memory store for tickets. For production with multiple instances, use Redis.
const tickets = new Map<string, McpTicket>();

// Cleanup expired tickets every minute
setInterval(() => {
  const now = Date.now();
  for (const [id, ticket] of tickets.entries()) {
    if (ticket.expiresAt < now) {
      tickets.delete(id);
    }
  }
}, 60000);

/**
 * Creates a short-lived ticket for establishing an MCP connection.
 * Default expiry: 5 minutes.
 */
export function createMcpTicket(orgId: string, userId: string): string {
  const ticketId = randomUUID();
  tickets.set(ticketId, {
    orgId,
    userId,
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
  });
  return ticketId;
}

/**
 * Validates and consumes a ticket.
 * Once used, the ticket is removed.
 */
export function consumeMcpTicket(ticketId: string): McpTicket | null {
  const ticket = tickets.get(ticketId);
  if (!ticket) return null;
  
  tickets.delete(ticketId); // Single use
  
  if (ticket.expiresAt < Date.now()) {
    return null;
  }
  
  return ticket;
}
