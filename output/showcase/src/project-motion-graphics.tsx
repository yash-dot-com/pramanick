import React, {type CSSProperties} from "react"
import {Easing, interpolate, useCurrentFrame} from "remotion"
import {Camera, MapPin, Brain, Check, X, FileText, Phone, Play, ChevronRight, CheckCircle2, ClipboardCheck, Users, Droplets, Lightbulb, Route} from "lucide-react"
import theme from "./project-motion-theme.json"
import caseRecord from "./public-case-motion.json"
import communityCases from "./community-office-cases.json"

// Presentation-only versions of the project's Card, Button and StatusBadge
// surfaces. Tokens are extracted from app/globals.css; status greens match
// lib/civic/status-presentation.ts. No controls submit data or place calls.
const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const
const progress = (f: number, at: number, duration = 18) => interpolate(f,[at,at+duration],[0,1],{...clamp,easing:Easing.out(Easing.cubic)})
const surface: CSSProperties = {background:theme.card, border:`1px solid ${theme.border}`, borderRadius:24, boxShadow:theme["surface-shadow"], boxSizing:"border-box"}
const green = `linear-gradient(180deg,${theme.greenTop},${theme.greenBottom})`
const primary = `linear-gradient(180deg,${theme["button-primary-top"]},${theme["button-primary-bottom"]})`
const press = (f: number, at: number) => interpolate(f,[at-3,at+2,at+9],[1,.94,1],{...clamp,easing:Easing.out(Easing.cubic)})

function Badge({children, success=false}: {children: React.ReactNode;success?:boolean}) {
  return <span style={{display:"inline-flex",alignItems:"center",gap:7,padding:"5px 11px",borderRadius:30,border:`1px solid ${success?"#b7dfd0":theme.border}`,background:success?"#eaf6f0":"#fff",fontSize:15,color:success?"#087b5b":theme.ink}}>
    <span style={{width:6,height:6,borderRadius:9,background:success?"#098363":theme.primary}}/>{children}
  </span>
}
function Cursor({x,y,scale=1,opacity=1}: {x:number;y:number;scale?:number;opacity?:number}) {
  return <svg width={35} height={43} style={{position:"absolute",left:x-4,top:y-3,zIndex:20,opacity,transform:`scale(${scale})`,transformOrigin:"4px 3px",filter:"drop-shadow(0 1px 1px #0003)"}} viewBox="0 0 35 43">
    <path d="M4 3 L5 32 L13 25 L20 39 L27 35 L20 22 L31 21 Z" fill="white" stroke="#202127" strokeWidth={1.7} strokeLinejoin="round"/>
  </svg>
}
function Ripple({x,y,at}: {x:number;y:number;at:number}) {
  const f=useCurrentFrame(), t=progress(f,at,20)
  return <div style={{position:"absolute",left:x-29,top:y-29,width:58,height:58,borderRadius:"50%",border:"1.4px solid #098363",opacity:f>=at?1-t:0,transform:`scale(${1+t*.65})`,pointerEvents:"none",zIndex:8}}/>
}
function Confirm({x,y,at}: {x:number;y:number;at:number}) {
  const f=useCurrentFrame(), selected=f>=at+3
  return <div style={{position:"absolute",left:x-28,top:y-28,width:56,height:56,borderRadius:"50%",border:`1px solid ${selected?"#098363":"#90c9b4"}`,background:selected?green:"#f2faf6",display:"grid",placeItems:"center",color:selected?"white":"#098363",transform:`scale(${press(f,at)})`,boxShadow:selected?"inset 0 1px 0 #ffffff55, 0 2px 3px #087f5b22":theme["button-secondary-shadow"]}}>
    <Check size={27} strokeWidth={2}/>
  </div>
}

