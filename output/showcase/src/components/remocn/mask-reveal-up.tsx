"use client"

import { Easing, interpolate, useCurrentFrame } from "remotion"

// Remocn source adapted to the brief's clean, masked entrance and held finish.
// Blur Out Up supplies the separate atmospheric exit treatment.

export interface MaskRevealUpProps {
  text: string
  distance?: number
  fontSize?: number
  color?: string
  fontWeight?: number
  fontFamily?: string
  speed?: number
  className?: string
}

export function MaskRevealUp({
  text,
  distance = 30,
  fontSize = 72,
  color = "#171717",
  fontWeight = 600,
  fontFamily = "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif",
  speed = 1,
  className,
}: MaskRevealUpProps) {
  const frame = useCurrentFrame() * speed

  const lines = text.split("\n")

  const enterDur = 23
  const enterTravel = 11
  const enterStagger = 3

  const enterEasing = Easing.bezier(0.22, 1, 0.36, 1)

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
      }}
    >
      <span
        className={className}
        style={{
          fontSize,
          fontWeight,
          color,
          letterSpacing: "-0.03em",
          lineHeight: 1.1,
          textAlign: "center",
          fontFamily,
        }}
      >
        {lines.map((line, i) => {
          const enterLocal = frame - i * enterStagger

          const enterP = interpolate(enterLocal, [0, enterDur], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: enterEasing,
          })

          const yEnter = interpolate(
            enterLocal,
            [0, enterTravel],
            [distance, 0],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: enterEasing,
            }
          )

          return (
            <span key={i} style={{ display: "block", overflow: "hidden" }}>
              <span
                style={{
                  display: "block",
                  opacity: enterP,
                  translate: `0 ${yEnter}px`,
                }}
              >
                {line}
              </span>
            </span>
          )
        })}
      </span>
    </div>
  )
}
