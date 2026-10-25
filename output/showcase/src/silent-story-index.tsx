import React, { type CSSProperties } from "react"
import {
  AbsoluteFill,
  Composition,
  Freeze,
  Easing,
  Img,
  Sequence,
  interpolate,
  registerRoot,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion"
import { TransitionSeries, linearTiming } from "@remotion/transitions"
import { fade } from "@remotion/transitions/fade"
import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif"
import { loadFont as loadInter } from "@remotion/google-fonts/Inter"
import {
  FileText,
  Users,
  Clock,
  Building,
  Brain,
  Camera,
  MapPin,
  Droplets,
  CalendarClock,
  Phone,
  ClipboardCheck,
  Route,
  Lightbulb,
} from "lucide-react"
import { SoftBlurIn } from "./components/remocn/soft-blur-in"
import { FogRise } from "./components/remocn/fog-rise"
import { ShaderMeshGradientLavender } from "./components/remocn/shader-mesh-gradient-lavender"
import {VerificationGraphic, DashboardGraphic, PublicTimelineGraphic} from "./project-motion-graphics"
import {AgentOrbs, OfficeCallPhone, WardDirectoryGraphic} from "./agent-presence-graphics"
import sceneData from "./silent-story-scenes.json"

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
  paper: "#fbfbfc",
  ink: "#18181c",
  muted: "#757782",
  blue: "#075ef2",
  line: "#dde0e7",
}
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const
const ease = Easing.inOut(Easing.cubic)
const p = (f: number, at: number, duration = 22) =>
  interpolate(f, [at, at + duration], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  })
type SceneSpec = {
  id: string
  from: number
  durationInFrames: number
  text: string
  background: string
  kind: string
  technology?: string
  support?: string
  sourceFrom?: number
  sourceDuration?: number
}
const scenes = sceneData as SceneSpec[]

// Explanatory sentences guide the eye with Soft Blur In. Diagram labels and
// technology credits arrive together as a short fade, so they stay easy to scan.
function Label({text, size = 24, color = C.ink, weight = 400, at = 0, family = sans}: {
  text: string; size?: number; color?: string; weight?: number; at?: number; family?: string
}) {
  const frame = useCurrentFrame()
  return <span style={{fontSize: size, fontWeight: weight, color, fontFamily: family,
    opacity: p(frame, at, 12), whiteSpace: "pre-line"}}>{text}</span>
}
function SupportingSentence({text, size = 27, at = 0, color = C.ink}: {
  text: string; size?: number; at?: number; color?: string
}) {
  const {durationInFrames} = useVideoConfig()
  return <Sequence from={at} durationInFrames={Math.max(1, durationInFrames - at)} layout="none">
    <SoftBlurIn text={text} fontSize={size} fontWeight={400} color={color} fontFamily={sans} inline />
  </Sequence>
}
function Reveal({text, size = 76, italic = false}: {
  text: string; size?: number; italic?: boolean
}) {
  return <AbsoluteFill style={{fontStyle: italic ? "italic" : "normal"}}>
    <SoftBlurIn text={text} blur={12} fontSize={size} fontWeight={400} color={C.ink} fontFamily={serif} />
  </AbsoluteFill>
}
const depth = "0 4px 8px rgba(22,31,48,.09)"

function Sentence({
  text,
  diagram = false,
  final = false,
}: {
  text: string
  diagram?: boolean
  final?: boolean
}) {
  const { durationInFrames } = useVideoConfig()
  const lines = text.split("\n")
  const longest = Math.max(...lines.map((line) => line.length))
  const size = diagram ? (longest > 42 ? 48 : 56) : longest > 42 ? 58 : longest > 33 ? 64 : longest > 27 ? 72 : 80
  const gap = diagram ? 67 : lines.length > 2 ? 82 : 95
  const y = diagram ? 48 : lines.length > 2 ? 175 : final ? 228 : 236
  return (
    <div
      style={{
        position: "absolute",
        left: 62,
        right: 62,
        top: y,
        height: lines.length * gap + 20,
      }}
    >
      {lines.map((line, i) => (
        <Sequence
          key={i}
          from={i * 4}
          durationInFrames={durationInFrames - i * 4}
          layout="none"
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: i * gap,
              height: diagram ? 72 : 110,
            }}
          >
            <Reveal
              text={line}
              size={size + (i === 1 ? 2 : 0)}
              italic={i === 1}
            />
          </div>
        </Sequence>
      ))}
    </div>
  )
}

