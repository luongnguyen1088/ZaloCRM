<template>
  <v-container fluid class="pa-6 fill-height d-flex flex-column">
    <!-- Header -->
    <div class="d-flex align-center mb-4 flex-shrink-0">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1 gradient-text">Đào tạo AI</h1>
        <p class="text-medium-emphasis mb-0">Xây dựng "bộ não" riêng cho trợ lý Zalo của bạn</p>
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
      <!-- Left Side: Training & Management -->
      <v-col cols="12" md="7" class="d-flex flex-column h-100 overflow-hidden">
        
        <!-- Tab Navigation -->
        <v-tabs v-model="activeTab" color="primary" class="mb-4 flex-shrink-0" align-tabs="start">
          <v-tab :value="0" class="text-none font-weight-bold">
            <v-icon start>mdi-robot-confused-outline</v-icon>
            Chỉ dẫn & Cá tính
          </v-tab>
          <v-tab :value="1" class="text-none font-weight-bold">
            <v-icon start>mdi-database-outline</v-icon>
            Kho tri thức
          </v-tab>
          <v-tab :value="2" class="text-none font-weight-bold">
            <v-icon start>mdi-account-arrow-right-outline</v-icon>
            Tự động bám đuổi
          </v-tab>
          <v-tab :value="3" class="text-none font-weight-bold">
            <v-icon start>mdi-hand-stop-outline</v-icon>
            Dừng/Tiếp tục AI
          </v-tab>
          <v-tab :value="4" class="text-none font-weight-bold">
            <v-icon start>mdi-cog-outline</v-icon>
            Nâng cao
          </v-tab>
        </v-tabs>

        <v-window v-model="activeTab" class="flex-grow-1 overflow-hidden">
          <!-- Tab 1: Instructions & Persona -->
          <v-window-item :value="0" class="h-100 overflow-y-auto pr-2 custom-scrollbar">
            <v-card class="glass-container pa-6 mb-4" border variant="flat">
              <div class="d-flex align-center mb-6">
                <v-icon color="primary" size="32" class="mr-4">mdi-comment-quote-outline</v-icon>
                <div>
                  <h3 class="text-h6 font-weight-bold">Tầng 2: Hành vi phản hồi</h3>
                  <p class="text-caption text-medium-emphasis mb-0">Cài đặt phong cách, cách xưng hô và ngôn ngữ của AI.</p>
                </div>
              </div>

              <v-select
                v-model="aiConfig.languagePolicy"
                :items="languageOptions"
                label="Chính sách ngôn ngữ"
                variant="outlined"
                density="comfortable"
                rounded="lg"
                class="mb-4"
                prepend-inner-icon="mdi-translate"
              />

              <div class="text-caption font-weight-bold mb-2 opacity-70">GỢI Ý MẪU CÁ TÍNH:</div>
              <v-row dense class="mb-4">
                <v-col v-for="t in personaTemplates" :key="t.name" cols="12" sm="6">
                  <v-card 
                    variant="outlined" 
                    class="persona-template-card pa-3 h-100" 
                    @click="applyPersona(t)"
                    hover
                  >
                    <div class="d-flex align-center">
                      <v-icon color="primary" class="mr-3">{{ t.icon }}</v-icon>
                      <div class="overflow-hidden">
                        <div class="text-caption font-weight-bold text-truncate">{{ t.name }}</div>
                        <div class="text-xxs text-medium-emphasis text-truncate">{{ t.description }}</div>
                      </div>
                    </div>
                  </v-card>
                </v-col>
              </v-row>

              <v-textarea
                v-model="aiConfig.instructions"
                label="Chỉ dẫn cá tính & Cách trả lời"
                placeholder="Ví dụ: Luôn gọi khách là 'anh/chị', xưng là 'em'. Luôn sử dụng icon 🌸 và văn phong chuyên nghiệp..."
                variant="outlined"
                rows="10"
                rounded="lg"
                persistent-hint
                class="mb-6"
              >
                <template #prepend-inner>
                  <v-icon color="primary" class="mt-1">mdi-robot-outline</v-icon>
                </template>
              </v-textarea>

              <div class="d-flex align-center justify-space-between pt-4 border-top">
                <v-switch
                  v-model="aiConfig.enabled"
                  label="Kích hoạt trợ lý AI"
                  color="success"
                  hide-details
                  inset
                />
                <v-btn 
                  color="primary" 
                  variant="flat" 
                  rounded="lg" 
                  size="large" 
                  class="px-10"
                  :loading="aiSaving"
                  @click="saveAiConfig"
                >
                  Lưu thay đổi
                </v-btn>
              </div>
            </v-card>

            <!-- Usage Info Card -->
            <v-card class="glass-container pa-4 border-dashed" variant="flat">
              <div class="d-flex align-center justify-space-between">
                <div class="d-flex align-center">
                  <v-icon color="secondary" class="mr-2">mdi-shield-check-outline</v-icon>
                  <span class="text-caption font-weight-bold opacity-70">QUY TẮC HỆ THỐNG (TẦNG 1): ĐANG KÍCH HOẠT</span>
                </div>
                <v-chip size="x-small" color="secondary" variant="flat">{{ aiConfig.planName }} Plan</v-chip>
              </div>
              <p class="text-xxs text-medium-emphasis mt-2 mb-0">
                Hệ thống luôn tự động áp dụng các quy tắc bảo mật, cấm lộ thông tin và cấm sử dụng định dạng Markdown để đảm bảo AI hoạt động an toàn.
              </p>
            </v-card>
          </v-window-item>

          <!-- Tab 3: Auto Follow-up -->
          <v-window-item :value="2" class="h-100 overflow-y-auto pr-2 custom-scrollbar">
            <v-card class="glass-container pa-6 mb-4" border variant="flat">
              <div class="d-flex align-center mb-6">
                <v-icon color="secondary" size="32" class="mr-4">mdi-bullseye-arrow</v-icon>
                <div>
                  <h3 class="text-h6 font-weight-bold">Chiến dịch Bám đuổi tự động</h3>
                  <p class="text-caption text-medium-emphasis mb-0">Tự động gửi tin nhắn nhắc nhở khi khách hàng im lặng.</p>
                </div>
              </div>

              <v-alert
                type="info"
                variant="tonal"
                density="compact"
                class="mb-6 rounded-lg text-caption"
              >
                Hệ thống sẽ kiểm tra định kỳ mỗi phút. Nếu khách hàng không phản hồi sau thời gian thiết lập, AI sẽ gửi tin nhắn theo dõi.
              </v-alert>

              <v-row>
                <v-col cols="12" sm="6">
                  <v-select
                    v-model="aiConfig.followUpInterval"
                    :items="intervalOptions"
                    label="Gửi tin nhắn sau khi khách im lặng"
                    variant="outlined"
                    density="comfortable"
                    rounded="lg"
                    prepend-inner-icon="mdi-clock-outline"
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-select
                    v-model="aiConfig.followUpMaxMessages"
                    :items="[1, 2, 3, 4, 5]"
                    label="Số lượng tin nhắc tối đa"
                    variant="outlined"
                    density="comfortable"
                    rounded="lg"
                    prepend-inner-icon="mdi-numeric"
                  />
                </v-col>
              </v-row>

              <div class="text-subtitle-2 font-weight-bold mb-3">Nội dung tin nhắn bám đuổi:</div>
              <v-radio-group v-model="aiConfig.followUpType" inline class="mb-4">
                <v-radio label="Tự động bằng AI (Khuyên dùng)" value="ai" color="primary"></v-radio>
                <v-radio label="Dùng mẫu cố định" value="manual" color="secondary"></v-radio>
              </v-radio-group>

              <v-textarea
                v-if="aiConfig.followUpType === 'manual'"
                v-model="aiConfig.followUpManualContent"
                label="Nội dung mẫu cố định"
                placeholder="Ví dụ: Dạ Anh/Chị có cần em tư vấn thêm gì về sản phẩm không ạ?"
                variant="outlined"
                rows="4"
                rounded="lg"
                class="mb-6"
              />
              
              <v-card v-else variant="tonal" color="primary" class="pa-4 mb-6 rounded-lg">
                <div class="d-flex align-center mb-2">
                  <v-icon size="18" class="mr-2">mdi-robot-outline</v-icon>
                  <span class="text-caption font-weight-bold">LOGIC AI BÁM ĐUỔI:</span>
                </div>
                <p class="text-xxs mb-0 opacity-80">
                  AI sẽ đọc lại toàn bộ lịch sử trò chuyện gần nhất để viết một câu nhắc nhở "tinh tế" và "đúng ngữ cảnh" nhất, tránh tạo cảm giác spam cho khách hàng.
                </p>
              </v-card>

              <div class="d-flex align-center justify-space-between pt-4 border-top">
                <v-switch
                  v-model="aiConfig.followUpEnabled"
                  label="Kích hoạt Bám đuổi"
                  color="success"
                  hide-details
                  inset
                />
                <v-btn 
                  color="primary" 
                  variant="flat" 
                  rounded="lg" 
                  size="large" 
                  class="px-10"
                  :loading="aiSaving"
                  @click="saveAiConfig"
                >
                  Lưu thiết lập
                </v-btn>
              </div>
            </v-card>
          </v-window-item>

          <!-- Tab 4: Smart Pause -->
          <v-window-item :value="3" class="h-100 overflow-y-auto pr-2 custom-scrollbar">
            <v-card class="glass-container pa-6 mb-4" border variant="flat">
              <div class="d-flex align-center mb-6">
                <v-icon color="error" size="32" class="mr-4">mdi-shield-alert-outline</v-icon>
                <div>
                  <h3 class="text-h6 font-weight-bold">Cấu hình Dừng/Tiếp tục thông minh</h3>
                  <p class="text-caption text-medium-emphasis mb-0">Tự động nhường quyền cho nhân viên khi gặp điều kiện nhạy cảm.</p>
                </div>
              </div>

              <div class="text-subtitle-2 font-weight-bold mb-4">Các điều kiện để AI ngừng phản hồi:</div>
              
              <div v-if="!aiConfig.stopConditions || aiConfig.stopConditions.length === 0" class="text-center pa-8 border rounded-lg border-dashed mb-4">
                <v-icon color="medium-emphasis" size="48" class="mb-2">mdi-text-box-search-outline</v-icon>
                <div class="text-caption text-medium-emphasis">Chưa có điều kiện dừng nào được thiết lập.</div>
              </div>

              <div v-else class="mb-4">
                <div v-for="(condition, index) in aiConfig.stopConditions" :key="index" class="d-flex align-center mb-2">
                  <v-text-field
                    v-model="aiConfig.stopConditions[index]"
                    placeholder="Ví dụ: Khách hàng hỏi về giá sỉ..."
                    variant="outlined"
                    density="compact"
                    rounded="lg"
                    hide-details
                    prepend-inner-icon="mdi-circle-medium"
                  >
                    <template v-slot:append>
                      <v-btn icon="mdi-delete-outline" variant="text" color="error" size="small" @click="removeStopCondition(index)"></v-btn>
                    </template>
                  </v-text-field>
                </div>
              </div>

              <v-btn 
                variant="outlined" 
                color="primary" 
                rounded="lg" 
                prepend-icon="mdi-plus" 
                class="mb-8"
                @click="addStopCondition"
              >
                Thêm điều kiện mới
              </v-btn>

              <div class="text-caption font-weight-bold opacity-60 mb-3">MẪU GỢI Ý (BẤM ĐỂ THÊM NHANH):</div>
              <div class="d-flex flex-wrap ga-2 mb-8">
                <v-chip
                  v-for="t in stopTemplates"
                  :key="t.title"
                  size="small"
                  variant="tonal"
                  :color="t.color"
                  class="px-3"
                  @click="addStopFromTemplate(t.content)"
                >
                  <v-icon start size="14">{{ t.icon }}</v-icon>
                  {{ t.title }}
                </v-chip>
              </div>

              <v-divider class="mb-6"></v-divider>

              <div class="text-subtitle-2 font-weight-bold mb-4">Cấu hình Tiếp tục phản hồi:</div>
              
              <v-switch
                v-model="aiConfig.autoResumeEnabled"
                label="Tự động tiếp tục phản hồi (Resume)"
                color="primary"
                hide-details
                inset
                class="mb-2"
              />
              
              <v-expand-transition>
                <div v-if="aiConfig.autoResumeEnabled" class="pl-14">
                  <v-row align="center">
                    <v-col cols="auto" class="text-caption">Tiếp tục sau:</v-col>
                    <v-col cols="4">
                      <v-select
                        v-model="aiConfig.autoResumeMinutes"
                        :items="resumeIntervalOptions"
                        variant="outlined"
                        density="compact"
                        rounded="lg"
                        hide-details
                      />
                    </v-col>
                  </v-row>
                </div>
              </v-expand-transition>

              <div class="d-flex justify-end pt-8 mt-4 border-top">
                <v-btn 
                  color="primary" 
                  variant="flat" 
                  rounded="lg" 
                  size="large" 
                  class="px-10"
                  :loading="aiSaving"
                  @click="saveAiConfig"
                >
                  Lưu thiết lập
                </v-btn>
              </div>
            </v-card>
          </v-window-item>

          <!-- Tab 5: Advanced -->
          <v-window-item :value="4" class="h-100 overflow-y-auto pr-2 custom-scrollbar">
            <v-card class="glass-container pa-6 mb-4" border variant="flat">
              <div class="d-flex align-center mb-6">
                <v-icon color="indigo" size="32" class="mr-4">mdi-auto-fix</v-icon>
                <div>
                  <h3 class="text-h6 font-weight-bold">Cấu hình Nâng cao</h3>
                  <p class="text-caption text-medium-emphasis mb-0">Tự động hóa sâu hơn và tối ưu hóa thời gian vận hành AI.</p>
                </div>
              </div>

              <!-- AI Scheduling -->
              <div class="text-subtitle-2 font-weight-bold mb-4 d-flex align-center">
                <v-icon size="18" class="mr-2" color="indigo">mdi-clock-check-outline</v-icon>
                Giờ làm việc của AI
              </div>
              
              <v-radio-group v-model="aiConfig.aiWorkMode" class="mb-4">
                <v-radio label="Luôn luôn hoạt động (24/7)" value="always" color="indigo"></v-radio>
                <v-radio label="Chỉ hoạt động ngoài giờ hành chính (Human off-hours)" value="off_hours" color="indigo"></v-radio>
                <v-radio label="Chỉ hoạt động trong giờ hành chính (Human on-hours)" value="on_hours" color="indigo"></v-radio>
                <v-radio label="Tạm tắt hoàn toàn (Chỉ dùng thủ công)" value="manual" color="indigo"></v-radio>
              </v-radio-group>

              <v-divider class="my-6"></v-divider>

              <div class="text-subtitle-2 font-weight-bold mb-4 d-flex align-center">
                <v-icon size="18" class="mr-2" color="indigo">mdi-robot-excited-outline</v-icon>
                Chế độ phản hồi (Hybrid vs Auto)
              </div>
              
              <v-radio-group v-model="aiConfig.aiResponseMode" class="mb-4">
                <v-radio value="auto" color="indigo">
                  <template v-slot:label>
                    <div>
                      <div class="text-body-2 font-weight-bold">Tự động hoàn toàn (Auto Mode)</div>
                      <div class="text-caption">AI sẽ trực tiếp gửi tin nhắn cho khách hàng mà không cần duyệt.</div>
                    </div>
                  </template>
                </v-radio>
                <v-radio value="hybrid" color="indigo" class="mt-2">
                  <template v-slot:label>
                    <div>
                      <div class="text-body-2 font-weight-bold">Chế độ Hỗ trợ (Hybrid Mode)</div>
                      <div class="text-caption">AI sẽ soạn sẵn câu trả lời dưới dạng bản thảo (Draft). Nhân viên nhấn "Gửi" để hoàn tất.</div>
                    </div>
                  </template>
                </v-radio>
              </v-radio-group>

              <v-alert
                v-if="aiConfig.aiWorkMode === 'off_hours' || aiConfig.aiWorkMode === 'on_hours'"
                type="info"
                variant="tonal"
                density="compact"
                class="mb-6 rounded-lg text-caption"
              >
                AI sẽ tự động kiểm tra giờ hệ thống để quyết định có phản hồi hay không. 
                Giờ hành chính mặc định: 08:00 - 18:00 (Thứ 2 - Thứ 7).
              </v-alert>

              <v-divider class="my-6"></v-divider>

              <!-- Lead Extraction -->
              <div class="text-subtitle-2 font-weight-bold mb-4 d-flex align-center">
                <v-icon size="18" class="mr-2" color="success">mdi-database-import-outline</v-icon>
                Tự động trích xuất thông tin (Lead Extraction)
              </div>
              
              <v-list bg-color="transparent" class="pa-0">
                <v-list-item class="pa-0 mb-2">
                  <template v-slot:prepend>
                    <v-icon color="success">mdi-account-details-outline</v-icon>
                  </template>
                  <v-list-item-title class="text-body-2">Tự động lấy SĐT và Địa chỉ</v-list-item-title>
                  <v-list-item-subtitle class="text-xxs">AI sẽ quét tin nhắn khách gửi để cập nhật vào CRM.</v-list-item-subtitle>
                  <template v-slot:append>
                    <v-switch v-model="aiConfig.autoExtractInfo" color="success" hide-details inset density="compact" />
                  </template>
                </v-list-item>

                <v-list-item class="pa-0">
                  <template v-slot:prepend>
                    <v-icon color="success">mdi-lightning-bolt-outline</v-icon>
                  </template>
                  <v-list-item-title class="text-body-2">Tự động phân loại Tiềm năng (Leads)</v-list-item-title>
                  <v-list-item-subtitle class="text-xxs">Đánh dấu khách hàng là "Tiềm năng" khi có đủ thông tin liên hệ.</v-list-item-subtitle>
                  <template v-slot:append>
                    <v-switch v-model="aiConfig.autoCreateLeads" color="success" hide-details inset density="compact" />
                  </template>
                </v-list-item>
              </v-list>

              <div class="d-flex justify-end pt-8 mt-4 border-top">
                <v-btn 
                  color="indigo" 
                  variant="flat" 
                  rounded="lg" 
                  size="large" 
                  class="px-10"
                  :loading="aiSaving"
                  @click="saveAiConfig"
                >
                  Lưu thiết lập
                </v-btn>
              </div>
            </v-card>
          </v-window-item>

          <!-- Tab 2: Knowledge Base -->
          <v-window-item :value="1" class="h-100 d-flex flex-column overflow-hidden">
            <div class="d-flex align-center justify-space-between mb-2">
              <div class="text-caption font-weight-bold opacity-70">GỢI Ý NỘI DUNG NÊN NẠP:</div>
              <div class="d-flex ga-1">
                <v-chip size="x-small" variant="flat" color="primary" class="px-2">Thông tin</v-chip>
                <v-chip size="x-small" variant="flat" color="secondary" class="px-2">Bán hàng</v-chip>
              </div>
            </div>
            
            <v-slide-group
              show-arrows
              class="mb-2"
            >
              <v-slide-group-item
                v-for="t in knowledgeTemplates"
                :key="t.name"
              >
                <v-card 
                  variant="outlined" 
                  :class="['persona-template-card pa-2 ma-1 text-center', t.group === 'Bán hàng' ? 'border-secondary-light' : '']" 
                  @click="applyKnowledgeTemplate(t)"
                  width="105"
                  min-height="85"
                  hover
                >
                  <v-icon :color="t.group === 'Bán hàng' ? 'secondary' : 'primary'" size="16" class="mb-1">{{ t.icon }}</v-icon>
                  <div class="text-xxs font-weight-bold truncate-2" style="line-height: 1.1; min-height: 2.2em">{{ t.name }}</div>
                  <div 
                    :class="['mt-1 px-1 rounded-pill text-xxxxs font-weight-bold text-uppercase', t.group === 'Bán hàng' ? 'bg-secondary-soft secondary--text' : 'bg-primary-soft primary--text']"
                  >
                    {{ t.group }}
                  </div>
                </v-card>
              </v-slide-group-item>
            </v-slide-group>

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
              placeholder="Dán nội dung bất kỳ... AI sẽ tự động phân tích và gán cho đúng Zalo shop."
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
                <v-card :id="`knowledge-${item.id}`" class="knowledge-card mb-3" elevation="0" border>
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
        </v-window-item>
      </v-window>
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
              <p class="text-body-2">Hỏi thử một câu bất kỳ để xem AI tại tài khoản <strong>{{ currentSimAccountName }}</strong> sẽ trả lời thế nào.</p>
            </div>
            
            <div v-for="(msg, i) in testMessages" :key="i" 
                 :class="['d-flex mb-4 fade-in', msg.role === 'user' ? 'justify-end' : 'justify-start']">
              <div :class="['message-bubble-wrapper', msg.role === 'user' ? 'user-wrapper' : 'ai-wrapper']">
                <div v-if="msg.role === 'ai'" class="text-caption font-weight-bold mb-1 primary--text d-flex align-center">
                  <v-icon size="14" class="mr-1">mdi-robot-outline</v-icon>
                  AI Agent ({{ currentSimAccountName }})
                </div>
                
                <div :class="['message-bubble', msg.role === 'user' ? 'zalo-user-bubble' : 'zalo-ai-bubble']">
                  {{ msg.content }}
                </div>

                <!-- Sources display -->
                <div v-if="msg.sources && msg.sources.length" class="sources-container mt-2">
                  <div class="text-xxs font-weight-bold opacity-60 mb-1 d-flex align-center">
                    <v-icon size="10" class="mr-1">mdi-book-open-variant</v-icon> TRÍ THỨC ĐÃ DÙNG:
                  </div>
                  <div class="d-flex flex-wrap gap-1">
                    <v-chip 
                      v-for="src in msg.sources" 
                      :key="src.id" 
                      size="x-small" 
                      variant="tonal" 
                      color="secondary" 
                      class="px-2 source-chip"
                      @click="jumpToKnowledge(src.id)"
                    >
                      {{ src.title }}
                      <v-icon end size="10" class="ml-1">mdi-arrow-right</v-icon>
                    </v-chip>
                  </div>
                </div>

                <!-- RLHF Action -->
                <div v-if="msg.role === 'ai'" class="mt-1">
                  <v-btn 
                    variant="text" 
                    size="x-small" 
                    color="primary" 
                    prepend-icon="mdi-auto-fix" 
                    class="px-1 opacity-60 hover-opacity-100"
                    @click="openCorrectDialog(msg, i)"
                  >
                    Chưa hài lòng? Sửa câu trả lời
                  </v-btn>
                </div>
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
                  label="Phân loại"
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
            <p class="text-body-1 mb-4">AI của bạn hoạt động theo cơ chế <strong>RAG (Tìm kiếm ngữ nghĩa)</strong>. Khi khách hỏi, nó sẽ quét qua kho tri thức này, chọn ra 3-5 đoạn liên quan nhất rồi mới soạn câu trả lời.</p>
            <v-alert variant="tonal" color="info" border="start" class="rounded-lg">
              <div class="text-caption">
                <strong>Mẹo:</strong> AI giống như một nhân viên mới, nó chỉ trả lời tốt những gì bạn đã "viết vào sổ tay" này. Nội dung càng cụ thể, phản hồi càng ít sai sót.
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
              <p class="text-body-2 mb-2">Đừng viết một đoạn dài 500 chữ nói về cả giá, ship và bảo hành. Hãy chia làm 3 thẻ riêng biệt.</p>
              <div class="d-flex ga-2">
                <v-chip size="small" color="error" variant="flat">Sai: Một thẻ nói mọi thứ</v-chip>
                <v-chip size="small" color="success" variant="flat">Đúng: Tách nhỏ kiến thức</v-chip>
              </div>
            </div>

            <div class="mb-6">
              <div class="font-weight-bold text-subtitle-1 mb-2 d-flex align-center text-secondary">
                <v-icon size="18" class="mr-2">mdi-numeric-2-circle</v-icon> Cấu trúc Câu hỏi - Câu trả lời (Q&A)
              </div>
              <p class="text-body-2 mb-2">Viết dưới dạng câu hỏi giả định sẽ giúp AI tìm kiếm chính xác hơn khi khách hàng hỏi câu tương tự.</p>
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
              <p class="text-body-2">Hãy đưa các từ khóa đồng nghĩa vào kiến thức. Ví dụ: "Giao hàng", "Vận chuyển", "Ship", "Gửi đồ" nên cùng xuất hiện trong một thẻ về vận chuyển.</p>
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
                    Nếu bạn có 2 Zalo bán 2 dòng hàng khác nhau, hãy tuyệt đối sử dụng tính năng <strong>"Gán tài khoản"</strong>. Điều này ngăn chặn việc AI lấy nhầm giá của Shop A trả lời cho khách ở Shop B.
                  </div>
                </v-card>
              </v-col>
            </v-row>
          </section>
        </v-card-text>

        <v-card-actions class="pa-6 border-top">
          <v-spacer />
          <v-btn color="primary" variant="flat" rounded="lg" block @click="showGuide = false">Đã hiểu!</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- RLHF Correction Dialog -->
    <v-dialog v-model="correctDialog.show" max-width="600">
      <v-card class="form-dialog">
        <v-toolbar color="secondary" density="comfortable">
          <v-toolbar-title class="text-subtitle-1 font-weight-bold">Dạy AI trả lời đúng</v-toolbar-title>
          <v-btn icon @click="correctDialog.show = false"><v-icon>mdi-close</v-icon></v-btn>
        </v-toolbar>
        <v-card-text class="pa-6">
          <div class="mb-4">
            <div class="text-caption font-weight-bold mb-1 opacity-60">CÂU HỎI CỦA KHÁCH:</div>
            <div class="pa-3 bg-grey-lighten-4 rounded-lg text-body-2">{{ correctDialog.question }}</div>
          </div>
          <div class="mb-4">
            <div class="text-caption font-weight-bold mb-1 opacity-60">AI ĐÃ TRẢ LỜI (CHƯA TỐT):</div>
            <div class="pa-3 bg-grey-lighten-4 rounded-lg text-body-2 italic opacity-60">{{ correctDialog.originalAnswer }}</div>
          </div>
          <v-textarea
            v-model="correctDialog.desiredAnswer"
            label="Câu trả lời bạn mong muốn"
            placeholder="Hãy viết cách bạn muốn AI trả lời trong trường hợp này..."
            variant="outlined"
            rows="4"
            hide-details
            class="mb-2"
          />
          <div v-if="correctDialog.proposalReason" class="mt-2 pa-2 bg-primary-lighten-5 rounded border-s-4 border-primary">
            <div class="text-xxs font-weight-bold primary--text mb-1">GỢI Ý TỪ AI:</div>
            <div class="text-caption italic">{{ correctDialog.proposalReason }}</div>
          </div>
          <p v-else class="text-xxs text-medium-emphasis mt-1">AI sẽ dựa vào các tri thức cũ và câu trả lời mới để đề xuất cách sửa tối ưu nhất.</p>
        </v-card-text>
        <v-card-actions class="pa-6 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="correctDialog.show = false">Hủy</v-btn>
          <v-btn 
            color="primary" 
            variant="flat" 
            :loading="correctDialog.loading"
            :disabled="!correctDialog.desiredAnswer.trim()"
            @click="proposeFix"
          >
            Phân tích & Đề xuất
          </v-btn>
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
const items = ref<any[]>([]);
const aiConfig = ref<any>({
  enabled: true,
  instructions: '',
  languagePolicy: 'auto',
  usedTokens: 0,
  maxTokens: 500000,
  remainingTokens: 500000,
  followUpEnabled: false,
  followUpInterval: 30,
  followUpMaxMessages: 3,
  followUpType: 'ai',
  followUpManualContent: '',
  stopConditions: [],
  autoResumeEnabled: true,
  autoResumeMinutes: 60,
  aiWorkMode: 'always',
  aiWorkHours: {},
  aiTimezone: 'Asia/Ho_Chi_Minh',
  autoExtractInfo: false,
  autoCreateLeads: false,
});
const activeTab = ref(0);
const aiSaving = ref(false);

