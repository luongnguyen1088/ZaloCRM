<template>
  <v-container fluid class="pa-6">
    <div class="d-flex align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1">Đào tạo AI</h1>
        <p class="text-medium-emphasis mb-0">Cung cấp kiến thức để AI tư vấn khách hàng chính xác hơn</p>
      </div>
      <v-spacer />
      <v-btn color="primary" prepend-icon="mdi-plus" rounded="lg" @click="openAddDialog">
        Thêm kiến thức
      </v-btn>
    </div>

    <!-- Stats & Filters -->
    <v-row class="mb-6">
      <v-col cols="12" md="8">
        <v-text-field
          v-model="search"
          prepend-inner-icon="mdi-magnify"
          label="Tìm kiếm kiến thức..."
          variant="solo-filled"
          flat
          rounded="lg"
          hide-details
          class="glass-search"
        />
      </v-col>
      <v-col cols="12" md="4">
        <v-select
          v-model="filterCategory"
          :items="categories"
          label="Danh mục"
          variant="solo-filled"
          flat
          rounded="lg"
          hide-details
        />
      </v-col>
    </v-row>

    <!-- Knowledge List -->
    <v-row v-if="loading">
      <v-col v-for="i in 6" :key="i" cols="12" md="4">
        <v-skeleton-loader type="article" class="glass-card" />
      </v-col>
    </v-row>

    <v-row v-else-if="filteredItems.length">
      <v-col v-for="item in filteredItems" :key="item.id" cols="12" md="4">
        <v-card class="glass-card h-100 d-flex flex-column" elevation="0">
          <v-card-title class="d-flex align-center pt-4">
            <v-chip size="x-small" color="primary" variant="flat" class="mr-2">{{ item.category }}</v-chip>
            <span class="text-subtitle-1 font-weight-bold text-truncate">{{ item.title }}</span>
          </v-card-title>
          
          <v-card-text class="flex-grow-1 py-2">
            <p class="text-body-2 text-medium-emphasis line-clamp-3 mb-0">
              {{ item.content }}
            </p>
          </v-card-text>

          <v-divider class="opacity-10" />
          
          <v-card-actions class="pa-3">
            <span class="text-caption text-disabled">
              Updated {{ formatDate(item.updatedAt) }}
            </span>
            <v-spacer />
            <v-btn icon size="small" variant="text" @click="editItem(item)">
              <v-icon size="18">mdi-pencil-outline</v-icon>
            </v-btn>
            <v-btn icon size="small" variant="text" color="error" @click="confirmDelete(item)">
              <v-icon size="18">mdi-trash-can-outline</v-icon>
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <div v-else class="text-center py-16">
      <v-icon size="64" color="disabled" class="mb-4">mdi-database-off-outline</v-icon>
      <div class="text-h6 text-disabled">Chưa có dữ liệu đào tạo nào</div>
      <v-btn variant="text" color="primary" class="mt-2" @click="openAddDialog">Bắt đầu đào tạo ngay</v-btn>
    </div>

    <!-- Edit/Add Dialog -->
    <v-dialog v-model="editDialog.show" max-width="700" persistent>
      <v-card class="glass-card fallout-border" elevation="24">
        <v-card-title class="pa-6 pb-2">
          <div class="text-h5 font-weight-bold">{{ editDialog.isEdit ? 'Cập nhật kiến thức' : 'Thêm kiến thức mới' }}</div>
          <div class="text-caption text-medium-emphasis">AI sẽ sử dụng thông tin này để hỗ trợ trả lời khách hàng</div>
        </v-card-title>

        <v-card-text class="pa-6">
          <v-form ref="form" v-model="editDialog.valid">
            <v-row>
              <v-col cols="12" md="8">
                <v-text-field
                  v-model="editDialog.item.title"
                  label="Tiêu đề kiến thức"
                  placeholder="Ví dụ: Chính sách giao hàng"
                  variant="outlined"
                  required
                  :rules="[v => !!v || 'Vui lòng nhập tiêu đề']"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-combobox
                  v-model="editDialog.item.category"
                  :items="categories.filter(c => c !== 'Tất cả')"
                  label="Danh mục"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="editDialog.item.content"
                  label="Nội dung kiến thức"
                  placeholder="Mô tả chi tiết kiến thức bạn muốn AI nắm được..."
                  variant="outlined"
                  rows="10"
                  counter
                  required
                  :rules="[v => !!v || 'Vui lòng nhập nội dung']"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-divider class="opacity-10" />

        <v-card-actions class="pa-6">
          <v-spacer />
          <v-btn variant="text" rounded="lg" @click="editDialog.show = false">Hủy</v-btn>
          <v-btn
            color="primary"
            rounded="lg"
            variant="flat"
            class="px-6"
            :loading="saving"
            @click="saveItem"
          >
            {{ editDialog.isEdit ? 'Cập nhật' : 'Thêm ngay' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation -->
    <v-dialog v-model="deleteDialog.show" max-width="400">
      <v-card class="glass-card" elevation="24">
        <v-card-title class="pa-6">Xác nhận xóa?</v-card-title>
        <v-card-text class="px-6 pb-6 pt-0">
          Bạn có chắc chắn muốn xóa mẩu kiến thức <strong>{{ deleteDialog.item?.title }}</strong>? Hành động này không thể hoàn tác.
        </v-card-text>
        <v-card-actions class="pa-6 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog.show = false">Hủy</v-btn>
          <v-btn color="error" variant="flat" :loading="deleting" @click="doDelete">Xóa bỏ</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { api } from '@/api';
import dayjs from 'dayjs';

const loading = ref(true);
const saving = ref(false);
const deleting = ref(false);
const search = ref('');
const filterCategory = ref('Tất cả');
const items = ref<any[]>([]);

const categories = computed(() => {
  const cats = new Set(items.value.map(i => i.category).filter(Boolean));
  return ['Tất cả', ...Array.from(cats)];
});

const filteredItems = computed(() => {
  return items.value.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(search.value.toLowerCase()) || 
                         item.content.toLowerCase().includes(search.value.toLowerCase());
    const matchesCat = filterCategory.value === 'Tất cả' || item.category === filterCategory.value;
    return matchesSearch && matchesCat;
  });
});

