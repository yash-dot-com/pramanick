import sharp from "sharp"
import { mkdirSync } from "node:fs"
const folder = "public/demo-office/evidence"
mkdirSync(folder, { recursive: true })
for (const category of ["roads", "water", "lighting", "drainage"])
  for (const phase of ["report", "verification"]) {
    const fixed = category === "roads" && phase === "verification"
    const label = fixed
      ? "REPAIR CHECK"
      : phase === "verification"
        ? "PROBLEM STILL REPORTED"
        : "LOCATION &amp; PROBLEM"
    const artwork =
      category === "lighting"
        ? '<path d="M240 410V220H310M480 410V220H550M720 410V220H790" fill="none" stroke="#475569" stroke-width="15"/><circle cx="310" cy="230" r="22" fill="#a1a1aa"/><circle cx="550" cy="230" r="22" fill="#a1a1aa"/><circle cx="790" cy="230" r="22" fill="#a1a1aa"/>'
        : category === "roads"
          ? `<path d="M170 290H790V430H170Z" fill="#64748b"/><path d="M170 360H790" stroke="#f8fafc" stroke-dasharray="50 30" stroke-width="6"/><ellipse cx="330" cy="325" rx="65" ry="25" fill="${fixed ? "#334155" : "#9b6d42"}"/><ellipse cx="610" cy="390" rx="80" ry="25" fill="${fixed ? "#334155" : "#9b6d42"}"/>`
          : category === "water"
            ? '<path d="M180 340H440V250H520V340H780" fill="none" stroke="#64748b" stroke-width="40"/><ellipse cx="485" cy="420" rx="150" ry="28" fill="#7dd3fc"/><path d="M480 350v50m-30-30-10 30m65-30 10 30" stroke="#0ea5e9" stroke-width="8"/>'
            : '<rect x="180" y="290" width="600" height="130" rx="10" fill="#94a3b8"/><path d="M230 300v110m60-110v110m60-110v110m60-110v110m60-110v110m60-110v110m60-110v110m60-110v110m60-110v110" stroke="#475569" stroke-width="18"/><ellipse cx="480" cy="420" rx="250" ry="30" fill="#7dd3fc"/>'
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="600"><rect width="960" height="600" fill="#f8fafc"/><rect x="40" y="40" width="880" height="520" rx="22" fill="#fff" stroke="#cbd5e1"/><text x="75" y="95" font-family="sans-serif" font-size="16" fill="#0f766e" letter-spacing="3">PRAMANIK · FICTIONAL CASE FILE</text><text x="75" y="150" font-family="sans-serif" font-size="32" font-weight="bold" fill="#0f172a">${category.toUpperCase()} · ${label}</text><text x="75" y="190" font-family="sans-serif" font-size="18" fill="#64748b">Illustration of a scripted resident observation</text>${artwork}<text x="75" y="515" font-family="sans-serif" font-size="17" fill="#92400e">DEMO ILLUSTRATION — NOT A SITE PHOTOGRAPH</text></svg>`
    await sharp(Buffer.from(svg))
      .png()
      .toFile(`${folder}/${category}-${phase}.png`)
  }
console.log("Created 8 clearly labeled demonstration illustrations")