// Accounts logic
const accountOptions = computed(() => {
  const opts = accounts.value.map(a => ({ title: a.displayName || a.id, value: a.id }));
  return [{ title: 'Tất cả tài khoản', value: null }, ...opts];
});

const currentSimAccountName = computed(() => {
  const acc = accountOptions.value.find(o => o.value === simAccountId.value);
  return acc ? acc.title : '...';
});

// Knowledge Templates
const knowledgeTemplates = [
  // Nhóm 1: Thông tin cơ bản
  { group: 'Cơ bản', name: '🚚 Vận chuyển', icon: 'mdi-truck-delivery', content: 'Shop mình miễn phí ship cho đơn hàng từ 500k. Với đơn dưới 500k, phí ship nội thành là 20k, ngoại thành là 30k. Thời gian giao hàng: Nội thành 1-2 ngày, Ngoại thành 3-5 ngày.' },
  { group: 'Cơ bản', name: '💰 Thanh toán', icon: 'mdi-bank', content: 'Thông tin chuyển khoản:\n- Chủ TK: NGUYEN VAN A\n- Số TK: 123456789\n- Ngân hàng: Vietcombank\n- Nội dung: [Họ tên] [Số điện thoại]' },
  { group: 'Cơ bản', name: '🏢 Thông tin Shop', icon: 'mdi-store-marker', content: 'Địa chỉ: 123 Đường ABC, Quận X, TP. Hồ Chí Minh.\nGiờ làm việc: 8h00 - 21h00 (Tất cả các ngày trong tuần).\nChi nhánh 2: 456 Đường XYZ, Quận Y, Hà Nội.' },
  { group: 'Cơ bản', name: '📞 Liên hệ', icon: 'mdi-phone-in-talk', content: 'Hotline hỗ trợ: 0901.234.567\nEmail: contact@claro.vn\nWebsite: www.claro.vn\nZalo hỗ trợ kỹ thuật: 0908.765.432' },
  { group: 'Cơ bản', name: '🏷️ Bảng giá', icon: 'mdi-tag-text-outline', content: 'Bảng giá sản phẩm hiện tại:\n1. Sản phẩm A: 200.000đ\n2. Sản phẩm B: 350.000đ\nƯu đãi: Mua từ 2 sản phẩm giảm ngay 10%.' },
  
  // Nhóm 2: Marketing & Bán hàng
  { group: 'Bán hàng', name: '🚀 Chốt đơn', icon: 'mdi-cart-arrow-right', content: 'Kịch bản chốt đơn: Khi khách đã ưng ý, hãy phản hồi: "Dạ sản phẩm này đang rất hot và chỉ còn vài chiếc cuối cùng trong kho thôi ạ. Anh/Chị cho em xin [Số điện thoại] và [Địa chỉ] để em giữ hàng và lên đơn gửi đi ngay cho mình trong chiều nay nhé!"' },
  { group: 'Bán hàng', name: '💎 Xử lý giá cao', icon: 'mdi-diamond-stone', content: 'Xử lý khi khách chê giá cao: "Dạ em hiểu băn khoăn của mình ạ. Tuy nhiên sản phẩm bên em là hàng [Loại 1/Chính hãng], đường may/chất liệu rất cao cấp và có bảo hành lên đến [12 tháng]. Đầu tư một lần dùng bền lâu và an tâm vẫn là kinh tế nhất Anh/Chị ạ!"' },
  { group: 'Bán hàng', name: '🎁 Ưu đãi Upsell', icon: 'mdi-gift-outline', content: 'Kịch bản Upsell: "Dạ hiện tại shop đang có chương trình: Mua thêm 1 sản phẩm bất kỳ sẽ được [Giảm 10% tổng đơn] và [Miễn phí vận chuyển] toàn quốc ạ. Anh/Chị có muốn xem thêm mẫu nào để nhận ưu đãi này không ạ?"' },
  { group: 'Bán hàng', name: '🛡️ Cam kết uy tín', icon: 'mdi-shield-check-outline', content: 'Cam kết bán hàng: Shop cam kết hàng chính hãng 100%, phát hiện hàng giả đền gấp 10 lần. Đặc biệt, shop cho phép Anh/Chị [Kiểm tra hàng thoải mái] trước khi thanh toán, đúng mẫu đúng chất lượng mới cần nhận hàng ạ.' },
  { group: 'Bán hàng', name: '🔄 Đổi trả', icon: 'mdi-cached', content: 'Chính sách đổi trả: Shop hỗ trợ đổi size/mẫu trong vòng 7 ngày kể từ khi nhận hàng. Yêu cầu sản phẩm còn nguyên tem mác và chưa qua sử dụng.' }
];

