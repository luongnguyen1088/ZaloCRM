<template>
  <v-container class="py-10 admin-shell">
    <!-- Header Section -->
    <div class="d-flex flex-column flex-md-row align-start align-md-center justify-space-between mb-10">
      <div>
        <h1 class="text-h3 font-weight-black text-gradient mb-2">Hệ thống Quản trị</h1>
        <p class="text-subtitle-1 text-placeholder max-width-600">
          Trung tâm điều hành ZaloCRM. Quản lý toàn bộ tổ chức, phê duyệt gói cước và theo dõi sự tăng trưởng của hệ thống.
        </p>
      </div>
      <div class="mt-4 mt-md-0 d-flex gap-3">
        <v-btn
          variant="flat"
          color="surface-variant"
          prepend-icon="mdi-refresh"
          @click="fetchData"
          :loading="loading"
          class="rounded-xl px-6"
        >
          Làm mới
        </v-btn>
      </div>
    </div>

    <!-- Error State -->
    <v-alert
      v-if="error"
      type="error"
      variant="tonal"
      class="mb-8 rounded-xl animate-fade-in"
      closable
      @click:close="error = null"
    >
      {{ error }}
    </v-alert>

    <!-- Stats Overview -->
    <v-row v-if="!error" class="mb-8">
      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card glass-premium overflow-hidden">
          <div class="pa-6">
            <div class="d-flex justify-space-between align-center mb-4">
              <v-avatar color="primary-lighten-4" size="48" rounded="lg">
                <v-icon color="primary" size="24">mdi-domain</v-icon>
              </v-avatar>
              <v-chip size="x-small" color="success" class="font-weight-bold">+{{ newOrgsToday }} hôm nay</v-chip>
            </div>
            <div class="text-h3 font-weight-black text-white mb-1">{{ orgs.length }}</div>
            <div class="text-caption font-weight-medium text-placeholder uppercase tracking-wider">Tổng tổ chức</div>
          </div>
          <div class="stat-gradient bg-primary"></div>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card glass-premium overflow-hidden">
          <div class="pa-6">
            <div class="d-flex justify-space-between align-center mb-4">
              <v-avatar color="info-lighten-4" size="48" rounded="lg">
                <v-icon color="info" size="24">mdi-star-circle</v-icon>
              </v-avatar>
            </div>
            <div class="text-h3 font-weight-black text-white mb-1">{{ premiumOrgsCount }}</div>
            <div class="text-caption font-weight-medium text-placeholder uppercase tracking-wider">Gói trả phí</div>
          </div>
          <div class="stat-gradient bg-info"></div>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card glass-premium overflow-hidden">
          <div class="pa-6">
            <div class="d-flex justify-space-between align-center mb-4">
              <v-avatar color="warning-lighten-4" size="48" rounded="lg">
                <v-icon color="warning" size="24">mdi-account-group</v-icon>
              </v-avatar>
            </div>
            <div class="text-h3 font-weight-black text-white mb-1">{{ totalUsersCount }}</div>
            <div class="text-caption font-weight-medium text-placeholder uppercase tracking-wider">Tổng người dùng</div>
          </div>
          <div class="stat-gradient bg-warning"></div>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card glass-premium overflow-hidden">
          <div class="pa-6">
            <div class="d-flex justify-space-between align-center mb-4">
              <v-avatar color="success-lighten-4" size="48" rounded="lg">
                <v-icon color="success" size="24">mdi-currency-usd</v-icon>
              </v-avatar>
            </div>
            <div class="text-h3 font-weight-black text-white mb-1">Active</div>
            <div class="text-caption font-weight-medium text-placeholder uppercase tracking-wider">Trạng thái hệ thống</div>
          </div>
          <div class="stat-gradient bg-success"></div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Main Content Area -->
    <v-card class="glass-main-card overflow-hidden">
      <!-- Toolbar -->
      <div class="pa-6 border-bottom d-flex flex-column flex-sm-row align-center gap-4">
        <v-text-field
          v-model="searchQuery"
          prepend-inner-icon="mdi-magnify"
          label="Tìm kiếm tổ chức hoặc email..."
          variant="solo"
          flat
          hide-details
          class="search-bar flex-grow-1"
          rounded="xl"
          bg-color="rgba(255, 255, 255, 0.05)"
        ></v-text-field>
        
        <v-select
          v-model="filterPlan"
          :items="['Tất cả gói', 'Free', 'Pro', 'Enterprise']"
          variant="solo"
          flat
          hide-details
          class="filter-select"
          rounded="xl"
          bg-color="rgba(255, 255, 255, 0.05)"
          prefix="Gói:"
        ></v-select>
      </div>

      <!-- Data Table -->
      <v-data-table
        :headers="headers"
        :items="filteredOrgs"
        :loading="loading"
        class="bg-transparent premium-table"
        hover
      >
        <!-- Custom Name Column -->
        <template #[`item.name`]="{ item }">
          <div class="d-flex align-center py-3">
            <v-avatar color="primary-darken-1" class="mr-3 text-white font-weight-black" size="40">
              {{ item.name.charAt(0).toUpperCase() }}
            </v-avatar>
            <div class="d-flex flex-column">
              <span class="font-weight-bold text-white text-body-1">{{ item.name }}</span>
              <span class="text-caption text-placeholder opacity-60">{{ item.id }}</span>
            </div>
          </div>
        </template>

        <!-- Custom Subscription Column -->
        <template #[`item.subscription`]="{ item }">
          <v-chip
            v-if="item.subscription"
            :color="getPlanColor(item.subscription.plan.name)"
            variant="flat"
            size="small"
            class="font-weight-black px-3"
          >
            {{ item.subscription.plan.name.toUpperCase() }}
          </v-chip>
          <v-chip v-else color="grey-darken-3" variant="flat" size="small" class="px-3">FREE</v-chip>
        </template>

        <!-- Custom Expiry Column -->
        <template #[`item.expiry`]="{ item }">
          <div v-if="item.subscription" class="d-flex flex-column">
            <span :class="isExpiringSoon(item.subscription.currentPeriodEnd) ? 'text-warning' : 'text-body-2'">
              {{ formatDate(item.subscription.currentPeriodEnd) }}
            </span>
            <span class="text-caption opacity-50">Ngày hết hạn</span>
          </div>
          <span v-else class="text-placeholder opacity-40">—</span>
        </template>

        <!-- Custom Owner Column -->
        <template #[`item.members`]="{ item }">
          <div class="d-flex flex-column">
            <span class="text-body-2 font-weight-medium">{{ item.members?.[0]?.user?.fullName || 'Chưa có tên' }}</span>
            <span class="text-caption text-placeholder">{{ item.members?.[0]?.user?.email || 'N/A' }}</span>
          </div>
        </template>

        <!-- Custom Actions Column -->
        <template #[`item.actions`]="{ item }">
          <v-btn
            size="small"
            variant="tonal"
            color="primary"
            prepend-icon="mdi-rocket-launch"
            @click="openUpgradeDialog(item)"
            class="rounded-lg font-weight-bold"
          >
            Nâng cấp
          </v-btn>
        </template>

        <!-- Loading & Empty States -->
        <template #loading>
          <div class="pa-10 text-center">
            <v-progress-circular indeterminate color="primary" size="64" class="mb-4"></v-progress-circular>
            <div class="text-subtitle-1 text-placeholder">Đang tải dữ liệu tổ chức...</div>
          </div>
        </template>

        <template #no-data>
          <div class="pa-10 text-center">
            <v-icon size="64" color="grey-darken-3" class="mb-4">mdi-database-off</v-icon>
            <div class="text-h6 text-placeholder">Không tìm thấy tổ chức nào</div>
            <v-btn variant="text" color="primary" @click="fetchData" class="mt-2">Thử lại</v-btn>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- Upgrade Dialog -->
    <v-dialog v-model="upgradeDialog" max-width="600" persistent>
      <v-card class="glass-premium pa-0 overflow-hidden">
        <div class="pa-6 border-bottom d-flex align-center justify-space-between bg-primary-darken-1">
          <div class="d-flex align-center">
            <v-icon color="white" class="mr-3">mdi-rocket-launch</v-icon>
            <h3 class="text-h5 font-weight-bold text-white">Kích hoạt Gói Cước</h3>
          </div>
          <v-btn icon="mdi-close" variant="text" color="white" @click="upgradeDialog = false" size="small"></v-btn>
        </div>

        <div class="pa-8">
          <div class="mb-8 d-flex align-center pa-4 bg-white-opacity-5 rounded-xl">
            <v-avatar color="primary" size="48" class="mr-4">
              <span class="text-h6">{{ selectedOrg?.name.charAt(0).toUpperCase() }}</span>
            </v-avatar>
            <div>
              <div class="text-h6 font-weight-bold text-white">{{ selectedOrg?.name }}</div>
              <div class="text-caption text-placeholder">
                Hiện tại: 
                <v-chip size="x-small" :color="getPlanColor(selectedOrg?.subscription?.plan?.name || 'Free')" class="ml-1 font-weight-bold">
                  {{ (selectedOrg?.subscription?.plan?.name || 'FREE').toUpperCase() }}
                </v-chip>
              </div>
            </div>
          </div>

          <!-- Plan Selection Cards -->
          <div class="text-subtitle-1 font-weight-bold text-white mb-4">1. Chọn gói cước</div>
          <v-row class="mb-8">
            <v-col v-for="plan in plans" :key="plan.id" cols="12" sm="4">
              <v-card
                @click="upgradeForm.planId = plan.id"
                :class="['plan-select-card text-center pa-4', upgradeForm.planId === plan.id ? 'active-plan' : '']"
                variant="flat"
              >
                <v-icon :color="getPlanColor(plan.name)" size="32" class="mb-2">
                  {{ plan.name === 'Enterprise' ? 'mdi-crown' : plan.name === 'Pro' ? 'mdi-star' : 'mdi-leaf' }}
                </v-icon>
                <div class="font-weight-black text-body-1">{{ plan.name }}</div>
                <div class="text-caption opacity-60">{{ (plan.priceMonth / 1000).toLocaleString() }}k/tháng</div>
                
                <v-fade-transition>
                  <v-icon v-if="upgradeForm.planId === plan.id" color="primary" class="check-badge" size="20">mdi-check-circle</v-icon>
                </v-fade-transition>
              </v-card>
            </v-col>
          </v-row>

          <!-- Duration Selection -->
          <div class="text-subtitle-1 font-weight-bold text-white mb-4">2. Thời hạn kích hoạt</div>
          <v-btn-toggle
            v-model="upgradeForm.months"
            mandatory
            color="primary"
            class="duration-toggle mb-8 w-100"
            rounded="xl"
          >
            <v-btn :value="1" class="flex-grow-1">1Th</v-btn>
            <v-btn :value="3" class="flex-grow-1">3Th</v-btn>
            <v-btn :value="6" class="flex-grow-1">6Th</v-btn>
            <v-btn :value="12" class="flex-grow-1">12Th</v-btn>
          </v-btn-toggle>

          <!-- Expiry Preview -->
          <v-card variant="tonal" color="primary" class="pa-4 rounded-xl mb-8 border-dashed">
            <div class="d-flex align-center justify-space-between">
              <div class="d-flex align-center">
                <v-icon color="primary" class="mr-2">mdi-calendar-clock</v-icon>
                <span class="text-body-2 text-white">Ngày hết hạn dự kiến:</span>
              </div>
              <div class="text-h6 font-weight-black text-primary">{{ previewExpiryDate }}</div>
            </div>
          </v-card>

          <v-btn
            block
            size="x-large"
            color="primary"
            class="rounded-xl font-weight-black"
            :loading="submitting"
            @click="handleUpgrade"
            elevation="8"
          >
            XÁC NHẬN KÍCH HOẠT
          </v-btn>
        </div>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { api } from '@/api/index';

