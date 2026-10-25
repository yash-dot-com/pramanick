"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import {
  ArrowRight,
  AudioLines,
  ChevronLeft,
  ChevronRight,
  FileText,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react"
import {
  LocalizedText,
  useTranslatedText,
} from "@/components/language-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { LOCALITIES, formatDate, localityName } from "@/lib/civic/model"
import type { PublicAgentDashboard as Dashboard } from "@/lib/voice/dashboard"
import { cn } from "@/lib/utils"
import { PublicNavigation } from "./public-navigation"
import { PublicCaseFile } from "./public-case-file"
import { StatusBadge } from "./status-badge"

const filters = [
  { id: "all", label: "All issues" },
  { id: "open", label: "In progress" },
  { id: "awaiting_verification", label: "Ready for a check" },
  { id: "disputed", label: "Still needs fixing" },
  { id: "verified", label: "Verified repairs" },
] as const
function timeAgo(value: string, now: string) {
  const hours = Math.max(0, (Date.parse(now) - Date.parse(value)) / 3_600_000)
  if (hours < 1) return "Just now"
  if (hours < 24) return `${Math.floor(hours)}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export function PublicAgentDashboard() {
  const [data, setData] = useState<Dashboard | null>(null)
  const [error, setError] = useState("")
  const [localityId, setLocalityId] = useState("all")
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("all")
  const [view, setView] = useState<"issues" | "conversations">("issues")
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState<{
    id: string
    tab: "timeline" | "conversations"
  } | null>(null)
  const searchLabel = useTranslatedText("Search an issue, place or officer")
  const refresh = useCallback(async (signal?: AbortSignal) => {
    const response = await fetch("/api/dashboard", {
      cache: "no-store",
      signal,
    })
    const next = await response.json()
    if (!response.ok) throw new Error(next.error || "Could not load follow-ups")
    if (!signal?.aborted) {
      setData(next)
      setError("")
    }
  }, [])
  useEffect(() => {
    const controller = new AbortController()
    const read = () => {
      if (!document.hidden)
        void refresh(controller.signal).catch((failure) => {
          if (!controller.signal.aborted)
            setError(
              failure instanceof Error
                ? failure.message
                : "Could not refresh follow-ups"
            )
        })
    }
    read()
    const timer = setInterval(read, 10000)
    return () => {
      controller.abort()
      clearInterval(timer)
    }
  }, [refresh])

  const areaIssues =
    data?.issues.filter(
      (issue) => localityId === "all" || issue.localityId === localityId
    ) ?? []
  const areaIds = new Set(areaIssues.map((issue) => issue.id))
  const conversationCount =
    data?.calls.filter((call) => areaIds.has(call.issueId)).length ?? 0
  const issues = areaIssues
    .filter(
      (issue) =>
        (status === "all" ||
          (status === "open"
            ? !["verified", "awaiting_verification"].includes(issue.status)
            : issue.status === status)) &&
        `${issue.title} ${issue.description} ${issue.landmark} ${issue.person ?? ""} ${localityName(issue.localityId)}`
          .toLowerCase()
          .includes(query.toLowerCase())
    )
    .sort(
      (a, b) =>
        Number(b.audioCount > 0) - Number(a.audioCount > 0) ||
        b.updatedAt.localeCompare(a.updatedAt) ||
        a.id.localeCompare(b.id)
    )
  const visibleIds = new Set(issues.map((issue) => issue.id))
  const conversations =
    data?.calls
      .filter((call) => visibleIds.has(call.issueId))
      .sort(
        (a, b) =>
          Number(!!b.recordingUrl) - Number(!!a.recordingUrl) ||
          b.createdAt.localeCompare(a.createdAt)
      ) ?? []
  const results = view === "issues" ? issues.length : conversations.length
  const lastPage = Math.max(0, Math.ceil(results / 8) - 1)
  const currentPage = Math.min(page, lastPage)
  const updates =
    data?.updates
      .filter((update) => visibleIds.has(update.issueId))
      .slice(0, 4) ?? []
  function chooseStatus(value: string) {
    setStatus(value)
    setPage(0)
  }
  const counts = [
    {
      label: "Issues being followed",
      value: areaIssues.filter((issue) => issue.status !== "verified").length,
      filter: "open",
    },
    {
      label: "Conversations recorded",
      value: conversationCount,
      filter: "conversations",
    },
    {
      label: "Ready for a resident check",
      value: areaIssues.filter(
        (issue) => issue.status === "awaiting_verification"
      ).length,
      filter: "awaiting_verification",
    },
    {
      label: "Repairs verified",
      value: areaIssues.filter((issue) => issue.status === "verified").length,
      filter: "verified",
    },
  ]
  return (
    <main className="min-h-dvh bg-background text-foreground">
      <PublicNavigation current="dashboard" />
      <div className="mx-auto max-w-7xl space-y-7 px-5 py-8 md:px-8">
        <header className="flex flex-wrap items-end justify-between gap-5">
          <div className="max-w-2xl space-y-3">
            <div className="flex items-center gap-2 text-[10px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
              <span className="size-1.5 rounded-full bg-primary" />
              <LocalizedText text="The public follow-up record" />
              {data?.issues.some((issue) => issue.isDemo) && (
                <Badge
                  variant="outline"
                  className="text-[9px] font-normal tracking-normal normal-case"
                >
                  Sample data
                </Badge>
              )}
            </div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              <LocalizedText text="A clear path from report to repair." />
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              <LocalizedText text="Find your issue, see the latest response, and check what happens next. Every conversation and promise stays with the case." />
            </p>
          </div>
          <Button nativeButton={false} render={<Link href="/app" />}>
            <Plus className="size-4" />
            <LocalizedText text="Report an issue" />
          </Button>
        </header>

        {error && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 text-sm"
          >
            <p>
              <LocalizedText
                text={
                  data
                    ? "Updates are temporarily unavailable. Your saved records are still shown."
                    : "We couldn’t load the public record. Please try again."
                }
              />
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                void refresh().catch(() =>
                  setError("Could not refresh follow-ups")
                )
              }
            >
              <RefreshCw className="size-3" />
              <LocalizedText text="Try again" />
            </Button>
          </div>
        )}
        {!data && !error ? (
          <div role="status" className="grid gap-3 sm:grid-cols-4">
            {counts.map((item) => (
              <div
                key={item.label}
                className="h-24 animate-pulse rounded-xl bg-muted"
              />
            ))}
            <p className="sr-only">Loading follow-ups</p>
          </div>
        ) : (
          data && (
            <>
              <section
                aria-label="Follow-up overview"
                className="grid grid-cols-2 overflow-hidden rounded-xl border lg:grid-cols-4"
              >
                {counts.map((item) => {
                  return (
                    <button
                      key={item.label}
                      onClick={() => {
                        if (item.filter === "conversations") {
                          setView("conversations")
                          chooseStatus("all")
                        } else {
                          setView("issues")
                          chooseStatus(item.filter)
                        }
                      }}
                      className="border-r border-b px-4 py-3 text-left transition-colors last:border-r-0 hover:bg-muted/40 lg:border-b-0"
                    >
                      <div className="flex items-center gap-3">
                        <p className="text-xl font-semibold tracking-tight tabular-nums">
                          {item.value}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          <LocalizedText text={item.label} />
                        </p>
                      </div>
                    </button>
                  )
                })}
              </section>

              <section className="space-y-5" aria-label="Find a case">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b">
                  <div
                    role="tablist"
                    aria-label="Public records"
                    className="flex gap-6"
                  >
                    {[
                      { id: "issues", label: "Issues" },
                      { id: "conversations", label: "Conversations" },
                    ].map((item) => (
                      <button
                        key={item.id}
                        id={`records-${item.id}`}
                        role="tab"
                        aria-selected={view === item.id}
                        aria-controls="public-records"
                        onClick={() => {
                          setView(item.id as typeof view)
                          setPage(0)
                        }}
                        className={cn(
                          "border-b-2 px-1 pb-3 text-sm",
                          view === item.id
                            ? "border-primary font-medium text-foreground"
                            : "border-transparent text-muted-foreground"
                        )}
                      >
                        <LocalizedText text={item.label} />
                      </button>
                    ))}
                  </div>
                  <p className="pb-3 text-[10px] text-muted-foreground">
                    <LocalizedText text="Updated" />{" "}
                    {formatDate(data.capturedAt)}
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="relative flex-1">
                    <Search className="absolute top-3 left-3 size-4 text-muted-foreground" />
                    <Input
                      aria-label="Search cases"
                      placeholder={searchLabel}
                      value={query}
                      onChange={(event) => {
                        setQuery(event.target.value)
                        setPage(0)
                      }}
                      className="h-10 bg-muted/20 pl-9"
                    />
                  </div>
                  <Select
                    value={localityId}
                    onValueChange={(value) => {
                      if (!value) return
                      setLocalityId(value)
                      setPage(0)
                    }}
                  >
                    <SelectTrigger
                      aria-label="Filter by area"
                      className="h-10 w-full sm:w-44"
                    >
                      <SelectValue>
                        <LocalizedText
                          text={
                            localityId === "all"
                              ? "All areas"
                              : localityName(localityId)
                          }
                        />
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent align="start" alignItemWithTrigger={false}>
                      <SelectItem value="all">
                        <LocalizedText text="All areas" />
                      </SelectItem>
                      {LOCALITIES.map((area) => (
                        <SelectItem key={area.id} value={area.id}>
                          <LocalizedText text={area.name} />
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div
                  className="flex flex-wrap gap-2"
                  aria-label="Filter by case progress"
                >
                  {filters.map((filter) => (
                    <button
                      key={filter.id}
                      aria-pressed={status === filter.id}
                      onClick={() => chooseStatus(filter.id)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-[11px] transition-colors",
                        status === filter.id
                          ? "border-primary bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted"
                      )}
                    >
                      <LocalizedText text={filter.label} />
                    </button>
                  ))}
                </div>

                <div className="grid items-start gap-7 xl:grid-cols-[minmax(0,1fr)_290px]">
                  <div
                    id="public-records"
                    role="tabpanel"
                    aria-labelledby={`records-${view}`}
                    className="min-w-0 space-y-4"
                  >
                    <p className="text-[11px] text-muted-foreground">
                      {results}{" "}
                      <LocalizedText
                        text={view === "issues" ? "issues" : "conversations"}
                      />
                    </p>
                    {view === "issues" ? (
                      <div className="grid items-start gap-3 md:grid-cols-2">
                        {issues
                          .slice(currentPage * 8, currentPage * 8 + 8)
                          .map((issue) => (
                            <article
                              key={issue.id}
                              className="flex flex-col overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-sm"
                            >
                              <div className="space-y-2.5 p-3.5">
                                <div className="flex flex-wrap items-center gap-2">
                                  <StatusBadge status={issue.status} />
                                </div>
                                <div>
                                  <h2 className="text-sm leading-snug font-medium">
                                    <button
                                      onClick={() =>
                                        setSelected({
                                          id: issue.id,
                                          tab: "timeline",
                                        })
                                      }
                                      className="line-clamp-2 text-left underline-offset-4 hover:underline"
                                    >
                                      <LocalizedText text={issue.title} />
                                    </button>
                                  </h2>
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    {localityName(issue.localityId)}
                                  </p>
                                </div>
                                <button
                                  onClick={() =>
                                    setSelected({
                                      id: issue.id,
                                      tab: "timeline",
                                    })
                                  }
                                  className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                                >
                                  <LocalizedText text="View case" />
                                  <ArrowRight className="size-3" />
                                </button>
                              </div>
                            </article>
                          ))}
                      </div>
                    ) : (
                      <div className="divide-y rounded-xl border">
                        {conversations
                          .slice(currentPage * 8, currentPage * 8 + 8)
                          .map((call) => (
                            <article key={call.id} className="space-y-2 p-3.5">
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <div>
                                  <h2 className="text-sm font-semibold">
                                    {call.person?.name ||
                                      "Conversation participant"}
                                  </h2>
                                  <p className="mt-1 text-[10px] text-muted-foreground">
                                    {formatDate(call.createdAt)}
                                  </p>
                                </div>
                                <Badge
                                  variant="outline"
                                  className="text-[10px]"
                                >
                                  {call.status === "completed"
                                    ? "Conversation saved"
                                    : call.status.replaceAll("-", " ")}
                                </Badge>
                              </div>
                              <p className="line-clamp-2 text-xs font-medium">
                                <LocalizedText text={call.issueTitle} />
                              </p>
                              <button
                                onClick={() =>
                                  setSelected({
                                    id: call.issueId,
                                    tab: "conversations",
                                  })
                                }
                                className="flex items-center gap-1.5 text-xs font-medium text-primary"
                              >
                                {call.recordingUrl ? (
                                  <AudioLines className="size-3.5" />
                                ) : (
                                  <FileText className="size-3.5" />
                                )}
                                <LocalizedText
                                  text={
                                    call.recordingUrl
                                      ? "Listen"
                                      : "Read conversation"
                                  }
                                />
                                <ArrowRight className="size-3" />
                              </button>
                            </article>
                          ))}
                      </div>
                    )}
                    {results === 0 && (
                      <div className="space-y-3 rounded-xl border border-dashed p-10 text-center">
                        <Search className="mx-auto size-6 text-muted-foreground" />
                        <h2 className="text-sm font-medium">
                          <LocalizedText
                            text={
                              data.issues.length
                                ? "No matching records"
                                : "Your community’s follow-up record starts here"
                            }
                          />
                        </h2>
                        <p className="text-xs text-muted-foreground">
                          <LocalizedText
                            text={
                              data.issues.length
                                ? "Try another area, search term or progress filter."
                                : "Report an issue on the map. Its updates and conversations will appear here."
                            }
                          />
                        </p>
                        {data.issues.length > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setQuery("")
                              setLocalityId("all")
                              chooseStatus("all")
                            }}
                          >
                            <LocalizedText text="Clear filters" />
                          </Button>
                        )}
                      </div>
                    )}
                    {results > 8 && (
                      <nav
                        aria-label="Record pages"
                        className="flex items-center justify-between gap-3 pt-2"
                      >
                        <p className="text-[11px] text-muted-foreground">
                          {currentPage * 8 + 1}–
                          {Math.min((currentPage + 1) * 8, results)} of{" "}
                          {results}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage === 0}
                            onClick={() => setPage(currentPage - 1)}
                            aria-label="Previous page"
                          >
                            <ChevronLeft className="size-3" />
                            <LocalizedText text="Previous" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage === lastPage}
                            onClick={() => setPage(currentPage + 1)}
                            aria-label="Next page"
                          >
                            <LocalizedText text="Next" />
                            <ChevronRight className="size-3" />
                          </Button>
                        </div>
                      </nav>
                    )}
                  </div>
                  <aside className="space-y-3 rounded-xl border bg-muted/10 p-3.5">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-semibold">
                        <LocalizedText text="Latest updates" />
                      </h2>
                      <span className="size-1.5 rounded-full bg-primary" />
                    </div>
                    {updates.length ? (
                      <ol className="space-y-3">
                        {updates.map((update) => (
                          <li
                            key={update.id}
                            className="relative border-l pl-4"
                          >
                            <span className="absolute top-1.5 -left-[3px] size-1.5 rounded-full bg-muted-foreground/50" />
                            <p className="mb-1 text-[10px] text-muted-foreground">
                              {timeAgo(update.createdAt, data.capturedAt)} ·{" "}
                              {localityName(update.localityId)}
                            </p>
                            <button
                              onClick={() =>
                                setSelected({
                                  id: update.issueId,
                                  tab: "timeline",
                                })
                              }
                              className="line-clamp-1 text-left text-xs font-medium hover:underline"
                            >
                              <LocalizedText text={update.title} />
                            </button>
                            <p className="mt-1 line-clamp-1 text-[11px] text-muted-foreground">
                              <LocalizedText text={update.issueTitle} />
                            </p>
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        <LocalizedText text="New case updates will appear here. Try all areas to see more." />
                      </p>
                    )}
                  </aside>
                </div>
              </section>
            </>
          )
        )}
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t pt-5 text-[10px] text-muted-foreground">
          <p>
            Pramanik · <LocalizedText text="Every response stays on record." />
          </p>
          <Link href="/operations" className="hover:underline">
            <LocalizedText text="Accountability office" />
            <span aria-hidden> ↗</span>
          </Link>
        </footer>
      </div>
      {selected && (
        <PublicCaseFile
          key={`${selected.id}:${selected.tab}`}
          issueId={selected.id}
          initialTab={selected.tab}
          onClose={() => setSelected(null)}
        />
      )}
    </main>
  )
}