function applyKnowledgeTemplate(t: any) {
  magicInput.value = t.content;
  toast.value = { show: true, text: `Đã dán mẫu: ${t.name}`, color: 'info', icon: 'mdi-content-paste' };
}

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

const correctDialog = ref({
  show: false,
  loading: false,
  question: '',
  originalAnswer: '',
  desiredAnswer: '',
  sourceIds: [] as string[],
  proposalReason: '',
  index: -1
});

const deleteDialog = ref({ show: false, item: null as any });

async function loadData() {
  loading.value = true;
  try {
    const [knowledgeRes, configRes] = await Promise.all([
      api.get('/ai/knowledge'),
      api.get('/ai/config')
    ]);
    items.value = knowledgeRes.data;
    aiConfig.value = configRes.data;
  } catch (err) {
    console.error('Failed to load data:', err);
  } finally {
    loading.value = false;
  }
}

async function saveAiConfig() {
  aiSaving.value = true;
  try {
    const configToSave = {
      ...aiConfig.value,
      stopConditions: (aiConfig.value.stopConditions || []).filter((c: string) => c && c.trim())
    };
    const res = await api.put('/ai/config', configToSave);
    aiConfig.value = res.data;
    toast.value = { show: true, text: 'Đã lưu cấu hình AI', color: 'success', icon: 'mdi-check-circle' };
  } catch (err) {
    toast.value = { show: true, text: 'Lưu cấu hình thất bại', color: 'error', icon: 'mdi-alert' };
  } finally {
    aiSaving.value = false;
  }
}

