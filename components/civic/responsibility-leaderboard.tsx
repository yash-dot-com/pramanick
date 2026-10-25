"use client"

import {
  LocalizedText,
  useTranslatedText,
} from "@/components/language-provider"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { ArrowUpRight, Search, Trophy } from "lucide-react"
import { PublicNavigation } from "./public-navigation"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatDate } from "@/lib/civic/model"
import type {
  responsibilityProfiles,
  ResponsibilityProfile,
} from "@/lib/civic/profiles"

const metrics = {
  verifiedFixRate: "Verified fix rate",
  answerRate: "Phone answer rate",
  promiseKeptRate: "Promises verified by deadline",
  medianResolutionHours: "Median resolution time",
} as const
type Metric = keyof typeof metrics
function percent(value: number | null) {
  return value === null ? "—" : `${value}%`
}
function hours(value: number | null) {
  return value === null
    ? "—"
    : value >= 24
      ? `${(value / 24).toFixed(1)} days`
      : `${value.toFixed(1)} hours`
}

export function ResponsibilityLeaderboard() {
  const searchPlaceholder = useTranslatedText(
    "Search a person, role, or office"
  )
  const [data, setData] = useState<ReturnType<
    typeof responsibilityProfiles
  > | null>(null)
  const [error, setError] = useState("")
  const [query, setQuery] = useState("")
  const [kind, setKind] = useState("person")
  const [recordSet, setRecordSet] = useState("auto")
  const [metric, setMetric] = useState<Metric>("verifiedFixRate")
  const [selectedId, setSelectedId] = useState<string | null>(() =>
    typeof window === "undefined"
      ? null
      : new URLSearchParams(window.location.search).get("profile")
  )
  const refresh = useCallback(async () => {
    const response = await fetch("/api/profiles", { cache: "no-store" })
    const result = await response.json()
    if (!response.ok) throw new Error(result.error)
    setData(result)
    setError("")
  }, [])
  useEffect(() => {
    const read = () => {
      if (document.visibilityState !== "hidden")
        void refresh().catch((error) => setError(error.message))
    }
    read()
    const timer = setInterval(read, 10000)
    return () => clearInterval(timer)
  }, [refresh])
  const shownRecordSet =
    recordSet === "auto"
      ? data?.profiles.some((profile) => profile.dataMode === "scripted_demo")
        ? "scripted_demo"
        : "provider_records"
      : recordSet
  const profiles = useMemo(
    () =>
      (data?.profiles ?? [])
        .filter(
          (profile) =>
            profile.dataMode === shownRecordSet &&
            profile.kind === kind &&
            `${profile.name} ${profile.role} ${profile.officeName}`
              .toLowerCase()
              .includes(query.toLowerCase())
        )
        .sort((a, b) => {
          const av = a[metric]
          const bv = b[metric]
          if (av === null) return bv === null ? a.name.localeCompare(b.name) : 1
          if (bv === null) return -1
          return metric === "medianResolutionHours" ? av - bv : bv - av
        }),
    [data, kind, metric, query, shownRecordSet]
  )
  const selected = data?.profiles.find((profile) => profile.id === selectedId)
  const open = (profile: ResponsibilityProfile) => {
    setSelectedId(profile.id)
    window.history.replaceState(
      null,
      "",
      `/leaderboard?profile=${encodeURIComponent(profile.id)}`
    )
  }
  return (
    <main className="min-h-dvh bg-background text-foreground">
      <PublicNavigation current="leaderboard" />
      <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
        <div className="space-y-2">
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <Trophy className="size-5" />
            <LocalizedText text="The public service record" />
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            <LocalizedText text="Compare documented responses, promises, and resident-verified outcomes. Every measure links to its supporting cases." />
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Select
            value={shownRecordSet}
            onValueChange={(value) => {
              if (value) setRecordSet(value)
            }}
          >
            <SelectTrigger
              className="w-44 max-w-full"
              aria-label="Record source"
            >
              <SelectValue>
                <LocalizedText
                  text={
                    shownRecordSet === "scripted_demo"
                      ? "Sample records"
                      : "Public records"
                  }
                />
              </SelectValue>
            </SelectTrigger>
            <SelectContent align="start" alignItemWithTrigger={false}>
              {data?.profiles.some(
                (profile) => profile.dataMode === "scripted_demo"
              ) && (
                <SelectItem value="scripted_demo">
                  <LocalizedText text="Sample records" />
                </SelectItem>
              )}
              <SelectItem value="provider_records">
                <LocalizedText text="Public records" />
              </SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={kind}
            onValueChange={(value) => {
              if (value) setKind(value)
            }}
          >
            <SelectTrigger
              className="w-44 max-w-full"
              aria-label="Profile type"
            >
              <SelectValue>
                <LocalizedText
                  text={kind === "person" ? "People" : "Offices"}
                />
              </SelectValue>
            </SelectTrigger>
            <SelectContent align="start" alignItemWithTrigger={false}>
              <SelectItem value="person">
                <LocalizedText text="People" />
              </SelectItem>
              <SelectItem value="office">
                <LocalizedText text="Offices" />
              </SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={metric}
            onValueChange={(value) => {
              if (value) setMetric(value as Metric)
            }}
          >
            <SelectTrigger
              className="w-64 max-w-full"
              aria-label="Sort by service measure"
            >
              <SelectValue>
                <LocalizedText text={metrics[metric]} />
              </SelectValue>
            </SelectTrigger>
            <SelectContent align="start" alignItemWithTrigger={false}>
              {Object.entries(metrics).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  <LocalizedText text={label} />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative min-w-52 flex-1">
            <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="pl-9"
              placeholder={searchPlaceholder}
              aria-label="Search responsibility profiles"
            />
          </div>
        </div>
        {shownRecordSet === "scripted_demo" && (
          <p className="text-xs text-muted-foreground">
            Sample records. Open a person to see the cases, conversations and
            resident checks behind each number.
          </p>
        )}
        {error && (
          <p role="alert" className="text-sm text-destructive">
            <LocalizedText text={error} />
          </p>
        )}
        {!data && !error && (
          <p className="text-sm text-muted-foreground">
            <LocalizedText text="Loading public records…" />
          </p>
        )}
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="p-4">
                  <LocalizedText text="Rank" />
                </th>
                <th className="p-4">
                  <LocalizedText text="Person / office" />
                </th>
                <th className="p-4">{metrics[metric]}</th>
                <th className="p-4">
                  <LocalizedText text="Cases / verified" />
                </th>
                <th className="p-4">
                  <LocalizedText text="Answered / finalized" />
                </th>
                <th className="p-4">
                  <LocalizedText text="Due / kept" />
                </th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((profile) => (
                <tr key={profile.id} className="border-t">
                  <td className="p-4 text-muted-foreground">
                    {profile[metric] === null
                      ? "—"
                      : profiles.findIndex(
                          (item) => item[metric] === profile[metric]
                        ) + 1}
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => open(profile)}
                      className="text-left font-medium hover:underline"
                    >
                      <LocalizedText text={profile.name} />
                    </button>
                    <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                      <LocalizedText text={profile.role} />
                    </p>
                  </td>
                  <td className="p-4 font-medium tabular-nums">
                    <LocalizedText
                      text={
                        metric === "medianResolutionHours"
                          ? hours(profile[metric])
                          : percent(profile[metric])
                      }
                    />
                    {profile[metric] === null && (
                      <p className="mt-1 text-xs font-normal text-muted-foreground">
                        <LocalizedText text="Insufficient data" />
                      </p>
                    )}
                  </td>
                  <td className="p-4 tabular-nums">
                    {profile.assignedCases} / {profile.verifiedFixes}
                  </td>
                  <td className="p-4 tabular-nums">
                    {profile.answeredCalls} / {profile.finalizedAttempts}
                  </td>
                  <td className="p-4 tabular-nums">
                    {profile.promisesDue} / {profile.promisesVerifiedByDeadline}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data && !profiles.length && (
            <p className="p-6 text-sm text-muted-foreground">
              <LocalizedText text="No matching profiles." />
            </p>
          )}
        </div>
        <div className="space-y-2 text-xs leading-relaxed text-muted-foreground">
          <p>
            <LocalizedText text="Compare similar roles and workloads. A small sample is shown as a small sample; missing data stays unknown. Office outcomes do not establish individual causation." />
          </p>
          <p>
            <LocalizedText text="Busy or unanswered calls do not establish that a person blocked calls. Browser conversations are excluded from phone metrics." />
          </p>
          <details>
            <summary className="cursor-pointer font-medium">
              <LocalizedText text="How the measures are calculated" />
            </summary>
            <div className="mt-3 space-y-2">
              {data &&
                Object.entries(data.definitions).map(([key, definition]) => (
                  <p key={key}>{definition}</p>
                ))}
            </div>
          </details>
        </div>
      </div>
      {selected && (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open) {
              setSelectedId(null)
              window.history.replaceState(null, "", "/leaderboard")
            }
          }}
        >
          <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>
                <LocalizedText text={selected.name} />
              </DialogTitle>
              <DialogDescription>
                <LocalizedText text={selected.role} /> ·{" "}
                <LocalizedText text={selected.officeName} />
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-5">
              <p className="text-xs text-muted-foreground">
                <LocalizedText text={selected.attribution} />
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[
                  {
                    label: "Phone answer rate",
                    value: percent(selected.answerRate),
                  },
                  {
                    label: "Verified fix rate",
                    value: percent(selected.verifiedFixRate),
                  },
                  {
                    label: "Promises verified by deadline",
                    value: percent(selected.promiseKeptRate),
                  },
                  {
                    label: "First documented response",
                    value: hours(selected.medianFirstResponseHours),
                  },
                  {
                    label: "Median time to verification",
                    value: hours(selected.medianResolutionHours),
                  },
                  {
                    label: "Calls before verified fix",
                    value:
                      selected.medianCallsToFix === null
                        ? "—"
                        : selected.medianCallsToFix.toFixed(1),
                  },
                ].map((item) => (
                  <Card key={item.label} className="gap-3 py-4">
                    <CardContent className="space-y-2 px-4">
                      <p className="text-xs text-muted-foreground">
                        <LocalizedText text={item.label} />
                      </p>
                      <p className="text-lg font-semibold tabular-nums">
                        <LocalizedText text={item.value} />
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">
                  <LocalizedText text={selected.unresolvedCases} />
                  <LocalizedText text="unresolved" />
                </Badge>
                <Badge variant="outline">
                  <LocalizedText text={selected.overduePromises} />
                  <LocalizedText text="promises overdue at deadline" />
                </Badge>
                <Badge variant="outline">
                  <LocalizedText text={selected.disputedCases} />
                  <LocalizedText text="disputed" />
                </Badge>
                <Badge variant="outline">
                  <LocalizedText text={selected.reopenedCases} />
                  <LocalizedText text="reopened" />
                </Badge>
                <Badge variant="outline">
                  <LocalizedText text={selected.busyCalls} />
                  <LocalizedText text="busy" />
                </Badge>
                <Badge variant="outline">
                  <LocalizedText text={selected.unansweredCalls} />
                  <LocalizedText text="unanswered" />
                </Badge>
              </div>
              <section className="space-y-3">
                <h3 className="text-sm font-medium">
                  <LocalizedText text="Cases behind the record" />
                </h3>
                {!selected.cases.length && (
                  <p className="text-sm text-muted-foreground">
                    <LocalizedText text="No attributed cases yet. Performance rates remain unknown." />
                  </p>
                )}
                {selected.cases.map((issue) => (
                  <Link
                    key={issue.id}
                    href={`/app?issue=${encodeURIComponent(issue.id)}`}
                    className="flex items-start justify-between gap-3 rounded-lg border p-3 text-sm hover:bg-muted/30"
                  >
                    <span>
                      <LocalizedText text={issue.title} />
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {issue.status.replaceAll("_", " ")}
                        <LocalizedText
                          text={
                            issue.unresolvedDays !== null
                              ? ` · ${issue.unresolvedDays} days unresolved`
                              : ""
                          }
                        />
                      </span>
                    </span>
                    <ArrowUpRight className="size-4 shrink-0" />
                  </Link>
                ))}
              </section>
              <section className="space-y-3">
                <h3 className="text-sm font-medium">
                  <LocalizedText text="Documented response signals" />
                </h3>
                {!selected.notes.length && (
                  <p className="text-sm text-muted-foreground">
                    <LocalizedText text="No sourced response notes yet." />
                  </p>
                )}
                {selected.notes.map((note, index) => (
                  <article
                    key={`${note.callId}-${index}`}
                    className="space-y-2 rounded-lg border p-3 text-sm"
                  >
                    <blockquote className="border-l-2 pl-3">
                      <LocalizedText text={note.evidenceQuote} />
                    </blockquote>
                    <div className="flex flex-wrap gap-1">
                      {note.actionPlanGiven && (
                        <Badge variant="outline">
                          <LocalizedText text="Action plan given" />
                        </Badge>
                      )}
                      {note.deadlineGiven && (
                        <Badge variant="outline">
                          <LocalizedText text="Deadline given" />
                        </Badge>
                      )}
                      {note.responsibilityClarified && (
                        <Badge variant="outline">
                          <LocalizedText text="Responsibility clarified" />
                        </Badge>
                      )}
                    </div>
                    {note.uncertainty && (
                      <p className="text-xs text-muted-foreground">
                        <LocalizedText text={note.uncertainty} />
                      </p>
                    )}
                    <Link
                      href={`/app?issue=${encodeURIComponent(note.issueId)}`}
                      className="text-xs underline"
                    >
                      <LocalizedText text="Source case ·" />
                      {formatDate(note.createdAt)}
                    </Link>
                  </article>
                ))}
              </section>
              <section className="space-y-3">
                <h3 className="text-sm font-medium">
                  <LocalizedText text="Phone conversations" />
                </h3>
                {selected.calls.map((call) => (
                  <Link
                    key={call.id}
                    href={`/app?issue=${encodeURIComponent(call.issueId)}`}
                    className="block space-y-1 rounded-lg border p-3 text-xs"
                  >
                    <p className="font-medium">
                      <LocalizedText text={call.status} /> ·{" "}
                      {formatDate(call.createdAt)}
                    </p>
                    <p className="text-muted-foreground">
                      <LocalizedText
                        text={call.summary || "No published summary."}
                      />
                    </p>
                  </Link>
                ))}
              </section>
              <p className="text-xs text-muted-foreground">
                <LocalizedText text="Window:" />{" "}
                <LocalizedText
                  text={
                    selected.dateRange.from
                      ? formatDate(selected.dateRange.from)
                      : "No activity"
                  }
                />{" "}
                — {formatDate(selected.dateRange.to)}.{" "}
                <LocalizedText text={selected.blocking} />.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </main>
  )
}
