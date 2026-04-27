"use client";

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-slate-800 rounded-lg ${className}`} />
  );
}

export function AgentCardSkeleton() {
  return (
    <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-3/4" />
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/50 space-y-3">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

export function MessageSkeleton() {
  return (
    <div className="flex gap-3">
      <Skeleton className="w-8 h-8 rounded-full shrink-0" />
      <div className="space-y-2 flex-1 max-w-lg">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}

export function TableRowSkeleton({ cols = 4 }: { cols?: number }) {
  return (
    <div className="flex gap-4 py-3 border-b border-slate-800">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className="h-4 flex-1" />
      ))}
    </div>
  );
}
