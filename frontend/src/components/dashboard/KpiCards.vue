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
            <div class="text-h4 font-weight-black text-white mb-1">{{ item.value }}</div>
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
import type { KpiData } from '@/composables/use-dashboard';

const props = defineProps<{
  kpi: KpiData | null;
}>();

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
      color: '#00F2FF',
      bg: 'rgba(0, 242, 255, 0.1)',
      borderColor: 'rgba(0, 242, 255, 0.2)',
      trend: 12,
    },
    {
      label: 'Tin nhắn hôm nay',
      value: d.messagesToday.toLocaleString(),
      icon: 'mdi-chat-processing-outline',
      color: '#A855F7',
      bg: 'rgba(168, 85, 247, 0.1)',
      borderColor: 'rgba(168, 85, 247, 0.2)',
      trend: 24,
    },
    {
      label: 'Chưa phản hồi',
      value: d.messagesUnreplied.toLocaleString(),
      icon: 'mdi-message-alert-outline',
      color: '#f87171',
      bg: 'rgba(248, 113, 113, 0.1)',
      borderColor: 'rgba(248, 113, 113, 0.2)',
      trend: -5,
    },
    {
      label: 'Lịch hẹn hôm nay',
      value: d.appointmentsToday.toLocaleString(),
      icon: 'mdi-calendar-check-outline',
      color: '#F59E0B',
      bg: 'rgba(245, 158, 11, 0.1)',
      borderColor: 'rgba(245, 158, 11, 0.2)',
      trend: 2,
    },
  ];
});
</script>

<style scoped>
.glass-premium {
  background: rgba(15, 23, 42, 0.6) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  backdrop-filter: blur(12px);
  border-radius: 24px !important;
  overflow: hidden;
  transition: transform 0.3s ease;
}

.glass-premium:hover {
  transform: translateY(-5px);
  border-color: rgba(255, 255, 255, 0.15) !important;
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
  color: #64748b;
}

.letter-spacing-1 {
  letter-spacing: 1px;
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
  background: rgba(34, 197, 94, 0.1);
  color: #4ade80;
}

.trend-indicator.down {
  background: rgba(239, 68, 68, 0.1);
  color: #f87171;
}

.kpi-progress {
  height: 3px;
  position: absolute;
  bottom: 0;
  left: 0;
  opacity: 0.5;
}
</style>
