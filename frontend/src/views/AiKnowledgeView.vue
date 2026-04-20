<template>
  <v-container fluid class="pa-6 fill-height d-flex flex-column">
    <!-- Header -->
    <div class="d-flex align-center mb-4 flex-shrink-0">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1 gradient-text">Đào tạo AI</h1>
        <p class="text-medium-emphasis mb-0">X�y d?ng "b? n�o" ri�ng cho tr? l� Zalo c?a b?n</p>
      </div>
      <v-spacer />
      <v-btn variant="text" color="medium-emphasis" prepend-icon="mdi-help-circle-outline" rounded="xl" @click="showGuide = true" class="mr-2">
        Hướng dẫn
      </v-btn>
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
            
            <div class="d-flex align-center">
              <!-- Templates Dropdown -->
              <v-menu>
                <template v-slot:activator="{ props }">
                  <v-btn v-bind="props" variant="text" size="small" color="secondary" prepend-icon="mdi-text-box-plus-outline" class="mr-2">
                    Dùng mẫu
                  </v-btn>
                </template>
                <v-list class="glass-list" density="compact">
                  <v-list-item v-for="(t, i) in templates" :key="i" :title="t.name" @click="applyTemplate(t)">
                    <template v-slot:prepend><v-icon size="small">{{ t.icon }}</v-icon></template>
                  </v-list-item>
                </v-list>
              </v-menu>
            </div>
          </div>
          
          <div class="pa-3 pt-1">
            <v-textarea
              v-model="magicInput"
              placeholder="D�n n?i dung b?t k?... AI s? t? d?ng ph�n t�ch v� g�n cho d�ng Zalo shop."
              variant="plain"
              bg-color="transparent"
              rows="3"
              hide-details
              class="magic-textarea"
              :disabled="savingMagic"
              @keyup.ctrl.enter="runMagicAdd"
            />
            
            <div class="d-flex align-center mt-2 px-1">
              <v-select
                v-model="magicAccountId"
                :items="accountOptions"
                label="Áp dụng cho"
                variant="outlined"
                density="compact"
                hide-details
                rounded="lg"
                class="account-selector-mini"
                prepend-inner-icon="mdi-account-star-outline"
                style="max-width: 200px"
              ></v-select>
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
                Nạp kiến thức
              </v-btn>
            </div>
          </div>
        </v-card>

        <div class="glass-container pa-4 flex-grow-1 d-flex flex-column overflow-hidden">
          <!-- Search & Filters -->
          <v-row dense class="mb-4 flex-shrink-0">
            <v-col cols="12" sm="5">
              <v-text-field
                v-model="search"
                prepend-inner-icon="mdi-magnify"
                label="Tìm kiếm nội dung..."
                variant="outlined"
                density="comfortable"
                rounded="lg"
                hide-details
                class="search-input"
              />
            </v-col>
            <v-col cols="6" sm="3.5">
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
            <v-col cols="6" sm="3.5">
              <v-select
                v-model="filterAccount"
                :items="accountOptions"
                label="Tài khoản Zalo"
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
                          {{ item.isActive ? 'Đang học' : 'Tạm ẩn' }}
                        </v-chip>
                      </div>
                      
                      <p class="text-body-2 text-medium-emphasis line-clamp-2 mb-2">
                        {{ item.content }}
                      </p>
                      
                      <div class="d-flex align-center flex-wrap gap-2">
                        <v-chip size="x-small" variant="outlined" class="mr-2 px-2 opacity-60">
                          {{ item.category }}
                        </v-chip>
                        
                        <!-- Account specific badge -->
                        <v-chip size="x-small" :color="item.zaloAccountId ? 'secondary' : 'primary'" variant="tonal" class="mr-2 px-2">
                          <v-icon size="12" class="mr-1">{{ item.zaloAccountId ? 'mdi-account-check-outline' : 'mdi-earth' }}</v-icon>
                          {{ item.zaloAccount?.displayName || 'Tất cả tài khoản' }}
                        </v-chip>

                        <div class="stats-badge mr-2" v-if="item.useCount > 0">
                          <v-icon size="14" class="mr-1">mdi-head-cog-outline</v-icon>
                          <span>{{ item.useCount }}</span>
                        </div>
                        
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
              <div class="text-h6">Không tìm thấy kiến thức phù hợp</div>
            </div>
          </div>
        </div>
      </v-col>

      <!-- Right Side: simulator -->
      <v-col cols="12" md="5" class="d-flex flex-column h-100 overflow-hidden">
        <div class="simulator-panel pa-0 flex-grow-1 d-flex flex-column position-relative overflow-hidden">
          <div class="pa-4 flex-shrink-0 d-flex align-center border-bottom glass-header">
            <v-icon color="secondary" class="mr-2">mdi-microsoft-xbox-controller</v-icon>
            <span class="text-subtitle-1 font-weight-bold">Trình giả lập AI</span>
            
            <v-spacer />
            
            <v-select
              v-model="simAccountId"
              :items="accountOptions"
              label="Chat với tư cách"
              variant="outlined"
              density="compact"
              hide-details
              rounded="pill"
              class="account-selector-sim"
              style="max-width: 180px"
              @update:model-value="testMessages = []"
            ></v-select>
          </div>

          <!-- Chat Area -->
          <div ref="chatContainer" class="flex-grow-1 overflow-y-auto pa-4 d-flex flex-column custom-scrollbar bg-dots">
            <div v-if="testMessages.length === 0" class="ma-auto text-center opacity-40 px-8">
              <v-icon size="48" class="mb-4">mdi-chat-question-outline</v-icon>
              <p class="text-body-2">H?i th? m?t c�u b?t k? d? xem AI t?i t�i kho?n <strong>{{ currentSimAccountName }}</strong> s? tr? l?i th? n�o.</p>
            </div>
            
            <div v-for="(msg, i) in testMessages" :key="i" 
                 :class="['d-flex mb-4', msg.role === 'user' ? 'justify-end' : 'justify-start']">
              <div :class="['message-bubble', msg.role === 'user' ? 'user-bubble' : 'ai-bubble']">
                <div v-if="msg.role === 'ai'" class="text-caption font-weight-bold mb-1 primary--text">AI Agent ({{ currentSimAccountName }})</div>
                {{ msg.content }}
              </div>
            </div>

            <div v-if="testing" class="d-flex justify-start mb-4">
              <div class="message-bubble ai-bubble d-flex align-center">
                <v-progress-circular indeterminate size="16" width="2" color="primary" class="mr-2" />
                <span class="text-caption">Đang tra cứu tri thức riêng...</span>
              </div>
            </div>
          </div>

          <!-- Input Area -->
          <div class="pa-4 flex-shrink-0 glass-footer">
            <v-text-field
              v-model="testQuestion"
              placeholder="Bạn muốn hỏi gì?"
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
    <v-dialog v-model="editDialog.show" max-width="800" persistent>
      <v-card class="form-dialog">
        <v-toolbar color="primary" density="comfortable">
          <v-toolbar-title class="text-subtitle-1 font-weight-bold">
            {{ editDialog.isEdit ? 'Cập nhật tri thức' : 'Nạp tri thức mới' }}
          </v-toolbar-title>
          <v-btn icon @click="editDialog.show = false"><v-icon>mdi-close</v-icon></v-btn>
        </v-toolbar>

        <v-card-text class="pa-6">
          <v-form ref="form" v-model="editDialog.valid">
            <v-row dense>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editDialog.item.title"
                  label="Tiêu đề gợi nhớ"
                  variant="outlined"
                  required
                  :rules="[v => !!v || 'Cần có tiêu đề']"
                />
              </v-col>
              <v-col cols="12" md="3">
                <v-combobox
                  v-model="editDialog.item.category"
                  :items="filterCategoriesOnly"
                  label="Ph�n lo?i"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="12" md="3">
                <v-select
                  v-model="editDialog.item.zaloAccountId"
                  :items="accountOptions"
                  label="Áp dụng cho"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="editDialog.item.content"
                  label="Nội dung tri thức"
                  variant="outlined"
                  rows="8"
                  required
                  :rules="[v => !!v || 'Bạn chưa nhập kiến thức']"
                />
              </v-col>
              <v-col cols="12">
                <v-switch
                  v-model="editDialog.item.isActive"
                  label="Kích hoạt kiến thức này"
                  color="success"
                  hide-details
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions class="pa-6 bg-grey-lighten-4">
          <v-spacer />
          <v-btn variant="text" @click="editDialog.show = false">Hủy</v-btn>
          <v-btn color="primary" variant="flat" :loading="saving" @click="saveItem">Lưu tri thức</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Dialog -->
    <v-dialog v-model="deleteDialog.show" max-width="400">
      <v-card>
        <v-card-title class="bg-error text-white pa-4">Xóa tri thức?</v-card-title>
        <v-card-text class="pa-6">Hành động này không thể hoàn tác.</v-card-text>
        <v-card-actions class="pa-6 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog.show = false">Quay lại</v-btn>
          <v-btn color="error" variant="flat" :loading="deleting" @click="doDelete">Xóa vĩnh viễn</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Guide Dialog -->
    <v-dialog v-model="showGuide" max-width="800" scrollable>
      <v-card class="guide-dialog overflow-hidden">
        <v-toolbar color="surface" density="comfortable" class="border-bottom">
          <v-icon color="primary" class="ml-4">mdi-brain</v-icon>
          <v-toolbar-title class="text-subtitle-1 font-weight-bold ml-2">Hướng dẫn Đào tạo AI Agent</v-toolbar-title>
          <v-spacer />
          <v-btn icon @click="showGuide = false"><v-icon>mdi-close</v-icon></v-btn>
        </v-toolbar>

        <v-card-text class="pa-6 guide-content overflow-y-auto">
          <!-- Phần 1: Nguyên lý hoạt động -->
          <section class="mb-10">
            <h2 class="text-h5 font-weight-bold mb-4 primary--text d-flex align-center">
              <v-icon class="mr-2">mdi-brain-outline</v-icon> Nguyên lý "Tư duy" của AI
            </h2>
            <p class="text-body-1 mb-4">AI c?a b?n ho?t d?ng theo co ch? <strong>RAG (T�m ki?m ng? nghia)</strong>. Khi kh�ch h?i, n� s? qu�t qua kho tri th?c n�y, ch?n ra 3-5 do?n li�n quan nh?t r?i m?i so?n c�u tr? l?i.</p>
            <v-alert variant="tonal" color="info" border="start" class="rounded-lg">
              <div class="text-caption">
                <strong>M?o:</strong> AI gi?ng nhu m?t nh�n vi�n m?i, n� ch? tr? l?i t?t nh?ng g� b?n d� "vi?t v�o s? tay" n�y. N?i dung c�ng c? th?, ph?n h?i c�ng �t sai s�t.
              </div>
            </v-alert>
          </section>

          <!-- Phần 2: Kỹ thuật viết tri thức hiệu quả -->
          <section class="mb-10">
            <h2 class="text-h5 font-weight-bold mb-4 primary--text d-flex align-center">
              <v-icon class="mr-2">mdi-pencil-box-multiple-outline</v-icon> Kỹ thuật viết tri thức "Sạch"
            </h2>
            
            <div class="mb-6">
              <div class="font-weight-bold text-subtitle-1 mb-2 d-flex align-center text-secondary">
                <v-icon size="18" class="mr-2">mdi-numeric-1-circle</v-icon> Quy tắc 1 Tri thức - 1 Vấn đề
              </div>
              <p class="text-body-2 mb-2">�?ng vi?t m?t do?n d�i 500 ch? n�i v? c? gi�, ship v� b?o h�nh. H�y chia l�m 3 th? ri�ng bi?t.</p>
              <div class="d-flex ga-2">
                <v-chip size="small" color="error" variant="flat">Sai: Một thẻ nói mọi thứ</v-chip>
                <v-chip size="small" color="success" variant="flat">Đúng: Tách nhỏ kiến thức</v-chip>
              </div>
            </div>

            <div class="mb-6">
              <div class="font-weight-bold text-subtitle-1 mb-2 d-flex align-center text-secondary">
                <v-icon size="18" class="mr-2">mdi-numeric-2-circle</v-icon> C?u tr�c C�u h?i - C�u tr? l?i (Q&A)
              </div>
              <p class="text-body-2 mb-2">Vi?t du?i d?ng c�u h?i gi? d?nh s? gi�p AI t�m ki?m ch�nh x�c hon khi kh�ch h�ng h?i c�u tuong t?.</p>
              <v-card variant="outlined" class="pa-3 bg-slate-50 rounded-lg border-dashed">
                <div class="text-caption font-italic text-slate-600">
                   "Khách hỏi: Shop mình có chi nhánh ở Sài Gòn không?<br>
                   Trả lời: Hiện tại shop chỉ có kho chính tại Hà Nội, nhưng có ship COD vào HCM trong 2-3 ngày."
                </div>
              </v-card>
            </div>

            <div>
              <div class="font-weight-bold text-subtitle-1 mb-2 d-flex align-center text-secondary">
                <v-icon size="18" class="mr-2">mdi-numeric-3-circle</v-icon> Sử dụng từ khóa (Keywords)
              </div>
              <p class="text-body-2">H�y dua c�c t? kh�a d?ng nghia v�o ki?n th?c. V� d?: "Giao h�ng", "V?n chuy?n", "Ship", "G?i d?" n�n c�ng xu?t hi?n trong m?t th? v? v?n chuy?n.</p>
            </div>
          </section>

          <!-- Phần 3: So sánh trực quan -->
          <section class="mb-10">
             <h2 class="text-h5 font-weight-bold mb-4 primary--text d-flex align-center">
              <v-icon class="mr-2">mdi-compare-horizontal</v-icon> So sánh: Tri thức Tốt vs Sơ sài
            </h2>
            <v-table class="border rounded-lg bg-transparent">
              <thead>
                <tr>
                  <th class="text-error" style="width: 40%">⚠️ Sơ sài (Dễ hiểu lầm)</th>
                  <th class="text-success">💎 Chất lượng (AI cực chuẩn)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="text-caption py-4">Shop bán áo phông 200k.</td>
                  <td class="text-caption py-4">
                    <strong>Tên SP:</strong> Áo phông Unisex Cotton 100%.<br>
                    <strong>Giá:</strong> 200.000đ (Chưa bao gồm ship).<br>
                    <strong>Size:</strong> M (45-55kg), L (55-65kg), XL (65-80kg).
                  </td>
                </tr>
                <tr>
                  <td class="text-caption py-4">Thứ 7 chủ nhật nghỉ.</td>
                  <td class="text-caption py-4">
                    <strong>Giờ làm việc:</strong> Thứ 2 đến Thứ 6 (8h-18h).<br>
                    <strong>Nghỉ lễ:</strong> Thứ 7 và CN shop dừng xử lý đơn nhưng AI vẫn sẽ hỗ trợ giải đáp thắc mắc 24/7.
                  </td>
                </tr>
              </tbody>
            </v-table>
          </section>

          <!-- Phần 4: Quản lý theo tài khoản Zalo -->
          <section class="mb-4">
            <h2 class="text-h5 font-weight-bold mb-4 primary--text d-flex align-center">
              <v-icon class="mr-2">mdi-account-switch-outline</v-icon> Tri thức riêng theo tài khoản
            </h2>
            <v-row dense>
              <v-col cols="12">
                <v-card variant="tonal" color="warning" class="pa-4">
                  <div class="text-body-2">
                    N?u b?n c� 2 Zalo b�n 2 d�ng h�ng kh�c nhau, h�y tuy?t d?i s? d?ng t�nh nang <strong>"G�n t�i kho?n"</strong>. �i?u n�y ngan ch?n vi?c AI l?y nh?m gi� c?a Shop A tr? l?i cho kh�ch ? Shop B.
                  </div>
                </v-card>
              </v-col>
            </v-row>
          </section>
        </v-card-text>

        <v-card-actions class="pa-6 border-top">
          <v-spacer />
          <v-btn color="primary" variant="flat" rounded="lg" block @click="showGuide = false">�� hi?u!</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Success Snackbar -->
    <v-snackbar v-model="toast.show" :color="toast.color" rounded="pill">
      <v-icon class="mr-2">{{ toast.icon }}</v-icon> {{ toast.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from 'vue';
import { api } from '@/api';
import { useZaloAccounts } from '@/composables/use-zalo-accounts';

const { accounts, fetchAccounts } = useZaloAccounts();


const showGuide = ref(false);
const loading = ref(true);
const saving = ref(false);
const deleting = ref(false);
const testing = ref(false);
const savingMagic = ref(false);
const search = ref('');
const filterCategory = ref('Tất cả');
const filterAccount = ref('Tất cả tài khoản');
const items = ref<any[]>([]);

// Accounts logic
const accountOptions = computed(() => {
  const opts = accounts.value.map(a => ({ title: a.displayName || a.id, value: a.id }));
  return [{ title: 'Tất cả tài khoản', value: null }, ...opts];
});

const currentSimAccountName = computed(() => {
  const acc = accountOptions.value.find(o => o.value === simAccountId.value);
  return acc ? acc.title : '...';
});

// Templates
const templates = [
  { name: 'Chính sách vận chuyển', icon: 'mdi-truck-delivery', content: 'Shop mình [miễn phí ship] cho đơn hàng từ [XXX k].' },
  { name: 'Bảng giá', icon: 'mdi-currency-usd', content: 'Sản phẩm A: [Giá]. Sản phẩm B: [Giá].' },
  { name: 'Chuy?n kho?n', icon: 'mdi-bank', content: 'Ch? TK: [T�n]. S? TK: [STK]. Ng�n h�ng: [NH].' }
];

// Simulator & Magic State
const magicInput = ref('');
const magicAccountId = ref(null);
const simAccountId = ref(null);
const testQuestion = ref('');
const testMessages = ref<any[]>([]);
const chatContainer = ref<HTMLElement | null>(null);
const toast = ref({ show: false, text: '', color: 'success', icon: 'mdi-check-circle' });

const categories = computed(() => {
  const cats = new Set(items.value.map(i => i.category).filter(Boolean));
  return ['Tất cả', ...Array.from(cats)];
});

const filterCategoriesOnly = computed(() => categories.value.filter(c => c !== 'Tất cả'));

const filteredItems = computed(() => {
  return items.value.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(search.value.toLowerCase()) || 
                         item.content.toLowerCase().includes(search.value.toLowerCase());
    const matchesCat = filterCategory.value === 'Tất cả' || item.category === filterCategory.value;
    const matchesAcc = filterAccount.value === 'Tất cả tài khoản' || item.zaloAccountId === filterAccount.value;
    return matchesSearch && matchesCat && matchesAcc;
  });
});

