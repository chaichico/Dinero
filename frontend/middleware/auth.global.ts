export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path.startsWith('/scan') || to.path.startsWith('/splits')) return navigateTo('/')
  if (import.meta.server) return
  const auth = useAuth()
  await auth.check()
  if (to.path === '/login') return auth.user.value ? navigateTo(auth.user.value.role === 'super_admin' ? '/admin' : '/') : undefined
  if (!auth.user.value) return navigateTo('/login')
  if (to.path.startsWith('/admin') && auth.user.value.role !== 'super_admin') return navigateTo('/')
})
