"use client";

import { useEffect } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { TokenLinks } from "@/components/TokenLinks";
import { age, fmtEth, fmtMc, initials, shortAddr } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { TradeRow, WalletEventRow, WalletRow } from "@/lib/types";

type WalletDrawerProps = {
  wallet: WalletRow;
  tape: TradeRow[];
  events: WalletEventRow[];
  onClose: () => void;
  onWatch: () => void;
  onHide: () => void;
  onCopy: () => void;
  copied: boolean;
};

export const WalletDrawer = ({
  wallet,
  tape,
  events,
  onClose,
  onWatch,
  onHide,
  onCopy,
  copied,
}: WalletDrawerProps) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={onClose} role="presentation">
      <aside
        className="flex h-full w-full max-w-md flex-col bg-[#101216] shadow-2xl ring-1 ring-[#232830]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wallet-drawer-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#1c222b] px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1a1f27] font-mono text-xs text-[#9cc4ff]">
              {initials(wallet.name || "??")}
            </span>
            <div className="min-w-0">
              <h2 id="wallet-drawer-title" className="truncate text-base font-semibold">
                {wallet.name || "Unnamed wallet"}
              </h2>
              <p className="mt-0.5 text-xs text-[#8b95a3]">{wallet.source} · last trade {age(wallet.lastTradeAt)}</p>
            </div>
          </div>
          <button
            type="button"
            className="rounded-lg px-2 py-1 text-sm text-[#8b95a3] hover:bg-white/5 hover:text-white"
            aria-label="Close wallet details"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-auto px-5 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={wallet.status} />
            {wallet.watched ? (
              <span className="rounded-full bg-[#CCFF00]/15 px-2 py-0.5 text-[11px] text-[#CCFF00]">On your list</span>
            ) : null}
            {!wallet.addressFull ? (
              <span className="rounded-full bg-[#ffb020]/15 px-2 py-0.5 text-[11px] text-[#ffc85a]">
                Address still truncated
              </span>
            ) : null}
          </div>

          <button
            type="button"
            className="mt-4 flex w-full items-center justify-between gap-3 rounded-xl bg-[#07080a] px-3 py-2.5 text-left ring-1 ring-[#232830] hover:text-white"
            aria-label="Copy wallet address"
            onClick={onCopy}
          >
            <span className="truncate font-mono text-xs text-[#c9d2dc]">{wallet.address}</span>
            <span className="shrink-0 text-xs text-[#8b95a3]">{copied ? "Copied" : "Copy"}</span>
          </button>

          <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-[#07080a] p-3 ring-1 ring-[#1c222b]">
              <dt className="text-[11px] uppercase tracking-wider text-[#8b95a3]">Score</dt>
              <dd className="mt-1 font-mono text-lg">{wallet.score.toFixed(0)}</dd>
            </div>
            <div className="rounded-xl bg-[#07080a] p-3 ring-1 ring-[#1c222b]">
              <dt className="text-[11px] uppercase tracking-wider text-[#8b95a3]">Trades 24h</dt>
              <dd className="mt-1 font-mono text-lg">{wallet.trades24h}</dd>
            </div>
            <div className="rounded-xl bg-[#07080a] p-3 ring-1 ring-[#1c222b]">
              <dt className="text-[11px] uppercase tracking-wider text-[#8b95a3]">Net ETH</dt>
              <dd className={cn("mt-1 font-mono text-lg", wallet.netEth >= 0 ? "text-[#CCFF00]" : "text-[#ff8a96]")}>
                {fmtEth(wallet.netEth)}
              </dd>
            </div>
            <div className="rounded-xl bg-[#07080a] p-3 ring-1 ring-[#1c222b]">
              <dt className="text-[11px] uppercase tracking-wider text-[#8b95a3]">Buy / sell</dt>
              <dd className="mt-1 font-mono text-lg">
                {wallet.buys24h}/{wallet.sells24h}
              </dd>
            </div>
          </dl>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              className="flex-1 rounded-xl bg-[#CCFF00] px-3 py-2 text-sm font-semibold text-[#111] hover:bg-[#d8ff4d]"
              onClick={onWatch}
            >
              {wallet.watched ? "Remove from list" : "Add to watchlist"}
            </button>
            {wallet.twitter ? (
              <a
                href={wallet.twitter}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl px-3 py-2 text-sm ring-1 ring-[#232830] hover:bg-white/5"
              >
                Open X
              </a>
            ) : null}
            <button
              type="button"
              className="rounded-xl px-3 py-2 text-sm text-[#8b95a3] ring-1 ring-[#232830] hover:text-[#ff8a96]"
              onClick={onHide}
            >
              Hide
            </button>
          </div>

          <h3 className="mt-8 text-sm font-medium">Recent trades</h3>
          <ul className="mt-2 space-y-1">
            {tape.length === 0 ? (
              <li className="py-4 text-sm text-[#8b95a3]">No trades on the current tape for this wallet.</li>
            ) : (
              tape.slice(0, 12).map((trade) => (
                <li key={trade.id} className="flex items-center justify-between gap-2 rounded-lg px-1 py-1.5 text-sm">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span className={trade.action === "buy" ? "text-[#CCFF00]" : "text-[#ff8a96]"}>
                      {trade.action.toUpperCase()} ${trade.tokenSymbol || "???"}
                    </span>
                    <TokenLinks address={trade.tokenAddress} />
                  </span>
                  <span className="font-mono text-xs text-[#8b95a3]">
                    {trade.ethAmount.toFixed(3)} · {fmtMc(trade.marketCapUsd)} · {age(trade.tradedAt)}
                  </span>
                </li>
              ))
            )}
          </ul>

          <h3 className="mt-8 text-sm font-medium">Status history</h3>
          <ul className="mt-2 space-y-2">
            {events.length === 0 ? (
              <li className="text-sm text-[#8b95a3]">No promotions recorded yet.</li>
            ) : (
              events.slice(0, 8).map((event) => (
                <li key={event.id} className="text-sm text-[#c9d2dc]">
                  <span className="text-[#8b95a3]">{age(event.createdAt)}</span> · {event.kind}
                  {event.fromStatus && event.toStatus ? ` · ${event.fromStatus} → ${event.toStatus}` : ""}
                </li>
              ))
            )}
          </ul>
        </div>
      </aside>
    </div>
  );
};
