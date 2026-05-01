<template>
  <div class="action-editor ga-4 d-flex flex-column">
    <div v-for="(action, index) in modelValue" :key="index" class="action-card pa-4 rounded-xl border position-relative">
      <div class="d-flex ga-3 align-center mb-4">
        <div class="action-icon-circle" :class="getActionColor(action.type)">
          <v-icon size="20">{{ getActionIcon(action.type) }}</v-icon>
        </div>
        <v-select
          :model-value="action.type"
          :items="actionOptions"
          item-title="title"
          item-value="value"
          label="Hanh dong"
          variant="filled"
          density="comfortable"
          hide-details
          class="flex-grow-1 custom-select"
          @update:model-value="updateAction(index, 'type', $event)"
        />
        <v-btn
          icon="mdi-close"
          variant="text"
          size="small"
          color="medium-emphasis"
          class="remove-btn"
          @click="removeAction(index)"
        />
      </div>

      <v-divider class="mb-4 opacity-10" />

      <div class="action-settings-grid">
        <v-text-field
          v-if="action.type === 'assign_user'"
          :model-value="action.userId || ''"
          label="User ID nhan vien"
          variant="outlined"
          density="comfortable"
          prepend-inner-icon="mdi-account-arrow-right"
          @update:model-value="updateAction(index, 'userId', $event)"
        />

        <v-select
          v-if="action.type === 'send_template'"
          :model-value="action.templateId || ''"
          :items="templateItems"
          item-title="title"
          item-value="value"
          label="Chon mau tin nhan"
          variant="outlined"
          density="comfortable"
          prepend-inner-icon="mdi-email-outline"
          @update:model-value="updateAction(index, 'templateId', $event)"
        />

        <v-select
          v-if="action.type === 'update_status'"
          :model-value="action.status || ''"
          :items="statusItems"
          item-title="title"
          item-value="value"
          label="Trang thai hoi thoai moi"
          variant="outlined"
          density="comfortable"
          prepend-inner-icon="mdi-tag-outline"
          @update:model-value="updateAction(index, 'status', $event)"
        />

        <template v-if="action.type === 'create_appointment'">
          <div class="d-flex ga-3 flex-wrap">
            <v-text-field
              :model-value="String(action.offsetHours ?? 24)"
              label="So gio sau khi kich hoat"
              variant="outlined"
              density="comfortable"
              type="number"
              class="flex-1-1"
              style="min-width: 150px"
              prepend-inner-icon="mdi-clock-outline"
              @update:model-value="updateNumericAction(index, 'offsetHours', $event)"
            />
            <v-text-field
              :model-value="action.typeLabel || ''"
              label="Loai lich hen"
              variant="outlined"
              density="comfortable"
              class="flex-1-1"
              style="min-width: 150px"
              prepend-inner-icon="mdi-calendar-check"
              @update:model-value="updateAction(index, 'typeLabel', $event)"
            />
          </div>
        </template>
      </div>
    </div>

    <div>
      <v-btn
        variant="tonal"
        block
        prepend-icon="mdi-plus-circle-outline"
        size="large"
        rounded="xl"
        class="add-action-btn"
        @click="addAction"
      >
        Them hanh dong tiep theo
      </v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { AutomationAction } from '@/composables/use-automation-rules';
import type { MessageTemplate } from '@/composables/use-message-templates';

const props = defineProps<{
  modelValue: AutomationAction[];
  templates: MessageTemplate[];
}>();

const emit = defineEmits<{
  'update:modelValue': [value: AutomationAction[]];
}>();

const actionOptions = [
  { title: 'Chuyen cho nhan vien', value: 'assign_user' },
  { title: 'Gui mau tin nhan', value: 'send_template' },
  { title: 'Cap nhat trang thai', value: 'update_status' },
  { title: 'Tao lich hen', value: 'create_appointment' },
];

const statusItems = [
  { title: 'Moi', value: 'new' },
  { title: 'Da lien he', value: 'contacted' },
  { title: 'Quan tam', value: 'interested' },
  { title: 'Chuyen doi', value: 'converted' },
  { title: 'Mat', value: 'lost' },
];

const templateItems = computed(() => props.templates.map((template) => ({ title: template.name, value: template.id })));

function getActionIcon(type: string) {
  const icons: Record<string, string> = {
    assign_user: 'mdi-account-arrow-right',
    send_template: 'mdi-email-send-outline',
    update_status: 'mdi-tag-sync-outline',
    create_appointment: 'mdi-calendar-plus',
  };
  return icons[type] ?? 'mdi-flash';
}

function getActionColor(type: string) {
  const colors: Record<string, string> = {
    assign_user: 'info',
    send_template: 'success',
    update_status: 'warning',
    create_appointment: 'orange',
  };
  return colors[type] || 'grey';
}

function addAction() {
  emit('update:modelValue', [...props.modelValue, { type: 'update_status', status: 'contacted' }]);
}

function updateAction(index: number, key: keyof AutomationAction, value: unknown) {
  const next = props.modelValue.map((action, currentIndex) => (
    currentIndex === index ? { ...action, [key]: value } : action
  ));
  emit('update:modelValue', next);
}

function updateNumericAction(index: number, key: keyof AutomationAction, value: unknown) {
  updateAction(index, key, Number(value ?? 0));
}

function removeAction(index: number) {
  emit('update:modelValue', props.modelValue.filter((_, currentIndex) => currentIndex !== index));
}
</script>

<style scoped>
.action-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border) !important;
  transition: all 0.2s ease;
}

.action-card:hover {
  border-color: var(--color-primary-soft-strong) !important;
  box-shadow: var(--shadow-sm);
}

.action-icon-circle {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-icon-circle.info { background: var(--color-info-soft); color: var(--color-info); }
.action-icon-circle.success { background: var(--color-success-soft); color: var(--color-success); }
.action-icon-circle.warning { background: var(--color-warning-soft); color: var(--color-warning); }
.action-icon-circle.orange { background: #fff3e0; color: #fb8c00; }

.add-action-btn {
  text-transform: none;
  font-weight: 700;
  border: 1px dashed var(--color-border-strong);
}

.custom-select :deep(.v-field) {
  border-radius: 12px !important;
}

.remove-btn {
  opacity: 0.5;
  transition: opacity 0.2s;
}

.action-card:hover .remove-btn {
  opacity: 1;
}
</style>
