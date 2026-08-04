export function QuoteSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
        <div className="mt-2 h-3 w-56 animate-pulse rounded bg-slate-100" />
      </div>
      <div className="grid gap-3 p-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="animate-pulse rounded-xl border border-slate-100 bg-slate-50/80 p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="h-8 w-28 rounded bg-slate-200" />
                <div className="h-4 w-36 rounded bg-slate-100" />
              </div>
              <div className="h-6 w-24 rounded-full bg-slate-200" />
            </div>
            <div className="mt-4 h-9 w-28 rounded-lg bg-slate-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
