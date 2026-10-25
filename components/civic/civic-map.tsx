"use client"

import { LocalizedText } from "@/components/language-provider"

import { Component, useEffect, useState, type ReactNode } from "react"
import {
  Building2,
  Check,
  Clock3,
  CloudOff,
  Droplets,
  Lightbulb,
  MapPin,
  MessageCircle,
  Flag,
  Info,
  TriangleAlert,
  Route,
  Waves,
  X,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
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
  localityName,
  type CivicIssue,
  type Office,
} from "@/lib/civic/model"
import { caseStatus } from "@/lib/civic/status-presentation"

const icons = {
  roads: Route,
  water: Droplets,
  drainage: Waves,
  lighting: Lightbulb,
}
const statusIcons = {
  reported: Flag,
  assigned: Building2,
  following_up: MessageCircle,
  awaiting_verification: Clock3,
  verified: Check,
  disputed: TriangleAlert,
}
const mapNoteClassName =
  "relative w-60 max-w-[calc(100vw-2rem)] rounded-xl border border-white/10 bg-zinc-950 p-3 text-left text-zinc-50 shadow-xl after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-x-[7px] after:border-t-[7px] after:border-x-transparent after:border-t-zinc-950 after:content-['']"
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
  const { map, mapLib } = useMap()
  useEffect(() => {
    if (!map || !mapLib) return
    const attribution = new mapLib.AttributionControl({ compact: true })
    map.addControl(attribution, "bottom-left")
    return () => {
      // The parent map may have already removed its controls during teardown.
      if (map.hasControl(attribution)) {
        map.removeControl(attribution)
      }
    }
  }, [map, mapLib])
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
  showIssues = true,
  showOffices = true,
  selectedId,
  selectedOfficeId,
  localityId,
  onSelect,
  onOffice,
  onPoint,
}: {
  issues: CivicIssue[]
  offices: Office[]
  showIssues?: boolean
  showOffices?: boolean
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
        {(showIssues ? issues : []).map((issue) => (
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
    <div className="absolute inset-0 overflow-hidden rounded-[1.25rem] [&_.maplibregl-ctrl-attrib]:m-0! [&_.maplibregl-ctrl-attrib]:max-w-full [&_.maplibregl-ctrl-bottom-left]:right-16! [&_.maplibregl-ctrl-bottom-left]:bottom-3! [&_.maplibregl-ctrl-bottom-left]:left-14! [&_.maplibregl-ctrl-bottom-left]:z-10">
      {offline || forceOffline ? (
        fallback
      ) : (
        <MapBoundary fallback={fallback}>
          <Map
            center={[73.855, 18.549]}
            zoom={11.4}
            minZoom={9}
            maxZoom={18}
            attributionControl={false}
          >
            <MapControls
              showCompass
              showFullscreen
              position="top-right"
              className="top-16 right-3 flex-row sm:top-3 [&>div]:flex-row [&>div>button]:rounded-none! [&>div>button:not(:last-child)]:border-r [&>div>button:not(:last-child)]:border-b-0"
            />
            <MapBehavior
              selected={selected}
              localityId={localityId}
              onPoint={onPoint}
              onUnavailable={() => setForceOffline(true)}
            />
            {(showIssues ? issues : []).map((issue) => {
              const CategoryIcon = icons[issue.category]
              const StateIcon = statusIcons[issue.status]
              const presentation = caseStatus[issue.status]
              const selected = selectedId === issue.id
              return (
                <MapMarker
                  key={issue.id}
                  anchor="center"
                  longitude={issue.lng}
                  latitude={issue.lat}
                  onClick={() => onSelect(issue.id)}
                >
                  <MarkerContent>
                    <button
                      aria-label={`${issue.title} · ${CATEGORIES[issue.category].label} · ${presentation.label} · ${issue.complaintCount} resident reports`}
                      aria-pressed={selected}
                      title={`${presentation.label} · ${issue.complaintCount} resident reports`}
                      className={`relative flex size-9 items-center justify-center rounded-xl border border-white/60 text-white outline-none focus-visible:ring-4 focus-visible:ring-ring/40 dark:border-white/25 ${selected ? "ring-[3px] ring-primary ring-offset-2 ring-offset-background" : ""}`}
                      style={{
                        background: `linear-gradient(160deg, ${presentation.from}, ${presentation.to})`,
                        color: presentation.ink || "#ffffff",
                        boxShadow:
                          "inset 0 1px 0 #ffffff66, inset 0 -1px 0 #00000012, 0 2px 5px #10182830",
                      }}
                    >
                      <CategoryIcon
                        className="size-[18px]"
                        strokeWidth={2}
                        aria-hidden="true"
                      />
                      <span
                        aria-hidden="true"
                        className="absolute -right-1 -bottom-1 flex size-3.5 items-center justify-center rounded-full border border-white/80 bg-white text-zinc-700 shadow-sm dark:border-slate-500 dark:bg-slate-900 dark:text-slate-100"
                      >
                        <StateIcon className="size-2.5" strokeWidth={2.5} />
                      </span>
                      <span
                        aria-hidden="true"
                        className="absolute -top-2 -right-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border border-zinc-200 bg-white px-1 text-[9px] leading-none font-semibold text-zinc-800 shadow-sm dark:border-slate-500 dark:bg-slate-900 dark:text-slate-100"
                      >
                        {issue.complaintCount > 99
                          ? "99+"
                          : issue.complaintCount}
                      </span>
                    </button>
                  </MarkerContent>
                  <MarkerTooltip
                    anchor="bottom"
                    offset={30}
                    className={mapNoteClassName}
                  >
                    <div className="space-y-1.5">
                      <p className="truncate text-[10px] text-zinc-400">
                        <LocalizedText
                          text={CATEGORIES[issue.category].label}
                        />{" "}
                        · {localityName(issue.localityId)}
                      </p>
                      <p className="line-clamp-2 text-xs leading-5 font-medium">
                        <LocalizedText text={issue.title} />
                      </p>
                      <div className="flex items-center justify-between gap-2 text-[10px] text-zinc-300">
                        <span className="flex min-w-0 items-center gap-1.5">
                          <span
                            aria-hidden="true"
                            className={`size-1.5 shrink-0 rounded-full ${presentation.dot}`}
                          />
                          <LocalizedText text={presentation.label} />
                        </span>
                        <span className="shrink-0">
                          {issue.complaintCount}{" "}
                          <LocalizedText
                            text={
                              issue.complaintCount === 1 ? "report" : "reports"
                            }
                          />
                        </span>
                      </div>
                    </div>
                  </MarkerTooltip>
                </MapMarker>
              )
            })}
            {(showOffices ? offices : [])
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
                  <MarkerTooltip
                    anchor="bottom"
                    offset={28}
                    className={mapNoteClassName}
                  >
                    <LocalizedText text={office.name} />
                  </MarkerTooltip>
                </MapMarker>
              ))}
          </Map>
        </MapBoundary>
      )}
      {!offline && !forceOffline && (
        <div className="map-edge-depth" aria-hidden="true" />
      )}
      <details
        className="group absolute right-3 bottom-3 z-10"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.currentTarget.open = false
            event.currentTarget.querySelector("summary")?.focus()
          }
        }}
      >
        <summary
          className={buttonVariants({
            variant: "outline",
            size: "icon",
            className:
              "size-10 cursor-pointer list-none rounded-full group-open:text-primary [&::-webkit-details-marker]:hidden",
          })}
          title="Map key"
        >
          <Info className="size-4 group-open:hidden" aria-hidden="true" />
          <X className="hidden size-4 group-open:block" aria-hidden="true" />
          <span className="sr-only">
            <LocalizedText text="Map key" />
          </span>
        </summary>
        <div className="absolute right-0 bottom-full mb-2 max-h-[70dvh] w-60 max-w-[calc(100vw-6rem)] overflow-y-auto rounded-xl border bg-background p-4 shadow-[var(--surface-shadow)]">
          <h2 className="mb-3 text-sm font-semibold">
            <LocalizedText text="Map key" />
          </h2>
          <ul className="space-y-2.5">
            {Object.entries(caseStatus).map(([status, presentation]) => {
              const Icon = statusIcons[status as keyof typeof statusIcons]
              return (
                <li key={status} className="flex items-center gap-3 text-xs">
                  <span
                    aria-hidden="true"
                    className="flex size-6 shrink-0 items-center justify-center rounded-lg"
                    style={{
                      background: `linear-gradient(160deg, ${presentation.from}, ${presentation.to})`,
                      color: presentation.ink || "#ffffff",
                    }}
                  >
                    <Icon className="size-3.5" />
                  </span>
                  <LocalizedText text={presentation.label} />
                </li>
              )
            })}
            <li className="flex items-center gap-3 border-t pt-2.5 text-xs">
              <span
                aria-hidden="true"
                className="flex size-6 shrink-0 items-center justify-center rounded-lg border bg-muted/40"
              >
                <Building2 className="size-3.5" />
              </span>
              <LocalizedText text="Office location" />
            </li>
          </ul>
          <p className="mt-3 border-t pt-3 text-[11px] leading-relaxed text-muted-foreground">
            <LocalizedText text="Numbers show how many residents reported an issue." />
          </p>
        </div>
      </details>
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
