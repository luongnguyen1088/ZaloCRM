import type { AutomationAction, AutomationCondition, AutomationRule } from '@/composables/use-automation-rules';
import type { MessageTemplate } from '@/composables/use-message-templates';
import type { ZaloAccount } from '@/composables/use-zalo-accounts';
import type { OrgUser } from '@/composables/use-users';

type SummaryOptions = {
  templates?: MessageTemplate[];
  accounts?: ZaloAccount[];
  users?: OrgUser[];
};

const TRIGGER_LABELS: Record<string, string> = {
  message_received: 'Khi có tin nhắn đến',
  contact_created: 'Khi tạo contact mới',
  status_changed: 'Khi đổi trạng thái contact',
};

const FIELD_LABELS: Record<string, string> = {
  'contact.source': 'nguồn contact',
  'contact.status': 'trạng thái contact',
  'contact.tags': 'thẻ khách hàng',
  'contact.notes': 'ghi chú contact',
  'contact.assignedUserId': 'người phụ trách',
  'message.content': 'nội dung tin nhắn',
  'message.contentType': 'loại tin nhắn',
  'conversation.unreadCount': 'số tin chưa đọc',
  'conversation.zaloAccountId': 'tài khoản Zalo',
};

const OPERATOR_LABELS: Record<string, string> = {
  eq: 'bằng',
  neq: 'khác',
  contains: 'chứa',
  in: 'nằm trong',
  gt: 'lớn hơn',
  lt: 'nhỏ hơn',
  is_empty: 'để trống',
  is_not_empty: 'không trống',
};

const STATUS_LABELS: Record<string, string> = {
  new: 'Mới',
  contacted: 'Đã liên hệ',
  interested: 'Quan tâm',
  converted: 'Chuyển đổi',
  lost: 'Mất',
};

function formatConditionValue(condition: AutomationCondition, options: SummaryOptions) {
  if (condition.op === 'is_empty' || condition.op === 'is_not_empty') return '';

  if (condition.field === 'conversation.zaloAccountId') {
    const account = options.accounts?.find((item) => item.id === condition.value);
    return account?.displayName || String(condition.value ?? '');
  }

  if (condition.field === 'contact.assignedUserId') {
    const user = options.users?.find((item) => item.id === condition.value);
    return user?.fullName || String(condition.value ?? '');
  }

  if (Array.isArray(condition.value)) {
    return condition.value.join(', ');
  }

  return String(condition.value ?? '');
}

export function summarizeCondition(condition: AutomationCondition, options: SummaryOptions = {}) {
  const fieldLabel = FIELD_LABELS[condition.field] || condition.field;
  const operatorLabel = OPERATOR_LABELS[condition.op] || condition.op;
  const valueLabel = formatConditionValue(condition, options);

  if (!valueLabel) return `${fieldLabel} ${operatorLabel}`;
  return `${fieldLabel} ${operatorLabel} "${valueLabel}"`;
}

export function summarizeAction(action: AutomationAction, options: SummaryOptions = {}) {
  switch (action.type) {
    case 'assign_user': {
      const user = options.users?.find((item) => item.id === action.userId);
      return `chuyển cho ${user?.fullName || 'nhân viên đã chọn'}`;
    }
    case 'send_template': {
      const template = options.templates?.find((item) => item.id === action.templateId);
      return `gửi mẫu "${template?.name || 'tin nhắn đã chọn'}"`;
    }
    case 'update_status':
      return `cập nhật trạng thái thành ${STATUS_LABELS[action.status || ''] || action.status || 'giá trị đã chọn'}`;
    case 'create_appointment': {
      const offset = action.offsetHours ?? 24;
      const typeLabel = action.typeLabel ? ` (${action.typeLabel})` : '';
      return `tạo lịch hẹn sau ${offset} giờ${typeLabel}`;
    }
    default:
      return action.type;
  }
}

export function summarizeRule(rule: Partial<AutomationRule>, options: SummaryOptions = {}) {
  const triggerLabel = TRIGGER_LABELS[rule.trigger || ''] || 'Khi rule được kích hoạt';
  const conditions = (rule.conditions || []).map((item) => summarizeCondition(item, options));
  const actions = (rule.actions || []).map((item) => summarizeAction(item, options));
  const parts = [triggerLabel];

  if (conditions.length) {
    parts.push(`nếu ${conditions.join(' và ')}`);
  }

  if (actions.length) {
    parts.push(`thì ${actions.join(', ')}`);
  }

  let summary = parts.join(', ');
  if (rule.delaySeconds && Number(rule.delaySeconds) > 0) {
    summary += ` sau ${rule.delaySeconds} giây`;
  }

  return summary;
}
