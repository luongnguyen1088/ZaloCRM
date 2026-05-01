<template>
  <v-container fluid class="pa-6 fill-height d-flex flex-column analytics-hub">
    <!-- Header -->
    <div class="d-flex align-center mb-6 flex-shrink-0 flex-wrap ga-4">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1 gradient-text text-uppercase" style="letter-spacing: -1px;">
          {{ activeTabTitle }}
        </h1>
        <p class="text-medium-emphasis mb-0">{{ activeTabSubtitle }}</p>
      </div>
      <v-spacer />
      
      <!-- Shared Filters for Report Tabs -->
      <template v-if="tab !== 'overview'">
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
          @click="refreshCurrentTab"
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
      </template>

      <!-- Refresh for Dashboard -->
      <v-btn
        v-else
        variant="tonal"
        color="primary"
        prepend-icon="mdi-refresh"
        rounded="xl"
        :loading="loading"
        @click="refreshDashboard"
      >
        Làm mới
      </v-btn>
    </div>

    <!-- Main Navigation Tabs -->
    <div class="flex-grow-1 d-flex flex-column overflow-hidden">
      <v-tabs v-model="tab" color="primary" align-tabs="start" class="mb-6 custom-tabs">
        <v-tab value="overview" class="text-none font-weight-bold px-6">
          <v-icon start>mdi-view-dashboard-outline</v-icon> Tổng quan
        </v-tab>
        <v-tab value="messages" class="text-none font-weight-bold px-6">
          <v-icon start>mdi-message-text-outline</v-icon> Báo cáo Tin nhắn
        </v-tab>
        <v-tab value="contacts" class="text-none font-weight-bold px-6">
          <v-icon start>mdi-account-group-outline</v-icon> Báo cáo Khách hàng
        </v-tab>
        <v-tab value="appointments" class="text-none font-weight-bold px-6">
          <v-icon start>mdi-calendar-clock-outline</v-icon> Báo cáo Lịch hẹn
        </v-tab>
      </v-tabs>

      <v-window v-model="tab" class="flex-grow-1 overflow-hidden">
        <!-- TAB 1: OVERVIEW (DASHBOARD) -->
        <v-window-item value="overview" class="h-100 overflow-y-auto custom-scrollbar pr-2">
          <header class="dashboard-hero mb-8 rounded-xl pa-8 border relative overflow-hidden">
            <div class="relative" style="z-index: 1;">
              <h2 class="text-h4 font-weight-black mb-2">
                Chào buổi sáng, <span class="text-primary">{{ authStore.user?.fullName?.split(' ').pop() || 'Admin' }}</span>!
              </h2>
              <p class="text-subtitle-1 opacity-70">
                Hôm nay hệ thống đã tự động xử lý <span class="font-weight-bold text-primary">1,240</span> hội thoại mới.
              </p>
            </div>
          </header>

          <KpiCards :kpi="kpi" class="mb-8" />

          <v-row class="mb-8">
            <v-col cols="12" md="8">
              <MessageVolumeChart :data="messageVolume" class="h-100" />
            </v-col>
            <v-col cols="12" md="4">
              <PipelineChart :data="pipeline" class="h-100" />
            </v-col>
          </v-row>

          <v-row>
            <v-col cols="12" md="6">
              <SourceChart :data="sources" />
            </v-col>
            <v-col cols="12" md="6">
              <AppointmentChart :data="appointments" />
            </v-col>
          </v-row>
        </v-window-item>

        <!-- TAB 2: MESSAGES REPORT -->
        <v-window-item value="messages" class="h-100">
          <v-row class="h-100 ma-0">
            <v-col cols="12" md="8" class="pa-0 pr-md-3">
              <v-card class="glass-container h-100 pa-6 d-flex flex-column" border variant="flat">
                <div class="text-subtitle-1 font-weight-bold mb-4">Biểu đồ tăng trưởng tin nhắn</div>
                <div class="flex-grow-1">
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
                />
              </v-card>
            </v-col>
          </v-row>
        </v-window-item>

        <!-- TAB 3: CONTACTS REPORT -->
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

        <!-- TAB 4: APPOINTMENTS REPORT -->
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
import { useAuthStore } from '@/stores/auth';
import { useDashboard } from '@/composables/use-dashboard';

// Import Dashboard Components
import KpiCards from '@/components/dashboard/KpiCards.vue';
import MessageVolumeChart from '@/components/dashboard/MessageVolumeChart.vue';
import PipelineChart from '@/components/dashboard/PipelineChart.vue';
import SourceChart from '@/components/dashboard/SourceChart.vue';
import AppointmentChart from '@/components/dashboard/AppointmentChart.vue';

// Import Chart.js Components
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
  CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler, ArcElement, BarElement
);

const authStore = useAuthStore();
const { kpi, messageVolume, pipeline, sources, appointments, fetchAll: fetchDashboard } = useDashboard();

const tab = ref('overview');
const loading = ref(false);
const exporting = ref(false);

// Date Filters
const today = new Date();
const prior = new Date(today);
prior.setDate(prior.getDate() - 30);
const fmt = (d: Date) => d.toISOString().slice(0, 10);
const dateFrom = ref(fmt(prior));
const dateTo = ref(fmt(today));

