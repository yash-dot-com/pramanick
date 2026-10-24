import { mkdirSync, mkdtempSync, writeFileSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { resolve } from "node:path"
import { execFileSync } from "node:child_process"
import { demoOfficeCases } from "../lib/civic/demo-office-data"

const output = resolve("public/demo-office/audio")
mkdirSync(output, { recursive: true })
const temporary = mkdtempSync(resolve(tmpdir(), "pramanik-audio-"))
const manifest: Record<string, { duration: number; source: string }> = {}
for (const issue of demoOfficeCases)
  for (const call of issue.calls) {
    const parts = call.turns.map(([speaker, words], index) => {
      const path = resolve(temporary, `${call.key}-${index}.aiff`)
      const voice =
        speaker === "agent"
          ? "Aman"
          : issue.officer === 0
            ? "Samantha"
            : "Daniel"
      execFileSync("say", ["-v", voice, "-r", "165", "-o", path, words])
      const normalized = path.replace(/\.aiff$/, ".wav")
      execFileSync("ffmpeg", [
        "-y",
        "-v",
        "error",
        "-i",
        path,
        "-ar",
        "22050",
        "-ac",
        "1",
        normalized,
      ])
      return normalized
    })
    const list = resolve(temporary, `${call.key}.txt`)
    writeFileSync(list, parts.map((path) => `file '${path}'`).join("\n"))
    const target = resolve(output, `${call.key}.mp3`)
    execFileSync("ffmpeg", [
      "-y",
      "-v",
      "error",
      "-f",
      "concat",
      "-safe",
      "0",
      "-i",
      list,
      "-ar",
      "22050",
      "-ac",
      "1",
      "-b:a",
      "64k",
      target,
    ])
    const duration = Number(
      execFileSync(
        "ffprobe",
        [
          "-v",
          "quiet",
          "-show_entries",
          "format=duration",
          "-of",
          "csv=p=0",
          target,
        ],
        { encoding: "utf8" }
      ).trim()
    )
    manifest[call.key] = {
      duration,
      source: "Synthetic speech of fictional scripted dialogue",
    }
    console.log(
      `${call.key}: ${duration.toFixed(1)} seconds, ${readFileSync(target).length} bytes`
    )
  }
writeFileSync(
  resolve(output, "manifest.json"),
  JSON.stringify(manifest, null, 2) + "\n"
)