const editDialog = ref({
  show: false,
  isEdit: false,
  valid: true,
  item: { id: '', title: '', content: '', category: 'Chung', isActive: true, zaloAccountId: null as string | null }
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
  try {
    const analysis = await api.post('/ai/knowledge/analyze', { content: magicInput.value });
    await api.post('/ai/knowledge', {
      title: analysis.data.title,
      category: analysis.data.category,
      zaloAccountId: magicAccountId.value,
      content: magicInput.value,
      isActive: true
    });
    toast.value = { show: true, text: `�� n?p xong tri th?c cho ${currentSimAccountName.value}`, color: 'success', icon: 'mdi-sparkles' };
    magicInput.value = '';
    await loadData();
  } catch (err) {
    toast.value = { show: true, text: 'Nạp nhanh thất bại', color: 'error', icon: 'mdi-alert' };
  } finally {
    savingMagic.value = false;
  }
}

function openAddDialog() {
  editDialog.value = {
    show: true, isEdit: false, valid: true,
    item: { id: '', title: '', content: '', category: 'Chung', isActive: true, zaloAccountId: null }
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
    const res = await api.post('/ai/knowledge/test', { question: q, zaloAccountId: simAccountId.value });
    testMessages.value.push({ role: 'ai', content: res.data.content });
    loadData();
  } catch (err: any) {
    testMessages.value.push({ role: 'ai', content: 'Lỗi: ' + (err.response?.data?.error || 'Không tìm thấy ngữ cảnh') });
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
  if (c.includes('giá')) return 'mdi-currency-usd';
  if (c.includes('giao')) return 'mdi-truck-delivery';
  if (c.includes('bảo hành')) return 'mdi-shield-check';
  return 'mdi-database-outline';
}


onMounted(() => {
  fetchAccounts();
  loadData();
});
</script>

<style scoped>
.gradient-text {
  background: var(--gradient-brand);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.magic-console {
  background: linear-gradient(135deg, var(--color-primary-soft), var(--color-surface)) !important;
  border: 1px solid var(--color-border) !important;
  border-radius: 16px !important;
  box-shadow: var(--shadow-sm) !important;
}

.magic-textarea :deep(.v-field__input) {
  font-size: 14px;
  color: var(--color-text);
}

.glass-container {
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  box-shadow: var(--shadow-sm);
  backdrop-filter: blur(16px);
}

.knowledge-card {
  background: var(--color-surface) !important;
  border: 1px solid var(--color-border) !important;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.knowledge-card:hover {
  border-color: var(--color-primary) !important;
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}

.stats-badge {
  background: var(--color-success-soft);
  color: var(--color-success);
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 11px;
}

.simulator-panel {
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: 0 20px 20px 0;
  box-shadow: var(--shadow-sm);
  backdrop-filter: blur(16px);
}

.message-bubble {
  padding: 10px 16px;
  border-radius: 18px;
  max-width: 85%;
  font-size: 14px;
}

.user-bubble {
  background: var(--gradient-brand);
  color: var(--color-text-inverse);
  border-bottom-right-radius: 4px;
}

.ai-bubble {
  background: var(--color-surface);
  color: var(--color-text);
  border-bottom-left-radius: 4px;
  border: 1px solid var(--color-border);
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: var(--color-primary-soft-strong);
  border-radius: 10px;
}

.glass-list {
  background: var(--color-surface) !important;
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
}

.animate-sparkle {
  animation: sparkle 2s infinite;
}

@keyframes sparkle {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.primary--text {
  color: var(--color-primary);
}

.truncate-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.account-selector-mini :deep(.v-field__input) {
  font-size: 12px;
}

.guide-dialog {
  background: var(--color-surface) !important;
  border-radius: 20px !important;
  border: 1px solid var(--color-border) !important;
}

.guide-content {
  line-height: 1.6;
  color: var(--color-text-secondary);
}

.guide-content section {
  padding-bottom: 8px;
}

.glass-header,
.glass-footer {
  background: var(--color-surface-glass);
  backdrop-filter: blur(12px);
}

.glass-header {
  border-bottom: 1px solid var(--color-border);
}

.glass-footer {
  border-top: 1px solid var(--color-border);
}

.border-bottom {
  border-bottom: 1px solid var(--color-border);
}

.border-top {
  border-top: 1px solid var(--color-border);
}

.bg-dots {
  background:
    radial-gradient(circle at 1px 1px, var(--color-border) 1px, transparent 0);
  background-size: 18px 18px;
}

.form-dialog {
  background: var(--color-surface) !important;
  border: 1px solid var(--color-border) !important;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.gap-2,
.ga-2 {
  gap: 8px;
}

.border-dashed {
  border-style: dashed !important;
}

.bg-slate-50 {
  background: var(--color-surface-muted);
}

.text-slate-600 {
  color: var(--color-text-secondary);
}
</style>
