<template>
  <v-container fluid class="pricing-page pa-0" :class="{ 'pricing-page--dark': isDark }">
    <div class="pricing-page__aurora pricing-page__aurora--primary"></div>
    <div class="pricing-page__aurora pricing-page__aurora--secondary"></div>
    <div class="pricing-page__grid"></div>

    <v-container class="pricing-page__container py-10 py-md-14">
      <section class="hero-panel">
        <div class="hero-copy">
          <div class="eyebrow-chip mb-5">
            <v-icon size="16" color="primary">mdi-crown-outline</v-icon>
            <span>Gói cước Claro</span>
          </div>

          <h1 class="hero-title mb-5">
            Chọn gói phù hợp để
            <span class="hero-title__accent">tăng tốc chăm sóc khách hàng</span>
            trên Zalo
          </h1>

          <p class="hero-description mb-8">
            Tập trung hội thoại, tự động hóa phản hồi, mở rộng AI Assistant và quản lý nhiều tài khoản
            Zalo trong cùng một workspace.
          </p>

          <div class="hero-actions">
            <div class="billing-switch">
              <button
                type="button"
                class="billing-switch__option"
                :class="{ 'billing-switch__option--active': !isYearly }"
                @click="isYearly = false"
              >
                Theo tháng
              </button>
              <button
                type="button"
                class="billing-switch__option"
                :class="{ 'billing-switch__option--active': isYearly }"
                @click="isYearly = true"
              >
                Theo năm
                <span class="billing-switch__badge">Tiết kiệm 20%</span>
              </button>
            </div>

            <div class="hero-note">
              <v-icon size="16" color="success">mdi-shield-check-outline</v-icon>
              <span>Thanh toán chuyển khoản, admin duyệt gói nhanh sau khi đối soát.</span>
            </div>
          </div>
        </div>

        <div class="hero-summary">
          <div class="summary-card">
            <div class="summary-card__label">Gói hiện tại</div>
            <div class="summary-card__value">{{ currentPlan?.name || 'Chưa kích hoạt' }}</div>
            <div class="summary-card__hint">
              {{ currentPlan ? getPlanDescription(currentPlan.name) : 'Bắt đầu với Free hoặc nâng cấp ngay để mở rộng giới hạn.' }}
            </div>
            <v-btn
              block
              color="primary"
              rounded="xl"
              height="48"
              class="mt-5"
              :disabled="plansLoading || plansUsingFallback || (!recommendedPlan && !plans.length)"
              @click="openUpgradeEntry"
            >
              {{ recommendedPlan ? `Nâng cấp lên ${recommendedPlan.name}` : 'Xem bảng giá gói cước' }}
            </v-btn>
          </div>

          <div class="summary-metrics">
            <div class="summary-metric">
              <span class="summary-metric__label">Kênh kết nối</span>
              <strong class="summary-metric__value">{{ currentPlan?.maxZaloAcc ?? 1 }}</strong>
            </div>
            <div class="summary-metric">
              <span class="summary-metric__label">Lượt AI / tháng</span>
              <strong class="summary-metric__value">~{{ formatNumber(getAiReplies(currentPlan?.maxAiTokens ?? 0)) }}</strong>
            </div>
            <div class="summary-metric">
              <span class="summary-metric__label">Chu kỳ thanh toán</span>
              <strong class="summary-metric__value">{{ isYearly ? '12 tháng' : '1 tháng' }}</strong>
            </div>
          </div>
        </div>
      </section>

      <section class="insight-strip">
        <div class="insight-card">
          <span class="insight-card__label">Chi phí vận hành</span>
          <strong class="insight-card__value">Tối ưu hơn</strong>
          <p>Gộp CRM, AI và automation trong một gói thay vì nhiều công cụ rời rạc.</p>
        </div>
        <div class="insight-card">
          <span class="insight-card__label">Khả năng mở rộng</span>
          <strong class="insight-card__value">Linh hoạt theo team</strong>
          <p>Tăng số kênh kết nối, nâng giới hạn AI và giữ dữ liệu tập trung theo tổ chức.</p>
        </div>
        <div class="insight-card">
          <span class="insight-card__label">Triển khai</span>
          <strong class="insight-card__value">Kích hoạt nhanh</strong>
          <p>Tạo đơn trên hệ thống, chuyển khoản đúng nội dung và chờ admin xác nhận.</p>
        </div>
      </section>

      <section id="pricing-plans" class="section-head mt-14">
        <div>
          <div class="eyebrow-chip eyebrow-chip--soft mb-3">Bảng giá</div>
          <h2 class="section-title">So sánh nhanh các gói chính</h2>
        </div>
        <p class="section-subtitle">
          Mỗi gói đều bao gồm CRM cơ bản, quản lý hội thoại và theo dõi tập trung theo tổ chức.
        </p>
      </section>

      <v-alert
        v-if="plansNotice"
        type="warning"
        variant="tonal"
        rounded="xl"
        class="mt-5"
      >
        {{ plansNotice }}
      </v-alert>

      <v-alert
        v-else-if="!plansLoading && !plans.length"
        type="info"
        variant="tonal"
        rounded="xl"
        class="mt-5"
      >
        Chưa tải được danh sách gói cước. Hãy tải lại trang hoặc liên hệ admin để kiểm tra deployment.
      </v-alert>

      <v-row class="pricing-grid mt-2" align="stretch">
        <v-col
          v-for="(plan, index) in plans"
          :key="plan.id"
          cols="12"
          md="4"
          class="d-flex"
        >
          <v-card
            class="plan-card pa-6 pa-md-7 d-flex flex-column flex-grow-1"
            :class="{
              'plan-card--featured': isFeaturedPlan(plan),
              'plan-card--current': isCurrentPlan(plan),
            }"
            :style="{ animationDelay: `${index * 80}ms` }"
          >
            <div class="plan-card__top mb-6">
              <div>
                <div class="plan-card__pill" :class="`plan-card__pill--${getPlanTone(plan.name)}`">
                  <v-icon size="16">{{ getPlanIcon(plan.name) }}</v-icon>
                  <span>{{ getPlanBadge(plan.name) }}</span>
                </div>
                <h3 class="plan-card__name mt-4">{{ plan.name }}</h3>
                <p class="plan-card__description mt-2">
                  {{ getPlanDescription(plan.name) }}
                </p>
              </div>

              <div v-if="isFeaturedPlan(plan)" class="featured-chip">
                Phù hợp nhất
              </div>
            </div>

            <div class="price-block mb-6">
              <div class="price-block__main">
                <span class="price-block__currency">đ</span>
                <span class="price-block__amount">{{ formatCompactPrice(getDisplayMonthlyPrice(plan.priceMonth)) }}</span>
                <span class="price-block__period">/tháng</span>
              </div>
              <div v-if="plan.priceMonth > 0" class="price-block__meta">
                <span v-if="isYearly">Thanh toán {{ formatPrice(plan.priceMonth * 12 * 0.8) }} / năm</span>
                <span v-else>Thanh toán {{ formatPrice(plan.priceMonth) }} / tháng</span>
              </div>
              <div v-else class="price-block__meta">Miễn phí để bắt đầu và dùng thử workflow cơ bản</div>
            </div>

            <div class="quota-panel mb-6">
              <div class="quota-panel__item">
                <span class="quota-panel__label">Kênh kết nối</span>
                <strong>{{ plan.maxZaloAcc }}</strong>
              </div>
              <div class="quota-panel__item">
                <span class="quota-panel__label">Lượt AI ước tính</span>
                <strong>~{{ formatNumber(getAiReplies(plan.maxAiTokens)) }}</strong>
              </div>
              <div class="quota-panel__item">
                <span class="quota-panel__label">Tokens AI</span>
                <strong>{{ formatNumber(plan.maxAiTokens) }}</strong>
              </div>
            </div>

            <div class="feature-stack mb-8">
              <div class="feature-stack__title">Bao gồm</div>
              <div class="feature-row">
                <v-icon size="16" color="primary">mdi-check-circle</v-icon>
                <span>Tối đa {{ plan.maxZaloAcc }} kênh kết nối hoạt động đồng thời</span>
              </div>
              <div
                v-for="(feature, featureIndex) in parseFeatures(plan.features)"
                :key="`${plan.id}-${featureIndex}`"
                class="feature-row"
              >
                <v-icon size="16" color="primary">mdi-check-circle</v-icon>
                <span>{{ feature }}</span>
              </div>
            </div>

            <v-spacer />

            <v-btn
              block
              height="54"
              rounded="xl"
              class="plan-card__cta"
              :class="{ 'plan-card__cta--featured': isFeaturedPlan(plan) }"
              :variant="isCurrentPlan(plan) ? 'tonal' : isFeaturedPlan(plan) ? 'flat' : 'outlined'"
              :color="isCurrentPlan(plan) ? 'primary' : 'primary'"
              :disabled="plansUsingFallback || isCurrentPlan(plan)"
              @click="selectPlan(plan)"
            >
              {{ isCurrentPlan(plan) ? 'Gói đang sử dụng' : 'Chọn gói này' }}
            </v-btn>
          </v-card>
        </v-col>
      </v-row>

      <section class="section-head mt-16">
        <div>
          <div class="eyebrow-chip eyebrow-chip--soft mb-3">Đối chiếu tính năng</div>
          <h2 class="section-title">Bảng so sánh chi tiết</h2>
        </div>
        <p class="section-subtitle">
          Dùng bảng này để kiểm tra nhanh giới hạn và các quyền lợi theo từng gói.
        </p>
      </section>

      <div class="comparison-shell mt-5">
        <v-table class="comparison-table">
          <thead>
            <tr>
              <th>Tính năng</th>
              <th class="text-center">Free</th>
              <th class="text-center comparison-table__highlight">Pro</th>
              <th class="text-center">Enterprise</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in comparisonRows" :key="row.label">
              <td class="comparison-table__label">{{ row.label }}</td>
              <td class="text-center">{{ renderComparisonValue(row.free) }}</td>
              <td class="text-center comparison-table__highlight">{{ renderComparisonValue(row.pro) }}</td>
              <td class="text-center">{{ renderComparisonValue(row.enterprise) }}</td>
            </tr>
          </tbody>
        </v-table>
      </div>

      <section class="section-head mt-16">
        <div>
          <div class="eyebrow-chip eyebrow-chip--soft mb-3">Top-up AI</div>
          <h2 class="section-title">Bổ sung lượt AI khi cần</h2>
        </div>
        <p class="section-subtitle">
          Dùng khi team cần tăng năng lực trả lời trong tháng mà chưa muốn nâng gói chính.
        </p>
      </section>

      <v-row class="mt-2" align="stretch">
        <v-col v-for="pack in aiPacks" :key="pack.id" cols="12" sm="6" md="3" class="d-flex">
          <v-card class="topup-card pa-6 d-flex flex-column flex-grow-1">
            <div class="topup-card__icon mb-5">
              <v-icon size="26" color="primary">mdi-lightning-bolt-outline</v-icon>
            </div>
            <h3 class="topup-card__name mb-2">{{ pack.name }}</h3>
            <div class="topup-card__quota mb-2">+{{ formatNumber(getAiReplies(pack.tokens)) }} lượt AI</div>
            <div class="topup-card__tokens mb-6">{{ formatNumber(pack.tokens) }} tokens</div>
            <v-spacer />
            <div class="topup-card__price mb-5">{{ formatPrice(pack.price) }}</div>
            <v-btn block rounded="xl" color="primary" variant="flat" height="48" @click="selectTopup(pack)">
              Nạp gói AI
            </v-btn>
          </v-card>
        </v-col>
      </v-row>

      <section class="faq-section mt-16">
        <section class="section-head mb-6">
          <div>
            <div class="eyebrow-chip eyebrow-chip--soft mb-3">FAQ</div>
            <h2 class="section-title">Câu hỏi thường gặp</h2>
          </div>
        </section>

        <v-expansion-panels variant="accordion" class="faq-panels">
          <v-expansion-panel v-for="faq in faqs" :key="faq.q" class="faq-panel">
            <v-expansion-panel-title class="faq-panel__title">
              {{ faq.q }}
            </v-expansion-panel-title>
            <v-expansion-panel-text class="faq-panel__text">
              {{ faq.a }}
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </section>
    </v-container>

    <v-dialog v-model="paymentDialog" max-width="640" scrollable content-class="payment-dialog">
      <v-card v-if="selectedPlan" class="payment-card">
        <div class="payment-card__hero flex-shrink-0 pa-6 pa-md-7">
          <div>
            <div class="eyebrow-chip eyebrow-chip--inverted mb-3">
              <v-icon size="16" color="white">mdi-credit-card-outline</v-icon>
              <span>{{ isTopup ? 'Thanh toán top-up AI' : 'Nâng cấp gói cước' }}</span>
            </div>
            <h3 class="payment-card__title">{{ selectedPlan.name }}</h3>
            <p class="payment-card__subtitle">
              Quét mã QR hoặc chuyển khoản thủ công với đúng số tiền và nội dung để hệ thống tạo yêu cầu duyệt.
            </p>
          </div>
          <v-btn icon variant="text" color="white" @click="paymentDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>

        <v-card-text class="pa-0 scrollable-content">
          <div class="pa-6 pa-md-7">
          <div class="payment-summary mb-6">
            <div>
              <div class="payment-summary__label">Tổng thanh toán</div>
              <div class="payment-summary__amount">{{ formatPrice(getFinalAmount()) }}</div>
            </div>
            
            <div v-if="isTopup" class="payment-summary__badge">
              Top-up AI
            </div>
            <div v-else class="billing-switch billing-switch--small">
              <button
                type="button"
                class="billing-switch__option"
                :class="{ 'billing-switch__option--active': !isYearly }"
                @click="isYearly = false"
              >
                1 tháng
              </button>
              <button
                type="button"
                class="billing-switch__option"
                :class="{ 'billing-switch__option--active': isYearly }"
                @click="isYearly = true"
              >
                1 năm (-20%)
              </button>
            </div>
          </div>

          <v-row class="payment-layout">
            <v-col cols="12" md="5">
              <div class="qr-box pa-4">
                <v-img :src="generateQrUrl()" class="rounded-lg" cover />
              </div>
              <div class="payment-caption mt-3">
                <v-icon size="14" class="mr-1">mdi-camera-outline</v-icon>
                Dùng ứng dụng ngân hàng để quét QR
              </div>
            </v-col>

            <v-col cols="12" md="7">
              <div class="payment-info">
                <div class="payment-info__row">
                  <span>Chủ tài khoản</span>
                  <strong>CÔNG TY TNHH CLARO VIỆT NAM</strong>
                </div>
                <div class="payment-info__row">
                  <span>Ngân hàng</span>
                  <strong>MB Bank (Quân đội)</strong>
                </div>
                <div class="payment-info__row">
                  <span>Số tài khoản</span>
                  <strong>
                    6386365999
                    <v-btn icon="mdi-content-copy" size="x-small" variant="text" color="primary" @click="copyText('6386365999')" />
                  </strong>
                </div>
                <div class="payment-info__row">
                  <span>Nội dung</span>
                  <strong class="payment-info__content">
                    {{ generatePaymentContent() }}
                    <v-btn icon="mdi-content-copy" size="x-small" variant="text" color="primary" @click="copyText(generatePaymentContent())" />
                  </strong>
                </div>
              </div>
            </v-col>
          </v-row>

          <div class="payment-steps mt-7">
            <div class="payment-step">
              <div class="payment-step__index">1</div>
              <p>Mở app ngân hàng và quét QR hoặc nhập tay thông tin chuyển khoản.</p>
            </div>
            <div class="payment-step">
              <div class="payment-step__index">2</div>
              <p>Kiểm tra đúng số tiền và nội dung chuyển khoản trước khi xác nhận.</p>
            </div>
            <div class="payment-step">
              <div class="payment-step__index">3</div>
              <p>Nhấn nút bên dưới để tạo yêu cầu duyệt sau khi bạn đã chuyển khoản xong.</p>
            </div>
          </div>

          <v-btn
            block
            color="primary"
            variant="flat"
            rounded="xl"
            height="54"
            class="mt-8"
            :loading="paymentSubmitting"
            @click="confirmPayment"
          >
            Tôi đã chuyển khoản thành công
          </v-btn>
          <v-btn block variant="text" rounded="xl" class="mt-3" @click="paymentDialog = false">
            Hủy giao dịch
          </v-btn>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="feedbackOpen" :color="feedbackColor" timeout="5000" rounded="pill">
      {{ feedbackMessage }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useTheme } from 'vuetify';
