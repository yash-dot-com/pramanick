import fs from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const run=promisify(execFile);
const scenes=JSON.parse(await fs.readFile(new URL('./src/scenes.json',import.meta.url)));
const captions=[];
let srt='',cue=1;
const stamp=(s)=>new Date(Math.round(s*1000)).toISOString().slice(11,23).replace('.',',');
for(const [i,scene] of scenes.entries()) {
  await fs.writeFile(`public/voice-${i}.txt`,scene.voice);
  await run('/usr/bin/say',['-v','Aman (English (India))','-r','165','-f',`public/voice-${i}.txt`,'-o',`public/voice-${i}.aiff`]);
  const {stdout}=await run('/opt/homebrew/bin/ffprobe',['-v','error','-show_entries','format=duration','-of','csv=p=0',`public/voice-${i}.aiff`]);
  const natural=Number(stdout.trim());
  const target=scene.duration-0.35;
  const tempo=natural>target?natural/target:Math.max(.9,natural/target);
  await run('/opt/homebrew/bin/ffmpeg',['-y','-v','error','-i',`public/voice-${i}.aiff`,'-af',`atempo=${tempo},loudnorm=I=-16:TP=-1.5:LRA=9,apad,atrim=duration=${scene.duration}`,'-ar','48000','-b:a','192k',`public/voice-${i}.mp3`]);
  const actual=natural/tempo;
  const words=scene.voice.split(/\s+/);
  // Phrase-aligned captions; within-phrase word times are evenly estimated.
  let cursor=0;
  const weights=words.map(w=>w.length+(/[,.:!?]$/.test(w)?3:1));
  const sum=weights.reduce((a,b)=>a+b,0);
  words.forEach((text,j)=>{const startMs=(scene.start+cursor)*1000;cursor+=actual*weights[j]/sum;captions.push({text,startMs,endMs:(scene.start+cursor)*1000});});
  for(let j=0;j<words.length;j+=7) {
    const subset=captions.slice(-words.length+j,-words.length+Math.min(j+7,words.length)||undefined);
    if(subset.length)srt+=`${cue++}\n${stamp(subset[0].startMs/1000)} --> ${stamp(subset.at(-1).endMs/1000)}\n${subset.map(w=>w.text).join(' ')}\n\n`;
  }
  console.log(`Narration ${i+1}/9: ${natural.toFixed(2)}s → ${actual.toFixed(2)}s`);
}
await fs.writeFile('src/captions.json',JSON.stringify(captions,null,2));
await fs.writeFile('../pramanik-showcase.srt',srt);
const rate=24000,length=60*rate;
const pcm=Buffer.alloc(length*2);
const chords=[[130.81,164.81,196],[110,130.81,164.81],[87.31,130.81,174.61],[98,146.83,196]];
for(let n=0;n<length;n++) {const t=n/rate;const chord=chords[Math.floor(t/4)%4];let v=0;for(const hz of chord)v+=Math.sin(t*hz*2*Math.PI)*.04;const pulse=Math.exp(-((t%0.5)*12))*.035*Math.sin(t*196*2*Math.PI);const fade=Math.min(1,t/2,(60-t)/3);pcm.writeInt16LE(Math.round((v+pulse)*fade*32767),n*2);}
const header=Buffer.alloc(44);header.write('RIFF');header.writeUInt32LE(36+pcm.length,4);header.write('WAVE',8);header.write('fmt ',12);header.writeUInt32LE(16,16);header.writeUInt16LE(1,20);header.writeUInt16LE(1,22);header.writeUInt32LE(rate,24);header.writeUInt32LE(rate*2,28);header.writeUInt16LE(2,32);header.writeUInt16LE(16,34);header.write('data',36);header.writeUInt32LE(pcm.length,40);
await fs.writeFile('public/music.wav',Buffer.concat([header,pcm]));
await fs.writeFile('../pramanik-showcase-script.md',scenes.map(s=>`**${s.start}–${s.start+s.duration}s — ${s.eyebrow}**\n\n${s.voice}\n\nVisual: ${s.shot}\n`).join('\n'));