const orgs = ref<any[]>([]);
const plans = ref<any[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const submitting = ref(false);
const upgradeDialog = ref(false);
const selectedOrg = ref<any>(null);

const searchQuery = ref('');
const filterPlan = ref('Tất cả gói');

const upgradeForm = ref({
  planId: '',
  months: 1
});

const headers = [
  { title: 'Tổ chức', key: 'name', width: '300px' },
  { title: 'Gói hiện tại', key: 'subscription', align: 'center' as const },
  { title: 'Trạng thái gia hạn', key: 'expiry' },
  { title: 'Chủ sở hữu', key: 'members' },
  { title: 'Thao tác', key: 'actions', sortable: false, align: 'end' as const }
];

const premiumOrgsCount = computed(() => {
  return orgs.value.filter(o => o.subscription && o.subscription.plan.name !== 'Free').length;
});

const totalUsersCount = computed(() => {
  return orgs.value.reduce((acc, org) => acc + (org.members?.length || 0), 0);
});

const newOrgsToday = computed(() => {
  const today = new Date().toDateString();
  return orgs.value.filter(o => new Date(o.createdAt).toDateString() === today).length;
});

const previewExpiryDate = computed(() => {
  if (!selectedOrg.value) return '—';
  
  const now = new Date();
  // If already has active sub and it hasn't expired, extend from there
  let startDate = now;
  if (selectedOrg.value.subscription) {
    const currentExpiry = new Date(selectedOrg.value.subscription.currentPeriodEnd);
    if (currentExpiry > now) {
      startDate = currentExpiry;
    }
  }
  
  const futureDate = new Date(startDate);
  futureDate.setMonth(futureDate.getMonth() + upgradeForm.value.months);
  
  return futureDate.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

const filteredOrgs = computed(() => {
  let result = orgs.value;

  // Search filter
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    result = result.filter(o => 
      o.name.toLowerCase().includes(q) || 
      o.members?.some((m: any) => m.user?.email.toLowerCase().includes(q) || m.user?.fullName.toLowerCase().includes(q))
    );
  }

  // Plan filter
  if (filterPlan.value !== 'Tất cả gói') {
    result = result.filter(o => {
      const planName = o.subscription?.plan.name || 'Free';
      return planName === filterPlan.value;
    });
  }

  return result;
});

const fetchData = async () => {
  loading.value = true;
  error.value = null;
  try {
    const [orgsRes, plansRes] = await Promise.all([
      api.get('/admin/organizations'),
      api.get('/admin/plans')
    ]);
    orgs.value = orgsRes.data;
    plans.value = plansRes.data;
  } catch (err: any) {
    console.error('Admin fetch failed', err);
    if (err.response?.status === 403) {
      error.value = 'Bạn không có quyền truy cập dữ liệu quản trị. Vui lòng thử đăng xuất và đăng nhập lại.';
    } else {
      error.value = 'Không thể tải dữ liệu từ máy chủ. Vui lòng kiểm tra kết nối mạng hoặc thử lại sau.';
    }
  } finally {
    loading.value = false;
  }
};

const openUpgradeDialog = (org: any) => {
  selectedOrg.value = org;
  upgradeForm.value.planId = org.subscription?.planId || plans.value[0]?.id || '';
  upgradeForm.value.months = 1;
  upgradeDialog.value = true;
};

const handleUpgrade = async () => {
  if (!selectedOrg.value || !upgradeForm.value.planId) return;
  
  submitting.value = true;
  try {
    await api.post(`/admin/organizations/${selectedOrg.value.id}/subscribe`, {
      planId: upgradeForm.value.planId,
      months: upgradeForm.value.months
    });
    upgradeDialog.value = false;
    fetchData(); // Refresh table
  } catch (err) {
    alert('Cập nhật thất bại. Vui lòng thử lại.');
  } finally {
    submitting.value = false;
  }
};

const getPlanColor = (name: string) => {
  if (name === 'Enterprise') return 'purple-accent-3';
  if (name === 'Pro') return 'blue-accent-3';
  return 'grey-darken-1';
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const isExpiringSoon = (date: string) => {
  const expiry = new Date(date);
  const now = new Date();
  const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays > 0 && diffDays <= 7;
};

onMounted(fetchData);
</script>

<style scoped>
.admin-shell {
  min-height: 100vh;
}

.text-gradient {
  background: linear-gradient(to right, #ffffff, #94a3b8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.max-width-600 {
  max-width: 600px;
}

.text-placeholder {
  color: #94a3b8;
}

/* Stat Cards */
.stat-card {
  position: relative;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  z-index: 1;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.stat-gradient {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 4px;
  opacity: 0.6;
}

/* Glassmorphism */
.glass-premium {
  background: rgba(30, 41, 59, 0.7) !important;
  backdrop-filter: blur(16px) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  border-radius: 24px !important;
}

.glass-main-card {
  background: rgba(15, 23, 42, 0.8) !important;
  backdrop-filter: blur(20px) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  border-radius: 32px !important;
  box-shadow: 0 40px 100px rgba(0, 0, 0, 0.5) !important;
}

.border-bottom {
  border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
}

/* Table Styling */
.premium-table :deep(table) {
  border-collapse: separate !important;
  border-spacing: 0 4px !important;
}

.premium-table :deep(thead th) {
  background: transparent !important;
  color: #64748b !important;
  font-weight: 700 !important;
  font-size: 0.7rem !important;
  text-transform: uppercase !important;
  letter-spacing: 0.1em !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
}

.premium-table :deep(tbody tr) {
  transition: background 0.2s ease;
}

.premium-table :deep(tbody tr:hover) {
  background: rgba(255, 255, 255, 0.02) !important;
}

.premium-table :deep(td) {
  border-bottom: 1px solid rgba(255, 255, 255, 0.03) !important;
}

/* Form Elements */
.search-bar :deep(.v-field) {
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  transition: border-color 0.3s ease;
}

.search-bar :deep(.v-field--focused) {
  border-color: rgba(var(--v-theme-primary), 0.5) !important;
}

.filter-select {
  max-width: 200px;
}

/* Utilities */
.gap-3 { gap: 12px; }
.gap-4 { gap: 16px; }

.animate-fade-in {
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.opacity-60 { opacity: 0.6; }
.opacity-50 { opacity: 0.5; }
.opacity-40 { opacity: 0.4; }

.uppercase { text-transform: uppercase; }
.tracking-wider { letter-spacing: 0.05em; }

/* Plan Selection */
.plan-select-card {
  background: rgba(255, 255, 255, 0.03) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 16px !important;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.plan-select-card:hover {
  background: rgba(255, 255, 255, 0.06) !important;
  transform: scale(1.05);
}

.active-plan {
  background: rgba(var(--v-theme-primary), 0.1) !important;
  border: 2px solid rgba(var(--v-theme-primary), 0.8) !important;
  transform: scale(1.05);
}

.check-badge {
  position: absolute;
  top: 8px;
  right: 8px;
}

.bg-white-opacity-5 {
  background: rgba(255, 255, 255, 0.05);
}

.border-dashed {
  border: 1px dashed rgba(var(--v-theme-primary), 0.4) !important;
}

.duration-toggle {
  height: 48px !important;
}

.duration-toggle :deep(.v-btn) {
  border-radius: 0 !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  font-weight: 700;
}

.duration-toggle :deep(.v-btn--active) {
  background: var(--v-theme-primary) !important;
  color: white !important;
}
</style>