import { api } from '@/api/index';

interface SubscriptionPlan {
  id: string;
  name: string;
  priceMonth: number;
  maxZaloAcc: number;
  maxAiTokens: number;
  features: string[] | string | null;
}

interface TopupPack {
  id: string;
  name: string;
  tokens: number;
  price: number;
}

interface PaymentSelection {
  id?: string;
  name: string;
  priceMonth: number;
  tokenAmount?: number;
}

type ComparisonValue = string | boolean;

const AI_REPLY_TOKEN_RATIO = 1500;
const DEFAULT_PRICING_PLANS: SubscriptionPlan[] = [
  {
    id: 'fallback-free',
    name: 'Free',
    priceMonth: 0,
    maxZaloAcc: 1,
    maxAiTokens: 50000,
    features: ['CRM cơ bản', '1 tài khoản Zalo', 'AI Assistant (Model cơ bản)', '~30 lượt phản hồi AI/tháng'],
  },
  {
    id: 'fallback-pro',
    name: 'Pro',
    priceMonth: 200000,
    maxZaloAcc: 5,
    maxAiTokens: 1500000,
    features: ['Đầy đủ CRM', '5 tài khoản Zalo', 'AI Assistant (Tốc độ cao)', 'Automation', '~1,000 lượt phản hồi AI/tháng'],
  },
  {
    id: 'fallback-enterprise',
    name: 'Enterprise',
    priceMonth: 1000000,
    maxZaloAcc: 50,
    maxAiTokens: 15000000,
    features: ['Vô hạn CRM', '50 tài khoản Zalo', 'AI Assistant (Claude 3.5 Sonnet)', 'Ưu tiên hỗ trợ', '~10,000 lượt phản hồi AI/tháng'],
  },
];

