import type { WalletRow, WalletStatus } from "./types";
import { hoursAgo, isFullAddress } from "./util";

export const scoreWallet = (wallet: WalletRow): { status: WalletStatus; score: number } => {
  const ageH = hoursAgo(wallet.lastTradeAt);
  const trades = wallet.trades24h;
  const buyEth = wallet.buyEth;
  const net = wallet.netEth;
  const full = wallet.addressFull && isFullAddress(wallet.address);

  if (wallet.lastTradeAt && ageH > 48 && trades < 4) {
    return { status: "stale", score: Math.max(0, 8 - ageH) };
  }

  const recency = ageH <= 1 ? 30 : ageH <= 6 ? 20 : ageH <= 24 ? 10 : 0;
  const volume = Math.min(25, trades / 8);
  const size = Math.min(20, buyEth * 2);
  const edge = net > 0 ? 15 : net > -5 ? 6 : 0;
  const resolved = full ? 10 : 0;
  const score = Number((recency + volume + size + edge + resolved).toFixed(2));

  if (full && ageH <= 6 && trades >= 40 && (net > 0 || buyEth >= 1)) {
    return { status: "good", score };
  }
  if (full && ageH <= 24 && trades >= 8) {
    return { status: "trackable", score };
  }
  if (trades >= 3 || buyEth > 0.05) {
    return { status: "candidate", score };
  }
  return { status: "seen", score };
};
