
<template>
  <div class="chat-header pa-4 d-flex align-center">
    <v-avatar size="44" class="mr-3 avatar-border">
      <v-img v-if="conversation?.contact?.avatarUrl" :src="conversation.contact.avatarUrl" />
      <v-icon v-else icon="mdi-account" />
    </v-avatar>

    <div class="flex-grow-1 min-width-0">
      <h3 class="text-subtitle-1 font-weight-bold text-truncate mb-0">
        {{ conversation?.contact?.fullName || 'Hội thoại' }}
      </h3>
      <div class="d-flex align-center text-caption text-grey">
        <span class="text-truncate">Hội thoại Zalo</span>
        <v-divider vertical class="mx-2 my-1" />
        <v-icon size="12" color="primary" class="mr-1">mdi-account-outline</v-icon>
        <span class="text-truncate">{{ conversation?.zaloAccount?.displayName || 'Unknown' }}</span>
      </div>
    </div>

    <v-spacer />

    <div class="d-flex ga-1">
      <v-btn icon="mdi-magnify" variant="text" size="small" />
      <v-btn icon="mdi-phone-outline" variant="text" size="small" color="primary" />
      <v-btn icon="mdi-video-outline" variant="text" size="small" color="primary" />
      <v-btn 
        :icon="showContactPanel ? 'mdi-information' : 'mdi-information-outline'" 
        variant="tonal" 
        size="small" 
        color="primary"
        @click="$emit('toggle-contact')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Conversation } from '../types';

defineProps<{
  conversation: Conversation | null;
  showContactPanel: boolean;
}>();

defineEmits<{
  (e: 'toggle-contact'): void;
}>();
</script>

<style scoped>
.chat-header {
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface-glass);
  backdrop-filter: blur(14px);
  z-index: 10;
}

.avatar-border {
  border: 2px solid var(--color-border);
}
</style>
