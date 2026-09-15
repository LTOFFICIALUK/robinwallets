import {
  addTrade,
  applyBoardStats,
  listWallets,
  markDiscovered,
  refreshWindowStats,
  upsertWallet,
} from "./store";
import { resolveFomoProfile } from "./social";
import { avatarFromTwitter, normalizeTwitterUrl } from "./util";

const FEED_URL = "https://madeonsol.com/api/rhc/kol-feed";
const BOARD_URL = "https://madeonsol.com/api/rhc/kol-leaderboard";

type FeedTrade = {
  kol_name?: string;
  kol_twitter?: string | null;
  kol_avatar?: string | null;
  evm_address?: string;
  token_address?: string;
  token_symbol?: string;
  token_name?: string;
  action?: string;
  eth_amount?: number;
  market_cap_usd_at_trade?: number | null;
  dex?: string | null;
  launchpad?: string | null;
  tx_hash?: string | null;
  traded_at?: string;
};

type BoardRow = {
  kol_name?: string;
  kol_twitter?: string | null;
  trades?: number;
  buys?: number;
  sells?: number;
  buy_eth?: number;
  sell_eth?: number;
  net_eth?: number;
  tokens_traded?: number;
  last_trade_at?: string | null;
};

const fetchJson = async (url: string) => {
  const response = await fetch(url, {
    headers: { "user-agent": "plumelist/0.1" },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`${url} ${response.status}`);
  return response.json();
};

const socialFields = (input: {
  twitter?: string | null;
  avatar?: string | null;
  name?: string;
  fomoUrl?: string | null;
}) => {
  const twitter = normalizeTwitterUrl(input.twitter);
  const avatar = (input.avatar || "").trim() || avatarFromTwitter(twitter);
  return {
    twitter,
    avatar,
    fomoUrl: input.fomoUrl || null,
  };
};

export const ingestFeed = async () => {
  const data = (await fetchJson(FEED_URL)) as { trades?: FeedTrade[] };
  const rows = data.trades || [];
  let added = 0;
  for (const row of rows) {
    const name = String(row.kol_name || "").trim();
    const address = String(row.evm_address || "").trim();
    if (!name && !address) continue;
    const action = row.action === "sell" ? "sell" : row.action === "buy" ? "buy" : null;
    if (!action) continue;
    const social = socialFields({
      twitter: row.kol_twitter,
      avatar: row.kol_avatar,
      name,
    });
    const { wallet } = upsertWallet({
      address: address || undefined,
      name: name || undefined,
      twitter: social.twitter,
      avatar: social.avatar,
      source: "kol-feed",
    });
    const trade = addTrade({
      wallet,
      txHash: row.tx_hash || null,
      tokenAddress: row.token_address || null,
      tokenSymbol: row.token_symbol || null,
      tokenName: row.token_name || null,
      action,
      ethAmount: Number(row.eth_amount || 0),
      marketCapUsd: row.market_cap_usd_at_trade ?? null,
      dex: row.dex || null,
      launchpad: row.launchpad || null,
      tradedAt: row.traded_at || new Date().toISOString(),
    });
    if (trade) added += 1;
  }
  markDiscovered();
  return { pulled: rows.length, added };
};

export const ingestBoard = async (period: "24h" | "7d" = "24h") => {
  const data = (await fetchJson(`${BOARD_URL}?period=${period}`)) as { leaderboard?: BoardRow[] };
  const rows = data.leaderboard || [];
  for (const row of rows) {
    const name = String(row.kol_name || "").trim();
    if (!name) continue;
    const social = socialFields({ twitter: row.kol_twitter, name });
    const { wallet } = upsertWallet({
      name,
      twitter: social.twitter,
      avatar: social.avatar,
      source: "kol-board",
    });
    applyBoardStats(wallet, {
      trades: period === "24h" ? Number(row.trades || 0) : wallet.trades24h,
      buys: period === "24h" ? Number(row.buys || 0) : wallet.buys24h,
      sells: period === "24h" ? Number(row.sells || 0) : wallet.sells24h,
      buyEth: period === "24h" ? Number(row.buy_eth || 0) : wallet.buyEth,
      sellEth: period === "24h" ? Number(row.sell_eth || 0) : wallet.sellEth,
      netEth: Number(row.net_eth || 0),
      tokensTraded: Number(row.tokens_traded || 0),
      lastTradeAt: row.last_trade_at || null,
    });
  }
  refreshWindowStats();
  markDiscovered();
  return { pulled: rows.length, period };
};

export const enrichSocialProfiles = async (limit = 12) => {
  const targets = listWallets()
    .filter((wallet) => !wallet.hidden)
    .filter((wallet) => !wallet.fomoUrl || !wallet.avatar)
    .sort((a, b) => Number(Boolean(b.twitter)) - Number(Boolean(a.twitter)))
    .slice(0, limit);

  let linked = 0;
  for (const wallet of targets) {
    const twitter = wallet.twitter || null;
    const avatar = wallet.avatar || avatarFromTwitter(twitter);
    const fomoUrl =
      wallet.fomoUrl ||
      (await resolveFomoProfile([twitter, wallet.name, twitterHandleFromName(wallet.name)]));
    if (!fomoUrl && !avatar) continue;
    if (fomoUrl === wallet.fomoUrl && avatar === wallet.avatar) continue;
    upsertWallet({
      address: wallet.addressFull ? wallet.address : undefined,
      name: wallet.name,
      twitter,
      avatar,
      fomoUrl,
      source: wallet.source || "social",
    });
    if (fomoUrl && !wallet.fomoUrl) linked += 1;
  }
  return { checked: targets.length, linked };
};

const twitterHandleFromName = (name: string) => name.replace(/\s+/g, "");

export const discoverOnce = async () => {
  const feed = await ingestFeed().catch((error) => {
    console.warn("feed ingest failed", error instanceof Error ? error.message : error);
    return { pulled: 0, added: 0 };
  });
  const board = await ingestBoard("24h").catch((error) => {
    console.warn("board ingest failed", error instanceof Error ? error.message : error);
    return { pulled: 0, period: "24h" as const };
  });
  const social = await enrichSocialProfiles().catch((error) => {
    console.warn("social enrich failed", error instanceof Error ? error.message : error);
    return { checked: 0, linked: 0 };
  });
  refreshWindowStats();
  return { feed, board, social };
};
