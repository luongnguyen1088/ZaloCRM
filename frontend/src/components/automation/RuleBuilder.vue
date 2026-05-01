<template>
  <v-dialog
    :model-value="modelValue"
    max-width="980"
    transition="dialog-bottom-transition"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card class="rule-builder-card rounded-xl">
      <v-card-title class="pa-6 pb-2 d-flex align-center">
        <v-icon color="primary" class="mr-3">mdi-auto-fix</v-icon>
        <span class="text-h5 font-weight-bold">
          {{ rule?.id ? 'Chỉnh sửa quy tắc' : 'Thiết lập quy tắc mới' }}
        </span>
      </v-card-title>

      <v-card-text class="pa-6 pt-2 d-flex flex-column ga-6">
        <v-alert
          variant="tonal"
          color="info"
          density="comfortable"
          text="AI auto-reply đã được chuyển sang AI Studio. Automation chỉ còn dùng cho rule vận hành và mẫu tin nhắn."
        />

        <section v-if="!rule?.id">
          <div class="d-flex align-center mb-4">
            <div class="section-number mr-3">0</div>
            <div class="text-subtitle-1 font-weight-bold">Bắt đầu nhanh với preset</div>
          </div>
          <div class="preset-grid">
            <button
              v-for="preset in presets"
              :key="preset.id"
              type="button"
              class="preset-card text-left"
              @click="applyPreset(preset.id)"
            >
              <div class="font-weight-bold mb-1">{{ preset.title }}</div>
              <div class="text-caption text-medium-emphasis">{{ preset.description }}</div>
            </button>
          </div>
        </section>

        <v-card class="summary-panel" elevation="0" border>
          <div class="text-caption text-medium-emphasis text-uppercase mb-2">Tóm tắt rule</div>
          <div class="text-body-1 font-weight-medium">{{ ruleSummary }}</div>
        </v-card>

        <section>
          <div class="d-flex align-center mb-4">
            <div class="section-number mr-3">1</div>
            <div class="text-subtitle-1 font-weight-bold">Thông tin cơ bản</div>
          </div>
          <div class="d-flex flex-column ga-4 pl-9">
            <v-text-field
              v-model="localRule.name"
              label="Tên quy tắc *"
              variant="filled"
              density="comfortable"
              hide-details
              :rules="[v => !!v || 'Bắt buộc']"
            />
            <v-textarea
              v-model="localRule.description"
              label="Mô tả mục đích của quy tắc này"
              variant="filled"
              density="comfortable"
              rows="2"
              hide-details
            />

            <div class="d-flex ga-4 flex-wrap mt-2">
              <v-select
                v-model="localRule.trigger"
                :items="triggerItems"
                item-title="title"
                item-value="value"
                label="Sự kiện kích hoạt"
                variant="filled"
                density="comfortable"
                hide-details
                style="min-width: 250px"
              />
              <v-text-field
                v-model="priorityValue"
                type="number"
                label="Ưu tiên"
                variant="filled"
                density="comfortable"
                hide-details
                style="max-width: 110px"
                prepend-inner-icon="mdi-sort-variant"
              />
              <v-text-field
                v-model="delayValue"
                type="number"
                label="Độ trễ (giây)"
                variant="filled"
                density="comfortable"
                hide-details
                style="max-width: 150px"
                prepend-inner-icon="mdi-clock-fast"
                persistent-hint
                hint="Dùng cho trigger tin nhắn đến để chờ khách nhắn xong rồi mới chạy."
              />
              <div class="d-flex align-center ml-2">
                <span class="text-body-2 mr-2">Trạng thái:</span>
                <v-switch v-model="localRule.enabled" color="success" hide-details inset density="compact" />
              </div>
            </div>
          </div>
        </section>

        <v-divider class="opacity-10" />

        <section>
          <div class="d-flex align-center mb-4">
            <div class="section-number mr-3">2</div>
            <div class="text-subtitle-1 font-weight-bold">Điều kiện áp dụng (Nếu...)</div>
          </div>
          <div class="pl-9">
            <ConditionEditor v-model="ruleConditions" :zalo-accounts="zaloAccounts" />
          </div>
        </section>

        <v-divider class="opacity-10" />

        <section>
          <div class="d-flex align-center mb-4">
            <div class="section-number mr-3">3</div>
            <div class="text-subtitle-1 font-weight-bold">Hành động thực thi (Thì...)</div>
          </div>
          <div class="pl-9">
            <ActionEditor v-model="ruleActions" :templates="templates" :users="users" />
            <div v-if="submitError" class="text-caption text-error mt-2">{{ submitError }}</div>
          </div>
        </section>

        <v-divider class="opacity-10" />

        <section>
          <div class="d-flex align-center mb-4">
            <div class="section-number mr-3">4</div>
            <div class="text-subtitle-1 font-weight-bold">Simulator</div>
          </div>
          <div class="pl-9">
            <v-card class="simulator-panel" elevation="0" border>
              <div class="simulator-grid">
                <v-select
                  v-model="simulation.conversationZaloAccountId"
                  :items="accountItems"
                  item-title="title"
                  item-value="value"
                  label="Tài khoản Zalo"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                />
                <v-text-field
                  v-model="simulation.messageContent"
                  label="Nội dung tin nhắn"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                />
                <v-select
                  v-model="simulation.messageContentType"
                  :items="messageTypeItems"
                  label="Loại tin nhắn"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                />
                <v-text-field
                  v-model="simulation.contactSource"
                  label="Nguồn contact"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                />
                <v-select
                  v-model="simulation.contactStatus"
                  :items="statusItems"
                  label="Trạng thái contact"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                />
                <v-select
                  v-model="simulation.contactAssignedUserId"
                  :items="userItems"
                  item-title="title"
                  item-value="value"
                  label="Người phụ trách"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                />
                <v-text-field
                  v-model="simulation.contactTags"
                  label="Tags"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                />
                <v-text-field
                  v-model="simulation.contactNotes"
                  label="Ghi chú contact"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                />
                <v-text-field
                  v-model="unreadCountText"
                  type="number"
                  label="Số tin chưa đọc"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                />
              </div>

              <v-alert
                class="mt-4"
                :color="simulationResult.matched ? 'success' : 'warning'"
                variant="tonal"
                density="comfortable"
                :text="simulationResult.matched ? 'Rule sẽ được kích hoạt với dữ liệu mẫu hiện tại.' : 'Rule chưa match với dữ liệu mẫu hiện tại.'"
              />

              <div v-if="simulationResult.conditionResults.length" class="mt-4 d-flex flex-column ga-2">
                <div class="text-caption text-medium-emphasis text-uppercase">Kiểm tra điều kiện</div>
                <div
                  v-for="condition in simulationResult.conditionResults"
                  :key="condition.summary"
                  class="condition-check-row"
                >
                  <v-icon :color="condition.passed ? 'success' : 'warning'" size="16">
                    {{ condition.passed ? 'mdi-check-circle' : 'mdi-alert-circle-outline' }}
                  </v-icon>
                  <span class="text-body-2">{{ condition.summary }}</span>
                </div>
              </div>

              <div v-if="localRule.actions?.length" class="mt-4 d-flex flex-column ga-2">
                <div class="text-caption text-medium-emphasis text-uppercase">Các hành động sẽ chạy</div>
                <div
                  v-for="(actionSummary, index) in actionSummaries"
                  :key="`${index}-${actionSummary}`"
                  class="condition-check-row"
                >
                  <v-icon color="primary" size="16">mdi-lightning-bolt</v-icon>
                  <span class="text-body-2">{{ actionSummary }}</span>
                </div>
              </div>
            </v-card>
          </div>
        </section>
      </v-card-text>

      <v-divider class="opacity-10" />

      <v-card-actions class="pa-6">
        <v-spacer />
        <v-btn variant="text" rounded="lg" class="px-6" @click="emit('update:modelValue', false)">Hủy bỏ</v-btn>
        <v-btn
          color="primary"
          variant="flat"
          size="large"
          rounded="lg"
          class="px-10 font-weight-bold"
          :loading="saving"
          @click="submit"
        >
          Lưu thay đổi
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import ConditionEditor from './ConditionEditor.vue';
import ActionEditor from './ActionEditor.vue';
import type { AutomationAction, AutomationCondition, AutomationRule } from '@/composables/use-automation-rules';
import type { MessageTemplate } from '@/composables/use-message-templates';
import type { ZaloAccount } from '@/composables/use-zalo-accounts';
import type { OrgUser } from '@/composables/use-users';
import { summarizeAction, summarizeRule } from '@/utils/automation-rule-summary';
import { AUTOMATION_PRESETS } from '@/utils/automation-rule-presets';
import { simulateAutomationRule, type AutomationSimulationInput } from '@/utils/automation-rule-simulator';

