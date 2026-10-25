import Image from "next/image"
import { OpenAiLogoIcon } from "@phosphor-icons/react/ssr"
import { LocalizedText } from "@/components/language-provider"

const technologies = [
  {
    name: "OpenAI Agents SDK",
    label: "Coordinator & parallel specialists",
    description:
      "Specialist agents share their findings with a coordinator, which builds the action plan.",
    icon: null,
  },
  {
    name: "GPT-Realtime-2.1",
    label: "Live voice conversations",
    description:
      "Runs the voice conversation, asks informed questions, and uses case tools during the call.",
    icon: null,
  },
  {
    name: "GPT-5.4 mini",
    label: "Reasoning, tools & evidence",
    description:
      "Reviews reports and photos, prepares questions, and extracts promises, deadlines, and next steps.",
    icon: null,
  },
  {
    name: "Bolna",
    label: "Phone numbers & calling",
    description:
      "Provides the phone number and calling connection. OpenAI powers the conversation; Bolna connects the call and makes its records available.",
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
          <h2
            id="technology-heading"
            className="font-heading text-4xl leading-tight font-normal tracking-tight sm:text-5xl"
          >
            <LocalizedText text="An autonomous office, built on OpenAI." />
          </h2>
          <p className="text-sm leading-7 text-muted-foreground">
            <LocalizedText text="OpenAI powers the agents, voice, and evidence review. Bolna connects the calls. Tool calls save case updates, while persistent background jobs schedule the next follow-up." />
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {technologies.map((technology) => (
            <article
              key={technology.name}
              className="flex flex-col gap-5 rounded-2xl border bg-card p-6 shadow-[var(--surface-shadow)]"
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
            </article>
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
