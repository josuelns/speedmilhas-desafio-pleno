export function QuoteSkeleton() {
  return (
    <div className="grid gap-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-xl border border-slate-200 bg-white p-4"
        >
          <div className="h-7 w-32 rounded bg-slate-200" />
          <div className="mt-3 h-4 w-48 rounded bg-slate-100" />
          <div className="mt-2 h-4 w-24 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}
