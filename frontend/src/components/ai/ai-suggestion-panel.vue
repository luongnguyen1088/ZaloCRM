<template>
  <div v-if="loading || suggestion || error" class="ai-suggestion-container">
    <div class="glass-ai-panel pa-3">
      <div v-if="loading" class="d-flex align-center py-2 px-4">
        <v-progress-circular indeterminate size="20" width="2" color="primary" class="mr-3" />
        <span class="text-body-2 animate-pulse">AI Ä‘ang soáº¡n tháº£o ma thuáº­t...</span>
      </div>

      <v-alert v-else-if="error" type="error" variant="tonal" density="compact" class="mb-0 rounded-lg">
        {{ error }}
      </v-alert>

      <div v-else-if="suggestion" class="suggestion-content">
        <div class="d-flex align-center mb-2 px-1">
          <v-icon color="primary" size="18" class="mr-2">mdi-sparkles</v-icon>
          <span class="text-caption font-weight-bold text-uppercase primary--text suggestion-label">Gá»£i Ã½ tá»« AI AI-Agent</span>
          <v-spacer />
          <v-btn icon size="x-small" variant="text" @click="$emit('close')"><v-icon>mdi-close</v-icon></v-btn>
        </div>

        <div class="text-body-2 py-2 px-3 bg-white-opacity rounded-lg mb-3 draft-text">
          {{ suggestion }}
        </div>

        <div class="d-flex flex-wrap gap-2 align-center">
          <v-btn color="primary" size="small" rounded="pill" prepend-icon="mdi-check-all" @click="$emit('apply')">
            Sá»­ dá»¥ng cÃ¢u nÃ y
          </v-btn>
          <v-divider vertical class="mx-1 opacity-10" />

          <v-btn size="x-small" variant="tonal" class="refine-btn" @click="$emit('refine', 'ðŸ’¼ LÃ m chuyÃªn nghiá»‡p hÆ¡n')">
            ðŸ’¼ ChuyÃªn nghiá»‡p
          </v-btn>
          <v-btn size="x-small" variant="tonal" class="refine-btn" @click="$emit('refine', 'ðŸ“ Viáº¿t ngáº¯n gá»n láº¡i')">
            ðŸ“ Ngáº¯n gá»n
          </v-btn>
          <v-btn size="x-small" variant="tonal" class="refine-btn" @click="$emit('refine', 'ðŸ˜Š ThÃªm chÃºt thÃ¢n thiá»‡n')">
            ðŸ˜Š ThÃ¢n thiá»‡n
          </v-btn>

          <v-spacer />
          <v-btn icon size="x-small" variant="text" @click="$emit('generate')" title="Táº¡o láº¡i">
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
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  box-shadow: var(--shadow-sm);
  backdrop-filter: blur(14px);
}

.bg-white-opacity {
  background: var(--color-surface-muted);
  border: 1px solid var(--color-border);
}

.draft-text {
  white-space: pre-wrap;
  line-height: 1.6;
  max-height: 180px;
  overflow-y: auto;
  color: var(--color-text);
  font-size: 14px;
}

.suggestion-label {
  letter-spacing: 1px;
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
  background: var(--color-surface) !important;
  border: 1px solid var(--color-border) !important;
  color: var(--color-text-secondary);
}

.refine-btn:hover {
  border-color: var(--color-primary-soft-strong) !important;
  color: var(--color-primary) !important;
  background: var(--color-primary-soft) !important;
}

.primary--text {
  color: var(--color-primary);
}
</style>
