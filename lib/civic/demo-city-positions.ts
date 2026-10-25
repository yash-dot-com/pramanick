import { createHash } from "node:crypto"

export const DEMO_CITY_LAYOUT = "city-demo-scattered-v2"

// Reproducible fixture locations, never offsets applied to real reports.
export function demoCityPositions(
  area: { id: string; lat: number; lng: number },
  count: number
) {
  const metresPerDegree = 111_320
  const longitudeScale = Math.cos((area.lat * Math.PI) / 180)
  const positions: { lat: number; lng: number; north: number; east: number }[] =
    []
  for (let index = 0; index < count; index++) {
    for (let attempt = 0; attempt < 64; attempt++) {
      const hash = createHash("sha256")
        .update(`${DEMO_CITY_LAYOUT}:${area.id}:${index}:${attempt}`)
        .digest()
      const angle = (hash.readUInt32BE(0) / 2 ** 32) * Math.PI * 2
      const radius = 180 + (hash.readUInt32BE(4) / 2 ** 32) ** 0.7 * 1_420
      const north = Math.cos(angle) * radius
      const east = Math.sin(angle) * radius
      if (
        attempt < 63 &&
        positions.some(
          (point) => Math.hypot(point.north - north, point.east - east) < 220
        )
      )
        continue
      positions.push({
        lat: area.lat + north / metresPerDegree,
        lng: area.lng + east / (metresPerDegree * longitudeScale),
        north,
        east,
      })
      break
    }
  }
  return positions.map(({ lat, lng }) => ({ lat, lng }))
}
