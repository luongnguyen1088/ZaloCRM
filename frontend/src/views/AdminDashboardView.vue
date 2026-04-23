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
          nhanh hơn cho toàn bộ hệ thống ZaloCRM.
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
          <v-card v-for="index in 3" :key="index" class="org-card org-card--placeholder pa-5 mb-4">
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
          <v-card
            v-for="org in filteredOrgs"
            :key="org.id"
            class="org-card pa-5 pa-md-6 mb-4"
          >
            <div class="org-card__header">
              <div class="org-card__identity">
                <v-avatar size="52" rounded="xl" :color="getPlanTint(getPlanName(org))">
                  <span class="org-card__initial">{{ getOrgInitial(org.name) }}</span>
                </v-avatar>

                <div class="org-card__identity-copy">
                  <div class="org-card__title-row">
                    <h3 class="org-card__name">{{ org.name }}</h3>
                    <v-chip
                      :color="getPlanColor(getPlanName(org))"
                      variant="tonal"
                      size="small"
                      class="font-weight-bold"
                    >
                      {{ getPlanName(org) }}
                    </v-chip>
                    <v-chip
                      :color="getOrgStatus(org).color"
                      variant="tonal"
                      size="small"
                      class="font-weight-bold"
                    >
                      <v-icon start size="14">{{ getOrgStatus(org).icon }}</v-icon>
                      {{ getOrgStatus(org).label }}
                    </v-chip>
                  </div>

                  <div class="org-card__subtitle">
                    <span>ID {{ org.id }}</span>
                    <span>Tạo {{ formatDate(org.createdAt, 'short') }}</span>
                  </div>
                </div>
              </div>

              <div class="org-card__actions">
                <v-btn
                  color="primary"
                  variant="flat"
                  prepend-icon="mdi-rocket-launch-outline"
                  rounded="xl"
                  class="px-5"
                  @click="openUpgradeDialog(org)"
                >
                  Kích hoạt gói
                </v-btn>
              </div>
            </div>

            <div class="org-meta-grid my-5">
              <div class="meta-tile">
                <span class="meta-tile__label">Người phụ trách</span>
                <strong class="meta-tile__value">{{ getOwner(org).name }}</strong>
                <span class="meta-tile__hint">{{ getOwner(org).email }}</span>
              </div>

              <div class="meta-tile">
                <span class="meta-tile__label">Thành viên</span>
                <strong class="meta-tile__value">{{ org.members?.length || 0 }}</strong>
                <span class="meta-tile__hint">{{ getMemberSummary(org) }}</span>
              </div>

              <div class="meta-tile">
                <span class="meta-tile__label">Gia hạn</span>
                <strong class="meta-tile__value">{{ getRenewalText(org) }}</strong>
                <span class="meta-tile__hint">{{ getRenewalHint(org) }}</span>
              </div>

              <div class="meta-tile">
                <span class="meta-tile__label">Giá trị tháng</span>
                <strong class="meta-tile__value">{{ formatCurrency(getMonthlyValue(org)) }}</strong>
                <span class="meta-tile__hint">{{ getPlanSummary(org) }}</span>
              </div>
            </div>

            <div class="ai-insight-card mb-5">
              <div class="ai-insight-card__head">
                <div>
                  <div class="eyebrow mb-2">AI Token</div>
                  <div class="ai-insight-card__title">{{ formatToken(getAiRemainingTokens(org)) }} còn lại</div>
                  <div class="ai-insight-card__subtitle">
                    Đã dùng {{ formatToken(getAiUsedTokens(org)) }} / {{ formatToken(getAiMaxTokens(org)) }} trong chu kỳ hiện tại
                  </div>
                </div>

                <div class="ai-insight-card__chips">
                  <v-chip
                    :color="getAiUsageStatus(org).color"
                    variant="tonal"
                    size="small"
                    class="font-weight-bold"
                  >
                    <v-icon start size="14">{{ getAiUsageStatus(org).icon }}</v-icon>
                    {{ getAiUsageStatus(org).label }}
                  </v-chip>
                  <v-chip
                    :color="isAiEnabled(org) ? 'success' : 'secondary'"
                    variant="flat"
                    size="small"
                    class="font-weight-bold"
                  >
                    {{ isAiEnabled(org) ? 'AI bật' : 'AI tắt' }}
                  </v-chip>
                </div>
              </div>

              <v-progress-linear
                :model-value="getAiUsagePercent(org)"
                :color="getAiUsageStatus(org).color"
                bg-color="rgba(148, 163, 184, 0.18)"
                rounded
                height="10"
                class="my-4"
              />

              <div class="ai-insight-card__grid">
                <div class="ai-mini-stat">
                  <span class="ai-mini-stat__label">Sử dụng</span>
                  <strong class="ai-mini-stat__value">{{ getAiUsagePercent(org) }}%</strong>
                </div>
                <div class="ai-mini-stat">
                  <span class="ai-mini-stat__label">Kế hoạch</span>
                  <strong class="ai-mini-stat__value">{{ getAiPlanName(org) }}</strong>
                </div>
                <div class="ai-mini-stat">
                  <span class="ai-mini-stat__label">Chu kỳ</span>
                  <strong class="ai-mini-stat__value">{{ formatDate(getAiPeriodEnd(org), 'short') }}</strong>
                </div>
              </div>

              <div class="ai-insight-card__note">
                <v-icon size="16" color="primary">mdi-robot-outline</v-icon>
                <span>{{ getAiRecommendation(org) }}</span>
              </div>
            </div>

            <div class="org-card__footer">
              <div class="org-card__footnote">
                <v-icon size="16" color="primary">mdi-information-outline</v-icon>
                <span>{{ getRecommendation(org) }}</span>
              </div>

              <div class="org-card__tags">
                <v-chip size="small" variant="flat" class="tag-chip">
                  {{ org.subscription ? 'Đã có subscription' : 'Chưa kích hoạt' }}
                </v-chip>
                <v-chip v-if="isExpiringSoon(org.subscription?.currentPeriodEnd)" size="small" color="warning" variant="tonal">
                  Cần gia hạn sớm
                </v-chip>
              </div>
            </div>
          </v-card>
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

    <v-dialog v-model="upgradeDialog" max-width="920">
      <v-card class="upgrade-dialog">
        <div class="upgrade-dialog__hero pa-6 pa-md-7">
          <div class="upgrade-dialog__hero-copy">
            <div class="eyebrow eyebrow--light mb-2">Kích hoạt thuê bao</div>
            <h3 class="upgrade-dialog__title mb-2">
              {{ selectedOrg?.name || 'Chọn tổ chức' }}
            </h3>
            <p class="upgrade-dialog__subtitle">
              Thay đổi gói cước và cập nhật thời hạn sử dụng ngay lập tức cho tổ chức được chọn.
            </p>
          </div>

          <div v-if="selectedOrg" class="upgrade-dialog__hero-meta">
            <div class="upgrade-stat">
              <span class="upgrade-stat__label">Gói hiện tại</span>
              <strong class="upgrade-stat__value">{{ getPlanName(selectedOrg) }}</strong>
            </div>
            <div class="upgrade-stat">
              <span class="upgrade-stat__label">Gia hạn hiện tại</span>
              <strong class="upgrade-stat__value">{{ getRenewalText(selectedOrg) }}</strong>
            </div>
          </div>
        </div>

        <div class="pa-6 pa-md-7">
          <v-alert
            v-if="dialogError"
            type="error"
            variant="tonal"
            class="mb-5 rounded-xl"
          >
            {{ dialogError }}
          </v-alert>

          <div class="upgrade-layout">
            <div>
              <div class="dialog-section-head mb-4">
                <div class="eyebrow mb-2">Bước 1</div>
                <h4 class="dialog-section-title">Chọn gói cước áp dụng</h4>
              </div>

              <div class="plan-grid">
                <button
                  v-for="plan in plans"
                  :key="plan.id"
                  type="button"
                  :class="['plan-option', { 'plan-option--active': upgradeForm.planId === plan.id }]"
                  @click="upgradeForm.planId = plan.id"
                >
                  <div class="plan-option__top">
                    <v-chip :color="getPlanColor(plan.name)" variant="tonal" size="small" class="font-weight-bold">
                      {{ plan.name }}
                    </v-chip>
                    <v-icon v-if="upgradeForm.planId === plan.id" color="primary" size="20">
                      mdi-check-circle
                    </v-icon>
                  </div>

                  <strong class="plan-option__price">{{ formatCurrency(plan.priceMonth) }}</strong>
                  <span class="plan-option__hint">{{ getPlanCapacity(plan) }}</span>
                  <span class="plan-option__hint">{{ getTopFeature(plan) }}</span>
                </button>
              </div>

              <div class="dialog-section-head mt-7 mb-4">
                <div class="eyebrow mb-2">Bước 2</div>
                <h4 class="dialog-section-title">Chọn thời gian gia hạn</h4>
              </div>

              <div class="duration-grid">
                <button
                  v-for="option in durationOptions"
                  :key="option.value"
                  type="button"
                  :class="['duration-option', { 'duration-option--active': upgradeForm.months === option.value }]"
                  @click="upgradeForm.months = option.value"
                >
                  <strong>{{ option.label }}</strong>
                  <span>{{ option.hint }}</span>
                </button>
              </div>
            </div>

            <v-card class="upgrade-summary pa-5 pa-md-6" rounded="xl">
              <div class="eyebrow mb-2">Tóm tắt cập nhật</div>
              <h4 class="dialog-section-title mb-5">Subscription preview</h4>

              <div class="summary-stack">
                <div class="summary-row">
                  <span>Tổ chức</span>
                  <strong>{{ selectedOrg?.name || '—' }}</strong>
                </div>
                <div class="summary-row">
                  <span>Gói mới</span>
                  <strong>{{ selectedPlan?.name || '—' }}</strong>
                </div>
                <div class="summary-row">
                  <span>Giá trị tháng</span>
                  <strong>{{ formatCurrency(selectedPlan?.priceMonth || 0) }}</strong>
                </div>
                <div class="summary-row">
                  <span>Gia hạn thêm</span>
                  <strong>{{ upgradeForm.months }} tháng</strong>
                </div>
                <div class="summary-row">
                  <span>Ngày hết hạn mới</span>
                  <strong>{{ previewExpiryDate }}</strong>
                </div>
              </div>

              <div v-if="selectedPlan" class="summary-callout mt-5">
                <v-icon size="18" color="primary">mdi-sparkles</v-icon>
                <span>{{ getPlanCapacity(selectedPlan) }} • {{ getTopFeature(selectedPlan) }}</span>
              </div>

              <v-btn
                block
                size="large"
                color="primary"
                variant="flat"
                rounded="xl"
                class="mt-6"
                :loading="submitting"
                :disabled="!selectedOrg || !upgradeForm.planId"
                @click="handleUpgrade"
              >
                Xác nhận kích hoạt
              </v-btn>

              <v-btn
                block
                variant="text"
                rounded="xl"
                class="mt-3"
                @click="upgradeDialog = false"
              >
                Đóng
              </v-btn>
            </v-card>
          </div>
        </div>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="successSnackbar" color="success" timeout="3200" rounded="pill">
      {{ successMessage }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { api } from '@/api/index';

type SortOption = 'Ưu tiên sắp hết hạn' | 'Mới tạo gần đây' | 'Nhiều thành viên nhất' | 'Dùng AI nhiều nhất' | 'Tên A-Z';
type StatusFilter = 'Tất cả trạng thái' | 'Sắp hết hạn' | 'Đã hết hạn' | 'Đang trả phí' | 'Free' | 'AI gần hết quota';

interface SubscriptionPlan {
  id: string;
  name: string;
  priceMonth: number;
  maxZaloAcc?: number;
  maxAiTokens?: number;
  features?: string | string[];
}

interface OrganizationMember {
  user?: {
    email?: string;
    fullName?: string;
  };
}

interface Subscription {
  planId: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  status?: string;
  plan: SubscriptionPlan;
}

interface AiOverview {
  enabled: boolean;
  planName: string;
  periodStart: string;
  periodEnd: string;
  maxTokens: number;
  usedTokens: number;
  remainingTokens: number;
  usagePercent: number;
}

interface Organization {
  id: string;
  name: string;
  createdAt: string;
  members?: OrganizationMember[];
  subscription?: Subscription | null;
  ai?: AiOverview | null;
}

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
const durationOptions = [
  { value: 1, label: '1 tháng', hint: 'Kích hoạt nhanh' },
  { value: 3, label: '3 tháng', hint: 'Chu kỳ ngắn' },
  { value: 6, label: '6 tháng', hint: 'Ổn định hơn' },
  { value: 12, label: '12 tháng', hint: 'Giảm tần suất gia hạn' },
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

const upgradeForm = ref({
  planId: '',
  months: 1,
});

const selectedPlan = computed(() => {
  return plans.value.find((plan) => plan.id === upgradeForm.value.planId) || null;
});

const freeOrgsCount = computed(() => {
  return orgs.value.filter((org) => getPlanName(org) === 'Free').length;
});

const premiumOrgsCount = computed(() => {
  return orgs.value.filter((org) => getPlanName(org) !== 'Free').length;
});

const totalUsersCount = computed(() => {
  return orgs.value.reduce((sum, org) => sum + (org.members?.length || 0), 0);
});

const newOrgsToday = computed(() => {
  const today = new Date();
  return orgs.value.filter((org) => isSameDate(org.createdAt, today)).length;
});

const monthlyRecurringRevenue = computed(() => {
  return orgs.value.reduce((sum, org) => sum + getMonthlyValue(org), 0);
});

const expiringSoonCount = computed(() => {
  return orgs.value.filter((org) => isExpiringSoon(org.subscription?.currentPeriodEnd)).length;
});

const aiEnabledOrgsCount = computed(() => {
  return orgs.value.filter((org) => isAiEnabled(org)).length;
});

const aiNearLimitCount = computed(() => {
  return orgs.value.filter((org) => isAiNearLimit(org)).length;
});

const totalAiQuota = computed(() => {
  return orgs.value.reduce((sum, org) => sum + getAiMaxTokens(org), 0);
});

const totalAiUsedTokens = computed(() => {
  return orgs.value.reduce((sum, org) => sum + getAiUsedTokens(org), 0);
});

const totalAiRemainingTokens = computed(() => {
  return orgs.value.reduce((sum, org) => sum + getAiRemainingTokens(org), 0);
});

const overallAiUsagePercent = computed(() => {
  if (!totalAiQuota.value) return 0;
  return Math.min(100, Math.round((totalAiUsedTokens.value / totalAiQuota.value) * 100));
});

const averageMembersPerOrg = computed(() => {
  if (!orgs.value.length) return '0';
  return (totalUsersCount.value / orgs.value.length).toFixed(totalUsersCount.value / orgs.value.length >= 10 ? 0 : 1);
});

const paidAdoptionRate = computed(() => {
  if (!orgs.value.length) return '0%';
  return `${Math.round((premiumOrgsCount.value / orgs.value.length) * 100)}%`;
});

const latestOrganization = computed(() => {
  return [...orgs.value].sort((a, b) => toTime(b.createdAt) - toTime(a.createdAt))[0] || null;
});

const summaryCards = computed(() => {
  return [
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
      hint: expiringSoonCount.value
        ? 'Các gói dưới 7 ngày nên được rà soát ngay'
        : 'Hiện chưa có gói nào nằm trong vùng rủi ro',
      badge: expiringSoonCount.value ? 'Cảnh báo' : 'Ổn định',
      icon: 'mdi-timer-sand',
      color: expiringSoonCount.value ? 'warning' : 'success',
      tint: expiringSoonCount.value ? 'warning-lighten-5' : 'success-lighten-5',
    },
  ];
});

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
    result = result.filter((org) => matchesStatus(org, filterStatus.value));
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
  const allPlans = plans.value.length
    ? plans.value.map((plan) => plan.name)
    : ['Free', 'Pro', 'Enterprise'];

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

const previewExpiryDate = computed(() => {
  if (!selectedOrg.value) return '—';

  const startDate = getSubscriptionStartDate(selectedOrg.value);
  const futureDate = new Date(startDate);
  futureDate.setMonth(futureDate.getMonth() + upgradeForm.value.months);

  return formatDate(futureDate.toISOString(), 'long');
});

const systemRecommendation = computed(() => {
  if (aiNearLimitCount.value > 0) {
    return `Có ${aiNearLimitCount.value} tổ chức đang dùng trên 80% AI quota, nên rà soát để tránh chạm ngưỡng trước cuối chu kỳ.`;
  }

  if (expiringSoonCount.value > 0) {
    return `Ưu tiên xử lý ${expiringSoonCount.value} tổ chức sắp hết hạn trước khi mở rộng upsell mới.`;
  }

  if (freeOrgsCount.value > premiumOrgsCount.value) {
    return 'Tỷ trọng Free còn cao, nên tập trung chuyển đổi các tổ chức đã có nhiều thành viên.';
  }

  return 'Nhịp tăng trưởng đang ổn, có thể đẩy mạnh upsell cho các tổ chức mới tạo trong ngày.';
});

watch(upgradeDialog, (isOpen) => {
  if (!isOpen) {
    dialogError.value = null;
  }
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
    console.error('Admin fetch failed', err);
    error.value = err.response?.status === 403
      ? 'Bạn không có quyền truy cập khu vực quản trị. Vui lòng đăng xuất rồi đăng nhập lại bằng tài khoản phù hợp.'
      : 'Không thể tải dữ liệu quản trị từ máy chủ. Hãy kiểm tra kết nối mạng hoặc thử lại sau.';
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
  upgradeForm.value.planId = org.subscription?.planId || plans.value[0]?.id || '';
  upgradeForm.value.months = 1;
  dialogError.value = null;
  upgradeDialog.value = true;
};

const handleUpgrade = async () => {
  if (!selectedOrg.value || !upgradeForm.value.planId) return;

  submitting.value = true;
  dialogError.value = null;

  try {
    await api.post(`/admin/organizations/${selectedOrg.value.id}/subscribe`, {
      planId: upgradeForm.value.planId,
      months: upgradeForm.value.months,
    });

    successMessage.value = `Đã cập nhật gói ${selectedPlan.value?.name || ''} cho ${selectedOrg.value.name}.`;
    successSnackbar.value = true;
    upgradeDialog.value = false;
    await fetchData();
  } catch (err: any) {
    console.error('Subscription update failed', err);
    dialogError.value = 'Cập nhật thuê bao thất bại. Vui lòng thử lại sau vài giây.';
  } finally {
    submitting.value = false;
  }
};

const getPlanName = (org: Organization) => {
  return org.subscription?.plan?.name || 'Free';
};

const getPlanColor = (name: string) => {
  if (name === 'Enterprise') return 'warning';
  if (name === 'Pro') return 'primary';
  return 'secondary';
};

const getPlanTint = (name: string) => {
  if (name === 'Enterprise') return 'warning-lighten-5';
  if (name === 'Pro') return 'primary-lighten-5';
  return 'secondary-lighten-5';
};

const getPlanDot = (name: string) => {
  if (name === 'Enterprise') return 'linear-gradient(135deg, #f59e0b, #f97316)';
  if (name === 'Pro') return 'linear-gradient(135deg, #2563eb, #60a5fa)';
  return 'linear-gradient(135deg, #64748b, #94a3b8)';
};

const getAiOverview = (org: Organization) => {
  return org.ai || {
    enabled: true,
    planName: getPlanName(org),
    periodStart: org.subscription?.currentPeriodStart || new Date().toISOString(),
    periodEnd: org.subscription?.currentPeriodEnd || new Date().toISOString(),
    maxTokens: org.subscription?.plan?.maxAiTokens || 0,
    usedTokens: 0,
    remainingTokens: org.subscription?.plan?.maxAiTokens || 0,
    usagePercent: 0,
  };
};

const getAiPlanName = (org: Organization) => {
  return getAiOverview(org).planName || getPlanName(org);
};

const getAiUsedTokens = (org: Organization) => {
  return getAiOverview(org).usedTokens || 0;
};

const getAiMaxTokens = (org: Organization) => {
  return getAiOverview(org).maxTokens || 0;
};

const getAiRemainingTokens = (org: Organization) => {
  return getAiOverview(org).remainingTokens || 0;
};

const getAiUsagePercent = (org: Organization) => {
  return getAiOverview(org).usagePercent || 0;
};

const getAiPeriodEnd = (org: Organization) => {
  return getAiOverview(org).periodEnd || new Date().toISOString();
};

const isAiEnabled = (org: Organization) => {
  return Boolean(getAiOverview(org).enabled);
};

const isAiNearLimit = (org: Organization) => {
  return isAiEnabled(org) && getAiUsagePercent(org) >= 80;
};

const getAiUsageStatus = (org: Organization) => {
  if (!isAiEnabled(org)) {
    return { label: 'AI tắt', color: 'secondary', icon: 'mdi-power-standby' };
  }

  if (getAiMaxTokens(org) <= 0) {
    return { label: 'Chưa có quota', color: 'secondary', icon: 'mdi-database-off-outline' };
  }

  if (getAiUsagePercent(org) >= 100) {
    return { label: 'Đã chạm quota', color: 'error', icon: 'mdi-alert-octagon-outline' };
  }

  if (getAiUsagePercent(org) >= 80) {
    return { label: 'Gần hết quota', color: 'warning', icon: 'mdi-fire-alert' };
  }

  return { label: 'Còn dư', color: 'success', icon: 'mdi-check-circle-outline' };
};

const getOwner = (org: Organization) => {
  const user = org.members?.[0]?.user;
  return {
    name: user?.fullName || 'Chưa có người phụ trách',
    email: user?.email || 'Chưa có email',
  };
};

const getOrgInitial = (name: string) => {
  return name.trim().charAt(0).toUpperCase();
};

const getMonthlyValue = (org: Organization) => {
  return org.subscription?.plan?.priceMonth || 0;
};

const getMemberSummary = (org: Organization) => {
  const count = org.members?.length || 0;
  return count > 1 ? 'Bao gồm owner và cộng tác viên' : 'Hiện chỉ có 1 tài khoản quản trị';
};

const getPlanSummary = (org: Organization) => {
  const plan = org.subscription?.plan;
  if (!plan) return 'Chưa phát sinh doanh thu';
  return `${plan.maxZaloAcc || 0} tài khoản Zalo • ${formatToken(plan.maxAiTokens || 0)} AI`;
};

const getPlanCapacity = (plan: SubscriptionPlan) => {
  return `${plan.maxZaloAcc || 0} tài khoản Zalo • ${formatToken(plan.maxAiTokens || 0)} AI`;
};

const getTopFeature = (plan: SubscriptionPlan) => {
  const feature = parseFeatures(plan.features)[0];
  return feature || 'Gói cơ bản cho vận hành hằng ngày';
};

const getRenewalText = (org: Organization) => {
  if (!org.subscription) return 'Chưa kích hoạt';
  if (isExpired(org.subscription.currentPeriodEnd)) return 'Đã hết hạn';
  if (isExpiringSoon(org.subscription.currentPeriodEnd)) {
    return `${daysUntil(org.subscription.currentPeriodEnd)} ngày nữa`;
  }
  return formatDate(org.subscription.currentPeriodEnd, 'short');
};

const getRenewalHint = (org: Organization) => {
  if (!org.subscription) return 'Nên kích hoạt gói đầu tiên';
  if (isExpired(org.subscription.currentPeriodEnd)) return 'Subscription đã quá hạn';
  if (isExpiringSoon(org.subscription.currentPeriodEnd)) return 'Nằm trong vùng cần gia hạn';
  return 'Thời hạn vẫn an toàn';
};

const getRecommendation = (org: Organization) => {
  if (!org.subscription) return 'Tổ chức chưa có gói trả phí, phù hợp để kích hoạt nhanh từ admin.';
  if (isExpired(org.subscription.currentPeriodEnd)) return 'Nên cập nhật subscription ngay để tránh gián đoạn sử dụng.';
  if (isExpiringSoon(org.subscription.currentPeriodEnd)) return 'Tổ chức này đang gần mốc hết hạn, nên ưu tiên gia hạn trước.';
  if (isAiNearLimit(org)) return 'Quota AI đang cao, nên cân nhắc upsell hoặc nạp thêm token trước khi nhu cầu tăng đột biến.';
  if ((org.members?.length || 0) >= 5 && getPlanName(org) === 'Free') return 'Đội ngũ đã có quy mô sử dụng, đây là ứng viên upsell tốt.';
  return 'Subscription đang ổn định và không có tín hiệu rủi ro ngắn hạn.';
};

const getAiRecommendation = (org: Organization) => {
  if (!isAiEnabled(org)) return 'AI đang bị tắt ở tổ chức này, quota hiện chưa được khai thác.';
  if (getAiMaxTokens(org) <= 0) return 'Tổ chức chưa có quota AI hiệu lực trong chu kỳ hiện tại.';
  if (getAiUsagePercent(org) >= 100) return 'Đã dùng hết quota AI, nên xử lý top-up hoặc nâng gói ngay.';
  if (getAiUsagePercent(org) >= 80) return 'Đang ở vùng rủi ro cao, nên theo dõi sát trước ngày reset quota.';
  if (getAiUsedTokens(org) === 0) return 'Quota AI chưa được dùng, có thể cần onboarding hoặc kích hoạt use case rõ hơn.';
  return 'Mức tiêu thụ AI đang trong ngưỡng an toàn.';
};

const getOrgStatus = (org: Organization) => {
  if (!org.subscription) {
    return { label: 'Free', color: 'secondary', icon: 'mdi-seed-outline' };
  }

  if (isExpired(org.subscription.currentPeriodEnd)) {
    return { label: 'Đã hết hạn', color: 'error', icon: 'mdi-alert-circle-outline' };
  }

  if (isExpiringSoon(org.subscription.currentPeriodEnd)) {
    return { label: 'Sắp hết hạn', color: 'warning', icon: 'mdi-timer-sand' };
  }

  return { label: 'Đang hoạt động', color: 'success', icon: 'mdi-check-circle-outline' };
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value || 0);
};

const formatToken = (value: number) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}M tokens`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}k tokens`;
  return `${value} tokens`;
};

