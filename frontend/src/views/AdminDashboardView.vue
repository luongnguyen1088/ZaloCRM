<template>
  <v-container class="admin-page py-8 py-md-10">
    <section class="hero-shell mb-8">
      <div class="hero-shell__copy">
        <div class="hero-badge mb-4">
          <v-icon size="18" color="primary">mdi-shield-crown-outline</v-icon>
          <span>Admin Console</span>
        </div>

        <h1 class="hero-title mb-4">Điều phối thuê bao và tăng trưởng toàn hệ thống</h1>
        <p class="hero-description mb-6">
          Một màn hình để rà soát tổ chức mới, phát hiện thuê bao sắp hết hạn và kích hoạt gói cước
          nhanh hơn cho toàn bộ hệ thống Claro.
        </p>

        <div class="hero-actions">
          <v-btn
            color="primary"
            variant="flat"
            prepend-icon="mdi-refresh"
            :loading="loading"
            rounded="xl"
            class="px-6"
            @click="fetchData"
          >
            Làm mới dữ liệu
          </v-btn>

          <v-btn
            variant="tonal"
            color="primary"
            prepend-icon="mdi-filter-variant"
            rounded="xl"
            class="px-6"
            @click="resetFilters"
          >
            Xóa bộ lọc
          </v-btn>
        </div>
      </div>

      <v-card class="hero-panel pa-6 pa-md-7">
        <div class="hero-panel__header mb-6">
          <div>
            <div class="eyebrow mb-2">Trạng thái vận hành</div>
            <div class="hero-panel__title">Những gì cần ưu tiên hôm nay</div>
          </div>

          <v-chip
            :color="expiringSoonCount > 0 ? 'warning' : 'success'"
            variant="tonal"
            size="small"
            class="font-weight-bold"
          >
            {{ expiringSoonCount > 0 ? `${expiringSoonCount} gói cần theo dõi` : 'Ổn định' }}
          </v-chip>
        </div>

        <div class="hero-metrics">
          <div class="hero-metric">
            <span class="hero-metric__label">MRR hiện tại</span>
            <strong class="hero-metric__value">{{ formatCurrency(monthlyRecurringRevenue) }}</strong>
            <span class="hero-metric__hint">{{ premiumOrgsCount }} tổ chức đang trả phí</span>
          </div>

          <div class="hero-metric">
            <span class="hero-metric__label">Tỷ lệ trả phí</span>
            <strong class="hero-metric__value">{{ paidAdoptionRate }}</strong>
            <span class="hero-metric__hint">{{ freeOrgsCount }} tổ chức đang ở gói Free</span>
          </div>

          <div class="hero-metric">
            <span class="hero-metric__label">Tăng trưởng hôm nay</span>
            <strong class="hero-metric__value">+{{ newOrgsToday }}</strong>
            <span class="hero-metric__hint">
              {{ latestOrganization ? `Mới nhất: ${latestOrganization.name}` : 'Chưa có tổ chức mới' }}
            </span>
          </div>
        </div>
      </v-card>
    </section>

    <v-alert
      v-if="error"
      type="error"
      variant="tonal"
      closable
      class="mb-8 rounded-xl"
      @click:close="error = null"
    >
      {{ error }}
    </v-alert>

    <!-- Metric Summary Section -->
    <MetricSummary :items="summaryCards" />

    <v-row align="stretch">
      <v-col cols="12" xl="8">
        <v-card class="surface-card pa-4 pa-md-6 mb-6">
          <div class="section-head mb-5">
            <div>
              <div class="eyebrow mb-2">Danh sách tổ chức</div>
              <h2 class="section-title">
                {{ filteredOrgs.length }} / {{ orgs.length }} tổ chức đang hiển thị
              </h2>
            </div>

            <v-chip color="primary" variant="tonal" size="small" class="font-weight-bold">
              {{ searchQuery ? 'Đang lọc theo từ khóa' : 'Toàn bộ hệ thống' }}
            </v-chip>
          </div>

          <div class="filters-grid">
            <v-text-field
              v-model="searchQuery"
              variant="solo-filled"
              flat
              hide-details
              clearable
              rounded="xl"
              prepend-inner-icon="mdi-magnify"
              label="Tìm theo tên tổ chức, email, người phụ trách..."
              class="filters-grid__search"
            />

            <v-select
              v-model="filterPlan"
              :items="planFilterItems"
              variant="solo-filled"
              flat
              hide-details
              rounded="xl"
              label="Gói cước"
            />

            <v-select
              v-model="filterStatus"
              :items="statusFilterItems"
              variant="solo-filled"
              flat
              hide-details
              rounded="xl"
              label="Trạng thái"
            />

            <v-select
              v-model="sortBy"
              :items="sortItems"
              variant="solo-filled"
              flat
              hide-details
              rounded="xl"
              label="Sắp xếp"
            />
          </div>
        </v-card>

        <div v-if="loading && !orgs.length" class="org-list">
          <v-card v-for="index in 3" :key="index" class="org-card-placeholder pa-5 mb-4">
            <div class="placeholder-line placeholder-line--lg mb-4"></div>
            <div class="placeholder-grid mb-4">
              <div class="placeholder-line"></div>
              <div class="placeholder-line"></div>
              <div class="placeholder-line"></div>
            </div>
            <div class="placeholder-line placeholder-line--sm"></div>
          </v-card>
        </div>

        <div v-else-if="filteredOrgs.length" class="org-list">
          <OrgCard 
            v-for="org in filteredOrgs" 
            :key="org.id" 
            :org="org" 
            @upgrade="openUpgradeDialog"
          />
        </div>

        <v-card v-else class="surface-card empty-card pa-8 text-center">
          <v-avatar size="72" color="primary-lighten-5" class="mx-auto mb-4">
            <v-icon size="34" color="primary">mdi-database-search-outline</v-icon>
          </v-avatar>
          <h3 class="empty-card__title mb-2">Không tìm thấy tổ chức phù hợp</h3>
          <p class="empty-card__body mb-5">
            Hãy thử nới bộ lọc hoặc tìm bằng tên công ty, email quản trị viên hay trạng thái gói cước.
          </p>
          <v-btn color="primary" variant="flat" rounded="xl" @click="resetFilters">
            Đặt lại bộ lọc
          </v-btn>
        </v-card>
      </v-col>

      <v-col cols="12" xl="4">
        <v-card class="surface-card pa-5 pa-md-6 mb-6">
          <div class="section-head mb-4">
            <div>
              <div class="eyebrow mb-2">Cần chú ý</div>
              <h2 class="section-title">Thuê bao sắp hết hạn</h2>
            </div>
          </div>

          <div v-if="priorityOrganizations.length" class="priority-list">
            <button
              v-for="org in priorityOrganizations"
              :key="org.id"
              type="button"
              class="priority-item"
              @click="openUpgradeDialog(org)"
            >
              <div>
                <div class="priority-item__name">{{ org.name }}</div>
                <div class="priority-item__meta">
                  {{ getPlanName(org) }} • {{ getOwner(org).name }}
                </div>
              </div>
              <v-chip :color="getOrgStatus(org).color" variant="tonal" size="small" class="font-weight-bold">
                {{ getRenewalText(org) }}
              </v-chip>
            </button>
          </div>

          <div v-else class="notice-box notice-box--success">
            <v-icon color="success" size="18">mdi-check-circle-outline</v-icon>
            <span>Chưa có tổ chức nào nằm trong ngưỡng cần gia hạn gấp.</span>
          </div>
        </v-card>

        <v-card class="surface-card pa-5 pa-md-6 mb-6">
          <div class="section-head mb-4">
            <div>
              <div class="eyebrow mb-2">Cơ cấu gói</div>
              <h2 class="section-title">Phân bổ theo plan</h2>
            </div>
          </div>

          <div v-for="item in planBreakdown" :key="item.name" class="breakdown-row">
            <div class="breakdown-row__head">
              <div class="d-flex align-center ga-2">
                <span class="breakdown-dot" :style="{ background: item.dot }"></span>
                <span class="breakdown-row__name">{{ item.name }}</span>
              </div>
              <span class="breakdown-row__value">{{ item.count }}</span>
            </div>
            <v-progress-linear
              :model-value="item.percent"
              :color="item.color"
              bg-color="rgba(148, 163, 184, 0.18)"
              rounded
              height="8"
              class="mt-2"
            />
          </div>
        </v-card>

        <v-card class="surface-card pa-5 pa-md-6 mb-6">
          <div class="section-head mb-4">
            <div>
              <div class="eyebrow mb-2">AI Control</div>
              <h2 class="section-title">AI Token toàn hệ thống</h2>
            </div>

            <v-chip
              :color="aiNearLimitCount > 0 ? 'warning' : 'success'"
              variant="tonal"
              size="small"
              class="font-weight-bold"
            >
              {{ aiNearLimitCount > 0 ? `${aiNearLimitCount} org gần cạn quota` : 'Quota ổn định' }}
            </v-chip>
          </div>

          <div class="ai-system-card mb-4">
            <div class="ai-system-card__value">{{ formatToken(totalAiUsedTokens) }}</div>
            <div class="ai-system-card__subtitle">
              Đã dùng trên tổng {{ formatToken(totalAiQuota) }} quota tháng • còn {{ formatToken(totalAiRemainingTokens) }}
            </div>

            <v-progress-linear
              :model-value="overallAiUsagePercent"
              :color="overallAiUsagePercent >= 80 ? 'warning' : 'primary'"
              bg-color="rgba(148, 163, 184, 0.18)"
              rounded
              height="10"
              class="mt-4"
            />
          </div>

          <div class="snapshot-grid">
            <div class="snapshot-tile">
              <span class="snapshot-tile__label">AI đang bật</span>
              <strong class="snapshot-tile__value">{{ aiEnabledOrgsCount }}</strong>
              <span class="snapshot-tile__hint">trên {{ orgs.length }} tổ chức</span>
            </div>

            <div class="snapshot-tile">
              <span class="snapshot-tile__label">Gần hết quota</span>
              <strong class="snapshot-tile__value">{{ aiNearLimitCount }}</strong>
              <span class="snapshot-tile__hint">từ 80% usage trở lên</span>
            </div>
          </div>

          <div class="dialog-section-head mt-5 mb-3">
            <div>
              <div class="eyebrow mb-2">Ưu tiên xử lý</div>
              <h4 class="dialog-section-title">Tổ chức dùng AI nhiều nhất</h4>
            </div>
          </div>

          <div v-if="topAiOrganizations.length" class="priority-list">
            <button
              v-for="org in topAiOrganizations"
              :key="org.id"
              type="button"
              class="priority-item"
              @click="openUpgradeDialog(org)"
            >
              <div>
                <div class="priority-item__name">{{ org.name }}</div>
                <div class="priority-item__meta">
                  {{ formatToken(getAiUsedTokens(org)) }} / {{ formatToken(getAiMaxTokens(org)) }}
                </div>
              </div>
              <v-chip :color="getAiUsageStatus(org).color" variant="tonal" size="small" class="font-weight-bold">
                {{ getAiUsagePercent(org) }}%
              </v-chip>
            </button>
          </div>

          <div v-else class="notice-box notice-box--success mt-4">
            <v-icon color="success" size="18">mdi-check-circle-outline</v-icon>
            <span>Chưa có dữ liệu tiêu thụ AI đáng chú ý trong chu kỳ hiện tại.</span>
          </div>
        </v-card>

        <v-card class="surface-card pa-5 pa-md-6">
          <div class="section-head mb-4">
            <div>
              <div class="eyebrow mb-2">Snapshot</div>
              <h2 class="section-title">Sức khỏe hệ thống</h2>
            </div>
          </div>

          <div class="snapshot-grid">
            <div class="snapshot-tile">
              <span class="snapshot-tile__label">Trung bình thành viên</span>
              <strong class="snapshot-tile__value">{{ averageMembersPerOrg }}</strong>
              <span class="snapshot-tile__hint">mỗi tổ chức</span>
            </div>

            <div class="snapshot-tile">
              <span class="snapshot-tile__label">Gói Free</span>
              <strong class="snapshot-tile__value">{{ freeOrgsCount }}</strong>
              <span class="snapshot-tile__hint">cơ hội chuyển đổi</span>
            </div>

            <div class="snapshot-tile snapshot-tile--wide">
              <span class="snapshot-tile__label">Khuyến nghị vận hành</span>
              <strong class="snapshot-tile__value snapshot-tile__value--text">{{ systemRecommendation }}</strong>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Upgrade Dialog Section -->
    <UpgradeDialog
      v-model="upgradeDialog"
      :selected-org="selectedOrg"
      :plans="plans"
      :loading="submitting"
      :error="dialogError"
      @confirm="handleUpgrade"
    />

    <v-snackbar v-model="successSnackbar" color="success" timeout="3200" rounded="pill">
      {{ successMessage }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { api } from '@/api/index';
import type { 
  Organization, SubscriptionPlan, SortOption, StatusFilter, SummaryCard 
} from './AdminDashboard/types';
import { 
  formatCurrency, formatToken, formatDate, isExpiringSoon, isExpired, daysUntil,
  getPlanName, getPlanColor, getPlanDot, getOwner, getOrgStatus,
  getAiUsedTokens, getAiMaxTokens, getAiRemainingTokens, getAiUsagePercent,
  isAiEnabled, isAiNearLimit, getAiUsageStatus
} from './AdminDashboard/utils';

// Components
import MetricSummary from './AdminDashboard/components/MetricSummary.vue';
import OrgCard from './AdminDashboard/components/OrgCard.vue';
import UpgradeDialog from './AdminDashboard/components/UpgradeDialog.vue';

const planFilterItems = ['Tất cả gói', 'Free', 'Pro', 'Enterprise'];
const statusFilterItems: StatusFilter[] = [
  'Tất cả trạng thái',
  'Sắp hết hạn',
  'Đã hết hạn',
  'Đang trả phí',
  'Free',
  'AI gần hết quota',
];
const sortItems: SortOption[] = [
  'Ưu tiên sắp hết hạn',
  'Mới tạo gần đây',
  'Nhiều thành viên nhất',
  'Dùng AI nhiều nhất',
  'Tên A-Z',
];

const orgs = ref<Organization[]>([]);
const plans = ref<SubscriptionPlan[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const dialogError = ref<string | null>(null);
const submitting = ref(false);
const upgradeDialog = ref(false);
const successSnackbar = ref(false);
const successMessage = ref('');
const selectedOrg = ref<Organization | null>(null);

const searchQuery = ref('');
const filterPlan = ref('Tất cả gói');
const filterStatus = ref<StatusFilter>('Tất cả trạng thái');
const sortBy = ref<SortOption>('Ưu tiên sắp hết hạn');

const freeOrgsCount = computed(() => orgs.value.filter((org) => getPlanName(org) === 'Free').length);
const premiumOrgsCount = computed(() => orgs.value.filter((org) => getPlanName(org) !== 'Free').length);
const totalUsersCount = computed(() => orgs.value.reduce((sum, org) => sum + (org.members?.length || 0), 0));
const newOrgsToday = computed(() => {
  const today = new Date().toDateString();
  return orgs.value.filter((org) => new Date(org.createdAt).toDateString() === today).length;
});

const monthlyRecurringRevenue = computed(() => orgs.value.reduce((sum, org) => sum + (org.subscription?.plan?.priceMonth || 0), 0));
const expiringSoonCount = computed(() => orgs.value.filter((org) => isExpiringSoon(org.subscription?.currentPeriodEnd)).length);
const aiEnabledOrgsCount = computed(() => orgs.value.filter((org) => isAiEnabled(org)).length);
const aiNearLimitCount = computed(() => orgs.value.filter((org) => isAiNearLimit(org)).length);
const totalAiQuota = computed(() => orgs.value.reduce((sum, org) => sum + getAiMaxTokens(org), 0));
const totalAiUsedTokens = computed(() => orgs.value.reduce((sum, org) => sum + getAiUsedTokens(org), 0));
const totalAiRemainingTokens = computed(() => orgs.value.reduce((sum, org) => sum + getAiRemainingTokens(org), 0));

const overallAiUsagePercent = computed(() => {
  if (!totalAiQuota.value) return 0;
  return Math.min(100, Math.round((totalAiUsedTokens.value / totalAiQuota.value) * 100));
});

const averageMembersPerOrg = computed(() => {
  if (!orgs.value.length) return '0';
  const val = totalUsersCount.value / orgs.value.length;
  return val.toFixed(val >= 10 ? 0 : 1);
});

const paidAdoptionRate = computed(() => {
  if (!orgs.value.length) return '0%';
  return `${Math.round((premiumOrgsCount.value / orgs.value.length) * 100)}%`;
});

const latestOrganization = computed(() => {
  return [...orgs.value].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] || null;
});

const summaryCards = computed<SummaryCard[]>(() => [
  {
    label: 'Tổ chức đang quản lý',
    value: orgs.value.length.toString(),
    hint: `${newOrgsToday.value} tổ chức mới được tạo trong ngày`,
    badge: `+${newOrgsToday.value} hôm nay`,
    icon: 'mdi-domain',
    color: 'primary',
    tint: 'primary-lighten-5',
  },
  {
    label: 'Tổ chức trả phí',
    value: premiumOrgsCount.value.toString(),
    hint: `${paidAdoptionRate.value} tổng số tổ chức đã nâng cấp`,
    badge: 'Doanh thu',
    icon: 'mdi-crown-outline',
    color: 'warning',
    tint: 'warning-lighten-5',
  },
  {
    label: 'Người dùng toàn hệ thống',
    value: totalUsersCount.value.toString(),
    hint: `${averageMembersPerOrg.value} thành viên trung bình mỗi tổ chức`,
    badge: 'Seats',
    icon: 'mdi-account-group-outline',
    color: 'info',
    tint: 'info-lighten-5',
  },
  {
    label: 'Gia hạn cần xử lý',
    value: expiringSoonCount.value.toString(),
    hint: expiringSoonCount.value ? 'Các gói dưới 7 ngày nên được rà soát ngay' : 'Hiện chưa có gói nào nằm trong vùng rủi ro',
    badge: expiringSoonCount.value ? 'Cảnh báo' : 'Ổn định',
    icon: 'mdi-timer-sand',
    color: expiringSoonCount.value ? 'warning' : 'success',
    tint: expiringSoonCount.value ? 'warning-lighten-5' : 'success-lighten-5',
  },
]);

const filteredOrgs = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  let result = [...orgs.value];

  if (query) {
    result = result.filter((org) => {
      const owner = getOwner(org);
      return (
        org.name.toLowerCase().includes(query) ||
        org.id.toLowerCase().includes(query) ||
        owner.name.toLowerCase().includes(query) ||
        owner.email.toLowerCase().includes(query)
      );
    });
  }

  if (filterPlan.value !== 'Tất cả gói') {
    result = result.filter((org) => getPlanName(org) === filterPlan.value);
  }

  if (filterStatus.value !== 'Tất cả trạng thái') {
    result = result.filter((org) => {
      if (filterStatus.value === 'Sắp hết hạn') return isExpiringSoon(org.subscription?.currentPeriodEnd);
      if (filterStatus.value === 'Đã hết hạn') return isExpired(org.subscription?.currentPeriodEnd);
      if (filterStatus.value === 'Đang trả phí') return getPlanName(org) !== 'Free';
      if (filterStatus.value === 'Free') return getPlanName(org) === 'Free';
      if (filterStatus.value === 'AI gần hết quota') return isAiNearLimit(org);
      return true;
    });
  }

  return sortOrganizations(result, sortBy.value);
});

