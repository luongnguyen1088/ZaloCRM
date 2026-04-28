<template>
  <v-app class="public-layout-app">
    <v-main>
      <slot />
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
// Basic public layout
</script>

<style scoped>
.public-layout-app {
  background: var(--color-background);
  min-height: 100vh;
}
</style>
