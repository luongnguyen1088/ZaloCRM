<template>
  <v-app class="liquid-bg auth-app">
    <!-- Animated background elements -->
    <div class="auth-bg-decor">
      <div class="decor-orb decor-orb--1"></div>
      <div class="decor-orb decor-orb--2"></div>
      <div class="decor-orb decor-orb--3"></div>
      <div class="auth-grid-overlay"></div>
    </div>

    <v-main class="auth-main">
      <div class="auth-content-wrapper">
        <slot />
      </div>
    </v-main>
  </v-app>
</template>

<style scoped>
.auth-app {
  position: relative;
  min-height: 100vh;
  overflow-x: hidden;
  background-attachment: fixed;
}

.auth-bg-decor {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.decor-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.15;
}

.decor-orb--1 {
  width: 600px;
  height: 600px;
  background: var(--cyan-electric, #00f2ff);
  top: -200px;
  left: -100px;
  animation: float-slow 15s infinite ease-in-out;
}

.decor-orb--2 {
  width: 500px;
  height: 500px;
  background: #aa3bff;
  bottom: -150px;
  right: -100px;
  animation: float-slow 18s infinite ease-in-out reverse;
}

.decor-orb--3 {
  width: 400px;
  height: 400px;
  background: #0077b6;
  top: 40%;
  left: 60%;
  opacity: 0.1;
  animation: float-slow 20s infinite ease-in-out 2s;
}

.auth-grid-overlay {
  position: absolute;
  inset: 0;
  background-image: 
    radial-gradient(rgba(0, 242, 255, 0.05) 1px, transparent 1px);
  background-size: 40px 40px;
  mask-image: radial-gradient(circle at center, black, transparent 80%);
}

.auth-main {
  position: relative;
  z-index: 1;
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
  33% { transform: translate(30px, -50px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
}

@media (max-width: 960px) {
  .auth-content-wrapper {
    padding: 20px 16px;
  }
  
  .decor-orb {
    filter: blur(60px);
    width: 300px;
    height: 300px;
  }
}
</style>
