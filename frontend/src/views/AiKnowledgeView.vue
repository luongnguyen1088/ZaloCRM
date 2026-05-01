<template>
  <v-container fluid class="ai-studio pa-6">
    <div class="d-flex align-center mb-4 flex-wrap ga-3">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1 gradient-text">Đào tạo AI</h1>
        <p class="text-medium-emphasis mb-0">
          Điều khiển cách AI nói, AI biết và AI được phép tự vận hành.
        </p>
      </div>
      <v-spacer />
      <v-btn
        variant="text"
        color="medium-emphasis"
        prepend-icon="mdi-help-circle-outline"
        rounded="xl"
        to="/ai-guide"
      >
        Hướng dẫn
      </v-btn>
      <v-btn
        variant="outlined"
        color="primary"
        prepend-icon="mdi-plus"
        rounded="xl"
        @click="openAddDialog"
      >
        Thêm thủ công
      </v-btn>
    </div>

    <v-card class="channel-hub mb-4" elevation="0" border>
      <div class="d-flex align-start justify-space-between flex-wrap ga-3 mb-4">
        <div>
          <div class="text-caption text-medium-emphasis text-uppercase">Channel First</div>
          <div class="text-h6 font-weight-bold mb-1">Chọn kênh cần cấu hình AI</div>
          <p class="text-body-2 text-medium-emphasis mb-0 channel-hub__copy">
            Mỗi Fanpage hoặc tài khoản Zalo có thể có cá tính, tri thức và cách vận hành riêng. Cấu hình nền chỉ là lớp fallback cho các kênh chưa được tách riêng.
          </p>
        </div>
        <div class="d-flex flex-wrap ga-2 align-center">
          <v-btn
            variant="outlined"
            color="secondary"
            rounded="xl"
            prepend-icon="mdi-layers-outline"
            @click="configScopeId = null"
          >
            Cấu hình nền
          </v-btn>
          <v-btn
            v-if="configScopeId"
            variant="text"
            color="warning"
            prepend-icon="mdi-backup-restore"
            :disabled="!configScopeMeta.hasChannelOverride"
            :loading="resettingScope"
            @click="resetConfigScope"
          >
            Quay về mặc định
          </v-btn>
        </div>
      </div>

      <div v-if="channelScopeCards.length" class="channel-grid">
        <button
          v-for="channel in channelScopeCards"
          :key="channel.id"
          type="button"
          :class="['channel-card', { 'channel-card--active': configScopeId === channel.id }]"
          @click="selectChannelScope(channel.id)"
        >
          <div class="d-flex align-center ga-3 mb-3">
            <v-avatar size="44" :color="channel.channelType === 'facebook' ? 'primary' : 'secondary'" variant="tonal">
              <v-img v-if="channel.avatarUrl" :src="channel.avatarUrl" cover />
              <v-icon v-else :icon="channel.channelType === 'facebook' ? 'mdi-facebook' : 'mdi-chat-processing-outline'" />
            </v-avatar>
            <div class="text-left overflow-hidden">
              <div class="font-weight-bold text-body-2 text-truncate">{{ channel.displayName }}</div>
              <div class="text-caption text-medium-emphasis text-truncate">{{ channel.subtitle }}</div>
            </div>
          </div>
          <div class="d-flex flex-wrap ga-2">
            <v-chip size="x-small" :color="channel.statusColor" variant="tonal">{{ channel.statusLabel }}</v-chip>
            <v-chip size="x-small" color="grey" variant="outlined">
              {{
                configScopeId === channel.id
                  ? (channel.isInherited ? 'Kế thừa nền' : 'Config riêng')
                  : 'Chọn để cấu hình'
              }}
            </v-chip>
          </div>
        </button>
      </div>

      <v-alert
        v-else
        variant="tonal"
        color="warning"
        rounded="lg"
      >
        Chưa có kênh kết nối nào. Hãy kết nối ít nhất một Fanpage hoặc tài khoản Zalo trước khi tách cấu hình AI theo kênh.
      </v-alert>

      <div class="channel-active-bar mt-4">
        <div>
          <div class="text-caption text-medium-emphasis text-uppercase">Đang chỉnh</div>
          <div class="text-subtitle-1 font-weight-bold">{{ currentConfigScopeName }}</div>
          <div class="text-body-2 text-medium-emphasis">
            {{ currentScopeDescription }}
          </div>
        </div>
        <div class="d-flex flex-wrap ga-2 justify-end">
          <v-chip size="small" :color="currentScopeChipColor" variant="tonal">
            {{ currentScopeChipLabel }}
          </v-chip>
          <v-chip v-if="configScopeId" size="small" color="secondary" variant="outlined">
            {{ configScopeMeta.scopeChannelType === 'facebook' ? 'Fanpage Facebook' : 'Kênh Zalo' }}
          </v-chip>
        </div>
      </div>
    </v-card>

    <v-row dense class="mb-4">
      <v-col v-for="card in summaryCards" :key="card.key" cols="12" md="4">
        <v-card class="summary-card" elevation="0" border>
          <div class="d-flex align-start justify-space-between mb-4">
            <div>
              <div class="text-caption text-medium-emphasis text-uppercase">
                {{ card.label }}
              </div>
              <div class="text-h6 font-weight-bold mt-1">
                {{ card.value }}
              </div>
            </div>
            <v-avatar :color="card.color" variant="tonal" size="42">
              <v-icon :icon="card.icon" />
            </v-avatar>
          </div>
          <p class="text-body-2 text-medium-emphasis mb-3">
            {{ card.description }}
          </p>
          <div class="d-flex flex-wrap ga-2">
            <v-chip
              v-for="chip in card.chips"
              :key="chip"
              size="small"
              variant="tonal"
              color="primary"
            >
              {{ chip }}
            </v-chip>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" :md="showSimulator ? 7 : 12">
        <v-card class="studio-shell" elevation="0" border>
          <div class="studio-shell__header">
            <div>
              <div class="text-caption text-medium-emphasis text-uppercase">
                AI Studio
              </div>
              <div class="text-subtitle-1 font-weight-bold">
                {{ currentSectionTitle }}
              </div>
            </div>
            <v-tabs
              v-model="activeSection"
              color="primary"
              align-tabs="start"
              class="studio-tabs"
            >
              <v-tab value="behavior" class="text-none font-weight-bold">
                <v-icon start>mdi-comment-quote-outline</v-icon>
                Cá tính
              </v-tab>
              <v-tab value="knowledge" class="text-none font-weight-bold">
                <v-icon start>mdi-database-outline</v-icon>
                Tri thức
              </v-tab>
              <v-tab value="operations" class="text-none font-weight-bold">
                <v-icon start>mdi-robot-cog-outline</v-icon>
                Vận hành
              </v-tab>
            </v-tabs>
          </div>

          <v-window v-model="activeSection" class="studio-window">
            <v-window-item value="behavior">
              <div class="section-stack">
                <v-card class="section-card" elevation="0" border>
                  <div class="section-card__headline">
                    <div>
                      <div class="text-caption text-medium-emphasis text-uppercase">
                        Lớp 1
                      </div>
                      <h2 class="text-h6 font-weight-bold mb-1">AI nói như thế nào</h2>
                      <p class="text-body-2 text-medium-emphasis mb-0">
                        Thiết lập giọng điệu, cách xưng hô và nguyên tắc trả lời mặc định.
                      </p>
                    </div>
                  </div>

                  <v-row dense class="mb-4">
                    <v-col cols="12" md="6">
                      <v-select
                        v-model="aiConfig.languagePolicy"
                        :items="languageOptions"
                        label="Chính sách ngôn ngữ"
                        variant="outlined"
                        rounded="lg"
                        prepend-inner-icon="mdi-translate"
                      />
                    </v-col>
                    <v-col cols="12" md="7">
                      <v-alert
                        variant="tonal"
                        color="info"
                        density="comfortable"
                        rounded="lg"
                        class="behavior-alert"
                      >
                        Mẫu cá tính chỉ là điểm khởi đầu. Bạn vẫn nên chỉnh lại theo đúng thương hiệu
                        và tập khách hàng của mình.
                      </v-alert>
                    </v-col>
                  </v-row>

                  <div class="text-caption font-weight-bold mb-3 opacity-70">
                    MẪU CÁ TÍNH
                  </div>
                  <v-row dense class="mb-4">
                    <v-col v-for="template in personaTemplates" :key="template.name" cols="12" md="6">
                      <v-card
                        class="preset-card"
                        elevation="0"
                        border
                        hover
                        @click="applyPersona(template)"
                      >
                        <div class="d-flex align-center ga-3 mb-2">
                          <v-avatar size="38" color="primary" variant="tonal">
                            <v-icon :icon="template.icon" />
                          </v-avatar>
                          <div class="overflow-hidden">
                            <div class="font-weight-bold text-body-2 text-truncate">
                              {{ template.name }}
                            </div>
                            <div class="text-caption text-medium-emphasis text-truncate">
                              {{ template.description }}
                            </div>
                          </div>
                        </div>
                        <div class="text-caption text-medium-emphasis line-clamp-3">
                          {{ template.preview }}
                        </div>
                      </v-card>
                    </v-col>
                  </v-row>

                  <v-textarea
                    v-model="aiConfig.instructions"
                    label="Chỉ dẫn cá tính và cách trả lời"
                    variant="outlined"
                    rows="10"
                    rounded="lg"
                    persistent-hint
                    hint="Viết như một playbook: AI nên xưng hô ra sao, ưu tiên điều gì, tránh điều gì."
                  />

                  <div class="d-flex justify-end mt-4">
                    <v-btn
                      color="primary"
                      variant="flat"
                      rounded="lg"
                      size="large"
                      :loading="aiSaving"
                      @click="saveAiConfig"
                    >
                      Lưu cá tính AI
                    </v-btn>
                  </div>
                </v-card>

                <v-card class="section-card section-card--soft" elevation="0" border>
                  <div class="d-flex align-center justify-space-between flex-wrap ga-3">
                    <div>
                      <div class="text-caption text-medium-emphasis text-uppercase">
                        Luôn bật
                      </div>
                      <div class="text-subtitle-1 font-weight-bold">
                        Quy tắc hệ thống nền
                      </div>
                      <p class="text-body-2 text-medium-emphasis mb-0">
                        AI vẫn bị ràng buộc bởi các quy tắc an toàn, bảo mật và kiểm soát định dạng.
                      </p>
                    </div>
                    <v-chip size="small" color="secondary" variant="flat">
                      {{ aiConfig.planName || 'Plan' }}
                    </v-chip>
                  </div>
                </v-card>
              </div>
            </v-window-item>

            <v-window-item value="knowledge">
              <div class="section-stack">
                <v-card class="section-card" elevation="0" border>
                  <div class="section-card__headline">
                    <div>
                      <div class="text-caption text-medium-emphasis text-uppercase">
                        Lớp 2
                      </div>
                      <h2 class="text-h6 font-weight-bold mb-1">AI biết gì</h2>
                      <p class="text-body-2 text-medium-emphasis mb-0">
                        Dạy AI về giá, vận chuyển, bảo hành, kịch bản chốt đơn và tri thức riêng
                        theo từng kênh kết nối.
                      </p>
                    </div>
                    <div class="d-flex ga-2 flex-wrap justify-end">
                      <v-chip size="small" color="primary" variant="tonal">
                        {{ activeKnowledgeCount }} mục đang học
                      </v-chip>
                      <v-chip size="small" color="secondary" variant="tonal">
                        {{ scopedKnowledgeCount }} mục theo kênh
                      </v-chip>
                    </div>
                  </div>

                  <div class="text-caption font-weight-bold mb-3 opacity-70">
                    GỢI Ý NỘI DUNG NÊN NẠP
                  </div>
                  <v-slide-group show-arrows class="mb-4">
                    <v-slide-group-item
                      v-for="template in knowledgeTemplates"
                      :key="template.name"
                    >
                      <v-card
                        class="knowledge-template-card ma-1"
                        elevation="0"
                        border
                        hover
                        @click="applyKnowledgeTemplate(template)"
                      >
                        <v-icon
                          :icon="template.icon"
                          :color="template.group === 'Bán hàng' ? 'secondary' : 'primary'"
                          class="mb-2"
                        />
                        <div class="text-caption font-weight-bold truncate-2 text-center">
                          {{ template.name }}
                        </div>
                        <v-chip
                          size="x-small"
                          :color="template.group === 'Bán hàng' ? 'secondary' : 'primary'"
                          variant="tonal"
                          class="mt-2"
                        >
                          {{ template.group }}
                        </v-chip>
                      </v-card>
                    </v-slide-group-item>
                  </v-slide-group>

                  <v-card class="magic-console pa-4 mb-4" elevation="0" border>
                    <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-3">
                      <div>
                        <div class="text-subtitle-1 font-weight-bold primary--text">
                          Nạp nhanh bằng AI
                        </div>
                        <div class="text-caption text-medium-emphasis">
                          Dán một đoạn nội dung bất kỳ. Hệ thống sẽ tự phân loại trước khi lưu.
                        </div>
                      </div>
                      <v-menu>
                        <template #activator="{ props }">
                          <v-btn
                            v-bind="props"
                            variant="text"
                            size="small"
                            color="secondary"
                            prepend-icon="mdi-text-box-plus-outline"
                          >
                            Dùng mẫu
                          </v-btn>
                        </template>
                        <v-list density="compact" class="glass-list">
                          <v-list-item
                            v-for="template in knowledgeTemplates"
                            :key="template.name"
                            :title="template.name"
                            @click="applyTemplate(template)"
                          >
                            <template #prepend>
                              <v-icon :icon="template.icon" size="small" />
                            </template>
                          </v-list-item>
                        </v-list>
                      </v-menu>
                    </div>

                    <v-textarea
                      v-model="magicInput"
                      variant="plain"
                      rows="4"
                      hide-details
                      class="magic-textarea"
                      :disabled="savingMagic"
                      placeholder="Ví dụ: Shop miễn phí ship từ 500k. Đơn dưới 500k tính 20k nội thành, 30k ngoại thành..."
                      @keyup.ctrl.enter="runMagicAdd"
                    />

                    <div class="d-flex align-center mt-3 flex-wrap ga-3">
                      <div class="knowledge-scope-inline">
                        <div class="text-caption text-medium-emphasis mb-1">Mặc định áp dụng cho</div>
                        <div class="d-flex align-center ga-2 flex-wrap">
                          <v-chip size="small" color="secondary" variant="tonal">
                            {{ currentMagicAccountName }}
                          </v-chip>
                          <v-menu>
                            <template #activator="{ props }">
                              <v-btn
                                v-bind="props"
                                size="small"
                                variant="text"
                                color="medium-emphasis"
                                prepend-icon="mdi-tune-variant"
                              >
                                Đổi phạm vi
                              </v-btn>
                            </template>
                            <v-list density="compact" class="glass-list">
                              <v-list-item
                                v-for="option in accountOptions"
                                :key="String(option.value)"
                                :title="option.title"
                                @click="magicAccountId = option.value"
                              />
                            </v-list>
                          </v-menu>
                        </div>
                      </div>
                      <v-spacer />
                      <v-btn
                        color="primary"
                        variant="flat"
                        rounded="lg"
                        :loading="savingMagic"
                        :disabled="!magicInput.trim()"
                        @click="runMagicAdd"
                      >
                        Nạp kiến thức
                      </v-btn>
                    </div>
                  </v-card>

                  <div class="scope-note">
                    <v-icon icon="mdi-account-switch-outline" color="warning" class="mr-2" />
                    <span>
                      Nếu bạn vận hành nhiều kênh với sản phẩm khác nhau, hãy gắn tri thức đúng theo
                      tài khoản để tránh AI trả lời nhầm giá hoặc chính sách.
                    </span>
                  </div>
                </v-card>

                <v-card class="section-card section-card--stretch" elevation="0" border>
                  <v-row dense class="mb-4">
                    <v-col cols="12" md="5">
                      <v-text-field
                        v-model="search"
                        prepend-inner-icon="mdi-magnify"
                        label="Tìm kiếm nội dung"
                        variant="outlined"
                        density="comfortable"
                        rounded="lg"
                        hide-details
                      />
                    </v-col>
                    <v-col cols="12" md="6">
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

                  <div class="knowledge-list custom-scrollbar">
                    <template v-if="loading">
                      <v-skeleton-loader
                        v-for="index in 4"
                        :key="index"
                        type="list-item-three-line"
                        class="mb-4"
                      />
                    </template>

                    <template v-else-if="filteredItems.length">
                      <v-card
                        v-for="item in filteredItems"
                        :id="`knowledge-${item.id}`"
                        :key="item.id"
                        class="knowledge-card mb-3"
                        elevation="0"
                        border
                      >
                        <div class="d-flex pa-4 ga-4">
                          <v-avatar size="42" color="primary" variant="tonal">
                            <v-icon :icon="getCategoryIcon(item.category)" />
                          </v-avatar>
                          <div class="flex-grow-1 overflow-hidden">
                            <div class="d-flex align-center ga-2 mb-2 flex-wrap">
                              <div class="text-subtitle-1 font-weight-bold truncate-1">
                                {{ item.title }}
                              </div>
                              <v-spacer />
                              <v-chip
                                size="x-small"
                                :color="item.isActive ? 'success' : 'grey'"
                                variant="tonal"
                              >
                                {{ item.isActive ? 'Đang học' : 'Tạm ẩn' }}
                              </v-chip>
                            </div>

                            <p class="text-body-2 text-medium-emphasis line-clamp-2 mb-3">
                              {{ item.content }}
                            </p>

                            <div class="d-flex align-center flex-wrap ga-2">
                              <v-chip size="x-small" variant="outlined">
                                {{ item.category }}
                              </v-chip>
                              <v-chip
                                size="x-small"
                                :color="item.zaloAccountId ? 'secondary' : 'primary'"
                                variant="tonal"
                              >
                                <v-icon
                                  size="12"
                                  class="mr-1"
                                  :icon="item.zaloAccountId ? 'mdi-account-check-outline' : 'mdi-earth'"
                                />
                                {{ item.zaloAccount?.displayName || 'Tất cả tài khoản' }}
                              </v-chip>
                              <div v-if="item.useCount > 0" class="stats-badge">
                                <v-icon size="14" icon="mdi-head-cog-outline" class="mr-1" />
                                {{ item.useCount }}
                              </div>
                              <v-spacer />
                              <v-btn icon size="x-small" variant="text" color="primary" @click="editItem(item)">
                                <v-icon icon="mdi-pencil-outline" />
                              </v-btn>
                              <v-btn icon size="x-small" variant="text" color="error" @click="confirmDelete(item)">
                                <v-icon icon="mdi-trash-can-outline" />
                              </v-btn>
                            </div>
                          </div>
                        </div>
                      </v-card>
                    </template>

                    <div v-else class="empty-state">
                      <v-icon size="54" icon="mdi-brain-outline" class="mb-3" />
                      <div class="text-h6 mb-1">Chưa tìm thấy tri thức phù hợp</div>
                      <div class="text-body-2 text-medium-emphasis">
                        Hãy thử đổi bộ lọc hoặc thêm tri thức mới cho AI.
                      </div>
                    </div>
                  </div>
                </v-card>
              </div>
            </v-window-item>

            <v-window-item value="operations">
              <div class="section-stack">
                <v-card class="section-card" elevation="0" border>
                  <div class="section-card__headline">
                    <div>
                      <div class="text-caption text-medium-emphasis text-uppercase">
                        Lớp 3
                      </div>
                      <h2 class="text-h6 font-weight-bold mb-1">AI được phép tự làm gì</h2>
                      <p class="text-body-2 text-medium-emphasis mb-0">
                        Thiết lập chế độ phản hồi, lịch hoạt động, auto follow-up và điều kiện dừng.
                      </p>
                    </div>
                    <div class="d-flex align-center ga-3">
                      <v-switch
                        v-model="aiConfig.enabled"
                        color="success"
                        hide-details
                        inset
                        label="Kích hoạt trợ lý AI"
                        class="mt-0"
                      />
                      <v-chip color="indigo" variant="tonal">
                        {{ operationsModeLabel }}
                      </v-chip>
                    </div>
                  </div>

                  <v-row dense>
                    <v-col cols="12" md="6">
                      <div class="settings-block">
                        <div class="settings-block__title">Chế độ phản hồi</div>
                        <v-radio-group v-model="aiConfig.aiResponseMode" density="compact">
                          <v-radio value="auto" color="indigo" label="Tự động hoàn toàn" />
                          <v-radio value="hybrid" color="indigo" label="Soạn nháp để nhân viên duyệt" />
                        </v-radio-group>
                      </div>
                    </v-col>
                    <v-col cols="12" md="6">
                      <div class="settings-block">
                        <div class="settings-block__title">Khung giờ làm việc của AI</div>
                        <v-radio-group v-model="aiConfig.aiWorkMode" density="compact">
                          <v-radio value="always" color="indigo" label="Luôn hoạt động 24/7" />
                          <v-radio value="off_hours" color="indigo" label="Chỉ ngoài giờ hành chính" />
                          <v-radio value="on_hours" color="indigo" label="Chỉ trong giờ hành chính" />
                          <v-radio value="manual" color="indigo" label="Tắt vận hành tự động" />
                        </v-radio-group>
                      </div>
                    </v-col>
                  </v-row>
                  <v-divider class="my-4 opacity-10" />

                  <div class="settings-block">
                    <div class="settings-block__title d-flex align-center">
                      <v-icon start size="18" color="indigo" class="mr-2">mdi-cog-sync-outline</v-icon>
                      Thông số AI phản hồi
                    </div>
                    <v-row>
                      <v-col cols="12" md="6">
                        <div class="d-flex flex-column ga-2">
                          <div class="d-flex justify-space-between align-center">
                            <span class="text-body-2 font-weight-medium">Độ trễ phản hồi</span>
                            <v-chip size="x-small" color="indigo" variant="flat">{{ aiConfig.autoReplyDelay }} giây</v-chip>
                          </div>
                          <v-slider
                            v-model="aiConfig.autoReplyDelay"
                            min="0"
                            max="60"
                            step="1"
                            color="indigo"
                            hide-details
                            thumb-label
                          />
                          <div class="text-caption text-medium-emphasis">
                            Trì hoãn một chút để gom tin nhắn của khách, giúp AI trả lời tự nhiên hơn.
                          </div>
                        </div>
                      </v-col>
                      <v-col cols="12" md="6">
                        <div class="d-flex flex-column ga-2">
                          <div class="d-flex justify-space-between align-center">
                            <span class="text-body-2 font-weight-medium">Ngưỡng độ tin cậy</span>
                            <v-chip size="x-small" color="indigo" variant="flat">{{ Math.round(aiConfig.confidenceThreshold * 100) }}%</v-chip>
                          </div>
                          <v-slider
                            v-model="aiConfig.confidenceThreshold"
                            min="0.1"
                            max="1.0"
                            step="0.05"
                            color="indigo"
                            hide-details
                            thumb-label
                          />
                          <div class="text-caption text-medium-emphasis">
                            AI chỉ tự động trả lời khi chắc chắn trên mức này. Nếu thấp hơn, AI sẽ im lặng.
                          </div>
                        </div>
                      </v-col>
                    </v-row>
                  </div>

                  <div class="d-flex justify-end mt-4">
                    <v-btn
                      color="indigo"
                      variant="flat"
                      rounded="lg"
                      :loading="aiSaving"
                      @click="saveAiConfig"
                    >
                      Lưu chế độ vận hành
                    </v-btn>
                  </div>
                </v-card>

                <v-card class="section-card" elevation="0" border>
                  <div class="section-card__headline">
                    <div>
                      <div class="text-subtitle-1 font-weight-bold">Tự động bám đuổi</div>
                      <p class="text-body-2 text-medium-emphasis mb-0">
                        AI chủ động nhắc khách khi cuộc trò chuyện bị ngắt quãng.
                      </p>
                    </div>
                    <v-switch
                      v-model="aiConfig.followUpEnabled"
                      color="secondary"
                      hide-details
                      inset
                    />
                  </div>

                  <v-row dense class="mb-3">
                    <v-col cols="12" md="6">
                      <v-select
                        v-model="aiConfig.followUpInterval"
                        :items="intervalOptions"
                        label="Gửi sau khi khách im lặng"
                        variant="outlined"
                        rounded="lg"
                        prepend-inner-icon="mdi-clock-outline"
                      />
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-select
                        v-model="aiConfig.followUpMaxMessages"
                        :items="[1, 2, 3, 4, 5]"
                        label="Số tin bám đuổi tối đa"
                        variant="outlined"
                        rounded="lg"
                        prepend-inner-icon="mdi-counter"
                      />
                    </v-col>
                  </v-row>

                  <v-radio-group v-model="aiConfig.followUpType" inline class="mb-4">
                    <v-radio value="ai" color="secondary" label="AI tự viết nội dung" />
                    <v-radio value="manual" color="secondary" label="Dùng mẫu cố định" />
                  </v-radio-group>

                  <v-textarea
                    v-if="aiConfig.followUpType === 'manual'"
                    v-model="aiConfig.followUpManualContent"
                    label="Nội dung mẫu follow-up"
                    variant="outlined"
                    rows="4"
                    rounded="lg"
                  />
                  <v-alert
                    v-else
                    variant="tonal"
                    color="secondary"
                    rounded="lg"
                    density="comfortable"
                  >
                    AI sẽ đọc lại ngữ cảnh gần nhất để viết một câu follow-up phù hợp, tránh spam.
                  </v-alert>

                  <div class="d-flex justify-end mt-4">
                    <v-btn
                      color="secondary"
                      variant="flat"
                      rounded="lg"
                      :loading="aiSaving"
                      @click="saveAiConfig"
                    >
                      Lưu bám đuổi
                    </v-btn>
                  </div>
                </v-card>

                <v-card class="section-card" elevation="0" border>
                  <div class="section-card__headline">
                    <div>
                      <div class="text-subtitle-1 font-weight-bold">Dừng và tiếp tục AI</div>
                      <p class="text-body-2 text-medium-emphasis mb-0">
                        Khi gặp tình huống nhạy cảm, AI nên nhường quyền lại cho người thật.
                      </p>
                    </div>
                    <v-chip size="small" color="error" variant="tonal">
                      {{ stopConditionCount }} điều kiện
                    </v-chip>
                  </div>

                  <div v-if="!stopConditions.length" class="empty-inline mb-4">
                    <v-icon icon="mdi-shield-alert-outline" size="22" class="mr-2" />
                    Chưa có điều kiện dừng nào được thiết lập.
                  </div>

                  <div v-else class="mb-4">
                    <div
                      v-for="(_, index) in aiConfig.stopConditions"
                      :key="`stop-${index}`"
                      class="mb-2"
                    >
                      <v-text-field
                        v-model="aiConfig.stopConditions[index]"
                        variant="outlined"
                        density="compact"
                        rounded="lg"
                        hide-details
                        prepend-inner-icon="mdi-circle-medium"
                      >
                        <template #append>
                          <v-btn
                            icon="mdi-delete-outline"
                            variant="text"
                            color="error"
                            size="small"
                            @click="removeStopCondition(Number(index))"
                          />
                        </template>
                      </v-text-field>
                    </div>
                  </div>

                  <div class="d-flex flex-wrap ga-2 mb-4">
                    <v-btn
                      variant="outlined"
                      color="primary"
                      rounded="lg"
                      prepend-icon="mdi-plus"
                      @click="addStopCondition"
                    >
                      Thêm điều kiện
                    </v-btn>
                    <v-chip
                      v-for="template in stopTemplates"
                      :key="template.title"
                      :color="template.color"
                      variant="tonal"
                      @click="addStopFromTemplate(template.content)"
                    >
                      <v-icon start :icon="template.icon" size="14" />
                      {{ template.title }}
                    </v-chip>
                  </div>

                  <v-switch
                    v-model="aiConfig.autoResumeEnabled"
                    label="Tự động tiếp tục phản hồi"
                    color="primary"
                    hide-details
                    inset
                    class="mb-3"
                  />

                  <v-select
                    v-if="aiConfig.autoResumeEnabled"
                    v-model="aiConfig.autoResumeMinutes"
                    :items="resumeIntervalOptions"
                    label="Tiếp tục sau"
                    variant="outlined"
                    density="comfortable"
                    rounded="lg"
                    class="mb-4"
                  />

                  <div class="d-flex justify-end">
                    <v-btn
                      color="primary"
                      variant="flat"
                      rounded="lg"
                      :loading="aiSaving"
                      @click="saveAiConfig"
                    >
                      Lưu điều kiện
                    </v-btn>
                  </div>
                </v-card>

                <v-card class="section-card" elevation="0" border>
                  <div class="section-card__headline">
                    <div>
                      <div class="text-subtitle-1 font-weight-bold">Tự động trích xuất CRM</div>
                      <p class="text-body-2 text-medium-emphasis mb-0">
                        Cho phép AI cập nhật dữ liệu khách hàng ngay trong lúc trò chuyện.
                      </p>
                    </div>
                  </div>

                  <v-list bg-color="transparent" class="pa-0">
                    <v-list-item class="px-0">
                      <template #prepend>
                        <v-icon icon="mdi-account-details-outline" color="success" />
                      </template>
                      <v-list-item-title>Tự động lấy số điện thoại và địa chỉ</v-list-item-title>
                      <v-list-item-subtitle>
                        Cập nhật lại CRM khi khách đã cung cấp thông tin đủ rõ.
                      </v-list-item-subtitle>
                      <template #append>
                        <v-switch
                          v-model="aiConfig.autoExtractInfo"
                          color="success"
                          hide-details
                          inset
                          density="compact"
                        />
                      </template>
                    </v-list-item>
                    <v-list-item class="px-0">
                      <template #prepend>
                        <v-icon icon="mdi-lightning-bolt-outline" color="success" />
                      </template>
                      <v-list-item-title>Tự động đánh dấu khách tiềm năng</v-list-item-title>
                      <v-list-item-subtitle>
                        Phù hợp khi đội sales muốn CRM tự gom lead đủ điều kiện.
                      </v-list-item-subtitle>
                      <template #append>
                        <v-switch
                          v-model="aiConfig.autoCreateLeads"
                          color="success"
                          hide-details
                          inset
                          density="compact"
                        />
                      </template>
                    </v-list-item>
                  </v-list>

                  <div class="d-flex justify-end mt-4">
                    <v-btn
                      color="success"
                      variant="flat"
                      rounded="lg"
                      :loading="aiSaving"
                      @click="saveAiConfig"
                    >
                      Lưu tự động hóa
                    </v-btn>
                  </div>
                </v-card>
              </div>
            </v-window-item>
          </v-window>
        </v-card>
      </v-col>

      <v-col v-if="showSimulator" cols="12" md="5">
        <v-card class="simulator-panel" elevation="0" border>
          <div class="simulator-panel__header">
            <div>
              <div class="text-caption text-medium-emphasis text-uppercase">
                Sandbox
              </div>
              <div class="text-subtitle-1 font-weight-bold">Trình giả lập AI</div>
            </div>
            <div class="simulator-scope">
              <v-chip size="small" color="primary" variant="tonal">
                Đang kiểm thử: {{ currentSimAccountName }}
              </v-chip>
              <div class="text-caption text-medium-emphasis mt-1">
                Simulator luôn bám theo kênh đang chọn ở đầu trang.
              </div>
            </div>
          </div>

          <div ref="chatContainer" class="simulator-messages custom-scrollbar">
            <div v-if="testMessages.length === 0" class="empty-state compact">
              <v-icon size="48" icon="mdi-chat-question-outline" class="mb-3" />
              <div class="text-body-1 font-weight-medium mb-2">
                Hỏi thử AI trước khi áp dụng thật
              </div>
              <div class="text-body-2 text-medium-emphasis">
                Simulator này phù hợp nhất để kiểm tra cá tính trả lời và chất lượng tri thức mới nạp
                cho {{ currentSimAccountName }}.
              </div>
            </div>

            <div
              v-for="(message, index) in testMessages"
              :key="`${message.role}-${index}`"
              :class="['d-flex mb-4 fade-in', message.role === 'user' ? 'justify-end' : 'justify-start']"
            >
              <div :class="['message-bubble-wrapper', message.role === 'user' ? 'user-wrapper' : 'ai-wrapper']">
                <div
                  v-if="message.role === 'ai'"
                  class="text-caption font-weight-bold mb-1 primary--text d-flex align-center"
                >
                  <v-icon size="14" class="mr-1" icon="mdi-robot-outline" />
                  AI Agent ({{ currentSimAccountName }})
                </div>

                <div :class="['message-bubble', message.role === 'user' ? 'zalo-user-bubble' : 'zalo-ai-bubble']">
                  {{ message.content }}
                </div>

                <div v-if="message.sources?.length" class="sources-container mt-2">
                  <div class="text-xxs font-weight-bold opacity-60 mb-1 d-flex align-center">
                    <v-icon size="10" icon="mdi-book-open-variant" class="mr-1" />
                    TRI THỨC ĐÃ DÙNG
                  </div>
                  <div class="d-flex flex-wrap ga-1">
                    <v-chip
                      v-for="source in message.sources"
                      :key="source.id"
                      size="x-small"
                      variant="tonal"
                      color="secondary"
                      class="source-chip"
                      @click="jumpToKnowledge(source.id)"
                    >
                      {{ source.title }}
                      <v-icon end size="10" icon="mdi-arrow-right" class="ml-1" />
                    </v-chip>
                  </div>
                </div>

                <div v-if="message.role === 'ai'" class="mt-1">
                  <v-btn
                    variant="text"
                    size="x-small"
                    color="primary"
                    prepend-icon="mdi-auto-fix"
                    class="px-1 opacity-70"
                    @click="openCorrectDialog(message, index)"
                  >
                    Chưa ổn? Sửa câu trả lời
                  </v-btn>
                </div>
              </div>
            </div>

            <div v-if="testing" class="d-flex justify-start mb-4">
              <div class="message-bubble zalo-ai-bubble d-flex align-center">
                <v-progress-circular indeterminate size="16" width="2" color="primary" class="mr-2" />
                <span class="text-caption">AI đang tra cứu tri thức riêng...</span>
              </div>
            </div>
          </div>

          <div class="simulator-panel__footer">
            <v-text-field
              v-model="testQuestion"
              placeholder="Bạn muốn hỏi gì?"
              variant="solo"
              density="comfortable"
              flat
              rounded="pill"
              hide-details
              :disabled="testing"
              @keyup.enter="runTest"
            >
              <template #append-inner>
                <v-btn
                  icon
                  size="small"
                  color="primary"
                  variant="flat"
                  :loading="testing"
                  @click="runTest"
                >
                  <v-icon icon="mdi-send" />
                </v-btn>
              </template>
            </v-text-field>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="editDialog.show" max-width="820" persistent>
      <v-card class="form-dialog">
        <v-toolbar color="primary" density="comfortable">
          <v-toolbar-title class="text-subtitle-1 font-weight-bold">
            {{ editDialog.isEdit ? 'Cập nhật tri thức' : 'Nạp tri thức mới' }}
          </v-toolbar-title>
          <v-btn icon @click="editDialog.show = false">
            <v-icon icon="mdi-close" />
          </v-btn>
        </v-toolbar>

        <v-card-text class="pa-6">
          <v-form ref="form" v-model="editDialog.valid">
            <v-row dense>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editDialog.item.title"
                  label="Tiêu đề gợi nhớ"
                  variant="outlined"
                  :rules="[requiredRule('Cần có tiêu đề')]"
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
                  hint="Mặc định sẽ bám theo kênh đang mở. Chỉ chuyển về toàn cục khi kiến thức này dùng chung cho nhiều kênh."
                  persistent-hint
                />
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="editDialog.item.content"
                  label="Nội dung tri thức"
                  variant="outlined"
                  rows="8"
                  :rules="[requiredRule('Bạn chưa nhập kiến thức')]"
                />
              </v-col>
              <v-col cols="12">
                <v-switch
                  v-model="editDialog.item.isActive"
                  label="Kích hoạt tri thức này"
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
          <v-btn color="primary" variant="flat" :loading="saving" @click="saveItem">
            Lưu tri thức
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialog.show" max-width="400">
      <v-card>
        <v-card-title class="bg-error text-white pa-4">Xóa tri thức?</v-card-title>
        <v-card-text class="pa-6">Hành động này không thể hoàn tác.</v-card-text>
        <v-card-actions class="pa-6 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog.show = false">Quay lại</v-btn>
          <v-btn color="error" variant="flat" :loading="deleting" @click="doDelete">
            Xóa vĩnh viễn
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="correctDialog.show" max-width="620">
      <v-card class="form-dialog">
        <v-toolbar color="secondary" density="comfortable">
          <v-toolbar-title class="text-subtitle-1 font-weight-bold">
            Dạy AI trả lời tốt hơn
          </v-toolbar-title>
          <v-btn icon @click="correctDialog.show = false">
            <v-icon icon="mdi-close" />
          </v-btn>
        </v-toolbar>
        <v-card-text class="pa-6">
          <div class="mb-4">
            <div class="text-caption font-weight-bold mb-1 opacity-60">CÂU HỎI CỦA KHÁCH</div>
            <div class="pa-3 bg-grey-lighten-4 rounded-lg text-body-2">
              {{ correctDialog.question }}
            </div>
          </div>
          <div class="mb-4">
            <div class="text-caption font-weight-bold mb-1 opacity-60">AI ĐÃ TRẢ LỜI</div>
            <div class="pa-3 bg-grey-lighten-4 rounded-lg text-body-2 italic opacity-70">
              {{ correctDialog.originalAnswer }}
            </div>
          </div>
          <v-textarea
            v-model="correctDialog.desiredAnswer"
            label="Câu trả lời bạn mong muốn"
            variant="outlined"
            rows="4"
            hide-details
            class="mb-2"
          />
          <p class="text-caption text-medium-emphasis mt-2 mb-0">
            AI sẽ đề xuất cập nhật hoặc tạo mới tri thức dựa trên câu trả lời chuẩn mà bạn mong muốn.
          </p>
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
            Phân tích và đề xuất
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="toast.show" :color="toast.color" rounded="pill">
      <v-icon class="mr-2">{{ toast.icon }}</v-icon>
      {{ toast.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { api } from '@/api';
import { useZaloAccounts } from '@/composables/use-zalo-accounts';

type StudioSection = 'behavior' | 'knowledge' | 'operations';

type KnowledgeItem = {
  id: string;
  title: string;
  content: string;
  category: string;
  isActive: boolean;
  zaloAccountId: string | null;
  zaloAccount?: { displayName?: string | null } | null;
  useCount: number;
};

type AccountOption = { title: string; value: string | null };
type ConfigScopeMeta = {
  hasChannelOverride: boolean;
  usesDefaultConfig: boolean;
  scopeType: 'org' | 'channel';
  scopeAccountId: string | null;
  scopeAccountName: string | null;
  scopeChannelType: 'zalo' | 'facebook' | null;
};
type ChannelScopeCard = {
  id: string;
  displayName: string;
  subtitle: string;
  avatarUrl: string | null;
  channelType: 'zalo' | 'facebook';
  isInherited: boolean;
  statusLabel: string;
  statusColor: string;
};

const { accounts, fetchAccounts } = useZaloAccounts();

const activeSection = ref<StudioSection>('behavior');
const items = ref<KnowledgeItem[]>([]);
const aiConfig = ref<any>({
  enabled: false,
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
  aiResponseMode: 'hybrid',
  autoReplyDelay: 0,
  confidenceThreshold: 0.8,
});
const configScopeId = ref<string | null>(null);
const configScopeMeta = ref<ConfigScopeMeta>({
  hasChannelOverride: false,
  usesDefaultConfig: false,
  scopeType: 'org',
  scopeAccountId: null,
  scopeAccountName: null,
  scopeChannelType: null,
});

const loading = ref(false);
const aiSaving = ref(false);
const saving = ref(false);
const deleting = ref(false);
const testing = ref(false);
const savingMagic = ref(false);
const resettingScope = ref(false);

const search = ref('');
const filterCategory = ref('Tất cả');
const magicInput = ref('');
const magicAccountId = ref<string | null>(null);
const testQuestion = ref('');
const testMessages = ref<any[]>([]);
const chatContainer = ref<HTMLElement | null>(null);
const toast = ref({ show: false, text: '', color: 'success', icon: 'mdi-check-circle' });

const editDialog = ref({
  show: false,
  isEdit: false,
  valid: true,
  item: {
    id: '',
    title: '',
    content: '',
    category: 'Chung',
    isActive: true,
    zaloAccountId: null as string | null,
  },
});

const deleteDialog = ref({ show: false, item: null as KnowledgeItem | null });
const correctDialog = ref({
  show: false,
  loading: false,
  question: '',
  originalAnswer: '',
  desiredAnswer: '',
  sourceIds: [] as string[],
  index: -1,
});

const languageOptions = [
  { title: 'Tự động nhận diện', value: 'auto' },
  { title: 'Luôn dùng tiếng Việt', value: 'vi' },
  { title: 'Luôn dùng tiếng Anh', value: 'en' },
];

const intervalOptions = [
  { title: '5 phút', value: 5 },
  { title: '15 phút', value: 15 },
  { title: '30 phút', value: 30 },
  { title: '1 giờ', value: 60 },
  { title: '2 giờ', value: 120 },
  { title: '4 giờ', value: 240 },
  { title: '12 giờ', value: 720 },
  { title: '24 giờ', value: 1440 },
];

const resumeIntervalOptions = [
  { title: '30 phút', value: 30 },
  { title: '1 giờ', value: 60 },
  { title: '2 giờ', value: 120 },
  { title: '4 giờ', value: 240 },
  { title: '12 giờ', value: 720 },
  { title: '24 giờ', value: 1440 },
];

const personaTemplates = [
  {
    name: 'Chuyên nghiệp mặc định',
    description: 'Lịch sự, rõ ràng, dùng được cho đa số doanh nghiệp',
    icon: 'mdi-briefcase-outline',
    preview: 'Trả lời gọn, đáng tin, không quá lạnh và không quá bán hàng.',
    content:
      "Bạn là một trợ lý tư vấn chuyên nghiệp và đáng tin cậy của doanh nghiệp.\n- Cách xưng hô: Gọi khách là 'Anh/Chị' nếu chưa rõ độ tuổi. Xưng là 'Em' hoặc 'Shop' tùy ngữ cảnh, nhưng luôn giữ sự lịch sự.\n- Phong cách: Trả lời ngắn gọn, rõ ý, đi thẳng vào thông tin khách cần. Không dùng quá nhiều icon, không dùng từ ngữ phô trương.\n- Ưu tiên: Cung cấp thông tin chính xác, dễ hiểu, sau đó mới gợi ý bước tiếp theo như xem thêm mẫu, báo giá hoặc chốt đơn.\n- Tránh: Nói quá thân mật, hứa hẹn khi chưa chắc dữ liệu, hoặc trả lời vòng vo.",
  },
  {
    name: 'Thân thiện tự nhiên',
    description: 'Gần gũi, linh hoạt, tạo cảm giác như đang chat với người thật',
    icon: 'mdi-chat-outline',
    preview: 'Mềm, tự nhiên, ít kịch bản, không lạm dụng emoji.',
    content:
      "Bạn là một nhân viên tư vấn thân thiện, tự nhiên và giống người thật khi trò chuyện với khách.\n- Cách xưng hô: Linh hoạt theo ngữ cảnh, ưu tiên 'Anh/Chị - Em' hoặc cách gọi tự nhiên, gần gũi nhưng không suồng sã.\n- Phong cách: Dùng câu ngắn, đời thường, dễ đọc. Có thể mềm mại và thân thiện, nhưng không nên quá màu mè hoặc quá công thức.\n- Ưu tiên: Tạo cảm giác dễ nói chuyện, phản hồi nhanh, rõ ý, giữ mạch hội thoại tự nhiên như một nhân viên thật.\n- Tránh: Lạm dụng icon, dùng từ quá sến, hoặc hỏi dồn dập làm khách thấy bị ép.",
  },
  {
    name: 'Chốt đơn nhanh',
    description: 'Chủ động, có lực bán hàng, tập trung đưa khách sang bước đặt hàng',
    icon: 'mdi-cart-arrow-right',
    preview: 'Trả lời nhanh, có CTA rõ, luôn hướng khách tới bước chốt đơn.',
    content:
      "Bạn là trợ lý bán hàng có mục tiêu chốt đơn nhanh và gọn.\n- Cách xưng hô: Thân thiện, lịch sự, ưu tiên 'Anh/Chị - Em' hoặc 'Shop' tùy ngữ cảnh.\n- Phong cách: Trả lời ngắn, rõ, có năng lượng. Sau khi giải đáp thắc mắc, chủ động dẫn khách sang bước tiếp theo như chọn mẫu, chọn màu, xác nhận số lượng, xin thông tin nhận hàng.\n- Ưu tiên: Rút ngắn thời gian ra quyết định của khách, nhấn vào lợi ích chính, ưu đãi và bước hành động cụ thể.\n- Tránh: Nói lan man, trả lời quá dài, hoặc tư vấn quá học thuật khi khách đang có ý định mua rõ ràng.",
  },
  {
    name: 'Tư vấn tận tâm',
    description: 'Lắng nghe, khai thác nhu cầu trước khi đề xuất giải pháp',
    icon: 'mdi-heart-pulse',
    preview: 'Nhẹ nhàng, biết hỏi lại đúng lúc và giải thích vì sao phù hợp.',
    content:
      "Bạn là một tư vấn viên tận tâm, biết lắng nghe và thấu hiểu khách hàng.\n- Cách xưng hô: 'Anh/Chị - Em'. Giữ sự nhẹ nhàng và tôn trọng trong suốt cuộc hội thoại.\n- Phong cách: Trước khi đề xuất giải pháp, nên hỏi thêm 1-2 câu để hiểu đúng nhu cầu, tình trạng hoặc mong muốn thật sự của khách.\n- Ưu tiên: Giải thích rõ vì sao sản phẩm hoặc dịch vụ này phù hợp, giúp khách cảm thấy được quan tâm chứ không bị bán hàng gấp.\n- Tránh: Nhảy vào chốt đơn quá nhanh khi khách còn đang tìm hiểu hoặc chưa nói rõ nhu cầu.",
  },
  {
    name: 'Kỹ thuật rõ ràng',
    description: 'Có cấu trúc, thẳng vấn đề, hợp sản phẩm nhiều thông số',
    icon: 'mdi-tools',
    preview: 'Ưu tiên bullet points, quy trình và thông tin chính xác.',
    content:
      "Bạn là chuyên gia hỗ trợ kỹ thuật và tư vấn sản phẩm có nhiều thông số.\n- Cách xưng hô: 'Anh/Chị - Shop' hoặc 'Anh/Chị - Em', giữ sự rõ ràng và nghiêm túc.\n- Phong cách: Trả lời thẳng vào vấn đề, ưu tiên cấu trúc bullet points hoặc từng bước khi nói về thông số, hướng dẫn sử dụng, lắp đặt, bảo hành hoặc xử lý lỗi.\n- Ưu tiên: Tính chính xác, khả năng đọc nhanh, và giảm tối đa hiểu nhầm.\n- Tránh: Dùng ngôn ngữ hoa mỹ, cảm tính quá mức, hoặc trả lời mơ hồ với câu hỏi kỹ thuật.",
  },
  {
    name: 'CSKH sau bán',
    description: 'Bình tĩnh, có trách nhiệm, phù hợp đổi trả và hỗ trợ sau mua',
    icon: 'mdi-lifebuoy',
    preview: 'Trấn an khách, xử lý từng bước, ưu tiên giải quyết vấn đề.',
    content:
      "Bạn là nhân viên chăm sóc khách hàng sau bán, có trách nhiệm và biết trấn an khách.\n- Cách xưng hô: 'Anh/Chị - Em'. Giữ giọng bình tĩnh, chắc chắn và hỗ trợ.\n- Phong cách: Khi khách gặp vấn đề, hãy xác nhận lại tình huống, hướng dẫn từng bước xử lý, và cho khách thấy shop đang đồng hành để giải quyết.\n- Ưu tiên: Làm rõ tình trạng đơn hàng, đổi trả, bảo hành, hướng dẫn sử dụng hoặc hỗ trợ sau mua một cách có trật tự.\n- Tránh: Tranh luận với khách, đổ lỗi, hoặc trả lời cụt lủn khiến khách cảm thấy bị bỏ rơi.",
  },
];

const knowledgeTemplates = [
  {
    group: 'Thông tin',
    name: 'Vận chuyển',
    icon: 'mdi-truck-delivery',
    content:
      'Chính sách giao hàng: Shop miễn phí ship cho đơn từ 500k. Đơn dưới 500k tính 20k nội thành và 30k ngoại thành. Thời gian giao hàng: nội thành 1-2 ngày, ngoại thành 3-5 ngày.',
  },
  {
    group: 'Thông tin',
    name: 'Thanh toán',
    icon: 'mdi-bank',
    content:
      'Thông tin thanh toán: chuyển khoản vào tài khoản của shop hoặc thanh toán COD. Khi chuyển khoản, khách cần ghi rõ họ tên và số điện thoại để đối soát đơn.',
  },
  {
    group: 'Thông tin',
    name: 'Thông tin shop',
    icon: 'mdi-store-marker',
    content:
      'Địa chỉ shop, giờ làm việc, khu vực giao hàng, chính sách hỗ trợ đổi trả và hotline chăm sóc khách hàng.',
  },
  {
    group: 'Thông tin',
    name: 'Liên hệ',
    icon: 'mdi-phone-in-talk',
    content:
      'Hotline hỗ trợ, email, website, các kênh chat chính và thời gian phản hồi của bộ phận tư vấn.',
  },
  {
    group: 'Bán hàng',
    name: 'Bảng giá',
    icon: 'mdi-tag-text-outline',
    content:
      'Bảng giá sản phẩm hiện tại, combo khuyến mại, điều kiện áp dụng mã giảm giá và mốc miễn phí vận chuyển.',
  },
  {
    group: 'Bán hàng',
    name: 'Chốt đơn',
    icon: 'mdi-cart-arrow-right',
    content:
      'Kịch bản chốt đơn: xác nhận mẫu, màu, size, số lượng, địa chỉ, số điện thoại và nhắc lại ưu đãi còn hiệu lực.',
  },
  {
    group: 'Bán hàng',
    name: 'Xử lý giá cao',
    icon: 'mdi-diamond-stone',
    content:
      'Kịch bản xử lý phản đối về giá: nhấn vào chất lượng, bảo hành, độ bền, dịch vụ hậu mãi và so sánh giá trị dài hạn.',
  },
];

const stopTemplates = [
  {
    title: 'Khách đang khiếu nại',
    icon: 'mdi-alert-octagon-outline',
    color: 'error',
    content: 'Khách đang bức xúc, khiếu nại, đòi hoàn tiền hoặc yêu cầu xử lý sự cố gấp.',
  },
  {
    title: 'Muốn gặp người thật',
    icon: 'mdi-account-voice',
    color: 'secondary',
    content: 'Khách yêu cầu gặp tư vấn viên, gọi điện trực tiếp hoặc muốn nói chuyện với quản lý.',
  },
  {
    title: 'Thông tin nhạy cảm',
    icon: 'mdi-lock-outline',
    color: 'warning',
    content: 'Khách hỏi về dữ liệu cá nhân, bảo mật, giấy tờ, hợp đồng hoặc thông tin ngoài phạm vi AI nên trả lời.',
  },
  {
    title: 'Mặc cả quá sâu',
    icon: 'mdi-tag-remove-outline',
    color: 'info',
    content: 'Khách đòi giảm giá vượt quá chính sách hiện hành hoặc ép giá nhiều lần.',
  },
];

const accountOptions = computed<AccountOption[]>(() => {
  const scoped = accounts.value.map((account) => ({
    title: account.displayName || account.id,
    value: account.id,
  }));
  return [{ title: 'Tất cả tài khoản', value: null }, ...scoped];
});

const categories = computed(() => {
  const unique = new Set(
    items.value
      .map((item) => item.category)
      .filter((category): category is string => Boolean(category)),
  );
  return ['Tất cả', ...Array.from(unique)];
});

const filterCategoriesOnly = computed(() => categories.value.filter((category) => category !== 'Tất cả'));
const stopConditions = computed(() =>
  (aiConfig.value.stopConditions || []).filter((condition: string) => condition && condition.trim()),
);
const activeKnowledgeCount = computed(() => items.value.filter((item) => item.isActive).length);
const scopedKnowledgeCount = computed(() => items.value.filter((item) => Boolean(item.zaloAccountId)).length);
const globalKnowledgeCount = computed(() => items.value.filter((item) => !item.zaloAccountId).length);
const stopConditionCount = computed(() => stopConditions.value.length);
const showSimulator = computed(() => activeSection.value !== 'operations');

const currentSectionTitle = computed(() => {
  if (activeSection.value === 'behavior') return 'Cá tính và nguyên tắc trả lời';
  if (activeSection.value === 'knowledge') return 'Kho tri thức và kiểm thử phản hồi';
  return 'Vận hành, tự động hóa và ranh giới của AI';
});

const currentMagicAccountName = computed(() => {
  return accountOptions.value.find((option) => option.value === magicAccountId.value)?.title || 'Tất cả tài khoản';
});

const currentSimAccountName = computed(() => {
  return currentConfigScopeName.value;
});

const channelScopeCards = computed<ChannelScopeCard[]>(() =>
  accounts.value.map((account) => ({
    id: account.id,
    displayName: account.displayName || account.id,
    subtitle: account.channelType === 'facebook'
      ? `Fanpage ${account.fbPageId || account.id}`
      : `Zalo ${account.zaloUid || account.id}`,
    avatarUrl: account.avatarUrl || null,
    channelType: account.channelType,
    isInherited: configScopeId.value === account.id ? configScopeMeta.value.usesDefaultConfig : true,
    statusLabel: account.status === 'connected' ? 'Đang kết nối' : 'Chưa sẵn sàng',
    statusColor: account.status === 'connected' ? 'success' : 'warning',
  })),
);

const currentConfigScopeName = computed(() => {
  return accounts.value.find((account) => account.id === configScopeId.value)?.displayName
    || (configScopeId.value ? configScopeId.value : 'Cấu hình nền toàn workspace');
});

const currentScopeDescription = computed(() => {
  if (!configScopeId.value) {
    return 'Đây là lớp fallback cho các kênh chưa có cấu hình riêng. Chỉ nên giữ rule nền chung, không nên nhét toàn bộ logic brand vào đây.';
  }
  return configScopeMeta.value.usesDefaultConfig
    ? `Kênh này hiện vẫn đang kế thừa cấu hình nền. Lần lưu tiếp theo sẽ tạo cấu hình riêng cho ${currentConfigScopeName.value}.`
    : `Bạn đang chỉnh bộ AI riêng cho ${currentConfigScopeName.value}. Các thay đổi ở đây sẽ không ảnh hưởng những kênh khác.`;
});

const currentScopeChipLabel = computed(() => {
  if (!configScopeId.value) return 'Cấu hình nền';
  return configScopeMeta.value.usesDefaultConfig ? 'Đang kế thừa nền' : 'Đang dùng config riêng';
});

const currentScopeChipColor = computed(() => {
  if (!configScopeId.value) return 'primary';
  return configScopeMeta.value.usesDefaultConfig ? 'warning' : 'success';
});

const operationsModeLabel = computed(() => {
  return aiConfig.value.aiResponseMode === 'hybrid' ? 'Hybrid mode' : 'Auto mode';
});

const summaryCards = computed(() => [
  {
    key: 'behavior',
    label: 'AI nói như thế nào',
    value: aiConfig.value.enabled ? 'Đang bật' : 'Tạm tắt',
    description: aiConfig.value.instructions
      ? 'Trang này đang có chỉ dẫn cá tính tùy biến cho AI.'
      : 'AI đang chạy với playbook mặc định và chưa có chỉ dẫn riêng.',
    icon: 'mdi-comment-quote-outline',
    color: 'primary',
    chips: [
      aiConfig.value.languagePolicy === 'en'
        ? 'Tiếng Anh'
        : aiConfig.value.languagePolicy === 'vi'
          ? 'Tiếng Việt'
          : 'Tự động ngôn ngữ',
      aiConfig.value.instructions ? 'Có custom prompt' : 'Chưa có custom prompt',
    ],
  },
  {
    key: 'knowledge',
    label: 'AI biết gì',
    value: `${items.value.length} mục tri thức`,
    description: 'Tri thức có thể dùng toàn workspace hoặc gắn riêng cho từng tài khoản kết nối.',
    icon: 'mdi-database-outline',
    color: 'secondary',
    chips: [`${globalKnowledgeCount.value} toàn cục`, `${scopedKnowledgeCount.value} theo kênh`],
  },
  {
    key: 'operations',
    label: 'AI được phép làm gì',
    value: operationsModeLabel.value,
    description: 'Quyết định AI tự gửi, chỉ soạn nháp hay nhường lại cho nhân viên trong từng tình huống.',
    icon: 'mdi-robot-cog-outline',
    color: 'indigo',
    chips: [
      aiConfig.value.followUpEnabled ? 'Có bám đuổi' : 'Không bám đuổi',
      stopConditionCount.value > 0 ? `${stopConditionCount.value} điều kiện dừng` : 'Chưa có điều kiện dừng',
    ],
  },
]);

const filteredItems = computed(() => {
  return items.value.filter((item) => {
    const text = `${item.title} ${item.content}`.toLowerCase();
    const matchesSearch = text.includes(search.value.toLowerCase());
    const matchesCategory = filterCategory.value === 'Tất cả' || item.category === filterCategory.value;
    const matchesAccount = configScopeId.value
      ? !item.zaloAccountId || item.zaloAccountId === configScopeId.value
      : true;
    return matchesSearch && matchesCategory && matchesAccount;
  });
});

function requiredRule(message: string) {
  return (value: string) => Boolean(value) || message;
}

function applyPersona(template: (typeof personaTemplates)[number]) {
  aiConfig.value.instructions = template.content;
  toast.value = {
    show: true,
    text: `Đã áp dụng mẫu cá tính: ${template.name}`,
    color: 'info',
    icon: 'mdi-cached',
  };
}

function applyKnowledgeTemplate(template: (typeof knowledgeTemplates)[number]) {
  magicInput.value = template.content;
  activeSection.value = 'knowledge';
  toast.value = {
    show: true,
    text: `Đã dán mẫu tri thức: ${template.name}`,
    color: 'info',
    icon: 'mdi-content-paste',
  };
}

function applyTemplate(template: (typeof knowledgeTemplates)[number]) {
  magicInput.value = template.content;
}

function addStopCondition() {
  if (!aiConfig.value.stopConditions) aiConfig.value.stopConditions = [];
  aiConfig.value.stopConditions.push('');
}

function removeStopCondition(index: number) {
  aiConfig.value.stopConditions.splice(index, 1);
}

function addStopFromTemplate(content: string) {
  if (!aiConfig.value.stopConditions) aiConfig.value.stopConditions = [];
  if (!aiConfig.value.stopConditions.includes(content)) {
    aiConfig.value.stopConditions.push(content);
    toast.value = {
      show: true,
      text: 'Đã thêm điều kiện dừng mẫu',
      color: 'success',
      icon: 'mdi-plus-circle',
    };
  }
}

function getApiErrorMessage(err: any, fallback: string) {
  return err?.response?.data?.error || err?.response?.data?.message || err?.message || fallback;
}

function initializePreferredScope() {
  const hasCurrent = configScopeId.value && accounts.value.some((account) => account.id === configScopeId.value);
  if (hasCurrent) return;

  const preferred = accounts.value.find((account) => account.status === 'connected') || accounts.value[0];
  configScopeId.value = preferred?.id || null;
  if (preferred?.id) {
    if (!magicAccountId.value) magicAccountId.value = preferred.id;
  }
}

function selectChannelScope(accountId: string) {
  configScopeId.value = accountId;
  magicAccountId.value = accountId;
  testMessages.value = [];
}

async function ensureKnownAccount(accountId: string | null) {
  if (!accountId) return null;
  if (accountOptions.value.some((option) => option.value === accountId)) return accountId;
  await fetchAccounts();
  return accountOptions.value.some((option) => option.value === accountId) ? accountId : null;
}

function applyLoadedConfig(config: any) {
  aiConfig.value = config;
  configScopeMeta.value = {
    hasChannelOverride: Boolean(config?.hasChannelOverride),
    usesDefaultConfig: Boolean(config?.usesDefaultConfig),
    scopeType: config?.scopeType === 'channel' ? 'channel' : 'org',
    scopeAccountId: config?.scopeAccountId ?? null,
    scopeAccountName: config?.scopeAccountName ?? null,
    scopeChannelType: config?.scopeChannelType ?? null,
  };
}

async function loadKnowledge() {
  const knowledgeRes = await api.get('/ai/knowledge');
  items.value = knowledgeRes.data;
}

async function loadAiConfig() {
  const configRes = await api.get('/ai/config', {
    params: {
      zaloAccountId: configScopeId.value || undefined,
    },
  });
  applyLoadedConfig(configRes.data);
}

async function loadData() {
  loading.value = true;
  try {
    await loadKnowledge();
    initializePreferredScope();
    await loadAiConfig();
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
      stopConditions: stopConditions.value,
      zaloAccountId: configScopeId.value,
    };
    const res = await api.put('/ai/config', configToSave);
    applyLoadedConfig(res.data);
    toast.value = {
      show: true,
      text: configScopeId.value
        ? `Đã lưu cấu hình AI cho ${currentConfigScopeName.value}`
        : 'Đã lưu cấu hình nền của workspace',
      color: 'success',
      icon: 'mdi-check-circle',
    };
  } catch (err: any) {
    toast.value = {
      show: true,
      text: getApiErrorMessage(err, 'Lưu cấu hình AI thất bại'),
      color: 'error',
      icon: 'mdi-alert',
    };
  } finally {
    aiSaving.value = false;
  }
}

async function resetConfigScope() {
  if (!configScopeId.value || resettingScope.value) return;
  resettingScope.value = true;
  try {
    const res = await api.delete(`/ai/config/channel/${configScopeId.value}`);
    applyLoadedConfig(res.data);
    toast.value = {
      show: true,
      text: `Đã đưa ${currentConfigScopeName.value} về cấu hình mặc định`,
      color: 'success',
      icon: 'mdi-backup-restore',
    };
  } catch (err: any) {
    toast.value = {
      show: true,
      text: getApiErrorMessage(err, 'Không thể đưa cấu hình kênh về mặc định'),
      color: 'error',
      icon: 'mdi-alert',
    };
  } finally {
    resettingScope.value = false;
  }
}

async function runMagicAdd() {
  if (!magicInput.value.trim() || savingMagic.value) return;
  savingMagic.value = true;
  try {
    const selectedAccountId = await ensureKnownAccount(magicAccountId.value);
    if (magicAccountId.value && !selectedAccountId) {
      throw new Error('Tài khoản áp dụng không còn tồn tại. Hãy chọn lại tài khoản.');
    }

    const analysis = await api.post('/ai/knowledge/analyze', { content: magicInput.value });
    await api.post('/ai/knowledge', {
      title: analysis.data.title,
      category: analysis.data.category,
      zaloAccountId: selectedAccountId,
      content: magicInput.value,
      isActive: true,
    });
    magicInput.value = '';
    await loadData();
    toast.value = {
      show: true,
      text: `Đã nạp xong tri thức cho ${currentMagicAccountName.value}`,
      color: 'success',
      icon: 'mdi-sparkles',
    };
  } catch (err: any) {
    toast.value = {
      show: true,
      text: getApiErrorMessage(err, 'Nạp nhanh thất bại'),
      color: 'error',
      icon: 'mdi-alert',
    };
  } finally {
    savingMagic.value = false;
  }
}

function openAddDialog() {
  activeSection.value = 'knowledge';
  editDialog.value = {
    show: true,
    isEdit: false,
    valid: true,
    item: {
      id: '',
      title: '',
      content: '',
      category: 'Chung',
      isActive: true,
      zaloAccountId: configScopeId.value,
    },
  };
}

function editItem(item: KnowledgeItem) {
  activeSection.value = 'knowledge';
  editDialog.value = {
    show: true,
    isEdit: true,
    valid: true,
    item: { ...item },
  };
}

async function saveItem() {
  if (!editDialog.value.valid) return;
  saving.value = true;
  try {
    const selectedAccountId = await ensureKnownAccount(editDialog.value.item.zaloAccountId ?? null);
    if (editDialog.value.item.zaloAccountId && !selectedAccountId) {
      throw new Error('Tài khoản áp dụng không còn tồn tại. Hãy chọn lại tài khoản.');
    }

    const payload = {
      ...editDialog.value.item,
      zaloAccountId: selectedAccountId,
    };

    if (editDialog.value.isEdit) {
      await api.put(`/ai/knowledge/${editDialog.value.item.id}`, payload);
    } else {
      await api.post('/ai/knowledge', payload);
    }

    await loadData();
    editDialog.value.show = false;
    toast.value = {
      show: true,
      text: 'Đã lưu tri thức',
      color: 'success',
      icon: 'mdi-check-circle',
    };
  } catch (err: any) {
    console.error('Failed to save knowledge:', err);
    toast.value = {
      show: true,
      text: getApiErrorMessage(err, 'Không thể lưu tri thức'),
      color: 'error',
      icon: 'mdi-alert',
    };
  } finally {
    saving.value = false;
  }
}

function confirmDelete(item: KnowledgeItem) {
  deleteDialog.value = { show: true, item };
}

async function doDelete() {
  if (!deleteDialog.value.item) return;
  deleting.value = true;
  try {
    await api.delete(`/ai/knowledge/${deleteDialog.value.item.id}`);
    await loadData();
    deleteDialog.value.show = false;
    toast.value = {
      show: true,
      text: 'Đã xóa tri thức',
      color: 'success',
      icon: 'mdi-check-circle',
    };
  } catch (err: any) {
    toast.value = {
      show: true,
      text: getApiErrorMessage(err, 'Không thể xóa tri thức'),
      color: 'error',
      icon: 'mdi-alert',
    };
  } finally {
    deleting.value = false;
  }
}

async function runTest() {
  if (!testQuestion.value.trim() || testing.value) return;
  const question = testQuestion.value;
  testMessages.value.push({ role: 'user', content: question });
  testQuestion.value = '';
  testing.value = true;
  scrollToBottom();

  try {
    const history = testMessages.value.map((message) => ({
      senderType: message.role === 'user' ? 'other' : 'self',
      senderName: message.role === 'user' ? 'customer' : 'AI Agent',
      content: message.content,
      sentAt: new Date(),
    }));

    const res = await api.post('/ai/knowledge/test', {
      question,
      zaloAccountId: configScopeId.value,
      history,
    });

    testMessages.value.push({
      role: 'ai',
      content: res.data.content,
      sources: res.data.sources || [],
      question,
    });
    void loadData();
  } catch (err: any) {
    testMessages.value.push({
      role: 'ai',
      content: `Lỗi: ${err.response?.data?.error || 'Không tìm thấy ngữ cảnh phù hợp'}`,
    });
  } finally {
    testing.value = false;
    scrollToBottom();
  }
}

function openCorrectDialog(message: any, index: number) {
  correctDialog.value = {
    show: true,
    loading: false,
    question: message.question || (index > 0 ? testMessages.value[index - 1]?.content : 'Câu hỏi không xác định'),
    originalAnswer: message.content,
    desiredAnswer: '',
    sourceIds: message.sources?.map((source: any) => source.id) || [],
    index,
  };
}

async function proposeFix() {
  correctDialog.value.loading = true;
  try {
    const res = await api.post('/ai/knowledge/propose-fix', {
      question: correctDialog.value.question,
      originalAnswer: correctDialog.value.originalAnswer,
      desiredAnswer: correctDialog.value.desiredAnswer,
      sourceIds: correctDialog.value.sourceIds,
    });

    const proposal = res.data;
    correctDialog.value.show = false;
    activeSection.value = 'knowledge';

    editDialog.value = {
      show: true,
      isEdit: proposal.action === 'update' && Boolean(proposal.targetId),
      valid: true,
      item: {
        id: proposal.targetId || '',
        title: proposal.title,
        content: proposal.content,
        category: proposal.category,
        isActive: true,
        zaloAccountId: configScopeId.value,
      },
    };

    toast.value = {
      show: true,
      text:
        proposal.action === 'update'
          ? `AI đề xuất cập nhật tri thức: ${proposal.title}`
          : 'AI đề xuất tạo mới một thẻ tri thức',
      color: proposal.action === 'update' ? 'secondary' : 'success',
      icon: 'mdi-sparkles',
    };
  } catch (err: any) {
    toast.value = {
      show: true,
      text: getApiErrorMessage(err, 'Không thể tạo đề xuất sửa lỗi'),
      color: 'error',
      icon: 'mdi-alert',
    };
  } finally {
    correctDialog.value.loading = false;
  }
}

function jumpToKnowledge(id: string) {
  activeSection.value = 'knowledge';
  search.value = '';
  filterCategory.value = 'Tất cả';

  nextTick(() => {
    const element = document.getElementById(`knowledge-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('highlight-pulse');
      window.setTimeout(() => element.classList.remove('highlight-pulse'), 1800);
    } else {
      const item = items.value.find((knowledge) => knowledge.id === id);
      if (item) editItem(item);
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

function getCategoryIcon(category: string) {
  const normalized = category?.toLowerCase() || '';
  if (normalized.includes('giá')) return 'mdi-currency-usd';
  if (normalized.includes('bảo hành')) return 'mdi-shield-check';
  if (normalized.includes('giao') || normalized.includes('ship')) return 'mdi-truck-delivery';
  if (normalized.includes('bán')) return 'mdi-tag-text-outline';
  return 'mdi-database-outline';
}

onMounted(async () => {
  await fetchAccounts();
  initializePreferredScope();
  await loadData();
});

watch(configScopeId, async () => {
  if (loading.value) return;
  magicAccountId.value = configScopeId.value;
  testMessages.value = [];
  await loadAiConfig();
});
</script>

<style scoped>
.ai-studio {
  min-height: 100%;
}

.gradient-text {
  background: var(--gradient-brand);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.summary-card,
.studio-shell,
.section-card,
.simulator-panel,
.form-dialog {
  background: var(--color-surface-elevated) !important;
  border: 1px solid var(--color-border) !important;
  border-radius: 20px !important;
  box-shadow: var(--shadow-sm) !important;
}

.summary-card {
  padding: 20px;
  height: 100%;
}

.channel-hub {
  padding: 20px 22px;
  background: var(--color-surface-elevated) !important;
  border: 1px solid var(--color-border) !important;
  border-radius: 22px !important;
}

.channel-hub__copy {
  max-width: 820px;
}

.channel-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
}

.channel-card {
  padding: 16px;
  border-radius: 18px;
  border: 1px solid var(--color-border);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.95));
  cursor: pointer;
  transition: all 0.2s ease;
}

.channel-card:hover {
  transform: translateY(-2px);
  border-color: rgba(var(--v-theme-primary), 0.35);
}

.channel-card--active {
  border-color: rgba(var(--v-theme-primary), 0.7);
  box-shadow: 0 10px 24px rgba(37, 99, 235, 0.12);
  background: linear-gradient(180deg, rgba(239, 246, 255, 0.98), rgba(255, 255, 255, 0.95));
}

.channel-active-bar {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  flex-wrap: wrap;
  padding: 16px 18px;
  border-radius: 18px;
  background: var(--color-surface-glass);
  border: 1px solid var(--color-border);
}

.studio-shell__header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  padding: 20px 24px 0;
  flex-wrap: wrap;
}

.studio-tabs {
  width: 100%;
}

.studio-window {
  padding: 20px 24px 24px;
}

.section-stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-card {
  padding: 20px;
}

.section-card--soft {
  background: var(--color-surface-glass) !important;
}

.section-card--stretch {
  min-height: 420px;
}

.section-card__headline {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.preset-card,
.knowledge-template-card,
.knowledge-card {
  background: var(--color-surface) !important;
  border: 1px solid var(--color-border) !important;
  transition: all 0.2s ease;
}

.preset-card {
  border-radius: 16px !important;
  padding: 16px;
  height: 100%;
}

.knowledge-template-card {
  width: 112px;
  min-height: 110px;
  border-radius: 16px !important;
  padding: 14px 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.preset-card:hover,
.knowledge-template-card:hover,
.knowledge-card:hover {
  border-color: var(--color-primary) !important;
  transform: translateY(-2px);
}

.behavior-alert {
  height: 100%;
}

.magic-console {
  background: linear-gradient(135deg, var(--color-primary-soft), var(--color-surface)) !important;
  border: 1px solid var(--color-border) !important;
  border-radius: 18px !important;
}

.magic-textarea :deep(.v-field__input) {
  font-size: 14px;
  color: var(--color-text);
}

.knowledge-account-select {
  max-width: 240px;
}

.scope-note {
  display: flex;
  align-items: center;
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(var(--v-theme-warning), 0.08);
  color: var(--color-text-secondary);
  font-size: 13px;
}

.knowledge-list {
  max-height: 560px;
  overflow-y: auto;
  padding-right: 6px;
}

.stats-badge {
  display: inline-flex;
  align-items: center;
  background: var(--color-success-soft);
  color: var(--color-success);
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
}

.simulator-panel {
  min-height: 760px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.simulator-panel__header,
.simulator-panel__footer {
  padding: 16px;
  background: var(--color-surface-glass);
  backdrop-filter: blur(12px);
}

.simulator-panel__header {
  border-bottom: 1px solid var(--color-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.sim-account-select {
  max-width: 220px;
}

.simulator-messages {
  flex: 1;
  overflow-y: auto;
  padding: 18px;
  background:
    radial-gradient(circle at 1px 1px, var(--color-border) 1px, transparent 0);
  background-size: 18px 18px;
}

.message-bubble-wrapper {
  max-width: 85%;
  display: flex;
  flex-direction: column;
}

.user-wrapper {
  align-items: flex-end;
}

.ai-wrapper {
  align-items: flex-start;
}

.message-bubble {
  padding: 10px 14px;
  line-height: 1.55;
  font-size: 14px;
}

.zalo-user-bubble {
  background: #0068ff;
  color: #fff;
  border-radius: 18px 18px 4px 18px;
}

.zalo-ai-bubble {
  background: #fff;
  color: #1e1e1e;
  border-radius: 18px 18px 18px 4px;
  border: 1px solid #e0e0e0;
}

.sources-container {
  max-width: 100%;
}

.source-chip {
  cursor: pointer;
  transition: transform 0.2s ease;
}

.source-chip:hover {
  transform: scale(1.04);
}

.settings-block {
  padding: 16px;
  border-radius: 16px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  height: 100%;
}

.settings-block__title {
  font-weight: 700;
  margin-bottom: 10px;
}

.empty-state,
.empty-inline {
  text-align: center;
  padding: 48px 20px;
  color: var(--color-text-secondary);
  opacity: 0.78;
}

.empty-state.compact {
  min-height: 260px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.glass-list {
  background: var(--color-surface) !important;
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: var(--color-primary-soft-strong);
  border-radius: 999px;
}

.text-xxs {
  font-size: 10px;
}

.truncate-1,
.truncate-2,
.line-clamp-2,
.line-clamp-3 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.truncate-1 {
  -webkit-line-clamp: 1;
}

.truncate-2,
.line-clamp-2 {
  -webkit-line-clamp: 2;
}

.line-clamp-3 {
  -webkit-line-clamp: 3;
}

.fade-in {
  animation: fadeIn 0.25s ease forwards;
}

.highlight-pulse {
  animation: pulseHighlight 1.8s ease;
}

.primary--text {
  color: var(--color-primary);
}

.border-bottom {
  border-bottom: 1px solid var(--color-border);
}

.border-top {
  border-top: 1px solid var(--color-border);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulseHighlight {
  0% {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 0 rgba(var(--v-theme-primary), 0.35);
  }
  100% {
    border-color: var(--color-border);
    box-shadow: 0 0 0 14px rgba(var(--v-theme-primary), 0);
  }
}

@media (max-width: 959px) {
  .studio-shell__header,
  .studio-window,
  .section-card {
    padding-left: 16px;
    padding-right: 16px;
  }

  .simulator-panel {
    min-height: 620px;
  }

  .sim-account-select,
  .knowledge-account-select {
    max-width: 100%;
    width: 100%;
  }
}
</style>
