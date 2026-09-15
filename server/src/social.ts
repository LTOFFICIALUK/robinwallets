import { fomoProfileUrl, twitterHandle } from "./util";

const fomoChecked = new Map<string, string | null>();
let emptyCardBytes: number | null = null;

const cardUrl = (handle: string) =>
  `https://image-renderer.fomo.cloud/og/profile/${encodeURIComponent(handle)}/card.png`;

const measureCard = async (handle: string) => {
  const response = await fetch(cardUrl(handle), {
    headers: { "user-agent": "plumelist/0.1" },
    signal: AbortSignal.timeout(10000),
    redirect: "follow",
  });
  if (!response.ok) return null;
  const lengthHeader = Number(response.headers.get("content-length") || 0);
  if (lengthHeader > 0) return lengthHeader;
  const buffer = await response.arrayBuffer();
  return buffer.byteLength;
};

const emptyFomoCardBytes = async () => {
  if (emptyCardBytes !== null) return emptyCardBytes;
  emptyCardBytes = (await measureCard("__plumelist_missing_profile__")) || -1;
  return emptyCardBytes;
};

export const resolveFomoProfile = async (candidates: Array<string | null | undefined>) => {
  const emptyBytes = await emptyFomoCardBytes();
  for (const raw of candidates) {
    const handle = twitterHandle(raw) || String(raw || "").trim().replace(/^@/, "");
    if (!handle || handle.includes("...") || handle.length < 2) continue;
    const key = handle.toLowerCase();
    if (fomoChecked.has(key)) {
      const cached = fomoChecked.get(key);
      if (cached) return cached;
      continue;
    }
    const url = fomoProfileUrl(handle);
    if (!url) {
      fomoChecked.set(key, null);
      continue;
    }
    try {
      const bytes = await measureCard(handle);
      if (!bytes || (emptyBytes > 0 && bytes === emptyBytes)) {
        fomoChecked.set(key, null);
        continue;
      }
      fomoChecked.set(key, url);
      return url;
    } catch {
      fomoChecked.set(key, null);
    }
  }
  return null;
};
