<template>
  <v-container fluid class="pa-6 fill-height d-flex flex-column">
    <!-- Header -->
    <div class="d-flex align-center mb-4 flex-shrink-0">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1 gradient-text">Đào tạo AI</h1>
        <p class="text-medium-emphasis mb-0">Xây dựng "bộ não" riêng cho trợ lý Zalo của bạn</p>
      </div>
      <v-spacer />
      <v-btn variant="outlined" color="primary" prepend-icon="mdi-plus" rounded="xl" @click="openAddDialog" class="mr-2">
        Thêm thủ công
      </v-btn>
    </div>

    <!-- Main Content Area -->
    <v-row class="flex-grow-1 overflow-hidden">
      <!-- Left Side: Knowledge Management -->
      <v-col cols="12" md="7" class="d-flex flex-column h-100 overflow-hidden">
        
        <!-- Magic Add Console -->
        <v-card class="magic-console mb-6 pa-1 flex-shrink-0" elevation="12">
          <div class="d-flex align-center pa-2 px-4 justify-space-between">
            <div class="d-flex align-center">
              <v-icon color="primary" class="mr-2 animate-sparkle">mdi-sparkles</v-icon>
              <span class="text-subtitle-2 font-weight-bold primary--text">NẠP NHANH BẰNG AI (1-CLICK)</span>
            </div>
            <!-- Templates Dropdown -->
            <v-menu>
              <template v-slot:activator="{ props }">
                <v-btn v-bind="props" variant="text" size="small" color="secondary" prepend-icon="mdi-text-box-plus-outline">
                  Sử dụng mẫu kiến thức
                </v-btn>
              </template>
              <v-list class="glass-list" density="compact">
                <v-list-item v-for="(t, i) in templates" :key="i" :title="t.name" @click="applyTemplate(t)">
                  <template v-slot:prepend>
                    <v-icon size="small">{{ t.icon }}</v-icon>
                  </template>
                </v-list-item>
              </v-list>
            </v-menu>
          </div>
          <div class="pa-3 pt-1">
            <v-textarea
              v-model="magicInput"
              placeholder="Dán bất kỳ nội dung nào hoặc chọn một mẫu kiến thức phía trên..."
              variant="plain"
              bg-color="transparent"
              rows="3"
              hide-details
              class="magic-textarea"
              :disabled="savingMagic"
              @keyup.ctrl.enter="runMagicAdd"
            />
            <div class="d-flex align-center mt-2 px-1">
              <span class="text-caption text-disabled">Nhấn Ctrl + Enter để nạp nhanh</span>
              <v-spacer />
              <v-btn 
                color="primary" 
                variant="flat" 
                rounded="lg" 
                size="small" 
                :loading="savingMagic"
                :disabled="!magicInput.trim()"
                @click="runMagicAdd"
              >
                Tự động nạp kiến thức
              </v-btn>
            </div>
          </div>
        </v-card>

        <div class="glass-container pa-4 flex-grow-1 d-flex flex-column overflow-hidden">
          <!-- Search & Filters -->
          <v-row dense class="mb-4 flex-shrink-0">
            <v-col cols="12" sm="8">
              <v-text-field
                v-model="search"
                prepend-inner-icon="mdi-magnify"
                label="Tìm kiếm nội dung đã nạp..."
                variant="outlined"
                density="comfortable"
                rounded="lg"
                hide-details
                class="search-input"
              />
            </v-col>
            <v-col cols="12" sm="4">
              <v-select
                v-model="filterCategory"
                :items="categories"
                label="Danh mục"
                variant="outlined"
                density="comfortable"
                rounded="lg"
                hide-details
              />
            </v-col>
          </v-row>

          <!-- Scrollable List -->
          <div class="overflow-y-auto pr-2 flex-grow-1 custom-scrollbar">
            <v-row v-if="loading">
              <v-col v-for="i in 4" :key="i" cols="12">
                <v-skeleton-loader type="list-item-three-line" class="glass-card mb-4" />
              </v-col>
            </v-row>

            <v-row v-else-if="filteredItems.length" dense>
              <v-col v-for="item in filteredItems" :key="item.id" cols="12">
                <v-card class="knowledge-card mb-3" elevation="0" border>
                  <div class="d-flex pa-4">
                    <div class="mr-4 mt-1">
                      <v-avatar color="primary-lighten-4" size="40">
                        <v-icon color="primary" size="20">{{ getCategoryIcon(item.category) }}</v-icon>
                      </v-avatar>
                    </div>
                    <div class="flex-grow-1 overflow-hidden">
                      <div class="d-flex align-center mb-1">
                        <span class="text-subtitle-1 font-weight-bold truncate-1">{{ item.title }}</span>
                        <v-spacer />
                        <v-chip size="x-small" :color="item.isActive ? 'success' : 'grey'" variant="tonal" class="ml-2 px-2">
                          {{ item.isActive ? 'Đã học' : 'Tạm ẩn' }}
                        </v-chip>
                      </div>
                      <p class="text-body-2 text-medium-emphasis line-clamp-2 mb-2">
                        {{ item.content }}
                      </p>
                      <div class="d-flex align-center">
                        <v-chip size="x-small" variant="outlined" class="mr-2 text-caption px-2 opacity-60">
                          {{ item.category }}
                        </v-chip>
                        <div class="stats-badge mr-3" v-if="item.useCount > 0">
                          <v-icon size="14" class="mr-1">mdi-head-cog-outline</v-icon>
                          <span>Giúp ích {{ item.useCount }} lần</span>
                        </div>
                        <span class="text-caption text-disabled opacity-60">
                          Cập nhật: {{ formatDate(item.updatedAt) }}
                        </span>
                        <v-spacer />
                        <v-btn icon size="x-small" variant="text" color="primary" @click="editItem(item)">
                          <v-icon>mdi-pencil-outline</v-icon>
                        </v-btn>
                        <v-btn icon size="x-small" variant="text" color="error" @click="confirmDelete(item)">
                          <v-icon>mdi-trash-can-outline</v-icon>
                        </v-btn>
                      </div>
                    </div>
                  </div>
                </v-card>
              </v-col>
            </v-row>

            <div v-else class="text-center py-16 opacity-40">
              <v-icon size="64" class="mb-4">mdi-brain-outline</v-icon>
              <div class="text-h6">Chưa có kiến thức chuyên sâu</div>
              <p class="text-body-2">Hãy nạp thêm dữ liệu để AI thông minh hơn</p>
            </div>
          </div>
        </div>
      </v-col>

      <!-- Right Side: simulator -->
      <v-col cols="12" md="5" class="d-flex flex-column h-100 overflow-hidden">
        <div class="simulator-panel pa-0 flex-grow-1 d-flex flex-column position-relative overflow-hidden">
          <div class="pa-4 flex-shrink-0 d-flex align-center border-bottom glass-header">
            <v-icon color="secondary" class="mr-2">mdi-microsoft-xbox-controller</v-icon>
            <span class="text-subtitle-1 font-weight-bold">Trình giả lập AI-Agent</span>
            <v-spacer />
            <v-btn size="x-small" variant="text" color="primary" prepend-icon="mdi-delete-sweep" @click="testMessages = []">
              Xóa chat
            </v-btn>
          </div>

          <!-- Chat Area -->
          <div ref="chatContainer" class="flex-grow-1 overflow-y-auto pa-4 d-flex flex-column custom-scrollbar bg-dots">
            <div v-if="testMessages.length === 0" class="ma-auto text-center opacity-40 px-8">
              <v-icon size="48" class="mb-4">mdi-chat-question-outline</v-icon>
              <p class="text-body-2">Hỏi thử một câu bất kỳ để xem AI "vận dụng" kiến thức đã học như thế nào.</p>
            </div>
            
            <div v-for="(msg, i) in testMessages" :key="i" 
                 :class="['d-flex mb-4', msg.role === 'user' ? 'justify-end' : 'justify-start']">
              <div :class="['message-bubble', msg.role === 'user' ? 'user-bubble' : 'ai-bubble']">
                <div v-if="msg.role === 'ai'" class="text-caption font-weight-bold mb-1 primary--text">Hệ thống Đào tạo AI</div>
                {{ msg.content }}
              </div>
            </div>

            <div v-if="testing" class="d-flex justify-start mb-4">
              <div class="message-bubble ai-bubble d-flex align-center">
                <v-progress-circular indeterminate size="16" width="2" color="primary" class="mr-2" />
                <span class="text-caption">AI đang tra cứu bộ nhớ...</span>
              </div>
            </div>
          </div>

          <!-- Input Area -->
          <div class="pa-4 flex-shrink-0 glass-footer">
            <v-text-field
              v-model="testQuestion"
              placeholder="Hỏi thử AI một câu bất kỳ..."
              variant="solo"
              density="comfortable"
              flat
              rounded="pill"
              hide-details
              @keyup.enter="runTest"
              :disabled="testing"
              class="simulator-input"
            >
              <template v-slot:append-inner>
                <v-btn icon size="small" color="primary" variant="flat" :loading="testing" @click="runTest">
                  <v-icon>mdi-send</v-icon>
                </v-btn>
              </template>
            </v-text-field>
          </div>
        </div>
      </v-col>
    </v-row>

    <!-- Knowledge Form Dialog -->
    <v-dialog v-model="editDialog.show" max-width="800" persistent transition="dialog-bottom-transition">
      <v-card class="form-dialog" elevation="24">
        <v-toolbar color="primary" density="comfortable">
          <v-toolbar-title class="text-subtitle-1 font-weight-bold">
            {{ editDialog.isEdit ? 'Cập nhật tri thức' : 'Bắt đầu nạp tri thức mới' }}
          </v-toolbar-title>
          <v-btn icon @click="editDialog.show = false"><v-icon>mdi-close</v-icon></v-btn>
        </v-toolbar>

        <v-card-text class="pa-6">
          <v-form ref="form" v-model="editDialog.valid">
            <v-row dense>
              <v-col cols="12" md="8">
                <v-text-field
                  v-model="editDialog.item.title"
                  label="Tiêu đề gợi nhớ"
                  placeholder="Ví dụ: Chính sách miễn phí vận chuyển"
                  variant="outlined"
                  required
                  :rules="[v => !!v || 'Cần có tiêu đề']"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-combobox
                  v-model="editDialog.item.category"
                  :items="filterCategoriesOnly"
                  label="Phân loại"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="editDialog.item.content"
                  label="Dữ liệu kiến thức (Nội dung)"
                  placeholder="Mô tả kỹ nội dung này. AI sẽ dựa vào đây để trả lời khách hàng."
                  variant="outlined"
                  rows="8"
                  counter
                  required
                  :rules="[v => !!v || 'Bạn chưa nhập kiến thức']"
                />
              </v-col>
              <v-col cols="12" class="pt-4">
                <v-switch
                  v-model="editDialog.item.isActive"
                  label="Kích hoạt kiến thức này ngay lập tức"
                  color="success"
                  hide-details
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-6 bg-grey-lighten-4">
          <v-spacer />
          <v-btn variant="text" rounded="lg" class="px-6" @click="editDialog.show = false">Để sau</v-btn>
          <v-btn
            color="primary"
            rounded="xl"
            variant="flat"
            class="px-8"
            size="large"
            :loading="saving"
            @click="saveItem"
          >
            {{ editDialog.isEdit ? 'Lưu thay đổi' : 'Xác nhận đào tạo' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Dialog -->
    <v-dialog v-model="deleteDialog.show" max-width="400">
      <v-card class="rounded-xl overflow-hidden">
        <v-card-title class="bg-error text-white pa-4">Xóa kiến thức này?</v-card-title>
        <v-card-text class="pa-6">
          AI sẽ "quên" hoàn toàn kiến thức: <strong>{{ deleteDialog.item?.title }}</strong>. Bạn chắc chắn chứ?
        </v-card-text>
        <v-card-actions class="pa-6 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog.show = false">Quay lại</v-btn>
          <v-btn color="error" variant="flat" rounded="lg" :loading="deleting" @click="doDelete">Xóa vĩnh viễn</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Success Snackbar -->
    <v-snackbar v-model="toast.show" :color="toast.color" rounded="pill" elevation="12">
      <div class="d-flex align-center">
        <v-icon class="mr-2">{{ toast.icon }}</v-icon>
        {{ toast.text }}
      </div>
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from 'vue';
import { api } from '@/api';

const loading = ref(true);
const saving = ref(false);
const deleting = ref(false);
const testing = ref(false);
const savingMagic = ref(false);
const search = ref('');
const filterCategory = ref('Tất cả');
const items = ref<any[]>([]);

// Templates
const templates = [
  { name: 'Chính sách vận chuyển', icon: 'mdi-truck-delivery', content: 'Shop mình [miễn phí ship] cho đơn hàng từ [XXX k]. Các tỉnh khác phí ship đồng giá [YY k]. Thời gian nhận hàng từ [2-4 ngày].' },
  { name: 'Bảng giá sản phẩm', icon: 'mdi-currency-usd', content: 'Hiện tại shop có các dòng sản phẩm chính:\n1. [Tên SP 1]: Giá [Giá 1]\n2. [Tên SP 2]: Giá [Giá 2]\nKhách mua từ [Số lượng] sẽ được giá sỉ.' },
  { name: 'Chính sách đổi trả', icon: 'mdi-swap-horizontal', content: 'Hỗ trợ đổi trả trong vòng [7 ngày] kể từ khi nhận hàng. Điều kiện: [Sản phẩm còn nguyên tem mác, chưa qua sử dụng]. Phí ship đổi trả do [Khách hàng/Shop] chịu tùy trường hợp.' },
  { name: 'Thông tin chuyển khoản', icon: 'mdi-bank', content: 'Quý khách vui lòng chuyển khoản qua:\nNgân hàng: [Tên NH]\nSTK: [Số tài khoản]\nChủ TK: [Tên chủ TK]\nNội dung: [Tên + SĐT].' },
  { name: 'Khuyến mãi hiện có', icon: 'mdi-tag-heart', content: 'Trong tháng này shop đang có chương trình: [Mô tả KM]. Áp dụng cho khách hàng [Cũ/Mới]. Thời hạn đến hết ngày [Ngày].' }
];

// Simulator & Magic State
const magicInput = ref('');
const testQuestion = ref('');
const testMessages = ref<any[]>([]);
const chatContainer = ref<HTMLElement | null>(null);
const toast = ref({ show: false, text: '', color: 'success', icon: 'mdi-check-circle' });

const categories = computed(() => {
  const cats = new Set(items.value.map(i => i.category).filter(Boolean));
  return ['Tất cả', ...Array.from(cats)];
});

const filterCategoriesOnly = computed(() => {
  return categories.value.filter(c => c !== 'Tất cả');
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
  item: { id: '', title: '', content: '', category: 'Chung', isActive: true }
});

const deleteDialog = ref({ show: false, item: null as any });

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

function applyTemplate(t: any) {
  magicInput.value = t.content;
}

async function runMagicAdd() {
  if (!magicInput.value.trim() || savingMagic.value) return;
  savingMagic.value = true;
  const content = magicInput.value;
  
  try {
    const analysis = await api.post('/ai/knowledge/analyze', { content });
    await api.post('/ai/knowledge', {
      title: analysis.data.title,
      category: analysis.data.category,
      content: content,
      isActive: true
    });
    
    toast.value = { show: true, text: `AI đã nạp chuyên sâu: ${analysis.data.title}`, color: 'success', icon: 'mdi-sparkles' };
    magicInput.value = '';
    await loadData();
  } catch (err) {
    toast.value = { show: true, text: 'Nạp nhanh thất bại, hãy thử lại thủ công', color: 'error', icon: 'mdi-alert' };
  } finally {
    savingMagic.value = false;
  }
}

function openAddDialog() {
  editDialog.value = {
    show: true, isEdit: false, valid: true,
    item: { id: '', title: '', content: '', category: 'Chung', isActive: true }
  };
}

function editItem(item: any) {
  editDialog.value = { show: true, isEdit: true, valid: true, item: { ...item } };
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
  deleteDialog.value = { show: true, item };
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

async function runTest() {
  if (!testQuestion.value || testing.value) return;
  const q = testQuestion.value;
  testMessages.value.push({ role: 'user', content: q });
  testQuestion.value = '';
  testing.value = true;
  scrollToBottom();
  try {
    const res = await api.post('/ai/knowledge/test', { question: q });
    testMessages.value.push({ role: 'ai', content: res.data.content });
    loadData();
  } catch (err: any) {
    testMessages.value.push({ role: 'ai', content: 'Lỗi kết nối AI' });
  } finally {
    testing.value = false;
    scrollToBottom();
  }
}

function scrollToBottom() {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
    }
  });
}

