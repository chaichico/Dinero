import type { Account, Summary, Transaction, Transfer } from '~/types/finance'

export const useFinance = () => {
  const config = useRuntimeConfig()
  const accounts = useState<Account[]>('finance-accounts', () => [])
  const transactions = useState<Transaction[]>('finance-transactions', () => [])
  const transfers = useState<Transfer[]>('finance-transfers', () => [])
  const loading = useState('finance-loading', () => false)
  const loaded = useState('finance-loaded', () => false)
  const error = useState<string | null>('finance-error', () => null)
  const api = <T>(path: string, options: Parameters<typeof $fetch<T>>[1] = {}) => $fetch<T>(`${config.public.apiBase}${path}`, { credentials: 'include', ...options })
  const messageOf = (cause: unknown) => (cause as { data?: { message?: string } })?.data?.message ?? 'The request could not be completed.'

  const totalBalance = computed(() => accounts.value.filter(account => !account.isArchived).reduce((sum, account) => sum + account.balance, 0))
  const totalSpent = computed(() => transactions.value.filter(item => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0))
  const totalIncome = computed(() => transactions.value.filter(item => item.type === 'income').reduce((sum, item) => sum + item.amount, 0))

  async function refresh(force = false) {
    if (loading.value || (loaded.value && !force)) return
    loading.value = true; error.value = null
    try {
      const [accountResult, transactionResult, transferResult] = await Promise.all([
        api<{ data: Account[] }>('/api/accounts'), api<{ data: Transaction[] }>('/api/transactions'), api<{ data: Transfer[] }>('/api/transfers')
      ])
      accounts.value = accountResult.data; transactions.value = transactionResult.data; transfers.value = transferResult.data; loaded.value = true
    } catch (cause) { error.value = messageOf(cause); throw cause } finally { loading.value = false }
  }

  async function createAccount(body: { name: string; type: Account['type']; openingBalance: number }) { await api('/api/accounts', { method: 'POST', body }); await refresh(true) }
  async function updateAccount(id: string, body: { name?: string; type?: Account['type']; isArchived?: boolean; openingBalance?: number }) { await api(`/api/accounts/${id}`, { method: 'PATCH', body }); await refresh(true) }
  async function createTransaction(body: { accountId: string; title: string; amount: number; type: Transaction['type']; category: string; transactionDate: string; note?: string }) { await api('/api/transactions', { method: 'POST', body }); await refresh(true) }
  async function updateTransaction(id: string, body: { accountId: string; title: string; amount: number; type: Transaction['type']; category: string; transactionDate: string; note?: string }) { await api(`/api/transactions/${id}`, { method: 'PATCH', body }); await refresh(true) }
  async function deleteTransaction(id: string) { await api(`/api/transactions/${id}`, { method: 'DELETE' }); await refresh(true) }
  async function createTransfer(body: { fromAccountId: string; toAccountId: string; amount: number; transferDate: string; note?: string }) { await api('/api/transfers', { method: 'POST', body }); await refresh(true) }
  async function updateTransfer(id: string, body: { fromAccountId: string; toAccountId: string; amount: number; transferDate: string; note?: string }) { await api(`/api/transfers/${id}`, { method: 'PATCH', body }); await refresh(true) }
  async function deleteTransfer(id: string) { await api(`/api/transfers/${id}`, { method: 'DELETE' }); await refresh(true) }
  async function getSummary(start: string, end: string) { return (await api<{ data: Summary }>(`/api/summary?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`)).data }

  return { accounts, transactions, transfers, loading, loaded, error, totalBalance, totalSpent, totalIncome, refresh, createAccount, updateAccount, createTransaction, updateTransaction, deleteTransaction, createTransfer, updateTransfer, deleteTransfer, getSummary }
}