const theme = useTheme();
const isDark = computed(() => theme.global.current.value.dark);

const plans = ref<SubscriptionPlan[]>([]);
const currentPlanId = ref<string | null>(null);
const currentPlanName = ref<string | null>(null);
const paymentDialog = ref(false);
const selectedPlan = ref<PaymentSelection | null>(null);
const isTopup = ref(false);
const isYearly = ref(true);
const plansLoading = ref(false);
const plansNotice = ref('');
const plansUsingFallback = ref(false);
const paymentSubmitting = ref(false);
const feedbackOpen = ref(false);
const feedbackColor = ref<'success' | 'error'>('success');
const feedbackMessage = ref('');

const aiPacks = ref<TopupPack[]>([
  { id: 'ai_200k', name: 'Gói tiết kiệm', tokens: 200000, price: 50000 },
  { id: 'ai_1m', name: 'Gói phổ thông', tokens: 1000000, price: 200000 },
  { id: 'ai_3m', name: 'Gói chuyên nghiệp', tokens: 3000000, price: 500000 },
  { id: 'ai_12m', name: 'Gói doanh nghiệp', tokens: 12000000, price: 1500000 },
]);

const faqs = [
  {
    q: 'Lượt phản hồi AI được tính như thế nào?',
    a: 'Trung bình khoảng 1.500 tokens tương đương 1 lượt phản hồi AI đầy đủ. Tin nhắn dài hoặc có nhiều ngữ cảnh sẽ dùng nhiều tokens hơn.',
  },
  {
    q: 'Tôi có thể nâng cấp gói giữa tháng không?',
    a: 'Có. Bạn có thể tạo yêu cầu nâng cấp bất kỳ lúc nào. Admin sẽ duyệt thanh toán và cập nhật gói cho tổ chức tương ứng.',
  },
  {
    q: 'Có hỗ trợ nhiều kênh kết nối trong cùng tổ chức không?',
    a: 'Có. Mỗi gói quy định số lượng kênh kết nối (Zalo, Facebook...) có thể hoạt động đồng thời. Tất cả hội thoại vẫn được quản lý tập trung trong cùng workspace.',
  },
  {
    q: 'Nếu hết lượt AI trong tháng thì sao?',
    a: 'Bạn có thể nạp thêm top-up AI ngay trên trang này để tiếp tục sử dụng mà không phải chờ sang chu kỳ tiếp theo.',
  },
];

