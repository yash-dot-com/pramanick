import Image from "next/image"
import { OpenAiLogoIcon } from "@phosphor-icons/react/ssr"
import { LocalizedText } from "@/components/language-provider"

const technologies = [
  {
    name: "OpenAI",
    label: "Agents SDK",
    description:
      "A coordinator and parallel specialists turn reports, evidence and conversation history into the next action.",
    href: "https://openai.github.io/openai-agents-js/",
    icon: null,
  },
  {
    name: "Bolna",
    label: "Voice follow-ups",
    description:
      "Phone conversations, call records and transcripts keep each follow-up connected to its case.",
    href: "https://www.bolna.ai/",
    icon: "/brands/bolna.ico",
  },
  {
    name: "Sarvam AI",
    label: "Indian-language speech",
    description:
      "Speech recognition and voice responses help residents explain an issue in their own language.",
    href: "https://www.sarvam.ai/",
    icon: "/brands/sarvam.ico",
  },
  {
    name: "Next.js",
    label: "Public application",
    description:
      "The issue map, public timeline and conversation evidence come together in one interface.",
    href: "https://nextjs.org/",
    icon: "/brands/nextjs.ico",
  },
  {
    name: "SQLite",
    label: "Case memory",
    description:
      "Reports, promises, deadlines and past conversations stay in a durable case record.",
    href: "https://www.sqlite.org/",
    icon: "/brands/sqlite.ico",
  },
  {
    name: "MapLibre",
    label: "Location context",
    description:
      "A shared map connects every complaint and resident check to the place that needs attention.",
    href: "https://maplibre.org/",
    icon: "/brands/maplibre.ico",
  },
]

export function TechnologyStack() {
  return (
    <section
      aria-labelledby="technology-heading"
      className="relative border-t bg-background px-6 py-20 sm:px-10 sm:py-24"
    >
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 max-w-xl space-y-4">
          <p className="text-[10px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
            <LocalizedText text="Built with" />
          </p>
          <h2
            id="technology-heading"
            className="font-heading text-4xl leading-tight font-normal tracking-tight sm:text-5xl"
          >
            <LocalizedText text="An office powered by agents." />
          </h2>
          <p className="text-sm leading-7 text-muted-foreground">
            <LocalizedText text="Built for the OpenAI hackathon. Reasoning, voice, memory and location work together to keep the next follow-up moving." />
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {technologies.map((technology) => (
            <a
              key={technology.name}
              href={technology.href}
              target="_blank"
              rel="noreferrer"
              className="flex flex-col gap-5 rounded-2xl border bg-card p-6 shadow-[var(--surface-shadow)] transition-colors hover:border-primary/30 focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border bg-white text-zinc-900 shadow-[var(--surface-shadow)]">
                  {technology.icon ? (
                    <Image
                      src={technology.icon}
                      alt=""
                      width={26}
                      height={26}
                      unoptimized
                      className="size-6 object-contain"
                    />
                  ) : (
                    <OpenAiLogoIcon className="size-7" />
                  )}
                </span>
                <div>
                  <h3 className="text-sm font-semibold">{technology.name}</h3>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    <LocalizedText text={technology.label} />
                  </p>
                </div>
              </div>
              <p className="text-xs leading-6 text-muted-foreground">
                <LocalizedText text={technology.description} />
              </p>
              <span className="mt-auto text-[11px] font-medium text-primary">
                <LocalizedText text="Explore the technology" />{" "}
                <span aria-hidden>↗</span>
              </span>
            </a>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t pt-6 text-[11px] text-muted-foreground">
          <p>
            <LocalizedText text="Also built with React, TypeScript, shadcn/ui and Tailwind CSS." />
          </p>
          <a
            href="https://github.com/yash-dot-com/pramanick"
            target="_blank"
            rel="noreferrer"
            className="text-primary hover:underline"
          >
            <LocalizedText text="View the project on GitHub" /> ↗
          </a>
        </div>
      </div>
    </section>
  )
}