export function VerificationGraphic({fontFamily}: {fontFamily:string}) {
  const f=useCurrentFrame(), appeared=progress(f,32), saved=f>=133, verified=f>=181
  const times=[40,78,98,126,145,176,196,230]
  const x=interpolate(f,times,[1120,155,155,243,243,684,684,1180],{...clamp,easing:Easing.inOut(Easing.cubic)})
  const y=interpolate(f,times,[660,443,443,581,581,560,560,650],{...clamp,easing:Easing.inOut(Easing.quad)})
  return <div style={{position:"absolute",inset:0,fontFamily,color:theme.ink,opacity:appeared,transform:`translateY(${12*(1-appeared)}px)`}}>
    <div style={{...surface,position:"absolute",left:92,top:235,width:510,height:382.5}}>
      <div style={{position:"absolute",left:26,top:23,fontSize:27,fontWeight:500}}>Residents check the repair</div>
      <div style={{position:"absolute",left:26,top:72,fontSize:21}}>School gate potholes</div>
      <div style={{position:"absolute",left:26,top:108,fontSize:16,color:theme.muted,display:"flex",gap:6,alignItems:"center"}}><MapPin size={17}/>Kothrud</div>
      <div style={{position:"absolute",left:26,top:151,fontSize:18,color:theme.muted}}>What do you see at the location?</div>
      <Confirm x={63} y={208} at={83}/>
      <div style={{position:"absolute",left:104,top:195,fontSize:21,color:f>=86?"#087b5b":theme.ink}}>Fixed</div>
      <div style={{position:"absolute",left:243,top:180,width:56,height:56,borderRadius:"50%",border:`1px solid ${theme.border}`,background:`linear-gradient(180deg,${theme["button-secondary-top"]},${theme["button-secondary-bottom"]})`,display:"grid",placeItems:"center",color:theme.muted}}><X size={25}/></div>
      <div style={{position:"absolute",left:315,top:195,fontSize:19,color:theme.muted}}>Not fixed</div>
      <div style={{position:"absolute",left:26,top:263,width:458,height:43,border:`1px solid ${theme.border}`,borderRadius:13,background:"#fff",display:"flex",alignItems:"center",gap:10,padding:"0 13px",boxSizing:"border-box",fontSize:17}}><Camera size={20} color={theme.primary}/>school-gate-check.jpg<CheckCircle2 size={18} color="#098363" style={{marginLeft:"auto"}}/></div>
      <div style={{position:"absolute",left:26,top:325,width:250,height:42,borderRadius:30,border:`1px solid ${saved?theme.border:"#0862e880"}`,background:saved?"#edf6f1":primary,boxShadow:saved?theme["button-secondary-shadow"]:theme["button-primary-shadow"],display:"flex",alignItems:"center",justifyContent:"center",gap:8,fontSize:18,fontWeight:500,color:saved?"#087b5b":"#fff",transform:`scale(${press(f,130)})`}}>{saved&&<Check size={18}/>} {saved?"Observation saved":"Save observation"}</div>
    </div>
    <div style={{...surface,position:"absolute",left:628,top:235,width:510,height:382.5,opacity:progress(f,38)}}>
      <div style={{position:"absolute",left:26,top:23,fontSize:27,fontWeight:500}}>Evidence + review</div>
      {[
        {icon:Camera,title:"Resident photo",detail:"Attached to the case",at:135},
        {icon:MapPin,title:"Location",detail:"Attached to the observation",at:140},
        {icon:Brain,title:"Photo assessment",detail:"Supports the resident report",at:145},
      ].map((item,i)=>{const Icon=item.icon;return <div key={item.title} style={{position:"absolute",left:26,top:76+i*62,right:26,display:"flex",alignItems:"center",gap:13}}>
        <div style={{width:36,height:36,borderRadius:11,background:"#edf2fc",color:theme.primary,display:"grid",placeItems:"center"}}><Icon size={21}/></div>
        <div><div style={{fontSize:18}}>{item.title}</div><div style={{fontSize:14,color:theme.muted,marginTop:4}}>{item.detail}</div></div>
        <CheckCircle2 size={21} color="#098363" style={{marginLeft:"auto",opacity:progress(f,item.at,12)}}/>
      </div>})}
      <div style={{position:"absolute",left:26,right:26,top:272,borderTop:`1px solid ${theme.border}`}}/>
      <Confirm x={56} y={325} at={178}/>
      <div style={{position:"absolute",left:100,top:302,fontSize:23,fontWeight:500,color:verified?"#087b5b":theme.ink}}>{verified?"Repair verified":"Verify repair"}</div>
      <div style={{position:"absolute",left:100,top:341,fontSize:15,color:theme.muted}}>Reviewer checks resident evidence</div>
    </div>
    <Ripple x={155} y={443} at={83}/><Ripple x={684} y={560} at={178}/>
    <Cursor x={x} y={y} scale={Math.min(press(f,83),press(f,130),press(f,178))} opacity={progress(f,40)*(1-progress(f,230,10))}/>
  </div>
}