const currentPlan = computed(() => {
  if (currentPlanId.value) {
    const planById = plans.value.find((plan) => plan.id === currentPlanId.value);
    if (planById) return planById;
  }

  if (currentPlanName.value) {
    const currentPlanKey = normalizePlanKey(currentPlanName.value);
    return plans.value.find((plan) => normalizePlanKey(plan.name) === currentPlanKey) || null;
  }

  return null;
});
const recommendedPlan = computed(() => {
  const currentPlanKey = currentPlan.value ? normalizePlanKey(currentPlan.value.name) : '';
  const paidPlans = plans.value.filter((plan) => plan.priceMonth > 0);

  if (!paidPlans.length) return null;
  if (currentPlanKey === 'enterprise') return plansByKey.value.enterprise || paidPlans[paidPlans.length - 1];
  if (currentPlanKey === 'pro') return plansByKey.value.enterprise || paidPlans[paidPlans.length - 1];
  return plansByKey.value.pro || paidPlans[0];
});

const plansByKey = computed<Record<string, SubscriptionPlan | undefined>>(() => {
  return plans.value.reduce<Record<string, SubscriptionPlan | undefined>>((acc, plan) => {
    acc[normalizePlanKey(plan.name)] = plan;
    return acc;
  }, {});
});

const comparisonRows = computed<Array<{ label: string; free: ComparisonValue; pro: ComparisonValue; enterprise: ComparisonValue }>>(() => {
  const freePlan = plansByKey.value.free;
  const proPlan = plansByKey.value.pro;
  const enterprisePlan = plansByKey.value.enterprise;

  return [
    {
      label: 'Số kênh kết nối tối đa',
      free: String(freePlan?.maxZaloAcc ?? 1),
      pro: String(proPlan?.maxZaloAcc ?? 5),
      enterprise: String(enterprisePlan?.maxZaloAcc ?? 50),
    },
    {
      label: 'Lượt phản hồi AI / tháng',
      free: `~${formatNumber(getAiReplies(freePlan?.maxAiTokens ?? 45000))}`,
      pro: `~${formatNumber(getAiReplies(proPlan?.maxAiTokens ?? 1500000))}`,
      enterprise: `~${formatNumber(getAiReplies(enterprisePlan?.maxAiTokens ?? 15000000))}`,
    },
    {
      label: 'CRM & quản lý contact',
      free: 'Cơ bản',
      pro: 'Đầy đủ',
      enterprise: 'Nâng cao',
    },
    {
      label: 'Automation workflow',
      free: false,
      pro: true,
      enterprise: true,
    },
    {
      label: 'Báo cáo & phân tích',
      free: false,
      pro: true,
      enterprise: true,
    },
    {
      label: 'Knowledge base AI',
      free: 'Giới hạn',
      pro: true,
      enterprise: true,
    },
    {
      label: 'Hỗ trợ triển khai',
      free: 'Cộng đồng',
      pro: 'Email / Chat',
      enterprise: 'Ưu tiên',
    },
  ];
});

