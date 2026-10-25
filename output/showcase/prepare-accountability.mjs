import fs from "node:fs/promises"
import { execFile } from "node:child_process"
import { promisify } from "node:util"

const run = promisify(execFile)
const scenes = JSON.parse(
  await fs.readFile("src/accountability-scenes.json", "utf8")
)
if (scenes.at(-1).start + scenes.at(-1).duration !== 75)
  throw new Error("Film must be exactly 75 seconds")
for (let i = 1; i < scenes.length; i++)
  if (scenes[i].start !== scenes[i - 1].start + scenes[i - 1].duration)
    throw new Error("Timeline gap or overlap")
await fs.mkdir("public/accountability", { recursive: true })
const captions = []
const stamp = (seconds) =>
  new Date(Math.round(seconds * 1000))
    .toISOString()
    .slice(11, 23)
    .replace(".", ",")
let srt = "",
  cue = 1

for (const [i, scene] of scenes.entries()) {
  const segments = [
    { speaker: "Aman (English (India))", text: scene.voice },
    ...(scene.dialogue || []),
  ]
  const inputs = [],
    durations = []
  for (const [j, segment] of segments.entries()) {
    const base = `public/accountability/segment-${i}-${j}`
    await fs.writeFile(`${base}.txt`, segment.text)
    await run("/usr/bin/say", [
      "-v",
      segment.speaker,
      "-r",
      "165",
      "-f",
      `${base}.txt`,
      "-o",
      `${base}.aiff`,
    ])
    const { stdout } = await run("/opt/homebrew/bin/ffprobe", [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "csv=p=0",
      `${base}.aiff`,
    ])
    const duration = Number(stdout.trim())
    if (!Number.isFinite(duration) || duration <= 0)
      throw new Error(
        `No speech audio produced for ${base}; the macOS speech service may require permission outside the sandbox.`
      )
    durations.push(duration)
    inputs.push("-i", `${base}.aiff`)
  }
  const natural = durations.reduce((a, b) => a + b, 0)
  const target = scene.duration - 0.7
  const tempo = Math.max(0.96, natural / target)
  const concat =
    segments.length === 1
      ? "[0:a]anull[joined]"
      : `${segments.map((_, j) => `[${j}:a]`).join("")}concat=n=${segments.length}:v=0:a=1[joined]`
  await run("/opt/homebrew/bin/ffmpeg", [
    "-y",
    "-v",
    "error",
    ...inputs,
    "-filter_complex",
    `${concat};[joined]atempo=${tempo},loudnorm=I=-16:TP=-1.5:LRA=9,adelay=250,apad,atrim=duration=${scene.duration}[out]`,
    "-map",
    "[out]",
    "-ar",
    "48000",
    "-b:a",
    "192k",
    `public/accountability/voice-${i}.mp3`,
  ])
  let offset = scene.start + 0.25
  for (const [j, segment] of segments.entries()) {
    const words = segment.text.split(/\s+/)
    const weights = words.map(
      (word) => word.length + (/[,.?!:]$/.test(word) ? 4 : 1)
    )
    const total = weights.reduce((a, b) => a + b, 0)
    const duration = durations[j] / tempo
    let cursor = 0
    const entries = words.map((text, k) => {
      const startMs = (offset + cursor) * 1000
      cursor += (duration * weights[k]) / total
      return { text, startMs, endMs: (offset + cursor) * 1000 }
    })
    captions.push(...entries)
    for (let k = 0; k < entries.length; k += 6) {
      const chunk = entries.slice(k, k + 6)
      srt += `${cue++}\n${stamp(chunk[0].startMs / 1000)} --> ${stamp(chunk.at(-1).endMs / 1000)}\n${chunk.map((word) => word.text).join(" ")}\n\n`
    }
    offset += duration
  }
  console.log(
    `${scene.id}: ${natural.toFixed(1)}s speech in ${scene.duration}s scene (tempo ${tempo.toFixed(2)})`
  )
}
await fs.writeFile(
  "src/accountability-captions.json",
  JSON.stringify(captions, null, 2)
)
await fs.writeFile("../pramanik-accountability-75s.srt", srt)

const rate = 24000,
  seconds = 75,
  pcm = Buffer.alloc(rate * seconds * 2)
const chords = [
  [130.81, 164.81, 196],
  [110, 146.83, 174.61],
  [87.31, 130.81, 164.81],
  [98, 146.83, 196],
]
for (let n = 0; n < rate * seconds; n++) {
  const t = n / rate
  const phase = t % 5
  const chord = chords[Math.floor(t / 5) % chords.length]
  const envelope = Math.min(1, phase / 0.6, (5 - phase) / 0.7)
  let value = chord.reduce(
    (sum, hz) => sum + Math.sin(2 * Math.PI * hz * t) * 0.035 * envelope,
    0
  )
  value += Math.sin(((2 * Math.PI * chord[0]) / 2) * t) * 0.025
  const beat = t % 0.6
  value += Math.sin(2 * Math.PI * 392 * t) * Math.exp(-beat * 18) * 0.012
  value *= Math.max(0, Math.min(1, t / 2, (seconds - t) / 3))
  pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, value)) * 32767), n * 2)
}
const wav = Buffer.alloc(44)
wav.write("RIFF")
wav.writeUInt32LE(36 + pcm.length, 4)
wav.write("WAVE", 8)
wav.write("fmt ", 12)
wav.writeUInt32LE(16, 16)
wav.writeUInt16LE(1, 20)
wav.writeUInt16LE(1, 22)
wav.writeUInt32LE(rate, 24)
wav.writeUInt32LE(rate * 2, 28)
wav.writeUInt16LE(2, 32)
wav.writeUInt16LE(16, 34)
wav.write("data", 36)
wav.writeUInt32LE(pcm.length, 40)
await fs.writeFile("public/accountability/music.wav", Buffer.concat([wav, pcm]))
console.log(
  "Prepared 75s narration, illustrative dialogue, captions and original music."
)
