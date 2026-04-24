<template>
  <v-container class="orders-page py-8 py-md-10">
    <section class="orders-hero mb-8">
      <div class="orders-hero__copy">
        <div class="hero-badge mb-4">
          <v-icon size="18" color="primary">mdi-receipt-text-check-outline</v-icon>
          <span>Payment Approval</span>
        </div>
        <h1 class="hero-title mb-4">Duyệt đơn nâng gói và mua thêm AI Token</h1>
        <p class="hero-description mb-6">
          Tất cả yêu cầu thanh toán thủ công được gom về một nơi để đối soát nội dung chuyển khoản,
          duyệt đơn và áp dụng hiệu lực thật lên subscription hoặc quota AI.
        </p>
        <div class="hero-actions">
          <v-btn color="primary" variant="flat" prepend-icon="mdi-refresh" rounded="xl" class="px-6" :loading="loading" @click="fetchOrders">
            Làm mới danh sách
          </v-btn>
          <v-btn to="/admin" variant="tonal" color="primary" prepend-icon="mdi-view-dashboard-outline" rounded="xl" class="px-6">
            Về tổng quan admin
          </v-btn>
        </div>
      </div>

      <v-card class="hero-panel pa-6 pa-md-7">
        <div class="section-head mb-5">
          <div>
            <div class="eyebrow mb-2">Trạng thái duyệt</div>
            <div class="hero-panel__title">Snapshot theo thời gian thực</div>
          </div>

          <v-chip :color="pendingCount > 0 ? 'warning' : 'success'" variant="tonal" size="small" class="font-weight-bold">
            {{ pendingCount > 0 ? `${pendingCount} đơn chờ xử lý` : 'Không có backlog' }}
          </v-chip>
        </div>

        <div class="hero-metrics">
          <div class="hero-metric">
            <span class="hero-metric__label">Đơn đang chờ</span>
            <strong class="hero-metric__value">{{ pendingCount }}</strong>
            <span class="hero-metric__hint">Cần đối soát trước khi áp dụng</span>
          </div>
          <div class="hero-metric">
            <span class="hero-metric__label">Đã duyệt</span>
            <strong class="hero-metric__value">{{ approvedCount }}</strong>
            <span class="hero-metric__hint">Đã kích hoạt plan hoặc cộng quota</span>
          </div>
          <div class="hero-metric">
            <span class="hero-metric__label">Tổng giá trị</span>
            <strong class="hero-metric__value">{{ formatCurrency(totalOrderAmount) }}</strong>
            <span class="hero-metric__hint">Tính trên toàn bộ đơn đang tải</span>
          </div>
        </div>
      </v-card>
    </section>

    <v-alert
      v-if="error"
      type="error"
      variant="tonal"
      closable
      class="mb-6 rounded-xl"
      @click:close="error = null"
    >
      {{ error }}
    </v-alert>

    <v-row class="mb-6">
      <v-col v-for="item in summaryCards" :key="item.label" cols="12" sm="6" xl="3">
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

    <v-card class="surface-card pa-4 pa-md-6 mb-6">
      <div class="section-head mb-5">
        <div>
          <div class="eyebrow mb-2">Bộ lọc</div>
          <h2 class="section-title">{{ filteredOrders.length }} / {{ orders.length }} đơn đang hiển thị</h2>
        </div>
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
          label="Tìm theo mã đơn, tổ chức, email, nội dung chuyển khoản..."
          class="filters-grid__search"
        />
        <v-select
          v-model="statusFilter"
          :items="statusItems"
          variant="solo-filled"
          flat
          hide-details
          rounded="xl"
          label="Trạng thái"
        />
        <v-select
          v-model="typeFilter"
          :items="typeItems"
          variant="solo-filled"
          flat
          hide-details
          rounded="xl"
          label="Loại đơn"
        />
      </div>
    </v-card>

    <div v-if="loading && !orders.length" class="order-list">
      <v-card v-for="index in 3" :key="index" class="order-card pa-5 mb-4">
        <div class="placeholder-line placeholder-line--lg mb-4"></div>
        <div class="placeholder-grid mb-4">
          <div class="placeholder-line"></div>
          <div class="placeholder-line"></div>
          <div class="placeholder-line"></div>
        </div>
        <div class="placeholder-line placeholder-line--sm"></div>
      </v-card>
    </div>

    <div v-else-if="filteredOrders.length" class="order-list">
      <v-card v-for="order in filteredOrders" :key="order.id" class="order-card pa-5 pa-md-6 mb-4">
        <div class="order-card__header">
          <div class="order-card__identity">
            <div class="order-card__identity-copy">
              <div class="order-card__title-row">
                <h3 class="order-card__name">{{ order.org.name }}</h3>
                <v-chip :color="getOrderTypeMeta(order.orderType).color" variant="tonal" size="small" class="font-weight-bold">
                  <v-icon start size="14">{{ getOrderTypeMeta(order.orderType).icon }}</v-icon>
                  {{ getOrderTypeMeta(order.orderType).label }}
                </v-chip>
                <v-chip :color="getStatusMeta(order.status).color" variant="tonal" size="small" class="font-weight-bold">
                  <v-icon start size="14">{{ getStatusMeta(order.status).icon }}</v-icon>
                  {{ getStatusMeta(order.status).label }}
                </v-chip>
              </div>
              <div class="order-card__subtitle">
                <span>{{ order.referenceCode }}</span>
                <span>Tạo {{ formatDateTime(order.createdAt) }}</span>
                <span>{{ order.requestedByEmail || 'Không rõ email' }}</span>
              </div>
            </div>
          </div>

          <div class="order-card__amount">
            <span class="order-card__amount-label">Giá trị</span>
            <strong class="order-card__amount-value">{{ formatCurrency(order.amount) }}</strong>
          </div>
        </div>

        <div class="order-meta-grid my-5">
          <div class="meta-tile">
            <span class="meta-tile__label">Mục tiêu áp dụng</span>
            <strong class="meta-tile__value">{{ getOrderTarget(order) }}</strong>
            <span class="meta-tile__hint">{{ getOrderEffect(order) }}</span>
          </div>
          <div class="meta-tile">
            <span class="meta-tile__label">Nội dung CK</span>
            <strong class="meta-tile__value">{{ order.paymentContent || 'Chưa có' }}</strong>
            <span class="meta-tile__hint">Dùng để đối soát với giao dịch ngân hàng</span>
          </div>
          <div class="meta-tile">
            <span class="meta-tile__label">Người tạo đơn</span>
            <strong class="meta-tile__value">{{ order.requestedByEmail || 'Không xác định' }}</strong>
            <span class="meta-tile__hint">ID {{ order.requestedByUserId || 'N/A' }}</span>
          </div>
          <div class="meta-tile">
            <span class="meta-tile__label">Người duyệt</span>
            <strong class="meta-tile__value">{{ order.reviewedByEmail || 'Chưa duyệt' }}</strong>
            <span class="meta-tile__hint">{{ order.reviewedAt ? formatDateTime(order.reviewedAt) : 'Đang chờ xử lý' }}</span>
          </div>
        </div>

        <div v-if="order.adminNote || order.customerNote" class="note-grid mb-5">
          <div v-if="order.customerNote" class="note-box">
            <div class="eyebrow mb-2">Ghi chú khách</div>
            <div>{{ order.customerNote }}</div>
          </div>
          <div v-if="order.adminNote" class="note-box">
            <div class="eyebrow mb-2">Ghi chú admin</div>
            <div>{{ order.adminNote }}</div>
          </div>
        </div>

        <div class="order-card__footer">
          <div class="order-card__footnote">
            <v-icon size="16" color="primary">mdi-information-outline</v-icon>
            <span>{{ getOrderFootnote(order) }}</span>
          </div>

          <div class="order-card__actions">
            <v-btn
              v-if="order.status === 'pending'"
              color="success"
              variant="flat"
              rounded="xl"
              prepend-icon="mdi-check-bold"
              class="px-5"
              @click="openReviewDialog(order, 'approve')"
            >
              Duyệt đơn
            </v-btn>
            <v-btn
              v-if="order.status === 'pending'"
              color="error"
              variant="tonal"
              rounded="xl"
              prepend-icon="mdi-close-thick"
              class="px-5"
              @click="openReviewDialog(order, 'reject')"
            >
              Từ chối
            </v-btn>
            <v-btn
              v-if="order.status !== 'pending'"
              to="/admin"
              variant="text"
              rounded="xl"
              prepend-icon="mdi-open-in-new"
            >
              Mở admin dashboard
            </v-btn>
          </div>
        </div>
      </v-card>
    </div>

    <v-card v-else class="surface-card empty-card pa-8 text-center">
      <v-avatar size="72" color="primary-lighten-5" class="mx-auto mb-4">
        <v-icon size="34" color="primary">mdi-receipt-text-remove-outline</v-icon>
      </v-avatar>
      <h3 class="empty-card__title mb-2">Không có đơn phù hợp</h3>
      <p class="empty-card__body mb-5">
        Hãy đổi bộ lọc hoặc thử tìm theo mã đơn, tổ chức hoặc nội dung chuyển khoản.
      </p>
      <v-btn color="primary" variant="flat" rounded="xl" @click="resetFilters">
        Đặt lại bộ lọc
      </v-btn>
    </v-card>

    <v-dialog v-model="reviewDialog" max-width="560">
      <v-card class="review-dialog">
        <div class="review-dialog__hero pa-6">
          <div>
            <div class="eyebrow eyebrow--light mb-2">{{ reviewAction === 'approve' ? 'Phê duyệt' : 'Từ chối' }}</div>
            <h3 class="review-dialog__title mb-2">
              {{ selectedOrder?.referenceCode || 'Chọn đơn' }}
            </h3>
            <p class="review-dialog__subtitle">
              {{ selectedOrder ? `${selectedOrder.org.name} • ${getOrderTarget(selectedOrder)}` : 'Không có đơn được chọn' }}
            </p>
          </div>
        </div>

        <div class="pa-6">
          <v-alert v-if="reviewError" type="error" variant="tonal" class="mb-4 rounded-xl">
            {{ reviewError }}
          </v-alert>

          <v-textarea
            v-model="reviewNote"
            label="Ghi chú admin"
            variant="outlined"
            rows="4"
            auto-grow
            rounded="xl"
            placeholder="Ví dụ: Đã xác nhận giao dịch MB Bank lúc 14:32..."
          />

          <div class="d-flex ga-3 mt-5">
            <v-btn
              :color="reviewAction === 'approve' ? 'success' : 'error'"
              variant="flat"
              rounded="xl"
              class="px-6"
              :loading="reviewSubmitting"
              @click="submitReview"
            >
              {{ reviewAction === 'approve' ? 'Xác nhận duyệt' : 'Xác nhận từ chối' }}
            </v-btn>
            <v-btn variant="text" rounded="xl" @click="reviewDialog = false">
              Đóng
            </v-btn>
          </div>
        </div>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="3200" rounded="pill">
      {{ snackbarMessage }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { api } from '@/api/index';

type OrderStatus = 'all' | 'pending' | 'approved' | 'rejected';
type OrderType = 'all' | 'subscription_upgrade' | 'ai_topup';
type ReviewAction = 'approve' | 'reject';

interface PaymentOrder {
  id: string;
  orgId: string;
  orderType: Exclude<OrderType, 'all'>;
  status: Exclude<OrderStatus, 'all'>;
  requestedByUserId?: string | null;
  requestedByEmail?: string | null;
  reviewedByUserId?: string | null;
  reviewedByEmail?: string | null;
  planId?: string | null;
  planName?: string | null;
  months?: number | null;
  tokenAmount?: number | null;
  amount: number;
  currency: string;
  paymentContent?: string | null;
  customerNote?: string | null;
  adminNote?: string | null;
  approvedAt?: string | null;
  reviewedAt?: string | null;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  referenceCode: string;
  createdAt: string;
  org: {
    id: string;
    name: string;
  };
}

const statusItems = [
  { title: 'Tất cả trạng thái', value: 'all' },
  { title: 'Chờ duyệt', value: 'pending' },
  { title: 'Đã duyệt', value: 'approved' },
  { title: 'Từ chối', value: 'rejected' },
];

const typeItems = [
  { title: 'Tất cả loại đơn', value: 'all' },
  { title: 'Nâng cấp gói', value: 'subscription_upgrade' },
  { title: 'Mua thêm AI Token', value: 'ai_topup' },
];

const orders = ref<PaymentOrder[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const searchQuery = ref('');
const statusFilter = ref<OrderStatus>('all');
const typeFilter = ref<OrderType>('all');

const reviewDialog = ref(false);
const reviewSubmitting = ref(false);
const reviewError = ref<string | null>(null);
const reviewAction = ref<ReviewAction>('approve');
const reviewNote = ref('');
const selectedOrder = ref<PaymentOrder | null>(null);

const snackbar = ref(false);
const snackbarColor = ref<'success' | 'error'>('success');
const snackbarMessage = ref('');

const filteredOrders = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  return orders.value.filter((order) => {
    const matchesStatus = statusFilter.value === 'all' || order.status === statusFilter.value;
    const matchesType = typeFilter.value === 'all' || order.orderType === typeFilter.value;
    const matchesSearch = !query || [
      order.referenceCode,
      order.org.name,
      order.requestedByEmail || '',
      order.paymentContent || '',
      order.planName || '',
      getOrderTarget(order),
    ].some((value) => value.toLowerCase().includes(query));

    return matchesStatus && matchesType && matchesSearch;
  });
});

