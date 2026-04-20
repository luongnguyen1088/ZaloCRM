<template>
  <v-card class="summary-card glass-premium mb-4" elevation="0">
    <div class="pa-4">
      <div class="d-flex align-center justify-space-between mb-3">
        <div class="d-flex align-center">
          <div class="summary-icon-box mr-3">
            <v-icon color="primary" size="20">mdi-brain-outline</v-icon>
          </div>
          <span class="text-subtitle-2 font-weight-bold summary-title uppercase letter-spacing-1">Smart Summary</span>
        </div>
        <v-btn
          icon
          size="x-small"
          variant="text"
          :loading="loading"
          class="text-placeholder"
          @click="$emit('refresh')"
        >
          <v-icon>mdi-refresh</v-icon>
        </v-btn>
      </div>

      <v-divider class="border-glass mb-4"></v-divider>

      <div v-if="loading" class="pa-4 text-center">
        <v-progress-circular indeterminate color="primary" size="24" width="2"></v-progress-circular>
        <p class="text-caption text-placeholder mt-2">AI Ä‘ang phÃ¢n tÃ­ch há»™i thoáº¡i...</p>
      </div>

      <div v-else-if="summary" class="summary-content">
        <div v-for="(section, idx) in parsedSections" :key="idx" class="summary-section mb-3">
          <div class="section-title text-gradient">{{ section.title }}</div>
          <div class="section-text">{{ section.content }}</div>
        </div>
        <div v-if="updatedAt" class="text-right mt-2">
          <span class="text-tiny text-placeholder">Cáº­p nháº­t: {{ updatedAt }}</span>
        </div>
      </div>

      <div v-else class="pa-8 text-center text-placeholder">
        <v-icon size="32" class="mb-2 opacity-20">mdi-text-box-search-outline</v-icon>
        <p class="text-caption">ChÆ°a cÃ³ tÃ³m táº¯t há»™i thoáº¡i.</p>
        <v-btn
          variant="outlined"
          size="small"
          class="mt-3 summary-outline-btn"
          @click="$emit('refresh')"
        >
          PhÃ¢n tÃ­ch ngay
        </v-btn>
      </div>
    </div>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  summary: string;
  loading: boolean;
  updatedAt?: string;
}>();

defineEmits<{ refresh: [] }>();

const parsedSections = computed(() => {
  if (!props.summary) return [];

  const lines = props.summary.split('\n');
  const sections: { title: string; content: string }[] = [];

  let currentSection = { title: '', content: '' };

  lines.forEach(line => {
    const match = line.match(/^(\d+\.|Má»¤C ÄÃCH|TRáº NG THÃI|CÃ‚U Há»ŽI CHÃNH|HÃ€NH Äá»˜NG|PURPOSE|STATUS|KEY QUESTIONS|NEXT ACTION)[:\s]*(.*)/i);
    if (match) {
      if (currentSection.title) sections.push({ ...currentSection });
      currentSection.title = match[1].replace(/\d+\.\s*/, '').trim();
      currentSection.content = match[2].trim();
    } else if (currentSection.title && line.trim()) {
      currentSection.content += ' ' + line.trim();
    }
  });

  if (currentSection.title) sections.push(currentSection);

  if (sections.length === 0 && props.summary) {
    return [{ title: 'Tá»”NG QUAN', content: props.summary }];
  }

  return sections;
});
</script>

<style scoped>
.glass-premium {
  background: var(--color-surface-elevated) !important;
  border: 1px solid var(--color-border) !important;
  backdrop-filter: blur(16px);
  border-radius: 16px !important;
  box-shadow: var(--shadow-sm);
}

.summary-icon-box {
  width: 32px;
  height: 32px;
  background: var(--color-primary-soft);
  border: 1px solid var(--color-primary-soft-strong);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.summary-title {
  color: var(--color-text);
}

.text-placeholder {
  color: var(--color-text-secondary);
}

.text-gradient {
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  background: var(--gradient-accent);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 2px;
}

.section-text {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  line-height: 1.5;
}

.border-glass {
  border-color: var(--color-border) !important;
}

.summary-outline-btn {
  border-color: var(--color-primary-soft-strong) !important;
  color: var(--color-primary) !important;
}

.letter-spacing-1 {
  letter-spacing: 1px;
}

.text-tiny {
  font-size: 0.7rem;
}

.opacity-20 {
  opacity: 0.2;
}
</style>
