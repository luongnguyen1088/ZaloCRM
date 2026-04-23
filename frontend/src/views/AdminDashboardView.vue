<template>
  <v-container class="py-8 admin-shell">
    <div class="d-flex align-center justify-space-between mb-8">
      <div>
        <h1 class="text-h4 font-weight-black text-white mb-1">Hệ thống Quản trị</h1>
        <p class="text-subtitle-1 text-placeholder">Quản lý tổ chức, người dùng và gói cước CRM.</p>
      </div>
      <v-btn color="primary" prepend-icon="mdi-refresh" @click="fetchData" :loading="loading">
        Làm mới dữ liệu
      </v-btn>
    </div>

    <v-row>
      <v-col cols="12" md="4">
        <v-card class="stat-card glass-premium pa-6 mb-6">
          <div class="d-flex align-center">
            <v-avatar color="primary-soft" size="56" class="mr-4">
              <v-icon color="primary" size="28">mdi-domain</v-icon>
            </v-avatar>
            <div>
              <div class="text-h4 font-weight-black text-white">{{ orgs.length }}</div>
              <div class="text-subtitle-2 text-placeholder">Tổ chức (Organizations)</div>
            </div>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card class="stat-card glass-premium pa-6 mb-6">
          <div class="d-flex align-center">
            <v-avatar color="success-soft" size="56" class="mr-4">
              <v-icon color="success" size="28">mdi-star-circle</v-icon>
            </v-avatar>
            <div>
              <div class="text-h4 font-weight-black text-white">{{ premiumOrgsCount }}</div>
              <div class="text-subtitle-2 text-placeholder">Gói Pro/Enterprise</div>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-card class="glass-card mt-4">
      <v-data-table
        :headers="headers"
        :items="orgs"
        :loading="loading"
        class="bg-transparent admin-table"
        hover
      >
        <template #[`item.name`]="{ item }">
          <div class="d-flex flex-column">
            <span class="font-weight-bold text-white">{{ item.name }}</span>
            <span class="text-caption text-placeholder">{{ item.id }}</span>
          </div>
        </template>

        <template #[`item.subscription`]="{ item }">
          <v-chip
            v-if="item.subscription"
            :color="getPlanColor(item.subscription.plan.name)"
            size="small"
            class="font-weight-bold"
          >
            {{ item.subscription.plan.name }}
          </v-chip>
          <v-chip v-else color="grey" size="small">Free (Default)</v-chip>
        </template>

        <template #[`item.expiry`]="{ item }">
          <span v-if="item.subscription" class="text-body-2">
            {{ formatDate(item.subscription.currentPeriodEnd) }}
          </span>
          <span v-else>N/A</span>
        </template>

        <template #[`item.members`]="{ item }">
          <div class="d-flex flex-column">
            <span class="text-body-2">{{ item.members?.[0]?.user?.fullName || 'No user' }}</span>
            <span class="text-caption text-placeholder">{{ item.members?.[0]?.user?.email || '' }}</span>
          </div>
        </template>

        <template #[`item.actions`]="{ item }">
          <v-btn
            size="small"
            variant="tonal"
            color="primary"
            prepend-icon="mdi-shield-edit"
            @click="openUpgradeDialog(item)"
          >
            Duyệt Gói
          </v-btn>
        </template>
      </v-data-table>
    </v-card>

    <!-- Upgrade Dialog -->
    <v-dialog v-model="upgradeDialog" max-width="500">
      <v-card class="glass-premium pa-6">
        <h3 class="text-h5 font-weight-bold mb-4">Kích hoạt/Nâng cấp Gói</h3>
        <p class="text-body-2 mb-6">Chọn gói cước và thời hạn để kích hoạt cho tổ chức <strong>{{ selectedOrg?.name }}</strong>.</p>
        
        <v-select
          v-model="upgradeForm.planId"
          :items="plans"
          item-title="name"
          item-value="id"
          label="Chọn gói cước"
          variant="outlined"
          class="mb-4"
        >
          <template #item="{ props, item }">
            <v-list-item v-bind="props" :subtitle="`${(item.raw.priceMonth / 1000).toLocaleString()}k / tháng`"></v-list-item>
          </template>
        </v-select>

        <v-select
          v-model="upgradeForm.months"
          :items="[
            { title: '1 Tháng', value: 1 },
            { title: '3 Tháng', value: 3 },
            { title: '6 Tháng', value: 6 },
            { title: '12 Tháng (1 Năm)', value: 12 }
          ]"
          label="Thời hạn"
          variant="outlined"
          class="mb-6"
        ></v-select>

        <div class="d-flex justify-end gap-2">
          <v-btn variant="text" @click="upgradeDialog = false">Hủy</v-btn>
          <v-btn color="primary" :loading="submitting" @click="handleUpgrade">Xác nhận Kích hoạt</v-btn>
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
const submitting = ref(false);
const upgradeDialog = ref(false);
const selectedOrg = ref<any>(null);

const upgradeForm = ref({
  planId: '',
  months: 1
});

const headers = [
  { title: 'Tổ chức', key: 'name' },
  { title: 'Gói hiện tại', key: 'subscription' },
  { title: 'Hết hạn', key: 'expiry' },
  { title: 'Chủ sở hữu (Email)', key: 'members' },
  { title: 'Hành động', key: 'actions', sortable: false }
];

const premiumOrgsCount = computed(() => {
  return orgs.value.filter(o => o.subscription && o.subscription.plan.name !== 'Free').length;
});

const fetchData = async () => {
  loading.value = true;
  try {
    const [orgsRes, plansRes] = await Promise.all([
      api.get('/admin/organizations'),
      api.get('/admin/plans')
    ]);
    orgs.value = orgsRes.data;
    plans.value = plansRes.data;
  } catch (err) {
    console.error('Admin fetch failed', err);
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
  if (name === 'Enterprise') return 'purple';
  if (name === 'Pro') return 'primary';
  return 'grey';
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('vi-VN');
};

onMounted(fetchData);
</script>

<style scoped>
.admin-shell {
  min-height: 100vh;
}

.text-placeholder {
  color: var(--color-text-secondary);
}

.glass-premium {
  background: var(--color-surface-glass) !important;
  border: 1px solid var(--color-border) !important;
  backdrop-filter: blur(12px) !important;
  border-radius: 20px !important;
}

.glass-card {
  background: var(--color-surface-elevated) !important;
  border: 1px solid var(--color-border) !important;
  border-radius: 24px !important;
  overflow: hidden;
}

.admin-table {
  color: var(--color-text) !important;
}

:deep(.v-data-table-header__content) {
  font-weight: 700;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 1px;
  color: var(--color-text-secondary);
}

.primary-soft { background: rgba(var(--v-theme-primary), 0.1) !important; }
.success-soft { background: rgba(var(--v-theme-success), 0.1) !important; }

.gap-2 { gap: 8px; }
</style>
