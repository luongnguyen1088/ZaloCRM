import type { AutomationRule } from '@/composables/use-automation-rules';
import type { MessageTemplate } from '@/composables/use-message-templates';
import type { OrgUser } from '@/composables/use-users';

export type AutomationPreset = {
  id: string;
  title: string;
  description: string;
  build: (options: { templates: MessageTemplate[]; users: OrgUser[] }) => Partial<AutomationRule>;
};

export const AUTOMATION_PRESETS: AutomationPreset[] = [
  {
    id: 'new-lead-assign',
    title: 'Phân công lead mới',
    description: 'Khi có contact mới, tự động gán cho một nhân viên phụ trách.',
    build: ({ users }) => ({
      name: 'Phân công lead mới',
      description: 'Tự động giao contact mới cho nhân viên phụ trách.',
      trigger: 'contact_created',
      conditions: [],
      actions: [{ type: 'assign_user', userId: users.find((user) => user.isActive)?.id || '' }],
      enabled: true,
      priority: 0,
      delaySeconds: 0,
    }),
  },
  {
    id: 'quote-interest',
    title: 'Đánh dấu khách hỏi báo giá',
    description: 'Nếu khách nhắn về báo giá, chuyển contact sang trạng thái Quan tâm.',
    build: () => ({
      name: 'Khách hỏi báo giá',
      description: 'Nhận diện khách đang quan tâm sản phẩm qua tin nhắn.',
      trigger: 'message_received',
      conditions: [{ field: 'message.content', op: 'contains', value: 'báo giá' }],
      actions: [{ type: 'update_status', status: 'interested' }],
      enabled: true,
      priority: 1,
      delaySeconds: 0,
    }),
  },
  {
    id: 'send-template',
    title: 'Gửi mẫu trả lời nhanh',
    description: 'Khi khách nhắn đúng từ khóa, gửi ngay một mẫu tin nhắn.',
    build: ({ templates }) => ({
      name: 'Gửi mẫu theo từ khóa',
      description: 'Gửi nhanh mẫu có sẵn khi khách hỏi đúng chủ đề.',
      trigger: 'message_received',
      conditions: [{ field: 'message.content', op: 'contains', value: 'ship' }],
      actions: [{ type: 'send_template', templateId: templates[0]?.id || '' }],
      enabled: true,
      priority: 1,
      delaySeconds: 0,
    }),
  },
  {
    id: 'appointment-followup',
    title: 'Tạo lịch hẹn follow-up',
    description: 'Khi contact chuyển sang Quan tâm, đặt lịch follow-up sau 24 giờ.',
    build: () => ({
      name: 'Follow-up khách quan tâm',
      description: 'Tạo lịch hẹn lại cho khách đã thể hiện nhu cầu.',
      trigger: 'status_changed',
      conditions: [{ field: 'contact.status', op: 'eq', value: 'interested' }],
      actions: [{ type: 'create_appointment', offsetHours: 24, typeLabel: 'Follow-up' }],
      enabled: true,
      priority: 0,
      delaySeconds: 0,
    }),
  },
];