const addStopCondition = () => {
  if (!aiConfig.value.stopConditions) aiConfig.value.stopConditions = [];
  aiConfig.value.stopConditions.push('');
};

const removeStopCondition = (index: number) => {
  aiConfig.value.stopConditions.splice(index, 1);
};

const languageOptions = [
  { title: 'Tự động nhận diện (Khuyên dùng)', value: 'auto' },
  { title: 'Luôn dùng Tiếng Việt', value: 'vi' },
  { title: 'Luôn dùng Tiếng Anh', value: 'en' },
];

const intervalOptions = [
  { title: '5 phút', value: 5 },
  { title: '15 phút', value: 15 },
  { title: '30 phút', value: 30 },
  { title: '1 giờ', value: 60 },
  { title: '2 giờ', value: 120 },
  { title: '4 giờ', value: 240 },
  { title: '12 giờ', value: 720 },
  { title: '24 giờ (1 ngày)', value: 1440 },
];

const resumeIntervalOptions = [
  { title: '30 phút', value: 30 },
  { title: '1 giờ', value: 60 },
  { title: '2 giờ', value: 120 },
  { title: '4 giờ', value: 240 },
  { title: '12 giờ', value: 720 },
  { title: '24 giờ (1 ngày)', value: 1440 },
];

const personaTemplates = [
  {
    name: '🌸 Shop Thời trang/Mỹ phẩm',
    description: 'Trẻ trung, dùng "bạn yêu", nhiều icon',
    icon: 'mdi-sparkles',
    content: "Bạn là một trợ lý bán hàng cực kỳ dễ thương và năng động của shop thời trang/mỹ phẩm.\n- Cách xưng hô: Gọi khách là 'bạn yêu', 'nàng', 'mỹ nhân'. Xưng là 'mình' hoặc 'shop'.\n- Phong cách: Luôn sử dụng icon (🌸, ✨, 💖) ở cuối mỗi câu. Trả lời ngọt ngào, khen ngợi khách hàng khi có thể.\n- Luôn kết thúc bằng một câu hỏi gợi mở để chốt đơn."
  },
  {
    name: '💼 Chuyên nghiệp & Lịch sự',
    description: 'Phù hợp BĐS, Tài chính, Dịch vụ B2B',
    icon: 'mdi-briefcase-outline',
    content: "Bạn là một chuyên viên tư vấn chuyên nghiệp, lịch thiệp và đáng tin cậy.\n- Cách xưng hô: Gọi khách là 'Anh/Chị'. Xưng là 'Em'.\n- Phong cách: Luôn có từ 'Dạ' ở đầu câu. Ngôn ngữ trang trọng, điềm đạm. Không dùng quá nhiều icon, chỉ dùng các icon tối giản như (✅, 📍).\n- Tập trung vào việc cung cấp thông tin chính xác và hẹn lịch tư vấn."
  },
  {
    name: '🛠️ Kỹ thuật & Gia dụng',
    description: 'Rõ ràng, chi tiết, dùng Bullet points',
    icon: 'mdi-tools',
    content: "Bạn là chuyên gia hỗ trợ kỹ thuật và tư vấn thiết bị gia dụng.\n- Cách xưng hô: Gọi khách là 'Anh/Chị'. Xưng là 'Shop'.\n- Phong cách: Trả lời thẳng vào vấn đề, sử dụng gạch đầu dòng (bullet points) để liệt kê thông số kỹ thuật hoặc quy trình bảo hành.\n- Ngôn ngữ rõ ràng, trung thực, tránh dùng từ hoa mỹ."
  },
  {
    name: '🏥 Tận tâm & Thấu hiểu',
    description: 'Phù hợp Y tế, Spa, Giáo dục',
    icon: 'mdi-heart-pulse',
    content: "Bạn là một tư vấn viên tận tâm, luôn lắng nghe và thấu hiểu khách hàng.\n- Cách xưng hô: Gọi khách là 'Anh/Chị'. Xưng là 'Em' hoặc 'Tư vấn viên'.\n- Phong cách: Nhẹ nhàng, ân cần. Thường xuyên đặt các câu hỏi quan tâm đến tình trạng của khách trước khi tư vấn sản phẩm.\n- Giải thích cặn kẽ lý do tại sao sản phẩm/dịch vụ này phù hợp với họ."
  }
];

