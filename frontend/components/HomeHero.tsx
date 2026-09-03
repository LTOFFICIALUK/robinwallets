import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { BRAND, CHAIN_LABEL, TAGLINE } from "@/lib/brand";

export const HomeHero = () => (
  <section className="border-b border-[#1c222b]">
    <div className="mx-auto max-w-[1500px] px-4 py-10 md:px-6 md:py-14">
      <div className="flex items-center gap-3">
        <BrandMark className="h-12 w-12" />
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#CCFF00]">{CHAIN_LABEL}</p>
      </div>
      <h1 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-white md:text-4xl">{TAGLINE}</h1>
      <p className="mt-4 max-w-xl text-[15px] leading-7 text-[#8b95a3]">
        {BRAND} watches high-frequency traders on-chain, fills in truncated addresses when they
        resolve, and promotes wallets when they become worth following.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <a
          href="#board"
          className="rounded-xl bg-[#CCFF00] px-4 py-2.5 text-sm font-semibold text-[#111] hover:bg-[#d8ff4d]"
        >
          Open the live board
        </a>
        <Link
          href="/how"
          className="rounded-xl px-4 py-2.5 text-sm text-[#c9d2dc] ring-1 ring-[#232830] hover:bg-white/5"
        >
          How scoring works
        </Link>
      </div>
    </div>
  </section>
);
