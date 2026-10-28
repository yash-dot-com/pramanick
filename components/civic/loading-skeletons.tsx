import type { ReactNode } from "react"
import { LocalizedText } from "@/components/language-provider"
import { Skeleton } from "@/components/ui/skeleton"

function LoadingRegion({
  label,
  className,
  children,
}: {
  label: string
  className?: string
  children: ReactNode
}) {
  return (
    <div role="status" aria-busy="true" className={className}>
      <span className="sr-only">
        <LocalizedText text={label} />
      </span>
      <div aria-hidden="true">{children}</div>
    </div>
  )
}

export function RecordListSkeleton() {
  return (
    <LoadingRegion label="Loading local records" className="p-1">
      <div className="divide-y">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="space-y-3 px-3 py-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-3 w-3/5" />
            <div className="flex justify-between">
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-4 w-10" />
            </div>
          </div>
        ))}
      </div>
    </LoadingRegion>
  )
}

export function DossierSkeleton() {
  return (
    <LoadingRegion label="Loading issue details" className="p-5">
      <div className="space-y-6">
        <div className="space-y-4">
          <Skeleton className="h-5 w-24 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-2/3" />
          </div>
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-5 w-28 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
          </div>
          <div className="flex justify-between border-y py-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <div className="space-y-4 rounded-xl border p-4">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-9 w-full rounded-full" />
        </div>
        <div className="flex gap-2">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-8 flex-1 rounded-full" />
          ))}
        </div>
        <div className="space-y-5 border-l pl-4">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-3 w-3/5" />
            </div>
          ))}
        </div>
      </div>
    </LoadingRegion>
  )
}

export function DashboardSkeleton({
  operations = false,
}: {
  operations?: boolean
}) {
  return (
    <LoadingRegion
      label={
        operations ? "Loading accountability office" : "Loading follow-ups"
      }
    >
      <div className="space-y-6">
        <div
          className={`grid grid-cols-2 gap-3 ${operations ? "lg:grid-cols-5" : "lg:grid-cols-4"}`}
        >
          {Array.from({ length: operations ? 5 : 4 }, (_, index) => (
            <div key={index} className="space-y-3 rounded-xl border p-4">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-7 w-12" />
            </div>
          ))}
        </div>
        <div className="flex gap-3 border-b pb-4">
          <Skeleton className="h-8 w-24 rounded-full" />
          <Skeleton className="h-8 w-32 rounded-full" />
        </div>
        {operations ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <div
                key={index}
                className="space-y-4 rounded-xl border bg-muted/20 p-3"
              >
                <Skeleton className="h-4 w-28" />
                {Array.from({ length: 2 }, (_, row) => (
                  <div
                    key={row}
                    className="space-y-3 rounded-xl border bg-card p-4"
                  >
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full rounded-full" />
            {Array.from({ length: 4 }, (_, index) => (
              <div
                key={index}
                className="flex items-center justify-between gap-4 rounded-xl border p-4"
              >
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>
            ))}
          </div>
        )}
      </div>
    </LoadingRegion>
  )
}

export function LeaderboardSkeleton() {
  return (
    <LoadingRegion label="Loading public records">
      <div className="divide-y">
        {Array.from({ length: 6 }, (_, index) => (
          <div
            key={index}
            className="grid grid-cols-[40px_2fr_repeat(4,1fr)] items-center gap-4 p-4"
          >
            <Skeleton className="h-4 w-5" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-3 w-3/5" />
            </div>
            {Array.from({ length: 4 }, (_, column) => (
              <Skeleton key={column} className="h-4 w-12" />
            ))}
          </div>
        ))}
      </div>
    </LoadingRegion>
  )
}