export function DashboardGraphic({fontFamily}: {fontFamily:string}) {
  const f=useCurrentFrame(), show=progress(f,28), selected=f>=136
  const reportCount=communityCases.issues.reduce((total,item)=>total+item.complaintCount,0)
  const labels={following_up:"Agent following up",verified:"Repair verified",awaiting_verification:"Residents checking"}
  return <div style={{position:"absolute",inset:0,fontFamily,color:theme.ink}}>
    <div style={{...surface,position:"absolute",left:320,top:205,width:640,height:480,borderRadius:26,overflow:"hidden",background:"#fcfcfd",opacity:show,transform:`translateY(${15*(1-show)}px)`,boxShadow:"0 5px 14px #25213b17"}}>
      <div style={{height:58,borderBottom:`1px solid ${theme.border}`,background:"#fff",display:"flex",alignItems:"center",padding:"0 21px",gap:12,fontSize:17}}>
        <span style={{fontWeight:600}}>Pramanik</span><span style={{color:theme.muted}}>Community office</span>
        <div style={{marginLeft:"auto",borderRadius:24,background:primary,color:"white",fontSize:12,padding:"6px 12px",boxShadow:theme["button-primary-shadow"]}}>Public dashboard</div>
      </div>
      <div style={{position:"absolute",left:21,right:21,top:76,display:"flex",gap:30}}>
        <div><div style={{fontSize:26,fontWeight:500}}>{communityCases.issues.length}</div><div style={{fontSize:13,color:theme.muted,marginTop:4}}>Shared cases</div></div>
        <div><div style={{fontSize:26,fontWeight:500}}>{reportCount}</div><div style={{fontSize:13,color:theme.muted,marginTop:4}}>Resident reports</div></div>
        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:8,fontSize:14,color:theme.muted}}><Users size={19}/>Open to everyone</div>
      </div>
      <div style={{position:"absolute",left:21,top:139,display:"flex",gap:14,fontSize:13}}><span style={{color:theme.primary,fontWeight:500}}>All community issues</span><span style={{color:theme.muted}}>Call records</span><span style={{color:theme.muted}}>Evidence</span></div>
      {communityCases.issues.map((item,i)=>{
        const Icon=i===0?Droplets:i===1?Route:Lightbulb
        const verified=item.status==="verified", highlight=i===1&&selected
        const status=labels[item.status as keyof typeof labels]
        const area={pcmc:"PCMC",kothrud:"Kothrud",ramwadi:"Ramwadi"}[item.localityId as "pcmc"|"kothrud"|"ramwadi"]
        return <div key={item.id} style={{position:"absolute",left:17,right:17,top:174+i*91,height:83,border:`1px solid ${highlight?theme.primary:theme.border}`,borderRadius:16,background:highlight?"#eef4ff":"#f8f8fa",opacity:progress(f,39+i*5),boxSizing:"border-box"}}>
          <div style={{position:"absolute",left:13,top:15,width:30,height:30,borderRadius:9,background:"#eaf0fc",color:theme.primary,display:"grid",placeItems:"center"}}><Icon size={18}/></div>
          <div style={{position:"absolute",left:54,right:154,top:11,fontSize:16,fontWeight:500,lineHeight:1.25}}>{item.title}</div>
          <div style={{position:"absolute",left:54,bottom:10,display:"flex",alignItems:"center",gap:7,fontSize:12,color:theme.muted}}><MapPin size={13}/>{area}<Users size={14} style={{marginLeft:9}}/>{item.complaintCount} resident reports</div>
          <div style={{position:"absolute",right:12,top:16,maxWidth:128,textAlign:"right",fontSize:11,color:verified?"#087b5b":theme.primary,border:`1px solid ${verified?"#b7dfd0":"#d5e1fa"}`,background:verified?"#eaf6f0":"#edf3ff",borderRadius:20,padding:"6px 8px"}}>{status}</div>
          <div style={{position:"absolute",right:13,bottom:11,display:"flex",alignItems:"center",gap:3,fontSize:12,color:theme.primary}}>Open shared case<ChevronRight size={13}/></div>
        </div>
      })}
      <div style={{position:"absolute",left:21,right:21,bottom:13,fontSize:12,color:theme.muted,display:"flex",alignItems:"center",gap:7}}><CheckCircle2 size={15}/>Agents follow up. Residents verify. Everyone can inspect.</div>
    </div>
    <Cursor x={interpolate(f,[46,85,118,136,160,188],[1040,893,893,870,870,1040],{...clamp,easing:Easing.inOut(Easing.cubic)})} y={interpolate(f,[46,85,118,136,160,188],[690,443,443,540,540,690],{...clamp,easing:Easing.inOut(Easing.quad)})} scale={press(f,136)} opacity={progress(f,48)*(1-progress(f,178,16))}/>
  </div>
}