function getCategoryIcon(cat: string) {
  const c = cat?.toLowerCase() || '';
  if (c.includes('giá') || c.includes('tiền')) return 'mdi-currency-usd';
  if (c.includes('giao') || c.includes('vận')) return 'mdi-truck-delivery';
  if (c.includes('bảo hành') || c.includes('hỗ trợ')) return 'mdi-shield-check';
  if (c.includes('chung')) return 'mdi-database-outline';
  return 'mdi-lightbulb-outline';
}

function formatDate(date: string) {
  if (!date) return '';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  }).format(new Date(date));
}

onMounted(loadData);
</script>

<style scoped>
.gradient-text { background: linear-gradient(90deg, #00F2FF, #0072FF); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.magic-console { background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.08), rgba(0, 0, 0, 0.4)) !important; border: 1px solid rgba(var(--v-theme-primary), 0.2) !important; border-radius: 16px !important; position: relative; overflow: hidden; }
.magic-textarea :deep(.v-field__input) { font-size: 14px; line-height: 1.6; }
.glass-container { background: rgba(255, 255, 255, 0.02); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 20px; }
.knowledge-card { background: rgba(255, 255, 255, 0.03) !important; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.05) !important; }
.stats-badge { display: inline-flex; align-items: center; background: rgba(76, 175, 80, 0.1); color: #4CAF50; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 500; border: 1px solid rgba(76, 175, 80, 0.2); }
.simulator-panel { background: rgba(0, 0, 0, 0.2); border-radius: 20px; }
.message-bubble { padding: 10px 16px; border-radius: 18px; max-width: 85%; font-size: 14px; }
.user-bubble { background: #0072FF; color: white; border-bottom-right-radius: 4px; }
.ai-bubble { background: rgba(255,255,255,0.08); color: white; border-bottom-left-radius: 4px; }
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
.glass-list { background: rgba(20, 20, 20, 0.9) !important; backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1); }
.animate-sparkle { animation: sparkle 2s infinite; }
@keyframes sparkle { 0%, 100% { opacity: 0.5; transform: scale(1); } 50% { opacity: 1; transform: scale(1.1); } }
.primary--text { color: #00F2FF; }
.truncate-1 { display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
</style>
