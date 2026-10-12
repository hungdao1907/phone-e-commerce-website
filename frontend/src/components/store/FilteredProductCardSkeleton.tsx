/**
 * Skeleton mirroring the exact layout of FilteredProductCard
 * (badge row, 4:3 image, title, rating, spec chips, swatches, price + 2 round buttons).
 */
const bar = 'bg-neutral-200 rounded animate-pulse';

export function FilteredProductCardSkeleton() {
  return (
    <div
      className="relative flex flex-col h-full bg-white rounded-3xl border border-neutral-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden"
      aria-hidden="true"
    >
      {/* Badge & brand */}
      <div className="p-4 pb-2 flex items-start justify-between gap-2">
        <div className={`${bar} h-6 w-12 rounded-full`} />
        <div className={`${bar} h-3 w-14`} />
      </div>

      {/* Image */}
      <div className="w-full aspect-[4/3] px-4 py-2 flex items-center justify-center">
        <div className={`${bar} w-full h-full max-h-44 rounded-2xl`} />
      </div>

      {/* Body */}
      <div className="flex flex-col flex-grow p-4 pt-2">
        {/* Title + rating */}
        <div className="mb-3">
          <div className={`${bar} h-5 w-4/5`} />
          <div className={`${bar} h-3 w-1/2 mt-3`} />
        </div>

        {/* Spec chips */}
        <div className="flex flex-wrap gap-1.5 py-4 border-y border-neutral-100 mb-4 flex-grow content-start">
          <div className={`${bar} h-6 w-16 rounded-md`} />
          <div className={`${bar} h-6 w-20 rounded-md`} />
          <div className={`${bar} h-6 w-14 rounded-md`} />
          <div className={`${bar} h-6 w-24 rounded-md`} />
        </div>

        {/* Color swatches */}
        <div className="flex items-center justify-between gap-2 mb-6">
          <div className="flex items-center gap-1.5">
            <div className={`${bar} w-5 h-5 rounded-full`} />
            <div className={`${bar} w-5 h-5 rounded-full`} />
            <div className={`${bar} w-5 h-5 rounded-full`} />
          </div>
          <div className={`${bar} h-3 w-14`} />
        </div>

        {/* Price + buttons */}
        <div className="mt-auto pt-2 flex items-center justify-between gap-3">
          <div className="flex flex-col gap-1.5">
            <div className={`${bar} h-3 w-10`} />
            <div className={`${bar} h-5 w-24`} />
          </div>
          <div className="flex items-center gap-2">
            <div className={`${bar} w-8 h-8 rounded-full`} />
            <div className={`${bar} w-8 h-8 rounded-full`} />
          </div>
        </div>
      </div>
    </div>
  );
}
