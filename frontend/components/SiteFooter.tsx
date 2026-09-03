import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { BRAND, CHAIN_ID, CHAIN_LABEL } from "@/lib/brand";

export const SiteFooter = () => (
  <footer className="mt-auto border-t border-[#1c222b] bg-[#07080a]">
    <div className="mx-auto flex max-w-[1500px] flex-col gap-6 px-4 py-10 md:flex-row md:items-start md:justify-between md:px-6">
      <div className="max-w-md">
        <div className="flex items-center gap-2.5">
          <BrandMark />
          <p className="text-sm font-semibold">{BRAND}</p>
        </div>
        <p className="mt-2 text-sm leading-6 text-[#8b95a3]">
          A live wallet tracker for {CHAIN_LABEL} (chain {CHAIN_ID}). Wallets move from seen to
          trackable to good as a full address and recent tape land.
        </p>
      </div>
      <div className="flex gap-12 text-sm">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium uppercase tracking-wider text-[#5d6570]">Product</p>
          <Link href="/" className="text-[#c9d2dc] hover:text-white">
            Tracker
          </Link>
          <Link href="/how" className="text-[#c9d2dc] hover:text-white">
            How it works
          </Link>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium uppercase tracking-wider text-[#5d6570]">Note</p>
          <p className="max-w-[220px] text-[#8b95a3]">
            Public feed data. Not financial advice. Always verify addresses before you copy them.
          </p>
        </div>
      </div>
    </div>
  </footer>
);
