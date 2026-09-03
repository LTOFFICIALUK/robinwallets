import { pool } from "./db";
import { scoreWallet } from "./score";
import { SEED_WALLETS } from "./seed";
import type { Snapshot, TradeRow, WalletEventRow, WalletRow, WalletStatus } from "./types";
import {
  isFullAddress,
  matchesTruncated,
  nameKey,
  newId,
  normalizeAddress,
  normalizeName,
  nowIso,
  tradeId,
} from "./util";

const wallets = new Map<string, WalletRow>();
const trades = new Map<string, TradeRow>();
const events: WalletEventRow[] = [];
let eventSeq = 1;
let lastDiscoverAt: string | null = null;
let dirty = true;

const listeners = new Set<(payload: { type: string; data: unknown }) => void>();

export const onLive = (fn: (payload: { type: string; data: unknown }) => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

const emit = (type: string, data: unknown) => {
  dirty = true;
  for (const fn of listeners) fn({ type, data });
};

const persistWallet = async (wallet: WalletRow) => {
  if (!pool) return;
  await pool.query(
    `INSERT INTO wallets (
       id, address, address_full, name, twitter, emoji, source, status, score,
       trades_24h, buys_24h, sells_24h, buy_eth, sell_eth, net_eth, tokens_traded,
       last_trade_at, first_seen_at, tracked_at, good_at, watched, hidden, notes, created_at, updated_at
     ) VALUES (
       $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25
     )
     ON CONFLICT (id) DO UPDATE SET
       address = EXCLUDED.address,
       address_full = EXCLUDED.address_full,
       name = EXCLUDED.name,
       twitter = COALESCE(EXCLUDED.twitter, wallets.twitter),
       emoji = EXCLUDED.emoji,
       source = EXCLUDED.source,
       status = EXCLUDED.status,
       score = EXCLUDED.score,
       trades_24h = EXCLUDED.trades_24h,
       buys_24h = EXCLUDED.buys_24h,
       sells_24h = EXCLUDED.sells_24h,
       buy_eth = EXCLUDED.buy_eth,
       sell_eth = EXCLUDED.sell_eth,
       net_eth = EXCLUDED.net_eth,
       tokens_traded = EXCLUDED.tokens_traded,
       last_trade_at = EXCLUDED.last_trade_at,
       tracked_at = EXCLUDED.tracked_at,
       good_at = EXCLUDED.good_at,
       watched = EXCLUDED.watched,
       hidden = EXCLUDED.hidden,
       notes = EXCLUDED.notes,
       updated_at = EXCLUDED.updated_at`,
    [
      wallet.id,
      wallet.address,
      wallet.addressFull,
      wallet.name,
      wallet.twitter,
      wallet.emoji,
      wallet.source,
      wallet.status,
      wallet.score,
      wallet.trades24h,
      wallet.buys24h,
      wallet.sells24h,
      wallet.buyEth,
      wallet.sellEth,
      wallet.netEth,
      wallet.tokensTraded,
      wallet.lastTradeAt,
      wallet.firstSeenAt,
      wallet.trackedAt,
      wallet.goodAt,
      wallet.watched,
      wallet.hidden,
      wallet.notes,
      wallet.createdAt,
      wallet.updatedAt,
    ],
  );
};

const persistTrade = async (trade: TradeRow) => {
  if (!pool) return;
  await pool.query(
    `INSERT INTO trades (
       id, wallet_id, tx_hash, token_address, token_symbol, token_name, action,
       eth_amount, market_cap_usd, dex, launchpad, traded_at
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     ON CONFLICT (id) DO NOTHING`,
    [
      trade.id,
      trade.walletId,
      trade.txHash,
      trade.tokenAddress,
      trade.tokenSymbol,
      trade.tokenName,
      trade.action,
      trade.ethAmount,
      trade.marketCapUsd,
      trade.dex,
      trade.launchpad,
      trade.tradedAt,
    ],
  );
};

const persistEvent = async (event: WalletEventRow) => {
  if (!pool) return;
  await pool.query(
    `INSERT INTO wallet_events (wallet_id, kind, from_status, to_status, detail, created_at)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [event.walletId, event.kind, event.fromStatus, event.toStatus, event.detail, event.createdAt],
  );
};

const pushEvent = (input: {
  wallet: WalletRow;
  kind: string;
  fromStatus?: string | null;
  toStatus?: string | null;
  detail?: string | null;
}) => {
  const row: WalletEventRow = {
    id: eventSeq++,
    walletId: input.wallet.id,
    kind: input.kind,
    fromStatus: input.fromStatus || null,
    toStatus: input.toStatus || null,
    detail: input.detail || null,
    createdAt: nowIso(),
    walletName: input.wallet.name,
    walletAddress: input.wallet.address,
  };
  events.unshift(row);
  if (events.length > 400) events.length = 400;
  void persistEvent(row);
  emit("event", row);
};

const findByAddress = (address: string) => {
  const key = normalizeAddress(address);
  for (const wallet of wallets.values()) {
    if (normalizeAddress(wallet.address) === key) return wallet;
    if (wallet.addressFull && matchesTruncated(wallet.address, address)) return wallet;
    if (isFullAddress(address) && matchesTruncated(address, wallet.address)) return wallet;
  }
  return null;
};

const findByName = (name: string) => {
  const key = nameKey(name);
  if (!key) return null;
  const hits = [...wallets.values()].filter((wallet) => nameKey(wallet.name) === key);
  if (hits.length === 1) return hits[0];
  return hits.find((wallet) => wallet.addressFull) || hits[0] || null;
};

export const upsertWallet = (input: {
  address?: string;
  name?: string;
  twitter?: string | null;
  emoji?: string;
  source: string;
  watched?: boolean;
  notes?: string | null;
}) => {
  const name = normalizeName(input.name || "");
  const address = input.address ? normalizeAddress(input.address) : "";
  const named = Boolean(name && name !== "unnamed");
  let wallet = (address && findByAddress(address)) || (named ? findByName(name) : null);
  const created = !wallet;
  if (!wallet) {
    const stamp = nowIso();
    wallet = {
      id: newId(),
      address: address || `pending:${newId().slice(0, 8)}`,
      addressFull: Boolean(address && isFullAddress(address)),
      name: name || "unnamed",
      twitter: input.twitter || null,
      emoji: input.emoji || "*",
      source: input.source,
      status: "seen",
      score: 0,
      trades24h: 0,
      buys24h: 0,
      sells24h: 0,
      buyEth: 0,
      sellEth: 0,
      netEth: 0,
      tokensTraded: 0,
      lastTradeAt: null,
      firstSeenAt: stamp,
      trackedAt: null,
      goodAt: null,
      watched: Boolean(input.watched),
      hidden: false,
      notes: input.notes || null,
      createdAt: stamp,
      updatedAt: stamp,
    };
    wallets.set(wallet.id, wallet);
    pushEvent({ wallet, kind: "discovered", toStatus: "seen", detail: input.source });
  }

  if (address && isFullAddress(address) && (!wallet.addressFull || wallet.address !== address)) {
    const previous = wallet.address;
    wallet.address = address;
    wallet.addressFull = true;
    pushEvent({
      wallet,
      kind: "resolved_address",
      detail: previous.includes("...") || previous.startsWith("pending:") ? previous : null,
    });
  } else if (address && !wallet.addressFull && !isFullAddress(wallet.address)) {
    wallet.address = address;
  }
  if (name && (!wallet.name || wallet.name === "unnamed" || nameKey(wallet.name) === nameKey(name))) {
    wallet.name = name;
  }
  if (input.twitter) wallet.twitter = input.twitter;
  if (input.emoji) wallet.emoji = input.emoji;
  if (input.watched) wallet.watched = true;
  if (input.notes) wallet.notes = input.notes;
  if (created && input.source === "user") wallet.source = "user";
  wallet.updatedAt = nowIso();
  void persistWallet(wallet);
  emit("wallet", wallet);
  return { wallet, created };
};

export const applyBoardStats = (wallet: WalletRow, stats: {
  trades?: number;
  buys?: number;
  sells?: number;
  buyEth?: number;
  sellEth?: number;
  netEth?: number;
  tokensTraded?: number;
  lastTradeAt?: string | null;
}) => {
  if (typeof stats.trades === "number") wallet.trades24h = stats.trades;
  if (typeof stats.buys === "number") wallet.buys24h = stats.buys;
  if (typeof stats.sells === "number") wallet.sells24h = stats.sells;
  if (typeof stats.buyEth === "number") wallet.buyEth = stats.buyEth;
  if (typeof stats.sellEth === "number") wallet.sellEth = stats.sellEth;
  if (typeof stats.netEth === "number") wallet.netEth = stats.netEth;
  if (typeof stats.tokensTraded === "number") wallet.tokensTraded = stats.tokensTraded;
  if (stats.lastTradeAt) {
    if (!wallet.lastTradeAt || new Date(stats.lastTradeAt) > new Date(wallet.lastTradeAt)) {
      wallet.lastTradeAt = stats.lastTradeAt;
    }
  }
  wallet.updatedAt = nowIso();
};

export const rescoreWallet = (wallet: WalletRow) => {
  const previous = wallet.status;
  const next = scoreWallet(wallet);
  wallet.score = next.score;
  wallet.status = next.status;
  wallet.updatedAt = nowIso();
  if (next.status === "trackable" && !wallet.trackedAt) wallet.trackedAt = nowIso();
  if (next.status === "good" && !wallet.goodAt) wallet.goodAt = nowIso();
  if (previous !== next.status) {
    pushEvent({
      wallet,
      kind: next.status === "stale" ? "demoted" : "promoted",
      fromStatus: previous,
      toStatus: next.status,
    });
  }
  void persistWallet(wallet);
  emit("wallet", wallet);
  return previous !== next.status;
};

export const addTrade = (input: {
  wallet: WalletRow;
  txHash?: string | null;
  tokenAddress?: string | null;
  tokenSymbol?: string | null;
  tokenName?: string | null;
  action: "buy" | "sell";
  ethAmount: number;
  marketCapUsd?: number | null;
  dex?: string | null;
  launchpad?: string | null;
  tradedAt: string;
}) => {
  const id = tradeId({
    walletId: input.wallet.id,
    txHash: input.txHash,
    tokenAddress: input.tokenAddress,
    action: input.action,
    tradedAt: input.tradedAt,
  });
  if (trades.has(id)) return null;
  const trade: TradeRow = {
    id,
    walletId: input.wallet.id,
    txHash: input.txHash || null,
    tokenAddress: input.tokenAddress || null,
    tokenSymbol: input.tokenSymbol || null,
    tokenName: input.tokenName || null,
    action: input.action,
    ethAmount: input.ethAmount,
    marketCapUsd: input.marketCapUsd ?? null,
    dex: input.dex || null,
    launchpad: input.launchpad || null,
    tradedAt: input.tradedAt,
    walletName: input.wallet.name,
    walletAddress: input.wallet.address,
    walletStatus: input.wallet.status,
  };
  trades.set(id, trade);
  if (!input.wallet.lastTradeAt || new Date(input.tradedAt) > new Date(input.wallet.lastTradeAt)) {
    input.wallet.lastTradeAt = input.tradedAt;
  }
  input.wallet.updatedAt = nowIso();
  void persistTrade(trade);
  emit("trade", trade);
  return trade;
};

export const refreshWindowStats = () => {
  const cutoff = Date.now() - 24 * 36e5;
  const byWallet = new Map<string, TradeRow[]>();
  for (const trade of trades.values()) {
    if (new Date(trade.tradedAt).getTime() < cutoff) continue;
    const list = byWallet.get(trade.walletId) || [];
    list.push(trade);
    byWallet.set(trade.walletId, list);
  }
  for (const wallet of wallets.values()) {
    const list = byWallet.get(wallet.id) || [];
    if (!list.length && wallet.source === "kol-board") {
      rescoreWallet(wallet);
      continue;
    }
    if (list.length) {
      wallet.trades24h = Math.max(wallet.trades24h, list.length);
      const buys = list.filter((row) => row.action === "buy");
      const sells = list.filter((row) => row.action === "sell");
      wallet.buys24h = Math.max(wallet.buys24h, buys.length);
      wallet.sells24h = Math.max(wallet.sells24h, sells.length);
      const buyEth = buys.reduce((sum, row) => sum + row.ethAmount, 0);
      const sellEth = sells.reduce((sum, row) => sum + row.ethAmount, 0);
      if (buyEth) wallet.buyEth = Math.max(wallet.buyEth, buyEth);
      if (sellEth) wallet.sellEth = Math.max(wallet.sellEth, sellEth);
      wallet.netEth = wallet.sellEth - wallet.buyEth;
      wallet.tokensTraded = Math.max(
        wallet.tokensTraded,
        new Set(list.map((row) => row.tokenAddress || row.tokenSymbol || "")).size,
      );
    }
    rescoreWallet(wallet);
  }
};

export const patchWallet = (id: string, patch: { watched?: boolean; hidden?: boolean; name?: string; emoji?: string }) => {
  const wallet = wallets.get(id) || [...wallets.values()].find((row) => row.address === id);
  if (!wallet) return null;
  if (typeof patch.watched === "boolean") wallet.watched = patch.watched;
  if (typeof patch.hidden === "boolean") wallet.hidden = patch.hidden;
  if (patch.name) wallet.name = normalizeName(patch.name);
  if (patch.emoji) wallet.emoji = patch.emoji;
  wallet.updatedAt = nowIso();
  void persistWallet(wallet);
  emit("wallet", wallet);
  return wallet;
};

export const listWallets = (input?: { status?: WalletStatus; q?: string; includeHidden?: boolean }) => {
  let rows = [...wallets.values()];
  if (!input?.includeHidden) rows = rows.filter((row) => !row.hidden);
  if (input?.status) rows = rows.filter((row) => row.status === input.status);
  if (input?.q) {
    const q = input.q.toLowerCase();
    rows = rows.filter(
      (row) =>
        row.name.toLowerCase().includes(q) ||
        row.address.toLowerCase().includes(q) ||
        (row.twitter || "").toLowerCase().includes(q),
    );
  }
  return rows.sort((a, b) => {
    if (a.watched !== b.watched) return a.watched ? -1 : 1;
    if (b.score !== a.score) return b.score - a.score;
    return (b.lastTradeAt || "").localeCompare(a.lastTradeAt || "");
  });
};

export const listTape = (limit = 80) =>
  [...trades.values()]
    .sort((a, b) => b.tradedAt.localeCompare(a.tradedAt))
    .slice(0, limit)
    .map((trade) => {
      const wallet = wallets.get(trade.walletId);
      return {
        ...trade,
        walletName: wallet?.name || trade.walletName,
        walletAddress: wallet?.address || trade.walletAddress,
        walletStatus: wallet?.status || trade.walletStatus,
      };
    });

export const listEvents = (limit = 40) => events.slice(0, limit);

export const stats = () => {
  const rows = [...wallets.values()].filter((row) => !row.hidden);
  const count = (status: WalletStatus) => rows.filter((row) => row.status === status).length;
  return {
    total: rows.length,
    good: count("good"),
    trackable: count("trackable"),
    candidate: count("candidate"),
    seen: count("seen"),
    stale: count("stale"),
    tape24h: [...trades.values()].filter((row) => Date.now() - new Date(row.tradedAt).getTime() < 24 * 36e5).length,
    lastDiscoverAt,
    persistence: pool ? ("postgres" as const) : ("memory" as const),
  };
};

export const snapshot = (): Snapshot => ({
  wallets: listWallets(),
  tape: listTape(),
  events: listEvents(),
  stats: stats(),
});

export const markDiscovered = () => {
  lastDiscoverAt = nowIso();
  dirty = true;
};

export const takeDirty = () => {
  if (!dirty) return false;
  dirty = false;
  return true;
};

export const loadFromDb = async () => {
  if (!pool) return;
  const walletRows = await pool.query(`SELECT * FROM wallets`);
  for (const row of walletRows.rows) {
    const wallet: WalletRow = {
      id: row.id,
      address: row.address,
      addressFull: row.address_full,
      name: row.name,
      twitter: row.twitter,
      emoji: row.emoji,
      source: row.source,
      status: row.status,
      score: Number(row.score || 0),
      trades24h: Number(row.trades_24h || 0),
      buys24h: Number(row.buys_24h || 0),
      sells24h: Number(row.sells_24h || 0),
      buyEth: Number(row.buy_eth || 0),
      sellEth: Number(row.sell_eth || 0),
      netEth: Number(row.net_eth || 0),
      tokensTraded: Number(row.tokens_traded || 0),
      lastTradeAt: row.last_trade_at ? new Date(row.last_trade_at).toISOString() : null,
      firstSeenAt: new Date(row.first_seen_at).toISOString(),
      trackedAt: row.tracked_at ? new Date(row.tracked_at).toISOString() : null,
      goodAt: row.good_at ? new Date(row.good_at).toISOString() : null,
      watched: row.watched,
      hidden: row.hidden,
      notes: row.notes,
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString(),
    };
    wallets.set(wallet.id, wallet);
  }
  const tradeRows = await pool.query(`SELECT * FROM trades ORDER BY traded_at DESC LIMIT 2000`);
  for (const row of tradeRows.rows) {
    const trade: TradeRow = {
      id: row.id,
      walletId: row.wallet_id,
      txHash: row.tx_hash,
      tokenAddress: row.token_address,
      tokenSymbol: row.token_symbol,
      tokenName: row.token_name,
      action: row.action,
      ethAmount: Number(row.eth_amount || 0),
      marketCapUsd: row.market_cap_usd === null ? null : Number(row.market_cap_usd),
      dex: row.dex,
      launchpad: row.launchpad,
      tradedAt: new Date(row.traded_at).toISOString(),
    };
    trades.set(trade.id, trade);
  }
  const eventRows = await pool.query(`SELECT * FROM wallet_events ORDER BY created_at DESC LIMIT 200`);
  for (const row of eventRows.rows) {
    events.push({
      id: Number(row.id),
      walletId: row.wallet_id,
      kind: row.kind,
      fromStatus: row.from_status,
      toStatus: row.to_status,
      detail: row.detail,
      createdAt: new Date(row.created_at).toISOString(),
    });
    eventSeq = Math.max(eventSeq, Number(row.id) + 1);
  }
};

export const seedKnown = () => {
  for (const seed of SEED_WALLETS) {
    upsertWallet({
      address: seed.address,
      name: seed.name,
      twitter: seed.twitter || null,
      emoji: seed.emoji,
      source: "seed",
      watched: ["Cupsey", "dv"].includes(seed.name),
    });
  }
  refreshWindowStats();
};