const pendingCount = computed(() => orders.value.filter((order) => order.status === 'pending').length);
const approvedCount = computed(() => orders.value.filter((order) => order.status === 'approved').length);
const rejectedCount = computed(() => orders.value.filter((order) => order.status === 'rejected').length);
const topupCount = computed(() => orders.value.filter((order) => order.orderType === 'ai_topup').length);
const totalOrderAmount = computed(() => orders.value.reduce((sum, order) => sum + order.amount, 0));

const summaryCards = computed(() => {
  return [
    {
      label: 'Đơn chờ duyệt',
      value: pendingCount.value.toString(),
      hint: pendingCount.value ? 'Nên ưu tiên đối soát trước khi kích hoạt' : 'Hiện không có đơn tồn',
      badge: 'Backlog',
      icon: 'mdi-timer-sand',
      color: 'warning',
      tint: 'warning-lighten-5',
    },
    {
      label: 'Đơn đã duyệt',
      value: approvedCount.value.toString(),
      hint: 'Đã áp dụng hiệu lực lên hệ thống',
      badge: 'Approved',
      icon: 'mdi-check-decagram-outline',
      color: 'success',
      tint: 'success-lighten-5',
    },
    {
      label: 'Mua thêm AI Token',
      value: topupCount.value.toString(),
      hint: 'Bao gồm toàn bộ đơn top-up AI',
      badge: 'Top-up',
      icon: 'mdi-lightning-bolt-outline',
      color: 'primary',
      tint: 'primary-lighten-5',
    },
    {
      label: 'Đơn bị từ chối',
      value: rejectedCount.value.toString(),
      hint: 'Cần theo dõi lại giao dịch hoặc liên hệ khách',
      badge: 'Rejected',
      icon: 'mdi-close-octagon-outline',
      color: 'error',
      tint: 'error-lighten-5',
    },
  ];
});

