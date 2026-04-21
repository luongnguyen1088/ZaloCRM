<template>
  <v-app class="auth-app-root">
    <div class="space-bg">
      <div class="noise-overlay"></div>
      <div class="glow-orb orb-1"></div>
      <div class="glow-orb orb-2"></div>
      <div class="glow-orb orb-3"></div>
      <div class="grid-lines"></div>
    </div>

    <v-main class="auth-main">
      <div class="auth-content-wrapper">
        <slot />
      </div>
    </v-main>
  </v-app>
</template>

<style scoped>
.auth-app-root {
  background: var(--gradient-hero) !important;
  min-height: 100vh;
  position: relative;
  overflow-x: clip;
  overflow-y: auto;
  overscroll-behavior-y: contain;
  -webkit-overflow-scrolling: touch;
}

.space-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  background:
    radial-gradient(circle at top left, var(--color-primary-soft-strong), transparent 32%),
    radial-gradient(circle at top right, var(--color-accent-soft), transparent 30%),
    var(--gradient-hero);
}

.noise-overlay {
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
  opacity: 0.04;
  mix-blend-mode: multiply;
  pointer-events: none;
}

.glow-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.5;
  pointer-events: none;
}

.orb-1 {
  width: 720px;
  height: 720px;
  background: radial-gradient(circle, var(--color-primary-soft-strong) 0%, transparent 70%);
  top: -220px;
  left: -220px;
  animation: float-slow 18s infinite ease-in-out;
}

.orb-2 {
  width: 560px;
  height: 560px;
  background: radial-gradient(circle, var(--color-accent-soft) 0%, transparent 70%);
  bottom: -120px;
  right: -120px;
  animation: float-slow 24s infinite ease-in-out reverse;
}

.orb-3 {
  width: 420px;
  height: 420px;
  background: radial-gradient(circle, var(--color-success-soft) 0%, transparent 70%);
  top: 42%;
  left: 32%;
}

.grid-lines {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(var(--color-border) 1px, transparent 1px),
    linear-gradient(90deg, var(--color-border) 1px, transparent 1px);
  background-size: 64px 64px;
  mask-image: radial-gradient(circle at center, black, transparent 88%);
}

.auth-main {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  min-height: 100vh;
}

.auth-content-wrapper {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  padding: clamp(24px, 5vh, 48px) 24px;
}

@keyframes float-slow {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(40px, -60px) scale(1.08); }
}

@media (max-width: 960px) {
  .auth-content-wrapper {
    padding: 20px 16px;
  }
}
</style>