// Report Data
const msgData = ref<any[]>([]);
const contactData = ref<any[]>([]);
const aptData = ref<any[]>([]);

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

const activeTabTitle = computed(() => {
  const map: any = {
    overview: 'Trung tâm Phân tích',
    messages: 'Báo cáo Tin nhắn',
    contacts: 'Báo cáo Khách hàng',
    appointments: 'Báo cáo Lịch hẹn',
  };
  return map[tab.value];
});

const activeTabSubtitle = computed(() => {
  if (tab.value === 'overview') return 'Cái nhìn tổng quát về hiệu quả kinh doanh của bạn';
  return `Chi tiết phân tích từ ${dateFrom.value} đến ${dateTo.value}`;
});

async function refreshDashboard() {
  loading.value = true;
  await fetchDashboard();
  loading.value = false;
}

async function fetchReports() {
  loading.value = true;
  try {
    const params = { from: dateFrom.value, to: dateTo.value };
    const [m, c, a] = await Promise.all([
      api.get('/reports/messages', { params }),
      api.get('/reports/contacts', { params }),
      api.get('/reports/appointments', { params })
    ]);
    msgData.value = m.data.data || m.data;
    
    // Process Contacts
    const cRows: any[] = [];
    (c.data.newPerDay || []).forEach((d: any) => cRows.push({ label: `Khách mới ${d.date}`, count: d.count }));
    (c.data.treatmentProgress || []).forEach((t: any) => cRows.push({ label: `Tiến triển: ${t.status}`, count: t.count }));
    contactData.value = cRows;

    // Process Appointments
    const aRows: any[] = [];
    (a.data.byStatus || []).forEach((s: any) => aRows.push({ label: `Trạng thái: ${s.status}`, count: s.count }));
    (a.data.byType || []).forEach((t: any) => aRows.push({ label: `Loại: ${t.type || 'Khác'}`, count: t.count }));
    aptData.value = aRows;
  } catch (err) {
    console.error('Report error:', err);
  } finally {
    loading.value = false;
  }
}

function refreshCurrentTab() {
  if (tab.value === 'overview') refreshDashboard();
  else fetchReports();
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

// Chart Computations
const msgChartData = computed(() => {
  if (!msgData.value.length) return null;
  return {
    labels: msgData.value.map(d => d.date.split('-').slice(1).join('/')),
    datasets: [
      { label: 'Gửi', data: msgData.value.map(d => d.sent), borderColor: '#6366f1', backgroundColor: 'rgba(99, 102, 241, 0.1)', fill: true },
      { label: 'Nhận', data: msgData.value.map(d => d.received), borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', fill: true }
    ]
  };
});

const contactChartData = computed(() => {
  const dist = contactData.value.filter(r => r.label.includes('Tiến triển'));
  if (!dist.length) return null;
  return {
    labels: dist.map(r => r.label.replace('Tiến triển: ', '')),
    datasets: [{ data: dist.map(r => r.count), backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444'] }]
  };
});

const aptChartData = computed(() => {
  const dist = aptData.value.filter(r => r.label.includes('Trạng thái'));
  if (!dist.length) return null;
  return {
    labels: dist.map(r => r.label.replace('Trạng thái: ', '')),
    datasets: [{ data: dist.map(r => r.count), backgroundColor: ['#10b981', '#6366f1', '#f59e0b', '#ef4444'] }]
  };
});

const chartOptions = { responsive: true, maintainAspectRatio: false };
const donutOptions = { responsive: true, maintainAspectRatio: false, cutout: '70%' };

onMounted(() => {
  refreshDashboard();
  fetchReports();
});

watch(tab, (newTab) => {
  if (newTab !== 'overview' && !msgData.value.length) fetchReports();
});
</script>

<style scoped>
.analytics-hub {
  background: var(--color-canvas);
}

.gradient-text {
  background: var(--gradient-brand);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.dashboard-hero {
  background: var(--gradient-hero);
  position: relative;
}

.dashboard-hero::after {
  content: '';
  position: absolute;
  right: -50px;
  top: -50px;
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, var(--color-primary-soft) 0%, transparent 70%);
  border-radius: 50%;
}

.filter-shell {
  background: var(--color-surface-elevated);
}

.glass-container {
  background: var(--color-surface);
  border-radius: 24px !important;
  box-shadow: var(--shadow-sm);
}

.date-input :deep(input) {
  font-size: 0.875rem;
  font-weight: 600;
  width: 110px;
  cursor: pointer;
}

.custom-tabs :deep(.v-tab) {
  border-radius: 16px 16px 0 0;
  margin-right: 8px;
  background: var(--color-surface-elevated);
}

.custom-tabs :deep(.v-tab--selected) {
  background: var(--color-surface);
}

.custom-table :deep(th) {
  background: var(--color-surface-elevated) !important;
  font-size: 10px !important;
  font-weight: 800 !important;
  text-transform: uppercase;
}

.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: var(--color-primary-soft); border-radius: 10px; }
</style>
