import type { AuthUser } from '~/types/finance'

export const useAuth = () => {
  const config = useRuntimeConfig()
  const user = useState<AuthUser | null>('auth-user', () => null)
  const checked = useState('auth-checked', () => false)
  const loading = useState('auth-loading', () => false)
  const error = useState<string | null>('auth-error', () => null)

  async function check(force = false) {
    if (checked.value && !force) return user.value
    try {
      const response = await $fetch<{ data: AuthUser }>(`${config.public.apiBase}/api/auth/me`, { credentials: 'include' })
      user.value = response.data
    } catch { user.value = null } finally { checked.value = true }
    return user.value
  }

  async function login(username: string, password: string) {
    loading.value = true; error.value = null
    try {
      const response = await $fetch<{ data: AuthUser }>(`${config.public.apiBase}/api/auth/login`, { method: 'POST', credentials: 'include', body: { username, password } })
      user.value = response.data; checked.value = true; return response.data
    } catch (cause) { error.value = (cause as { data?: { message?: string } })?.data?.message ?? 'Login failed'; throw cause } finally { loading.value = false }
  }

  async function logout() {
    await $fetch(`${config.public.apiBase}/api/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => undefined)
    user.value = null; checked.value = true; clearNuxtState('finance-accounts'); clearNuxtState('finance-transactions'); clearNuxtState('finance-transfers'); clearNuxtState('finance-loaded')
    await navigateTo('/login')
  }

  return { user, checked, loading, error, check, login, logout }
}

