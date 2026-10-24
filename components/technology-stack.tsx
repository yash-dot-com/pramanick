import Image from "next/image"
import { OpenAiLogoIcon } from "@phosphor-icons/react/ssr"
import { LocalizedText } from "@/components/language-provider"

const technologies = [
  {
    name: "OpenAI Agents SDK",
    label: "Coordinator & parallel specialists",
    description:
      "A coordinator and parallel specialists turn reports, evidence and conversation history into the next action.",
    href: "https://openai.github.io/openai-agents-js/",
    icon: null,
  },
  {
    name: "OpenAI Realtime",
    label: "Live voice conversations",
    description:
      "GPT powers the live conversation: listening, responding and using case tools while the agent speaks with the person on the phone.",
    href: "https://developers.openai.com/api/docs/guides/realtime",
    icon: null,
  },
  {
    name: "OpenAI GPT",
    label: "Reasoning, tools & evidence",
    description:
      "GPT prepares questions from the case history, reviews evidence, and turns conversations into structured promises, deadlines and next steps.",
    href: "https://developers.openai.com/",
    icon: null,
  },
  {
    name: "Bolna",
    label: "Phone numbers & calling",
    description:
      "Bolna provides the phone-number and telephony layer, giving the voice agent a real number to call from. OpenAI powers the conversation; Bolna connects the call and makes its records available.",
    href: "https://www.bolna.ai/",
    icon: "/brands/bolna.ico",
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
            <LocalizedText text="An autonomous office, built on OpenAI." />
          </h2>
          <p className="text-sm leading-7 text-muted-foreground">
            <LocalizedText text="Built for the OpenAI hackathon. OpenAI powers the reasoning, agent coordination and live voice. Bolna supplies the phone number and calling connection." />
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
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
            <LocalizedText text="OpenAI for the intelligence. Bolna for the phone line." />
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
