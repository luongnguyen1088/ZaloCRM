<template>
  <div class="oauth-callback">
    <div class="oauth-card">
      <v-progress-circular indeterminate color="#1877F2" size="56" width="5" class="mb-4" />
      <h1 class="text-h6 font-weight-bold mb-2">Dang xu ly ket noi Facebook</h1>
      <p class="text-body-2 text-medium-emphasis mb-0">
        Cua so nay se tu dong dong sau khi gui ket qua ve Claro.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';

type FacebookOAuthMessage = {
  source: 'facebook-oauth-callback';
  code?: string;
  state?: string | null;
  error?: string | null;
  errorDescription?: string | null;
};

function readMessage(): FacebookOAuthMessage {
  const params = new URLSearchParams(window.location.search);

  return {
    source: 'facebook-oauth-callback',
    code: params.get('code') ?? undefined,
    state: params.get('state'),
    error: params.get('error'),
    errorDescription: params.get('error_description'),
  };
}

onMounted(() => {
  const message = readMessage();

  if (window.opener && !window.opener.closed) {
    window.opener.postMessage(message, window.location.origin);
  }

  window.setTimeout(() => window.close(), 150);
});
</script>

<style scoped>
.oauth-callback {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
}

.oauth-card {
  width: min(420px, 100%);
  text-align: center;
  padding: 32px 24px;
  border-radius: 24px;
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-md);
}
</style>