const fetchPlans = async () => {
  plansLoading.value = true;
  plansNotice.value = '';
  plansUsingFallback.value = false;

  try {
    const res = await api.get('/billing/plans');
    plans.value = res.data.sort((a: SubscriptionPlan, b: SubscriptionPlan) => a.priceMonth - b.priceMonth);
  } catch (err: any) {
    console.error('Failed to fetch plans', err);
    plans.value = DEFAULT_PRICING_PLANS.map((plan) => ({
      ...plan,
      features: Array.isArray(plan.features) ? [...plan.features] : plan.features,
    }));
    plansUsingFallback.value = true;
    plansNotice.value = 'Đang hiển thị bảng giá mặc định do hệ thống chưa tải được dữ liệu gói cước. Tạm thời chưa thể tạo yêu cầu nâng cấp.';
  } finally {
    plansLoading.value = false;
  }
};

const fetchSubscription = async () => {
  try {
    const res = await api.get('/billing/subscription');
    if (res.data) {
      currentPlanId.value = res.data.planId;
      currentPlanName.value = res.data.plan?.name || null;
    }
  } catch (err) {
    console.error('Failed to fetch subscription', err);
  }
};

onMounted(() => {
  fetchPlans();
  fetchSubscription();
});

const normalizePlanKey = (name: string) => name.trim().toLowerCase();

const getPlanIcon = (name: string) => {
  const planKey = normalizePlanKey(name);
  if (planKey === 'free') return 'mdi-sprout-outline';
  if (planKey === 'pro') return 'mdi-rocket-launch-outline';
  if (planKey === 'enterprise') return 'mdi-office-building-cog-outline';
  return 'mdi-cube-outline';
};

const getPlanTone = (name: string) => {
  const planKey = normalizePlanKey(name);
  if (planKey === 'free') return 'neutral';
  if (planKey === 'pro') return 'primary';
  if (planKey === 'enterprise') return 'accent';
  return 'neutral';
};

const getPlanBadge = (name: string) => {
  const planKey = normalizePlanKey(name);
  if (planKey === 'free') return 'Khởi động';
  if (planKey === 'pro') return 'Khuyên dùng';
  if (planKey === 'enterprise') return 'Mở rộng';
  return 'Gói dịch vụ';
};

const getPlanDescription = (name: string) => {
  const planKey = normalizePlanKey(name);
  if (planKey === 'free') return 'Phù hợp để trải nghiệm hệ thống và triển khai quy trình cơ bản.';
  if (planKey === 'pro') return 'Dành cho team bán hàng hoặc CSKH cần AI và automation chạy thường xuyên.';
  if (planKey === 'enterprise') return 'Phù hợp tổ chức nhiều tài khoản, cần quy mô lớn và hỗ trợ ưu tiên.';
  return 'Gói dịch vụ dành cho tổ chức của bạn.';
};

const isFeaturedPlan = (plan: SubscriptionPlan) => normalizePlanKey(plan.name) === 'pro';
const isCurrentPlan = (plan: SubscriptionPlan) => {
  if (currentPlanId.value && plan.id === currentPlanId.value) return true;
  return currentPlanName.value ? normalizePlanKey(plan.name) === normalizePlanKey(currentPlanName.value) : false;
};

const getAiReplies = (tokens: number) => Math.max(0, Math.floor(tokens / AI_REPLY_TOKEN_RATIO));

const getDisplayMonthlyPrice = (monthlyPrice: number) => {
  if (monthlyPrice === 0) return 0;
  return isYearly.value ? monthlyPrice * 0.8 : monthlyPrice;
};

const getFinalAmount = () => {
  if (!selectedPlan.value) return 0;
  if (isTopup.value) return selectedPlan.value.priceMonth;
  return isYearly.value ? selectedPlan.value.priceMonth * 12 * 0.8 : selectedPlan.value.priceMonth;
};

const generatePaymentContent = () => {
  if (!selectedPlan.value) return '';
  const prefix = isTopup.value ? 'NAPAI' : isYearly.value ? 'CRMPAY1Y' : 'CRMPAY';
  return `${prefix} ${selectedPlan.value.name.split(' ')[0]}`.toUpperCase();
};

const generateQrUrl = () => {
  if (!selectedPlan.value) return '';
  const amount = getFinalAmount();
  const content = generatePaymentContent();
  return `https://img.vietqr.io/image/MB-6386365999-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(content)}&accountName=CONG%20TY%20TNHH%20CLARO%20VIET%20NAM`;
};

const formatCompactPrice = (price: number) => {
  if (price === 0) return '0';
  if (price < 1000000) return `${(price / 1000).toLocaleString('vi-VN')}k`;
  return `${(price / 1000000).toLocaleString('vi-VN')}tr`;
};

const formatNumber = (value: number) => value.toLocaleString('vi-VN');

