import { axiomTokenUrl, gmgnTokenUrl, isTokenAddress } from "@/lib/terminals";

type TokenLinksProps = {
  address?: string | null;
};

const IconLink = ({
  href,
  label,
  src,
  className,
}: {
  href: string;
  label: string;
  src: string;
  className: string;
}) => (
  <a
    href={href}
    target="_blank"
    rel="noreferrer"
    aria-label={label}
    title={label}
    tabIndex={0}
    className="inline-flex h-4 w-4 shrink-0 items-center justify-center overflow-hidden rounded-[3px] hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#CCFF00]"
    onClick={(event) => event.stopPropagation()}
    onKeyDown={(event) => {
      if (event.key === "Enter" || event.key === " ") event.stopPropagation();
    }}
  >
    <img src={src} alt="" width={16} height={16} className={className} />
  </a>
);

export const TokenLinks = ({ address }: TokenLinksProps) => {
  if (!isTokenAddress(address) || !address) return null;

  return (
    <span className="inline-flex shrink-0 items-center gap-1">
      <IconLink
        href={gmgnTokenUrl(address)}
        label="Open token on GMGN"
        src="/brand/gmgn.png"
        className="h-4 w-4 [image-rendering:pixelated]"
      />
      <IconLink
        href={axiomTokenUrl(address)}
        label="Open token on Axiom"
        src="/brand/axiom.svg"
        className="h-4 w-4"
      />
    </span>
  );
};