const priorityOrganizations = computed(() => {
  return sortOrganizations(
    orgs.value.filter((org) => isExpired(org.subscription?.currentPeriodEnd) || isExpiringSoon(org.subscription?.currentPeriodEnd)),
    'Ưu tiên sắp hết hạn',
  ).slice(0, 5);
});

const topAiOrganizations = computed(() => {
  return sortOrganizations(
    orgs.value.filter((org) => getAiMaxTokens(org) > 0),
    'Dùng AI nhiều nhất',
  ).slice(0, 5);
});

const planBreakdown = computed(() => {
  const allPlans = plans.value.length ? plans.value.map((p) => p.name) : ['Free', 'Pro', 'Enterprise'];
  return allPlans.map((name) => {
    const count = orgs.value.filter((org) => getPlanName(org) === name).length;
    return {
      name,
      count,
      percent: orgs.value.length ? Math.round((count / orgs.value.length) * 100) : 0,
      color: getPlanColor(name),
      dot: getPlanDot(name),
    };
  });
});

const systemRecommendation = computed(() => {
  if (aiNearLimitCount.value > 0) return `Có ${aiNearLimitCount.value} tổ chức đang dùng trên 80% AI quota.`;
  if (expiringSoonCount.value > 0) return `Ưu tiên xử lý ${expiringSoonCount.value} tổ chức sắp hết hạn.`;
  if (freeOrgsCount.value > premiumOrgsCount.value) return 'Tỷ trọng Free còn cao, nên tập trung chuyển đổi.';
  return 'Nhịp tăng trưởng đang ổn định.';
});

