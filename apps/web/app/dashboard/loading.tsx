export default function DashboardLoading() {
  return (
    <div className="space-y-5">
      {/* Header skeleton */}
      <div className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-white px-5 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 animate-pulse rounded-xl bg-slate-200" />
          <div className="space-y-1.5">
            <div className="h-4 w-32 animate-pulse rounded-full bg-slate-200" />
            <div className="h-3 w-48 animate-pulse rounded-full bg-slate-100" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-8 w-36 animate-pulse rounded-xl bg-slate-200" />
          <div className="h-8 w-16 animate-pulse rounded-xl bg-slate-100" />
        </div>
      </div>

      {/* KPI cards skeleton */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 animate-pulse rounded-full bg-slate-200" />
              <div className="h-8 w-8 animate-pulse rounded-lg bg-slate-100" />
            </div>
            <div className="h-8 w-28 animate-pulse rounded-full bg-slate-200" />
            <div className="h-5 w-24 animate-pulse rounded-full bg-slate-100" />
          </div>
        ))}
      </div>

      {/* Chart + table skeleton */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="h-4 w-32 animate-pulse rounded-full bg-slate-200" />
            <div className="h-5 w-16 animate-pulse rounded-full bg-slate-100" />
          </div>
          <div className="h-52 animate-pulse rounded-xl bg-slate-100" />
        </div>
        <div className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm space-y-3">
          <div className="h-4 w-24 animate-pulse rounded-full bg-slate-200" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-6 w-6 animate-pulse rounded-lg bg-slate-100" />
              <div className="flex-1 space-y-1">
                <div className="h-3 w-full animate-pulse rounded-full bg-slate-100" />
                <div className="h-2.5 w-2/3 animate-pulse rounded-full bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