function applyPersona(template: any) {
  aiConfig.value.instructions = template.content;
  toast.value = { show: true, text: `Đã áp dụng mẫu: ${template.name}`, color: 'info', icon: 'mdi-cached' };
}

const stopTemplates = [
  { title: 'Bán sỉ/Đại lý', icon: 'mdi-handshake-outline', color: 'primary', content: 'Khách hỏi về giá sỉ, mua số lượng lớn hoặc muốn làm đại lý/nhà phân phối.' },
  { title: 'Khiếu nại/Căng thẳng', icon: 'mdi-alert-octagon-outline', color: 'error', content: 'Khách hàng đang phàn nàn, mắng chửi, thái độ tiêu cực hoặc đòi trả hàng/hoàn tiền.' },
  { title: 'Yêu cầu gặp người', icon: 'mdi-account-voice', color: 'secondary', content: 'Khách yêu cầu gặp nhân viên tư vấn, gọi điện trực tiếp hoặc đòi gặp quản lý/chủ shop.' },
  { title: 'Thông tin nhạy cảm', icon: 'mdi-lock-outline', color: 'warning', content: 'Khách hỏi các vấn đề bảo mật, thông tin cá nhân hoặc các yêu cầu nằm ngoài quy định của shop.' },
  { title: 'Mặc cả quá sâu', icon: 'mdi-tag-remove-outline', color: 'info', content: 'Khách hàng mặc cả, đòi giảm giá quá mức so với các chương trình khuyến mãi hiện có.' }
];

