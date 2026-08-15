export default function Loading() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      {/* Top Bar Skeleton */}
      <div className="h-8 bg-slate-800/60 rounded-lg w-1/4"></div>

      {/* Hero Metric Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="h-28 bg-slate-800/40 rounded-xl border border-slate-800/60"></div>
        <div className="h-28 bg-slate-800/40 rounded-xl border border-slate-800/60"></div>
        <div className="h-28 bg-slate-800/40 rounded-xl border border-slate-800/60"></div>
      </div>

      {/* Main Table / Graph Area Skeleton */}
      <div className="h-64 bg-slate-800/40 rounded-xl border border-slate-800/60"></div>
    </div>
  )
}