const formatPrice = (price: number) => {
  if (price === 0) return 'Miễn phí';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

const parseFeatures = (features: SubscriptionPlan['features']) => {
  if (typeof features === 'string') {
    try {
      return JSON.parse(features) as string[];
    } catch (_error) {
      return [];
    }
  }

  return Array.isArray(features) ? features : [];
};

const scrollToPlans = () => {
  document.getElementById('pricing-plans')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const showUpgradeUnavailableMessage = () => {
  feedbackColor.value = 'error';
  feedbackMessage.value = 'Tạm thời chưa thể tạo yêu cầu nâng cấp trong khi hệ thống đang dùng bảng giá mặc định.';
  feedbackOpen.value = true;
};

const selectPlan = (plan: SubscriptionPlan) => {
  if (plansUsingFallback.value) {
    showUpgradeUnavailableMessage();
    return;
  }

  selectedPlan.value = { ...plan };
  isTopup.value = false;
  paymentDialog.value = true;
};

const openUpgradeEntry = () => {
  if (plansUsingFallback.value) {
    showUpgradeUnavailableMessage();
    scrollToPlans();
    return;
  }

  if (recommendedPlan.value) {
    selectPlan(recommendedPlan.value);
    return;
  }

  scrollToPlans();
};

const selectTopup = (pack: TopupPack) => {
  selectedPlan.value = {
    name: pack.name,
    priceMonth: pack.price,
    tokenAmount: pack.tokens,
  };
  isTopup.value = true;
  paymentDialog.value = true;
};

const confirmPayment = async () => {
  if (!selectedPlan.value) return;
  paymentSubmitting.value = true;

  try {
    const payload = isTopup.value
      ? {
          orderType: 'ai_topup',
          planName: selectedPlan.value.name,
          tokenAmount: selectedPlan.value.tokenAmount,
          amount: getFinalAmount(),
          paymentContent: generatePaymentContent(),
        }
      : {
          orderType: 'subscription_upgrade',
          planId: selectedPlan.value.id,
          planName: selectedPlan.value.name,
          months: isYearly.value ? 12 : 1,
          amount: getFinalAmount(),
          paymentContent: generatePaymentContent(),
        };

    const res = await api.post('/billing/orders', payload);
    paymentDialog.value = false;
    feedbackColor.value = 'success';
    feedbackMessage.value = `Đã tạo đơn ${res.data.referenceCode}. Admin sẽ duyệt sau khi đối soát thanh toán.`;
    feedbackOpen.value = true;
  } catch (err: any) {
    feedbackColor.value = 'error';
    feedbackMessage.value = err.response?.data?.error || 'Không thể tạo đơn thanh toán.';
    feedbackOpen.value = true;
  } finally {
    paymentSubmitting.value = false;
  }
};

const copyText = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    feedbackColor.value = 'success';
    feedbackMessage.value = 'Đã sao chép thông tin.';
    feedbackOpen.value = true;
  } catch (_error) {
    feedbackColor.value = 'error';
    feedbackMessage.value = 'Không thể sao chép vào clipboard.';
    feedbackOpen.value = true;
  }
};

const renderComparisonValue = (value: ComparisonValue) => {
  if (value === true) return '✓';
  if (value === false) return '—';
  return value;
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');

.pricing-page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background:
    radial-gradient(circle at top left, rgba(37, 99, 235, 0.1), transparent 28%),
    linear-gradient(180deg, #f8fbff 0%, #f8fafc 45%, #eef4ff 100%);
  color: var(--color-text);
  font-family: 'Manrope', sans-serif;
}

.pricing-page--dark {
  background:
    radial-gradient(circle at top left, rgba(96, 165, 250, 0.14), transparent 26%),
    linear-gradient(180deg, #08101f 0%, #0f172a 52%, #101b31 100%);
}

.pricing-page__container {
  position: relative;
  z-index: 1;
}

.pricing-page__aurora,
.pricing-page__grid {
  pointer-events: none;
  position: absolute;
}

.pricing-page__aurora {
  border-radius: 999px;
  filter: blur(70px);
  opacity: 0.18;
}

.pricing-page__aurora--primary {
  top: -100px;
  right: -80px;
  width: 420px;
  height: 420px;
  background: #2563eb;
}

.pricing-page__aurora--secondary {
  left: -120px;
  top: 420px;
  width: 360px;
  height: 360px;
  background: #0f766e;
}

.pricing-page__grid {
  inset: 0;
  background-image:
    linear-gradient(rgba(148, 163, 184, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148, 163, 184, 0.08) 1px, transparent 1px);
  background-size: 36px 36px;
  mask-image: linear-gradient(180deg, rgba(255, 255, 255, 0.4), transparent 70%);
}

.hero-panel {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(320px, 0.85fr);
  gap: 22px;
  align-items: stretch;
}

.hero-copy,
.hero-summary,
.insight-card,
.plan-card,
.comparison-shell,
.topup-card,
.faq-panel,
.payment-card,
.payment-summary,
.payment-info,
.qr-box {
  border: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.76);
  box-shadow: var(--shadow-sm);
  backdrop-filter: blur(18px);
}

.pricing-page--dark .hero-copy,
.pricing-page--dark .hero-summary,
.pricing-page--dark .insight-card,
.pricing-page--dark .plan-card,
.pricing-page--dark .comparison-shell,
.pricing-page--dark .topup-card,
.pricing-page--dark .faq-panel,
.pricing-page--dark .payment-card,
.pricing-page--dark .payment-summary,
.pricing-page--dark .payment-info,
.pricing-page--dark .qr-box {
  background: rgba(19, 32, 59, 0.78);
}

.hero-copy {
  padding: 36px;
  border-radius: 32px;
}

.hero-summary {
  padding: 24px;
  border-radius: 32px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.eyebrow-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid rgba(37, 99, 235, 0.16);
  background: rgba(37, 99, 235, 0.08);
  color: var(--color-primary-strong);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.eyebrow-chip--soft {
  background: rgba(15, 23, 42, 0.04);
  border-color: var(--color-border);
  color: var(--color-text-secondary);
}

.eyebrow-chip--inverted {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.16);
  color: #fff;
}

.hero-title {
  max-width: 12ch;
  color: var(--color-text);
  font-size: clamp(2.7rem, 5vw, 4.8rem);
  line-height: 1;
  letter-spacing: -0.06em;
  font-weight: 900;
}

.hero-title__accent {
  display: block;
  color: transparent;
  background: linear-gradient(135deg, #2563eb 0%, #0891b2 42%, #0f766e 100%);
  -webkit-background-clip: text;
  background-clip: text;
}

.hero-description,
.section-subtitle,
.summary-card__hint,
.insight-card p,
.plan-card__description,
.price-block__meta,
.payment-card__subtitle,
.payment-caption,
.faq-panel__text,
.topup-card__tokens {
  color: var(--color-text-secondary);
  line-height: 1.75;
}

.hero-description {
  max-width: 60ch;
  font-size: 1.02rem;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
}

.billing-switch {
  display: inline-flex;
  gap: 8px;
  padding: 8px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.05);
  border: 1px solid var(--color-border);
}

.billing-switch__option {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  border: 0;
  background: transparent;
  color: var(--color-text-secondary);
  padding: 12px 18px;
  border-radius: 999px;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  transition: 0.22s ease;
}

.billing-switch__option--active {
  background: var(--gradient-brand);
  color: #fff;
  box-shadow: 0 14px 28px rgba(37, 99, 235, 0.22);
}

.billing-switch--small {
  padding: 4px;
  gap: 4px;
}

.billing-switch--small .billing-switch__option {
  padding: 6px 14px;
  font-size: 0.85rem;
  font-weight: 800;
}

.billing-switch__badge {
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
  font-size: 0.72rem;
}

.hero-note {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--color-text-secondary);
  font-size: 0.95rem;
}

