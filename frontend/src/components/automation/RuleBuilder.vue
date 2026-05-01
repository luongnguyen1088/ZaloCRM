<template>
  <v-dialog
    :model-value="modelValue"
    max-width="960"
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
import { summarizeRule } from '@/utils/automation-rule-summary';

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

const localRule = reactive<Partial<AutomationRule>>({
  name: '',
  description: '',
  trigger: 'contact_created',
  conditions: [],
  actions: [],
  enabled: true,
  priority: 0,
});

const submitError = ref('');

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

function submit() {
  if (!localRule.name?.trim()) return;
  if (!localRule.actions?.length) {
    submitError.value = 'Rule phải có ít nhất một hành động hợp lệ.';
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

.summary-panel {
  padding: 16px 18px;
  background: var(--color-surface-muted) !important;
  border-color: var(--color-border) !important;
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