const fetchData = async () => {
  loading.value = true;
  error.value = null;
  try {
    const [orgsRes, plansRes] = await Promise.all([
      api.get('/admin/organizations'),
      api.get('/admin/plans'),
    ]);
    orgs.value = orgsRes.data;
    plans.value = plansRes.data;
  } catch (err: any) {
    error.value = 'Không thể tải dữ liệu quản trị.';
  } finally {
    loading.value = false;
  }
};

const resetFilters = () => {
  searchQuery.value = '';
  filterPlan.value = 'Tất cả gói';
  filterStatus.value = 'Tất cả trạng thái';
  sortBy.value = 'Ưu tiên sắp hết hạn';
};

const openUpgradeDialog = (org: Organization) => {
  selectedOrg.value = org;
  upgradeDialog.value = true;
};

const handleUpgrade = async (form: { planId: string; months: number }) => {
  if (!selectedOrg.value) return;
  submitting.value = true;
  dialogError.value = null;
  try {
    await api.post(`/admin/organizations/${selectedOrg.value.id}/subscribe`, form);
    successMessage.value = 'Cập nhật thành công.';
    successSnackbar.value = true;
    upgradeDialog.value = false;
    await fetchData();
  } catch (err) {
    dialogError.value = 'Cập nhật thất bại.';
  } finally {
    submitting.value = false;
  }
};

