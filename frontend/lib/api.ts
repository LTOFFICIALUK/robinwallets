import { API_URL } from "./config";
import type { Snapshot, WalletRow } from "./types";

const api = (path: string) => {
  if (typeof window === "undefined") return `${API_URL}${path}`;
  return `/backend${path}`;
};

export const fetchSnapshot = async (): Promise<Snapshot> => {
  const response = await fetch(api("/snapshot"));
  if (!response.ok) throw new Error("Tracker offline");
  return response.json();
};

export const addWallet = async (input: { address: string; name?: string }) => {
  const response = await fetch(api("/wallets"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Import failed");
  return data.wallet as WalletRow;
};

export const patchWallet = async (id: string, body: { watched?: boolean; hidden?: boolean }) => {
  const response = await fetch(api(`/wallets/${id}`), {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Update failed");
  return data.wallet as WalletRow;
};
