export type UserRole = 'super_admin' | 'user'
export type UserStatus = 'active' | 'inactive'
export type AccountType = 'cash' | 'bank' | 'ewallet' | 'other'
export type TransactionType = 'expense' | 'income'

export interface AuthUser { id: string; username: string; role: UserRole; status?: UserStatus }
export interface ManagedUser extends AuthUser { status: UserStatus; createdAt: string; lastLoginAt: string | null }
export interface Credentials { username: string; password: string }
export interface Account { id: string; name: string; type: AccountType; openingBalance: number; balance: number; currency: 'THB'; isArchived: boolean }
export interface Transaction { id: string; accountId: string; accountName?: string; title: string; amount: number; type: TransactionType; category: string; date: string; note?: string | null }
export interface Transfer { id: string; fromAccountId: string; fromAccountName?: string; toAccountId: string; toAccountName?: string; amount: number; date: string; note?: string | null }
export interface SummaryCategory { category: string; amount: number }
export interface Summary { income: number; expense: number; net: number; categories: SummaryCategory[] }
