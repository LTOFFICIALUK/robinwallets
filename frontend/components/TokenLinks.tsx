import type { ReactNode } from "react";
import { axiomTokenUrl, gmgnTokenUrl, isTokenAddress } from "@/lib/terminals";

type TokenLinksProps = {
  address?: string | null;
};

const IconLink = ({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: ReactNode;
}) => (
  <a
    href={href}
    target="_blank"
    rel="noreferrer"
    aria-label={label}
    title={label}
    tabIndex={0}
    className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] text-[9px] font-bold leading-none hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#CCFF00]"
    onClick={(event) => event.stopPropagation()}
    onKeyDown={(event) => {
      if (event.key === "Enter" || event.key === " ") event.stopPropagation();
    }}
  >
    {children}
  </a>
);

export const TokenLinks = ({ address }: TokenLinksProps) => {
  if (!isTokenAddress(address) || !address) return null;

  return (
    <span className="inline-flex shrink-0 items-center gap-1">
      <IconLink href={gmgnTokenUrl(address)} label="Open token on GMGN">
        <span className="flex h-4 w-4 items-center justify-center rounded-[3px] bg-[#1a2a1a] text-[#7CFF6B] ring-1 ring-[#7CFF6B]/40">
          G
        </span>
      </IconLink>
      <IconLink href={axiomTokenUrl(address)} label="Open token on Axiom">
        <span className="flex h-4 w-4 items-center justify-center rounded-[3px] bg-[#0d2a24] text-[#2fe3ac] ring-1 ring-[#2fe3ac]/40">
          A
        </span>
      </IconLink>
    </span>
  );
};