const formatDate = (date: string, style: 'short' | 'long' = 'short') => {
  const parsed = new Date(date);
  return parsed.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: style === 'long' ? 'long' : 'short',
    year: 'numeric',
  });
};

const parseFeatures = (features?: string | string[]) => {
  if (!features) return [];

  if (Array.isArray(features)) return features;

  try {
    const parsed = JSON.parse(features);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const isExpiringSoon = (date?: string) => {
  if (!date) return false;
  const days = daysUntil(date);
  return days >= 0 && days <= 7;
};

const isExpired = (date?: string) => {
  if (!date) return false;
  return daysUntil(date) < 0;
};

const daysUntil = (date: string) => {
  const end = new Date(date);
  const now = new Date();
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
};

const getSubscriptionStartDate = (org: Organization) => {
  const now = new Date();
  const currentEnd = org.subscription?.currentPeriodEnd ? new Date(org.subscription.currentPeriodEnd) : null;
  return currentEnd && currentEnd > now ? currentEnd : now;
};

const sortOrganizations = (items: Organization[], option: SortOption) => {
  const sorted = [...items];

  if (option === 'Tên A-Z') {
    return sorted.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  }

  if (option === 'Mới tạo gần đây') {
    return sorted.sort((a, b) => toTime(b.createdAt) - toTime(a.createdAt));
  }

  if (option === 'Nhiều thành viên nhất') {
    return sorted.sort((a, b) => (b.members?.length || 0) - (a.members?.length || 0));
  }

  if (option === 'Dùng AI nhiều nhất') {
    return sorted.sort((a, b) => {
      const usageDiff = getAiUsagePercent(b) - getAiUsagePercent(a);
      if (usageDiff !== 0) return usageDiff;
      return getAiUsedTokens(b) - getAiUsedTokens(a);
    });
  }

  return sorted.sort((a, b) => getPriorityScore(a) - getPriorityScore(b));
};

const getPriorityScore = (org: Organization) => {
  if (!org.subscription) return 9_999;
  const remainingDays = daysUntil(org.subscription.currentPeriodEnd);
  return remainingDays < 0 ? -1000 : remainingDays;
};

const matchesStatus = (org: Organization, status: StatusFilter) => {
  if (status === 'Sắp hết hạn') return isExpiringSoon(org.subscription?.currentPeriodEnd);
  if (status === 'Đã hết hạn') return isExpired(org.subscription?.currentPeriodEnd);
  if (status === 'Đang trả phí') return getPlanName(org) !== 'Free';
  if (status === 'Free') return getPlanName(org) === 'Free';
  if (status === 'AI gần hết quota') return isAiNearLimit(org);
  return true;
};

const isSameDate = (date: string, compare: Date) => {
  const parsed = new Date(date);
  return parsed.toDateString() === compare.toDateString();
};

const toTime = (date: string) => new Date(date).getTime();

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

.hero-shell__copy,
.hero-panel,
.surface-card,
.org-card,
.upgrade-summary {
  border-radius: 28px !important;
  border: 1px solid var(--color-border) !important;
}

.hero-shell__copy {
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
.dialog-section-title,
.upgrade-dialog__title {
  margin: 0;
  color: var(--color-text);
  font-weight: 900;
  letter-spacing: -0.03em;
}

.hero-title {
  max-width: 760px;
  font-size: clamp(2rem, 3vw, 3.4rem);
  line-height: 1.02;
}

.hero-description,
.upgrade-dialog__subtitle,
.empty-card__body {
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
  background: linear-gradient(180deg, var(--color-surface-elevated), var(--color-surface-glass)) !important;
  box-shadow: var(--shadow-md);
}

.hero-panel__header,
.section-head,
.org-card__header,
.org-card__footer,
.summary-card__top,
.breakdown-row__head,
.plan-option__top,
.summary-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
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

.hero-metric__label,
.summary-card__label,
.meta-tile__label,
.snapshot-tile__label {
  display: block;
  color: var(--color-text-secondary);
  font-size: 0.84rem;
  font-weight: 700;
}

.hero-metric__value,
.summary-card__value,
.meta-tile__value,
.snapshot-tile__value {
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
.snapshot-tile__hint,
.org-card__subtitle,
.priority-item__meta {
  display: block;
  margin-top: 8px;
  color: var(--color-text-secondary);
  font-size: 0.92rem;
  line-height: 1.5;
}

.summary-card {
  background: linear-gradient(180deg, var(--color-surface-elevated), var(--color-surface-glass)) !important;
}

.surface-card {
  background: var(--color-surface-elevated) !important;
}

.section-title {
  font-size: clamp(1.2rem, 2vw, 1.5rem);
}

.filters-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.8fr) repeat(3, minmax(180px, 0.8fr));
  gap: 14px;
}

.filters-grid__search {
  grid-column: span 1;
}

.org-list {
  min-height: 200px;
}

.org-card {
  background:
    radial-gradient(circle at top right, rgba(37, 99, 235, 0.08), transparent 24%),
    var(--color-surface-elevated) !important;
  box-shadow: var(--shadow-sm);
}

.org-card__header {
  align-items: flex-start;
}

.org-card__identity {
  display: flex;
  gap: 16px;
  min-width: 0;
}

.org-card__identity-copy {
  min-width: 0;
}

.org-card__title-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.org-card__name {
  margin: 0;
  color: var(--color-text);
  font-size: 1.3rem;
  font-weight: 850;
}

.org-card__subtitle {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 10px;
}

.org-card__initial {
  color: var(--color-text);
  font-size: 1.1rem;
  font-weight: 900;
}

.org-meta-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.meta-tile {
  padding: 18px;
  background: var(--color-overlay);
  border: 1px solid var(--color-border);
  border-radius: 22px;
}

.meta-tile__value {
  margin-top: 10px;
  font-size: 1.16rem;
}

.ai-insight-card,
.ai-system-card {
  padding: 18px 20px;
  background: linear-gradient(180deg, var(--color-primary-soft), var(--color-overlay));
  border: 1px solid var(--color-border);
  border-radius: 22px;
}

.ai-insight-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.ai-insight-card__chips {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.ai-insight-card__title,
.ai-system-card__value {
  color: var(--color-text);
  font-size: 1.35rem;
  font-weight: 900;
  line-height: 1.15;
}

.ai-insight-card__subtitle,
.ai-system-card__subtitle {
  margin-top: 8px;
  color: var(--color-text-secondary);
  font-size: 0.92rem;
  line-height: 1.6;
}

.ai-insight-card__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.ai-mini-stat {
  padding: 14px;
  background: rgba(255, 255, 255, 0.42);
  border: 1px solid var(--color-border);
  border-radius: 18px;
}

.v-theme--dark .ai-mini-stat {
  background: rgba(15, 23, 42, 0.28);
}

.ai-mini-stat__label {
  display: block;
  color: var(--color-text-secondary);
  font-size: 0.8rem;
  font-weight: 700;
}

.ai-mini-stat__value {
  display: block;
  margin-top: 8px;
  color: var(--color-text);
  font-size: 1rem;
  font-weight: 850;
}

.ai-insight-card__note {
  display: inline-flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 14px;
  color: var(--color-text-secondary);
  font-size: 0.92rem;
  line-height: 1.6;
}

.org-card__footer {
  align-items: flex-start;
}

.org-card__footnote {
  display: inline-flex;
  align-items: flex-start;
  gap: 8px;
  max-width: 620px;
  color: var(--color-text-secondary);
  font-size: 0.95rem;
  line-height: 1.6;
}

.org-card__tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.tag-chip {
  background: var(--color-overlay) !important;
  color: var(--color-text-secondary) !important;
}

.priority-list {
  display: grid;
  gap: 12px;
}

.priority-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  padding: 16px 18px;
  background: var(--color-overlay);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.priority-item:hover {
  transform: translateY(-1px);
  border-color: var(--color-primary-soft-strong);
  box-shadow: var(--shadow-sm);
}

.priority-item__name {
  color: var(--color-text);
  font-size: 0.98rem;
  font-weight: 800;
}

.notice-box,
.summary-callout {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px 16px;
  border-radius: 18px;
  font-size: 0.95rem;
  line-height: 1.6;
}

.notice-box--success {
  background: var(--color-success-soft);
  border: 1px solid var(--color-success-border);
  color: var(--color-success);
}

.breakdown-row + .breakdown-row {
  margin-top: 18px;
}

.breakdown-row__name,
.breakdown-row__value {
  color: var(--color-text);
  font-weight: 700;
}

.breakdown-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
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

.snapshot-tile__value {
  font-size: 1.35rem;
}

.snapshot-tile__value--text {
  font-size: 1rem;
  line-height: 1.6;
}

.empty-card {
  border-radius: 28px !important;
}

.empty-card__title {
  margin: 0;
  color: var(--color-text);
  font-size: 1.32rem;
  font-weight: 850;
}

.org-card--placeholder {
  overflow: hidden;
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

.upgrade-dialog {
  overflow: hidden;
  border-radius: 32px !important;
  border: 1px solid var(--color-border) !important;
}

.upgrade-dialog__hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
  background: linear-gradient(135deg, #0f172a, #13203b 58%, #1d4ed8);
  color: #fff;
}

.upgrade-dialog__title {
  color: #fff;
  font-size: clamp(1.65rem, 3vw, 2.2rem);
}

.upgrade-dialog__subtitle {
  max-width: 560px;
  color: rgba(255, 255, 255, 0.78);
}

.upgrade-dialog__hero-meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(150px, 1fr));
  gap: 12px;
  width: min(360px, 100%);
}

.upgrade-stat {
  padding: 16px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  backdrop-filter: blur(14px);
}

.upgrade-stat__label {
  display: block;
  color: rgba(255, 255, 255, 0.68);
  font-size: 0.8rem;
  font-weight: 700;
}

.upgrade-stat__value {
  display: block;
  margin-top: 8px;
  font-size: 1.08rem;
  font-weight: 900;
}

.upgrade-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(280px, 0.95fr);
  gap: 22px;
}

.plan-grid,
.duration-grid {
  display: grid;
  gap: 14px;
}

.plan-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.duration-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.plan-option,
.duration-option {
  padding: 18px;
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: 22px;
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.plan-option:hover,
.duration-option:hover {
  transform: translateY(-1px);
  border-color: var(--color-primary-soft-strong);
}

.plan-option--active,
.duration-option--active {
  border-color: var(--color-primary) !important;
  background: linear-gradient(180deg, var(--color-primary-soft), var(--color-surface-elevated));
  box-shadow: 0 0 0 1px var(--color-primary-soft-strong);
}

.plan-option__price,
.duration-option strong {
  display: block;
  color: var(--color-text);
  font-size: 1.05rem;
  font-weight: 850;
}

.plan-option__hint,
.duration-option span {
  display: block;
  margin-top: 8px;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  line-height: 1.5;
}

.upgrade-summary {
  align-self: start;
  background:
    radial-gradient(circle at top right, rgba(37, 99, 235, 0.1), transparent 36%),
    var(--color-surface-elevated) !important;
  box-shadow: var(--shadow-sm);
}

.summary-stack {
  display: grid;
  gap: 12px;
}

.summary-row {
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-border);
}

.summary-row span {
  color: var(--color-text-secondary);
  font-size: 0.92rem;
}

.summary-row strong {
  color: var(--color-text);
  font-size: 0.96rem;
  font-weight: 850;
  text-align: right;
}

.summary-callout {
  background: var(--color-primary-soft);
  border: 1px solid var(--color-primary-soft-strong);
  color: var(--color-primary-strong);
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

  .org-meta-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .ai-insight-card__grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 1200px) {
  .hero-shell,
  .upgrade-layout {
    grid-template-columns: 1fr;
  }

  .plan-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .admin-page {
    padding-left: 8px;
    padding-right: 8px;
  }

  .hero-shell__copy,
  .hero-panel,
  .surface-card,
  .org-card,
  .upgrade-dialog__hero {
    padding: 22px !important;
  }

  .hero-panel__header,
  .section-head,
  .org-card__header,
  .org-card__footer {
    flex-direction: column;
    align-items: flex-start;
  }

  .filters-grid,
  .org-meta-grid,
  .ai-insight-card__grid,
  .snapshot-grid,
  .plan-grid,
  .duration-grid,
  .placeholder-grid,
  .upgrade-dialog__hero-meta {
    grid-template-columns: 1fr;
  }

  .ai-insight-card__head,
  .ai-insight-card__chips {
    align-items: flex-start;
    justify-content: flex-start;
  }

  .org-card__actions,
  .org-card__actions .v-btn {
    width: 100%;
  }

  .org-card__tags {
    justify-content: flex-start;
  }

  .priority-item,
  .summary-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .hero-title {
    font-size: 2rem;
  }

  .upgrade-dialog__title {
    font-size: 1.5rem;
  }
}
</style>
