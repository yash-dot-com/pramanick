"use client"

import { LocalizedText } from "@/components/language-provider"

import { useState } from "react"
import { Download, FileText } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatDate } from "@/lib/civic/model"
import type { IssueDossier } from "@/lib/civic/dossier"

export function EscalationPanel({
  issueId,
  entries,
  busy,
  operations,
  verified,
  mutate,
}: {
  issueId: string
  entries: IssueDossier["escalations"]
  busy: boolean
  operations: boolean
  verified: boolean
  mutate: (
    path: string,
    body: unknown,
    success: string
  ) => Promise<boolean | undefined>
}) {
  const [reference, setReference] = useState("")
  const [channel, setChannel] = useState("")
  const path = `/api/issues/${encodeURIComponent(issueId)}/escalations`
  return (
    <div className="space-y-4 pt-4">
      <p className="text-sm text-muted-foreground">
        <LocalizedText text="Missed promises and repeated unanswered attempts can prepare a complaint draft automatically. The evidence and follow-up history travel with the complaint." />
      </p>
      {!verified && (
        <Button
          variant="outline"
          disabled={busy}
          onClick={() =>
            void mutate(
              path,
              { action: "prepare" },
              "Complaint draft prepared. Review it before filing through an official channel."
            )
          }
        >
          <FileText />
          <LocalizedText text="Prepare current complaint draft" />
        </Button>
      )}
      {!entries.length && (
        <p className="text-xs text-muted-foreground">
          <LocalizedText text="No draft or filing recorded yet." />
        </p>
      )}
      {entries.map((entry, index) => (
        <article
          key={entry.id}
          className="space-y-3 rounded-xl border p-3 text-xs"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>
              {formatDate(entry.createdAt)}
              <LocalizedText text="· dossier v" />
              <LocalizedText text={entry.dossierVersion} />
            </span>
            <Badge variant="outline">
              <LocalizedText
                text={
                  entry.state === "draft"
                    ? "Draft · not filed"
                    : "Reference recorded"
                }
              />
            </Badge>
          </div>
          <Button
            size="sm"
            variant="outline"
            nativeButton={false}
            render={<a href={`${path}?draft=${entry.id}`} />}
          >
            <Download />
            <LocalizedText text="Download complaint" />
          </Button>
          {entry.submissionReference && (
            <p className="break-words text-muted-foreground">
              {entry.submissionChannel} · {entry.submissionReference}
              <br />
              <LocalizedText text="Recorded by operator; receipt not independently confirmed." />
            </p>
          )}
          {operations && index === 0 && entry.state === "draft" && (
            <div className="space-y-2 border-t pt-3">
              <p className="font-medium">
                <LocalizedText text="Already filed through an official channel?" />
              </p>
              <Input
                value={channel}
                onChange={(event) => setChannel(event.target.value)}
                placeholder="Channel used"
                maxLength={200}
                aria-label="Filing channel"
              />
              <Input
                value={reference}
                onChange={(event) => setReference(event.target.value)}
                placeholder="Acknowledgment / complaint reference"
                maxLength={200}
                aria-label="Filing reference"
              />
              <Button
                size="sm"
                variant="outline"
                disabled={
                  busy ||
                  channel.trim().length < 3 ||
                  reference.trim().length < 3
                }
                onClick={() =>
                  void mutate(
                    path,
                    {
                      action: "record_submission",
                      id: entry.id,
                      channel,
                      reference,
                    },
                    "Your filing reference was recorded. The community case stays open."
                  )
                }
              >
                <LocalizedText text="Record filing reference" />
              </Button>
            </div>
          )}
        </article>
      ))}
    </div>
  )
}
