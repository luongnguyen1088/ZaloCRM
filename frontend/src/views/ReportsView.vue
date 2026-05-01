<template>
  <v-container fluid class="pa-6 fill-height d-flex flex-column reports-page">
    <!-- Header & Filters -->
    <div class="d-flex align-center mb-6 flex-shrink-0 flex-wrap ga-4">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1 gradient-text text-uppercase" style="letter-spacing: -1px;">Báo cáo & Phân tích</h1>
        <p class="text-medium-emphasis mb-0">Biến dữ liệu hội thoại thành tri thức kinh doanh</p>
      </div>
      <v-spacer />
      
      <!-- Premium Date Range Picker -->
      <div class="filter-shell d-flex align-center ga-2 pa-2 rounded-xl border">
        <v-icon size="small" color="primary" class="ml-2">mdi-calendar-range</v-icon>
        <v-text-field
          v-model="dateFrom"
          type="date"
          density="compact"
          variant="plain"
          hide-details
          class="date-input px-2"
        />
        <v-icon size="x-small" color="medium-emphasis">mdi-minus</v-icon>
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
        prepend-icon="mdi-refresh"
        rounded="xl"
        class="px-6 font-weight-bold"
        :loading="loading"
        @click="fetchReport"
      >
        Cập nhật
      </v-btn>
      <v-btn
        color="success"
        variant="tonal"
        prepend-icon="mdi-microsoft-excel"
        rounded="xl"
        class="font-weight-bold"
        :loading="exporting"
        @click="exportExcel"
      >
        Xuất file
      </v-btn>
    </div>

    <!-- Summary KPIs Row -->
    <v-row class="mb-6 flex-shrink-0">
      <v-col cols="12" md="4">
        <v-card class="glass-card pa-5 d-flex align-center ga-4" border variant="flat">
          <v-avatar color="primary-lighten-5" size="54" rounded="xl">
            <v-icon color="primary" size="28">mdi-message-text-fast-outline</v-icon>
          </v-avatar>
          <div>
            <div class="text-caption font-weight-bold text-uppercase opacity-60">Tổng tin nhắn</div>
            <div class="text-h4 font-weight-black">{{ formatNumber(summary.totalMessages) }}</div>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card class="glass-card pa-5 d-flex align-center ga-4" border variant="flat">
          <v-avatar color="success-lighten-5" size="54" rounded="xl">
            <v-icon color="success" size="28">mdi-account-plus-outline</v-icon>
          </v-avatar>
          <div>
            <div class="text-caption font-weight-bold text-uppercase opacity-60">Khách hàng mới</div>
            <div class="text-h4 font-weight-black">{{ formatNumber(summary.totalNewContacts) }}</div>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card class="glass-card pa-5 d-flex align-center ga-4" border variant="flat">
          <v-avatar color="warning-lighten-5" size="54" rounded="xl">
            <v-icon color="warning" size="28">mdi-calendar-check-outline</v-icon>
          </v-avatar>
          <div>
            <div class="text-caption font-weight-bold text-uppercase opacity-60">Lịch hẹn thành công</div>
            <div class="text-h4 font-weight-black">{{ formatNumber(summary.totalAppointments) }}</div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Main Analytics Section -->
    <div class="flex-grow-1 d-flex flex-column overflow-hidden">
      <v-tabs v-model="tab" color="primary" align-tabs="start" class="mb-6 custom-tabs">
        <v-tab value="messages" class="text-none font-weight-bold px-6">
          Xu hướng tin nhắn
        </v-tab>
        <v-tab value="contacts" class="text-none font-weight-bold px-6">
          Phân tích tệp khách
        </v-tab>
        <v-tab value="appointments" class="text-none font-weight-bold px-6">
          Hiệu suất đặt lịch
        </v-tab>
      </v-tabs>

      <v-window v-model="tab" class="flex-grow-1 overflow-hidden">
        <!-- Messages Tab -->
        <v-window-item value="messages" class="h-100">
          <v-row class="h-100 ma-0">
            <v-col cols="12" md="8" class="pa-0 pr-md-3">
              <v-card class="glass-container h-100 pa-6 d-flex flex-column" border variant="flat">
                <div class="text-subtitle-1 font-weight-bold mb-4">Biểu đồ tăng trưởng tin nhắn</div>
                <div class="flex-grow-1 chart-wrapper">
                  <Line v-if="msgChartData" :data="msgChartData" :options="chartOptions" />
                </div>
              </v-card>
            </v-col>
            <v-col cols="12" md="4" class="pa-0 mt-4 mt-md-0">
              <v-card class="glass-container h-100 d-flex flex-column overflow-hidden" border variant="flat">
                <v-data-table
                  :headers="msgHeaders"
                  :items="msgData"
                  :loading="loading"
                  class="custom-table flex-grow-1"
                  hover
                  fixed-header
                  density="compact"
                >
                  <template v-slot:item.sent="{ item }">
                    <span class="text-primary font-weight-bold">{{ formatNumber(item.sent) }}</span>
                  </template>
                  <template v-slot:item.received="{ item }">
                    <span class="text-success font-weight-bold">{{ formatNumber(item.received) }}</span>
                  </template>
                </v-data-table>
              </v-card>
            </v-col>
          </v-row>
        </v-window-item>

        <!-- Contacts Tab -->
        <v-window-item value="contacts" class="h-100">
          <v-row class="h-100 ma-0">
            <v-col cols="12" md="6" class="pa-0 pr-md-3">
              <v-card class="glass-container h-100 pa-6 d-flex flex-column" border variant="flat">
                <div class="text-subtitle-1 font-weight-bold mb-4">Cơ cấu trạng thái khách hàng</div>
                <div class="flex-grow-1 d-flex align-center justify-center">
                  <div style="width: 300px; height: 300px;">
                    <Doughnut v-if="contactChartData" :data="contactChartData" :options="donutOptions" />
                  </div>
                </div>
              </v-card>
            </v-col>
            <v-col cols="12" md="6" class="pa-0 mt-4 mt-md-0">
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
            </v-col>
          </v-row>
        </v-window-item>

        <!-- Appointments Tab -->
        <v-window-item value="appointments" class="h-100">
          <v-row class="h-100 ma-0">
            <v-col cols="12" md="6" class="pa-0 pr-md-3">
              <v-card class="glass-container h-100 pa-6 d-flex flex-column" border variant="flat">
                <div class="text-subtitle-1 font-weight-bold mb-4">Tỷ lệ trạng thái lịch hẹn</div>
                <div class="flex-grow-1 d-flex align-center justify-center">
                  <div style="width: 300px; height: 300px;">
                    <Pie v-if="aptChartData" :data="aptChartData" :options="donutOptions" />
                  </div>
                </div>
              </v-card>
            </v-col>
            <v-col cols="12" md="6" class="pa-0 mt-4 mt-md-0">
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
            </v-col>
          </v-row>
        </v-window-item>
      </v-window>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue';
