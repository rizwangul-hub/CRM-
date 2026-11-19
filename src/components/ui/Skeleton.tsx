export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading dashboard">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div
            key={idx}
            className="h-28 rounded-xl border border-slate-200 bg-white p-5"
          >
            <div className="h-3 w-24 rounded bg-slate-200" />
            <div className="mt-4 h-7 w-36 rounded bg-slate-200" />
            <div className="mt-3 h-3 w-28 rounded bg-slate-100" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="h-80 rounded-xl border border-slate-200 bg-white p-6" />
        <div className="h-80 rounded-xl border border-slate-200 bg-white p-6" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white animate-pulse">
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={idx} className="flex items-center justify-between gap-4 px-5 py-4">
          <div className="space-y-2">
            <div className="h-3.5 w-40 rounded bg-slate-200" />
            <div className="h-3 w-56 rounded bg-slate-100" />
          </div>
          <div className="h-4 w-24 rounded bg-slate-200" />
        </div>
      ))}
    </div>
  );
}