const addStopFromTemplate = (content: string) => {
  if (!aiConfig.value.stopConditions) aiConfig.value.stopConditions = [];
  // Tránh thêm trùng
  if (!aiConfig.value.stopConditions.includes(content)) {
    aiConfig.value.stopConditions.push(content);
    toast.value = { show: true, text: 'Đã thêm mẫu điều kiện dừng', color: 'success', icon: 'mdi-plus-circle' };
  }
};

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
    toast.value = { show: true, text: `Đã nạp xong tri thức cho ${currentSimAccountName.value}`, color: 'success', icon: 'mdi-sparkles' };
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
    // Map existing messages to backend format for context
    const history = testMessages.value.map(m => ({
      senderType: m.role === 'user' ? 'other' : 'self',
      senderName: m.role === 'user' ? 'customer' : 'AI Agent',
      content: m.content,
      sentAt: new Date()
    }));

    const res = await api.post('/ai/knowledge/test', { 
      question: q, 
      zaloAccountId: simAccountId.value,
      history // Send the full history
    });
    testMessages.value.push({ 
      role: 'ai', 
      content: res.data.content,
      sources: res.data.sources || [],
      question: q // Store question for RLHF
    });
    loadData();
  } catch (err: any) {
    testMessages.value.push({ role: 'ai', content: 'Lỗi: ' + (err.response?.data?.error || 'Không tìm thấy ngữ cảnh') });
  } finally {
    testing.value = false;
    scrollToBottom();
  }
}

