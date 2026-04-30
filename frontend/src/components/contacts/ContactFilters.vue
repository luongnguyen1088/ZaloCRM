<template>
  <v-card class="filters-card mb-5" elevation="0">
    <v-card-text class="pa-4 pa-md-5">
      <div class="d-flex flex-column flex-lg-row ga-4 align-lg-center justify-space-between mb-4">
        <div>
          <div class="text-overline font-weight-bold text-medium-emphasis">Bo loc thong minh</div>
          <div class="text-body-2 text-medium-emphasis">
            {{ loading ? 'Dang tai danh sach...' : `${total.toLocaleString('vi-VN')} khach hang phu hop` }}
            <span v-if="activeFilterCount > 0"> • {{ activeFilterCount }} bo loc dang bat</span>
          </div>
        </div>

        <div class="d-flex ga-2 flex-wrap">
          <v-chip
            v-for="status in statusOptions"
            :key="status.value"
            :color="filters.status === status.value ? statusColor(status.value) : undefined"
            :variant="filters.status === status.value ? 'flat' : 'outlined'"
            size="small"
            class="font-weight-medium"
            @click="toggleStatus(status.value)"
          >
            {{ status.text }}
          </v-chip>
        </div>
      </div>

      <v-row dense>
        <v-col cols="12" md="6" lg="5">
          <v-text-field
            v-model="filters.search"
            prepend-inner-icon="mdi-magnify"
            label="Tim ten, so dien thoai, email"
            variant="outlined"
            density="comfortable"
            clearable
            hide-details
            rounded="xl"
            @update:model-value="emit('search')"
          />
        </v-col>

        <v-col cols="12" sm="6" lg="3">
          <v-select
            v-model="filters.source"
            :items="sourceOptions"
            item-title="text"
            item-value="value"
            label="Nguon khach"
            variant="outlined"
            density="comfortable"
            clearable
            hide-details
            rounded="xl"
            @update:model-value="emit('search')"
          />
        </v-col>

        <v-col cols="12" sm="6" lg="2">
          <v-select
            v-model="filters.status"
            :items="statusOptions"
            item-title="text"
            item-value="value"
            label="Trang thai"
            variant="outlined"
            density="comfortable"
            clearable
            hide-details
            rounded="xl"
            @update:model-value="emit('search')"
          />
        </v-col>

        <v-col cols="12" lg="2" class="d-flex">
          <v-btn
            block
            variant="tonal"
            color="primary"
            rounded="xl"
            prepend-icon="mdi-filter-remove-outline"
            :disabled="activeFilterCount === 0"
            @click="emit('reset')"
          >
            Xoa loc
          </v-btn>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import type { ContactFilters } from '@/composables/use-contacts';
import { SOURCE_OPTIONS, STATUS_OPTIONS } from '@/composables/use-contacts';

const props = defineProps<{
  filters: ContactFilters;
  total: number;
  loading: boolean;
  activeFilterCount: number;
}>();

const emit = defineEmits<{
  search: [];
  reset: [];
}>();

const sourceOptions = SOURCE_OPTIONS;
const statusOptions = STATUS_OPTIONS;

function toggleStatus(value: string) {
  props.filters.status = props.filters.status === value ? '' : value;
  emit('search');
}

function statusColor(status: string) {
  const map: Record<string, string> = {
    new: 'grey',
    contacted: 'blue',
    interested: 'orange',
    converted: 'success',
    lost: 'error',
  };
  return map[status] ?? 'grey';
}
</script>

<style scoped>
.filters-card {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.96));
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 24px !important;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.06);
}
</style>
