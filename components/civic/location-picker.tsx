"use client"

import { LocalizedText } from "@/components/language-provider"

import { Component, useEffect, type ReactNode } from "react"
import { LocateFixed, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Map,
  MapControls,
  MapMarker,
  MarkerContent,
  useMap,
} from "@/components/ui/map"

class PickerBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? (
      <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
        <LocalizedText text="Map unavailable. Open Coordinates below to enter the location." />
      </div>
    ) : (
      this.props.children
    )
  }
}
function PickerBehavior({
  localityId,
  lat,
  lng,
  disabled,
  onPick,
}: {
  localityId: string
  lat: number
  lng: number
  disabled: boolean
  onPick: (point: [number, number]) => void
}) {
  const { map } = useMap()
  useEffect(() => {
    if (!map) return
    const click = (event: {
      lngLat: { lng: number; lat: number }
      originalEvent: MouseEvent
    }) => {
      if (
        (event.originalEvent.target as HTMLElement)?.closest(
          ".maplibregl-marker,button"
        ) ||
        disabled
      )
        return
      onPick([event.lngLat.lng, event.lngLat.lat])
    }
    map.on("click", click)
    return () => {
      map.off("click", click)
    }
  }, [map, disabled, onPick])
  useEffect(() => {
    if (!map) return
    const frame = requestAnimationFrame(() => map.resize())
    return () => cancelAnimationFrame(frame)
  }, [map])
  // Only changing locality moves the camera; moving a pin should not move the map.
  useEffect(() => {
    if (map) map.flyTo({ center: [lng, lat], zoom: 14, duration: 450 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, localityId])
  return (
    !disabled && (
      <Button
        type="button"
        size="sm"
        variant="secondary"
        className="absolute bottom-2 left-2 z-10"
        onClick={() => {
          if (map) {
            const center = map.getCenter()
            onPick([center.lng, center.lat])
          }
        }}
      >
        <LocateFixed />
        <LocalizedText text="Use map centre" />
      </Button>
    )
  )
}
export function LocationPicker({
  localityId,
  lat,
  lng,
  disabled = false,
  onPick,
}: {
  localityId: string
  lat: number
  lng: number
  disabled?: boolean
  onPick: (point: [number, number]) => void
}) {
  return (
    <div className="relative h-64 overflow-hidden rounded-xl border bg-muted md:h-80">
      <PickerBoundary>
        <Map center={[lng, lat]} zoom={14} minZoom={9} maxZoom={19}>
          <MapControls position="top-right" />
          <PickerBehavior
            localityId={localityId}
            lat={lat}
            lng={lng}
            disabled={disabled}
            onPick={onPick}
          />
          <MapMarker
            longitude={lng}
            latitude={lat}
            draggable={!disabled}
            onDragEnd={(position) => onPick([position.lng, position.lat])}
          >
            <MarkerContent>
              <div className="flex size-10 items-center justify-center rounded-full border bg-primary text-primary-foreground shadow-sm">
                <MapPin className="size-5" />
              </div>
            </MarkerContent>
          </MapMarker>
        </Map>
      </PickerBoundary>
    </div>
  )
}