const getRenewalText = (org: Organization) => {
  if (!org.subscription) return 'Chưa kích hoạt';
  const end = org.subscription.currentPeriodEnd;
  const days = daysUntil(end);
  if (days < 0) return 'Đã hết hạn';
  if (days <= 7) return `${days} ngày nữa`;
  return formatDate(end, 'short');
};

const sortOrganizations = (items: Organization[], option: SortOption) => {
  const sorted = [...items];
  if (option === 'Tên A-Z') return sorted.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  if (option === 'Mới tạo gần đây') return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  if (option === 'Nhiều thành viên nhất') return sorted.sort((a, b) => (b.members?.length || 0) - (a.members?.length || 0));
  if (option === 'Dùng AI nhiều nhất') return sorted.sort((a, b) => getAiUsagePercent(b) - getAiUsagePercent(a));
  return sorted.sort((a, b) => {
    const da = orgs.value.find(o => o.id === a.id)?.subscription?.currentPeriodEnd;
    const db = orgs.value.find(o => o.id === b.id)?.subscription?.currentPeriodEnd;
    return (da ? daysUntil(da) : 999) - (db ? daysUntil(db) : 999);
  });
};

onMounted(fetchData);
</script>

<style scoped>
.admin-page {
  max-width: 1440px;
}

