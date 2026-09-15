"use client";

type PagerProps = {
  page: number;
  pageCount: number;
  total: number;
  label: string;
  onPage: (page: number) => void;
};

export const Pager = ({ page, pageCount, total, label, onPage }: PagerProps) => {
  const handlePrev = () => onPage(Math.max(1, page - 1));
  const handleNext = () => onPage(Math.min(pageCount, page + 1));

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#1c222b] px-3 py-2">
      <p className="text-[11px] text-[#8b95a3]">
        {total} {label}
        {pageCount > 1 ? ` · ${page} / ${pageCount}` : ""}
      </p>
      {pageCount > 1 ? (
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="rounded-lg px-2 py-1 text-xs text-[#c9d2dc] ring-1 ring-[#232830] hover:bg-white/5 disabled:opacity-40"
            onClick={handlePrev}
            disabled={page <= 1}
            aria-label={`Previous ${label}`}
          >
            Prev
          </button>
          <button
            type="button"
            className="rounded-lg px-2 py-1 text-xs text-[#c9d2dc] ring-1 ring-[#232830] hover:bg-white/5 disabled:opacity-40"
            onClick={handleNext}
            disabled={page >= pageCount}
            aria-label={`Next ${label}`}
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
};
