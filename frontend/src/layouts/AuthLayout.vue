<template>
  <v-app class="auth-app-root">
    <!-- Premium Galactic Background -->
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
  background: #020617 !important; /* Deepest black-blue */
  min-height: 100vh;
  position: relative;
  overflow: hidden;
}

.space-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  background: radial-gradient(circle at 50% 50%, #0f172a 0%, #020617 100%);
}

.noise-overlay {
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
  opacity: 0.15;
  mix-blend-mode: overlay;
  pointer-events: none;
}

.glow-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  opacity: 0.25;
  mix-blend-mode: screen;
}

.orb-1 {
  width: 800px;
  height: 800px;
  background: radial-gradient(circle, #0ea5e9 0%, transparent 70%);
  top: -200px;
  left: -200px;
  animation: float-slow 20s infinite ease-in-out;
}

.orb-2 {
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, #7c3aed 0%, transparent 70%);
  bottom: -100px;
  right: -100px;
  animation: float-slow 25s infinite ease-in-out reverse;
}

.orb-3 {
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, #10b981 0%, transparent 70%);
  top: 40%;
  left: 30%;
  opacity: 0.1;
}

.grid-lines {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 60px 60px;
  mask-image: radial-gradient(circle at center, black, transparent 90%);
}

.auth-main {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
}

.auth-content-wrapper {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  padding: 40px 24px;
}

@keyframes float-slow {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(40px, -60px) scale(1.1); }
}

@media (max-width: 960px) {
  .auth-content-wrapper {
    padding: 20px 16px;
  }
}
</style>
