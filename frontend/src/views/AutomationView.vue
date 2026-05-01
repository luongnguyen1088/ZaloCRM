<template>
  <div class="automation-page pb-10">
    <!-- Header Section -->
    <div class="header-section d-flex align-center mb-8 flex-wrap ga-4">
      <div class="header-icon-box mr-2">
        <v-icon size="32" color="primary">mdi-robot-industrial</v-icon>
      </div>
      <div>
        <h1 class="text-h4 font-weight-bold mb-1 outfit-font text-gradient">Tự động hóa</h1>
        <p class="text-body-2 text-medium-emphasis mb-0">Thiết lập quy trình làm việc thông minh 24/7</p>
      </div>
      <v-spacer />
      <v-btn
        v-if="canManage"
        color="primary"
        size="large"
        prepend-icon="mdi-plus"
        rounded="lg"
        elevation="4"
        @click="openCreateRule"
        class="custom-add-btn"
      >
        Tạo Rule mới
      </v-btn>
    </div>

    <!-- Main Content -->
    <v-card class="main-glass-card" elevation="0">
      <div class="pa-4 pb-0">
        <v-alert
          variant="tonal"
          color="info"
          density="comfortable"
          text="AI auto-reply hien duoc cau hinh tai AI Studio. Automation chi dung cho trigger, phan luong, trang thai, lich hen va mau tin nhan."
        />
      </div>

      <v-tabs v-model="tab" color="primary" class="custom-tabs px-4">
        <v-tab value="rules" class="text-none">
          <v-icon start>mdi-auto-fix</v-icon>
          Quy tắc (Rules)
        </v-tab>
        <v-tab value="templates" class="text-none">
          <v-icon start>mdi-message-text-outline</v-icon>
          Mẫu tin nhắn
        </v-tab>
      </v-tabs>

      <v-divider class="opacity-10" />

      <v-window v-model="tab" class="pa-4 pa-md-6">
        <v-window-item value="rules">
          <v-data-table
            :headers="ruleHeaders"
            :items="rules"
            :loading="rulesLoading"
            class="premium-table"
            hover
            no-data-text="Hệ thống chưa có quy tắc tự động nào"
          >
            <!-- Name Slot -->
            <template #item.name="{ item }">
              <div class="d-flex flex-column py-2">
                <span class="font-weight-bold text-subtitle-2">{{ item.name }}</span>
                <span v-if="item.description" class="text-caption text-medium-emphasis text-truncate" style="max-width: 250px">
                  {{ item.description }}
                </span>
              </div>
            </template>

            <!-- Trigger Slot -->
            <template #item.trigger="{ item }">
              <v-chip
                size="small"
                :color="getTriggerColor(item.trigger)"
                variant="tonal"
                class="font-weight-bold"
                label
              >
                {{ triggerLabel(item.trigger) }}
              </v-chip>
            </template>

            <!-- Priority Slot -->
            <template #item.priority="{ item }">
              <div class="d-flex align-center">
                <v-icon size="14" class="mr-1" color="amber">mdi-star</v-icon>
                <span>{{ item.priority }}</span>
              </div>
            </template>

            <!-- Run Count Slot -->
            <template #item.runCount="{ item }">
              <v-badge
                :content="item.runCount || '0'"
                color="info"
                inline
                class="run-badge"
              ></v-badge>
            </template>

            <!-- Last Run Slot -->
            <template #item.lastRunAt="{ item }">
              <div class="text-caption">
                {{ item.lastRunAt ? formatDateTime(item.lastRunAt) : '—' }}
              </div>
            </template>

            <!-- Toggle Slot -->
            <template #item.enabled="{ item }">
              <v-switch
                :model-value="item.enabled"
                color="success"
                hide-details
                inset
                density="compact"
                :disabled="!canManage"
                @update:model-value="toggleRule(item, $event)"
              />
            </template>

            <!-- Actions Slot -->
            <template #item.actions="{ item }">
              <div v-if="canManage" class="d-flex ga-1 justify-end">
                <v-btn
                  icon
                  variant="text"
                  size="small"
                  color="primary"
                  title="Chỉnh sửa"
                  @click="openEditRule(item)"
                >
                  <v-icon>mdi-pencil-outline</v-icon>
                </v-btn>
                <v-btn
                  icon
                  variant="text"
                  size="small"
                  color="error"
                  title="Xóa"
                  @click="deleteRule(item.id)"
                >
                  <v-icon>mdi-delete-outline</v-icon>
                </v-btn>
              </div>
            </template>
          </v-data-table>
        </v-window-item>

        <v-window-item value="templates">
          <TemplateManager
            :templates="templates"
            :loading="templatesLoading"
            :saving="templateSaving"
            :can-manage="canManage"
            @create="createTemplate"
            @update="updateTemplate"
            @delete="deleteTemplate"
          />
        </v-window-item>
      </v-window>
    </v-card>

    <RuleBuilder
      v-model="showRuleDialog"
      :rule="selectedRule"
      :templates="templates"
      :zalo-accounts="accounts"
      :saving="ruleSaving"
      @save="saveRule"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import RuleBuilder from '@/components/automation/RuleBuilder.vue';
