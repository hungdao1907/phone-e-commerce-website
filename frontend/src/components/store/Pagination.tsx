import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

/** 1 2 3 … 10 style page list */
function buildPages(page: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | '…')[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(total - 1, page + 1);
  if (start > 2) pages.push('…');
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push('…');
  pages.push(total);
  return pages;
}

const navBtn =
  'inline-flex items-center justify-center w-10 h-10 rounded-full border border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400 hover:bg-neutral-50 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2';

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav className="flex items-center justify-center gap-2 pb-12" aria-label="Phân trang">
      {/* Keeps layout stable when Previous is hidden */}
      {page > 1 ? (
        <button type="button" className={navBtn} aria-label="Trang trước" onClick={() => onPageChange(page - 1)}>
          <ChevronLeft className="w-4 h-4" />
        </button>
      ) : (
        <span className="w-10 h-10" aria-hidden="true" />
      )}

      {buildPages(page, totalPages).map((p, i) =>
        p === '…' ? (
          <span key={`e${i}`} className="w-8 text-center text-neutral-400" aria-hidden="true">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            aria-label={`Trang ${p}`}
            aria-current={p === page ? 'page' : undefined}
            onClick={() => onPageChange(p)}
            className={`w-10 h-10 rounded-full text-sm font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 ${
              p === page
                ? 'bg-neutral-900 text-white'
                : 'bg-white text-neutral-700 border border-neutral-200 hover:border-neutral-400'
            }`}
          >
            {p}
          </button>
        )
      )}

      {page < totalPages ? (
        <button type="button" className={navBtn} aria-label="Trang tiếp theo" onClick={() => onPageChange(page + 1)}>
          <ChevronRight className="w-4 h-4" />
        </button>
      ) : (
        <span className="w-10 h-10" aria-hidden="true" />
      )}
    </nav>
  );
}
