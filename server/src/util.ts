import { createHash, randomUUID } from "node:crypto";
import type { WalletStatus } from "./types";

const FULL_ADDR = /^0x[a-fA-F0-9]{40}$/;

export const nowIso = () => new Date().toISOString();

export const newId = () => randomUUID();

export const isFullAddress = (value: string) => FULL_ADDR.test(value.trim());

export const isTruncatedAddress = (value: string) => value.includes("...");

export const normalizeAddress = (value: string) => {
  const next = value.trim();
  if (isFullAddress(next)) return next.toLowerCase();
  return next;
};

export const normalizeName = (value: string) => value.trim().replace(/\s+/g, " ");

export const nameKey = (value: string) => normalizeName(value).toLowerCase();

export const matchesTruncated = (full: string, truncated: string) => {
  if (!isFullAddress(full) || !truncated.includes("...")) return false;
  const [head, tail] = truncated.split("...");
  const addr = full.toLowerCase();
  return addr.startsWith((head || "").toLowerCase()) && addr.endsWith((tail || "").toLowerCase());
};

export const tradeId = (input: {
  walletId: string;
  txHash?: string | null;
  tokenAddress?: string | null;
  action: string;
  tradedAt: string;
}) =>
  createHash("sha1")
    .update(
      [input.walletId, input.txHash || "", input.tokenAddress || "", input.action, input.tradedAt].join("|"),
    )
    .digest("hex");

export const hoursAgo = (iso: string | null) => {
  if (!iso) return Infinity;
  return (Date.now() - new Date(iso).getTime()) / 36e5;
};

export const statusRank: Record<WalletStatus, number> = {
  seen: 0,
  candidate: 1,
  trackable: 2,
  good: 3,
  stale: -1,
};
