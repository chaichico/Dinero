<script setup lang="ts">
const auth = useAuth()
const username = ref('')
const password = ref('')
async function submit() {
  try { const user = await auth.login(username.value, password.value); await navigateTo(user.role === 'super_admin' ? '/admin' : '/') } catch {}
}
</script>

<template>
  <main class="auth-page">
    <section class="auth-intro"><div class="brand-seal">D</div><div class="eyebrow">Private ledger</div><h1 class="display">Money,<br>kept between us.</h1><p class="muted">Use the credentials issued by your Dinero administrator.</p></section>
    <form class="auth-card" @submit.prevent="submit">
      <div><div class="eyebrow">Access card</div><h2 class="section-title">Sign in</h2></div>
      <p v-if="auth.error.value" class="notice error" role="alert">{{ auth.error.value }}</p>
      <div class="field"><label for="username">Username</label><input id="username" v-model.trim="username" autocomplete="username" required autofocus></div>
      <div class="field"><label for="password">Password</label><input id="password" v-model="password" type="password" autocomplete="current-password" required></div>
      <button class="button accent button-block" :disabled="auth.loading.value">{{ auth.loading.value ? 'Checking…' : 'Open ledger' }}</button>
    </form>
  </main>
</template>

