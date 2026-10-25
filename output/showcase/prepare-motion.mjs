import fs from "node:fs/promises"
import { execFile } from "node:child_process"
import { promisify } from "node:util"

const run = promisify(execFile)
const scenes = JSON.parse(
  await fs.readFile(process.argv[2] || "src/follow-through-scenes.json", "utf8")
)
const audioFolder = process.argv[3] || "follow-through"
await fs.mkdir(`public/${audioFolder}`, { recursive: true })
let srt = ""
const stamp = (seconds) =>
  new Date(Math.round(seconds * 1000))
    .toISOString()
    .slice(11, 23)
    .replace(".", ",")
for (const [i, scene] of scenes.entries()) {
  const base = `public/${audioFolder}/${scene.id}`
  const cached =
    (await fs.readFile(`${base}.txt`, "utf8").catch(() => "")) ===
      scene.voice &&
    (await fs.stat(`${base}.aiff`).catch(() => ({ size: 0 }))).size > 1024
  await fs.writeFile(`${base}.txt`, scene.voice)
  if (!cached)
    await run("/usr/bin/say", [
      "-v",
      "Aman (English (India))",
      "-r",
      "166",
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
  const natural = Number(stdout.trim())
  if (!Number.isFinite(natural) || natural <= 0)
    throw new Error(
      `No speech generated for ${scene.id}; native speech access may need elevation.`
    )
  const duration = scene.durationInFrames / 30
  const available = duration - 0.85
  const tempo = Math.max(0.82, natural / available)
  await run("/opt/homebrew/bin/ffmpeg", [
    "-y",
    "-v",
    "error",
    "-i",
    `${base}.aiff`,
    "-af",
    `atempo=${tempo},loudnorm=I=-16:TP=-1.5:LRA=9,adelay=300,apad,atrim=duration=${duration}`,
    "-ar",
    "48000",
    "-b:a",
    "192k",
    `${base}.mp3`,
  ])
  srt += `${i + 1}\n${stamp(scene.from / 30 + 0.3)} --> ${stamp(scene.from / 30 + 0.3 + natural / tempo)}\n${scene.voice}\n\n`
  console.log(
    `${scene.id}: ${natural.toFixed(1)}s narration → ${duration}s slot, tempo ${tempo.toFixed(2)}`
  )
}
await fs.writeFile(process.argv[4] || "../pramanik-follow-through-90s.srt", srt)
console.log("Narration ready. No music generated or mixed.")
