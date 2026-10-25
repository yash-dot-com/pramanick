import React, { type CSSProperties } from "react"
import {
  AbsoluteFill,
  Audio,
  Composition,
  Easing,
  Img,
  Sequence,
  interpolate,
  registerRoot,
  staticFile,
  useCurrentFrame,
} from "remotion"
import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif"
import { loadFont as loadInter } from "@remotion/google-fonts/Inter"
import {
  User,
  FileText,
  MapPin,
  Brain,
  Building,
  Phone,
  Calendar,
  Check,
  Users,
  Eye,
  Camera,
  RefreshCw,
  Volume2,
  Clock,
  MessageCircle,
} from "lucide-react"
import { WordStream } from "./components/remocn/word-stream"
import { WordPush } from "./components/remocn/word-push"
import { MaskRevealUp } from "./components/remocn/mask-reveal-up"
import { BlurOutUp } from "./components/remocn/blur-out-up"
import { RollingNumber } from "./components/remocn/rolling-number"
import { motionColors as C, motionCanvas } from "./motion-theme"
import scenes from "./follow-through-scenes.json"

const serif = loadSerif("normal", {
  weights: ["400"],
  subsets: ["latin"],
}).fontFamily
const sans = loadInter("normal", {
  weights: ["400", "500", "600"],
  subsets: ["latin"],
}).fontFamily
const ease = Easing.inOut(Easing.cubic)
const enterEase = Easing.out(Easing.cubic)
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const
const progress = (f: number, from: number, duration = 24) =>
  interpolate(f, [from, from + duration], [0, 1], {
    ...clamp,
    easing: enterEase,
  })
const fade = (f: number, from: number, to: number, tail = 16) =>
  progress(f, from, 12) * (1 - progress(f, to - tail, tail))

