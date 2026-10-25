"use client";

import { Easing, interpolate, useCurrentFrame } from "remotion";

export interface SoftBlurInProps {
  text: string;
  blur?: number;
  fontSize?: number;
  color?: string;
  fontWeight?: number;
  speed?: number;
  className?: string;
  fontFamily?: string;
  inline?: boolean;
}

export function SoftBlurIn({
  text,
  blur = 12,
  fontSize = 72,
  color = "#171717",
  fontWeight = 600,
  speed = 1,
  className,
  fontFamily = "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif",
  inline = false,
}: SoftBlurInProps) {
  const frame = useCurrentFrame() * speed;

  const chars = Array.from(text);
  const charDurationFrames = 27;
  const charTravelFrames = 9;
  const staggerFrames = 1;

  return (
    <div
      style={{
        position: inline ? "relative" : "absolute",
        inset: inline ? undefined : 0,
        display: inline ? "inline-flex" : "flex",
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
          fontFamily,
          whiteSpace: "nowrap",
        }}
      >
        {chars.map((char, i) => {
          const local = frame - i * staggerFrames;
          const easing = Easing.bezier(0.22, 1, 0.36, 1);
          const opacity = interpolate(local, [0, charDurationFrames], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing,
          });
          const y = interpolate(local, [0, charTravelFrames], [16, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing,
          });
          const blurAmount = interpolate(
            local,
            [0, charDurationFrames],
            [blur, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing },
          );
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                whiteSpace: "pre",
                backfaceVisibility: "hidden",
                transformOrigin: "50% 55%",
                opacity,
                translate: `0 ${y}px`,
                filter: `blur(${blurAmount}px)`,
              }}
            >
              {char}
            </span>
          );
        })}
      </span>
    </div>
  );
}