.hero-shell {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(320px, 0.95fr);
  gap: 24px;
  align-items: stretch;
}

.hero-shell__copy {
  border-radius: 28px !important;
  border: 1px solid var(--color-border) !important;
  position: relative;
  overflow: hidden;
  padding: 36px;
  background:
    radial-gradient(circle at top left, rgba(37, 99, 235, 0.14), transparent 34%),
    radial-gradient(circle at bottom right, rgba(124, 58, 237, 0.1), transparent 30%),
    var(--color-surface-elevated);
  box-shadow: var(--shadow-md);
}

.hero-shell__copy::after {
  content: '';
  position: absolute;
  inset: auto -90px -80px auto;
  width: 240px;
  height: 240px;
  border-radius: 50%;
  background: rgba(37, 99, 235, 0.09);
  filter: blur(12px);
  pointer-events: none;
}

.hero-badge, .eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--color-primary-strong);
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.hero-badge {
  padding: 10px 14px;
  background: var(--color-primary-soft);
  border: 1px solid var(--color-primary-soft-strong);
  border-radius: 999px;
}

.hero-title {
  max-width: 760px;
  font-size: clamp(2rem, 3vw, 3.4rem);
  font-weight: 900;
  line-height: 1.02;
  margin: 0;
  color: var(--color-text);
}

