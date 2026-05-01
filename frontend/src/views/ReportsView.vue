<template>
  <v-container fluid class="pa-6 fill-height d-flex flex-column reports-page">
    <!-- Header -->
    <div class="d-flex align-center mb-6 flex-shrink-0 flex-wrap ga-4">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1 gradient-text">Báo cáo & Phân tích</h1>
        <p class="text-medium-emphasis mb-0">Theo dõi hiệu quả kinh doanh và tương tác khách hàng</p>
      </div>
      <v-spacer />
      <div class="d-flex align-center ga-2 bg-surface-variant-light pa-2 rounded-xl border">
        <v-text-field
          v-model="dateFrom"
          type="date"
          density="compact"
          variant="plain"
          hide-details
          class="date-input px-2"
        />
        <v-icon size="small" color="medium-emphasis">mdi-arrow-right</v-icon>
        <v-text-field
          v-model="dateTo"
          type="date"
          density="compact"
          variant="plain"
          hide-details
          class="date-input px-2"
        />
      </div>
      <v-btn
        color="primary"
        variant="flat"
        prepend-icon="mdi-magnify"
        rounded="xl"
        class="px-6"
        :loading="loading"
        @click="fetchReport"
      >
        Tra cứu
      </v-btn>
      <v-btn
        color="success"
        variant="tonal"
        prepend-icon="mdi-file-excel"
        rounded="xl"
        :loading="exporting"
        @click="exportExcel"
      >
        Xuất Excel
      </v-btn>
    </div>

    <!-- Main Content -->
    <div class="flex-grow-1 d-flex flex-column overflow-hidden">
      <v-tabs v-model="tab" color="primary" align-tabs="start" class="mb-6 custom-tabs">
        <v-tab value="messages" class="text-none font-weight-bold">
          <v-icon start>mdi-message-text-outline</v-icon> Tin nhắn
        </v-tab>
        <v-tab value="contacts" class="text-none font-weight-bold">
          <v-icon start>mdi-account-group-outline</v-icon> Khách hàng
        </v-tab>
        <v-tab value="appointments" class="text-none font-weight-bold">
          <v-icon start>mdi-calendar-clock-outline</v-icon> Lịch hẹn
        </v-tab>
      </v-tabs>

      <v-window v-model="tab" class="flex-grow-1 overflow-hidden">
        <v-window-item value="messages" class="h-100">
          <v-card class="glass-container h-100 d-flex flex-column overflow-hidden" border variant="flat">
            <v-data-table
              :headers="msgHeaders"
              :items="msgData"
              :loading="loading"
              class="custom-table flex-grow-1"
              hover
              fixed-header
            >
              <template v-slot:item.sent="{ item }">
                <span class="text-primary font-weight-bold">{{ formatNumber(item.sent) }}</span>
              </template>
              <template v-slot:item.received="{ item }">
                <span class="text-success font-weight-bold">{{ formatNumber(item.received) }}</span>
              </template>
            </v-data-table>
          </v-card>
        </v-window-item>

        <v-window-item value="contacts" class="h-100">
          <v-card class="glass-container h-100 d-flex flex-column overflow-hidden" border variant="flat">
            <v-data-table
              :headers="contactHeaders"
              :items="contactData"
              :loading="loading"
              class="custom-table flex-grow-1"
              hover
              fixed-header
            />
          </v-card>
        </v-window-item>

        <v-window-item value="appointments" class="h-100">
          <v-card class="glass-container h-100 d-flex flex-column overflow-hidden" border variant="flat">
            <v-data-table
              :headers="aptHeaders"
              :items="aptData"
              :loading="loading"
              class="custom-table flex-grow-1"
              hover
              fixed-header
            />
          </v-card>
        </v-window-item>
      </v-window>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { api } from '@/api';

const today = new Date();
const prior = new Date(today);
prior.setDate(prior.getDate() - 30);
const fmt = (d: Date) => d.toISOString().slice(0, 10);

