"use client"

import { useEffect, useRef, useState } from "react"
import {
  ArrowRight,
  Loader2,
  Mic,
  Pause,
  Play,
  Send,
  Square,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LocalizedText, useLanguage } from "@/components/language-provider"
import { LANGUAGE_LABELS, type VoiceLanguage } from "@/lib/voice/language"
import type { IntakeDraft } from "@/lib/voice/intake"
import {
  AgentActivityFeed,
  InferredComplaint,
  type AgentActivity,
} from "./agent-activity-feed"

type Conversation = {
  id: string
  state: string
  transcript: string | null
  inference: Record<string, string> | null
  draft: IntakeDraft | null
  activities: AgentActivity[]
  answer?: string
  audioUrl?: string
}
type Stage =
  | "idle"
  | "connecting"
  | "listening"
  | "thinking"
  | "speaking"
  | "paused"
  | "ended"
export function CitizenVoicePanel({
  issueId,
  onDraft,
}: {
  issueId?: string
  onDraft?: (draft: IntakeDraft) => void
}) {
  const { locale } = useLanguage()
  const [language, setLanguage] = useState<VoiceLanguage>(
    locale === "en" ? "mr" : locale
  )
  const [stage, setStage] = useState<Stage>("idle")
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [error, setError] = useState("")
  const alive = useRef(true),
    running = useRef(false),
    waiting = useRef(false)
  const session = useRef<string | null>(null),
    stream = useRef<MediaStream | null>(null)
  const microphoneSource = useRef<MediaStreamAudioSourceNode | null>(null)
  const recorder = useRef<MediaRecorder | null>(null),
    audio = useRef<HTMLAudioElement | null>(null)
  const audioContext = useRef<AudioContext | null>(null),
    vad = useRef<ReturnType<typeof setInterval> | null>(null)
  const request = useRef<AbortController | null>(null),
    lastAudio = useRef<string | null>(null)
  const active = !["idle", "ended"].includes(stage)
  function clearCapture() {
    microphoneSource.current?.disconnect()
    microphoneSource.current = null
    if (vad.current) clearInterval(vad.current)
    vad.current = null
    if (recorder.current && recorder.current.state !== "inactive") {
      recorder.current.onstop = null
      recorder.current.stop()
    }
    recorder.current = null
  }
  function stop() {
    running.current = false
    waiting.current = false
    clearCapture()
    request.current?.abort()
    audio.current?.pause()
    audio.current = null
    stream.current?.getTracks().forEach((track) => track.stop())
    stream.current = null
    void audioContext.current?.close()
    audioContext.current = null
    if (session.current)
      void fetch(`/api/voice/citizen/${session.current}`, {
        method: "POST",
        keepalive: true,
      }).catch(() => {})
    if (alive.current) setStage("ended")
  }
  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
      stop()
    }
  }, [])
  useEffect(() => {
    if (!conversation?.id || !active) return
    const controller = new AbortController()
    const timer = setInterval(async () => {
      try {
        const response = await fetch(`/api/voice/citizen/${conversation.id}`, {
          cache: "no-store",
          signal: controller.signal,
        })
        if (response.ok) {
          const result = await response.json()
          if (!controller.signal.aborted)
            setConversation((prior) => ({ ...prior, ...result }))
        }
      } catch {
        /* A turn response also supplies the final saved activity. */
      }
    }, 1200)
    return () => {
      clearInterval(timer)
      controller.abort()
    }
  }, [conversation?.id, active])
  async function speak(url: string) {
    clearCapture()
    lastAudio.current = url
    if (!running.current || !alive.current) return
    setStage("speaking")
    const player = new Audio(url)
    audio.current = player
    player.onended = () => {
      if (running.current && alive.current) listen()
    }
    player.onerror = () => {
      if (running.current && alive.current) {
        setError("Speech playback failed. Read the reply below, or replay it.")
        setStage("paused")
      }
    }
    try {
      await player.play()
    } catch {
      if (running.current && alive.current) {
        setError("Press Play reply to hear the agent, or continue speaking.")
        setStage("paused")
      }
    }
  }
  function listen() {
    if (
      !running.current ||
      !stream.current ||
      waiting.current ||
      !alive.current
    )
      return
    audio.current?.pause()
    clearCapture()
    setStage("listening")
    const mimeType = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm"].find(
      (type) => MediaRecorder.isTypeSupported(type)
    )
    const capture = new MediaRecorder(
      stream.current,
      mimeType ? { mimeType } : undefined
    )
    recorder.current = capture
    const chunks: BlobPart[] = []
    capture.ondataavailable = (event) => {
      if (event.data.size) chunks.push(event.data)
    }
    capture.onstop = () => {
      if (vad.current) clearInterval(vad.current)
      vad.current = null
      if (running.current && chunks.length)
        void send(new Blob(chunks, { type: capture.mimeType }))
    }
    capture.start()
    const context = audioContext.current
    if (!context) return
    const analyser = context.createAnalyser()
    analyser.fftSize = 1024
    const source = context.createMediaStreamSource(stream.current)
    source.connect(analyser)
    microphoneSource.current = source
    const buffer = new Float32Array(analyser.fftSize)
    const started = Date.now()
    let heard = false,
      lastSpeech = started
    vad.current = setInterval(() => {
      analyser.getFloatTimeDomainData(buffer)
      const rms = Math.sqrt(
        buffer.reduce((sum, value) => sum + value * value, 0) / buffer.length
      )
      if (rms > 0.018) {
        heard = true
        lastSpeech = Date.now()
      }
      if (
        (heard &&
          Date.now() - lastSpeech > 1000 &&
          Date.now() - started > 1300) ||
        Date.now() - started >= 24_000
      ) {
        source.disconnect()
        if (vad.current) clearInterval(vad.current)
        vad.current = null
        if (capture.state !== "inactive") {
          if (!heard) {
            capture.onstop = null
            capture.stop()
            setStage("paused")
          } else capture.stop()
        }
      }
    }, 100)
  }
  async function send(blob: Blob) {
    if (!session.current || waiting.current || !running.current) return
    waiting.current = true
    setStage("thinking")
    setError("")
    const controller = new AbortController()
    request.current = controller
    try {
      const body = new FormData()
      body.set(
        "audio",
        blob,
        blob.type.includes("mp4") ? "turn.mp4" : "turn.webm"
      )
      body.set("turnId", crypto.randomUUID())
      const response = await fetch(
        `/api/voice/citizen/${session.current}/turn`,
        { method: "POST", body, signal: controller.signal }
      )
      const result = await response.json()
      if (!response.ok) throw new Error(result.error)
      if (running.current && alive.current) {
        setConversation(result)
        waiting.current = false
        await speak(result.audioUrl)
      }
    } catch (error) {
      if (!controller.signal.aborted && alive.current) {
        setError(
          error instanceof Error ? error.message : "Could not process that turn"
        )
        setStage("paused")
      }
    } finally {
      waiting.current = false
    }
  }
  async function start() {
    if (active) return
    setError("")
    setStage("connecting")
    running.current = true
    try {
      if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder)
        throw new Error(
          "Voice needs microphone access in a supported browser on HTTPS or localhost."
        )
      const microphone = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
      if (!running.current || !alive.current) {
        microphone.getTracks().forEach((track) => track.stop())
        return
      }
      stream.current = microphone
      audioContext.current = new AudioContext()
      await audioContext.current.resume()
      const controller = new AbortController()
      request.current = controller
      const response = await fetch("/api/voice/citizen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, issueId }),
        signal: controller.signal,
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error)
      session.current = result.id
      if (!running.current || !alive.current) {
        stop()
        return
      }
      setConversation(result)
      await speak(result.audioUrl)
    } catch (error) {
      stop()
      if (alive.current)
        setError(
          error instanceof Error ? error.message : "Could not start voice"
        )
    }
  }
  const labels: Record<Stage, string> = {
    idle: "Ready to speak",
    connecting: "Connecting voice",
    listening: "Listening · your turn",
    thinking: "Understanding your complaint",
    speaking: "Agent speaking",
    paused: "Microphone paused",
    ended: "Conversation ended",
  }
  return (
    <div className="space-y-4">
      <select
        aria-label="Conversation language"
        disabled={active}
        className="h-9 w-full rounded-lg border bg-background px-3 text-sm"
        value={language}
        onChange={(event) => setLanguage(event.target.value as VoiceLanguage)}
      >
        {Object.entries(LANGUAGE_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <div className="flex min-h-32 flex-col items-center justify-center gap-3 rounded-xl border bg-muted/20 p-5">
        {stage === "thinking" || stage === "connecting" ? (
          <Loader2 className="size-7 animate-spin" />
        ) : (
          <Mic
            className={`size-7 ${stage === "listening" ? "animate-pulse" : "text-muted-foreground"}`}
          />
        )}
        <Badge variant="secondary">
          <LocalizedText text={labels[stage]} />
        </Badge>
        {conversation?.answer && (
          <p lang={language} className="text-center text-sm leading-relaxed">
            {conversation.answer}
          </p>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {!active ? (
          <Button onClick={() => void start()}>
            <Mic />
            <LocalizedText text="Start speaking" />
          </Button>
        ) : (
          <>
            {stage === "listening" && (
              <>
                <Button
                  onClick={() => {
                    if (recorder.current?.state === "recording")
                      recorder.current.stop()
                  }}
                >
                  <Send />
                  <LocalizedText text="Send turn" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    clearCapture()
                    setStage("paused")
                  }}
                >
                  <Pause />
                  <LocalizedText text="Pause microphone" />
                </Button>
              </>
            )}
            {(stage === "paused" || stage === "speaking") && (
              <Button variant="outline" onClick={listen}>
                <Mic />
                <LocalizedText text="Speak now" />
              </Button>
            )}
            {stage !== "thinking" && (
              <Button variant="ghost" onClick={stop}>
                <Square />
                <LocalizedText text="Finish speaking" />
              </Button>
            )}
          </>
        )}
        {lastAudio.current && stage === "paused" && (
          <Button
            variant="outline"
            onClick={() => {
              setError("")
              void speak(lastAudio.current!)
            }}
          >
            <Play />
            <LocalizedText text="Play reply" />
          </Button>
        )}
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          <LocalizedText text={error} />
        </p>
      )}
      {!issueId && (
        <InferredComplaint inference={conversation?.inference ?? null} />
      )}
      {conversation?.draft && onDraft && (
        <Button
          disabled={stage === "thinking"}
          className="w-full"
          onClick={() => {
            const draft = conversation.draft!
            stop()
            onDraft(draft)
          }}
        >
          <ArrowRight />
          <LocalizedText text="Review & choose location" />
        </Button>
      )}
      {conversation?.transcript && (
        <details className="rounded-lg border p-3">
          <summary className="cursor-pointer text-sm">
            <LocalizedText text="Conversation transcript" />
          </summary>
          <p
            lang={language}
            className="mt-3 max-h-52 overflow-auto text-xs leading-relaxed whitespace-pre-wrap"
          >
            {conversation.transcript}
          </p>
        </details>
      )}
      <section className="space-y-3">
        <h3 className="text-sm font-medium">
          <LocalizedText text="Live agent activity" />
        </h3>
        <AgentActivityFeed
          activities={conversation?.activities ?? []}
          compact
        />
      </section>
      <p className="text-xs leading-relaxed text-muted-foreground">
        <LocalizedText text="Sarvam speech + GPT reasoning. Short speaking turns are sent after a pause. The microphone pauses while the agent replies. You review the draft and choose the map pin before submitting." />
      </p>
    </div>
  )
}