.hero-description {
  max-width: 640px;
  color: var(--color-text-secondary);
  font-size: 1rem;
  line-height: 1.75;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.hero-panel {
  border-radius: 28px !important;
  border: 1px solid var(--color-border) !important;
  background: linear-gradient(180deg, var(--color-surface-elevated), var(--color-surface-glass)) !important;
  box-shadow: var(--shadow-md);
}

.hero-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.hero-panel__title {
  color: var(--color-text);
  font-size: 1.35rem;
  font-weight: 800;
}

.hero-metrics {
  display: grid;
  gap: 16px;
}

.hero-metric {
  padding: 18px 20px;
  background: var(--color-overlay);
  border: 1px solid var(--color-border);
  border-radius: 22px;
}

.hero-metric__label {
  display: block;
  color: var(--color-text-secondary);
  font-size: 0.84rem;
  font-weight: 700;
}

.hero-metric__value {
  display: block;
  margin-top: 8px;
  color: var(--color-text);
  font-size: 1.75rem;
  font-weight: 900;
  line-height: 1.1;
}

.hero-metric__hint {
  display: block;
  margin-top: 8px;
  color: var(--color-text-secondary);
  font-size: 0.92rem;
}

.surface-card {
  border-radius: 28px !important;
  border: 1px solid var(--color-border) !important;
  background: var(--color-surface-elevated) !important;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-title {
  font-size: clamp(1.2rem, 2vw, 1.5rem);
  font-weight: 900;
  color: var(--color-text);
}

.filters-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.8fr) repeat(3, minmax(180px, 0.8fr));
  gap: 14px;
}

