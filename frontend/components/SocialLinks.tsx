"use client";

type SocialLinksProps = {
  name: string;
  twitter?: string | null;
  fomoUrl?: string | null;
};

export const SocialLinks = ({ name, twitter, fomoUrl }: SocialLinksProps) => {
  if (!twitter && !fomoUrl) return null;

  return (
    <span className="inline-flex items-center gap-1">
      {twitter ? (
        <a
          href={twitter}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-6 w-6 items-center justify-center rounded-md text-[#8b95a3] hover:bg-white/5 hover:text-white"
          aria-label={`Open ${name} on X`}
          title="X"
          onClick={(event) => event.stopPropagation()}
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.727-8.835L1.254 2.25H8.08l4.261 5.84L18.244 2.25Zm-1.161 17.52h1.833L7.084 3.94H5.117L17.083 19.77Z" />
          </svg>
        </a>
      ) : null}
      {fomoUrl ? (
        <a
          href={fomoUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-6 items-center rounded-md px-1.5 text-[10px] font-medium uppercase tracking-wide text-[#8b95a3] ring-1 ring-[#232830] hover:bg-white/5 hover:text-white"
          aria-label={`Open ${name} on FOMO`}
          title="FOMO"
          onClick={(event) => event.stopPropagation()}
        >
          FOMO
        </a>
      ) : null}
    </span>
  );
};
