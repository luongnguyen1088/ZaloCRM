<template>
  <v-card class="summary-card glass-premium mb-4" elevation="0">
    <div class="pa-4">
      <div class="d-flex align-center justify-space-between mb-3">
        <div class="d-flex align-center">
          <div class="summary-icon-box mr-3">
            <v-icon color="#00F2FF" size="20">mdi-brain-outline</v-icon>
          </div>
          <span class="text-subtitle-2 font-weight-bold text-white uppercase letter-spacing-1">Smart Summary</span>
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
        <v-progress-circular indeterminate color="cyan" size="24" width="2"></v-progress-circular>
        <p class="text-caption text-placeholder mt-2">AI đang phân tích hội thoại...</p>
      </div>

      <div v-else-if="summary" class="summary-content">
        <div v-for="(section, idx) in parsedSections" :key="idx" class="summary-section mb-3">
          <div class="section-title text-gradient">{{ section.title }}</div>
          <div class="section-text">{{ section.content }}</div>
        </div>
        <div v-if="updatedAt" class="text-right mt-2">
          <span class="text-tiny text-placeholder">Cập nhật: {{ updatedAt }}</span>
        </div>
      </div>

      <div v-else class="pa-8 text-center text-placeholder">
        <v-icon size="32" class="mb-2 opacity-20">mdi-text-box-search-outline</v-icon>
        <p class="text-caption">Chưa có tóm tắt hội thoại.</p>
        <v-btn
          variant="outlined"
          size="small"
          class="mt-3 border-glass text-cyan"
          @click="$emit('refresh')"
        >
          Phân tích ngay
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
  
  // Try to parse the numbered sections (1. PURPOSE, 2. STATUS, etc.)
  const lines = props.summary.split('\n');
  const sections: { title: string; content: string }[] = [];
  
  let currentSection = { title: '', content: '' };
  
  lines.forEach(line => {
    const match = line.match(/^(\d+\.|MỤC ĐÍCH|TRẠNG THÁI|CÂU HỎI CHÍNH|HÀNH ĐỘNG|PURPOSE|STATUS|KEY QUESTIONS|NEXT ACTION)[:\s]*(.*)/i);
    if (match) {
      if (currentSection.title) sections.push({ ...currentSection });
      currentSection.title = match[1].replace(/\d+\.\s*/, '').trim();
      currentSection.content = match[2].trim();
    } else if (currentSection.title && line.trim()) {
      currentSection.content += ' ' + line.trim();
    }
  });
  
  if (currentSection.title) sections.push(currentSection);
  
  // If parsing failed, just return the whole summary as one section
  if (sections.length === 0 && props.summary) {
    return [{ title: 'TỔNG QUAN', content: props.summary }];
  }
  
  return sections;
});
</script>

<style scoped>
.glass-premium {
  background: rgba(15, 23, 42, 0.4) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  backdrop-filter: blur(12px);
  border-radius: 16px !important;
}

.summary-icon-box {
  width: 32px;
  height: 32px;
  background: rgba(0, 242, 255, 0.1);
  border: 1px solid rgba(0, 242, 255, 0.2);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.text-placeholder {
  color: #64748b;
}

.text-cyan {
  color: #00f2ff;
}

.text-gradient {
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  background: linear-gradient(135deg, #00f2ff, #a855f7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 2px;
}

.section-text {
  font-size: 0.85rem;
  color: #cbd5e1;
  line-height: 1.5;
}

.border-glass {
  border-color: rgba(255, 255, 255, 0.05) !important;
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
