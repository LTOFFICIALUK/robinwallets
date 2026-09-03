import type { WalletRow } from "./types";

export type AxiomWallet = {
  trackedWalletAddress: string;
  name: string;
  emoji: string;
  alertsOn: boolean;
};

export const toAxiomImport = (wallets: WalletRow[]): AxiomWallet[] =>
  wallets
    .filter((wallet) => wallet.addressFull && wallet.address.startsWith("0x"))
    .map((wallet) => ({
      trackedWalletAddress: wallet.address,
      name: wallet.name || shortName(wallet.address),
      emoji: wallet.emoji || "👀",
      alertsOn: true,
    }));

const shortName = (address: string) => `${address.slice(0, 6)}…${address.slice(-4)}`;

export const downloadJson = (filename: string, value: unknown) => {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};
