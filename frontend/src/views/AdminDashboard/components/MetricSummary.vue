
<template>
  <v-row class="mb-6">
    <v-col v-for="item in items" :key="item.label" cols="12" sm="6" xl="3">
      <v-card class="summary-card pa-5 h-100">
        <div class="summary-card__top mb-4">
          <v-avatar :color="item.tint" size="46" rounded="lg">
            <v-icon :color="item.color" size="22">{{ item.icon }}</v-icon>
          </v-avatar>

          <v-chip :color="item.color" variant="tonal" size="x-small" class="font-weight-bold">
            {{ item.badge }}
          </v-chip>
        </div>

        <div class="summary-card__value mb-1">{{ item.value }}</div>
        <div class="summary-card__label mb-2">{{ item.label }}</div>
        <div class="summary-card__hint">{{ item.hint }}</div>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import type { SummaryCard } from '../types';

defineProps<{
  items: SummaryCard[];
}>();
</script>

<style scoped>
.summary-card {
  border-radius: 28px !important;
  border: 1px solid var(--color-border) !important;
  background: linear-gradient(180deg, var(--color-surface-elevated), var(--color-surface-glass)) !important;
}

.summary-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.summary-card__label {
  display: block;
  color: var(--color-text-secondary);
  font-size: 0.84rem;
  font-weight: 700;
}

.summary-card__value {
  display: block;
  margin-top: 8px;
  color: var(--color-text);
  font-size: 1.75rem;
  font-weight: 900;
  line-height: 1.1;
}

.summary-card__hint {
  display: block;
  margin-top: 8px;
  color: var(--color-text-secondary);
  font-size: 0.92rem;
  line-height: 1.5;
}
</style>
