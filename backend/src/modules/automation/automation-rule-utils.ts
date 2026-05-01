export type AutomationTriggerType = 'message_received' | 'contact_created' | 'status_changed';

export type AutomationCondition = {
  field: string;
  op: 'eq' | 'neq' | 'contains' | 'in' | 'gt' | 'lt' | 'is_empty' | 'is_not_empty';
  value?: unknown;
};

export type AutomationAction =
  | { type: 'assign_user'; userId: string }
  | { type: 'send_template'; templateId: string }
  | { type: 'update_status'; status: string }
  | { type: 'create_appointment'; offsetHours?: number; typeLabel?: string; notes?: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function sanitizeString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export function sanitizeAutomationActions(actions: unknown): AutomationAction[] {
  if (!Array.isArray(actions)) return [];

  return actions.reduce<AutomationAction[]>((acc, action) => {
    if (!isRecord(action) || typeof action.type !== 'string') return acc;

    switch (action.type) {
      case 'assign_user': {
        const userId = sanitizeString(action.userId);
        if (userId) acc.push({ type: 'assign_user', userId });
        return acc;
      }
      case 'send_template': {
        const templateId = sanitizeString(action.templateId);
        if (templateId) acc.push({ type: 'send_template', templateId });
        return acc;
      }
      case 'update_status': {
        const status = sanitizeString(action.status);
        if (status) acc.push({ type: 'update_status', status });
        return acc;
      }
      case 'create_appointment': {
        const normalized: AutomationAction = { type: 'create_appointment' };
        if (action.offsetHours !== undefined) normalized.offsetHours = Number(action.offsetHours ?? 0);
        const typeLabel = sanitizeString(action.typeLabel);
        const notes = sanitizeString(action.notes);
        if (typeLabel) normalized.typeLabel = typeLabel;
        if (notes) normalized.notes = notes;
        acc.push(normalized);
        return acc;
      }
      default:
        return acc;
    }
  }, []);
}

export function hasLegacyAiReplyAction(actions: unknown): boolean {
  return Array.isArray(actions) && actions.some((action) => isRecord(action) && action.type === 'ai_reply');
}