const props = defineProps<{
  modelValue: boolean;
  rule: AutomationRule | null;
  templates: MessageTemplate[];
  zaloAccounts: ZaloAccount[];
  users: OrgUser[];
  saving: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  save: [payload: Partial<AutomationRule>];
}>();

const triggerItems = [
  { title: 'Khi có tin nhắn đến', value: 'message_received' },
  { title: 'Khi tạo contact mới', value: 'contact_created' },
  { title: 'Khi đổi trạng thái contact', value: 'status_changed' },
];

const statusItems = [
  { title: 'Mới', value: 'new' },
  { title: 'Đã liên hệ', value: 'contacted' },
  { title: 'Quan tâm', value: 'interested' },
  { title: 'Chuyển đổi', value: 'converted' },
  { title: 'Mất', value: 'lost' },
];

const messageTypeItems = ['text', 'image', 'sticker', 'video', 'voice', 'gif', 'link', 'file'];

const localRule = reactive<Partial<AutomationRule>>({
  name: '',
  description: '',
  trigger: 'contact_created',
  conditions: [],
  actions: [],
  enabled: true,
  priority: 0,
});

const simulation = reactive<AutomationSimulationInput>({
  contactSource: '',
  contactStatus: 'new',
  contactTags: '',
  contactNotes: '',
  contactAssignedUserId: '',
  messageContent: '',
  messageContentType: 'text',
  conversationUnreadCount: 1,
  conversationZaloAccountId: '',
});

