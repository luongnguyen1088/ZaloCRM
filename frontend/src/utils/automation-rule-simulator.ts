import type { AutomationCondition, AutomationRule } from '@/composables/use-automation-rules';
import { summarizeCondition } from './automation-rule-summary';

export type AutomationSimulationInput = {
  contactSource?: string;
  contactStatus?: string;
  contactTags?: string;
  contactNotes?: string;
  contactAssignedUserId?: string;
  messageContent?: string;
  messageContentType?: string;
  conversationUnreadCount?: number;
  conversationZaloAccountId?: string;
};

function getFieldValue(field: string, input: AutomationSimulationInput): unknown {
  switch (field) {
    case 'contact.source':
      return input.contactSource;
    case 'contact.status':
      return input.contactStatus;
    case 'contact.tags':
      return input.contactTags;
    case 'contact.notes':
      return input.contactNotes;
    case 'contact.assignedUserId':
      return input.contactAssignedUserId;
    case 'message.content':
      return input.messageContent;
    case 'message.contentType':
      return input.messageContentType;
    case 'conversation.unreadCount':
      return input.conversationUnreadCount;
    case 'conversation.zaloAccountId':
      return input.conversationZaloAccountId;
    default:
      return undefined;
  }
}

function evaluateCondition(condition: AutomationCondition, input: AutomationSimulationInput): boolean {
  const current = getFieldValue(condition.field, input);

  switch (condition.op) {
    case 'eq':
      return current === condition.value;
    case 'neq':
      return current !== condition.value;
    case 'contains':
      return String(current ?? '').toLowerCase().includes(String(condition.value ?? '').toLowerCase());
    case 'in':
      return Array.isArray(condition.value) ? condition.value.includes(String(current ?? '')) : false;
    case 'gt':
      return Number(current ?? 0) > Number(condition.value ?? 0);
    case 'lt':
      return Number(current ?? 0) < Number(condition.value ?? 0);
    case 'is_empty':
      return current === null || current === undefined || current === '';
    case 'is_not_empty':
      return !(current === null || current === undefined || current === '');
    default:
      return false;
  }
}

export function simulateAutomationRule(rule: Partial<AutomationRule>, input: AutomationSimulationInput) {
  const conditions = rule.conditions ?? [];
  const conditionResults = conditions.map((condition) => ({
    summary: summarizeCondition(condition),
    passed: evaluateCondition(condition, input),
  }));

  return {
    matched: conditionResults.every((result) => result.passed),
    conditionResults,
  };
}
