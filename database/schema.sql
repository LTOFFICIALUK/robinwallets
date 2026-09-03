-- Robinhood Chain wallet tracker (chain id 4663).
-- Apply via the API migrate() on boot, or once against DATABASE_URL.

CREATE TABLE IF NOT EXISTS wallets (
  id TEXT PRIMARY KEY,
  address TEXT NOT NULL,
  address_full BOOLEAN NOT NULL DEFAULT FALSE,
  name TEXT NOT NULL DEFAULT '',
  twitter TEXT,
  emoji TEXT NOT NULL DEFAULT '*',
  source TEXT NOT NULL DEFAULT 'discover',
  status TEXT NOT NULL DEFAULT 'seen'
    CHECK (status IN ('seen', 'candidate', 'trackable', 'good', 'stale')),
  score NUMERIC(10, 2) NOT NULL DEFAULT 0,
  trades_24h INTEGER NOT NULL DEFAULT 0,
  buys_24h INTEGER NOT NULL DEFAULT 0,
  sells_24h INTEGER NOT NULL DEFAULT 0,
  buy_eth DOUBLE PRECISION NOT NULL DEFAULT 0,
  sell_eth DOUBLE PRECISION NOT NULL DEFAULT 0,
  net_eth DOUBLE PRECISION NOT NULL DEFAULT 0,
  tokens_traded INTEGER NOT NULL DEFAULT 0,
  last_trade_at TIMESTAMPTZ,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  tracked_at TIMESTAMPTZ,
  good_at TIMESTAMPTZ,
  watched BOOLEAN NOT NULL DEFAULT FALSE,
  hidden BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS wallets_address_idx ON wallets (lower(address));
CREATE INDEX IF NOT EXISTS wallets_status_idx ON wallets (status, score DESC);
CREATE INDEX IF NOT EXISTS wallets_name_idx ON wallets (lower(name));
CREATE INDEX IF NOT EXISTS wallets_last_trade_idx ON wallets (last_trade_at DESC);

CREATE TABLE IF NOT EXISTS trades (
  id TEXT PRIMARY KEY,
  wallet_id TEXT NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  tx_hash TEXT,
  token_address TEXT,
  token_symbol TEXT,
  token_name TEXT,
  action TEXT NOT NULL CHECK (action IN ('buy', 'sell')),
  eth_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
  market_cap_usd DOUBLE PRECISION,
  dex TEXT,
  launchpad TEXT,
  traded_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS trades_dedupe_idx
  ON trades (wallet_id, coalesce(tx_hash, ''), coalesce(token_address, ''), action, traded_at);
CREATE INDEX IF NOT EXISTS trades_wallet_time_idx ON trades (wallet_id, traded_at DESC);
CREATE INDEX IF NOT EXISTS trades_time_idx ON trades (traded_at DESC);

CREATE TABLE IF NOT EXISTS wallet_events (
  id BIGSERIAL PRIMARY KEY,
  wallet_id TEXT NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  from_status TEXT,
  to_status TEXT,
  detail TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS wallet_events_time_idx ON wallet_events (created_at DESC);
CREATE INDEX IF NOT EXISTS wallet_events_wallet_idx ON wallet_events (wallet_id, created_at DESC);
