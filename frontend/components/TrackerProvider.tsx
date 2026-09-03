"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import { addWallet, fetchSnapshot, patchWallet } from "@/lib/api";
import { API_URL } from "@/lib/config";
import type { Snapshot, TradeRow, WalletEventRow, WalletRow } from "@/lib/types";

const empty: Snapshot = {
  wallets: [],
  tape: [],
  events: [],
  stats: {
    total: 0,
    good: 0,
    trackable: 0,
    candidate: 0,
    seen: 0,
    stale: 0,
    tape24h: 0,
    lastDiscoverAt: null,
    persistence: "memory",
  },
};

const mergeWallet = (list: WalletRow[], next: WalletRow) => {
  const rest = list.filter((row) => row.id !== next.id);
  return [next, ...rest];
};

type TrackerContextValue = {
  data: Snapshot;
  live: boolean;
  ready: boolean;
  error: string;
  setError: (value: string) => void;
  importWallet: (input: { address: string; name?: string }) => Promise<WalletRow>;
  watchWallet: (wallet: WalletRow) => Promise<WalletRow>;
  hideWallet: (wallet: WalletRow) => Promise<void>;
};

const TrackerContext = createContext<TrackerContextValue | null>(null);

export const TrackerProvider = ({ children }: { children: React.ReactNode }) => {
  const [data, setData] = useState<Snapshot>(empty);
  const [live, setLive] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let gone = false;
    const handleLoad = async () => {
      try {
        const next = await fetchSnapshot();
        if (!gone) {
          setData(next);
          setError("");
        }
      } catch (err) {
        if (!gone) setError(err instanceof Error ? err.message : "Tracker is offline");
      } finally {
        if (!gone) setReady(true);
      }
    };
    void handleLoad();
    const socket = io(API_URL, { transports: ["polling", "websocket"], withCredentials: true });
    socket.on("connect", () => setLive(true));
    socket.on("disconnect", () => setLive(false));
    socket.on("snapshot", (next: Snapshot) => setData(next));
    socket.on("wallet", (wallet: WalletRow) => {
      setData((prev) => ({ ...prev, wallets: mergeWallet(prev.wallets, wallet) }));
    });
    socket.on("trade", (trade: TradeRow) => {
      setData((prev) => ({ ...prev, tape: [trade, ...prev.tape].slice(0, 80) }));
    });
    socket.on("event", (event: WalletEventRow) => {
      setData((prev) => ({ ...prev, events: [event, ...prev.events].slice(0, 40) }));
    });
    return () => {
      gone = true;
      socket.close();
    };
  }, []);

  const value = useMemo<TrackerContextValue>(
    () => ({
      data,
      live,
      ready,
      error,
      setError,
      importWallet: async (input) => {
        const wallet = await addWallet(input);
        setData((prev) => ({ ...prev, wallets: mergeWallet(prev.wallets, wallet) }));
        return wallet;
      },
      watchWallet: async (wallet) => {
        const next = await patchWallet(wallet.id, { watched: !wallet.watched });
        setData((prev) => ({ ...prev, wallets: mergeWallet(prev.wallets, next) }));
        return next;
      },
      hideWallet: async (wallet) => {
        const next = await patchWallet(wallet.id, { hidden: true });
        setData((prev) => ({
          ...prev,
          wallets: prev.wallets.filter((row) => row.id !== next.id),
        }));
      },
    }),
    [data, error, live, ready],
  );

  return <TrackerContext.Provider value={value}>{children}</TrackerContext.Provider>;
};

export const useTracker = () => {
  const ctx = useContext(TrackerContext);
  if (!ctx) throw new Error("useTracker must be used inside TrackerProvider");
  return ctx;
};
