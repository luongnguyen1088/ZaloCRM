import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { setupMcpServer } from './mcp-server.js';
import { logger } from '../../../shared/utils/logger.js';

// Multiple sessions might be active across different users
// Key is some session ID or just the reply object reference
import { createMcpTicket, consumeMcpTicket } from './mcp-ticket-service.js';

// Multiple sessions might be active across different users
// Key is the sessionId from the transport
const transports = new Map<string, SSEServerTransport>();

export async function mcpRoutes(app: FastifyInstance) {
  
  // 1. Generate Ticket (requires full auth)
  app.post('/api/v1/ai/mcp/ticket', async (request: FastifyRequest, reply: FastifyReply) => {
    const orgId = request.user?.orgId;
    const userId = request.user?.id;
    if (!orgId || !userId) return reply.code(401).send({ error: "Unauthorized" });

    const ticketId = createMcpTicket(orgId, userId);
    return { ticket: ticketId };
  });

  // 2. SSE Connection Endpoint (uses ticket)
  app.get('/api/v1/ai/mcp/sse', async (request: FastifyRequest, reply: FastifyReply) => {
    const { ticket } = request.query as { ticket?: string };
    
    // Validate ticket
    if (!ticket) return reply.code(400).send({ error: "Missing ticket" });
    const ticketData = consumeMcpTicket(ticket);
    if (!ticketData) return reply.code(401).send({ error: "Invalid or expired ticket" });

    const orgId = ticketData.orgId;
    logger.info(`[MCP] New connection established for org: ${orgId}`);

    // Create transport
    const transport = new SSEServerTransport("/api/v1/ai/mcp/messages", reply.raw);
    
    // Store transport
    transports.set(transport.sessionId, transport);

    // Setup server for this specific organization
    const server = setupMcpServer(orgId);

    // Connect the server to this transport
    await server.connect(transport);
    
    // Cleanup when connection closes
    request.raw.on('close', () => {
      logger.info(`[MCP] Connection closed for org: ${orgId}`);
      transports.delete(transport.sessionId);
    });
  });

  // 3. Message Endpoint (where the client POSTs JSON-RPC messages)
  app.post('/api/v1/ai/mcp/messages', async (request: FastifyRequest, reply: FastifyReply) => {
    const { sessionId } = request.query as { sessionId?: string };
    if (!sessionId) return reply.code(400).send({ error: "Missing sessionId" });

    const transport = transports.get(sessionId);
    if (!transport) return reply.code(404).send({ error: "Session not found" });

    // Hand over the body to the transport
    await transport.handlePostMessage(request.raw, reply.raw);
  });
}