import { api } from '@/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement,
  BarElement
} from 'chart.js';
import { Line, Doughnut, Pie } from 'vue-chartjs';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement,
  BarElement
);

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

const summary = ref({
  totalMessages: 0,
  totalNewContacts: 0,
  totalAppointments: 0
});

const msgHeaders = [
  { title: 'NGÀY', key: 'date' },
  { title: 'GỬI', key: 'sent', align: 'end' as const },
  { title: 'NHẬN', key: 'received', align: 'end' as const },
];

const contactHeaders = [
  { title: 'PHÂN LOẠI / TRẠNG THÁI', key: 'label' },
  { title: 'SỐ LƯỢNG', key: 'count', align: 'end' as const },
];

const aptHeaders = [
  { title: 'TRẠNG THÁI / LOẠI', key: 'label' },
  { title: 'SỐ LƯỢNG', key: 'count', align: 'end' as const },
];

async function fetchReport() {
  loading.value = true;
  try {
    const params = { from: dateFrom.value, to: dateTo.value };
    
    // Fetch all needed reports
    const [msgRes, contactRes, aptRes] = await Promise.all([
      api.get('/reports/messages', { params }),
      api.get('/reports/contacts', { params }),
      api.get('/reports/appointments', { params })
    ]);

    // Process Message Data
    msgData.value = msgRes.data.data || msgRes.data;
    summary.value.totalMessages = msgData.value.reduce((acc, curr) => acc + curr.sent + curr.received, 0);

    // Process Contact Data
    const rawContacts = contactRes.data;
    const cRows: any[] = [];
    (rawContacts.newPerDay || []).forEach((d: any) => cRows.push({ label: `Khách mới ${d.date}`, count: d.count }));
    (rawContacts.treatmentProgress || []).forEach((t: any) => cRows.push({ label: `Tiến triển: ${t.status}`, count: t.count }));
    (rawContacts.medicationStatus || []).forEach((m: any) => cRows.push({ label: `Thuốc: ${m.status}`, count: m.count }));
    contactData.value = cRows;
    summary.value.totalNewContacts = (rawContacts.newPerDay || []).reduce((acc: number, curr: any) => acc + curr.count, 0);

    // Process Appointment Data
    const rawApts = aptRes.data;
    const aRows: any[] = [];
    (rawApts.byStatus || []).forEach((s: any) => aRows.push({ label: `Trạng thái: ${s.status}`, count: s.count }));
    (rawApts.byType || []).forEach((t: any) => aRows.push({ label: `Loại: ${t.type || 'Khác'}`, count: t.count }));
    aptData.value = aRows;
    summary.value.totalAppointments = (rawApts.byStatus || []).filter((s: any) => s.status === 'Completed' || s.status === 'Confirmed').reduce((acc: number, curr: any) => acc + curr.count, 0);

  } catch (err) {
    console.error('Report error:', err);
  } finally {
    loading.value = false;
  }
}