const dateFrom = ref(fmt(prior));
const dateTo = ref(fmt(today));
const tab = ref('messages');
const loading = ref(false);
const exporting = ref(false);

const msgData = ref<any[]>([]);
const contactData = ref<any[]>([]);
const aptData = ref<any[]>([]);

const msgHeaders = [
  { title: 'NGÀY', key: 'date' },
  { title: 'TIN NHẮN ĐÃ GỬI', key: 'sent', align: 'end' as const },
  { title: 'TIN NHẮN ĐÃ NHẬN', key: 'received', align: 'end' as const },
];

const contactHeaders = [
  { title: 'PHÂN LOẠI / TRẠNG THÁI', key: 'label' },
  { title: 'SỐ LƯỢNG', key: 'count', align: 'end' as const },
];

const aptHeaders = [
  { title: 'TRẠNG THÁI / LOẠI LỊCH HẸN', key: 'label' },
  { title: 'SỐ LƯỢNG', key: 'count', align: 'end' as const },
];

async function fetchReport() {
  loading.value = true;
  try {
    const params = { from: dateFrom.value, to: dateTo.value };
    if (tab.value === 'messages') {
      const res = await api.get('/reports/messages', { params });
      msgData.value = res.data.data || res.data;
    } else if (tab.value === 'contacts') {
      const res = await api.get('/reports/contacts', { params });
      const raw = res.data;
      const rows: any[] = [];
      (raw.newPerDay || []).forEach((d: any) => rows.push({ label: `Khách mới ngày ${d.date}`, count: d.count }));
      (raw.treatmentProgress || []).forEach((t: any) => rows.push({ label: `Tiến triển: ${t.status}`, count: t.count }));
      (raw.medicationStatus || []).forEach((m: any) => rows.push({ label: `Thuốc: ${m.status}`, count: m.count }));
      contactData.value = rows;
    } else if (tab.value === 'appointments') {
      const res = await api.get('/reports/appointments', { params });
      const raw = res.data;
      const rows: any[] = [];
      (raw.byStatus || []).forEach((s: any) => rows.push({ label: `Trạng thái: ${s.status}`, count: s.count }));
      (raw.byType || []).forEach((t: any) => rows.push({ label: `Loại: ${t.type || 'Khác'}`, count: t.count }));
      aptData.value = rows;
    }
  } catch (err) {
    console.error('Report error:', err);
  } finally {
    loading.value = false;
  }
}

async function exportExcel() {
  exporting.value = true;
  try {
    const res = await api.get('/reports/export', {
      params: { type: tab.value, from: dateFrom.value, to: dateTo.value },
      responseType: 'blob',
    });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${tab.value}-${dateFrom.value}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Export error:', err);
  } finally {
    exporting.value = false;
  }
}

function formatNumber(n: number) {
  return new Intl.NumberFormat('vi-VN').format(n);
}

watch(tab, () => fetchReport());
onMounted(fetchReport);
</script>

<style scoped>
.reports-page {
  background: var(--color-canvas);
}

.gradient-text {
  background: var(--gradient-brand);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.glass-container {
  background: var(--color-surface);
  border: 1px solid var(--color-border) !important;
  border-radius: 24px !important;
  box-shadow: var(--shadow-sm);
}

.bg-surface-variant-light {
  background: var(--color-surface-elevated);
}

.date-input :deep(input) {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text);
  cursor: pointer;
}

.custom-tabs :deep(.v-tab) {
  border-radius: 12px 12px 0 0;
  margin-right: 4px;
}

.custom-table :deep(.v-table__wrapper) {
  background: transparent !important;
}

.custom-table :deep(th) {
  background: var(--color-surface-elevated) !important;
  font-size: 11px !important;
  font-weight: 800 !important;
  color: var(--color-text-secondary) !important;
  letter-spacing: 0.5px;
}
</style>