function Credit({
  name,
  detail,
  y = 615,
  boxed = false,
}: {
  name: string
  detail?: string
  y?: number
  boxed?: boolean
}) {
  const f = useCurrentFrame()
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: y,
        display: "flex",
        justifyContent: "center",
        opacity: p(f, 34),
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 0,
          background: boxed ? "rgba(255,255,255,.94)" : "transparent",
          padding: boxed ? "0 22px 0 2px" : 0,
          borderRadius: boxed ? 16 : 0,
          minHeight: 86,
        }}
      >
        <Img
          src={staticFile("brands/openai-blossom.svg")}
          style={{ width: 92, height: 92, objectFit: "contain" }}
        />
        <div style={{ fontFamily: sans, textAlign: "left", paddingRight: 16 }}>
          <div style={{ fontSize: 25, fontWeight: 500, color: C.ink }}>
            <Label text={`Powered by ${name}`} size={25} weight={500} at={34} />
          </div>
          {detail && (
            <div style={{ fontSize: 20, color: C.muted, marginTop: 6 }}>
              <Label text={detail} size={20} color={C.muted} at={40} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Appearing({
  at,
  children,
  style = {},
}: {
  at: number
  children: React.ReactNode
  style?: CSSProperties
}) {
  const f = useCurrentFrame(),
    v = p(f, at)
  return (
    <div
      style={{
        opacity: v,
        transform: `translateY(${12 * (1 - v)}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

type Pt = [number, number]
type Curve = { id: string; a: Pt; b: Pt; c: Pt; d: Pt }
const curve = (id: string, a: Pt, b: Pt, c: Pt, d: Pt): Curve => ({
  id,
  a,
  b,
  c,
  d,
})
const path = (c: Curve) => `M${c.a} C${c.b} ${c.c} ${c.d}`
const xy = (c: Curve, t: number): Pt =>
  [0, 1].map(
    (a) =>
      (1 - t) ** 3 * c.a[a] +
      3 * (1 - t) ** 2 * t * c.b[a] +
      3 * (1 - t) * t * t * c.c[a] +
      t ** 3 * c.d[a]
  ) as Pt
function Arrow({
  route,
  at,
  duration = 34,
  travelAt,
  travelDuration = 46,
}: {
  route: Curve
  at: number
  duration?: number
  travelAt?: number
  travelDuration?: number
}) {
  const f = useCurrentFrame(),
    v = p(f, at, duration)
  const active =
    travelAt !== undefined && f >= travelAt && f < travelAt + travelDuration
  const t = active
    ? interpolate(f, [travelAt!, travelAt! + travelDuration], [0, 1], {
        ...clamp,
        easing: Easing.inOut(Easing.sin),
      })
    : 0
  const [x, y] = xy(route, t)
  return (
    <g opacity={v}>
      <defs>
        <marker
          id={`arrow-${route.id}`}
          markerWidth={8}
          markerHeight={8}
          refX={6}
          refY={4}
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path
            d="M1 1 L6 4 L1 7"
            fill="none"
            stroke={C.blue}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </marker>
      </defs>
      <path
        d={path(route)}
        fill="none"
        stroke={C.blue}
        strokeWidth={1.7}
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - v}
        markerEnd={v > 0.98 ? `url(#arrow-${route.id})` : undefined}
      />
      {active && (
        <circle
          cx={x}
          cy={y}
          r={5}
          fill={C.blue}
          stroke={C.paper}
          strokeWidth={2}
        />
      )}
    </g>
  )
}

function Role({
  x,
  y,
  width = 220,
  label,
  icon: Icon,
  blue = false,
  at = 32,
}: {
  x: number
  y: number
  width?: number
  label: string
  icon: typeof Users
  blue?: boolean
  at?: number
}) {
  return (
    <Appearing at={at}>
      <div
        style={{
          position: "absolute",
          left: x - width / 2,
          top: y - 34,
          width,
          height: 68,
          borderRadius: 18,
          border: `1px solid ${blue ? "#236ce9" : C.line}`,
          background: blue
            ? "linear-gradient(180deg,#3a85fc,#075ef2)"
            : "linear-gradient(180deg,#ffffff,#f2f3f5)",
          boxShadow: depth,
          borderBottomWidth: blue ? 3 : 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          fontFamily: sans,
          fontSize: 25,
          color: blue ? "white" : C.ink,
        }}
      >
        <Icon size={26} strokeWidth={1.6} />
        <Label text={label} size={25} color={blue ? "#ffffff" : C.ink} at={at} />
      </div>
    </Appearing>
  )
}

function Merge({text}: {text: string}) {
  const f = useCurrentFrame()
  const fadeMap = 1 - p(f, 158, 22)
  const reports = [
    {x: 230, y: 360},
    {x: 412, y: 322},
    {x: 484, y: 492},
  ]
  return <>
    <Sentence text={text} diagram />
    <Appearing at={24}>
      <div style={{position: "absolute", left: 80, top: 237, width: 550, height: 378,
        border: `1px solid ${C.line}`, borderRadius: 22, overflow: "hidden", boxShadow: depth,
        opacity: fadeMap, transform: `translateX(${-18 * p(f, 140, 40)}px)`}}>
        <Img src={staticFile("shots/related-issues-basemap.png")} style={{width: "100%", height: "100%", objectFit: "cover"}} />
        <div style={{position: "absolute", right: 10, bottom: 8, padding: "3px 6px", background: "rgba(255,255,255,.95)", borderRadius: 4}}>
          <Label text="© OpenStreetMap · © CARTO" size={11} color={C.muted} at={24} />
        </div>
      </div>
    </Appearing>
    <svg width={1280} height={720} style={{position: "absolute", inset: 0, opacity: fadeMap}}>
      {reports.map((r, i) => <Arrow key={i}
        route={curve(`map-merge-${i}`, [r.x + 24, r.y], [680, r.y], [680, 422], [825, 422])}
        at={70 + i * 4} travelAt={103 + i * 4} travelDuration={42} />)}
    </svg>
    {reports.map((r, i) => <Appearing key={i} at={35 + i * 6}>
      <div style={{position: "absolute", left: r.x - 24, top: r.y - 24, opacity: fadeMap}}>
        <div style={{width: 48, height: 48, background: "linear-gradient(180deg,#3a85fc,#075ef2)", color: "white", border: "2px solid white", borderRadius: 24, display: "grid", placeItems: "center", boxShadow: depth}}>
          <Droplets size={25} strokeWidth={1.7} />
        </div>
        <div style={{position: "absolute", top: 54, left: -39, width: 126, textAlign: "center", background: "white", border: `1px solid ${C.line}`, borderRadius: 10, padding: "5px 0", boxShadow: depth}}>
          <Label text="Water leak" size={18} at={35 + i * 6} />
        </div>
      </div>
    </Appearing>)}
    <Appearing at={126}>
      <div style={{position: "absolute", left: 825, top: 336, width: 270, height: 172,
        border: "1.5px solid #075ef2", borderBottomWidth: 3, borderRadius: 20,
        background: "linear-gradient(180deg,#ffffff,#f1f5fe)", boxShadow: depth,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14,
        transform: `translateX(${-320 * p(f, 174, 28)}px)`}}>
        <FileText size={43} color={C.blue} strokeWidth={1.4} />
        <Label text="One shared case" size={27} weight={500} at={126} />
        <Label text="Reports · Location · Photos" size={18} color={C.muted} at={132} />
      </div>
    </Appearing>
  </>
}

function Specialists({text}: {text: string}) {
  const f = useCurrentFrame()
  return (
    <>
      <Sentence
        text={text}
        diagram
      />
      <Role
        x={640}
        y={237}
        width={204}
        label="Shared case"
        icon={FileText}
        blue
        at={27}
      />
      <svg width={1280} height={720} style={{ position: "absolute", inset: 0 }}>
        {[340, 640, 940].map((x, i) => (
          <React.Fragment key={x}>
            <Arrow
              route={curve(
                `split-${i}`,
                [640, 271],
                [640, 291],
                [x, 285],
                [x, 326]
              )}
              at={54 + i * 4}
              travelAt={87}
              travelDuration={40}
            />
            <Arrow
              route={curve(
                `join-${i}`,
                [x, 394],
                [x, 459],
                [640, 445],
                [640, 506]
              )}
              at={125 + i * 4}
              travelAt={155 + i * 4}
              travelDuration={36}
            />
          </React.Fragment>
        ))}
      </svg>
      <Role x={340} y={360} label="Reports" icon={Users} at={57} />
      <Role x={640} y={360} label="Memory" icon={Clock} at={61} />
      <Role x={940} y={360} label="Responsibility" icon={Building} at={65} />
      <Role
        x={640}
        y={540}
        width={286}
        label="Coordinator"
        icon={Brain}
        blue
        at={161}
      />
      <Appearing at={181}>
        <div
          style={{
            position: "absolute",
            top: 584,
            left: 100,
            right: 100,
            textAlign: "center",
            fontSize: 25,
          }}
        >
          <Label text="A coordinator agent turns their findings into an action plan." size={22} at={181} />
        </div>
      </Appearing>
      <Credit name="OpenAI Agents SDK" detail="with GPT-5.4 mini" y={620} />
    </>
  )
}

function Evidence({text}: {text: string}) {
  const f = useCurrentFrame()
  const inputs = [
    { y: 288, label: "Public survey", icon: Users },
    { y: 398, label: "Resident photos", icon: Camera },
    { y: 508, label: "Location + time", icon: MapPin },
  ]
  return (
    <>
      <Sentence
        text={text}
        diagram
      />
      <svg width={1280} height={720} style={{ position: "absolute", inset: 0 }}>
        {inputs.map((r, i) => (
          <Arrow
            key={i}
            route={curve(
              `proof-${i}`,
              [420, r.y],
              [575, r.y],
              [612, 398],
              [785, 398]
            )}
            at={62 + i * 4}
            travelAt={106 + i * 4}
            travelDuration={44}
          />
        ))}
      </svg>
      {inputs.map((r, i) => (
        <Role
          key={r.label}
          x={270}
          y={r.y}
          width={300}
          label={r.label}
          icon={r.icon}
          at={31 + i * 4}
        />
      ))}
      <Appearing at={134}>
        <div
          style={{
            position: "absolute",
            left: 785,
            top: 326,
            width: 350,
            height: 144,
            boxSizing: "border-box",
            padding: "22px 24px",
            borderRadius: 16,
            background: "linear-gradient(180deg,#3a85fc,#075ef2)",
            border: "1px solid #236ce9",
            borderBottomWidth: 3,
            boxShadow: depth,
            display: "grid",
            gridTemplateColumns: "34px minmax(0, 1fr)",
            alignItems: "center",
            gap: 18,
            color: "white",
          }}
        >
          <Camera size={34} strokeWidth={1.5} style={{flexShrink: 0}} />
          <div>
            <div style={{ fontSize: 27, lineHeight: 1.2 }}><Label text="A ground check." size={27} color="#ffffff" at={134} /></div>
            <div style={{ fontSize: 18, lineHeight: 1.4, marginTop: 10 }}>
              <Label text={"Compared with the\nofficer’s claim."} size={18} color="#ffffff" at={140} />
            </div>
          </div>
        </div>
      </Appearing>
      <Credit
        name="GPT-5.4 mini"
        detail="Visual assessment + human review"
        y={612}
      />
    </>
  )
}

function LoggedComplaints({text}: {text: string}) {
  const f = useCurrentFrame()
  const complaints = [
    {title: "Potholes near the school", location: "Karve Nagar, Pune", severity: "High", icon: Route, color: "#a36416", tint: "#fff5e5"},
    {title: "Water pipe leaking", location: "Paud Road, Pune", severity: "High", icon: Droplets, color: C.blue, tint: "#edf4ff"},
    {title: "Streetlights not working", location: "Kothrud, Pune", severity: "Medium", icon: Lightbulb, color: "#6c679a", tint: "#f1eff9"},
  ]
  return <>
    <Sentence text={text} diagram />
    <Appearing at={42}>
      <svg width={1280} height={720} style={{position: "absolute", inset: 0, zIndex: 1}}>
        <defs>
          <linearGradient id="archive-top" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fafcff" /><stop offset="1" stopColor="#d9e1ed" />
          </linearGradient>
        </defs>
        <path d="M820 350 L960 269 L1120 361 L980 442 Z" fill="url(#archive-top)" stroke="#8795a9" strokeWidth={1.4} />
        <path d="M843 350 L961 282 L1096 360 L978 428 Z" fill="#526174" stroke="#6b7b90" strokeWidth={1} />
        <path d="M843 350 L961 282 L961 300 L858 359 Z" fill="#718198" />
        <path d="M961 282 L1096 360 L1081 369 L961 300 Z" fill="#3f4f64" />
        <g stroke="#c5cfdd" strokeWidth={1}>
          <path d="M883 350 L970 300 L1044 343 L957 393 Z" fill="#dfe7f1" />
          <path d="M892 341 L979 291 L1053 334 L966 384 Z" fill="#f3f6fb" />
          <path d="M899 332 L986 282 L1060 325 L973 375 Z" fill="#ffffff" />
          <path d="M924 328 L988 291 M934 334 L998 297 M944 340 L1008 303" fill="none" stroke="#b9c6d8" strokeWidth={2} />
        </g>
        <path d="M820 350 L960 269 L1120 361" fill="none" stroke="#ffffff" strokeWidth={2} />
      </svg>
    </Appearing>
    {complaints.map((complaint, i) => {
      const Icon = complaint.icon
      const start = 100 + i * 18
      const t = interpolate(f, [start, start + 44], [0, 1], {...clamp, easing: ease})
      const initialY = 238 + i * 116
      const x = interpolate(t, [0, .76, 1], [312, 922, 972])
      const y = interpolate(t, [0, .76, 1], [initialY + 48, 270, 455])
      const scale = interpolate(t, [0, .76, 1], [1, .34, .16])
      const rotation = interpolate(t, [0, .76, 1], [0, -10, 30])
      return <Appearing key={complaint.title} at={35 + i * 6}>
        <div style={{position: "absolute", zIndex: 2, left: 0, top: 0, width: 440, height: 96,
          transform: `translate(${x - 220}px,${y - 48}px) scale(${scale}) rotate(${rotation}deg)`,
          opacity: 1 - p(f, start + 37, 7), transformOrigin: "center", boxSizing: "border-box",
          padding: "17px 18px", border: `1px solid ${C.line}`, borderBottomWidth: 2,
          borderRadius: 17, background: "linear-gradient(180deg,#ffffff,#f7f8fa)", boxShadow: depth}}>
          <div style={{position: "absolute", left: 18, top: 19, width: 37, height: 37, borderRadius: 11,
            background: complaint.tint, color: complaint.color, display: "grid", placeItems: "center"}}>
            <Icon size={22} strokeWidth={1.7} />
          </div>
          <div style={{position: "absolute", left: 69, top: 17}}>
            <Label text={complaint.title} size={21} weight={500} at={35 + i * 6} />
          </div>
          <div style={{position: "absolute", left: 70, top: 56, display: "flex", alignItems: "center", gap: 5, color: C.muted}}>
            <MapPin size={14} strokeWidth={1.7} />
            <Label text={complaint.location} size={14} color={C.muted} at={39 + i * 6} />
          </div>
          <div style={{position: "absolute", right: 16, top: 53, border: "1px solid #e8d6ba", borderRadius: 9,
            background: complaint.severity === "High" ? "#fff5e5" : "#f4f2ef", padding: "3px 8px", lineHeight: 1}}>
            <Label text={complaint.severity + " severity"} size={12} color="#82571f" weight={500} at={39 + i * 6} />
          </div>
        </div>
      </Appearing>
    })}
    <Appearing at={42}>
      <svg width={1280} height={720} style={{position: "absolute", inset: 0, zIndex: 3}}>
        <defs>
          <linearGradient id="archive-left" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#e6ecf4" /><stop offset="1" stopColor="#c7d1df" />
          </linearGradient>
          <linearGradient id="archive-right" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#b9c6d8" /><stop offset="1" stopColor="#99a9bf" />
          </linearGradient>
        </defs>
        <path d="M980 442 L1120 361 L1120 511 L980 592 Z" fill="url(#archive-right)" stroke="#8795a9" strokeWidth={1.4} />
        <path d="M820 350 L980 442 L980 592 L820 500 Z" fill="url(#archive-left)" stroke="#8795a9" strokeWidth={1.4} />
        <path d="M824 356 L976 444 M984 444 L1116 368" fill="none" stroke="#f6f9fd" strokeWidth={1.2} />
        <path d="M980 446 L980 588" stroke="#7d8da5" strokeWidth={1} />
        <g transform="matrix(.866 .5 0 1 843 397)">
          <rect x={0} y={0} width={130} height={61} rx={3} fill="#f8fafc" stroke="#b7c3d4" />
          <text x={13} y={25} fontFamily={sans} fontSize={17} fontWeight={500} fill="#3e4d62">Complaint</text>
          <text x={13} y={47} fontFamily={sans} fontSize={17} fontWeight={500} fill="#3e4d62">archive</text>
        </g>
        <g transform="matrix(.866 -.5 0 1 1010 466)">
          <rect x={0} y={0} width={70} height={17} rx={5} fill="#6c7c94" stroke="#8797af" />
          <path d="M6 3 H64" stroke="#42536b" strokeWidth={1.2} />
        </g>
      </svg>
      <div style={{position: "absolute", zIndex: 3, left: 795, top: 621, width: 350, textAlign: "center"}}>
        <Label text="Logged. Still waiting." size={23} color="#535b70" at={56} />
      </div>
    </Appearing>
  </>
}

function FollowUpCycle({text}: {text: string}) {
  const f = useCurrentFrame()
  const {durationInFrames} = useVideoConfig()
  const progress = interpolate(f, [58, 164], [0, 1], {...clamp, easing: ease})
  const angle = -Math.PI / 2 + progress * Math.PI * 2
  const active = Math.min(3, Math.floor(progress * 4))
  const cx = 960, cy = 360, radius = 190
  const steps = [
    {x: cx, y: cy - radius, label: "Promise\nsaved", icon: FileText},
    {x: cx + radius, y: cy, label: "Deadline\nset", icon: CalendarClock},
    {x: cx, y: cy + radius, label: "Follow-up\ncall", icon: Phone},
    {x: cx - radius, y: cy, label: "Progress\nchecked", icon: ClipboardCheck},
  ]
  const lines = text.split("\n")
  return <>
    <div style={{position: "absolute", left: 82, top: 266, width: 590}}>
      {lines.map((line, i) => <Sequence key={line} from={i * 4}
        durationInFrames={durationInFrames - i * 4} layout="none">
        <div style={{position: "absolute", top: i * 82, left: 0,
          fontStyle: i === 1 ? "italic" : "normal"}}>
          <SoftBlurIn text={line} blur={12} fontSize={i === 1 ? 49 : 47}
            fontWeight={400} fontFamily={serif} color={C.ink} inline />
        </div>
      </Sequence>)}
    </div>
    <Appearing at={43}>
      <svg width={1280} height={720} style={{position: "absolute", inset: 0}}>
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke={C.line} strokeWidth={2} />
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke={C.blue} strokeWidth={2.5}
          pathLength={1} strokeDasharray={1} strokeDashoffset={1 - progress}
          transform={`rotate(-90 ${cx} ${cy})`} />
        {[0, 1, 2, 3].map(i => {
          const theta = (i * 90 - 45) * Math.PI / 180
          return <path key={i} d="M-5 -4 L0 0 L-5 4" fill="none" stroke={C.blue}
            strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
            transform={`translate(${cx + radius * Math.cos(theta)} ${cy + radius * Math.sin(theta)}) rotate(${i * 90 + 45})`} />
        })}
        <circle cx={cx + radius * Math.cos(angle)} cy={cy + radius * Math.sin(angle)}
          r={6} fill={C.blue} stroke={C.paper} strokeWidth={2} />
      </svg>
      <div style={{position: "absolute", left: cx - 90, top: cy - 31, width: 180,
        textAlign: "center", lineHeight: 1.45}}>
        <Label text={"Follow-up\ncontinues"} size={22} weight={500} at={48} />
      </div>
    </Appearing>
    {steps.map((step, i) => {
      const Icon = step.icon
      const selected = f >= 58 && active === i
      return <Appearing key={step.label} at={46 + i * 3}>
        <div style={{position: "absolute", left: step.x - 76, top: step.y - 34,
          width: 152, height: 68, borderRadius: 18, boxSizing: "border-box",
          border: `1px solid ${selected ? "#236ce9" : C.line}`, borderBottomWidth: 3,
          background: selected ? "linear-gradient(180deg,#3a85fc,#075ef2)" : "linear-gradient(180deg,#ffffff,#f2f3f5)",
          boxShadow: depth, display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          color: selected ? "white" : C.ink}}>
          <Icon size={23} strokeWidth={1.6} style={{flexShrink: 0}} />
          <div style={{lineHeight: 1.3}}><Label text={step.label} size={18}
            color={selected ? "#ffffff" : C.ink} at={46 + i * 3} /></div>
        </div>
      </Appearing>
    })}
    <div style={{position: "absolute", left: 86, top: 543, width: 555, lineHeight: 1.5}}>
      <Label text={"Powered by tool calling\nand persistent background jobs"} size={21} color={C.muted} at={65} />
    </div>
  </>
}

function VoiceFrame({text}: {text: string}) {
  const f = useCurrentFrame()
  // A silent visual conversation cue. Seedless trigonometric motion makes the
  // same frame reproducible; it is not presented as a recorded call waveform.
  const bars = Array.from({length: 59}, (_, i) => {
    const envelope = Math.sin(Math.PI * (i + 1) / 60) ** 0.7
    const amplitude = 0.2 + 0.8 * Math.abs(
      Math.sin(f * 0.105 - i * 0.34) * 0.6 + Math.sin(f * 0.063 + i * 0.47) * 0.4)
    return 10 + envelope * amplitude * 74
  })
  return <>
    <Sentence text={text} diagram />
    <OfficeCallPhone fontFamily={sans}/>
    <Appearing at={48}>
      <div style={{position: "absolute", left: 375, top: 255, width: 710, height: 166,
        borderRadius: 24, border: "1px solid #dce4ee", borderBottomWidth: 3,
        background: "linear-gradient(180deg,#ffffff,#f4f7fc)", boxShadow: depth}}>
        <div style={{position: "absolute", left: 0, right: 0, top: 18,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: C.muted}}>
          <Phone size={17} strokeWidth={1.7} />
          <Label text="Voice conversation" size={17} color={C.muted} at={48} />
        </div>
        <svg width={710} height={118} viewBox="0 0 710 118" style={{position: "absolute", left: 0, top: 45}}>
          <line x1={70} x2={640} y1={59} y2={59} stroke="#dce6f7" strokeWidth={1} />
          {bars.map((height, i) => <rect key={i} x={89 + i * 9} y={59 - height / 2}
            width={5} height={height} rx={2.5} fill={C.blue}
            opacity={0.55 + Math.sin(Math.PI * (i + 1) / 60) * 0.45} />)}
        </svg>
      </div>
    </Appearing>
    <div style={{transform: "translateX(100px)"}}><Credit name="GPT-Realtime-2.1" y={465} /></div>
    <div style={{position: "absolute", top: 596, left: 310, right: 70, textAlign: "center", color: C.muted}}>
      <SupportingSentence text="Bolna gives the agents a real phone number" size={24} color={C.muted} at={78} />
    </div>
    <div style={{position: "absolute", top: 633, left: 310, right: 70, textAlign: "center", color: C.muted}}>
      <SupportingSentence text="to make calls." size={24} color={C.muted} at={84} />
    </div>
  </>
}

function Editorial({ scene }: { scene: SceneSpec }) {
  const f = useCurrentFrame()
  if (scene.id === "pramanik") return <><div style={{transform: "translateY(-70px)"}}><Sentence text={scene.text}/></div><AgentOrbs/></>
  if (scene.id === "ward") return <><Sentence text={scene.text} diagram/><WardDirectoryGraphic fontFamily={sans}/></>
  if (scene.id === "residents") return <><Sentence text={scene.text} diagram/><VerificationGraphic fontFamily={sans}/></>
  if (scene.id === "public") return <><Sentence text={scene.text} diagram/><DashboardGraphic fontFamily={sans}/></>
  if (scene.id === "inspect") return <><Sentence text={scene.text} diagram/><PublicTimelineGraphic fontFamily={sans}/></>
  if (scene.id === "call") return <VoiceFrame text={scene.text} />
  if (scene.id === "logged") return <LoggedComplaints text={scene.text} />
  if (scene.id === "promises") return <FollowUpCycle text={scene.text} />
  if (scene.id === "end-card") return <div style={{position: "absolute", left: 60, right: 60, top: 210, height: 300}}>
    <FogRise text="Pramanik." fontSize={190} fontFamily={serif} color={C.ink}
      stagger={4} tracking={-0.025} drift={0.0005} exitAt={0} damping={20} />
  </div>
  if (scene.id === "introducing") return <>
    <div style={{position: "absolute", left: 60, right: 60, top: 170, textAlign: "center"}}>
      <Label text="Introducing" size={29} at={4} />
    </div>
    <div style={{position: "absolute", left: 60, right: 60, top: 200, height: 300}}>
      <FogRise text="Pramanik." fontSize={160} fontFamily={serif} color={C.ink}
        stagger={4} tracking={-0.025} drift={0.001} exitAt={0} damping={20} />
    </div>
    <div style={{position: "absolute", left: 60, right: 60, top: 475, textAlign: "center"}}>
      <SupportingSentence text="An accountability office" size={27} at={44} />
    </div>
    <div style={{position: "absolute", left: 60, right: 60, top: 518, textAlign: "center"}}>
      <SupportingSentence text="run by autonomous voice agents." size={27} at={48} />
    </div>
  </>
  const hasCredit = scene.id === "memory"
  return (
    <>
      <div style={{ transform: hasCredit ? "translateY(-48px)" : "none" }}>
        <Sentence
          text={scene.text}
          final={scene.id === "close"}
        />
      </div>
      {scene.id === "memory" && (
        <Credit
          name="GPT-5.4 mini"
          detail="Case memory + reasoning"
          y={498}
          boxed
        />
      )}

    </>
  )
}

function StoryScene({ scene }: { scene: SceneSpec }) {
  return (
    <AbsoluteFill
      style={{
        background: "transparent",
        color: C.ink,
        fontFamily: sans,
        overflow: "hidden",
      }}
    >
      {scene.id === "merge" ? (
        <Merge text={scene.text} />
      ) : scene.id === "specialists" ? (
        <Specialists text={scene.text} />
      ) : scene.id === "evidence" ? (
        <Evidence text={scene.text} />
      ) : (
        <Editorial scene={scene} />
      )}
    </AbsoluteFill>
  )
}

function SilentStory() {
  const frame = useCurrentFrame()
  const currentScene = [...scenes].reverse().find(scene => frame >= scene.from) ?? scenes[0]
  // Retain the original continuous shader clock while the new product scenes
  // get more reading time. This also permits frame-exact incremental exports.
  const backgroundFrame = Math.round((currentScene.sourceFrom ?? currentScene.from) +
    (frame - currentScene.from) * (currentScene.sourceDuration ?? currentScene.durationInFrames) / currentScene.durationInFrames)
  return (
    <AbsoluteFill style={{ background: "#e9e4ff" }}>
      <Freeze frame={backgroundFrame}><ShaderMeshGradientLavender speed={0.35} /></Freeze>
      <TransitionSeries>
        {scenes.flatMap((scene, i) => {
          const seq = (
            <TransitionSeries.Sequence
              key={scene.id}
              durationInFrames={
                scene.durationInFrames + (i < scenes.length - 1 ? 12 : 0)
              }
            >
              <StoryScene scene={scene} />
            </TransitionSeries.Sequence>
          )
          return i < scenes.length - 1
            ? [
                seq,
                <TransitionSeries.Transition
                  key={`fade-${scene.id}`}
                  timing={linearTiming({ durationInFrames: 12 })}
                  presentation={fade({ shouldFadeOutExitingScene: true })}
                />,
              ]
            : [seq]
        })}
      </TransitionSeries>
    </AbsoluteFill>
  )
}
function Root() {
  return (
    <Composition
      id="PramanikSilentStory"
      component={SilentStory}
      width={1280}
      height={720}
      fps={30}
      durationInFrames={scenes.reduce((sum, scene) => sum + scene.durationInFrames, 0)}
    />
  )
}
registerRoot(Root)