watch(reviewDialog, (isOpen) => {
  if (!isOpen) {
    reviewError.value = null;
    reviewSubmitting.value = false;
  }
});

async function fetchOrders() {
  loading.value = true;
  error.value = null;

  try {
    const res = await api.get('/admin/orders');
    orders.value = res.data;
  } catch (err: any) {
    console.error('Failed to load payment orders', err);
    if (err.response?.status === 403) {
      error.value = 'Bạn không có quyền truy cập trang này. Nếu bạn vừa được cấp quyền Admin, hãy Đăng xuất và Đăng nhập lại để cập nhật phiên làm việc.';
    } else {
      error.value = 'Không thể tải danh sách đơn thanh toán. Lỗi: ' + (err.response?.data?.error || err.message);
    }
  } finally {
    loading.value = false;
  }
}

function resetFilters() {
  searchQuery.value = '';
  statusFilter.value = 'all';
  typeFilter.value = 'all';
}

function openReviewDialog(order: PaymentOrder, action: ReviewAction) {
  selectedOrder.value = order;
  reviewAction.value = action;
  reviewNote.value = order.adminNote || '';
  reviewError.value = null;
  reviewDialog.value = true;
}

async function submitReview() {
  if (!selectedOrder.value) return;

  reviewSubmitting.value = true;
  reviewError.value = null;

  try {
    await api.post(
      `/admin/orders/${selectedOrder.value.id}/${reviewAction.value}`,
      { adminNote: reviewNote.value.trim() || undefined },
    );

    reviewDialog.value = false;
    snackbarColor.value = 'success';
    snackbarMessage.value = reviewAction.value === 'approve'
      ? `Đã duyệt đơn ${selectedOrder.value.referenceCode}.`
      : `Đã từ chối đơn ${selectedOrder.value.referenceCode}.`;
    snackbar.value = true;
    await fetchOrders();
  } catch (err: any) {
    console.error('Review order failed', err);
    reviewError.value = err.response?.data?.error || 'Không thể cập nhật trạng thái đơn.';
  } finally {
    reviewSubmitting.value = false;
  }
}

