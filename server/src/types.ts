export type WalletStatus = "seen" | "candidate" | "trackable" | "good" | "stale";

export type WalletRow = {
  id: string;
  address: string;
  addressFull: boolean;
  name: string;
  twitter: string | null;
  avatar: string | null;
  fomoUrl: string | null;
  emoji: string;
  source: string;
  status: WalletStatus;
  score: number;
  trades24h: number;
  buys24h: number;
  sells24h: number;
  buyEth: number;
  sellEth: number;
  netEth: number;
  tokensTraded: number;
  lastTradeAt: string | null;
  firstSeenAt: string;
  trackedAt: string | null;
  goodAt: string | null;
  watched: boolean;
  hidden: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TradeRow = {
  id: string;
  walletId: string;
  txHash: string | null;
  tokenAddress: string | null;
  tokenSymbol: string | null;
  tokenName: string | null;
  action: "buy" | "sell";
  ethAmount: number;
  marketCapUsd: number | null;
  dex: string | null;
  launchpad: string | null;
  tradedAt: string;
  walletName?: string;
  walletAddress?: string;
  walletStatus?: WalletStatus;
};

export type WalletEventRow = {
  id: number;
  walletId: string;
  kind: string;
  fromStatus: string | null;
  toStatus: string | null;
  detail: string | null;
  createdAt: string;
  walletName?: string;
  walletAddress?: string;
};

export type Snapshot = {
  wallets: WalletRow[];
  tape: TradeRow[];
  events: WalletEventRow[];
  stats: {
    total: number;
    good: number;
    trackable: number;
    candidate: number;
    seen: number;
    stale: number;
    tape24h: number;
    lastDiscoverAt: string | null;
    persistence: "postgres" | "memory";
  };
};
