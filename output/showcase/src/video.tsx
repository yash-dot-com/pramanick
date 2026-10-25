import React from 'react';
import { AbsoluteFill, Audio, Composition, Img, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { TextReveal } from '../components/snap-cn/text-reveal';
import { ScreenRecording } from '../components/snap-cn/screen-recording';
import { WordCaptions } from '../components/snap-cn/word-captions';
import scenes from './scenes.json';
import captions from './captions.json';

const paper = '#f8faef', ink = '#103c30', lime = '#c9ed54';
const theme = {background:paper, foreground:ink, primary:ink, primaryForeground:paper, fontFamily:'Arial'};

function Shot({file,vertical}:{file:string;vertical:boolean}) {
  const frame = useCurrentFrame();
  const fileToUse = vertical && file.includes('wide') ? 'office.png' : !vertical && file==='claim.png' ? 'claim-landscape.png' : !vertical && (file==='calls.png'||file==='promises.png') ? 'calls-landscape.png' : file;
  const aspect = ['office-wide.png','calls-landscape.png','claim-landscape.png','summary.png'].includes(fileToUse)?16/9:870/743;
  return <div style={{position:'absolute',inset:0,overflow:'hidden',borderRadius:18,background:'#fff'}}>
    {vertical ? <Img src={staticFile(`shots/${fileToUse}`)} style={{width:'100%',height:'100%',objectFit:'contain'}}/> : <ScreenRecording src={staticFile(`shots/${fileToUse}`)} sourceAspect={aspect} fit="contain" backdropColor="#ffffff" entrance="none" camera={[{at:12,duration:36,zoom:file.includes('wide')?1.32:1,x:0.5,y:0.46}]} theme={theme} />}
    <div style={{position:'absolute',bottom:0,left:0,right:0,height:3,background:lime,transformOrigin:'left',transform:`scaleX(${interpolate(frame,[0,180],[0,1],{extrapolateRight:'clamp'})})`}}/>
  </div>;
}

function Beat({scene,index}:{scene:typeof scenes[number];index:number}) {
  const {width,height}=useVideoConfig();
  const vertical=height>width;
  const f=useCurrentFrame();
  const opening=index===0, ending=index===8;
  const reveal=interpolate(f,[0,12],[0,1],{extrapolateRight:'clamp'});
  const titleTop=vertical?186:195;
  const shotTop=vertical?478:133;
  return <AbsoluteFill style={{background:opening||ending?ink:paper,color:opening||ending?paper:ink,fontFamily:'Arial',overflow:'hidden'}}>
    <div style={{position:'absolute',left:vertical?46:52,top:36,fontFamily:'Georgia',fontSize:30,fontWeight:700}}>Pramanik<span style={{color:lime}}>·</span></div>
    <div style={{position:'absolute',right:vertical?46:52,top:45,fontSize:13,color:opening||ending?'#c3d4bc':'#657969'}}>An open AI accountability office</div>
    {opening||ending ? <>
      <div style={{position:'absolute',left:vertical?46:72,right:vertical?46:72,top:vertical?210:175,fontSize:15,color:lime}}>{opening?'The missing step after a complaint.':'Public accountability, with follow-through.'}</div>
      <div style={{position:'absolute',left:vertical?26:50,right:vertical?26:50,top:vertical?270:205,height:vertical?270:185}}>
        <TextReveal text={vertical&&opening?'Complaints':scene.title} fontSize={vertical?58:70} color={paper} fontWeight={600} fontFamily="Georgia" initialScale={1.3} introDuration={6} holdDuration={8} recedeDuration={20} assembleDuration={30} theme={{...theme,foreground:paper}} />
      </div>
      {vertical&&opening&&<div style={{position:'absolute',left:46,right:46,top:440,fontFamily:'Georgia',fontSize:58,fontWeight:600,lineHeight:1.08}}>don’t fix themselves.</div>}
      <div style={{position:'absolute',top:vertical?590:423,left:vertical?46:76,right:vertical?46:76,fontSize:vertical?28:30,lineHeight:1.3,color:'#d8e5ce',opacity:reveal}}>{scene.detail}</div>
      <div style={{position:'absolute',left:vertical?46:76,top:vertical?742:512,display:'flex',gap:12,flexWrap:'wrap'}}>
        {(opening?['Report','Coordinate','Call','Follow up','Verify']:['Promises','Evidence','Resident verification']).map((label,i)=><div key={label} style={{padding:'11px 16px',border:'1px solid #5e7764',borderRadius:50,fontSize:16,color:i===4?ink:paper,background:i===4?lime:'transparent'}}>{label}</div>)}
      </div>
      {ending&&<div style={{position:'absolute',left:vertical?46:76,top:vertical?870:640,color:lime,fontSize:vertical?23:22}}>{scene.tag}</div>}
    </> : <>
      <div style={{position:'absolute',left:vertical?46:52,top:vertical?136:145,fontSize:15,color:'#617d62'}}>{scene.eyebrow}</div>
      <div style={{position:'absolute',left:vertical?46:52,top:titleTop,width:vertical?628:345,fontFamily:'Georgia',fontSize:vertical?46:43,lineHeight:1.08,fontWeight:700,opacity:reveal,transform:`translateY(${(1-reveal)*16}px)`}}>{scene.title}</div>
      <div style={{position:'absolute',left:vertical?46:52,top:vertical?348:394,width:vertical?610:340,fontSize:vertical?24:22,lineHeight:1.4,color:'#516459',opacity:reveal}}>{scene.detail}</div>
      <div style={{position:'absolute',left:vertical?30:445,top:shotTop,width:vertical?660:790,height:vertical?562:446,border:'1px solid #c7d2bd',borderRadius:19,boxShadow:'0 3px 0 #e4e9dc'}}>
        <Shot file={index===7&&f>120?'summary.png':scene.shot} vertical={vertical}/>
      </div>
      <div style={{position:'absolute',left:vertical?46:445,top:vertical?1055:632,right:40,fontSize:vertical?19:17,color:'#48664c'}}>{scene.tag}</div>
      {index===3&&<div style={{position:'absolute',left:vertical?46:52,top:vertical?426:524,display:'flex',alignItems:'center',gap:4,height:30}}>{Array.from({length:25},(_,i)=><span key={i} style={{width:4,height:8+Math.abs(Math.sin(f/7+i*1.4))*22,background:i%3===0?'#8ba745':ink,borderRadius:4}}/>)}</div>}
    </>}
    {!opening&&!ending&&<div style={{position:'absolute',bottom:vertical?100:61,left:vertical?46:52,fontSize:vertical?13:11,color:'#738071'}}>Actual product UI · Illustrative cases · Scripted officer conversations</div>}
    <div style={{position:'absolute',bottom:25,left:vertical?46:52,right:vertical?46:52,height:2,background:opening||ending?'#426151':'#dce4d2'}}><div style={{height:2,background:opening||ending?lime:ink,width:`${((scene.start+f/30)/60)*100}%`}}/></div>
  </AbsoluteFill>;
}

function Video() {
  const {height,width}=useVideoConfig();
  const vertical=height>width;
  return <AbsoluteFill>
    {scenes.map((scene,index)=><Sequence key={index} from={scene.start*30} durationInFrames={scene.duration*30}>
      <Beat scene={scene} index={index}/>
      <Audio src={staticFile(`voice-${index}.mp3`)} volume={1}/>
    </Sequence>)}
    <Audio src={staticFile('music.wav')} volume={0.16}/>
    <div style={{position:'absolute',inset:0,pointerEvents:'none'}}><WordCaptions captions={captions} preset="boxed" maxWords={vertical?6:10} maxChars={vertical?42:80} fontSize={vertical?25:23} fontFamily="Arial" uppercase={false} aspect={vertical?'9:16':'16:9'} theme={{background:ink,foreground:paper}} /></div>
  </AbsoluteFill>;
}

export const Root=()=> <>
  <Composition id="PramanikLandscape" component={Video} durationInFrames={1800} fps={30} width={1280} height={720}/>
  <Composition id="PramanikReel" component={Video} durationInFrames={1800} fps={30} width={720} height={1280}/>
</>;
