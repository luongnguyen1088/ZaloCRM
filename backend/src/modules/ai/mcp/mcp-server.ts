import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { updateAiConfig, getAiConfig } from "../ai-service.js";
import { createAiKnowledge } from "../knowledge/knowledge-service.js";
import { prisma } from "../../../shared/database/prisma-client.js";
import { logger } from "../../../shared/utils/logger.js";

/**
 * ZaloCRM Remote MCP Server
 * Exposes CRM management tools via SSE for AI Agents.
 */
export const mcpServer = new Server(
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
mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_ai_status",
        description: "Fetch current AI configuration (model, credits, status).",
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
    ],
  };
});

// Implementation of tool calls
mcpServer.setRequestHandler(CallToolRequestSchema, async (request, extra) => {
  // Extra context passed from the route handler (orgId)
  const { orgId } = (extra as any);
  if (!orgId) throw new Error("Missing organization context");

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
      default:
        throw new Error(`Tool not found: ${name}`);
    }
  } catch (err: any) {
    logger.error(`[MCP Tool Error] ${name}:`, err);
    return { isError: true, content: [{ type: "text", text: err.message }] };
  }
});
