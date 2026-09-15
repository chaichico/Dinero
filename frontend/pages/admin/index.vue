<script setup lang="ts">
import type { Credentials, ManagedUser } from '~/types/finance'
const config = useRuntimeConfig()
const users = ref<ManagedUser[]>([])
const requestedUsername = ref('')
const credentials = ref<Credentials | null>(null)
const loading = ref(false)
const error = ref('')
const copied = ref('')
const api = <T>(path: string, options: Parameters<typeof $fetch<T>>[1] = {}) => $fetch<T>(`${config.public.apiBase}${path}`, { credentials: 'include', ...options })
async function refresh() { users.value = (await api<{ data: ManagedUser[] }>('/api/admin/users')).data }
async function generate() { loading.value = true; error.value = ''; try { const response = await api<{ data: { user: ManagedUser; credentials: Credentials } }>('/api/admin/users/generate', { method: 'POST', body: { username: requestedUsername.value || undefined } }); credentials.value = response.data.credentials; requestedUsername.value = ''; await refresh() } catch (cause) { error.value = (cause as { data?: { message?: string } })?.data?.message ?? 'Could not create user' } finally { loading.value = false } }
async function reset(user: ManagedUser) { if (!confirm(`Reset password for ${user.username}? Existing sessions will end.`)) return; const response = await api<{ data: { credentials: Credentials } }>(`/api/admin/users/${user.id}/reset-password`, { method: 'POST' }); credentials.value = response.data.credentials }
async function toggle(user: ManagedUser) { const next = user.status === 'active' ? 'inactive' : 'active'; await api(`/api/admin/users/${user.id}/status`, { method: 'PATCH', body: { status: next } }); await refresh() }
async function remove(user: ManagedUser) { if (!confirm(`Delete ${user.username} and all of their financial data? This cannot be undone.`)) return; await api(`/api/admin/users/${user.id}`, { method: 'DELETE' }); await refresh() }
async function copy(value: string, label: string) { await navigator.clipboard.writeText(value); copied.value = label; setTimeout(() => { copied.value = '' }, 1500) }
onMounted(() => refresh().catch(() => { error.value = 'Could not load users' }))
</script>

<template>
  <main class="page admin-page">
    <header class="admin-header"><div><div class="eyebrow">Credential desk</div><h1 class="display">Issue access.</h1><p class="muted">Create private access cards without collecting email addresses.</p></div><div class="admin-stamp">SUPER<br>ADMIN</div></header>
    <section class="admin-grid">
      <form class="card form admin-create" @submit.prevent="generate"><div><div class="eyebrow">New member</div><h2 class="section-title">Generate credentials</h2></div><div class="field"><label>Preferred username (optional)</label><input v-model.trim="requestedUsername" placeholder="Leave blank to generate"></div><p v-if="error" class="notice error">{{ error }}</p><button class="button accent" :disabled="loading">{{ loading ? 'Generating…' : 'Generate access card' }}</button></form>
      <section v-if="credentials" class="credential-ticket" aria-live="polite"><div class="ticket-edge">ONE-TIME VIEW</div><div><div class="eyebrow">Hand this to the user</div><h2 class="section-title">Credentials</h2></div><div class="credential-line"><span>Username</span><code>{{ credentials.username }}</code><button class="copy-button" @click="copy(credentials.username, 'username')">{{ copied === 'username' ? 'Copied' : 'Copy' }}</button></div><div class="credential-line"><span>Password</span><code>{{ credentials.password }}</code><button class="copy-button" @click="copy(credentials.password, 'password')">{{ copied === 'password' ? 'Copied' : 'Copy' }}</button></div><p>Save it now. Dinero stores only a password hash and cannot show this password again.</p><button class="button ghost" @click="credentials = null">I saved it</button></section>
    </section>
    <div class="section-head"><div><div class="eyebrow">Directory</div><h2 class="section-title">Issued access</h2></div><span class="muted">{{ users.length }} accounts</span></div>
    <section class="user-list"><article v-for="member in users" :key="member.id" class="user-row"><div class="user-monogram">{{ member.username.slice(0, 2).toUpperCase() }}</div><div class="transaction-copy"><strong>{{ member.username }}</strong><small>{{ member.role.replace('_', ' ') }} · {{ member.lastLoginAt ? `Last used ${new Date(member.lastLoginAt).toLocaleDateString()}` : 'Never used' }}</small></div><span class="status-chip" :class="member.status">{{ member.status }}</span><div v-if="member.role !== 'super_admin'" class="row-actions"><button class="text-link" @click="reset(member)">Reset</button><button class="text-link" @click="toggle(member)">{{ member.status === 'active' ? 'Deactivate' : 'Activate' }}</button><button class="text-link danger-text" @click="remove(member)">Delete</button></div></article></section>
  </main>
</template>
