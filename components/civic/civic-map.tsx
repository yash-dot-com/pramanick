"use client"

import { LocalizedText } from "@/components/language-provider"

import { Component, useEffect, useState, type ReactNode } from "react"
import {
  Building2,
  CloudOff,
  Droplets,
  Lightbulb,
  MapPin,
  Route,
  Waves,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Map,
  MapControls,
  MapMarker,
  MarkerContent,
  MarkerTooltip,
  useMap,
} from "@/components/ui/map"
import {
  CATEGORIES,
  LOCALITIES,
  formatDate,
  localityName,
  type CivicIssue,
  type Office,
} from "@/lib/civic/model"
import { StatusBadge } from "./status-badge"

const icons = {
  roads: Route,
  water: Droplets,
  drainage: Waves,
  lighting: Lightbulb,
}
class MapBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}
function MapBehavior({
  selected,
  localityId,
  onPoint,
  onUnavailable,
}: {
  selected?: { lat: number; lng: number }
  localityId: string
  onPoint: (point: [number, number]) => void
  onUnavailable: () => void
}) {
  const { map } = useMap()
  const lng = selected?.lng
  const lat = selected?.lat
  useEffect(() => {
    if (!map) return
    const place =
      lng != null && lat != null
        ? { lng, lat }
        : LOCALITIES.find((item) => item.id === localityId)
    map.flyTo({
      center: place ? [place.lng, place.lat] : [73.855, 18.549],
      zoom: place ? 14 : 11.4,
      duration: 650,
    })
  }, [map, lng, lat, localityId])
  useEffect(() => {
    if (!map) return
    let resizeFrame = 0
    let lastWidth = 0
    let lastHeight = 0
    const observer = new ResizeObserver(([entry]) => {
      const width = Math.round(entry.contentRect.width)
      const height = Math.round(entry.contentRect.height)
      if (width === lastWidth && height === lastHeight) return
      lastWidth = width
      lastHeight = height
      cancelAnimationFrame(resizeFrame)
      resizeFrame = requestAnimationFrame(() => map.resize())
    })
    observer.observe(map.getContainer())
    const click = (event: {
      lngLat: { lng: number; lat: number }
      originalEvent: MouseEvent
    }) => {
      if (
        (event.originalEvent.target as HTMLElement)?.closest(
          ".maplibregl-marker,button"
        )
      )
        return
      onPoint([event.lngLat.lng, event.lngLat.lat])
    }
    const error = () => onUnavailable()
    map.on("click", click)
    map.on("error", error)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(resizeFrame)
      map.off("click", click)
      map.off("error", error)
    }
  }, [map, onPoint, onUnavailable])
  return null
}
export function CivicMap({
  issues,
  offices,
  selectedId,
  selectedOfficeId,
  localityId,
  onSelect,
  onOffice,
  onPoint,
}: {
  issues: CivicIssue[]
  offices: Office[]
  selectedId: string | null
  selectedOfficeId: string | null
  localityId: string
  onSelect: (id: string) => void
  onOffice: (id: string) => void
  onPoint: (point: [number, number]) => void
}) {
  const [offline, setOffline] = useState(false)
  const [forceOffline, setForceOffline] = useState(false)
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine)
    update()
    window.addEventListener("online", update)
    window.addEventListener("offline", update)
    return () => {
      window.removeEventListener("online", update)
      window.removeEventListener("offline", update)
    }
  }, [])
  const selectedIssue = issues.find((issue) => issue.id === selectedId)
  const selectedOffice = offices.find(
    (office) => office.id === selectedOfficeId
  )
  const selected =
    selectedIssue ??
    (selectedOffice?.lat != null && selectedOffice?.lng != null
      ? { lat: selectedOffice.lat, lng: selectedOffice.lng }
      : undefined)
  const fallback = (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 overflow-y-auto bg-muted p-6 pt-32 pb-20">
      <div className="max-w-sm space-y-2 text-center">
        <CloudOff className="mx-auto size-6 text-muted-foreground" />
        <h2 className="text-base font-medium">
          <LocalizedText text="Offline location view" />
        </h2>
        <p className="text-sm text-muted-foreground">
          <LocalizedText text="Local records remain available. Street tiles and ward boundaries are not shown." />
        </p>
      </div>
      <div className="grid w-full max-w-sm gap-2">
        {issues.map((issue) => (
          <Button
            variant="outline"
            className="h-auto justify-start gap-3 py-3 text-left whitespace-normal"
            key={issue.id}
            onClick={() => onSelect(issue.id)}
          >
            <MapPin className="size-4" />
            <span>
              <span className="block text-xs font-normal text-muted-foreground">
                {localityName(issue.localityId)}
              </span>
              <LocalizedText text={issue.title} />
            </span>
          </Button>
        ))}
      </div>
    </div>
  )
  return (
    <div className="absolute inset-0 overflow-hidden rounded-[1.25rem]">
      {offline || forceOffline ? (
        fallback
      ) : (
        <MapBoundary fallback={fallback}>
          <Map center={[73.855, 18.549]} zoom={11.4} minZoom={9} maxZoom={18}>
            <MapControls showCompass showFullscreen position="bottom-right" />
            <MapBehavior
              selected={selected}
              localityId={localityId}
              onPoint={onPoint}
              onUnavailable={() => setForceOffline(true)}
            />
            {issues.map((issue) => (
              <MapMarker
                key={issue.id}
                anchor="bottom"
                longitude={issue.lng}
                latitude={issue.lat}
                onClick={() => onSelect(issue.id)}
              >
                <MarkerContent>
                  <button
                    aria-label={`Open issue: ${issue.title} · ${issue.status === "verified" ? "resident verified" : issue.status === "awaiting_verification" ? "completion claimed, awaiting review" : "unresolved"}`}
                    className={`relative mb-1 flex size-10 -rotate-45 items-center justify-center rounded-[50%_50%_50%_8%] border border-zinc-300 bg-zinc-100 text-zinc-950 shadow-md outline-none focus-visible:ring-4 focus-visible:ring-ring ${selectedId === issue.id ? "ring-4 ring-ring/60" : "hover:bg-white"}`}
                  >
                    <MapPin className="size-5 rotate-45" />
                    <span
                      aria-hidden="true"
                      className={`absolute top-0 left-0 size-3 rotate-45 rounded-full border-2 border-zinc-100 ${issue.status === "verified" ? "bg-emerald-500" : issue.status === "awaiting_verification" ? "bg-amber-400" : "bg-red-500"}`}
                    />
                    <span className="absolute -top-2 -right-2 rotate-45 rounded-full border bg-background px-1.5 text-[10px] text-foreground">
                      {issue.complaintCount}
                    </span>
                  </button>
                </MarkerContent>
                <MarkerTooltip offset={56}>
                  <div className="max-w-72 min-w-56 space-y-2">
                    <p className="text-xs text-muted-foreground">
                      <LocalizedText text={CATEGORIES[issue.category].label} />{" "}
                      · {localityName(issue.localityId)}
                    </p>
                    <p className="text-sm font-medium">
                      <LocalizedText text={issue.title} />
                    </p>
                    <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                      <span>
                        {issue.complaintCount}
                        <LocalizedText text="complaints" />
                      </span>
                      <StatusBadge status={issue.status} />
                    </div>
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      <LocalizedText
                        text={
                          issue.events[0]?.title ?? "Reported by a resident"
                        }
                      />
                    </p>
                    {issue.nextFollowUp && (
                      <p className="text-xs text-muted-foreground">
                        <LocalizedText text="Next:" />
                        {formatDate(issue.nextFollowUp)}
                      </p>
                    )}
                  </div>
                </MarkerTooltip>
              </MapMarker>
            ))}
            {offices
              .filter((office) => office.lat != null && office.lng != null)
              .map((office) => (
                <MapMarker
                  key={office.id}
                  longitude={office.lng!}
                  latitude={office.lat!}
                  onClick={() => onOffice(office.id)}
                >
                  <MarkerContent>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      className="bg-background shadow-sm"
                      aria-label={`Open office: ${office.name}`}
                    >
                      <Building2 />
                    </Button>
                  </MarkerContent>
                  <MarkerTooltip>
                    <LocalizedText text={office.name} />
                  </MarkerTooltip>
                </MapMarker>
              ))}
          </Map>
        </MapBoundary>
      )}
      <div className="map-edge-depth" aria-hidden="true" />
      <div className="absolute right-16 bottom-3 z-10 flex flex-wrap gap-3 rounded-lg border bg-background/95 px-3 py-2 text-[10px] text-muted-foreground shadow-sm">
        <span className="flex items-center gap-1">
          <i className="size-2 rounded-full bg-red-500" />
          <LocalizedText text="Open / disputed" />
        </span>
        <span className="flex items-center gap-1">
          <i className="size-2 rounded-full bg-amber-400" />
          <LocalizedText text="Claimed fixed" />
        </span>
        <span className="flex items-center gap-1">
          <i className="size-2 rounded-full bg-emerald-500" />
          <LocalizedText text="Resident verified" />
        </span>
      </div>
      <Button
        className="absolute bottom-3 left-3 z-10"
        variant="outline"
        size={offline || forceOffline ? "sm" : "icon-sm"}
        onClick={() => setForceOffline(!forceOffline)}
        aria-label={
          offline || forceOffline
            ? "Try live map"
            : "Open offline location view"
        }
        title={
          offline || forceOffline ? "Try live map" : "Offline location view"
        }
      >
        <CloudOff />
        <LocalizedText text={(offline || forceOffline) && "Try live map"} />
      </Button>
    </div>
  )
}