function openCorrectDialog(msg: any, index: number) {
  correctDialog.value = {
    show: true,
    loading: false,
    question: msg.question || (index > 0 ? testMessages.value[index-1].content : 'Câu hỏi không xác định'),
    originalAnswer: msg.content,
    desiredAnswer: '',
    sourceIds: msg.sources?.map((s: any) => s.id) || [],
    proposalReason: '',
    index
  };
}

async function proposeFix() {
  correctDialog.value.loading = true;
  try {
    const res = await api.post('/ai/knowledge/propose-fix', {
      question: correctDialog.value.question,
      originalAnswer: correctDialog.value.originalAnswer,
      desiredAnswer: correctDialog.value.desiredAnswer,
      sourceIds: correctDialog.value.sourceIds
    });
    
    const proposal = res.data;
    
    // Close correct dialog and open edit dialog with proposal
    correctDialog.value.show = false;
    
    const isUpdate = proposal.action === 'update' && proposal.targetId;
    
    editDialog.value = {
      show: true,
      isEdit: !!isUpdate,
      valid: true,
      item: { 
        id: proposal.targetId || '', 
        title: proposal.title, 
        content: proposal.content, 
        category: proposal.category, 
        isActive: true, 
        zaloAccountId: simAccountId.value 
      }
    };
    
    const toastMsg = isUpdate 
      ? `AI đề xuất CẬP NHẬT thẻ: ${proposal.title}` 
      : 'AI đề xuất TẠO MỚI thẻ tri thức';
      
    toast.value = { 
      show: true, 
      text: toastMsg, 
      color: isUpdate ? 'secondary' : 'success', 
      icon: 'mdi-sparkles' 
    };
  } catch (err) {
    toast.value = { show: true, text: 'Không thể tạo đề xuất sửa lỗi', color: 'error', icon: 'mdi-alert' };
  } finally {
    correctDialog.value.loading = false;
  }
}

