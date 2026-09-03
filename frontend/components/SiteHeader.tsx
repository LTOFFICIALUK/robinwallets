"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "@/components/BrandMark";
import { useTracker } from "@/components/TrackerProvider";
import { BRAND, X_HANDLE, X_URL } from "@/lib/brand";
import { cn } from "@/lib/cn";

const LINKS = [
  { href: "/", label: "Tracker" },
  { href: "/how", label: "How it works" },
];

export const SiteHeader = () => {
  const pathname = usePathname();
  const { live, data } = useTracker();

  return (
    <header className="sticky top-0 z-40 border-b border-[#1c222b] bg-[#07080a]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1500px] items-center gap-6 px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2.5" aria-label={`${BRAND} home`}>
          <BrandMark />
          <span className="text-[15px] font-semibold tracking-tight">{BRAND}</span>
        </Link>
        <nav className="hidden items-center gap-1 sm:flex" aria-label="Primary">
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm",
                  active ? "bg-white/10 text-white" : "text-[#8b95a3] hover:text-white",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <span className="hidden text-xs text-[#8b95a3] md:inline">
            {data.stats.total} wallets · {data.stats.tape24h} trades / 24h
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs ring-1 ring-inset",
              live ? "bg-[#CCFF00]/10 text-[#CCFF00] ring-[#CCFF00]/25" : "bg-white/5 text-[#8b95a3] ring-white/10",
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", live ? "animate-pulse bg-[#CCFF00]" : "bg-[#8b95a3]")} />
            {live ? "Live" : "Connecting"}
          </span>
          <a
            href={X_URL}
            target="_blank"
            rel="noreferrer"
            aria-label={`${BRAND} on X`}
            title={X_HANDLE}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#8b95a3] hover:bg-white/5 hover:text-white"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.727-8.835L1.254 2.25H8.08l4.261 5.84L18.244 2.25Zm-1.161 17.52h1.833L7.084 3.94H5.117L17.083 19.77Z" />
            </svg>
          </a>
        </div>
      </div>
      <nav className="flex gap-1 border-t border-[#1c222b] px-4 py-2 sm:hidden" aria-label="Mobile">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-lg px-3 py-1 text-sm",
              pathname === link.href ? "bg-white/10 text-white" : "text-[#8b95a3]",
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
};
