"use client"

import {
  LocalizedText,
  useTranslatedText,
} from "@/components/language-provider"

import { useCallback, useState, type FormEvent } from "react"
import {
  MapPin,
  Plus,
  ArrowRight,
  Check,
  LocateFixed,
  Loader2,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
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
import { Textarea } from "@/components/ui/textarea"
import {
  CATEGORIES,
  LOCALITIES,
  type Category,
  type CivicIssue,
} from "@/lib/civic/model"
import { LocationPicker } from "./location-picker"
import type { IntakeDraft } from "@/lib/voice/intake"
import { captureDeviceLocation } from "@/lib/civic/device-location"

export function ReportIssueDialog({
  open,
  onClose,
  localityId,
  point,
  joining,
  onSaved,
  initialDraft,
}: {
  open: boolean
  onClose: () => void
  localityId: string
  point: [number, number] | null
  joining: CivicIssue | null
  onSaved: (id: string) => void
  initialDraft?: IntakeDraft | null
}) {
  const initialPlace =
    LOCALITIES.find((item) => item.id === localityId) ?? LOCALITIES[3]
  const titlePlaceholder = useTranslatedText(
    "e.g. Large pothole outside Vanaz station"
  )
  const landmarkPlaceholder = useTranslatedText(
    "e.g. Gate 2, opposite the bus stop"
  )
  const descriptionPlaceholder = useTranslatedText(
    "What happened, and who is affected?"
  )
  const [title, setTitle] = useState(
    joining?.title ?? initialDraft?.title ?? ""
  )
  const [locality, setLocality] = useState(
    joining?.localityId ?? initialPlace.id
  )
  const [category, setCategory] = useState<Category>(
    joining?.category ?? initialDraft?.category ?? "roads"
  )
  const [issueType, setIssueType] = useState(
    joining?.issueType ?? initialDraft?.issueType ?? "Pothole"
  )
  const [landmark, setLandmark] = useState(
    joining?.landmark ?? initialDraft?.landmark ?? ""
  )
  const [lng, setLng] = useState(joining?.lng ?? point?.[0] ?? initialPlace.lng)
  const [lat, setLat] = useState(joining?.lat ?? point?.[1] ?? initialPlace.lat)
  const [locationPicked, setLocationPicked] = useState(!!joining || !!point)
  const [description, setDescription] = useState(
    initialDraft?.description ?? ""
  )
  const [photo, setPhoto] = useState<string>()
  const [photoBusy, setPhotoBusy] = useState(false)
  const [isDemo, setIsDemo] = useState(joining?.isDemo ?? false)
  const [locating, setLocating] = useState(false)
  const [locationFocus, setLocationFocus] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [duplicates, setDuplicates] = useState<
    { id: string; title: string; landmark: string }[]
  >([])
  const pick = useCallback(([nextLng, nextLat]: [number, number]) => {
    setLng(nextLng)
    setLat(nextLat)
    setLocationPicked(true)
    setDuplicates([])
  }, [])
  async function submit(
    event?: FormEvent,
    joinIssueId?: string,
    forceNew = false
  ) {
    event?.preventDefault()
    if (!locationPicked) {
      setError("Pick the issue location on the map or enter its coordinates.")
      return
    }
    setBusy(true)
    setError("")
    try {
      const response = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          localityId: locality,
          category,
          issueType,
          landmark,
          description,
          lat,
          lng,
          photo,
          intakeSessionId: initialDraft?.intakeSessionId,
          joinIssueId: joinIssueId ?? joining?.id,
          forceNew,
          isDemo,
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error)
      if (result.duplicates) setDuplicates(result.duplicates)
      else {
        onSaved(result.issueId)
        onClose()
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not save your report"
      )
    } finally {
      setBusy(false)
    }
  }
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) onClose()
      }}
    >
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            <LocalizedText
              text={joining ? "Add your complaint" : "Register an issue"}
            />
          </DialogTitle>
          <DialogDescription>
            <LocalizedText
              text={
                joining
                  ? "Add your report to this existing community case."
                  : "Describe the issue and mark the exact location. We’ll check for matching nearby cases."
              }
            />
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(event) => void submit(event)}
          className="grid gap-6 md:grid-cols-2"
        >
          <div className="space-y-4">
            <label className="block space-y-2 text-sm font-medium">
              <span>
                <LocalizedText text="Issue title" />
              </span>
              <Input
                autoFocus
                required
                minLength={4}
                maxLength={160}
                value={title}
                disabled={!!joining || busy}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={titlePlaceholder}
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label
                  className="text-sm font-medium"
                  id="report-category-label"
                >
                  <LocalizedText text="Category" />
                </label>
                <Select
                  value={category}
                  disabled={!!joining || busy}
                  onValueChange={(value) => {
                    if (!value) return
                    const next = value as Category
                    setCategory(next)
                    setIssueType(CATEGORIES[next].types[0])
                    setDuplicates([])
                  }}
                >
                  <SelectTrigger
                    className="w-full"
                    aria-labelledby="report-category-label"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORIES).map(([key, item]) => (
                      <SelectItem value={key} key={key}>
                        <LocalizedText text={item.label} />
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" id="report-type-label">
                  <LocalizedText text="Issue type" />
                </label>
                <Select
                  value={issueType}
                  disabled={!!joining || busy}
                  onValueChange={(value) => {
                    if (value) {
                      setIssueType(value)
                      setDuplicates([])
                    }
                  }}
                >
                  <SelectTrigger
                    className="w-full"
                    aria-labelledby="report-type-label"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES[category].types.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <label className="block space-y-2 text-sm font-medium">
              <span>
                <LocalizedText text="Nearby landmark" />
              </span>
              <Input
                required
                minLength={3}
                maxLength={200}
                value={landmark}
                disabled={!!joining || busy}
                onChange={(event) => {
                  setLandmark(event.target.value)
                  setDuplicates([])
                }}
                placeholder={landmarkPlaceholder}
              />
            </label>
            <label className="block space-y-2 text-sm font-medium">
              <span>
                <LocalizedText text="Description" />{" "}
                <span className="font-normal text-muted-foreground">
                  <LocalizedText text="(optional)" />
                </span>
              </span>
              <Textarea
                value={description}
                disabled={busy}
                maxLength={2000}
                onChange={(event) => setDescription(event.target.value)}
                placeholder={descriptionPlaceholder}
                rows={4}
              />
            </label>
            <label className="block space-y-2 text-sm font-medium">
              <span>
                <LocalizedText text="Photograph" />{" "}
                <span className="font-normal text-muted-foreground">
                  <LocalizedText text="(optional)" />
                </span>
              </span>
              <Input
                type="file"
                disabled={busy || photoBusy}
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (!file) {
                    setPhoto(undefined)
                    return
                  }
                  if (
                    file.size > 2000000 ||
                    !["image/jpeg", "image/png", "image/webp"].includes(
                      file.type
                    )
                  ) {
                    setError("Choose a JPG, PNG, or WebP photograph under 2 MB")
                    setPhoto(undefined)
                    return
                  }
                  setPhotoBusy(true)
                  const reader = new FileReader()
                  reader.onload = () => {
                    setPhoto(String(reader.result))
                    setPhotoBusy(false)
                  }
                  reader.onerror = () => {
                    setError("Could not read the photograph")
                    setPhotoBusy(false)
                  }
                  reader.readAsDataURL(file)
                }}
              />
            </label>
          </div>
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium" id="report-locality-label">
                <LocalizedText text="Locality" />
              </label>
              <Select
                value={locality}
                disabled={!!joining || busy}
                onValueChange={(value) => {
                  const place = LOCALITIES.find((item) => item.id === value)
                  if (!place) return
                  setLocality(place.id)
                  setLat(place.lat)
                  setLng(place.lng)
                  setLocationPicked(false)
                  setDuplicates([])
                }}
              >
                <SelectTrigger
                  className="w-full"
                  aria-labelledby="report-locality-label"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOCALITIES.map((place) => (
                    <SelectItem value={place.id} key={place.id}>
                      <LocalizedText text={place.name} />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {!joining && (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={busy || locating}
                  onClick={async () => {
                    setLocating(true)
                    setError("")
                    try {
                      const location = await captureDeviceLocation()
                      if (
                        location.lat < 18.3 ||
                        location.lat > 18.85 ||
                        location.lng < 73.6 ||
                        location.lng > 74.1
                      )
                        throw new Error(
                          "This prototype supports the Pune area. Pick a supported issue location."
                        )
                      pick([location.lng, location.lat])
                      setLocationFocus((value) => value + 1)
                    } catch (error) {
                      setError(
                        error instanceof Error
                          ? error.message
                          : "Could not capture location"
                      )
                    } finally {
                      setLocating(false)
                    }
                  }}
                >
                  {locating ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <LocateFixed />
                  )}
                  <LocalizedText text="Use my live location" />
                </Button>
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={isDemo}
                    disabled={busy}
                    onChange={(event) => setIsDemo(event.target.checked)}
                    className="size-4 accent-primary"
                  />
                  <LocalizedText text="Fictional demo case" />
                </label>
              </div>
            )}
            <LocationPicker
              key={`${locality}:${locationFocus}`}
              localityId={locality}
              lat={lat}
              lng={lng}
              disabled={!!joining || busy}
              onPick={pick}
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="size-3.5" />
                <LocalizedText
                  text={
                    joining
                      ? "Existing case location"
                      : "Click the map or drag the pin"
                  }
                />
              </p>
              <Badge variant={locationPicked ? "secondary" : "outline"}>
                {locationPicked ? (
                  <>
                    <Check className="size-3" />
                    <LocalizedText text="Location selected" />
                  </>
                ) : (
                  "Location needed"
                )}
              </Badge>
            </div>
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer">
                <LocalizedText text="Coordinates" />
              </summary>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <label className="space-y-2">
                  <span>
                    <LocalizedText text="Latitude" />
                  </span>
                  <Input
                    type="number"
                    step="any"
                    min={18.3}
                    max={18.85}
                    required
                    value={lat}
                    disabled={!!joining || busy}
                    onChange={(event) =>
                      pick([lng, Number(event.target.value)])
                    }
                  />
                </label>
                <label className="space-y-2">
                  <span>
                    <LocalizedText text="Longitude" />
                  </span>
                  <Input
                    type="number"
                    step="any"
                    min={73.6}
                    max={74.1}
                    required
                    value={lng}
                    disabled={!!joining || busy}
                    onChange={(event) =>
                      pick([Number(event.target.value), lat])
                    }
                  />
                </label>
              </div>
            </details>
          </div>
          {duplicates.length > 0 && (
            <div className="space-y-3 rounded-lg border p-3 md:col-span-2">
              <p className="text-sm font-medium">
                <LocalizedText text="Is this the same problem?" />
              </p>
              <p className="text-xs text-muted-foreground">
                <LocalizedText text="These cases match the type and are within 100 metres. Join only if it is the same physical issue." />
              </p>
              {duplicates.map((issue) => (
                <Button
                  variant="outline"
                  className="h-auto w-full justify-between py-3 text-left whitespace-normal"
                  key={issue.id}
                  type="button"
                  disabled={busy || photoBusy}
                  onClick={() => void submit(undefined, issue.id)}
                >
                  <span>
                    <LocalizedText text={issue.title} />
                    <span className="mt-1 block text-xs font-normal text-muted-foreground">
                      <LocalizedText text={issue.landmark} />
                    </span>
                  </span>
                  <ArrowRight />
                </Button>
              ))}
              <Button
                type="button"
                variant="secondary"
                disabled={busy || photoBusy}
                onClick={() => void submit(undefined, undefined, true)}
              >
                <LocalizedText text="Register as a different issue" />
              </Button>
            </div>
          )}
          <div className="space-y-3 border-t pt-4 md:col-span-2">
            {error && (
              <p role="alert" className="text-sm text-destructive">
                <LocalizedText text={error} />
              </p>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">
                <LocalizedText text="Reporting as Yash" />
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={onClose}
                >
                  <LocalizedText text="Cancel" />
                </Button>
                {!duplicates.length && (
                  <Button
                    type="submit"
                    disabled={busy || photoBusy || locating}
                  >
                    <Plus />
                    <LocalizedText
                      text={
                        busy
                          ? "Saving…"
                          : joining
                            ? "Add my complaint"
                            : "Register issue"
                      }
                    />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
