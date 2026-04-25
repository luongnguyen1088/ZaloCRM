<template>
  <v-dialog v-model="internalValue" max-width="500" persistent>
    <v-card class="rounded-xl overflow-hidden">
      <div class="quota-header pa-6 text-center">
        <v-avatar size="80" color="primary-lighten-5" class="mb-4">
          <v-icon size="48" color="primary">mdi-lightning-bolt</v-icon>
        </v-avatar>
        <h2 class="text-h5 font-weight-bold mb-2">Hết hạn mức AI</h2>
        <p class="text-body-1 text-grey-darken-1">
          Bạn đã sử dụng hết số lượt phản hồi AI được cấp trong gói hiện tại. 
          Hãy mua thêm hoặc nâng cấp để tiếp tục sử dụng các tính năng thông minh.
        </p>
      </div>

      <v-card-text class="pa-6 pt-0">
        <v-list lines="two" class="bg-grey-lighten-4 rounded-lg mb-4">
          <v-list-item prepend-icon="mdi-check-circle" color="success">
            <v-list-item-title class="font-weight-bold">Tăng giới hạn lượt phản hồi</v-list-item-title>
            <v-list-item-subtitle>Nhận thêm hàng ngàn lượt phản hồi mỗi tháng</v-list-item-subtitle>
          </v-list-item>
          <v-list-item prepend-icon="mdi-check-circle" color="success">
            <v-list-item-title class="font-weight-bold">Ưu tiên xử lý</v-list-item-title>
            <v-list-item-subtitle>Tốc độ phản hồi AI nhanh hơn</v-list-item-subtitle>
          </v-list-item>
          <v-list-item prepend-icon="mdi-check-circle" color="success">
            <v-list-item-title class="font-weight-bold">Mở khóa mô hình cao cấp</v-list-item-title>
            <v-list-item-subtitle>Sử dụng Claude 3.5 Sonnet & GPT-4o</v-list-item-subtitle>
          </v-list-item>
        </v-list>

        <div class="d-flex flex-column ga-2">
          <v-btn
            color="primary"
            block
            height="48"
            class="rounded-lg shadow-primary font-weight-bold"
            prepend-icon="mdi-lightning-bolt"
            @click="goToPricing"
          >
            Mua thêm lượt phản hồi AI
          </v-btn>
          <v-btn
            variant="tonal"
            color="primary"
            block
            height="48"
            class="rounded-lg font-weight-bold"
            prepend-icon="mdi-arrow-up-bold-circle"
            @click="goToPricing"
          >
            Nâng cấp gói tháng
          </v-btn>
          <v-btn
            variant="text"
            block
            class="rounded-lg mt-2"
            @click="internalValue = false"
          >
            Để sau
          </v-btn>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits(['update:modelValue']);
const router = useRouter();

const internalValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

function goToPricing() {
  internalValue.value = false;
  router.push('/billing/pricing');
}
</script>

<style scoped>
.quota-header {
  background: linear-gradient(135deg, var(--color-primary-soft) 0%, #ffffff 100%);
}

.shadow-primary {
  box-shadow: 0 4px 15px var(--color-primary-soft-strong) !important;
}
</style>
