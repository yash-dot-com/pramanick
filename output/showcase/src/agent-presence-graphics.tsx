import React from "react"
import {interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion"
import {Building2, Phone, MicOff, Grid3X3, Volume2, MousePointer2, ArrowUpRight, Search, UserRound} from "lucide-react"
import contact from "./phone-office-contact.json"
import directory from "./ward-directory-motion.json"

const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const

// Each avatar has a fixed home; a small local orbit keeps the group alive
// without moving the viewer's attention away from the sentence.
export function AgentOrbs({homeY = 518, roles = false}: {homeY?: number; roles?: boolean}) {
  const frame = useCurrentFrame()
  const {fps} = useVideoConfig()
  return <>{[84, 104, 126, 104, 84].map((size, i) => {
    const entrance = spring({frame: frame - 28 - i * 5, fps,
      config: {mass: 0.8, stiffness: 125, damping: 12}})
    const phase = frame * 0.035 + i * 1.35
    const x = 640 + (i - 2) * 148 + Math.sin(phase) * 8
    const y = homeY + Math.abs(i - 2) * 13 + Math.cos(phase) * 7
    const id = `agent-metal-${i}`
    const blinkAt = 77 + i * 5
    const blink = interpolate(frame, [blinkAt, blinkAt + 3, blinkAt + 5, blinkAt + 8], [1, .12, .12, 1], clamp)
    return <div key={i} style={{position: "absolute", left: x - size / 2, top: y - size / 2,
      width: size, height: size, opacity: Math.min(1, entrance * 2),
      transform: `translateY(${(1 - entrance) * 180}px) scale(${Math.max(0.01, entrance)}) rotate(${Math.sin(phase) * 4}deg)`}}>
      <svg width={size} height={size + 16} viewBox="0 0 140 156" overflow="visible">
        <defs>
          <radialGradient id={id} cx="31%" cy="19%" r="86%">
            <stop offset="0" stopColor="#747780"/><stop offset="0.18" stopColor="#303239"/>
            <stop offset="0.44" stopColor="#090a0d"/><stop offset="0.76" stopColor="#010102"/>
            <stop offset="0.95" stopColor="#20222a"/><stop offset="1" stopColor="#07080b"/>
          </radialGradient>
          <linearGradient id={`${id}-shine`} x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#ffffff" stopOpacity="0.88"/><stop offset="0.55" stopColor="#e2e6ef" stopOpacity="0.12"/>
            <stop offset="1" stopColor="#ffffff" stopOpacity="0"/>
          </linearGradient>
          <filter id={`${id}-soft`}><feGaussianBlur stdDeviation="2.2"/></filter>
          <filter id={`${id}-shadow`}><feGaussianBlur stdDeviation="4"/></filter>
        </defs>
        <ellipse cx="70" cy="145" rx="40" ry="4" fill="#181328" opacity="0.13" filter={`url(#${id}-shadow)`}/>
        <path d="M70 6 C109 4 135 29 135 68 C137 109 111 136 71 137 C31 138 5 110 5 72 C3 32 28 8 70 6Z"
          fill={`url(#${id})`} stroke="#34363d" strokeWidth="0.8"/>
        <path d="M23 46 C32 17 74 8 103 26 C78 19 44 24 29 52Z" fill={`url(#${id}-shine)`} filter={`url(#${id}-soft)`}/>
        <path d="M116 67 C126 98 104 124 81 127" fill="none" stroke="#a3a9b8" strokeOpacity="0.3" strokeWidth="2.1" filter={`url(#${id}-soft)`}/>
        <ellipse cx="42" cy="28" rx="11" ry="3.5" transform="rotate(-28 42 28)" fill="#fff" opacity="0.65" filter={`url(#${id}-soft)`}/>
        <g transform={`translate(${Math.sin(phase) * 1.6} 0)`}>
          {[54, 84].map(eyeX => <rect key={eyeX} x={eyeX - 5.5} y={74 - 14 * blink}
            width={11} height={28 * blink} rx={5.5} fill="#ffffff"/>) }
        </g>
      </svg>
      {roles && <div style={{position: "absolute", top: size + 20, left: -32, right: -32, textAlign: "center", fontSize: 17, fontWeight: 500, color: "#27272a"}}>{["Reports", "Evidence", "Coordinator", "Calls", "Follow-ups"][i]}</div>}
    </div>
  })}</>
}

export function CommunityOfficeGraphic({fontFamily}: {fontFamily: string}) {
  const frame = useCurrentFrame()
  const shades = ["#e4ecff", "#f2e6ed", "#e4eee9", "#ece6fa", "#e4ecff", "#e4eee9", "#f2e6ed"]
  return <div style={{position: "absolute", inset: 0, fontFamily}}>
    <div style={{position: "absolute", top: 220, left: 0, right: 0, textAlign: "center", fontSize: 19, color: "#555664", opacity: interpolate(frame, [13, 28], [0, 1], clamp)}}>Residents across the neighbourhood</div>
    {shades.map((shade, i) => {
      const enter = spring({frame: frame - 16 - i * 3, fps: 30, config: {damping: 20, stiffness: 130}})
      return <div key={i} style={{position: "absolute", left: 351 + i * 84, top: 262, width: 58, height: 58,
        borderRadius: "50%", background: shade, color: "#474954", border: "2px solid #ffffff", display: "grid", placeItems: "center",
        opacity: Math.min(1, enter * 2), transform: `translateY(${(1-enter)*20}px) scale(${enter})`}}><UserRound size={29} strokeWidth={1.5}/></div>
    })}
    <div style={{position: "absolute", top: 352, left: 402, width: 476, height: 1, background: "#7c72a54d", opacity: interpolate(frame, [36, 52], [0, 1], clamp)}}/>
    <div style={{position: "absolute", top: 375, left: 0, right: 0, textAlign: "center", fontSize: 19, color: "#555664", opacity: interpolate(frame, [42, 58], [0, 1], clamp)}}>One autonomous team works on their behalf</div>
    <AgentOrbs homeY={491} roles/>
  </div>
}

export function OfficeCallPhone({fontFamily}: {fontFamily: string}) {
  const frame = useCurrentFrame()
  const {fps} = useVideoConfig()
  const enter = spring({frame: frame - 26, fps, config: {damping: 21, stiffness: 100}})
  return <div style={{position: "absolute", left: 79, top: 259, width: 218, height: 403,
    padding: 5, borderRadius: 39, background: "linear-gradient(120deg,#a1a3ab,#292b31 28%,#747781 65%,#24252b)",
    boxShadow: "0 7px 14px rgba(20,20,40,.16)", fontFamily,
    opacity: Math.min(1, enter * 2), transform: `translateY(${(1 - enter) * 65}px) rotate(-3deg)`}}>
    <div style={{height: "100%", borderRadius: 34, overflow: "hidden", position: "relative", color: "#fafafa",
      background: "linear-gradient(160deg,#3c424c,#191d25 45%,#080b11)", border: "2px solid #08090b"}}>
      <div style={{position: "absolute", top: 11, left: 70, width: 68, height: 20, background: "#050609", borderRadius: 15}}/>
      <div style={{position: "absolute", top: 58, left: 12, right: 12, textAlign: "center"}}>
        <div style={{fontSize: 12, color: "#aeb4c0", marginBottom: 8}}>Office line</div>
        <div style={{fontSize: 22, lineHeight: 1.2, fontWeight: 500}}>{contact.office_name}</div>
        <div style={{fontSize: 13, color: "#b8beca", marginTop: 12}}>Calling<span style={{opacity: .4 + .6 * Math.abs(Math.sin(frame * .065))}}>…</span></div>
      </div>
      <div style={{position: "absolute", top: 198, left: 22, right: 22, display: "flex", justifyContent: "space-between"}}>
        {[[MicOff, "Mute"], [Grid3X3, "Keypad"], [Volume2, "Audio"]].map(([Icon, title]) => {
          const Glyph = Icon as typeof MicOff
          return <div key={title as string} style={{textAlign: "center"}}>
            <div style={{width: 43, height: 43, borderRadius: "50%", background: "#ffffff19", display: "grid", placeItems: "center"}}><Glyph size={19}/></div>
            <div style={{fontSize: 10, marginTop: 8, color: "#d1d4db"}}>{title as string}</div>
          </div>
        })}
      </div>
      <div style={{position: "absolute", bottom: 53, left: 78, width: 51, height: 51, borderRadius: "50%", background: "#e84a50", display: "grid", placeItems: "center"}}>
        <Phone size={23} fill="white" style={{transform: "rotate(135deg)"}}/>
      </div>
      <div style={{position: "absolute", bottom: 10, left: 68, width: 73, height: 4, borderRadius: 4, background: "#e8e9ee"}}/>
    </div>
  </div>
}

export function WardDirectoryGraphic({fontFamily}: {fontFamily: string}) {
  const frame = useCurrentFrame()
  const reveal = interpolate(frame, [24, 42], [0, 1], clamp)
  const scroll = interpolate(frame, [48, 77], [0, 110], {...clamp, easing: t => t * t * (3 - 2 * t)})
  const click = frame >= 97
  const rows = [...directory.filter(row => row.contact_id !== contact.contact_id), contact]
  const cursorX = interpolate(frame, [35, 55, 78, 92], [894, 930, 930, 855], clamp)
  const cursorY = interpolate(frame, [35, 55, 78, 92], [287, 407, 530, 627], clamp)
  return <div style={{fontFamily, opacity: reveal}}>
    <div style={{position: "absolute", left: 320, top: 205, width: 640, height: 480, borderRadius: 25,
      border: "1px solid #d9dce5", background: "#fbfbfdf5", boxShadow: "0 4px 8px #18182d12", overflow: "hidden",
      transform: `translateY(${(1 - reveal) * 20}px)`}}>
      <div style={{position: "absolute", left: 0, right: 0, top: 0, zIndex: 3, height: 65, display: "flex", alignItems: "center", gap: 12, padding: "0 24px",
        background: "#fbfbfd", borderBottom: "1px solid #e1e3e9"}}>
        <span style={{fontSize: 20, fontWeight: 500}}>Public ward directory</span>
        <div style={{marginLeft: "auto", display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: "#767985"}}><Search size={15}/> Pune Municipal Corporation</div>
      </div>
      <div style={{position: "absolute", inset: 0, overflow: "hidden", margin: "0 14px"}}>
        <div style={{transform: `translateY(${65 - scroll}px)`}}>
          {rows.map(row => {
            const selected = row.contact_id === contact.contact_id && click
            return <div key={row.contact_id} style={{height: 85, boxSizing: "border-box", display: "flex", alignItems: "center", gap: 11, padding: "0 10px",
              background: selected ? "#eaf1ff" : "transparent", borderBottom: "1px solid #e8e9ee", borderRadius: selected ? 12 : 0}}>
              <div style={{width: 39, height: 39, borderRadius: 11, display: "grid", placeItems: "center", background: selected ? "#075ef2" : "#eceef3", color: selected ? "white" : "#5a606d"}}><Building2 size={19}/></div>
              <div style={{flex: 1, minWidth: 0}}><div style={{fontSize: 16, fontWeight: 500, lineHeight: 1.3}}>{row.office_name}</div><div style={{fontSize: 12, color: "#757985", marginTop: 5}}>{row.position}</div></div>
              <div style={{marginLeft: "auto", flexShrink: 0, color: selected ? "white" : "#313744", background: selected ? "#075ef2" : "#f0f1f5", border: "1px solid #dee1e8", borderRadius: 18, padding: "8px 10px", display: "flex", alignItems: "center", gap: 5, fontSize: 12}}>
                {selected ? "Contact selected" : "View contact"}<ArrowUpRight size={15}/>
              </div>
            </div>
          })}
        </div>
        <div style={{position: "absolute", right: 0, top: 77 + scroll * .4, width: 4, height: 93, borderRadius: 3, background: "#c3c7d1"}}/>
      </div>
    </div>
    <div style={{position: "absolute", left: cursorX, top: cursorY, transform: `scale(${frame >= 96 && frame <= 101 ? .85 : 1})`}}>
      {frame >= 96 && frame <= 107 && <div style={{position: "absolute", left: -14, top: -14, width: 32, height: 32, borderRadius: "50%", border: "2px solid #075ef2", opacity: 1 - (frame - 96) / 12, transform: `scale(${1 + (frame - 96) / 9})`}}/>}
      <MousePointer2 size={30} fill="#17191e" stroke="white" strokeWidth={1.5}/>
    </div>
  </div>
}