const submitError = ref('');

const presets = AUTOMATION_PRESETS;

const userItems = computed(() =>
  props.users
    .filter((user) => user.isActive)
    .map((user) => ({
      title: user.team?.name ? `${user.fullName} • ${user.team.name}` : user.fullName,
      value: user.id,
    }))
);

const accountItems = computed(() =>
  props.zaloAccounts.map((account) => ({
    title: account.displayName || account.id,
    value: account.id,
  }))
);

const priorityValue = computed({
  get: () => String(localRule.priority ?? 0),
  set: (value: string) => {
    localRule.priority = Number(value || 0);
  },
});

const delayValue = computed({
  get: () => String(localRule.delaySeconds ?? 0),
  set: (value: string) => {
    localRule.delaySeconds = Number(value || 0);
  },
});

const unreadCountText = computed({
  get: () => String(simulation.conversationUnreadCount ?? 0),
  set: (value: string) => {
    simulation.conversationUnreadCount = Number(value || 0);
  },
});

const ruleConditions = computed<AutomationCondition[]>({
  get: () => localRule.conditions ?? [],
  set: (value) => {
    localRule.conditions = value;
  },
});

const ruleActions = computed<AutomationAction[]>({
  get: () => localRule.actions ?? [],
  set: (value) => {
    localRule.actions = value;
  },
});

const ruleSummary = computed(() =>
  summarizeRule(localRule, {
    templates: props.templates,
    accounts: props.zaloAccounts,
    users: props.users,
  })
);

