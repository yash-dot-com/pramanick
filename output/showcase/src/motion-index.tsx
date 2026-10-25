import React from "react"
import { loadFont } from "@remotion/google-fonts/InstrumentSerif"
import { loadFont as loadInter } from "@remotion/google-fonts/Inter"
import { AbsoluteFill, Composition, Sequence, registerRoot } from "remotion"
import { BlurOutUp } from "./components/remocn/blur-out-up"
import { WordStream, wordStreamLength } from "./components/remocn/word-stream"
import { WordPush, wordPushLength } from "./components/remocn/word-push"
import { MaskRevealUp } from "./components/remocn/mask-reveal-up"
import { RollingNumber } from "./components/remocn/rolling-number"
import { InfiniteBentoPan } from "./components/remocn/infinite-bento-pan"
import { motionCanvas, motionColors } from "./motion-theme"

const { fontFamily } = loadFont("normal", {
  weights: ["400"],
  subsets: ["latin"],
})
const { fontFamily: labelFont } = loadInter("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
})

// Isolated component study. The new explainer will be assembled after the
// remaining component choices; the old film's entry points stay intact.
function BlurOutUpStudy() {
  return (
    <AbsoluteFill style={{ backgroundColor: motionColors.background }}>
      <AbsoluteFill style={{ left: 80, right: 80, width: "auto" }}>
        <BlurOutUp
          text="Accountability that follows through."
          fontFamily={fontFamily}
          fontWeight={400}
          fontSize={72}
          color={motionColors.foreground}
          staggerDelay={1}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

function Paper({ children }: { children: React.ReactNode }) {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: motionColors.background,
        color: motionColors.foreground,
        fontFamily: labelFont,
      }}
    >
      {children}
    </AbsoluteFill>
  )
}

const thesis = "India has complaints. | What's missing? | Follow-through."
const closing = "Accountability that follows through."

function WordStreamStudy() {
  return (
    <Paper>
      <WordStream
        text={thesis}
        wordGap={10}
        hold={20}
        drift={0.4}
        fontFamily={fontFamily}
        fontSize={72}
        color={motionColors.foreground}
      />
    </Paper>
  )
}

function WordPushStudy() {
  return (
    <Paper>
      <WordPush
        text={closing}
        wordGap={12}
        accel={0.85}
        fontFamily={fontFamily}
        fontSize={72}
        color={motionColors.foreground}
      />
    </Paper>
  )
}

function MaskRevealUpStudy() {
  return (
    <Paper>
      <MaskRevealUp
        text={"Three specialists.\nWorking in parallel."}
        fontFamily={fontFamily}
        fontWeight={400}
        fontSize={72}
        distance={30}
      />
    </Paper>
  )
}

function ComplaintBacklogStudy() {
  return (
    <Paper>
      <div
        style={{
          position: "absolute",
          top: 88,
          left: 80,
          right: 80,
          height: 100,
        }}
      >
        <MaskRevealUp
          text="Reports keep coming."
          fontFamily={fontFamily}
          fontWeight={400}
          fontSize={64}
        />
      </div>
      <div
        style={{
          position: "absolute",
          left: 96,
          top: 245,
          width: 480,
          height: 190,
        }}
      >
        <Sequence from={24} durationInFrames={96} layout="none">
          <RollingNumber
            from={0}
            to={128}
            fontSize={120}
            color={motionColors.active}
          />
          <div
            style={{
              position: "absolute",
              top: 180,
              width: "100%",
              textAlign: "center",
              fontSize: 30,
            }}
          >
            Reports
          </div>
        </Sequence>
      </div>
      <div
        style={{
          position: "absolute",
          right: 96,
          top: 245,
          width: 480,
          height: 190,
        }}
      >
        <Sequence from={28} durationInFrames={92} layout="none">
          <RollingNumber
            from={0}
            to={0}
            fontSize={120}
            color={motionColors.pending}
          />
          <div
            style={{
              position: "absolute",
              top: 180,
              width: "100%",
              textAlign: "center",
              fontSize: 30,
            }}
          >
            Verified fixes
          </div>
        </Sequence>
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 90,
          width: "100%",
          textAlign: "center",
          fontSize: 22,
          color: motionColors.surface,
        }}
      >
        Illustrative backlog · not national statistics
      </div>
    </Paper>
  )
}

function BentoPanStudy() {
  return (
    <AbsoluteFill style={{ backgroundColor: motionColors.darkBackground }}>
      <InfiniteBentoPan panSpeed={0.25} accentColor={motionColors.active} />
      <div
        style={{
          position: "absolute",
          bottom: 54,
          left: 64,
          right: 64,
          color: motionColors.onDark,
          fontFamily: labelFont,
          fontSize: 22,
          backgroundColor: motionColors.darkBackground,
          padding: 18,
        }}
      >
        Component study only · generated filler · excluded from the explainer
      </div>
    </AbsoluteFill>
  )
}

function MotionStudiesRoot() {
  return (
    <>
      <Composition
        id="BlurOutUpStudy"
        component={BlurOutUpStudy}
        durationInFrames={90}
        {...motionCanvas}
      />
      <Composition
        id="WordStreamStudy"
        component={WordStreamStudy}
        durationInFrames={Math.max(120, wordStreamLength(thesis, 10, 20) + 30)}
        {...motionCanvas}
      />
      <Composition
        id="WordPushStudy"
        component={WordPushStudy}
        durationInFrames={Math.max(90, wordPushLength(closing, 12, 0.85) + 31)}
        {...motionCanvas}
      />
      <Composition
        id="MaskRevealUpStudy"
        component={MaskRevealUpStudy}
        durationInFrames={90}
        {...motionCanvas}
      />
      <Composition
        id="ComplaintBacklogStudy"
        component={ComplaintBacklogStudy}
        durationInFrames={120}
        {...motionCanvas}
      />
      <Composition
        id="BentoPanStudy"
        component={BentoPanStudy}
        durationInFrames={300}
        {...motionCanvas}
      />
    </>
  )
}

registerRoot(MotionStudiesRoot)
