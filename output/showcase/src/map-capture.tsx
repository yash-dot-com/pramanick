import React, {useEffect, useRef, useState} from 'react'
import {AbsoluteFill, Composition, continueRender, delayRender, registerRoot, staticFile} from 'remotion'
import * as maplibre from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

// The app's MapLibre engine, Carto Positron style and Pune location, without
// dashboard chrome. Capture once so every video frame uses the same map tiles.
function MapCapture() {
  const container = useRef<HTMLDivElement>(null)
  const [handle] = useState(() => delayRender('Load the civic basemap', {timeoutInMilliseconds: 90000}))
  useEffect(() => {
    maplibre.setWorkerUrl(new URL(staticFile("maplibre-gl-worker.mjs"), window.location.href).href)
    const map = new maplibre.Map({
      container: container.current!,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: [73.8135, 18.5096],
      zoom: 15.5,
      interactive: false,
      attributionControl: false,
      canvasContextAttributes: {preserveDrawingBuffer: true},
    })
    map.once('idle', () => continueRender(handle))
    return () => map.remove()
  }, [handle])
  return <AbsoluteFill ref={container} style={{background: '#f5f6f5'}} />
}
registerRoot(() => <Composition id="CivicMapCapture" component={MapCapture} width={1280} height={880} fps={30} durationInFrames={1} />)