.org-card-placeholder {
  border-radius: 28px !important;
  border: 1px solid var(--color-border) !important;
  overflow: hidden;
}

.placeholder-line {
  height: 14px;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(148, 163, 184, 0.12), rgba(148, 163, 184, 0.28), rgba(148, 163, 184, 0.12));
  background-size: 200% 100%;
  animation: shimmer 1.4s linear infinite;
}

.placeholder-line--lg {
  width: 60%;
  height: 20px;
}

.placeholder-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.placeholder-line--sm {
  width: 40%;
}

.priority-list {
  display: grid;
  gap: 12px;
}

.priority-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px;
  background: var(--color-overlay);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.priority-item:hover {
  transform: translateY(-1px);
  border-color: var(--color-primary);
}

.priority-item__name {
  color: var(--color-text);
  font-weight: 800;
}

.priority-item__meta {
  color: var(--color-text-secondary);
  font-size: 0.92rem;
}

.notice-box {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-radius: 18px;
  background: var(--color-success-soft);
  color: var(--color-success);
  border: 1px solid var(--color-success-border);
}

.breakdown-row + .breakdown-row {
  margin-top: 18px;
}

.breakdown-row__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.breakdown-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.breakdown-row__name, .breakdown-row__value {
  color: var(--color-text);
  font-weight: 700;
}

.ai-system-card {
  padding: 18px 20px;
  background: linear-gradient(180deg, var(--color-primary-soft), var(--color-overlay));
  border: 1px solid var(--color-border);
  border-radius: 22px;
}

.ai-system-card__value {
  color: var(--color-text);
  font-size: 1.35rem;
  font-weight: 900;
}

.ai-system-card__subtitle {
  color: var(--color-text-secondary);
  font-size: 0.92rem;
}

.snapshot-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.snapshot-tile {
  padding: 18px;
  background: var(--color-overlay);
  border: 1px solid var(--color-border);
  border-radius: 22px;
}

.snapshot-tile--wide {
  grid-column: 1 / -1;
}

.snapshot-tile__label {
  color: var(--color-text-secondary);
  font-size: 0.84rem;
  font-weight: 700;
}

.snapshot-tile__value {
  display: block;
  margin-top: 8px;
  color: var(--color-text);
  font-size: 1.35rem;
  font-weight: 900;
}

.snapshot-tile__value--text {
  font-size: 1rem;
  line-height: 1.6;
}

.empty-card {
  border-radius: 28px !important;
}

.empty-card__title {
  color: var(--color-text);
  font-size: 1.32rem;
  font-weight: 850;
}

.empty-card__body {
  color: var(--color-text-secondary);
  line-height: 1.75;
}

.dialog-section-head {
  margin-top: 20px;
}

.dialog-section-title {
  font-size: 1.1rem;
  font-weight: 900;
}

@keyframes shimmer {
  from { background-position: 200% 0; }
  to { background-position: -200% 0; }
}

@media (max-width: 1360px) {
  .filters-grid { grid-template-columns: 1fr 1fr; }
  .filters-grid__search { grid-column: 1 / -1; }
}

@media (max-width: 1200px) {
  .hero-shell { grid-template-columns: 1fr; }
}

@media (max-width: 760px) {
  .hero-shell__copy, .hero-panel, .surface-card { padding: 22px !important; }
  .section-head, .hero-panel__header { flex-direction: column; align-items: flex-start; }
  .filters-grid, .snapshot-grid, .placeholder-grid { grid-template-columns: 1fr; }
  .hero-title { font-size: 2rem; }
}
</style>
