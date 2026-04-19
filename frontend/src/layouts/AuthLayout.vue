<template>
  <v-app class="liquid-bg auth-app">
    <div class="auth-orb auth-orb--primary" />
    <div class="auth-orb auth-orb--secondary" />
    <div class="auth-grid" />

    <v-main class="auth-main">
      <v-container fluid class="auth-container px-0">
        <slot />
      </v-container>
    </v-main>
  </v-app>
</template>

<style scoped>
.auth-app {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  isolation: isolate;
}

.auth-main {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  min-height: 100vh;
  padding: 32px 16px;
}

.auth-container {
  width: min(1180px, 100%);
  margin-inline: auto;
}

.auth-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
  background-size: 72px 72px;
  mask-image: linear-gradient(to bottom, transparent, rgba(0, 0, 0, 0.8), transparent);
  pointer-events: none;
}

.auth-orb {
  position: absolute;
  border-radius: 999px;
  filter: blur(12px);
  opacity: 0.6;
  pointer-events: none;
}

.auth-orb--primary {
  top: -180px;
  right: -80px;
  width: 420px;
  height: 420px;
  background:
    radial-gradient(circle at 30% 30%, rgba(0, 242, 255, 0.5), rgba(0, 242, 255, 0.08) 40%, transparent 72%);
}

.auth-orb--secondary {
  left: -140px;
  bottom: -180px;
  width: 360px;
  height: 360px;
  background:
    radial-gradient(circle at 50% 50%, rgba(60, 121, 255, 0.35), rgba(60, 121, 255, 0.08) 45%, transparent 76%);
}

@media (max-width: 960px) {
  .auth-main {
    align-items: stretch;
    padding: 20px 14px;
  }

  .auth-grid {
    background-size: 52px 52px;
  }

  .auth-orb--primary {
    width: 280px;
    height: 280px;
    right: -100px;
  }

  .auth-orb--secondary {
    width: 240px;
    height: 240px;
    left: -90px;
    bottom: -120px;
  }
}
</style>
