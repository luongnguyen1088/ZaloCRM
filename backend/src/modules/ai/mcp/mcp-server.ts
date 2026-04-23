import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { updateAiConfig, getAiConfig } from "../ai-service.js";
import { createAiKnowledge } from "../knowledge/knowledge-service.js";
import { prisma } from "../../../shared/database/prisma-client.js";
import { logger } from "../../../shared/utils/logger.js";

/**
 * Creates a new ZaloCRM MCP Server instance for a specific organization.
 */
export function setupMcpServer(orgId: string): Server {
  const server = new Server(
    {
      name: "zalocrm-remote",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Define the available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "get_ai_status",
          description: "Fetch current AI configuration (model, tokens, status).",
          inputSchema: { type: "object", properties: {}, required: [] },
        },
        {
          name: "update_ai_settings",
          description: "Update AI settings (e.g., enable/disable AI).",
          inputSchema: {
            type: "object",
            properties: { enabled: { type: "boolean" } },
            required: ["enabled"],
          },
        },
        {
          name: "train_ai_knowledge",
          description: "Add new knowledge items to train the AI's response logic.",
          inputSchema: {
            type: "object",
            properties: {
              title: { type: "string" },
              content: { type: "string" },
              category: { type: "string" },
              zaloAccountId: { type: "string" },
            },
            required: ["title", "content"],
          },
        },
        {
          name: "create_automation_rule",
          description: "Setup a new trigger-based automation rule.",
          inputSchema: {
            type: "object",
            properties: {
              name: { type: "string" },
              trigger: { type: "string", enum: ["message_received", "contact_created"] },
              conditions: { type: "array", items: { type: "object" } },
              actions: { type: "array", items: { type: "object" } },
            },
            required: ["name", "trigger", "conditions", "actions"],
          },
        },
        {
          name: "search_contacts",
          description: "Search for contacts by name, phone, or tags.",
          inputSchema: {
            type: "object",
            properties: {
              query: { type: "string", description: "Name, phone, or email to search for" },
              limit: { type: "number", default: 10 }
            },
            required: ["query"],
          },
        },
        {
          name: "get_contact_details",
          description: "Get full profile and activity log for a specific contact.",
          inputSchema: {
            type: "object",
            properties: {
              contactId: { type: "string", description: "The internal UUID of the contact" }
            },
            required: ["contactId"],
          },
        },
      ],
    };
  });

  // Implementation of tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case "get_ai_status": {
          const config = await getAiConfig(orgId);
          return { content: [{ type: "text", text: JSON.stringify(config, null, 2) }] };
        }
        case "update_ai_settings": {
          const result = await updateAiConfig(orgId, { enabled: args!.enabled as boolean });
          return { content: [{ type: "text", text: `AI ${result.enabled ? 'Enabled' : 'Disabled'} for your organization.` }] };
        }
        case "train_ai_knowledge": {
          const item = await createAiKnowledge(orgId, {
            title: args!.title as string,
            content: args!.content as string,
            category: args!.category as string,
            zaloAccountId: args!.zaloAccountId as string,
          });
          return { content: [{ type: "text", text: `Knowledge "${item.title}" added successfully.` }] };
        }
        case "create_automation_rule": {
          const rule = await prisma.automationRule.create({
            data: {
              orgId,
              name: args!.name as string,
              trigger: args!.trigger as any,
              conditions: args!.conditions as any,
              actions: args!.actions as any,
              enabled: true,
            },
          });
          return { content: [{ type: "text", text: `Automation rule "${rule.name}" created.` }] };
        }
        case "search_contacts": {
          const query = args!.query as string;
          const limit = (args!.limit as number) || 10;
          const contacts = await prisma.contact.findMany({
            where: {
              orgId,
              OR: [
                { fullName: { contains: query, mode: 'insensitive' } },
                { phone: { contains: query } },
                { zaloUid: { contains: query } },
              ],
            },
            take: limit,
            select: { id: true, fullName: true, phone: true, status: true, lastActivity: true },
          });
          return { content: [{ type: "text", text: JSON.stringify(contacts, null, 2) }] };
        }
        case "get_contact_details": {
          const contactId = args!.contactId as string;
          const contact = await prisma.contact.findFirst({
            where: { id: contactId, orgId },
            include: {
              activityLogs: { orderBy: { createdAt: 'desc' }, take: 5 },
              appointments: { orderBy: { appointmentDate: 'desc' }, take: 3 },
            },
          });
          if (!contact) throw new Error("Contact not found");
          return { content: [{ type: "text", text: JSON.stringify(contact, null, 2) }] };
        }
        default:
          throw new Error(`Tool not found: ${name}`);
      }
    } catch (err: any) {
      logger.error(`[MCP Tool Error] ${name} (Org: ${orgId}):`, err);
      return { isError: true, content: [{ type: "text", text: err.message }] };
    }
  });

  return server;
}
