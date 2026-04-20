<template>
  <div v-if="loading || suggestion || error" class="ai-suggestion-container">
    <div class="glass-ai-panel pa-3">
      <!-- Loading State -->
      <div v-if="loading" class="d-flex align-center py-2 px-4">
        <v-progress-circular indeterminate size="20" width="2" color="primary" class="mr-3" />
        <span class="text-body-2 animate-pulse">AI đang soạn thảo ma thuật...</span>
      </div>

      <!-- Error State -->
      <v-alert v-else-if="error" type="error" variant="tonal" density="compact" class="mb-0 rounded-lg">
        {{ error }}
      </v-alert>

      <!-- Suggestion Content -->
      <div v-else-if="suggestion" class="suggestion-content">
        <div class="d-flex align-center mb-2 px-1">
          <v-icon color="primary" size="18" class="mr-2">mdi-sparkles</v-icon>
          <span class="text-caption font-weight-bold text-uppercase primary--text" style="letter-spacing: 1px;">Gợi ý từ AI AI-Agent</span>
          <v-spacer />
          <v-btn icon size="x-small" variant="text" @click="$emit('close')"><v-icon>mdi-close</v-icon></v-btn>
        </div>
        
        <div class="text-body-2 py-2 px-3 bg-white-opacity rounded-lg mb-3 draft-text">
          {{ suggestion }}
        </div>

        <div class="d-flex flex-wrap gap-2 align-center">
          <v-btn color="primary" size="small" rounded="pill" prepend-icon="mdi-check-all" @click="$emit('apply')">
            Sử dụng câu này
          </v-btn>
          <v-divider vertical class="mx-1 opacity-10" />
          
          <v-btn size="x-small" variant="tonal" class="refine-btn" @click="$emit('refine', '💼 Làm chuyên nghiệp hơn')">
            💼 Chuyên nghiệp
          </v-btn>
          <v-btn size="x-small" variant="tonal" class="refine-btn" @click="$emit('refine', '📝 Viết ngắn gọn lại')">
            📝 Ngắn gọn
          </v-btn>
          <v-btn size="x-small" variant="tonal" class="refine-btn" @click="$emit('refine', '😊 Thêm chút thân thiện')">
            😊 Thân thiện
          </v-btn>
          
          <v-spacer />
          <v-btn icon size="x-small" variant="text" @click="$emit('generate')" title="Tạo lại">
            <v-icon>mdi-refresh</v-icon>
          </v-btn>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ suggestion: string; loading: boolean; error: string }>();
defineEmits<{ 
  generate: []; 
  apply: []; 
  refine: [instruction: string];
  close: [];
}>();
</script>

<style scoped>
.ai-suggestion-container {
  margin-bottom: 12px;
  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.glass-ai-panel {
  background: #ffffff;
  border: 1px solid rgba(37, 99, 235, 0.1);
  border-radius: 16px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
}

.bg-white-opacity {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.draft-text {
  white-space: pre-wrap;
  line-height: 1.6;
  max-height: 180px;
  overflow-y: auto;
  color: #1e293b;
  font-size: 14px;
}

.animate-pulse {
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.6; }
  100% { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.gap-2 { gap: 8px; }

.refine-btn {
  text-transform: none;
  font-size: 11px !important;
  font-weight: 500;
  background: #ffffff !important;
  border: 1px solid #e2e8f0 !important;
  color: #64748b;
}

.refine-btn:hover {
  border-color: #2563eb !important;
  color: #2563eb !important;
  background: #eff6ff !important;
}

.primary--text {
  color: #2563eb;
}
</style>
