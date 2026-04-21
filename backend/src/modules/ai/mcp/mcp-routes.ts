import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { mcpServer } from './mcp-server.js';
import { logger } from '../../../shared/utils/logger.js';

// Multiple sessions might be active across different users
// Key is some session ID or just the reply object reference
const transports = new Map<string, SSEServerTransport>();

export async function mcpRoutes(app: FastifyInstance) {
  
  // SSE Connection Endpoint
  app.get('/api/v1/ai/mcp/sse', async (request: FastifyRequest, reply: FastifyReply) => {
    // Authentication is handled by the parent router (authMiddleware)
    const orgId = request.user?.orgId;
    if (!orgId) return reply.code(401).send({ error: "Unauthorized" });

    logger.info(`[MCP] New connection request from org: ${orgId}`);

    // Create transport
    // The second argument is the endpoint where the client should POST messages back
    const transport = new SSEServerTransport("/api/v1/ai/mcp/messages", reply.raw);
    
    // Store transport in memory temporarily so messages can be routed to it
    // Using sessionId from transport as the key
    transports.set(transport.sessionId, transport);

    // Connect the server to this transport with extra context (orgId)
    await mcpServer.connect(transport);
    
    // Cleanup when connection closes
    request.raw.on('close', () => {
      logger.info(`[MCP] Connection closed for org: ${orgId}`);
      transports.delete(transport.sessionId);
    });
  });

  // Message Endpoint (where the client POSTs JSON-RPC messages)
  app.post('/api/v1/ai/mcp/messages', async (request: FastifyRequest, reply: FastifyReply) => {
    const sessionId = request.query['sessionId'] as string;
    if (!sessionId) return reply.code(400).send({ error: "Missing sessionId" });

    const transport = transports.get(sessionId);
    if (!transport) return reply.code(404).send({ error: "Session not found" });

    // Hand over the body to the transport
    await transport.handlePostMessage(request.raw, reply.raw);
  });
}