function Text({
  x,
  y,
  width = 360,
  children,
  size = 26,
  color = C.foreground,
  style = {},
}: {
  x: number
  y: number
  width?: number
  children: React.ReactNode
  size?: number
  color?: string
  style?: CSSProperties
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: x - width / 2,
        top: y,
        width,
        textAlign: "center",
        fontFamily: sans,
        fontSize: size,
        lineHeight: 1.35,
        color,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

function Appear({
  at,
  children,
  duration = 20,
  style = {},
}: {
  at: number
  children: React.ReactNode
  duration?: number
  style?: CSSProperties
}) {
  const f = useCurrentFrame()
  const p = progress(f, at, duration)
  return (
    <div
      style={{
        opacity: p,
        transform: `translateY(${(1 - p) * 12}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

function Node({
  x,
  y = 370,
  at,
  label,
  detail,
  icon: Icon,
  color = C.foreground,
  size = 72,
}: {
  x: number
  y?: number
  at: number
  label: string
  detail?: string
  icon: typeof User
  color?: string
  size?: number
}) {
  return (
    <Appear at={at}>
      <div
        style={{
          position: "absolute",
          left: x - size / 2,
          top: y - size / 2,
          width: size,
          height: size,
          borderRadius: "50%",
          border: `1.5px solid ${color}`,
          background: C.background,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={size * 0.42} strokeWidth={1.5} color={color} />
      </div>
      <Text
        x={x}
        y={y + size / 2 + 18}
        width={300}
        size={26}
        style={{ fontWeight: 500 }}
      >
        {label}
      </Text>
      {detail && (
        <Text
          x={x}
          y={y + size / 2 + 58}
          width={320}
          size={21}
          color={C.surface}
        >
          {detail}
        </Text>
      )}
    </Appear>
  )
}

function Edge({
  d,
  at,
  duration = 40,
  color = C.active,
  dashed = false,
}: {
  d: string
  at: number
  duration?: number
  color?: string
  dashed?: boolean
}) {
  const f = useCurrentFrame()
  const p = progress(f, at, duration)
  const id = `a-${at}-${color.replace("#", "")}`
  return (
    <g opacity={p > 0 ? 1 : 0}>
      <defs>
        <marker
          id={id}
          markerWidth="9"
          markerHeight="9"
          refX="7"
          refY="4.5"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path
            d="M1 1 L7 4.5 L1 8"
            fill="none"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </marker>
      </defs>
      <path
        d={d}
        pathLength={1}
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeDasharray={dashed ? "0.018 0.014" : "1"}
        strokeDashoffset={dashed ? 0 : 1 - p}
        opacity={dashed ? p : 1}
        markerEnd={p > 0.98 ? `url(#${id})` : undefined}
      />
    </g>
  )
}

function Packet({
  from,
  to,
  start,
  duration,
  color = C.active,
  radius = 6,
  controls,
}: {
  from: [number, number]
  to: [number, number]
  start: number
  duration: number
  color?: string
  radius?: number
  controls?: [[number, number], [number, number]]
}) {
  const f = useCurrentFrame()
  if (f < start || f > start + duration) return null
  const p = interpolate(f, [start, start + duration], [0, 1], {
    ...clamp,
    easing: ease,
  })
  const point = (axis: 0 | 1) =>
    controls
      ? (1 - p) ** 3 * from[axis] +
        3 * (1 - p) ** 2 * p * controls[0][axis] +
        3 * (1 - p) * p * p * controls[1][axis] +
        p ** 3 * to[axis]
      : from[axis] + (to[axis] - from[axis]) * p
  return (
    <circle
      cx={point(0)}
      cy={point(1)}
      r={radius}
      fill={color}
      stroke={C.background}
      strokeWidth={3}
    />
  )
}

function Title({
  from,
  duration,
  text,
  kind = "mask",
  size = 66,
  y = 70,
  holdEnd = false,
}: {
  from: number
  duration: number
  text: string
  kind?: "mask" | "blur" | "push" | "stream"
  size?: number
  y?: number
  holdEnd?: boolean
}) {
  const f = useCurrentFrame()
  return (
    <Sequence from={from} durationInFrames={duration} layout="none">
      <div
        style={{
          position: "absolute",
          left: 80,
          right: 80,
          top: y,
          height: 156,
          opacity: holdEnd
            ? progress(f, from, 12)
            : fade(f, from, from + duration, kind === "blur" ? 4 : 18),
        }}
      >
        {kind === "mask" && (
          <MaskRevealUp
            text={text}
            fontFamily={serif}
            fontWeight={400}
            fontSize={size}
            color={C.foreground}
            distance={24}
          />
        )}
        {kind === "blur" && (
          <BlurOutUp
            text={text}
            fontFamily={serif}
            fontWeight={400}
            fontSize={size}
            color={C.foreground}
            staggerDelay={1}
          />
        )}
        {kind === "push" && (
          <WordPush
            text={text}
            fontFamily={serif}
            fontWeight={400}
            fontSize={size}
            color={C.foreground}
            wordGap={12}
            accel={0.85}
          />
        )}
        {kind === "stream" && (
          <WordStream
            text={text}
            fontFamily={serif}
            fontWeight={400}
            fontSize={size}
            color={C.foreground}
            wordGap={10}
            hold={28}
            drift={0.3}
          />
        )}
      </div>
    </Sequence>
  )
}

function Footer({
  from,
  to,
  text,
}: {
  from: number
  to: number
  text: string
}) {
  const f = useCurrentFrame()
  return (
    <div
      style={{
        position: "absolute",
        left: 80,
        right: 80,
        bottom: 48,
        textAlign: "center",
        fontSize: 22,
        color: C.surface,
        opacity: fade(f, from, to),
      }}
    >
      {text}
    </div>
  )
}

function Opening() {
  const f = useCurrentFrame()
  return (
    <>
      <Title
        from={0}
        duration={105}
        kind="stream"
        text="India has a | follow-up problem."
        size={86}
        y={265}
      />
      <Sequence from={105} durationInFrames={105} layout="none">
        <div style={{ opacity: fade(f, 105, 210) }}>
          <div
            style={{
              position: "absolute",
              left: 80,
              right: 80,
              top: 115,
              height: 100,
            }}
          >
            <MaskRevealUp
              text="Complaints don’t fix themselves."
              fontFamily={serif}
              fontWeight={400}
              fontSize={62}
            />
          </div>
          <Sequence from={12} durationInFrames={93} layout="none">
            <div
              style={{
                position: "absolute",
                left: 225,
                top: 270,
                width: 330,
                height: 190,
              }}
            >
              <RollingNumber
                from={0}
                to={128}
                fontSize={118}
                color={C.active}
              />
              <div
                style={{
                  position: "absolute",
                  top: 190,
                  width: "100%",
                  textAlign: "center",
                  fontSize: 28,
                }}
              >
                Complaints
              </div>
            </div>
          </Sequence>
          <Sequence from={16} durationInFrames={89} layout="none">
            <div
              style={{
                position: "absolute",
                right: 225,
                top: 270,
                width: 330,
                height: 190,
              }}
            >
              <RollingNumber from={0} to={0} fontSize={118} color={C.pending} />
              <div
                style={{
                  position: "absolute",
                  top: 190,
                  width: "100%",
                  textAlign: "center",
                  fontSize: 28,
                }}
              >
                Verified fixes
              </div>
            </div>
          </Sequence>
          <Text x={640} y={590} size={22} width={900} color={C.surface}>
            Illustrative example · not national statistics
          </Text>
        </div>
      </Sequence>
      <Title
        from={210}
        duration={195}
        kind="push"
        text="Pramanik."
        size={112}
        y={210}
      />
      <Sequence from={234} durationInFrames={171} layout="none">
        <div
          style={{
            position: "absolute",
            top: 386,
            left: 130,
            right: 130,
            height: 110,
            opacity: fade(f, 234, 405),
          }}
        >
          <MaskRevealUp
            text={
              "An accountability office.\nPowered by autonomous voice agents."
            }
            fontFamily={sans}
            fontSize={30}
            fontWeight={400}
            distance={18}
          />
        </div>
      </Sequence>
      <Sequence from={405} durationInFrames={135} layout="none">
        <div style={{ opacity: fade(f, 405, 540) }}>
          <Title
            from={0}
            duration={135}
            text="Follow-through, made public."
            size={70}
            y={150}
          />
          {[
            { x: 300, icon: Phone, label: "Call officers" },
            { x: 640, icon: Clock, label: "Track promises" },
            { x: 980, icon: Eye, label: "Publish progress" },
          ].map((n, i) => (
            <Node
              key={n.label}
              x={n.x}
              y={365}
              at={18 + i * 4}
              icon={n.icon}
              label={n.label}
              color={i === 2 ? C.foreground : C.active}
            />
          ))}
        </div>
      </Sequence>
    </>
  )
}

function World() {
  const f = useCurrentFrame()
  const camera = interpolate(
    f,
    [540, 828, 876, 1230, 1290, 1500, 1560, 1830, 1890, 2220, 2280, 2550],
    [0, 0, 1280, 1280, 2560, 2560, 3840, 3840, 5120, 5120, 6400, 6400],
    { ...clamp, easing: ease }
  )
  const opacity = progress(f, 540, 18) * (1 - progress(f, 2526, 24))
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: 7680,
        height: 720,
        transform: `translateX(${-camera}px)`,
        opacity,
      }}
    >
      <svg
        width={7680}
        height={720}
        style={{ position: "absolute", inset: 0, overflow: "visible" }}
      >
        <Edge d="M220 370 H386" at={590} />
        <Edge d="M615 370 H970" at={710} duration={60} />
        <Edge d="M1050 370 H1490" at={800} duration={65} />
        {[240, 370, 500].map((y, i) => (
          <React.Fragment key={y}>
            <Edge
              d={`M1570 370 C1660 370 1690 ${y} 1840 ${y}`}
              at={932 + i * 4}
              duration={40}
            />
            <Edge
              d={`M1920 ${y} C2040 ${y} 2060 370 2200 370`}
              at={1080 + i * 20}
              duration={50}
            />
            <Packet
              from={[1570, 370]}
              to={[1840, y]}
              start={984}
              duration={58}
              controls={[
                [1660, 370],
                [1690, y],
              ]}
            />
            <Packet
              from={[1920, y]}
              to={[2200, 370]}
              start={1090 + i * 20}
              duration={55}
              controls={[
                [2040, y],
                [2060, 370],
              ]}
            />
          </React.Fragment>
        ))}
        <Edge d="M2280 370 H2730" at={1190} duration={80} />
        <Edge d="M2810 370 H3450" at={1325} duration={55} />
        <Edge d="M3530 370 H4010" at={1470} duration={75} />
        <Edge d="M4090 370 H4420" at={1605} duration={50} />
        <Edge d="M4500 370 H4790" at={1700} duration={45} />
        <Edge
          d="M4830 430 C4830 565 4110 565 4050 430"
          at={1750}
          duration={65}
          color={C.followUp}
        />
        <Packet
          from={[4830, 430]}
          to={[4050, 430]}
          controls={[
            [4830, 565],
            [4110, 565],
          ]}
          start={1760}
          duration={70}
          color={C.followUp}
        />
        <Edge d="M4870 370 H5310" at={1800} duration={75} />
        <Edge d="M5390 370 H5700" at={1930} duration={55} />
        <Edge d="M5780 370 H6040" at={2020} duration={45} />
        <Edge
          d="M6110 340 C6160 300 6220 300 6240 300"
          at={2120}
          duration={45}
          color={C.confirmed}
        />
        <Edge
          d="M6060 338 C5960 220 5470 220 5350 334"
          at={2155}
          duration={55}
          color={C.followUp}
        />
        <Edge d="M6120 370 H6610" at={2200} duration={80} />
        <Edge d="M6690 350 H7000" at={2330} duration={45} />
        <Edge d="M7080 350 H7390" at={2334} duration={45} />
        <Packet from={[220, 370]} to={[390, 370]} start={620} duration={55} />
        <Packet from={[615, 370]} to={[970, 370]} start={750} duration={62} />
        <Packet
          from={[1050, 370]}
          to={[1490, 370]}
          start={828}
          duration={48}
          radius={8}
        />
        <Packet
          from={[2280, 370]}
          to={[2730, 370]}
          start={1230}
          duration={60}
          radius={8}
        />
        <Packet
          from={[3530, 370]}
          to={[4010, 370]}
          start={1500}
          duration={60}
          radius={8}
        />
        <Packet
          from={[4090, 370]}
          to={[4420, 370]}
          start={1630}
          duration={65}
        />
        <Packet
          from={[4500, 370]}
          to={[4790, 370]}
          start={1730}
          duration={60}
        />
        <Packet
          from={[4870, 370]}
          to={[5310, 370]}
          start={1830}
          duration={60}
          radius={8}
        />
        <Packet
          from={[5390, 370]}
          to={[5700, 370]}
          start={1960}
          duration={65}
        />
        <Packet
          from={[5780, 370]}
          to={[6040, 370]}
          start={2050}
          duration={55}
        />
        <Packet
          from={[6120, 370]}
          to={[6610, 350]}
          start={2220}
          duration={60}
          radius={8}
        />
      </svg>

      {/* One complaint becomes a case; only the cropped map uses product pixels. */}
      <Node
        x={180}
        at={567}
        icon={User}
        label="Resident"
        detail="Reports a water leak"
      />
      <Appear at={630}>
        <div
          style={{
            position: "absolute",
            left: 390,
            top: 296,
            width: 225,
            height: 148,
            border: `1px solid ${C.foreground}`,
            borderRadius: 8,
            background: C.background,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 14,
          }}
        >
          <FileText size={32} strokeWidth={1.5} />
          <div>
            <div style={{ fontSize: 27, fontWeight: 500 }}>Water leak</div>
            <div style={{ fontSize: 21, marginTop: 10, color: C.surface }}>
              Location + photo
            </div>
          </div>
        </div>
      </Appear>
      <Appear at={704}>
        <div
          style={{
            position: "absolute",
            left: 835,
            top: 240,
            width: 350,
            height: 250,
            overflow: "hidden",
            borderRadius: 8,
            border: "1px solid #27272a",
          }}
        >
          <Img
            src={staticFile("shots/map.png")}
            style={{
              position: "absolute",
              width: 870,
              height: 743,
              maxWidth: "none",
              left: -420,
              top: -240,
              opacity: 0.55,
            }}
          />
        </div>
      </Appear>
      <Node
        x={1010}
        at={750}
        icon={FileText}
        label="Shared case"
        color={C.active}
      />
      <Appear at={770}>
        <Text x={1010} y={548} width={440} size={23}>
          Reports · Photos · Earlier promises
        </Text>
      </Appear>

      {/* Fork and join: three distinct paths run concurrently. */}
      <Node x={1530} at={886} icon={Brain} label="Coordinator" />
      <Node x={1880} y={240} at={928} icon={Users} label="Reports" size={64} />
      <Node x={1880} y={370} at={932} icon={Clock} label="History" size={64} />
      <Node
        x={1880}
        y={500}
        at={936}
        icon={Building}
        label="Responsibility"
        size={64}
      />
      <Node
        x={2240}
        at={1158}
        icon={FileText}
        label="Action plan"
        color={C.active}
        detail="Ask for a repair date"
      />
      <Appear at={1180}>
        <Text x={1910} y={604} width={820} size={24}>
          Three specialists. One coordinated next step.
        </Text>
      </Appear>

      {/* Voice is an illustration, not an invented recording of an official. */}
      <Node
        x={2770}
        at={1302}
        icon={Phone}
        label="Voice agent"
        color={C.active}
      />
      <Node x={3490} at={1306} icon={Building} label="Responsible officer" />
      <Appear at={1350}>
        <Text x={3130} y={260} width={600} size={32}>
          What will be done? By when?
        </Text>
      </Appear>
      <div
        style={{
          position: "absolute",
          left: 2900,
          top: 330,
          width: 460,
          height: 80,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 5,
          opacity: fade(f, 1350, 1510),
        }}
      >
        {Array.from({ length: 47 }, (_, i) => {
          const height =
            8 +
            Math.abs(Math.sin(f * 0.11 + i * 0.62) * Math.sin(i * 0.32)) * 48
          return (
            <div
              key={i}
              style={{
                width: 3,
                height: 56,
                background: C.active,
                transform: `scaleY(${height / 56})`,
                borderRadius: 2,
              }}
            />
          )
        })}
      </div>
      <Appear at={1430}>
        <Text x={3130} y={510} width={740} size={26}>
          “Replace the seal tomorrow afternoon.”
        </Text>
        <Text x={3130} y={556} width={740} size={21} color={C.surface}>
          Illustrative call and commitment
        </Text>
      </Appear>

      {/* A persistent record and due work, rather than a call equalling resolution. */}
      <Node x={4050} at={1570} icon={FileText} label="Case memory" />
      <Node
        x={4460}
        at={1630}
        icon={Calendar}
        label="Promised deadline"
        detail="Tomorrow afternoon"
      />
      <Node
        x={4830}
        at={1730}
        icon={RefreshCw}
        label="Review + follow up"
        color={C.followUp}
      />
      <Appear at={1650}>
        <Text x={4250} y={258} width={670} size={29}>
          Saved: “Replace the pipe seal”
        </Text>
      </Appear>
      <Appear at={1800}>
        <Text x={4440} y={592} width={850} size={24} color={C.followUp}>
          The worker returns to the case with its history.
        </Text>
      </Appear>

      {/* Conditional paths make it clear a claim alone cannot verify a repair. */}
      <Node
        x={5350}
        at={1902}
        icon={MessageCircle}
        label="Officer says ‘done’"
      />
      <Node
        x={5740}
        at={1950}
        icon={Camera}
        label="Residents check"
        detail="Observations + photos"
      />
      <Node x={6080} at={2050} icon={Eye} label="Human review" />
      <Appear at={2140}>
        <div
          style={{
            position: "absolute",
            left: 6250,
            top: 278,
            width: 44,
            height: 44,
            borderRadius: "50%",
            border: `1.5px solid ${C.confirmed}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: C.background,
          }}
        >
          <Check size={24} color={C.confirmed} />
        </div>
        <Text x={6268} y={338} width={200} size={22}>
          If confirmed
        </Text>
      </Appear>
      <Appear at={2180}>
        <Text x={5660} y={588} width={650} size={24} color={C.followUp}>
          Conflicting evidence? Keep the case open.
        </Text>
      </Appear>

      {/* Public evidence is a motion diagram, not a dashboard screen recording. */}
      <Node
        x={6650}
        y={350}
        at={2310}
        icon={Volume2}
        label="Call recordings"
        detail="Hear the conversation"
      />
      <Node
        x={7040}
        y={350}
        at={2314}
        icon={FileText}
        label="Transcripts"
        detail="Read what was said"
      />
      <Node
        x={7430}
        y={350}
        at={2318}
        icon={Calendar}
        label="Promises + evidence"
        detail="Check what happened"
      />
      <Appear at={2410}>
        <Text
          x={7040}
          y={520}
          width={1050}
          size={36}
          style={{ fontFamily: serif }}
        >
          What happened. What happens next.
        </Text>
      </Appear>
      <Appear at={2450}>
        <Text x={7040} y={588} width={1000} size={24}>
          Residents contribute evidence and check progress together.
        </Text>
      </Appear>
    </div>
  )
}

function Closing() {
  const f = useCurrentFrame()
  return (
    <div style={{ opacity: progress(f, 2550, 18) }}>
      <Title
        from={2550}
        duration={150}
        text="Pramanik."
        kind="push"
        size={112}
        y={210}
        holdEnd
      />
      <Sequence from={2580} durationInFrames={120} layout="none">
        <div
          style={{
            position: "absolute",
            left: 80,
            right: 80,
            top: 405,
            height: 105,
          }}
        >
          <WordPush
            text="Accountability that follows through."
            fontFamily={serif}
            fontSize={64}
            color={C.foreground}
            wordGap={12}
            accel={0.85}
          />
        </div>
      </Sequence>
      <Text
        x={640}
        y={564}
        width={900}
        size={25}
        style={{ opacity: progress(f, 2610, 20) }}
      >
        Less chasing. More answers.
      </Text>
    </div>
  )
}

function FollowThroughVideo({ narration = true }: { narration?: boolean }) {
  const f = useCurrentFrame()
  return (
    <AbsoluteFill
      style={{
        background: C.background,
        color: C.foreground,
        fontFamily: sans,
        overflow: "hidden",
      }}
    >
      {f < 540 && <Opening />}
      {f >= 540 && f < 2550 && <World />}
      <Title
        from={558}
        duration={258}
        text={"One issue.\nOne shared case."}
        size={66}
      />
      <Title
        from={882}
        duration={336}
        text={"Specialists work together.\nThe coordinator makes a plan."}
        size={60}
        y={34}
      />
      <Title
        from={1298}
        duration={192}
        text="A call with context."
        kind="blur"
        size={70}
      />
      <Title
        from={1568}
        duration={240}
        text={"The call ends.\nThe work continues."}
        size={66}
      />
      <Title
        from={1900}
        duration={300}
        text="‘Done’ needs a ground check."
        kind="blur"
        size={62}
      />
      <Title
        from={2296}
        duration={226}
        text={"Accountability\neveryone can inspect."}
        size={66}
      />
      <Footer from={908} to={1220} text="OpenAI Agents SDK · GPT-5.4 mini" />
      <Footer from={1320} to={1500} text="GPT-Realtime-2.1 · Bolna telephony" />
      <Footer
        from={1590}
        to={1820}
        text="Tool calling · Persistent background jobs"
      />
      <Footer
        from={1930}
        to={2210}
        text="GPT visual assessment · Human review"
      />
      {f >= 2550 && <Closing />}
      {narration &&
        scenes.map((scene) => (
          <Sequence
            key={scene.id}
            from={scene.from}
            durationInFrames={scene.durationInFrames}
          >
            <Audio src={staticFile(`follow-through/${scene.id}.mp3`)} />
          </Sequence>
        ))}
    </AbsoluteFill>
  )
}

function Root() {
  return (
    <>
      <Composition
        id="PramanikFollowThrough"
        component={FollowThroughVideo}
        durationInFrames={2700}
        {...motionCanvas}
        defaultProps={{ narration: true }}
      />
      <Composition
        id="PramanikFollowThroughClean"
        component={FollowThroughVideo}
        durationInFrames={2700}
        {...motionCanvas}
        defaultProps={{ narration: false }}
      />
    </>
  )
}
registerRoot(Root)
