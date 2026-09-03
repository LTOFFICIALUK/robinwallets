"use client";

import { useMemo, useState } from "react";
import { HomeHero } from "@/components/HomeHero";
import { StatusBadge } from "@/components/StatusBadge";
import { useTracker } from "@/components/TrackerProvider";
import { WalletDrawer } from "@/components/WalletDrawer";
import { cn } from "@/lib/cn";
import { downloadJson, toAxiomImport } from "@/lib/export";
import { age, fmtEth, fmtMc, initials, shortAddr } from "@/lib/format";
import type { WalletStatus } from "@/lib/types";

const STATUS: Array<WalletStatus | "all"> = ["all", "good", "trackable", "candidate", "seen", "stale"];

const RANK: Record<WalletStatus, number> = {
  good: 4,
  trackable: 3,
  candidate: 2,
  seen: 1,
  stale: 0,
};

export const Tracker = () => {
  const { data, ready, error, setError, importWallet, watchWallet, hideWallet } = useTracker();
  const [filter, setFilter] = useState<WalletStatus | "all">("all");
  const [watchOnly, setWatchOnly] = useState(false);
  const [query, setQuery] = useState("");
  const [address, setAddress] = useState("");
  const [name, setName] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copied, setCopied] = useState("");
  const [toast, setToast] = useState("");

  const rows = useMemo(() => {
    return data.wallets
      .filter((wallet) => {
        if (watchOnly && !wallet.watched) return false;
        if (filter !== "all" && wallet.status !== filter) return false;
        if (!query.trim()) return true;
        const q = query.toLowerCase();
        return (
          wallet.name.toLowerCase().includes(q) ||
          wallet.address.toLowerCase().includes(q) ||
          (wallet.twitter || "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (a.watched !== b.watched) return a.watched ? -1 : 1;
        if (RANK[a.status] !== RANK[b.status]) return RANK[b.status] - RANK[a.status];
        if (b.score !== a.score) return b.score - a.score;
        return b.trades24h - a.trades24h;
      });
  }, [data.wallets, filter, query, watchOnly]);

  const selected = data.wallets.find((wallet) => wallet.id === selectedId) || null;
  const selectedTape = data.tape.filter(
    (trade) => selected && (trade.walletId === selected.id || trade.walletName === selected.name),
  );
  const selectedEvents = data.events.filter((event) => selected && event.walletId === selected.id);
  const watched = data.wallets.filter((wallet) => wallet.watched && wallet.addressFull);

  const handleImport = async () => {
    setError("");
    try {
      const wallet = await importWallet({ address, name });
      setSelectedId(wallet.id);
      setAddress("");
      setName("");
      setToast("Wallet added to the board");
      window.setTimeout(() => setToast(""), 2200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    }
  };

  const handleCopy = async (value: string) => {
    if (!value || value.includes("...") || value.startsWith("pending:")) {
      setError("This address is still truncated — wait until it resolves");
      return;
    }
    await navigator.clipboard.writeText(value);
    setCopied(value);
    setToast("Address copied");
    window.setTimeout(() => {
      setCopied("");
      setToast("");
    }, 1600);
  };

  const handleExport = () => {
    const payload = toAxiomImport(watched);
    if (payload.length === 0) {
      setError("Watch a wallet with a full address first");
      return;
    }
    downloadJson("robinwallets-axiom.json", payload);
    setToast(`Exported ${payload.length} wallets for Axiom`);
    window.setTimeout(() => setToast(""), 2200);
  };

  return (
    <>
      <HomeHero />
      <section id="board" className="mx-auto max-w-[1500px] scroll-mt-20 px-4 py-8 md:px-6">
        {error ? (
          <p className="mb-4 rounded-xl bg-[#ff5a6a]/10 px-3 py-2 text-sm text-[#ff8a96] ring-1 ring-[#ff5a6a]/20" role="alert">
            {error}
          </p>
        ) : null}

        <form
          className="grid gap-3 rounded-2xl bg-[#101216] p-4 ring-1 ring-[#232830] md:grid-cols-[1fr_200px_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            void handleImport();
          }}
        >
          <div className="md:col-span-3">
            <h2 className="text-sm font-medium">Add a wallet</h2>
            <p className="mt-1 text-sm text-[#8b95a3]">Paste a full Robinhood Chain address to track someone yourself.</p>
          </div>
          <label className="block text-xs font-medium text-[#8b95a3]">
            Address
            <input
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="0x…"
              spellCheck={false}
              className="mt-1.5 w-full rounded-xl bg-[#07080a] px-3 py-2.5 text-sm outline-none ring-1 ring-[#232830] placeholder:text-[#5d6570] focus:ring-[#CCFF00]/50"
              aria-label="Robinhood wallet address"
            />
          </label>
          <label className="block text-xs font-medium text-[#8b95a3]">
            Label
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Optional name"
              className="mt-1.5 w-full rounded-xl bg-[#07080a] px-3 py-2.5 text-sm outline-none ring-1 ring-[#232830] placeholder:text-[#5d6570] focus:ring-[#CCFF00]/50"
              aria-label="Wallet label"
            />
          </label>
          <button
            type="submit"
            className="self-end rounded-xl bg-[#CCFF00] px-4 py-2.5 text-sm font-semibold text-[#111] hover:bg-[#d8ff4d]"
            aria-label="Import wallet"
          >
            Add wallet
          </button>
        </form>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search traders"
            className="min-w-[200px] flex-1 rounded-xl bg-[#101216] px-3 py-2 text-sm outline-none ring-1 ring-[#232830] placeholder:text-[#5d6570] focus:ring-[#CCFF00]/50"
            aria-label="Filter wallets"
          />
          <div className="flex flex-wrap gap-1" role="tablist" aria-label="Status filter">
            {STATUS.map((item) => (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={filter === item}
                tabIndex={0}
                onClick={() => setFilter(item)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setFilter(item);
                  }
                }}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs capitalize",
                  filter === item
                    ? "bg-white text-[#07080a]"
                    : "bg-[#101216] text-[#8b95a3] ring-1 ring-[#232830] hover:text-white",
                )}
              >
                {item}
              </button>
            ))}
          </div>
          <button
            type="button"
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs",
              watchOnly ? "bg-[#CCFF00] font-medium text-[#111]" : "bg-[#101216] text-[#8b95a3] ring-1 ring-[#232830]",
            )}
            aria-pressed={watchOnly}
            onClick={() => setWatchOnly((prev) => !prev)}
          >
            Watchlist
          </button>
          <button
            type="button"
            className="rounded-lg px-3 py-1.5 text-xs text-[#c9d2dc] ring-1 ring-[#232830] hover:bg-white/5"
            onClick={handleExport}
          >
            Export to Axiom
          </button>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,0.85fr)]">
          <section aria-label="Wallet table" className="overflow-hidden rounded-2xl bg-[#101216] ring-1 ring-[#232830]">
            <div className="overflow-auto">
              <table className="w-full min-w-[780px] border-collapse text-left text-sm">
                <thead className="sticky top-0 bg-[#14181e] text-xs text-[#8b95a3]">
                  <tr>
                    <th className="px-4 py-3 font-medium">Trader</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                    <th className="px-3 py-3 text-right font-medium">Score</th>
                    <th className="px-3 py-3 text-right font-medium">24h</th>
                    <th className="px-3 py-3 text-right font-medium">Net</th>
                    <th className="px-3 py-3 font-medium">Last</th>
                    <th className="px-4 py-3 font-medium"> </th>
                  </tr>
                </thead>
                <tbody>
                  {!ready ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-[#8b95a3]">
                        Loading the live board…
                      </td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-[#8b95a3]">
                        Nothing in this view. Try another filter or add a wallet.
                      </td>
                    </tr>
                  ) : (
                    rows.map((wallet) => (
                      <tr
                        key={wallet.id}
                        className={cn(
                          "cursor-pointer border-t border-[#1c222b] hover:bg-white/[0.03]",
                          selectedId === wallet.id && "bg-[#CCFF00]/10",
                        )}
                        onClick={() => setSelectedId(wallet.id)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1a1f27] font-mono text-[11px] text-[#9cc4ff]">
                              {initials(wallet.name || "??")}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate font-medium">{wallet.name || "Unnamed"}</p>
                              <p className="font-mono text-xs text-[#8b95a3]">
                                {shortAddr(wallet.address)}
                                {wallet.addressFull ? "" : " · truncated"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <StatusBadge status={wallet.status} />
                        </td>
                        <td className="px-3 py-3 text-right font-mono tabular-nums">{wallet.score.toFixed(0)}</td>
                        <td className="px-3 py-3 text-right font-mono tabular-nums">{wallet.trades24h}</td>
                        <td
                          className={cn(
                            "px-3 py-3 text-right font-mono tabular-nums",
                            wallet.netEth >= 0 ? "text-[#CCFF00]" : "text-[#ff8a96]",
                          )}
                        >
                          {fmtEth(wallet.netEth)} ETH
                        </td>
                        <td className="px-3 py-3 text-[#8b95a3]">{age(wallet.lastTradeAt)}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            className="rounded-lg px-2 py-1 text-xs ring-1 ring-[#232830] hover:bg-white/5"
                            aria-label={wallet.watched ? `Unwatch ${wallet.name}` : `Watch ${wallet.name}`}
                            onClick={(event) => {
                              event.stopPropagation();
                              void watchWallet(wallet);
                            }}
                          >
                            {wallet.watched ? "Watching" : "Watch"}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <div className="grid gap-4">
            <section className="flex min-h-[260px] flex-col overflow-hidden rounded-2xl bg-[#101216] ring-1 ring-[#232830]">
              <div className="border-b border-[#1c222b] px-4 py-3">
                <h2 className="text-sm font-medium">Live tape</h2>
                <p className="text-xs text-[#8b95a3]">Buys and sells as they hit the feed</p>
              </div>
              <ul className="flex-1 overflow-auto px-2 py-2">
                {data.tape.length === 0 ? (
                  <li className="px-2 py-8 text-center text-sm text-[#8b95a3]">Waiting for the next trade…</li>
                ) : (
                  data.tape.slice(0, 40).map((trade) => (
                    <li key={trade.id} className="flex items-center gap-2 rounded-xl px-2 py-1.5">
                      <span
                        className={cn(
                          "w-11 shrink-0 rounded-md py-0.5 text-center text-[11px] font-semibold uppercase",
                          trade.action === "buy" ? "bg-[#CCFF00]/15 text-[#CCFF00]" : "bg-[#ff5a6a]/15 text-[#ff8a96]",
                        )}
                      >
                        {trade.action}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm">
                          {trade.walletName || "Unknown"}{" "}
                          <span className="text-[#8b95a3]">${trade.tokenSymbol || "???"}</span>
                        </p>
                        <p className="text-[11px] text-[#8b95a3]">
                          {age(trade.tradedAt)} · {fmtMc(trade.marketCapUsd)}
                        </p>
                      </div>
                      <span className="font-mono text-xs tabular-nums">{trade.ethAmount.toFixed(3)}</span>
                    </li>
                  ))
                )}
              </ul>
            </section>
            <section className="flex min-h-[200px] flex-col overflow-hidden rounded-2xl bg-[#101216] ring-1 ring-[#232830]">
              <div className="border-b border-[#1c222b] px-4 py-3">
                <h2 className="text-sm font-medium">Promotions</h2>
                <p className="text-xs text-[#8b95a3]">When wallets become trackable or good</p>
              </div>
              <ul className="flex-1 overflow-auto px-4 py-2">
                {data.events.length === 0 ? (
                  <li className="py-8 text-center text-sm text-[#8b95a3]">No status changes yet.</li>
                ) : (
                  data.events.slice(0, 16).map((event) => (
                    <li key={event.id} className="border-b border-[#1c222b] py-2.5 last:border-0">
                      <p className="text-sm">{event.walletName || "Wallet"}</p>
                      <p className="text-xs capitalize text-[#8b95a3]">
                        {age(event.createdAt)} · {event.kind}
                        {event.fromStatus && event.toStatus ? ` · ${event.fromStatus} → ${event.toStatus}` : ""}
                      </p>
                    </li>
                  ))
                )}
              </ul>
            </section>
          </div>
        </div>
      </section>

      {selected ? (
        <WalletDrawer
          wallet={selected}
          tape={selectedTape}
          events={selectedEvents}
          copied={copied === selected.address}
          onClose={() => setSelectedId(null)}
          onCopy={() => void handleCopy(selected.address)}
          onWatch={() => void watchWallet(selected)}
          onHide={async () => {
            await hideWallet(selected);
            setSelectedId(null);
          }}
        />
      ) : null}

      {toast ? (
        <p
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#e8edf2] px-4 py-2 text-sm font-medium text-[#07080a] shadow-lg"
          role="status"
        >
          {toast}
        </p>
      ) : null}
    </>
  );
};
