<template>
  <v-row>
    <v-col v-for="item in stats" :key="item.label" cols="12" sm="6" md="3">
      <v-card class="kpi-card glass-premium" elevation="0">
        <div class="pa-6">
          <div class="d-flex align-center justify-space-between mb-4">
            <div class="kpi-icon-box" :style="{ background: item.bg, border: `1px solid ${item.borderColor}` }">
              <v-icon :color="item.color">{{ item.icon }}</v-icon>
            </div>
            <div v-if="item.trend !== undefined" class="trend-indicator" :class="item.trend > 0 ? 'up' : 'down'">
              <v-icon size="14">{{ item.trend > 0 ? 'mdi-trending-up' : 'mdi-trending-down' }}</v-icon>
              <span class="ml-1">{{ Math.abs(item.trend) }}%</span>
            </div>
          </div>
          <div class="kpi-content">
            <div class="text-h4 font-weight-black kpi-value mb-1">{{ item.value }}</div>
            <div class="text-caption text-placeholder font-weight-bold uppercase letter-spacing-1">{{ item.label }}</div>
          </div>
        </div>
        <div class="kpi-progress" :style="{ background: item.color, width: '40%' }"></div>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useTheme } from 'vuetify';
import type { KpiData } from '@/composables/use-dashboard';
import { chartTokens, hexToRgba } from '@/theme/ui-tokens';

const props = defineProps<{
  kpi: KpiData | null;
}>();

const theme = useTheme();
const palette = computed(() => chartTokens[theme.global.current.value.dark ? 'dark' : 'light']);

const stats = computed(() => {
  const d = props.kpi || {
    totalContacts: 0,
    messagesToday: 0,
    messagesUnreplied: 0,
    appointmentsToday: 0,
  };

  return [
    {
      label: 'Tổng khách hàng',
      value: d.totalContacts.toLocaleString(),
      icon: 'mdi-account-group-outline',
      color: palette.value.sent,
      bg: hexToRgba(palette.value.sent, 0.12),
      borderColor: hexToRgba(palette.value.sent, 0.24),
      trend: 12,
    },
    {
      label: 'Tin nhắn hôm nay',
      value: d.messagesToday.toLocaleString(),
      icon: 'mdi-chat-processing-outline',
      color: palette.value.received,
      bg: hexToRgba(palette.value.received, 0.12),
      borderColor: hexToRgba(palette.value.received, 0.24),
      trend: 24,
    },
    {
      label: 'Chưa phản hồi',
      value: d.messagesUnreplied.toLocaleString(),
      icon: 'mdi-message-alert-outline',
      color: palette.value.danger,
      bg: hexToRgba(palette.value.danger, 0.12),
      borderColor: hexToRgba(palette.value.danger, 0.24),
      trend: -5,
    },
    {
      label: 'Lịch hẹn hôm nay',
      value: d.appointmentsToday.toLocaleString(),
      icon: 'mdi-calendar-check-outline',
      color: palette.value.warning,
      bg: hexToRgba(palette.value.warning, 0.12),
      borderColor: hexToRgba(palette.value.warning, 0.24),
      trend: 2,
    },
  ];
});
</script>

<style scoped>
.glass-premium {
  background: var(--color-surface-elevated) !important;
  border: 1px solid var(--color-border) !important;
  backdrop-filter: blur(12px);
  border-radius: 24px !important;
  overflow: hidden;
  transition: transform 0.3s ease, border-color 0.3s ease;
  box-shadow: var(--shadow-sm);
}

.glass-premium:hover {
  transform: translateY(-5px);
  border-color: var(--color-border-strong) !important;
}

.kpi-icon-box {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.text-placeholder {
  color: var(--color-text-secondary);
}

.letter-spacing-1 {
  letter-spacing: 1px;
}

.kpi-value {
  color: var(--color-text);
}

.trend-indicator {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 700;
}

.trend-indicator.up {
  background: var(--color-success-soft);
  color: var(--color-success);
}

.trend-indicator.down {
  background: var(--color-danger-soft);
  color: var(--color-danger);
}

.kpi-progress {
  height: 3px;
  position: absolute;
  bottom: 0;
  left: 0;
  opacity: 0.5;
}
</style>
