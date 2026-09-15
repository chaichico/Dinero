CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS dinero_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('super_admin', 'user')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS dinero_users_username_idx ON dinero_users (LOWER(username));

CREATE TABLE IF NOT EXISTS dinero_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES dinero_users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS dinero_sessions_user_idx ON dinero_sessions(user_id);
CREATE INDEX IF NOT EXISTS dinero_sessions_expiry_idx ON dinero_sessions(expires_at);

CREATE TABLE IF NOT EXISTS finance_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES dinero_users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('cash', 'bank', 'ewallet', 'other')),
  opening_balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'THB' CHECK (currency = 'THB'),
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS finance_accounts_user_idx ON finance_accounts(user_id, is_archived, created_at);

CREATE TABLE IF NOT EXISTS finance_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES dinero_users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES finance_accounts(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
  category TEXT NOT NULL DEFAULT 'Other',
  transaction_date TIMESTAMPTZ NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS finance_transactions_user_date_idx ON finance_transactions(user_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS finance_transactions_account_idx ON finance_transactions(account_id, transaction_date DESC);

CREATE TABLE IF NOT EXISTS finance_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES dinero_users(id) ON DELETE CASCADE,
  from_account_id UUID NOT NULL REFERENCES finance_accounts(id) ON DELETE RESTRICT,
  to_account_id UUID NOT NULL REFERENCES finance_accounts(id) ON DELETE RESTRICT,
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  transfer_date TIMESTAMPTZ NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (from_account_id <> to_account_id)
);
CREATE INDEX IF NOT EXISTS finance_transfers_user_date_idx ON finance_transfers(user_id, transfer_date DESC);
CREATE INDEX IF NOT EXISTS finance_transfers_from_idx ON finance_transfers(from_account_id, transfer_date DESC);
CREATE INDEX IF NOT EXISTS finance_transfers_to_idx ON finance_transfers(to_account_id, transfer_date DESC);

