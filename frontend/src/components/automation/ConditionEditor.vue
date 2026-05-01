<template>
  <div class="condition-editor ga-4 d-flex flex-column">
    <div
      v-for="(condition, index) in modelValue"
      :key="index"
      class="condition-row pa-4 rounded-xl border d-flex ga-3 align-center flex-wrap"
    >
      <div class="field-icon-box">
        <v-icon size="18" color="primary">mdi-filter-variant</v-icon>
      </div>

      <v-select
        :model-value="condition.field"
        :items="fieldOptions"
        item-title="title"
        item-value="value"
        label="Trường dữ liệu"
        variant="outlined"
        density="comfortable"
        hide-details
        class="flex-grow-1 min-w-200"
        @update:model-value="updateCondition(index, 'field', $event)"
      />

      <v-select
        :model-value="condition.op"
        :items="operatorOptions"
        item-title="title"
        item-value="value"
        label="Toán tử"
        variant="outlined"
        density="comfortable"
        hide-details
        class="flex-grow-0 min-w-150"
        @update:model-value="updateOperator(index, $event)"
      />

      <v-select
        v-if="condition.field === 'conversation.zaloAccountId' && expectsValue(condition.op)"
        :model-value="condition.value"
        :items="zaloAccountItems"
        item-title="title"
        item-value="value"
        label="Chọn tài khoản"
        variant="outlined"
        density="comfortable"
        hide-details
        class="flex-grow-1 min-w-200"
        @update:model-value="updateCondition(index, 'value', $event)"
      />

      <v-text-field
        v-else-if="expectsValue(condition.op)"
        :model-value="displayValue(condition)"
        :label="condition.op === 'in' ? 'Danh sách giá trị' : 'Giá trị so sánh'"
        :hint="condition.op === 'in' ? 'Nhập nhiều giá trị, ngăn cách bằng dấu phẩy' : undefined"
        persistent-hint
        variant="outlined"
        density="comfortable"
        hide-details
        class="flex-grow-1 min-w-200"
        @update:model-value="updateValue(index, $event)"
      />

      <div v-else class="condition-empty-note text-caption text-medium-emphasis flex-grow-1 min-w-200">
        Điều kiện này không cần nhập thêm giá trị.
      </div>

      <v-btn
        icon="mdi-delete-outline"
        variant="text"
        color="error"
        size="small"
        class="remove-condition-btn"
        @click="removeCondition(index)"
      />
    </div>

    <div>
      <v-btn
        variant="text"
        color="primary"
        prepend-icon="mdi-plus"
        class="font-weight-bold"
        @click="addCondition"
      >
        Thêm điều kiện lọc
      </v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { AutomationCondition } from '@/composables/use-automation-rules';
import type { ZaloAccount } from '@/composables/use-zalo-accounts';

const props = defineProps<{
  modelValue: AutomationCondition[];
  zaloAccounts: ZaloAccount[];
}>();

const emit = defineEmits<{
  'update:modelValue': [value: AutomationCondition[]];
}>();

const fieldOptions = [
  { title: 'Nguồn contact', value: 'contact.source' },
  { title: 'Trạng thái contact', value: 'contact.status' },
  { title: 'Thẻ khách hàng (tags)', value: 'contact.tags' },
  { title: 'Ghi chú contact', value: 'contact.notes' },
  { title: 'Người phụ trách', value: 'contact.assignedUserId' },
  { title: 'Nội dung tin nhắn', value: 'message.content' },
  { title: 'Loại tin nhắn', value: 'message.contentType' },
  { title: 'Số tin chưa đọc', value: 'conversation.unreadCount' },
  { title: 'Tài khoản Zalo', value: 'conversation.zaloAccountId' },
];

const operatorOptions = [
  { title: 'Bằng', value: 'eq' },
  { title: 'Khác', value: 'neq' },
  { title: 'Chứa', value: 'contains' },
  { title: 'Nằm trong', value: 'in' },
  { title: 'Lớn hơn', value: 'gt' },
  { title: 'Nhỏ hơn', value: 'lt' },
  { title: 'Để trống', value: 'is_empty' },
  { title: 'Không trống', value: 'is_not_empty' },
];

const zaloAccountItems = computed(() =>
  props.zaloAccounts.map((account) => ({
    title: account.displayName || account.id,
    value: account.id,
  }))
);

function expectsValue(op: AutomationCondition['op']) {
  return op !== 'is_empty' && op !== 'is_not_empty';
}

function addCondition() {
  emit('update:modelValue', [...props.modelValue, { field: 'contact.status', op: 'eq', value: '' }]);
}

function updateCondition(index: number, key: keyof AutomationCondition, value: unknown) {
  const next = props.modelValue.map((condition, currentIndex) => (
    currentIndex === index ? { ...condition, [key]: value } : condition
  ));
  emit('update:modelValue', next);
}

function updateOperator(index: number, value: unknown) {
  const op = String(value || 'eq') as AutomationCondition['op'];
  const next = props.modelValue.map<AutomationCondition>((condition, currentIndex) => {
    if (currentIndex !== index) return condition;
    return {
      ...condition,
      op,
      value: expectsValue(op) ? normalizeValueByOperator(op, condition.value) : undefined,
    };
  });
  emit('update:modelValue', next);
}

function updateValue(index: number, value: unknown) {
  const next = props.modelValue.map<AutomationCondition>((condition, currentIndex) => {
    if (currentIndex !== index) return condition;
    return {
      ...condition,
      value: normalizeValueByOperator(condition.op, value),
    };
  });
  emit('update:modelValue', next);
}

function normalizeValueByOperator(
  op: AutomationCondition['op'],
  value: unknown
): AutomationCondition['value'] {
  if (!expectsValue(op)) return undefined;
  if (op === 'in') {
    if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
    return String(value ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (typeof value === 'number') return value;
  if (value === null) return null;
  return String(value ?? '');
}

function removeCondition(index: number) {
  emit('update:modelValue', props.modelValue.filter((_, currentIndex) => currentIndex !== index));
}

function displayValue(condition: AutomationCondition) {
  return Array.isArray(condition.value) ? condition.value.join(', ') : String(condition.value ?? '');
}
</script>

<style scoped>
.condition-row {
  background: var(--color-surface-muted);
  border: 1px solid var(--color-border) !important;
  transition: all 0.2s;
}

.condition-row:hover {
  background: var(--color-surface);
  border-color: var(--color-primary-soft-strong) !important;
}

.field-icon-box {
  width: 32px;
  height: 32px;
  background: var(--color-primary-soft);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.condition-empty-note {
  display: flex;
  align-items: center;
  min-height: 40px;
  padding: 0 8px;
}

.min-w-200 { min-width: 200px; }
.min-w-150 { min-width: 150px; }

.remove-condition-btn {
  opacity: 0.5;
}

.condition-row:hover .remove-condition-btn {
  opacity: 1;
}

@media (max-width: 600px) {
  .condition-row {
    flex-direction: column;
    align-items: stretch;
  }

  .field-icon-box {
    display: none;
  }
}
</style>