const actionSummaries = computed(() =>
  (localRule.actions ?? []).map((action) =>
    summarizeAction(action, {
      templates: props.templates,
      accounts: props.zaloAccounts,
      users: props.users,
    })
  )
);

const simulationResult = computed(() => simulateAutomationRule(localRule, simulation));

watch(
  () => props.rule,
  (rule) => {
    submitError.value = '';
    localRule.id = rule?.id;
    localRule.name = rule?.name ?? '';
    localRule.description = rule?.description ?? '';
    localRule.trigger = rule?.trigger ?? 'contact_created';
    localRule.conditions = rule?.conditions ? [...rule.conditions] : [];
    localRule.actions = rule?.actions ? [...rule.actions] : [];
    localRule.enabled = rule?.enabled ?? true;
    localRule.priority = rule?.priority ?? 0;
    localRule.delaySeconds = rule?.delaySeconds ?? 0;
  },
  { immediate: true }
);

watch(
  () => props.zaloAccounts,
  (accounts) => {
    if (!simulation.conversationZaloAccountId && accounts.length > 0) {
      simulation.conversationZaloAccountId = accounts[0].id;
    }
  },
  { immediate: true }
);

function applyPreset(presetId: string) {
  const preset = presets.find((item) => item.id === presetId);
  if (!preset) return;
  const next = preset.build({ templates: props.templates, users: props.users });
  localRule.name = next.name ?? '';
  localRule.description = next.description ?? '';
  localRule.trigger = next.trigger ?? 'contact_created';
  localRule.conditions = next.conditions ? [...next.conditions] : [];
  localRule.actions = next.actions ? [...next.actions] : [];
  localRule.enabled = next.enabled ?? true;
  localRule.priority = next.priority ?? 0;
  localRule.delaySeconds = next.delaySeconds ?? 0;
}

function validateActions(actions: AutomationAction[]) {
  for (const action of actions) {
    if (action.type === 'assign_user' && !action.userId) {
      return 'Hành động "Chuyển cho nhân viên" cần chọn nhân viên cụ thể.';
    }
    if (action.type === 'send_template' && !action.templateId) {
      return 'Hành động "Gửi mẫu tin nhắn" cần chọn một template.';
    }
    if (action.type === 'update_status' && !action.status) {
      return 'Hành động "Cập nhật trạng thái" cần chọn trạng thái.';
    }
  }
  return '';
}

function submit() {
  if (!localRule.name?.trim()) return;
  if (!localRule.actions?.length) {
    submitError.value = 'Rule phải có ít nhất một hành động hợp lệ.';
    return;
  }

  const actionError = validateActions(localRule.actions);
  if (actionError) {
    submitError.value = actionError;
    return;
  }

  submitError.value = '';
  emit('save', {
    id: localRule.id,
    name: localRule.name,
    description: localRule.description,
    trigger: localRule.trigger,
    conditions: localRule.conditions ?? [],
    actions: localRule.actions ?? [],
    enabled: localRule.enabled ?? true,
    priority: localRule.priority ?? 0,
    delaySeconds: localRule.delaySeconds ?? 0,
  });
}
</script>

<style scoped>
.rule-builder-card {
  background: var(--color-surface-elevated) !important;
  border: 1px solid var(--color-border) !important;
}

.summary-panel,
.simulator-panel {
  padding: 16px 18px;
  background: var(--color-surface-muted) !important;
  border-color: var(--color-border) !important;
}

.preset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  padding-left: 36px;
}

.preset-card {
  padding: 14px 16px;
  border-radius: 16px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  transition: all 0.2s ease;
}

.preset-card:hover {
  transform: translateY(-2px);
  border-color: var(--color-primary-soft-strong);
  box-shadow: var(--shadow-sm);
}

.simulator-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.condition-check-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-number {
  width: 28px;
  height: 28px;
  background: var(--gradient-brand);
  color: white;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
  box-shadow: var(--shadow-sm);
}

:deep(.v-field) {
  border-radius: 12px !important;
}

section {
  position: relative;
}
</style>