function getOrderTypeMeta(type: PaymentOrder['orderType']) {
  if (type === 'subscription_upgrade') {
    return { label: 'Nâng cấp gói', color: 'primary', icon: 'mdi-crown-outline' };
  }

  return { label: 'Top-up AI Token', color: 'info', icon: 'mdi-lightning-bolt-outline' };
}

function getStatusMeta(status: PaymentOrder['status']) {
  if (status === 'approved') {
    return { label: 'Đã duyệt', color: 'success', icon: 'mdi-check-bold' };
  }

  if (status === 'rejected') {
    return { label: 'Từ chối', color: 'error', icon: 'mdi-close-thick' };
  }

  return { label: 'Chờ duyệt', color: 'warning', icon: 'mdi-clock-outline' };
}

function getOrderTarget(order: PaymentOrder) {
  if (order.orderType === 'subscription_upgrade') {
    return order.planName || 'Gói không xác định';
  }

  return `${formatToken(order.tokenAmount || 0)} AI Token`;
}

function getOrderEffect(order: PaymentOrder) {
  if (order.orderType === 'subscription_upgrade') {
    return `${order.months || 1} tháng sử dụng sau khi duyệt`;
  }

  return 'Quota AI được cộng vào chu kỳ hiện tại';
}

function getOrderFootnote(order: PaymentOrder) {
  if (order.status === 'pending') {
    return 'Sau khi duyệt, hệ thống sẽ áp dụng hiệu lực ngay mà không cần thao tác tay thêm lần nữa.';
  }

  if (order.status === 'approved') {
    return order.orderType === 'subscription_upgrade'
      ? `Hiệu lực áp dụng từ ${formatDateTime(order.effectiveFrom)} đến ${formatDateTime(order.effectiveTo)}.`
      : `Top-up AI có hiệu lực tới ${formatDateTime(order.effectiveTo)}.`;
  }

  return 'Đơn đã bị từ chối và không tạo thay đổi lên subscription hoặc AI quota.';
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatToken(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
  return `${value}`;
}

function formatDateTime(date: string | null | undefined) {
  if (!date) return '—';
  const parsed = new Date(date);
  return `${parsed.toLocaleDateString('vi-VN')} ${parsed.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
}

onMounted(fetchOrders);
</script>

<style scoped>
.orders-page {
  max-width: 1440px;
}

.orders-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(320px, 0.96fr);
  gap: 24px;
  align-items: stretch;
}

.orders-hero__copy,
.hero-panel,
.surface-card,
.summary-card,
.order-card,
.review-dialog {
  border-radius: 28px !important;
  border: 1px solid var(--color-border) !important;
}

.orders-hero__copy {
  position: relative;
  overflow: hidden;
  padding: 36px;
  background:
    radial-gradient(circle at top left, rgba(37, 99, 235, 0.14), transparent 34%),
    radial-gradient(circle at bottom right, rgba(16, 185, 129, 0.12), transparent 32%),
    var(--color-surface-elevated);
  box-shadow: var(--shadow-md);
}

.orders-hero__copy::after {
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

.hero-badge,
.eyebrow {
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

.eyebrow--light {
  color: rgba(255, 255, 255, 0.76);
}

.hero-title,
.section-title,
.review-dialog__title {
  margin: 0;
  color: var(--color-text);
  font-weight: 900;
  letter-spacing: -0.03em;
}

.hero-title {
  max-width: 760px;
  font-size: clamp(2rem, 3vw, 3.2rem);
  line-height: 1.02;
}

.hero-description,
.empty-card__body,
.review-dialog__subtitle {
  max-width: 640px;
  color: var(--color-text-secondary);
  font-size: 1rem;
  line-height: 1.75;
}

.hero-actions,
.order-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.hero-panel,
.summary-card,
.surface-card,
.order-card {
  background: var(--color-surface-elevated) !important;
  box-shadow: var(--shadow-sm);
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

.hero-metric,
.meta-tile,
.note-box {
  padding: 18px 20px;
  background: var(--color-overlay);
  border: 1px solid var(--color-border);
  border-radius: 22px;
}

.hero-metric__label,
.summary-card__label,
.meta-tile__label {
  display: block;
  color: var(--color-text-secondary);
  font-size: 0.84rem;
  font-weight: 700;
}

.hero-metric__value,
.summary-card__value,
.meta-tile__value,
.order-card__amount-value {
  display: block;
  margin-top: 8px;
  color: var(--color-text);
  font-size: 1.75rem;
  font-weight: 900;
  line-height: 1.1;
}

.hero-metric__hint,
.summary-card__hint,
.meta-tile__hint,
.order-card__subtitle {
  display: block;
  margin-top: 8px;
  color: var(--color-text-secondary);
  font-size: 0.92rem;
  line-height: 1.5;
}

.section-head,
.summary-card__top,
.order-card__header,
.order-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.section-title {
  font-size: clamp(1.2rem, 2vw, 1.5rem);
}

.filters-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.8fr) repeat(2, minmax(180px, 0.8fr));
  gap: 14px;
}

.filters-grid__search {
  grid-column: span 1;
}

.order-card__identity {
  min-width: 0;
}

.order-card__identity-copy {
  min-width: 0;
}

.order-card__title-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.order-card__name {
  margin: 0;
  color: var(--color-text);
  font-size: 1.3rem;
  font-weight: 850;
}

.order-card__subtitle {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 10px;
}

.order-card__amount {
  min-width: 180px;
  text-align: right;
}

.order-card__amount-label {
  display: block;
  color: var(--color-text-secondary);
  font-size: 0.8rem;
  font-weight: 700;
}

.order-meta-grid,
.note-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.note-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.order-card__footnote {
  display: inline-flex;
  align-items: flex-start;
  gap: 8px;
  max-width: 680px;
  color: var(--color-text-secondary);
  font-size: 0.95rem;
  line-height: 1.6;
}

.empty-card__title {
  margin: 0;
  color: var(--color-text);
  font-size: 1.32rem;
  font-weight: 850;
}

.review-dialog {
  overflow: hidden;
}

.review-dialog__hero {
  background: linear-gradient(135deg, #0f172a, #13203b 58%, #2563eb);
  color: #fff;
}

.review-dialog__title {
  color: #fff;
  font-size: 1.6rem;
}

.placeholder-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.placeholder-line {
  height: 14px;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(148, 163, 184, 0.12), rgba(148, 163, 184, 0.28), rgba(148, 163, 184, 0.12));
  background-size: 200% 100%;
  animation: shimmer 1.4s linear infinite;
}

.placeholder-line--lg {
  width: min(320px, 60%);
  height: 20px;
}

.placeholder-line--sm {
  width: 40%;
}

@keyframes shimmer {
  from {
    background-position: 200% 0;
  }

  to {
    background-position: -200% 0;
  }
}

@media (max-width: 1360px) {
  .filters-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .filters-grid__search {
    grid-column: 1 / -1;
  }

  .order-meta-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 1200px) {
  .orders-hero {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .orders-page {
    padding-left: 8px;
    padding-right: 8px;
  }

  .orders-hero__copy,
  .hero-panel,
  .surface-card,
  .summary-card,
  .order-card {
    padding: 22px !important;
  }

  .section-head,
  .summary-card__top,
  .order-card__header,
  .order-card__footer {
    flex-direction: column;
    align-items: flex-start;
  }

  .filters-grid,
  .order-meta-grid,
  .note-grid,
  .placeholder-grid {
    grid-template-columns: 1fr;
  }

  .order-card__amount {
    min-width: 0;
    text-align: left;
  }
}
</style>