.summary-card {
  padding: 20px;
  border-radius: 24px;
  background: linear-gradient(145deg, rgba(37, 99, 235, 0.1), rgba(15, 23, 42, 0.02));
  border: 1px solid rgba(37, 99, 235, 0.18);
}

.summary-card__label,
.summary-metric__label,
.quota-panel__label,
.feature-stack__title,
.insight-card__label,
.payment-summary__label {
  display: block;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.summary-card__value {
  margin-top: 10px;
  font-size: 1.8rem;
  font-weight: 900;
  color: var(--color-text);
}

.summary-metrics {
  display: grid;
  gap: 14px;
}

.summary-metric {
  padding: 18px 20px;
  border-radius: 22px;
  background: rgba(15, 23, 42, 0.04);
  border: 1px solid var(--color-border);
}

.summary-metric__value {
  display: block;
  margin-top: 8px;
  font-size: 1.25rem;
  font-weight: 900;
  color: var(--color-text);
}

.insight-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  margin-top: 18px;
}

.insight-card {
  padding: 22px;
  border-radius: 28px;
}

.insight-card__value {
  display: block;
  margin: 12px 0 10px;
  font-size: 1.2rem;
  font-weight: 850;
  color: var(--color-text);
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 18px;
}

.section-title {
  margin: 0;
  color: var(--color-text);
  font-size: clamp(1.6rem, 2.5vw, 2.4rem);
  font-weight: 900;
  letter-spacing: -0.04em;
}

.section-subtitle {
  max-width: 56ch;
  margin: 0;
}

.pricing-grid {
  row-gap: 18px;
}

.plan-card {
  position: relative;
  border-radius: 32px !important;
  overflow: hidden;
  animation: rise-in 0.5s ease both;
}

.plan-card--featured {
  background:
    radial-gradient(circle at top right, rgba(37, 99, 235, 0.18), transparent 28%),
    rgba(255, 255, 255, 0.84);
  border-color: rgba(37, 99, 235, 0.25) !important;
  box-shadow: 0 26px 55px rgba(37, 99, 235, 0.14);
}

.pricing-page--dark .plan-card--featured {
  background:
    radial-gradient(circle at top right, rgba(96, 165, 250, 0.24), transparent 30%),
    rgba(19, 32, 59, 0.88);
}

.plan-card--current {
  border-color: rgba(16, 185, 129, 0.28) !important;
}

.plan-card__top {
  display: flex;
  justify-content: space-between;
  align-items: start;
  gap: 12px;
}

.plan-card__pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 800;
}

.plan-card__pill--neutral {
  background: rgba(15, 23, 42, 0.06);
  color: var(--color-text-secondary);
}

.plan-card__pill--primary {
  background: rgba(37, 99, 235, 0.1);
  color: var(--color-primary-strong);
}

.plan-card__pill--accent {
  background: rgba(15, 118, 110, 0.1);
  color: #0f766e;
}

.pricing-page--dark .plan-card__pill--accent {
  color: #5eead4;
}

.plan-card__name {
  margin: 0;
  font-size: 1.7rem;
  font-weight: 900;
  color: var(--color-text);
  letter-spacing: -0.03em;
}

.featured-chip {
  padding: 8px 12px;
  border-radius: 999px;
  background: var(--gradient-brand);
  color: #fff;
  font-size: 0.75rem;
  font-weight: 800;
  white-space: nowrap;
}

.price-block__main {
  display: flex;
  align-items: baseline;
  gap: 6px;
  color: var(--color-text);
}

.price-block__currency {
  font-size: 1.2rem;
  font-weight: 700;
}

