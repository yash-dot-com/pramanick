import React, { type CSSProperties } from "react"
import {
  AbsoluteFill,
  Audio,
  Composition,
  Easing,
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
  Users,
  FileText,
  Brain,
  Building,
  Phone,
  Calendar,
  Check,
  Eye,
  Camera,
  RefreshCw,
  Clock,
  Globe,
  MessageCircle,
  Copy,
  ArrowRight,
  Volume2,
  MapPin,
} from "lucide-react"
import { MaskRevealUp } from "./components/remocn/mask-reveal-up"
import { BlurOutUp } from "./components/remocn/blur-out-up"
import { WordStream } from "./components/remocn/word-stream"
import { WordPush } from "./components/remocn/word-push"
import scenes from "./office-scenes.json"

const serif = loadSerif("normal", {
  weights: ["400"],
  subsets: ["latin"],
}).fontFamily
loadSerif("italic", { weights: ["400"], subsets: ["latin"] })
const sans = loadInter("normal", {
  weights: ["400", "500", "600"],
  subsets: ["latin"],
}).fontFamily
const C = {
  bg: "#fbfbfc",
  ink: "#18181c",
  muted: "#7d7e87",
  blue: "#075ef2",
  violet: "#8454d7",
  green: "#159764",
  line: "#dedee4",
}
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const
const smooth = Easing.inOut(Easing.cubic)
const p = (f: number, start: number, duration = 18) =>
  interpolate(f, [start, start + duration], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  })
const visible = (f: number, start: number, end: number) =>
  p(f, start, 12) * (1 - p(f, end - 14, 14))

function Horizon({ opacity = 1 }: { opacity?: number }) {
  return (
    <div
      style={{
        position: "absolute",
        left: "-10%",
        right: "-10%",
        bottom: -162,
        height: 245,
        opacity,
        filter: "blur(20px)",
        background:
          "radial-gradient(ellipse 85% 95% at 50% 100%, #0055eb 0%, #0055eb 28%, #9fc6e7 39%, #ffe33a 48%, #ff9517 56%, #ff3bd5 65%, transparent 80%)",
      }}
    />
  )
}

function Type({
  text,
  italic = false,
  size = 68,
  kind = "mask",
}: {
  text: string
  italic?: boolean
  size?: number
  kind?: "mask" | "blur" | "push"
}) {
  const props = {
    text,
    fontFamily: serif,
    fontWeight: 400,
    fontSize: size,
    color: C.ink,
  }
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        fontStyle: italic ? "italic" : "normal",
      }}
    >
      {kind === "mask" ? (
        <MaskRevealUp {...props} distance={22} />
      ) : kind === "blur" ? (
        <BlurOutUp {...props} staggerDelay={1} />
      ) : (
        <WordPush {...props} wordGap={12} accel={0.85} />
      )}
    </div>
  )
}

function Heading({
  from,
  duration,
  main,
  emphasis,
  hero = false,
  kind = "mask",
}: {
  from: number
  duration: number
  main: string
  emphasis: string
  hero?: boolean
  kind?: "mask" | "blur" | "push"
}) {
  const f = useCurrentFrame()
  return (
    <Sequence from={from} durationInFrames={duration} layout="none">
      <div
        style={{
          position: "absolute",
          left: 60,
          right: 60,
          top: hero ? 190 : 26,
          height: hero ? 230 : 152,
          opacity: visible(f, from, from + duration),
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            height: hero ? 105 : 70,
          }}
        >
          <Type text={main} size={hero ? 82 : 55} kind={kind} />
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: hero ? 104 : 70,
            height: hero ? 114 : 82,
          }}
        >
          <Type text={emphasis} italic size={hero ? 86 : 66} kind={kind} />
        </div>
      </div>
    </Sequence>
  )
}

function Caption({
  from,
  to,
  children,
  y = 674,
  size = 22,
  color = C.muted,
}: {
  from: number
  to: number
  children: React.ReactNode
  y?: number
  size?: number
  color?: string
}) {
  const f = useCurrentFrame()
  return (
    <div
      style={{
        position: "absolute",
        top: y,
        left: 70,
        right: 70,
        textAlign: "center",
        fontFamily: sans,
        fontSize: size,
        lineHeight: 1.4,
        color,
        opacity: visible(f, from, to),
      }}
    >
      {children}
    </div>
  )
}

