"use client"

import {
  LocalizedText,
  useTranslatedText,
} from "@/components/language-provider"

import dynamic from "next/dynamic"
import { useCallback, useEffect, useMemo, useState } from "react"
import {
  Building2,
  ListFilter,
  MapPin,
  Mic,
  Plus,
  Search,
  Users,
  X,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  CATEGORIES,
  LOCALITIES,
  localityName,
  type CivicSnapshot,
  type CivicIssue,
} from "@/lib/civic/model"
import { CivicMap } from "./civic-map"
import { DockedPanel } from "./docked-panel"
import { IssueDossier } from "./issue-dossier"
import type { IntakeDraft } from "@/lib/voice/intake"
import { StatusBadge } from "./status-badge"
import { OfficeProfile } from "./issue-detail-sidebar"
import { ReportIssueDialog } from "./report-issue-dialog"

const VoiceIntakeDialog = dynamic(
  () =>
    import("./voice-intake-dialog").then((module) => module.VoiceIntakeDialog),
  { ssr: false }
)
const VoiceAgentDialog = dynamic(
  () =>
    import("./voice-agent-dialog").then((module) => module.VoiceAgentDialog),
  { ssr: false }
)

export function CivicWorkspace({
  showIssues = true,
  showOffices = true,
}: {
  showIssues?: boolean
  showOffices?: boolean
}) {
  const searchIssues = useTranslatedText("Search issues")
  const searchOffices = useTranslatedText("Search offices")
  const [data, setData] = useState<CivicSnapshot | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [localityId, setLocalityId] = useState("all")
  const [category, setCategory] = useState("all")
  const [query, setQuery] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedOfficeId, setSelectedOfficeId] = useState<string | null>(null)
  const [panel, setPanel] = useState<"list" | "detail" | null>("list")
  const [directory, setDirectory] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(380)
  const [voiceDraft, setVoiceDraft] = useState<IntakeDraft | null>(null)
  const [voiceOpen, setVoiceOpen] = useState(false)
  const [caseVoiceOpen, setCaseVoiceOpen] = useState(false)
  const [issueTab, setIssueTab] = useState("timeline")
  const [reportPoint, setReportPoint] = useState<[number, number] | null>(null)
  const [joining, setJoining] = useState<CivicIssue | null>(null)
  const [notice, setNotice] = useState("")
  const refresh = useCallback(async () => {
    setError("")
    try {
      const response = await fetch("/api/civic", { cache: "no-store" })
      const next = await response.json()
      if (!response.ok) throw new Error(next.error)
      setData(next)
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not load local records"
      )
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => {
    const issueId = new URLSearchParams(window.location.search).get("issue")
    const requestedTab = new URLSearchParams(window.location.search).get("tab")
    if (
      requestedTab &&
      ["timeline", "calls", "evidence", "review", "escalation"].includes(
        requestedTab
      )
    )
      setIssueTab(requestedTab)
    if (issueId) {
      setSelectedId(issueId)
      setPanel("detail")
    }
    void refresh()
    const timer = setInterval(() => {
      if (document.visibilityState !== "hidden") void refresh()
    }, 8000)
    return () => clearInterval(timer)
  }, [refresh])
  const issues = useMemo(
    () =>
      (data?.issues ?? []).filter(
        (issue) =>
          (localityId === "all" || issue.localityId === localityId) &&
          (category === "all" || issue.category === category) &&
          `${issue.title} ${issue.landmark} ${localityName(issue.localityId)}`
            .toLowerCase()
            .includes(query.toLowerCase())
      ),
    [data, localityId, category, query]
  )
  const offices = useMemo(
    () =>
      (data?.offices ?? []).filter((office) => {
        const areaIds = (office as typeof office & { areaIds?: string[] })
          .areaIds ?? [office.localityId]
        return (
          (localityId === "all" || areaIds.includes(localityId)) &&
          (category === "all" ||
            office.categories.includes(category as keyof typeof CATEGORIES)) &&
          `${office.name} ${office.governmentBody} ${office.designation}`
            .toLowerCase()
            .includes(query.toLowerCase())
        )
      }),
    [data, localityId, category, query]
  )
  const selected = data?.issues.find((issue) => issue.id === selectedId)
  const selectedOffice = data?.offices.find(
    (office) => office.id === selectedOfficeId
  )
  const chooseIssue = useCallback((id: string) => {
    setIssueTab("timeline")
    setSelectedId(id)
    setSelectedOfficeId(null)
    setPanel("detail")
  }, [])
  const chooseOffice = useCallback((id: string) => {
    setSelectedOfficeId(id)
    setSelectedId(null)
    setPanel("detail")
  }, [])
  const openReport = useCallback((point: [number, number]) => {
    setJoining(null)
    setVoiceDraft(null)
    setReportPoint(point)
    setReportOpen(true)
  }, [])
  function closePanel() {
    setPanel(null)
    setSelectedId(null)
    setSelectedOfficeId(null)
  }
  function browse() {
    setPanel("list")
    setSelectedId(null)
    setSelectedOfficeId(null)
  }
  function localityChanged(value: string | null) {
    setLocalityId(value ?? "all")
    closePanel()
  }

  return (
    <main className="relative flex h-full gap-2 overflow-hidden bg-background p-2 text-foreground">
      {panel && (
        <DockedPanel
          width={sidebarWidth}
          onWidthChange={setSidebarWidth}
          title={
            panel === "list"
              ? "Browse"
              : selectedOffice
                ? "Office details"
                : "Issue overview"
          }
          onClose={closePanel}
          onBack={panel === "detail" ? browse : undefined}
        >
          {panel === "detail" ? (
            selected ? (
              <IssueDossier
                key={selected.id}
                issueId={selected.id}
                onUpdated={refresh}
                onVoice={() => setCaseVoiceOpen(true)}
                initialTab={issueTab}
                onSupport={() => {
                  setVoiceDraft(null)
                  setJoining(selected)
                  setReportOpen(true)
                }}
              />
            ) : selectedOffice ? (
              <OfficeProfile office={selectedOffice} onClose={closePanel} />
            ) : (
              <div className="space-y-3 p-4 text-sm text-muted-foreground">
                <p>
                  <LocalizedText
                    text={
                      loading
                        ? "Loading details…"
                        : error || "This case is no longer available."
                    }
                  />
                </p>
                {!loading && (
                  <Button variant="outline" size="sm" onClick={browse}>
                    <LocalizedText text="Browse cases" />
                  </Button>
                )}
              </div>
            )
          ) : (
            <div className="flex h-full flex-col">
              <div className="space-y-3 border-b p-3">
                <div className="flex items-center gap-2">
                  <div className="relative min-w-0 flex-1">
                    <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      aria-label="Search issues or offices"
                      placeholder={directory ? searchOffices : searchIssues}
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={closePanel}
                    aria-label="Close sidebar"
                  >
                    <X />
                  </Button>
                </div>
                <Select
                  value={category}
                  onValueChange={(value) => setCategory(value ?? "all")}
                >
                  <SelectTrigger
                    className="w-full"
                    aria-label="Filter issue category"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <LocalizedText text="All categories" />
                    </SelectItem>
                    {Object.entries(CATEGORIES).map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        <LocalizedText text={value.label} />
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Tabs
                  value={directory ? "offices" : "issues"}
                  onValueChange={(value) => setDirectory(value === "offices")}
                >
                  <TabsList className="w-full">
                    <TabsTrigger value="issues">
                      <LocalizedText text="Issues (" />
                      {issues.length})
                    </TabsTrigger>
                    <TabsTrigger value="offices">
                      <LocalizedText text="Offices (" />
                      {offices.length})
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-2">
                {loading ? (
                  <p className="p-3 text-sm text-muted-foreground">
                    <LocalizedText text="Loading local records…" />
                  </p>
                ) : error ? (
                  <div className="space-y-3 p-3">
                    <p role="alert" className="text-sm text-destructive">
                      <LocalizedText text={error} />
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void refresh()}
                    >
                      <LocalizedText text="Try again" />
                    </Button>
                  </div>
                ) : directory ? (
                  offices.length ? (
                    offices.map((office) => (
                      <Button
                        variant="ghost"
                        className="mb-1 h-auto w-full justify-start gap-3 py-3 text-left whitespace-normal"
                        onClick={() => chooseOffice(office.id)}
                        key={office.id}
                      >
                        <Building2 className="mt-0.5 size-4 shrink-0 self-start text-muted-foreground" />
                        <span>
                          <span className="block text-sm">
                            <LocalizedText text={office.name} />
                          </span>
                          <span className="mt-1 block text-xs font-normal text-muted-foreground">
                            <LocalizedText text={office.designation} />
                          </span>
                        </span>
                      </Button>
                    ))
                  ) : (
                    <p className="p-3 text-sm text-muted-foreground">
                      <LocalizedText text="No matching offices." />
                    </p>
                  )
                ) : issues.length ? (
                  issues.map((issue) => (
                    <Button
                      variant="ghost"
                      className="mb-1 h-auto w-full flex-col items-stretch gap-2 py-3 text-left whitespace-normal"
                      key={issue.id}
                      onClick={() => chooseIssue(issue.id)}
                    >
                      <span className="flex items-center justify-between gap-2 text-xs font-normal text-muted-foreground">
                        <LocalizedText
                          text={CATEGORIES[issue.category].label}
                        />
                      </span>
                      <span className="text-sm">
                        <LocalizedText text={issue.title} />
                      </span>
                      <span className="flex items-center gap-1 text-xs font-normal text-muted-foreground">
                        <MapPin className="size-3" />
                        {localityName(issue.localityId)}
                      </span>
                      <span className="flex items-center justify-between gap-2">
                        <StatusBadge status={issue.status} />
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="size-3" />
                          {issue.complaintCount}
                        </span>
                      </span>
                    </Button>
                  ))
                ) : (
                  <p className="p-3 text-sm text-muted-foreground">
                    <LocalizedText text="No matching issues." />
                  </p>
                )}
              </div>
            </div>
          )}
        </DockedPanel>
      )}
      <div className="relative min-w-0 flex-1 overflow-hidden rounded-xl border">
        <CivicMap
          issues={issues}
          offices={offices}
          showIssues={showIssues}
          showOffices={showOffices}
          selectedId={selectedId}
          selectedOfficeId={selectedOfficeId}
          localityId={localityId}
          onSelect={chooseIssue}
          onOffice={chooseOffice}
          onPoint={openReport}
        />
        <div className="pointer-events-none absolute inset-x-3 top-3 z-10 flex flex-wrap items-start justify-between gap-2">
          <div className="pointer-events-auto flex flex-wrap items-center gap-1.5 rounded-xl border bg-background p-1.5 shadow-sm">
            <Button
              variant={panel === "list" ? "secondary" : "ghost"}
              size="icon"
              onClick={panel === "list" ? closePanel : browse}
              aria-label="Browse issues and offices"
              title="Browse issues and offices"
            >
              <ListFilter />
            </Button>
            <Select value={localityId} onValueChange={localityChanged}>
              <SelectTrigger className="w-40" aria-label="Select locality">
                <MapPin className="size-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <LocalizedText text="All of Pune" />
                </SelectItem>
                {LOCALITIES.map((locality) => (
                  <SelectItem key={locality.id} value={locality.id}>
                    <LocalizedText text={locality.name} />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setVoiceOpen(true)}
              aria-label="Report an issue by voice"
              title="Report by voice"
            >
              <Mic />
            </Button>
            <Button
              size="icon"
              onClick={() => {
                setJoining(null)
                setVoiceDraft(null)
                setReportPoint(null)
                setReportOpen(true)
              }}
              aria-label="Report an issue"
              title="Report an issue"
            >
              <Plus />
            </Button>
          </div>
        </div>
      </div>
      {notice && (
        <div
          className="absolute right-3 bottom-14 left-3 z-30 mx-auto flex max-w-md items-center justify-between gap-3 rounded-xl border bg-background p-3 text-sm shadow-sm"
          role="status"
        >
          {notice}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setNotice("")}
            aria-label="Dismiss notification"
          >
            <X />
          </Button>
        </div>
      )}
      {error && !panel && (
        <Button
          variant="outline"
          className="absolute bottom-14 left-3 z-10"
          onClick={browse}
        >
          <LocalizedText text="Could not load cases · view details" />
        </Button>
      )}
      {voiceOpen && (
        <VoiceIntakeDialog
          onClose={() => setVoiceOpen(false)}
          onDraft={(draft) => {
            setVoiceDraft(draft)
            setJoining(null)
            setReportPoint(null)
            setVoiceOpen(false)
            setReportOpen(true)
          }}
          onTypeInstead={() => {
            setVoiceDraft(null)
            setJoining(null)
            setReportPoint(null)
            setVoiceOpen(false)
            setReportOpen(true)
          }}
        />
      )}
      {caseVoiceOpen && data && (
        <VoiceAgentDialog
          issues={data.issues}
          selectedIssueId={selectedId}
          onClose={() => setCaseVoiceOpen(false)}
          onUpdated={refresh}
        />
      )}
      {reportOpen && (
        <ReportIssueDialog
          key={`${voiceDraft?.intakeSessionId ?? joining?.id ?? "new"}-${reportPoint?.join(",")}`}
          initialDraft={voiceDraft}
          open={reportOpen}
          onClose={() => setReportOpen(false)}
          localityId={localityId}
          point={reportPoint}
          joining={joining}
          onSaved={(id) => {
            void refresh()
            chooseIssue(id)
            setNotice("Your complaint has been saved.")
          }}
        />
      )}
    </main>
  )
}
