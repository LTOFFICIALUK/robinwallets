import { cn } from "@/lib/cn";
import type { WalletStatus } from "@/lib/types";

const STYLES: Record<WalletStatus, string> = {
  good: "bg-[#CCFF00]/15 text-[#CCFF00] ring-[#CCFF00]/25",
  trackable: "bg-[#ffb020]/15 text-[#ffc85a] ring-[#ffb020]/25",
  candidate: "bg-[#6ea8ff]/12 text-[#9cc4ff] ring-[#6ea8ff]/20",
  seen: "bg-white/5 text-[#8b95a3] ring-white/10",
  stale: "bg-[#ff5a6a]/12 text-[#ff8a96] ring-[#ff5a6a]/20",
};

export const StatusBadge = ({ status }: { status: WalletStatus }) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ring-1 ring-inset",
      STYLES[status],
    )}
  >
    {status}
  </span>
);
