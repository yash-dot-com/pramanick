export type DeviceObservation = {
  lat: number
  lng: number
  accuracy: number
  observedAt: string
  source: "device"
}

export function captureDeviceLocation(): Promise<DeviceObservation> {
  return new Promise((resolve, reject) => {
    if (!window.isSecureContext || !navigator.geolocation) {
      reject(
        new Error(
          "Device location needs HTTPS or localhost and a browser with location support."
        )
      )
      return
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        resolve({
          lat: coords.latitude,
          lng: coords.longitude,
          accuracy: coords.accuracy,
          observedAt: new Date().toISOString(),
          source: "device",
        }),
      (error) =>
        reject(
          new Error(
            error.code === 1
              ? "Allow location access in your browser, then try again."
              : "Could not get a fresh device location. Try near a window or outdoors."
          )
        ),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20_000 }
    )
  })
}