.price-block__amount {
  font-size: clamp(2.7rem, 4vw, 4rem);
  line-height: 0.92;
  letter-spacing: -0.06em;
  font-weight: 900;
}

.price-block__period {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text-secondary);
}

.quota-panel {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  padding: 16px;
  border-radius: 24px;
  background: rgba(15, 23, 42, 0.04);
  border: 1px solid var(--color-border);
}

.quota-panel__item strong {
  display: block;
  margin-top: 8px;
  color: var(--color-text);
  font-size: 1.1rem;
  font-weight: 850;
}

.feature-stack {
  display: grid;
  gap: 12px;
}

.feature-row {
  display: flex;
  align-items: start;
  gap: 10px;
  color: var(--color-text);
  line-height: 1.65;
}

.plan-card__cta {
  font-weight: 800 !important;
  letter-spacing: 0 !important;
}

.plan-card__cta--featured {
  box-shadow: 0 18px 36px rgba(37, 99, 235, 0.2);
}

.comparison-shell {
  overflow: hidden;
  border-radius: 28px;
}

.comparison-table {
  background: transparent !important;
}

.comparison-table :deep(th) {
  background: rgba(15, 23, 42, 0.04);
  color: var(--color-text);
  font-size: 0.92rem;
  font-weight: 800;
  border-bottom: 1px solid var(--color-border) !important;
}

.comparison-table :deep(td) {
  color: var(--color-text);
  border-bottom: 1px solid rgba(148, 163, 184, 0.18) !important;
  font-weight: 600;
}

.comparison-table__label {
  min-width: 220px;
}

.comparison-table__highlight {
  background: rgba(37, 99, 235, 0.06);
}

.topup-card {
  border-radius: 28px !important;
}

.topup-card__icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 18px;
  background: rgba(37, 99, 235, 0.1);
}

.topup-card__name,
.payment-card__title {
  color: var(--color-text);
  margin: 0;
  font-weight: 900;
  letter-spacing: -0.03em;
}

.payment-card__title {
  color: #fff;
  font-size: 2rem;
}

.topup-card__quota {
  color: var(--color-text);
  font-size: 1.45rem;
  font-weight: 900;
  letter-spacing: -0.04em;
}

.topup-card__price {
  color: var(--color-text);
  font-size: 1.15rem;
  font-weight: 850;
}

.faq-section {
  padding-bottom: 48px;
}

.faq-panels {
  background: transparent !important;
}

.faq-panel {
  border-radius: 24px !important;
  margin-bottom: 14px;
  overflow: hidden;
}

.faq-panel::before {
  display: none;
}

.faq-panel__title {
  color: var(--color-text);
  font-weight: 800;
}

.payment-card {
  display: flex;
  flex-direction: column;
  max-height: 90vh; /* Constrain to viewport for scrolling */
  overflow: hidden;
  border-radius: 30px !important;
}

.scrollable-content {
  flex: 1 1 auto;
  overflow-y: auto;
  min-height: 0; /* Crucial for scrolling inside flexbox */
}

.payment-card__hero {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: start;
  background: linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%);
}

.payment-card__subtitle {
  color: rgba(255, 255, 255, 0.74);
  max-width: 52ch;
}

.payment-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 18px;
  padding: 20px;
  border-radius: 24px;
}

.payment-summary__amount {
  margin-top: 6px;
  font-size: 1.7rem;
  font-weight: 900;
  color: var(--color-text);
}

.payment-summary__badge {
  padding: 10px 14px;
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.1);
  color: var(--color-primary-strong);
  font-size: 0.82rem;
  font-weight: 800;
}

.qr-box {
  border-radius: 24px;
}

.payment-info {
  display: grid;
  gap: 14px;
  padding: 20px;
  border-radius: 24px;
}

.payment-info__row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.payment-info__row span {
  color: var(--color-text-muted);
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.payment-info__row strong {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  color: var(--color-text);
  font-size: 1rem;
  font-weight: 850;
}

.payment-info__content {
  color: var(--color-primary-strong) !important;
}

.payment-caption {
  display: flex;
  align-items: center;
  justify-content: center;
}

.payment-steps {
  display: grid;
  gap: 12px;
}

.payment-step {
  display: flex;
  align-items: start;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 20px;
  background: rgba(15, 23, 42, 0.04);
  border: 1px solid var(--color-border);
}

.payment-step p {
  color: var(--color-text);
  line-height: 1.6;
}

.payment-step__index {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  border-radius: 50%;
  background: var(--gradient-brand);
  color: #fff;
  font-size: 0.82rem;
  font-weight: 900;
}

@keyframes rise-in {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 1260px) {
  .hero-panel {
    grid-template-columns: 1fr;
  }

  .insight-strip {
    grid-template-columns: 1fr;
  }

  .section-head {
    flex-direction: column;
    align-items: start;
  }
}

@media (max-width: 960px) {
  .hero-copy,
  .hero-summary {
    padding: 24px;
    border-radius: 28px;
  }

  .quota-panel {
    grid-template-columns: 1fr;
  }

  .comparison-shell {
    overflow-x: auto;
  }
}

@media (max-width: 600px) {
  .pricing-page__container {
    padding-top: 24px !important;
    padding-bottom: 32px !important;
  }

  .hero-title {
    max-width: none;
    font-size: 2.5rem;
  }

  .billing-switch {
    width: 100%;
    flex-direction: column;
    border-radius: 24px;
  }

  .billing-switch__option {
    justify-content: center;
  }

  .hero-note,
  .payment-summary {
    align-items: start;
    flex-direction: column;
  }

  .plan-card,
  .topup-card,
  .faq-panel {
    border-radius: 24px !important;
  }

  .payment-card__hero {
    flex-direction: column;
  }
}
</style>