function jumpToKnowledge(id: string) {
  search.value = '';
  filterCategory.value = 'Tất cả';
  filterAccount.value = 'Tất cả tài khoản';
  
  nextTick(() => {
    const item = items.value.find(i => i.id === id);
    if (item) {
      // Highlight the item briefly
      const el = document.getElementById(`knowledge-${id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('highlight-pulse');
        setTimeout(() => el.classList.remove('highlight-pulse'), 2000);
      } else {
        // If not in DOM yet (e.g. filtered), edit it
        editItem(item);
      }
    }
  });
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

.message-bubble-wrapper {
  max-width: 85%;
  display: flex;
  flex-direction: column;
}

.user-wrapper { align-items: flex-end; }
.ai-wrapper { align-items: flex-start; }

.message-bubble {
  padding: 10px 14px;
  font-size: 14px;
  line-height: 1.5;
  position: relative;
}

.zalo-user-bubble {
  background: #0068ff; /* Zalo Blue */
  color: white;
  border-radius: 18px 18px 4px 18px;
  box-shadow: 0 2px 4px rgba(0, 104, 255, 0.2);
}

.zalo-ai-bubble {
  background: white;
  color: #1e1e1e;
  border-radius: 18px 18px 18px 4px;
  border: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.sources-container {
  max-width: 100%;
}

.source-chip {
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 10px !important;
  background: rgba(var(--v-theme-secondary), 0.1) !important;
}

.source-chip:hover {
  background: rgba(var(--v-theme-secondary), 0.2) !important;
  transform: scale(1.05);
}

.text-xxs {
  font-size: 9px;
}

.fade-in {
  animation: fadeIn 0.3s ease forwards;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.highlight-pulse {
  animation: pulseHighlight 2s ease;
}

@keyframes pulseHighlight {
  0% { border-color: var(--color-primary); box-shadow: 0 0 0 0 rgba(var(--v-theme-primary), 0.4); }
  50% { border-color: var(--color-primary); box-shadow: 0 0 0 10px rgba(var(--v-theme-primary), 0); }
  100% { border-color: var(--color-border); }
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
.persona-template-card {
  border-radius: 12px;
  background: var(--color-surface);
  transition: all 0.3s ease;
  border: 1px solid var(--color-border);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.persona-template-card:hover {
  border-color: var(--color-primary);
  background: var(--color-primary-soft);
  transform: translateY(-2px);
}

.border-secondary-light {
  border-color: rgba(var(--v-theme-secondary), 0.3) !important;
}

.v-slide-group__content {
  padding: 4px 0;
}

.text-xxs {
  font-size: 0.65rem;
}

.text-xxxxs {
  font-size: 0.55rem;
  letter-spacing: 0.05em;
}

.truncate-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.bg-primary-soft {
  background: var(--color-primary-soft) !important;
}

.bg-secondary-soft {
  background: var(--color-secondary-soft) !important;
}
</style>
