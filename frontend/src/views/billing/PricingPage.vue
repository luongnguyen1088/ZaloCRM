<template>
  <v-container class="py-12">
    <div class="text-center mb-12">
      <h1 class="text-h3 font-weight-bold mb-4">Nâng cấp gói cước ZaloCRM</h1>
      <p class="text-h6 text-medium-emphasis">
        Chọn gói cước phù hợp để tối ưu hóa việc quản lý Zalo và chăm sóc khách hàng.
      </p>
    </div>

    <v-row justify="center">
      <v-col v-for="plan in plans" :key="plan.id" cols="12" md="4">
        <v-card
          :class="{ 'elevation-12': plan.name === 'Pro' }"
          rounded="xl"
          class="pa-6 fill-height d-flex flex-column"
          :border="plan.name === 'Pro' ? 'primary solid 2px' : ''"
        >
          <div class="text-overline text-primary mb-2" v-if="plan.name === 'Pro'">🏆 PHỔ BIẾN NHẤT</div>
          <h2 class="text-h4 font-weight-bold mb-2">{{ plan.name }}</h2>
          <div class="d-flex align-end mb-6">
            <span class="text-h4 font-weight-bold">{{ formatPrice(plan.priceMonth) }}</span>
            <span class="text-medium-emphasis ml-1" v-if="plan.priceMonth > 0">/tháng</span>
          </div>

          <v-divider class="mb-6"></v-divider>

          <v-list density="compact" class="bg-transparent flex-grow-1">
            <v-list-item v-for="(feature, idx) in parseFeatures(plan.features)" :key="idx" class="px-0">
              <template v-slot:prepend>
                <v-icon color="success" icon="mdi-check-circle"></v-icon>
              </template>
              <v-list-item-title>{{ feature }}</v-list-item-title>
            </v-list-item>
            
            <v-list-item class="px-0">
              <template v-slot:prepend>
                <v-icon color="success" icon="mdi-check-circle"></v-icon>
              </template>
              <v-list-item-title>Tối đa <strong>{{ plan.maxZaloAcc }}</strong> tài khoản Zalo</v-list-item-title>
            </v-list-item>

            <v-list-item class="px-0">
              <template v-slot:prepend>
                <v-icon color="success" icon="mdi-check-circle"></v-icon>
              </template>
              <v-list-item-title><strong>{{ plan.maxAiTokens }}</strong> AI tokens /tháng</v-list-item-title>
            </v-list-item>
          </v-list>

          <v-btn
            block
            :color="plan.name === 'Pro' ? 'primary' : 'secondary'"
            size="large"
            rounded="lg"
            class="mt-8"
            :variant="plan.name === 'Pro' ? 'flat' : 'outlined'"
            @click="selectPlan(plan)"
            :disabled="currentPlanId === plan.id"
          >
            {{ currentPlanId === plan.id ? 'Gói hiện tại' : 'Nâng cấp ngay' }}
          </v-btn>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="paymentDialog" max-width="500">
      <v-card v-if="selectedPlan" rounded="xl" class="pa-4">
        <v-card-title class="text-h5 font-weight-bold">Xác nhận nâng cấp</v-card-title>
        <v-card-text>
          Bạn đang chọn nâng cấp lên gói <strong>{{ selectedPlan.name }}</strong>.
          Vui lòng quét mã QR bên dưới để thanh toán và hệ thống sẽ tự động kích hoạt sau khi nhận được tiền.
          
          <div class="text-center my-6">
            <v-img src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=ZaloCRM-Payment" width="200" class="mx-auto"></v-img>
            <div class="mt-4 text-h6 font-weight-bold">Giá: {{ formatPrice(selectedPlan.priceMonth) }}</div>
          </div>
          
          <v-alert type="info" variant="tonal" class="mb-4">
            Nội dung chuyển khoản: <b>CRMPAY {{ selectedPlan.name }}</b>
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="paymentDialog = false">Đóng</v-btn>
          <v-btn color="primary" variant="flat" @click="confirmPayment">Tôi đã thanh toán</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';

const plans = ref<any[]>([]);
const currentPlanId = ref<string | null>(null);
const loading = ref(false);
const paymentDialog = ref(false);
const selectedPlan = ref<any>(null);

const fetchPlans = async () => {
  try {
    const res = await axios.get('/api/v1/billing/plans');
    plans.value = res.data;
  } catch (err) {
    console.error('Failed to fetch plans', err);
  }
};

const fetchSubscription = async () => {
  try {
    const res = await axios.get('/api/v1/billing/subscription');
    if (res.data) {
      currentPlanId.value = res.data.planId;
    }
  } catch (err) {
    console.error('Failed to fetch subscription', err);
  }
};

onMounted(() => {
  fetchPlans();
  fetchSubscription();
});

const formatPrice = (price: number) => {
  if (price === 0) return 'Miễn phí';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

const parseFeatures = (features: any) => {
  if (typeof features === 'string') {
    return JSON.parse(features);
  }
  return features || [];
};

const selectPlan = (plan: any) => {
  selectedPlan.value = plan;
  paymentDialog.value = true;
};

const confirmPayment = () => {
  // In a real app, this would check the backend for payment status
  paymentDialog.value = false;
  alert('Hệ thống đang kiểm tra thanh toán của bạn. Vui lòng chờ 1-2 phút!');
};
</script>
