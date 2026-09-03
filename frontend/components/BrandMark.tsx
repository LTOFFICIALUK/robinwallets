import { cn } from "@/lib/cn";

export const BrandMark = ({ className }: { className?: string }) => (
  <img
    src="/brand/plume-icon.svg"
    alt=""
    width={36}
    height={36}
    className={cn("h-9 w-9 rounded-xl object-cover ring-1 ring-black/40", className)}
  />
);