function Pill({
  children,
  blue = false,
  style = {},
}: {
  children: React.ReactNode
  blue?: boolean
  style?: CSSProperties
}) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        borderRadius: 999,
        padding: "12px 23px",
        border: `1px solid ${blue ? "#1767ea" : "#e0e0e5"}`,
        background: blue
          ? "linear-gradient(180deg,#3b87ff 0%,#075ef2 78%)"
          : "linear-gradient(180deg,#ffffff,#f5f5f7)",
        boxShadow: blue
          ? "0 2px 4px rgba(0,62,172,0.18)"
          : "0 1px 3px rgba(0,0,0,0.08)",
        fontFamily: sans,
        fontSize: 23,
        color: blue ? "white" : C.ink,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

function Intro() {
  const f = useCurrentFrame()
  return (
    <>
      <div style={{ opacity: visible(f, 0, 600) }}>
        <Horizon opacity={0.75} />
      </div>
      <Heading
        from={0}
        duration={120}
        main="India has a"
        emphasis="follow-up problem."
        hero
      />
      <Heading
        from={120}
        duration={150}
        main="We pay taxes."
        emphasis="We deserve answers."
        kind="blur"
        hero
      />
      <Caption from={146} to={266} y={495} size={27}>
        Public services. Public responsibility.
      </Caption>
      <Heading
        from={270}
        duration={180}
        main="A complaint number"
        emphasis="isn’t a repair."
        hero
      />
      <Sequence from={302} durationInFrames={142} layout="none">
        <div
          style={{
            position: "absolute",
            left: 80,
            right: 80,
            top: 485,
            height: 65,
            opacity: visible(f, 302, 444),
          }}
        >
          <WordStream
            text="Calls. | Reminders. | More waiting."
            fontFamily={sans}
            fontSize={33}
            fontWeight={400}
            wordGap={10}
            hold={27}
            drift={0.15}
            color={C.muted}
          />
        </div>
      </Sequence>
      <Sequence from={450} durationInFrames={150} layout="none">
        <div style={{ opacity: visible(f, 450, 600) }}>
          <div
            style={{
              position: "absolute",
              left: 80,
              right: 80,
              top: 200,
              height: 140,
            }}
          >
            <WordPush
              text="Pramanik."
              fontFamily={serif}
              fontSize={112}
              color={C.ink}
              wordGap={12}
            />
          </div>
          <div
            style={{
              position: "absolute",
              top: 375,
              left: 80,
              right: 80,
              textAlign: "center",
              fontSize: 29,
              lineHeight: 1.65,
              color: C.muted,
            }}
          >
            An accountability office.
            <br />
            Run by autonomous voice agents.
          </div>
          <div
            style={{
              position: "absolute",
              top: 509,
              left: 0,
              right: 0,
              textAlign: "center",
              opacity: p(f, 480),
            }}
          >
            <Pill blue>
              <Phone size={23} /> Built to follow through
            </Pill>
          </div>
        </div>
      </Sequence>
    </>
  )
}

