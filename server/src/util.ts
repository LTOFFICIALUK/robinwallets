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

export const twitterHandle = (value?: string | null) => {
  if (!value) return "";
  const raw = value.trim();
  if (!raw) return "";
  try {
    if (raw.startsWith("http://") || raw.startsWith("https://")) {
      const url = new URL(raw);
      const host = url.hostname.replace(/^www\./, "");
      if (host !== "x.com" && host !== "twitter.com") return "";
      const handle = url.pathname.split("/").filter(Boolean)[0] || "";
      return handle.replace(/^@/, "").trim();
    }
  } catch {
    /* fall through */
  }
  return raw.replace(/^@/, "").replace(/^https?:\/\/(www\.)?(x|twitter)\.com\//i, "").split(/[/?#]/)[0].trim();
};

export const normalizeTwitterUrl = (value?: string | null) => {
  const handle = twitterHandle(value);
  return handle ? `https://x.com/${handle}` : null;
};

export const avatarFromTwitter = (value?: string | null) => {
  const handle = twitterHandle(value);
  return handle ? `https://unavatar.io/twitter/${encodeURIComponent(handle)}` : null;
};

export const fomoProfileUrl = (value?: string | null) => {
  const handle = String(value || "")
    .trim()
    .replace(/^@/, "")
    .split(/[/?#\s]/)[0];
  if (!handle || handle.includes("...")) return null;
  return `https://fomo.family/profile/${encodeURIComponent(handle)}`;
};

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
