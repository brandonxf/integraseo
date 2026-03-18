"use client"

import { cn } from "@/lib/utils"

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn(
      "rounded-xl bg-muted animate-pulse",
      className
    )} />
  )
}

export function ContractSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-card border border-border">
      <Skeleton className="w-11 h-11 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-5 w-14 rounded-full" />
    </div>
  )
}

export function ContractListSkeleton() {
  return (
    <div className="px-4 pt-4 space-y-2.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <ContractSkeleton key={i} />
      ))}
    </div>
  )
}

export function StatsSkeleton() {
  return (
    <div className="px-4 pt-4 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-40 rounded-2xl" />
      <Skeleton className="h-52 rounded-2xl" />
    </div>
  )
}