import TemplateManager from '@/components/automation/TemplateManager.vue';
import { useAutomationRules, type AutomationRule } from '@/composables/use-automation-rules';
import { useMessageTemplates } from '@/composables/use-message-templates';
import { useZaloAccounts } from '@/composables/use-zalo-accounts';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const canManage = computed(() => authStore.isAdmin);
const tab = ref('rules');
const showRuleDialog = ref(false);
const selectedRule = ref<AutomationRule | null>(null);

const {
  rules,
  loading: rulesLoading,
  saving: ruleSaving,
  fetchRules,
  createRule,
  updateRule,
  deleteRule: removeRule,
} = useAutomationRules();

const {
  templates,
  loading: templatesLoading,
  saving: templateSaving,
  fetchTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} = useMessageTemplates();

const { accounts, fetchAccounts } = useZaloAccounts();

const ruleHeaders = [
  { title: 'Tên rule', key: 'name', align: 'start' as const },
  { title: 'Trigger', key: 'trigger', width: '150px' },
  { title: 'Ưu tiên', key: 'priority', width: '100px' },
  { title: 'Đã chạy', key: 'runCount', width: '100px' },
  { title: 'Gần nhất', key: 'lastRunAt', width: '180px' },
  { title: 'Hoạt động', key: 'enabled', sortable: false, width: '100px' },
  { title: '', key: 'actions', sortable: false, align: 'end' as const, width: '100px' },
];

function triggerLabel(trigger: string) {
  const labels: Record<string, string> = {
    message_received: 'Tin nhắn đến',
    contact_created: 'Contact mới',
    status_changed: 'Đổi trạng thái',
  };
  return labels[trigger] ?? trigger;
}

function getTriggerColor(trigger: string) {
  if (trigger === 'message_received') return 'primary';
  if (trigger === 'contact_created') return 'success';
  return 'warning';
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function openCreateRule() {
  selectedRule.value = null;
  showRuleDialog.value = true;
}

function openEditRule(rule: AutomationRule) {
  selectedRule.value = rule;
  showRuleDialog.value = true;
}

async function saveRule(payload: Partial<AutomationRule>) {
  if (payload.id) {
    await updateRule(payload.id, payload);
  } else {
    await createRule(payload);
  }
  showRuleDialog.value = false;
}

async function toggleRule(rule: AutomationRule, enabled: boolean | null) {
  await updateRule(rule.id, { enabled: !!enabled });
}

async function deleteRule(id: string) {
  if (confirm('Bạn có chắc muốn xóa quy tắc này?')) {
    await removeRule(id);
  }
}

onMounted(async () => {
  await Promise.all([fetchRules(), fetchTemplates(), fetchAccounts()]);
});
</script>

<style scoped>
.automation-page {
  max-width: 1300px;
  margin: 0 auto;
}

.header-icon-box {
  background: var(--color-primary-soft);
  padding: 12px;
  border-radius: 16px;
  border: 1px solid var(--color-primary-soft-strong);
}

.text-gradient {
  background: var(--gradient-brand);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.main-glass-card {
  background: var(--color-surface-elevated) !important;
  backdrop-filter: blur(12px);
  border: 1px solid var(--color-border) !important;
  border-radius: 20px !important;
  overflow: hidden;
}

.custom-tabs {
  background: transparent !important;
}

:deep(.v-tab) {
  padding-top: 20px;
  padding-bottom: 20px;
  font-weight: 600;
  transition: all 0.2s ease;
}

:deep(.v-tab--selected) {
  color: var(--color-primary) !important;
}

.premium-table {
  background: transparent !important;
}

:deep(.v-data-table-header) {
  background: var(--color-surface-muted);
}

:deep(.v-data-table-header th) {
  color: var(--color-text-secondary) !important;
  font-weight: 700 !important;
  text-transform: uppercase;
  font-size: 0.75rem !important;
  letter-spacing: 0.5px;
}

:deep(.v-data-table__tr:hover) {
  background: var(--color-primary-soft) !important;
}

.run-badge :deep(.v-badge__badge) {
  font-family: monospace;
  font-weight: bold;
}

.custom-add-btn {
  text-transform: none;
  font-weight: 700;
  letter-spacing: 0;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.custom-add-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--glow-brand);
}

@media (max-width: 600px) {
  .header-icon-box {
    display: none;
  }
}
</style>
