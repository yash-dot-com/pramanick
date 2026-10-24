import type { readDossier } from "./dossier"

export type PublicCaseData = ReturnType<typeof readDossier>
export type PublicCaseCall = PublicCaseData["calls"][number]

export function conversationTurns(transcript: string) {
  const turns: {
    speaker: "agent" | "contact" | "unattributed"
    text: string
  }[] = []
  for (const line of transcript.split(/\r?\n/)) {
    const match = line.match(
      /^\s*(assistant|agent|user|human|officer|contact)\s*:\s*(.*)$/i
    )
    if (match)
      turns.push({
        speaker: /^(assistant|agent)$/i.test(match[1]) ? "agent" : "contact",
        text: match[2],
      })
    else if (turns.length) turns[turns.length - 1].text += `\n${line}`
    else if (line.trim()) turns.push({ speaker: "unattributed", text: line })
  }
  return turns.filter((turn) => turn.text.trim())
}

const normalized = (value: string) =>
  value.normalize("NFKC").replace(/\s+/g, " ").trim().toLowerCase()
export function publicResponseNotes(call: PublicCaseCall) {
  const signals: Record<string, unknown> = call.responseSignals ?? {}
  const quote =
    typeof signals?.evidenceQuote === "string" ? signals.evidenceQuote : ""
  const supported =
    call.phoneAttempt &&
    !!normalized(quote) &&
    !!call.transcript &&
    normalized(call.transcript).includes(normalized(quote))
  return {
    eligible: call.phoneAttempt,
    quote: supported ? quote : null,
    items: [
      { key: "responsibilityClarified", label: "Clarified who is responsible" },
      { key: "actionPlanGiven", label: "Explained what action would be taken" },
      { key: "deadlineGiven", label: "Gave a date or deadline" },
    ].map((item) => ({
      ...item,
      state:
        !supported || typeof signals[item.key] !== "boolean"
          ? ("unknown" as const)
          : signals?.[item.key] === true
            ? ("documented" as const)
            : ("not_documented" as const),
    })),
  }
}

export function publicCaseTimeline(data: PublicCaseData) {
  return [
    ...data.timeline.map((event) => ({
      id: `event:${event.id}`,
      kind: "event" as const,
      at: event.createdAt,
      event,
    })),
    ...data.calls.map((call) => ({
      id: `call:${call.id}`,
      kind: "call" as const,
      at: call.createdAt,
      call,
    })),
  ].sort((a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id))
}
