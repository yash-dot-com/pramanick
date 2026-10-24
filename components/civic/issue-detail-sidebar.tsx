"use client"

import { LocalizedText } from "@/components/language-provider"

import Link from "next/link"
import { useEffect, useState } from "react"
import {
  ArrowUpRight,
  Building2,
  CalendarClock,
  ExternalLink,
  MapPin,
  PhoneCall,
  Users,
  X,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  CATEGORIES,
  formatDate,
  localityName,
  type CivicIssue,
  type Office,
} from "@/lib/civic/model"
import { StatusBadge } from "./status-badge"

type Routing = {
  offices: { id: string; name: string; designation: string }[]
  rules: { candidateOwner: string; confirmationNeeded: string }[]
  note: string
}
export function IssueDetailSidebar({
  issue,
  offices,
  onClose,
  onSupport,
  onOffice,
}: {
  issue: CivicIssue
  offices: Office[]
  onClose: () => void
  onSupport: () => void
  onOffice: (id: string) => void
}) {
  const [routing, setRouting] = useState<Routing | null>(null)
  useEffect(() => {
    const controller = new AbortController()
    fetch(`/api/issues/${encodeURIComponent(issue.id)}`, {
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((result) => setRouting(result?.routing ?? null))
      .catch(() => {})
    return () => controller.abort()
  }, [issue.id])
  const office = offices.find((item) => item.id === issue.officeId)
  return (
    <section className="space-y-5 p-4 pb-8" aria-labelledby="case-title">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">
            <LocalizedText text={CATEGORIES[issue.category].label} />
          </Badge>
          {issue.isDemo && (
            <Badge variant="outline">
              <LocalizedText text="Demo" />
            </Badge>
          )}
          <StatusBadge status={issue.status} />
        </div>
        <h1 id="case-title" className="text-lg font-semibold tracking-tight">
          <LocalizedText text={issue.title} />
        </h1>
        <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <MapPin className="mt-0.5 size-3.5 shrink-0" />
          {localityName(issue.localityId)} ·{" "}
          <LocalizedText text={issue.landmark} />
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          <LocalizedText text={issue.description} />
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-sm">
          <Users className="size-4 text-muted-foreground" />
          {issue.complaintCount}
          <LocalizedText text="complaints" />
        </span>
        <Button size="sm" onClick={onSupport}>
          <LocalizedText text="I’m affected too" />
          <ArrowUpRight />
        </Button>
      </div>
      <Separator />
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-medium">
          <Building2 className="size-4" />
          <LocalizedText text="Responsible office" />
        </h2>
        {office ? (
          <Button
            variant="outline"
            className="h-auto w-full justify-between py-3 text-left whitespace-normal"
            onClick={() => onOffice(office.id)}
          >
            <span>
              <LocalizedText text={office.name} />
              <span className="mt-1 block text-xs font-normal text-muted-foreground">
                <LocalizedText text={office.designation} /> ·{" "}
                <LocalizedText text={issue.assignmentCertainty} />
              </span>
            </span>
            <ArrowUpRight />
          </Button>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              <LocalizedText text="Assignment pending review." />
            </p>
            {routing?.rules[0] && (
              <div className="space-y-1 rounded-lg border p-3 text-xs">
                <p className="font-medium">
                  <LocalizedText text={routing.rules[0].candidateOwner} />
                </p>
                <p className="leading-relaxed text-muted-foreground">
                  <LocalizedText text={routing.rules[0].confirmationNeeded} />
                </p>
              </div>
            )}
            {routing?.offices.slice(0, 2).map((candidate) => (
              <Button
                variant="ghost"
                className="h-auto w-full justify-between py-2 text-left whitespace-normal"
                key={candidate.id}
                onClick={() => onOffice(candidate.id)}
              >
                <span className="text-xs">
                  <LocalizedText text={candidate.name} />
                  <span className="mt-1 block font-normal text-muted-foreground">
                    <LocalizedText text="Candidate · unverified assignment" />
                  </span>
                </span>
                <ArrowUpRight />
              </Button>
            ))}
          </>
        )}
      </section>
      <Separator />
      <section className="space-y-2">
        <h2 className="flex items-center gap-2 text-sm font-medium">
          <CalendarClock className="size-4" />
          <LocalizedText text="Follow-up" />
        </h2>
        <p className="text-xs leading-relaxed text-muted-foreground">
          <LocalizedText
            text={
              issue.nextFollowUp
                ? `Scheduled: ${formatDate(issue.nextFollowUp)}`
                : issue.officeId
                  ? "Prepare a follow-up with the assigned contact."
                  : "Review the responsible office first."
            }
          />
        </p>
        {issue.commitments.map((commitment) => (
          <div
            className="space-y-1 rounded-lg border p-3 text-xs"
            key={commitment.id}
          >
            <p className="font-medium">
              <LocalizedText text={commitment.action} />
            </p>
            <p className="text-muted-foreground">
              {formatDate(commitment.dueAt)} ·{" "}
              <LocalizedText text={commitment.status} />
            </p>
          </div>
        ))}
      </section>
      <Tabs defaultValue="timeline">
        <TabsList className="w-full">
          <TabsTrigger value="timeline">
            <LocalizedText text="Timeline (" />
            {issue.events.length})
          </TabsTrigger>
          <TabsTrigger value="evidence">
            <LocalizedText text="Evidence (" />
            {issue.evidence.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="timeline">
          <div className="space-y-4 pt-3">
            {issue.events.map((event) => (
              <article key={event.id} className="space-y-1 border-l-2 pl-3">
                <p className="text-xs text-muted-foreground">
                  {formatDate(event.createdAt)}
                </p>
                <h3 className="text-sm font-medium">
                  <LocalizedText text={event.title} />
                </h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  <LocalizedText text={event.description} />
                </p>
                <p className="text-xs text-muted-foreground">
                  <LocalizedText text={event.source} />
                </p>
              </article>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="evidence">
          <div className="space-y-4 pt-3">
            {issue.evidence.length ? (
              issue.evidence.map((item) => (
                <figure key={item.id}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className="w-full rounded-lg"
                    src={item.url}
                    alt={item.caption}
                  />
                  <figcaption className="mt-2 text-xs text-muted-foreground">
                    <LocalizedText text={item.caption} /> ·{" "}
                    {formatDate(item.createdAt)}
                  </figcaption>
                </figure>
              ))
            ) : (
              <p className="py-4 text-sm text-muted-foreground">
                <LocalizedText text="No evidence submitted yet." />
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>
      {issue.calls.length > 0 && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-medium">
            <PhoneCall className="size-4" />
            <LocalizedText text="Conversations" />
          </h2>
          {issue.calls.map((call) => (
            <article className="space-y-1 text-xs" key={call.id}>
              <p className="text-muted-foreground">
                <LocalizedText text={call.status} /> ·{" "}
                {formatDate(call.createdAt)}
              </p>
              <p>
                <LocalizedText
                  text={call.summary ?? "No public summary available."}
                />
              </p>
            </article>
          ))}
        </section>
      )}
      <Button variant="ghost" size="sm" onClick={onClose}>
        <X />
        <LocalizedText text="Close details" />
      </Button>
    </section>
  )
}
export function OfficeProfile({
  office,
  onClose,
}: {
  office: Office
  onClose: () => void
}) {
  const record = office as Office & {
    email?: string
    personName?: string
    notes?: string
    verificationStatus?: string
    sourceAsOf?: string
  }
  return (
    <section className="space-y-5 p-4 pb-8" aria-labelledby="office-title">
      <Button
        variant="outline"
        size="sm"
        nativeButton={false}
        render={
          <Link
            href={`/leaderboard?profile=${encodeURIComponent(office.id)}`}
          />
        }
      >
        <LocalizedText text="View service record" />
        <ArrowUpRight />
      </Button>
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">
          <LocalizedText text={office.governmentBody} />
        </p>
        <h1 id="office-title" className="text-lg font-semibold tracking-tight">
          <LocalizedText text={office.name} />
        </h1>
        <p className="text-sm text-muted-foreground">
          <LocalizedText text={office.designation} />
        </p>
        {record.personName && (
          <p className="text-sm">
            <LocalizedText text={record.personName} />
          </p>
        )}
        <Badge variant="outline">
          <LocalizedText text="Assignment requires review" />
        </Badge>
      </div>
      <Separator />
      <dl className="space-y-4 text-sm">
        {[
          ["Address", office.address || "Not published"],
          ["Published contact", office.publishedPhone || "Not published"],
          ...(record.email ? [["Email", record.email]] : []),
          ["Jurisdiction", office.jurisdiction || "Not established"],
          [
            "Categories",
            office.categories
              .map((category) => CATEGORIES[category].label)
              .join(" · ") || "Directory / oversight",
          ],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="mb-1 text-xs text-muted-foreground">{label}</dt>
            <dd className="leading-relaxed break-words">{value}</dd>
          </div>
        ))}
      </dl>
      <Separator />
      <div className="space-y-2 text-xs text-muted-foreground">
        <p>
          <LocalizedText
            text={
              record.verificationStatus?.replaceAll("_", " ") ??
              "Imported directory record"
            }
          />
          <LocalizedText
            text={record.sourceAsOf ? ` · ${record.sourceAsOf}` : ""}
          />
        </p>
        {record.notes && (
          <p className="leading-relaxed">
            <LocalizedText text={record.notes} />
          </p>
        )}
        <p>
          <LocalizedText
            text={
              office.lat != null
                ? "Supplied office point; jurisdiction is not established by location."
                : "No coordinates supplied; this entry is not pinned."
            }
          />
        </p>
        {office.source && (
          <Button
            variant="link"
            size="sm"
            nativeButton={false}
            render={<a href={office.source} target="_blank" rel="noreferrer" />}
          >
            <LocalizedText text="Published source" />
            <ExternalLink />
          </Button>
        )}
      </div>
      <Button variant="ghost" size="sm" onClick={onClose}>
        <X />
        <LocalizedText text="Close details" />
      </Button>
    </section>
  )
}
