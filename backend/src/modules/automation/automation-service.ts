import { prisma } from '../../shared/database/prisma-client.js';
import { logger } from '../../shared/utils/logger.js';
import { assignUserAction } from './actions/assign-user-action.js';
import { updateStatusAction } from './actions/update-status-action.js';
import { createAppointmentAction } from './actions/create-appointment-action.js';
import { sendTemplateAction } from './actions/send-template-action.js';
import { sanitizeAutomationActions, type AutomationAction, type AutomationCondition, type AutomationTriggerType } from './automation-rule-utils.js';

// Memory storage for active automation timers (debouncing)
// Key format: `${orgId}:${conversationId}:${ruleId}`
const activeTimers = new Map<string, NodeJS.Timeout>();

export interface AutomationContext {
  trigger: AutomationTriggerType;
  orgId: string;
  initiatedByAutomation?: boolean;
  _depth?: number;
  contact?: {
    id: string;
    fullName: string | null;
    phone: string | null;
    status: string | null;
    source?: string | null;
    assignedUserId?: string | null;
    tags?: any;
    notes?: string | null;
  } | null;
  conversation?: { id: string; unreadCount?: number; threadId?: string | null; threadType?: string; zaloAccountId?: string } | null;
  message?: { id: string; content: string | null; contentType: string; senderType?: string } | null;
  org?: { id: string; name: string | null } | null;
}

const MAX_AUTOMATION_DEPTH = 3;

export async function runAutomationRules(context: AutomationContext): Promise<void> {
  logger.info(`[automation] Triggering ${context.trigger} for Org ${context.orgId}`);
  try {
    if (context.initiatedByAutomation) return;

    const depth = context._depth ?? 0;
    if (depth >= MAX_AUTOMATION_DEPTH) {
      logger.warn('[automation] Max recursion depth reached, skipping');
      return;
    }

    const rules = await prisma.automationRule.findMany({
      where: { orgId: context.orgId, trigger: context.trigger, enabled: true },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });

    for (const rule of rules) {
      const delayMs = (rule.delaySeconds || 0) * 1000;
      
      // If there is a delay, we use debouncing logic (especially for message_received)
      if (delayMs > 0 && context.conversation?.id) {
        const timerKey = `${context.orgId}:${context.conversation.id}:${rule.id}`;
        
        // Clear existing timer if any (reset the clock)
        if (activeTimers.has(timerKey)) {
          clearTimeout(activeTimers.get(timerKey));
          activeTimers.delete(timerKey);
        }
        
        // Set a new timer
        const timeout = setTimeout(async () => {
          activeTimers.delete(timerKey);
          await executeRule(rule, context);
        }, delayMs);
        
        activeTimers.set(timerKey, timeout);
        continue;
      }

      // Immediate execution for rules without delay
      await executeRule(rule, context);
    }
  } catch (error) {
    logger.error('[automation] runAutomationRules critical error:', error);
  }
}

async function executeRule(rule: any, context: AutomationContext): Promise<void> {
  try {
    const conditions = Array.isArray(rule.conditions) ? (rule.conditions as unknown as AutomationCondition[]) : [];
    const actions = sanitizeAutomationActions(rule.actions) as AutomationAction[];
    
    if (!matchesConditions(conditions, context)) return;
    if (actions.length === 0) return;

    for (const action of actions) {
      await executeAction(action, context);
    }

    await prisma.automationRule.update({
      where: { id: rule.id },
      data: { runCount: { increment: 1 }, lastRunAt: new Date() },
    });
  } catch (error) {
    logger.error(`[automation] Rule "${rule.name}" (${rule.id}) execution failed:`, error);
  }
}

function matchesConditions(conditions: AutomationCondition[], context: AutomationContext): boolean {
  return conditions.every((condition) => evaluateCondition(condition, context));
}

function evaluateCondition(condition: AutomationCondition, context: AutomationContext): boolean {
  const current = getFieldValue(condition.field, context);

  switch (condition.op) {
    case 'eq': return current === condition.value;
    case 'neq': return current !== condition.value;
    case 'contains': return String(current ?? '').toLowerCase().includes(String(condition.value ?? '').toLowerCase());
    case 'in': return Array.isArray(condition.value) ? condition.value.includes(current) : false;
    case 'gt': return Number(current ?? 0) > Number(condition.value ?? 0);
    case 'lt': return Number(current ?? 0) < Number(condition.value ?? 0);
    case 'is_empty': return current === null || current === undefined || current === '';
    case 'is_not_empty': return !(current === null || current === undefined || current === '');
    default: return false;
  }
}

function getFieldValue(field: string, context: AutomationContext): unknown {
  switch (field) {
    case 'contact.source': return context.contact?.source;
    case 'contact.status': return context.contact?.status;
    case 'contact.assignedUserId': return context.contact?.assignedUserId;
    case 'contact.tags': return Array.isArray(context.contact?.tags) ? context.contact.tags.join(',') : '';
    case 'contact.notes': return context.contact?.notes;
    case 'message.content': return context.message?.content;
    case 'message.contentType': return context.message?.contentType;
    case 'conversation.unreadCount': return context.conversation?.unreadCount;
    case 'conversation.zaloAccountId': return context.conversation?.zaloAccountId;
    default: return undefined;
  }
}

async function executeAction(action: AutomationAction, context: AutomationContext): Promise<void> {
  if (!context.contact?.id) return;

  if (action.type === 'assign_user' && action.userId) {
    await assignUserAction(context.contact.id, action.userId, context.orgId);
    return;
  }

  if (action.type === 'update_status' && action.status) {
    await updateStatusAction(context.contact.id, action.status);
    return;
  }

  if (action.type === 'create_appointment') {
    await createAppointmentAction({
      orgId: context.orgId,
      contactId: context.contact.id,
      assignedUserId: context.contact.assignedUserId ?? null,
      offsetHours: action.offsetHours,
      typeLabel: action.typeLabel,
      notes: action.notes,
    });
    return;
  }

  if (action.type === 'send_template' && context.conversation?.id && context.conversation.zaloAccountId) {
    const sentMessage = await sendTemplateAction({
      templateId: action.templateId,
      orgId: context.orgId,
      conversationId: context.conversation.id,
      zaloAccountId: context.conversation.zaloAccountId,
      threadId: context.conversation.threadId ?? null,
      threadType: context.conversation.threadType ?? 'user',
      context: { org: context.org, contact: context.contact, conversation: context.conversation },
    });

    if (sentMessage) {
      await prisma.conversation.update({
        where: { id: context.conversation.id },
        data: { lastMessageAt: new Date(), isReplied: true, unreadCount: 0 },
      });
    }
    return;
  }
}