type Point = [number, number]
type Route = {
  id: string
  from: Point
  to: Point
  c1?: Point
  c2?: Point
  at: number
  duration?: number
  color?: string
  parts?: [Point, Point, Point, Point][]
}
const routes: Route[] = [
  { id: "report", from: [132, 250], to: [248, 250], at: 635 },
  { id: "case", from: [312, 250], to: [448, 250], at: 719 },
  ...[145, 250, 355].flatMap((y, i): Route[] => [
    {
      id: `fork${i}`,
      from: [512, 250],
      to: [656, y],
      c1: [566, 250],
      c2: [583, y],
      at: 866 + i * 4,
    },
    {
      id: `join${i}`,
      from: [704, y],
      to: [848, 250],
      c1: [774, y],
      c2: [790, 250],
      at: 963 + i * 13,
    },
  ]),
  { id: "plan", from: [912, 250], to: [1048, 250], at: 1084 },
  { id: "contact", from: [1112, 250], to: [1248, 250], at: 1198 },
  { id: "call", from: [1312, 250], to: [1448, 250], at: 1325 },
  { id: "reply", from: [1480, 282], to: [1480, 351], at: 1592 },
  { id: "commit", from: [1480, 399], to: [1480, 468], at: 1587 },
  { id: "due", from: [1448, 500], to: [1312, 500], at: 1665 },
  {
    id: "call-again",
    from: [1248, 500],
    to: [1248, 250],
    c1: [1156, 500],
    c2: [1156, 250],
    at: 1690,
    color: C.blue,
  },
  { id: "survey", from: [1248, 500], to: [1112, 500], at: 1838 },
  { id: "photos", from: [1048, 500], to: [912, 500], at: 1895 },
  { id: "assess", from: [848, 500], to: [712, 500], at: 2044 },
  {
    id: "verified",
    from: [648, 500],
    to: [512, 500],
    at: 2112,
    color: C.green,
  },
  {
    id: "reopen",
    from: [712, 500],
    to: [1312, 500],
    parts: [
      [
        [712, 500],
        [790, 500],
        [754, 620],
        [834, 620],
      ],
      [
        [834, 620],
        [954, 620],
        [1240, 620],
        [1320, 620],
      ],
      [
        [1320, 620],
        [1400, 620],
        [1380, 500],
        [1312, 500],
      ],
    ],
    at: 2154,
    duration: 28,
    color: C.violet,
  },
]
function d(r: Route) {
  if (r.parts)
    return `M${r.parts[0][0]} ${r.parts.map((s) => `C${s[1]} ${s[2]} ${s[3]}`).join(" ")}`
  return r.c1 && r.c2
    ? `M${r.from} C${r.c1} ${r.c2} ${r.to}`
    : `M${r.from} L${r.to}`
}
function rawPoint(r: Route, t: number): Point {
  if (r.parts) {
    const i = Math.min(r.parts.length - 1, Math.floor(t * r.parts.length)),
      u = t * r.parts.length - i,
      s = r.parts[i]
    return [0, 1].map(
      (a) =>
        (1 - u) ** 3 * s[0][a] +
        3 * (1 - u) ** 2 * u * s[1][a] +
        3 * (1 - u) * u * u * s[2][a] +
        u ** 3 * s[3][a]
    ) as Point
  }
  return [0, 1].map((a) =>
    r.c1 && r.c2
      ? (1 - t) ** 3 * r.from[a] +
        3 * (1 - t) ** 2 * t * r.c1[a] +
        3 * (1 - t) * t * t * r.c2[a] +
        t ** 3 * r.to[a]
      : r.from[a] + (r.to[a] - r.from[a]) * t
  ) as Point
}
// Arc-length samples keep packets gliding at a consistent speed through bends.
const travel = new Map(
  routes.map((r) => {
    const samples = Array.from({ length: 181 }, (_, i) => rawPoint(r, i / 180))
    const lengths = [0]
    for (let i = 1; i < samples.length; i++)
      lengths.push(
        lengths[i - 1] +
          Math.hypot(
            samples[i][0] - samples[i - 1][0],
            samples[i][1] - samples[i - 1][1]
          )
      )
    return [r.id, { samples, lengths }] as const
  })
)
function point(r: Route, t: number): Point {
  const { samples, lengths } = travel.get(r.id)!,
    target = t * lengths[lengths.length - 1]
  let lo = 1,
    hi = lengths.length - 1
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (lengths[mid] < target) lo = mid + 1
    else hi = mid
  }
  const k = (target - lengths[lo - 1]) / (lengths[lo] - lengths[lo - 1] || 1)
  return [
    samples[lo - 1][0] + (samples[lo][0] - samples[lo - 1][0]) * k,
    samples[lo - 1][1] + (samples[lo][1] - samples[lo - 1][1]) * k,
  ]
}
function Wire({ route }: { route: Route }) {
  const f = useCurrentFrame(),
    v = p(f, route.at, route.duration || 28),
    color = route.color || C.blue
  return (
    <g>
      <defs>
        <marker
          id={`arrow-${route.id}`}
          markerWidth={7}
          markerHeight={7}
          refX={5.5}
          refY={3.5}
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path
            d="M1 1 L5.5 3.5 L1 6"
            fill="none"
            stroke={color}
            strokeWidth={1.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </marker>
      </defs>
      <path
        d={d(route)}
        fill="none"
        stroke={C.line}
        strokeWidth={1.1}
        opacity={0.48}
      />
      <path
        d={d(route)}
        pathLength={1}
        fill="none"
        stroke={color}
        strokeWidth={1.7}
        strokeDasharray={1}
        strokeDashoffset={1 - v}
        opacity={v > 0 ? 1 : 0}
        markerEnd={v > 0.98 ? `url(#arrow-${route.id})` : undefined}
      />
    </g>
  )
}
function Flow({
  id,
  start,
  end,
  period = 58,
  offset = 0,
}: {
  id: string
  start: number
  end: number
  period?: number
  offset?: number
}) {
  const f = useCurrentFrame()
  if (f < start + offset || f >= end) return null
  const route = routes.find((r) => r.id === id)!
  const phase = ((f - start - offset) % period) / period
  // Soft, symmetric speed changes on the same cubic path used by the arrow.
  const t = Easing.inOut(Easing.sin)(phase)
  const [x, y] = point(route, t)
  return (
    <circle
      cx={x}
      cy={y}
      r={4.6}
      fill={route.color || C.blue}
      stroke={C.bg}
      strokeWidth={2}
    />
  )
}

type NodeDef = {
  id: string
  x: number
  y: number
  at: number
  label: string
  icon: typeof User
  blue?: boolean
  small?: boolean
  green?: boolean
}
const nodes: NodeDef[] = [
  {
    id: "resident",
    x: 100,
    y: 250,
    at: 618,
    label: "Citizen reports",
    icon: User,
  },
  {
    id: "dedup",
    x: 280,
    y: 250,
    at: 662,
    label: "Group + de-duplicate",
    icon: Copy,
    blue: true,
  },
  {
    id: "coordinator",
    x: 480,
    y: 250,
    at: 840,
    label: "Coordinator",
    icon: Brain,
    blue: true,
  },
  {
    id: "reports",
    x: 680,
    y: 145,
    at: 856,
    label: "Reports",
    icon: Users,
    small: true,
  },
  {
    id: "memory",
    x: 680,
    y: 250,
    at: 860,
    label: "Case memory",
    icon: Clock,
    small: true,
  },
  {
    id: "responsibility",
    x: 680,
    y: 355,
    at: 864,
    label: "Responsibility",
    icon: Building,
    small: true,
  },
  {
    id: "plan",
    x: 880,
    y: 250,
    at: 1005,
    label: "Action plan",
    icon: FileText,
    blue: true,
  },
  {
    id: "contact",
    x: 1080,
    y: 250,
    at: 1123,
    label: "Ward contact",
    icon: Globe,
  },
  {
    id: "voice",
    x: 1280,
    y: 250,
    at: 1300,
    label: "Voice agent",
    icon: Phone,
    blue: true,
  },
  {
    id: "officer",
    x: 1480,
    y: 250,
    at: 1304,
    label: "Responsible officer",
    icon: Building,
  },
  {
    id: "reply",
    x: 1480,
    y: 375,
    at: 1590,
    label: "Evaluate reply",
    icon: MessageCircle,
    small: true,
  },
  {
    id: "promises",
    x: 1480,
    y: 500,
    at: 1600,
    label: "Promises + dates",
    icon: Calendar,
  },
  {
    id: "worker",
    x: 1280,
    y: 500,
    at: 1660,
    label: "Follow-up worker",
    icon: RefreshCw,
    blue: true,
  },
  {
    id: "survey",
    x: 1080,
    y: 500,
    at: 1840,
    label: "Resident survey",
    icon: Users,
  },
  {
    id: "evidence",
    x: 880,
    y: 500,
    at: 1900,
    label: "Photos + observations",
    icon: Camera,
  },
  {
    id: "review",
    x: 680,
    y: 500,
    at: 2070,
    label: "AI + human review",
    icon: Eye,
  },
  {
    id: "verified",
    x: 480,
    y: 500,
    at: 2125,
    label: "If repair confirmed",
    icon: Check,
    green: true,
  },
]

function Node({
  node,
  visibility = 1,
}: {
  node: NodeDef
  visibility?: number
}) {
  const f = useCurrentFrame(),
    a = p(f, node.at, 18) * visibility,
    s = node.small ? 48 : 64
  const blue = node.blue,
    color = node.green ? C.green : blue ? "white" : C.ink,
    Icon = node.icon
  return (
    <div style={{ opacity: a }}>
      <div
        style={{
          position: "absolute",
          left: node.x - s / 2,
          top: node.y - s / 2,
          width: s,
          height: s,
          borderRadius: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: `1px solid ${node.green ? "#b7dfcb" : blue ? "#1664e4" : "#dddde4"}`,
          background: node.green
            ? "#f1faf6"
            : blue
              ? "linear-gradient(180deg,#3c87ff,#075ef2 85%)"
              : "linear-gradient(180deg,#ffffff,#f3f3f6)",
          boxShadow: blue
            ? "0 2px 3px rgba(0,62,172,0.16)"
            : "0 1px 2px rgba(0,0,0,0.05)",
        }}
      >
        <Icon size={node.small ? 22 : 27} strokeWidth={1.6} color={color} />
      </div>
      <div
        style={{
          position: "absolute",
          left: node.x - 84,
          top: node.y + s / 2 + 10,
          width: 168,
          textAlign: "center",
          fontFamily: sans,
          fontWeight: node.blue ? 500 : 400,
          fontSize: node.small ? 18 : 20,
          lineHeight: 1.2,
          color: C.ink,
          willChange: "transform",
        }}
      >
        {node.label}
      </div>
    </div>
  )
}

const cameraFrames = [
  600, 612, 654, 780, 842, 1046, 1110, 1228, 1302, 1528, 1600, 1768, 1838, 2008,
  2080, 2134, 2186, 2260, 2348, 2520,
]
const cameraX = [
  800, 800, 280, 280, 700, 700, 1060, 1060, 1380, 1380, 1330, 1330, 1080, 1080,
  780, 780, 1000, 1000, 800, 800,
]
const cameraY = [
  340, 340, 250, 250, 250, 250, 250, 250, 260, 260, 390, 390, 500, 500, 500,
  500, 440, 440, 340, 340,
]
const cameraZ = [
  0.72, 0.72, 1.55, 1.55, 1.4, 1.4, 1.5, 1.5, 1.5, 1.5, 1.15, 1.15, 1.5, 1.5,
  1.4, 1.4, 1.0, 1.0, 0.72, 0.72,
]

function Graph() {
  const f = useCurrentFrame()
  const camera = (values: number[]) =>
    interpolate(f, cameraFrames, values, { ...clamp, easing: smooth })
  const cx = camera(cameraX),
    cy = camera(cameraY),
    z = camera(cameraZ)
  return (
    <div
      style={{
        position: "absolute",
        top: 190,
        left: 0,
        right: 0,
        height: 465,
        overflow: "hidden",
        opacity: visible(f, 600, 2520),
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 1600,
          height: 680,
          transformOrigin: "0 0",
          transform: `translate(${640 - cx * z}px,${235 - cy * z}px) scale(${z})`,
        }}
      >
        <svg
          width={1600}
          height={680}
          style={{ position: "absolute", inset: 0, overflow: "visible" }}
        >
          {routes.map((r) => (
            <Wire key={r.id} route={r} />
          ))}
          <Flow id="report" start={664} end={765} period={44} />
          <Flow id="case" start={755} end={844} period={44} />
          {[0, 1, 2].map((i) => (
            <React.Fragment key={i}>
              <Flow id={`fork${i}`} start={910} end={1000} period={46} />
              <Flow
                id={`join${i}`}
                start={1000}
                end={1070}
                period={42}
                offset={i * 4}
              />
            </React.Fragment>
          ))}
          <Flow id="plan" start={1128} end={1198} period={42} />
          <Flow id="contact" start={1226} end={1280} period={40} />
          <Flow id="call" start={1355} end={1540} period={48} />
          <Flow id="reply" start={1610} end={1675} period={43} />
          <Flow id="commit" start={1618} end={1685} period={42} />
          <Flow id="due" start={1690} end={1768} period={42} />
          <Flow id="call-again" start={1735} end={1790} period={38} />
          <Flow id="survey" start={1860} end={1940} period={42} />
          <Flow id="photos" start={1930} end={2020} period={44} />
          <Flow id="assess" start={2080} end={2140} period={40} />
          <Flow id="verified" start={2140} end={2180} period={40} />
          <Flow id="reopen" start={2190} end={2290} period={44} />
          <Flow id="call-again" start={2220} end={2310} period={38} />
        </svg>
        {nodes.map((n) => {
          const x = 640 + (n.x - cx) * z,
            y = 235 + (n.y - cy) * z
          const half = 84 * z,
            top = (n.small ? 24 : 32) * z + 4
          const bottom =
            ((n.small ? 24 : 32) + 10 + (n.label.length > 17 ? 48 : 24)) * z + 4
          const h = interpolate(
            Math.abs(x - 640),
            [640 - half - 24, 640 - half + 16],
            [1, 0],
            clamp
          )
          const v =
            interpolate(y, [top, top + 12], [0, 1], clamp) *
            interpolate(y, [465 - bottom, 485 - bottom], [1, 0], clamp)
          return <Node key={n.id} node={n} visibility={h * v} />
        })}
        <div
          style={{
            position: "absolute",
            left: 605,
            top: 85,
            width: 150,
            textAlign: "center",
            fontFamily: sans,
            fontSize: 16,
            color: C.muted,
            opacity: p(f, 884),
            willChange: "transform",
          }}
        >
          In parallel
        </div>
        <div
          style={{
            position: "absolute",
            left: 1010,
            top: 168,
            width: 140,
            textAlign: "center",
            fontSize: 17,
            color: C.muted,
            opacity: p(f, 1160),
            willChange: "transform",
          }}
        >
          Ward → Role → Contact
        </div>
        <div
          style={{
            position: "absolute",
            left: 1050,
            top: 410,
            width: 140,
            textAlign: "center",
            fontSize: 16,
            color: C.blue,
            opacity: p(f, 1745),
            willChange: "transform",
          }}
        >
          Call again
        </div>
        <div
          style={{
            position: "absolute",
            left: 770,
            top: 638,
            width: 430,
            textAlign: "center",
            fontSize: 19,
            color: C.violet,
            opacity: p(f, 2180),
            willChange: "transform",
          }}
        >
          Evidence conflicts → Reopen → Follow up
        </div>
        <div
          style={{
            position: "absolute",
            left: 490,
            top: 35,
            width: 580,
            textAlign: "center",
            fontSize: 22,
            fontFamily: serif,
            fontStyle: "italic",
            color: C.muted,
            opacity: p(f, 2328),
            willChange: "transform",
          }}
        >
          One office. A continuous accountability loop.
        </div>
      </div>
    </div>
  )
}

function Detail({
  from,
  to,
  children,
}: {
  from: number
  to: number
  children: React.ReactNode
}) {
  const f = useCurrentFrame()
  return (
    <div
      style={{
        position: "absolute",
        top: 598,
        left: 0,
        right: 0,
        textAlign: "center",
        opacity: visible(f, from, to),
      }}
    >
      {children}
    </div>
  )
}

function Finale() {
  const f = useCurrentFrame()
  return (
    <div style={{ opacity: p(f, 2520, 16) }}>
      <Horizon opacity={0.8} />
      <div
        style={{
          position: "absolute",
          left: 70,
          right: 70,
          top: 110,
          textAlign: "center",
          fontSize: 31,
          color: C.muted,
        }}
      >
        Pramanik
      </div>
      <Sequence from={2520} durationInFrames={180} layout="none">
        <div
          style={{
            position: "absolute",
            left: 50,
            right: 50,
            top: 215,
            height: 96,
          }}
        >
          <Type text="You report the problem." size={78} />
        </div>
        <div
          style={{
            position: "absolute",
            left: 50,
            right: 50,
            top: 311,
            height: 112,
          }}
        >
          <Type text="We keep following up." size={86} italic />
        </div>
      </Sequence>
      <div
        style={{
          position: "absolute",
          top: 485,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: p(f, 2560),
        }}
      >
        <Pill blue>
          <Phone size={23} /> An autonomous AI accountability office
        </Pill>
      </div>
    </div>
  )
}

function AccountabilityOffice({ narration = true }: { narration?: boolean }) {
  const f = useCurrentFrame()
  return (
    <AbsoluteFill
      style={{
        background: C.bg,
        fontFamily: sans,
        color: C.ink,
        overflow: "hidden",
      }}
    >
      {f < 600 && <Intro />}
      {f >= 600 && f < 2520 && <Graph />}
      <Heading
        from={625}
        duration={157}
        main="Many reports."
        emphasis="One shared case."
      />
      <Heading
        from={846}
        duration={196}
        main="Agents work in parallel."
        emphasis="The office makes a plan."
      />
      <Heading
        from={1115}
        duration={115}
        main="Find the right person."
        emphasis="By ward. By responsibility."
      />
      <Heading
        from={1306}
        duration={218}
        main="A voice. A phone number."
        emphasis="A call that knows the history."
      />
      <Heading
        from={1604}
        duration={160}
        main="The call ends."
        emphasis="The follow-up doesn’t."
        kind="blur"
      />
      <Heading
        from={1842}
        duration={162}
        main="They say ‘done’."
        emphasis="Residents check."
      />
      <Heading
        from={2084}
        duration={182}
        main="Does the ground agree?"
        emphasis="If not, reopen. Call again."
      />
      <Heading
        from={2352}
        duration={144}
        main="Every promise. Every answer."
        emphasis="Open for everyone to inspect."
      />
      <Caption from={650} to={780}>
        Aggregation · Duplicate detection · Shared case history
      </Caption>
      <Caption from={874} to={1040}>
        OpenAI Agents SDK · GPT-5.4 mini reasoning · Case memory
      </Caption>
      <Caption from={1140} to={1230}>
        Public ward directories · Responsibility and contact lookup
      </Caption>
      <Detail from={1340} to={1517}>
        <Pill>
          Hindi <span style={{ color: "#aaa" }}>·</span> Marathi{" "}
          <span style={{ color: "#aaa" }}>·</span> English
        </Pill>
      </Detail>
      <Caption from={1330} to={1526}>
        GPT-Realtime-2.1 · Bolna phone number provisioning
      </Caption>
      <Caption from={1620} to={1770}>
        Response assessment · Tool calling · Persistent follow-up jobs
      </Caption>
      <Caption from={1860} to={2010}>
        Affected residents · Observations · Location · Photos
      </Caption>
      <Caption from={2098} to={2290}>
        GPT visual assessment + human review · Conflicting evidence keeps the
        case open
      </Caption>
      <Caption from={2370} to={2505} size={25}>
        Call records · Promises · Evidence · Completed work · Next steps
      </Caption>
      {f >= 2520 && <Finale />}
      {narration &&
        scenes.map((s) => (
          <Sequence
            key={s.id}
            from={s.from}
            durationInFrames={s.durationInFrames}
          >
            <Audio src={staticFile(`office-v2/${s.id}.mp3`)} />
          </Sequence>
        ))}
    </AbsoluteFill>
  )
}

function Root() {
  return (
    <>
      <Composition
        id="PramanikAccountabilityOffice"
        component={AccountabilityOffice}
        durationInFrames={2700}
        fps={30}
        width={1280}
        height={720}
        defaultProps={{ narration: true }}
      />
      <Composition
        id="PramanikAccountabilityOfficeClean"
        component={AccountabilityOffice}
        durationInFrames={2700}
        fps={30}
        width={1280}
        height={720}
        defaultProps={{ narration: false }}
      />
    </>
  )
}
registerRoot(Root)
