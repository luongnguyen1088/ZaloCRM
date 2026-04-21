import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { updateAiConfig, getAiConfig } from "./modules/ai/ai-service.js";
import { createAiKnowledge, getAiKnowledgeList } from "./modules/ai/knowledge/knowledge-service.js";
import { prisma } from "./shared/database/prisma-client.js";

/**
 * ZaloCRM MCP Server
 * Allows AI Agents (like Antigravity) to setup, configure and train AI in ZaloCRM.
 */
const server = new Server(
  {
    name: "zalocrm-manager",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 1. Tool Definitions
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_ai_status",
        description: "Fetch current AI configuration (model, providers, credits) for an organization.",
        inputSchema: {
          type: "object",
          properties: {
            orgId: { type: "string" },
          },
          required: ["orgId"],
        },
      },
      {
        name: "update_ai_settings",
        description: "Update AI settings such as enabling/disabling the AI feature.",
        inputSchema: {
          type: "object",
          properties: {
            orgId: { type: "string" },
            enabled: { type: "boolean" },
          },
          required: ["orgId"],
        },
      },
      {
        name: "add_training_data",
        description: "Add new knowledge items to train the AI's response logic.",
        inputSchema: {
          type: "object",
          properties: {
            orgId: { type: "string" },
            title: { type: "string", description: "Short title for the knowledge piece." },
            content: { type: "string", description: "The actual facts/policy for the AI to learn." },
            category: { type: "string", description: "Helpful category like 'Shipping' or 'Pricing'." },
            zaloAccountId: { type: "string", description: "Optional: limit this knowledge to a specific Zalo OA." },
          },
          required: ["orgId", "title", "content"],
        },
      },
      {
        name: "list_zalo_accounts",
        description: "List all connected Zalo accounts (OA) for an organization.",
        inputSchema: {
          type: "object",
          properties: {
            orgId: { type: "string" },
          },
          required: ["orgId"],
        },
      },
      {
        name: "configure_automation",
        description: "Create a new automation rule with triggers, conditions, and actions.",
        inputSchema: {
          type: "object",
          properties: {
            orgId: { type: "string" },
            name: { type: "string" },
            trigger: { type: "string", enum: ["message_received", "contact_created", "status_changed"] },
            conditions: { type: "array", items: { type: "object" }, description: "Array of { field, op, value }" },
            actions: { type: "array", items: { type: "object" }, description: "Array of { type, ...params }" },
          },
          required: ["orgId", "name", "trigger", "conditions", "actions"],
        },
      },
    ],
  };
});

// 2. Tool Execution Logic
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "get_ai_status": {
        const config = await getAiConfig(args!.orgId as string);
        return {
          content: [
            {
              type: "text",
              text: `Current AI Status for Org ${args!.orgId}:\n` + JSON.stringify(config, null, 2),
            },
          ],
        };
      }

      case "update_ai_settings": {
        const result = await updateAiConfig(args!.orgId as string, {
          enabled: args!.enabled as boolean,
        });
        return {
          content: [
            {
              type: "text",
              text: `Successfully updated AI settings. Enabled: ${result.enabled}`,
            },
          ],
        };
      }

      case "add_training_data": {
        const item = await createAiKnowledge(args!.orgId as string, {
          title: args!.title as string,
          content: args!.content as string,
          category: args!.category as string,
          zaloAccountId: args!.zaloAccountId as string,
        });
        return {
          content: [
            {
              type: "text",
              text: `Added knowledge item: "${item.title}" (ID: ${item.id}). AI is now trained with this data.`,
            },
          ],
        };
      }

      case "list_zalo_accounts": {
        const accounts = await prisma.zaloAccount.findMany({
          where: { orgId: args!.orgId as string },
          select: { id: true, name: true, displayName: true },
        });
        return {
          content: [
            {
              type: "text",
              text: "Connected Zalo Accounts:\n" + JSON.stringify(accounts, null, 2),
            },
          ],
        };
      }

      case "configure_automation": {
        const rule = await prisma.automationRule.create({
          data: {
            orgId: args!.orgId as string,
            name: args!.name as string,
            trigger: args!.trigger as any,
            conditions: args!.conditions as any,
            actions: args!.actions as any,
            enabled: true,
          },
        });
        return {
          content: [
            {
              type: "text",
              text: `Created automation rule: "${rule.name}" (ID: ${rule.id}). It is now active.`,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: `Error executing ${name}: ${error.message}`,
        },
      ],
    };
  }
});

// 3. Main Run
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("ZaloCRM Management MCP Server started via Stdio");
}

main().catch((error) => {
  console.error("Server Error:", error);
  process.exit(1);
});