// Chart Data Computations
const msgChartData = computed(() => {
  if (!msgData.value.length) return null;
  const labels = msgData.value.map(d => d.date.split('-').slice(1).join('/'));
  return {
    labels,
    datasets: [
      {
        label: 'Tin nhắn gửi',
        data: msgData.value.map(d => d.sent),
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Tin nhắn nhận',
        data: msgData.value.map(d => d.received),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };
});

const contactChartData = computed(() => {
  const distribution = contactData.value.filter(r => r.label.includes('Tiến triển'));
  if (!distribution.length) return null;
  return {
    labels: distribution.map(r => r.label.replace('Tiến triển: ', '')),
    datasets: [{
      data: distribution.map(r => r.count),
      backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
    }]
  };
});

const aptChartData = computed(() => {
  const distribution = aptData.value.filter(r => r.label.includes('Trạng thái'));
  if (!distribution.length) return null;
  return {
    labels: distribution.map(r => r.label.replace('Trạng thái: ', '')),
    datasets: [{
      data: distribution.map(r => r.count),
      backgroundColor: ['#10b981', '#6366f1', '#f59e0b', '#ef4444']
    }]
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'top' as const, labels: { boxWidth: 10, usePointStyle: true } } },
  scales: {
    y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.03)' } },
    x: { grid: { display: false } }
  }
};

const donutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'bottom' as const, labels: { boxWidth: 10, usePointStyle: true } } },
  cutout: '70%'
};

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

.filter-shell {
  background: var(--color-surface-elevated);
}

.glass-card {
  background: var(--color-surface) !important;
  border: 1px solid var(--color-border) !important;
  border-radius: 24px !important;
  box-shadow: var(--shadow-sm) !important;
}

.glass-container {
  background: var(--color-surface);
  border: 1px solid var(--color-border) !important;
  border-radius: 24px !important;
  box-shadow: var(--shadow-sm);
}

.date-input :deep(input) {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text);
  cursor: pointer;
  width: 110px;
}

.custom-tabs :deep(.v-tab) {
  border-radius: 16px 16px 0 0;
  margin-right: 8px;
  background: var(--color-surface-elevated);
  transition: all 0.3s;
}

.custom-tabs :deep(.v-tab--selected) {
  background: var(--color-surface);
}

.custom-table :deep(.v-table__wrapper) {
  background: transparent !important;
}

.custom-table :deep(th) {
  background: var(--color-surface-elevated) !important;
  font-size: 10px !important;
  font-weight: 800 !important;
  color: var(--color-text-secondary) !important;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.chart-wrapper {
  position: relative;
  min-height: 250px;
}
</style>