export function PublicTimelineGraphic({fontFamily}: {fontFamily:string}) {
  const f=useCurrentFrame(), show=progress(f,28), scroll=interpolate(f,[154,266],[0,238],{...clamp,easing:Easing.inOut(Easing.cubic)})
  const starts=[40,76,125,178,228], tops=[0,86,240,352,468], heights=[70,138,96,100,94]
  const date=(value:string)=>new Intl.DateTimeFormat("en-IN",{day:"numeric",month:"short",timeZone:"Asia/Kolkata"}).format(new Date(value))
  return <div style={{...surface,position:"absolute",left:320,top:205,width:640,height:480,borderRadius:25,overflow:"hidden",fontFamily,color:theme.ink,opacity:show,transform:`translateY(${12*(1-show)}px)`,background:"#fcfcfd"}}>
    <div style={{height:68,borderBottom:`1px solid ${theme.border}`,padding:"0 23px",display:"flex",alignItems:"center",gap:12}}>
      <FileText size={24} color={theme.primary}/><div><div style={{fontSize:20,fontWeight:500}}>{caseRecord.title}</div><div style={{fontSize:14,color:theme.muted,marginTop:4}}>Kothrud · Shared community case</div></div>
      <div style={{marginLeft:"auto",opacity:progress(f,246)}}><Badge success>Repair verified</Badge></div>
    </div>
    <div style={{position:"absolute",top:69,left:0,right:0,bottom:0,overflow:"hidden"}}>
      <div style={{position:"absolute",left:23,right:23,top:20,transform:`translateY(${-scroll}px)`}}>
        <div style={{position:"absolute",left:17,top:18,width:2,height:510,background:theme.border}}/>
        <div style={{position:"absolute",left:17,top:18,width:2,height:510,background:theme.primary,transform:`scaleY(${progress(f,40,216)})`,transformOrigin:"top"}}/>
        {caseRecord.events.map((event,i)=>{
          const Icon=event.kind==="report"?FileText:event.kind==="call"||event.kind==="followup"?Phone:event.kind==="evidence"?Camera:ClipboardCheck
          const p=progress(f,starts[i],18),success=event.kind==="verified"
          return <div key={event.title} style={{position:"absolute",left:0,right:0,top:tops[i],height:heights[i],opacity:p,transform:`translateY(${10*(1-p)}px)`}}>
            <div style={{position:"absolute",left:0,top:3,width:36,height:36,borderRadius:"50%",background:success?green:"#edf3ff",border:`1px solid ${success?"#098363":"#cfddf8"}`,color:success?"white":theme.primary,display:"grid",placeItems:"center"}}><Icon size={18}/></div>
            <div style={{position:"absolute",left:53,right:0,top:0,padding:"9px 13px",boxSizing:"border-box",border:`1px solid ${success?"#b7dfd0":theme.border}`,borderRadius:16,background:success?"#f0f8f3":"#f8f8fa"}}>
              <div style={{display:"flex",gap:10,alignItems:"center",fontSize:18,fontWeight:500}}>{event.title}<span style={{marginLeft:"auto",fontSize:13,color:theme.muted,fontWeight:400}}>{date(event.date)}</span></div>
              <div style={{fontSize:14,color:theme.muted,lineHeight:1.45,whiteSpace:"pre-line",marginTop:7}}>{event.kind==="call"&&<span style={{fontWeight:500,color:theme.ink}}>Summary: </span>}{event.summary}</div>
              {event.kind==="call"&&<div style={{display:"flex",gap:9,alignItems:"center",marginTop:10,fontSize:13}}>
                <span style={{display:"inline-flex",gap:7,alignItems:"center",border:`1px solid ${theme.border}`,borderRadius:20,padding:"5px 10px",background:"white"}}><Play size={13} fill={theme.primary} color={theme.primary}/>Call recording · 0:21</span>
                <span style={{color:theme.primary}}>Promise due {date(event.deadline!)}</span>
              </div>}
            </div>
          </div>
        })}
      </div>
    </div>
  </div>
}
