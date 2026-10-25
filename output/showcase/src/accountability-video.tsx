import React from "react"
import {
  AbsoluteFill,
  Audio,
  Composition,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion"
import { TextReveal } from "../components/snap-cn/text-reveal"
import { ScreenRecording } from "../components/snap-cn/screen-recording"
import { CursorTrack } from "../components/snap-cn/cursor-track"
import { AgentSteps, type AgentStep } from "../components/snap-cn/agent-steps"
import { StatusCycle } from "../components/snap-cn/status-cycle"
import { WordCaptions } from "../components/snap-cn/word-captions"
import { AnnounceTitle } from "../components/snap-cn/announce-title"
import scenes from "./accountability-scenes.json"
import captions from "./accountability-captions.json"

const paper = "#efe9dc"
const ink = "#1d1a2f"
const blue = "#0862e8"
const accent = "#ff5b3a"
const theme = {
  background: paper,
  foreground: ink,
  primary: blue,
  primaryForeground: "#ffffff",
  card: "#fffdf7",
  mutedForeground: "#686271",
  border: "#d5cfc7",
  fontFamily: "Inter",
}
type Scene = (typeof scenes)[number]

/** The supplied shader's documented CSS fallback, not its gated WebGPU source. */
function GradientAmbience() {
  const seconds = useCurrentFrame() / 30
  return (
    <AbsoluteFill
      aria-hidden
      style={{
        backgroundColor: paper,
        backgroundImage: `radial-gradient(ellipse 48% 38% at ${12 + Math.sin(seconds / 9) * 10}% ${78 + Math.cos(seconds / 12) * 12}%, #ff5b3a55, transparent 80%), radial-gradient(ellipse 45% 36% at ${91 + Math.sin(seconds / 13) * 8}% ${15 + Math.cos(seconds / 10) * 10}%, #65558d42, transparent 78%), radial-gradient(ellipse 70% 65% at 50% 45%, #fffdf5 15%, transparent 78%)`,
      }}
    />
  )
}

/** Layout only: every authored foreground visual is a supplied SnapCN component. */
function Type({
  text,
  y,
  size = 36,
  serif = false,
  color = ink,
  delay = 0,
  height = 100,
}: {
  text: string
  y: number
  size?: number
  serif?: boolean
  color?: string
  delay?: number
  height?: number
}) {
  return (
    <Sequence from={delay} layout="none">
      <div
        style={{ position: "absolute", left: 60, right: 60, top: y, height }}
      >
        <TextReveal
          text={text}
          fontSize={size}
          fontFamily={serif ? "Instrument Serif" : "Inter"}
          fontWeight={serif ? 400 : 500}
          color={color}
          initialScale={1.08}
          introDuration={7}
          holdDuration={8}
          recedeDuration={13}
          assembleDuration={20}
          wordDelay={1}
          wordStagger={2}
          wordDuration={10}
          wordPush={0.2}
          theme={theme}
        />
      </div>
    </Sequence>
  )
}

function Shot({
  file,
  y = 390,
  height = 490,
  aspect = 16 / 9,
  crop,
  zoom = 1.1,
  left = 55,
  width,
}: {
  file: string
  y?: number
  height?: number
  aspect?: number
  crop?: { top?: number; right?: number; bottom?: number; left?: number }
  zoom?: number
  left?: number
  width?: number
}) {
  const { width: compositionWidth, height: compositionHeight } =
    useVideoConfig()
  const boxWidth = width ?? compositionWidth - left * 2
  const correctedAspect =
    (aspect * (compositionWidth / compositionHeight)) / (boxWidth / height)
  return (
    <div
      style={{
        position: "absolute",
        left,
        width: boxWidth,
        top: y,
        height,
        overflow: "hidden",
        borderRadius: 28,
      }}
    >
      <CursorTrack
        size={32}
        color={ink}
        ringColor={blue}
        path={[
          { at: 25, x: 0.78, y: 0.75, duration: 24 },
          { at: 100, x: 0.56, y: 0.58, duration: 30, click: true },
        ]}
      >
        <ScreenRecording
          src={staticFile(`shots/${file}`)}
          sourceAspect={correctedAspect}
          crop={crop}
          radius={28}
          fit="contain"
          backdropColor={paper}
          entrance="fade"
          camera={[
            { at: 12, duration: 48, zoom, x: 0.5, y: 0.5 },
            { at: 125, duration: 60, zoom: zoom, x: 0.5, y: 0.55 },
          ]}
          theme={theme}
        />
      </CursorTrack>
    </div>
  )
}

function Steps({
  query,
  result,
  steps,
  centerY = 0.68,
}: {
  query: string
  result: string
  steps: AgentStep[]
  centerY?: number
}) {
  return (
    <AbsoluteFill style={{ clipPath: "inset(365px 30px 185px 30px)" }}>
      <AgentSteps
        query={query}
        result={result}
        steps={steps}
        queryHold={0.5}
        stepHold={1.05}
        finalHold={1.1}
        centerY={centerY}
        paperColor="transparent"
        glowRadius={0}
        pillColor="#fffdf5"
        inkColor={ink}
        stepColor="#686271"
        accentColor={blue}
        fontFamily="Inter"
        theme={theme}
      />
    </AbsoluteFill>
  )
}

function Beat({ scene, index }: { scene: Scene; index: number }) {
  const frame = useCurrentFrame()
  const ending = scene.id === "end"
  return (
    <AbsoluteFill>
      {!ending && (
        <>
          <Type text="PRAMANIK" y={22} size={20} color={ink} height={40} />
          <Type
            text={`${String(index + 1).padStart(2, "0")} / AUTONOMOUS ACCOUNTABILITY`}
            y={65}
            size={13}
            color="#686271"
            height={45}
          />
          {scene.title.map((line, i) => (
            <Type
              key={line}
              text={line}
              y={135 + i * 78}
              size={scene.id === "agents" ? 68 : 75}
              serif
              delay={i * 7}
              height={90}
            />
          ))}
          <Type
            text={scene.technical}
            y={310}
            size={scene.id === "jobs" ? 20 : 22}
            color={blue}
            delay={15}
            height={65}
          />
        </>
      )}
      {scene.id === "hook" && (
        <>
          <div
            style={{
              position: "absolute",
              inset: 0,
              clipPath: "inset(380px 0 230px 0)",
            }}
          >
            <StatusCycle
              prefix="Case"
              statuses={["Reported", "Waiting", "Still waiting"]}
              chips={["A report", "A promise", "A next step"]}
              fieldColor="transparent"
              pageColor="transparent"
              pillColor={ink}
              pillLabelColor={paper}
              prefixColor={ink}
              chipFills={["#fffdf5", "#e7e6ff", "#ffb49f"]}
              chipTextColor={ink}
              fontSize={60}
              chipFontSize={62}
              introFrames={12}
              statusHold={42}
              startAt={0}
              fontFamily="Inter"
              theme={theme}
            />
          </div>
          <Type
            text="Public services need follow-through."
            y={885}
            size={34}
            delay={45}
          />
        </>
      )}
      {scene.id === "identity" && (
        <>
          <Sequence from={18} layout="none">
            <Shot
              file="office-wide.png"
              crop={{ top: 0.12, bottom: 0.28, left: 0.26, right: 0.26 }}
              y={385}
              height={470}
              zoom={1}
            />
          </Sequence>
          <Type
            text="Report. Remember. Call. Verify."
            y={885}
            size={38}
            delay={35}
          />
        </>
      )}
      {scene.id === "reports" && (
        <>
          {frame < 165 ? (
            <Steps
              query="One water leak. Multiple reports."
              result="One shared case"
              steps={[
                {
                  running: "Reading resident observations…",
                  done: "Related reports identified",
                  icon: "check",
                },
                {
                  running: "Linking reports and evidence…",
                  done: "Evidence attached to the case",
                  icon: "check",
                },
                {
                  running: "Preserving each source…",
                  done: "Case history ready",
                  icon: "check",
                },
              ]}
            />
          ) : (
            <Sequence from={165} layout="none">
              <Shot
                file="office-wide.png"
                crop={{ top: 0.48, bottom: 0.28, left: 0.11, right: 0.63 }}
                y={385}
                height={470}
                zoom={1}
              />
            </Sequence>
          )}
          <Type
            text="Each observation keeps its source."
            y={885}
            size={32}
            delay={30}
          />
        </>
      )}
      {scene.id === "memory" && (
        <>
          <Shot
            file="office-wide.png"
            crop={{ top: 0.49, bottom: 0.28, left: 0.375, right: 0.375 }}
            y={385}
            height={470}
            zoom={1}
          />
          <Type
            text="get_complaint_details · get_issue_timeline"
            y={875}
            size={27}
            delay={70}
            color={blue}
          />
        </>
      )}
      {scene.id === "agents" && (
        <>
          {frame < 165 ? (
            <Steps
              query="Three specialists. Parallel review."
              result="Coordinator: action plan saved"
              steps={[
                {
                  running: "Reports + history + responsibility…",
                  done: "Three structured findings returned",
                  icon: "globe",
                  hold: 1.6,
                },
                {
                  running: "Checking cited source records…",
                  done: "Findings grounded in the case",
                  icon: "check",
                },
                {
                  running: "Combining findings into a plan…",
                  done: "Action plan ready",
                  icon: "check",
                },
              ]}
            />
          ) : (
            <Sequence from={165} layout="none">
              <Shot
                file="office-wide.png"
                crop={{ top: 0.27, bottom: 0.28, left: 0.1, right: 0.1 }}
                y={385}
                height={470}
                zoom={1}
              />
            </Sequence>
          )}
          <Type
            text="Shared evidence. Distinct responsibilities."
            y={885}
            size={31}
            delay={35}
          />
        </>
      )}
      {scene.id === "call" && (
        <>
          <Shot
            file="calls-landscape.png"
            crop={{ top: 0.62, bottom: 0.02, left: 0.025, right: 0.025 }}
            y={385}
            height={470}
            zoom={1}
          />
          <Type
            text="Action + deadline → record_commitment"
            y={870}
            size={29}
            delay={85}
            color={blue}
            height={50}
          />
          <Type
            text="Illustrative conversation · synthetic voices"
            y={930}
            size={17}
            delay={0}
            color="#686271"
            height={30}
          />
        </>
      )}
      {scene.id === "jobs" && (
        <>
          <Steps
            query="A promise with a deadline"
            result="Next review scheduled"
            steps={[
              {
                running: "Validating the tool arguments…",
                done: "Structured commitment saved",
                icon: "check",
              },
              {
                running: "Persisting the next task…",
                done: "deadline_review job queued",
                icon: "check",
              },
              {
                running: "Waiting for its due time…",
                done: "Worker processes due work",
                icon: "check",
                hold: 2,
              },
            ]}
          />
          <Type
            text="Persistent queue. Exclusive worker claims."
            y={885}
            size={30}
            delay={80}
          />
        </>
      )}
      {scene.id === "verify" && (
        <>
          <Shot
            file="survey.png"
            aspect={870 / 743}
            crop={{ right: 0.55, top: 0.14, bottom: 0.15 }}
            y={385}
            height={470}
            zoom={1}
            left={65}
            width={440}
          />
          <div
            style={{
              position: "absolute",
              left: 560,
              right: 55,
              top: 385,
              height: 470,
              overflow: "hidden",
            }}
          >
            <AgentSteps
              query="Officer reports completion"
              steps={[
                {
                  running: "Collecting resident observations…",
                  done: "Resident evidence submitted",
                  icon: "check",
                },
                {
                  running: "Assessing before / after photos…",
                  done: "Advisory assessment saved",
                  icon: "check",
                },
                {
                  running: "Awaiting resident review…",
                  done: "Resident review required",
                  icon: "check",
                  hold: 3,
                },
              ]}
              result="Resident review"
              queryHold={0.4}
              stepHold={1.1}
              finalHold={2}
              centerY={0.28}
              paperColor="transparent"
              glowRadius={0}
              theme={theme}
              fontFamily="Inter"
            />
          </div>
          <Type
            text="AI advises. Residents review."
            y={875}
            size={38}
            delay={45}
            color={blue}
          />
        </>
      )}
      {ending && (
        <>
          <AnnounceTitle
            eyebrow="Built by Yash"
            title="Pramanik"
            tagline="Accountability that follows through."
            fontFamily="Instrument Serif"
            symbolPath=""
            voidColor={paper}
            fieldColor="#ffc5b0"
            paperColor={paper}
            titleColor={ink}
            nightColor={paper}
            inkColor={ink}
            taglineColor={ink}
            glowColor={accent}
            glowStrength={0.15}
            speed={1}
          />
          <Type text="Pramanik" y={300} size={100} serif delay={105} />
          <Type text="Built by Yash" y={735} size={26} delay={105} />
          <Type
            text="pramanick.vercel.app"
            y={810}
            size={36}
            color={blue}
            delay={105}
          />
          <Type
            text="github.com/yash-dot-com/pramanick"
            y={875}
            size={22}
            color={ink}
            delay={105}
            height={60}
          />
        </>
      )}
      {!ending && scene.id !== "hook" && (
        <Type
          text="ACTUAL PRODUCT UI · ILLUSTRATIVE CASE RECORDS"
          y={1022}
          size={17}
          color="#686271"
          height={45}
        />
      )}
      <Audio src={staticFile(`accountability/voice-${index}.mp3`)} />
    </AbsoluteFill>
  )
}

function Film() {
  return (
    <AbsoluteFill>
      <GradientAmbience />
      {scenes.map((scene, index) => (
        <Sequence
          key={scene.id}
          from={scene.start * 30}
          durationInFrames={scene.duration * 30}
        >
          <Beat scene={scene} index={index} />
        </Sequence>
      ))}
      <Audio src={staticFile("accountability/music.wav")} volume={0.12} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          transform: "translateY(45px)",
        }}
      >
        <WordCaptions
          captions={captions}
          preset="clean"
          maxWords={6}
          maxChars={43}
          fontSize={29}
          maxWidth={1200}
          fontFamily="Inter"
          aspect="16:9"
          textColor={ink}
          pillColor="#fffdf5ed"
          accentColor={blue}
          strokeRatio={0}
          theme={theme}
        />
      </div>
    </AbsoluteFill>
  )
}

export const AccountabilityRoot = () => (
  <Composition
    id="PramanikAccountability75"
    component={Film}
    durationInFrames={2250}
    fps={30}
    width={1440}
    height={1080}
  />
)