const editDialog = ref({
  show: false,
  isEdit: false,
  valid: true,
  item: { id: '', title: '', content: '', category: 'Chung' }
});

const deleteDialog = ref({
  show: false,
  item: null as any
});

async function loadData() {
  loading.value = true;
  try {
    const res = await api.get('/ai/knowledge');
    items.value = res.data;
  } catch (err) {
    console.error('Failed to load knowledge:', err);
  } finally {
    loading.value = false;
  }
}

function openAddDialog() {
  editDialog.value = {
    show: true,
    isEdit: false,
    valid: true,
    item: { id: '', title: '', content: '', category: 'Chung' }
  };
}

function editItem(item: any) {
  editDialog.value = {
    show: true,
    isEdit: true,
    valid: true,
    item: { ...item }
  };
}

async function saveItem() {
  if (!editDialog.value.valid) return;
  saving.value = true;
  try {
    if (editDialog.value.isEdit) {
      await api.put(`/ai/knowledge/${editDialog.value.item.id}`, editDialog.value.item);
    } else {
      await api.post('/ai/knowledge', editDialog.value.item);
    }
    await loadData();
    editDialog.value.show = false;
  } catch (err) {
    console.error('Failed to save knowledge:', err);
  } finally {
    saving.value = false;
  }
}

function confirmDelete(item: any) {
  deleteDialog.value = {
    show: true,
    item
  };
}

async function doDelete() {
  if (!deleteDialog.value.item) return;
  deleting.value = true;
  try {
    await api.delete(`/ai/knowledge/${deleteDialog.value.item.id}`);
    await loadData();
    deleteDialog.value.show = false;
  } catch (err) {
    console.error('Failed to delete knowledge:', err);
  } finally {
    deleting.value = false;
  }
}

function formatDate(date: string) {
  return dayjs(date).format('DD/MM/YYYY HH:mm');
}

onMounted(loadData);
</script>

<style scoped>
.glass-card {
  background: rgba(255, 255, 255, 0.03) !important;
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  border-radius: 16px !important;
  transition: all 0.3s ease;
}
.glass-card:hover {
  background: rgba(255, 255, 255, 0.05) !important;
  border-color: var(--v-primary-base) !important;
  transform: translateY(-4px);
}
.glass-search {
  background: rgba(255, 255, 255, 0.05) !important;
}
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
