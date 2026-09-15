<script setup lang="ts">
const route = useRoute()
const { user } = useAuth()
const showNavigation = computed(() => route.path !== '/login' && Boolean(user.value))
</script>

<template>
  <div class="app-shell" :class="{ 'without-nav': !showNavigation }">
    <NuxtPage />
    <nav v-if="showNavigation" class="bottom-nav" aria-label="Primary navigation">
      <NuxtLink v-if="user?.role !== 'super_admin'" to="/" class="nav-item"><span>⌂</span><small>Home</small></NuxtLink>
      <NuxtLink v-if="user?.role !== 'super_admin'" to="/transactions" class="nav-item"><span>↗</span><small>History</small></NuxtLink>
      <NuxtLink v-if="user?.role !== 'super_admin'" to="/accounts" class="nav-item"><span>▤</span><small>Accounts</small></NuxtLink>
      <NuxtLink v-if="user?.role !== 'super_admin'" to="/summary" class="nav-item"><span>∑</span><small>Summary</small></NuxtLink>
      <NuxtLink v-if="user?.role === 'super_admin'" to="/admin" class="nav-item"><span>⌘</span><small>Admin</small></NuxtLink>
      <NuxtLink to="/settings" class="nav-item"><span>☼</span><small>Settings</small></NuxtLink>
    </nav>
  </div>
</template>
