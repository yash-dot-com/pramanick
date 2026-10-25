import type { Metadata } from "next"
import Link from "next/link"
import { instrumentSerif } from "@/lib/fonts"
import { TechnologyStack } from "@/components/technology-stack"
import { FollowThroughAccordion } from "@/components/follow-through-accordion"
import { PublicNavigation } from "@/components/civic/public-navigation"
import { Button } from "@/components/ui/button"
import { LocalizedText } from "@/components/language-provider"

export const metadata: Metadata = {
  title: "Pramanik — An autonomous AI accountability office.",
  description:
    "An accountability office run by autonomous voice agents that call for action, track commitments, and check repair claims against residents’ reports and photos.",
}

const followThrough = [
  {
    title: "One issue, one shared case.",
    description:
      "Related complaints become one case. Resident reports, photos, past conversations, and officer commitments stay together.",
  },
  {
    title: "A team of agents makes the plan.",
    description:
      "Specialist AI agents review reports, history, and responsibility. A coordinator combines their findings into an action plan.",
  },
  {
    title: "Voice agents ask for action.",
    description:
      "An agent calls the designated contact with the case history, revisits promises, and asks for clear actions and deadlines.",
  },
  {
    title: "The follow-up continues after the call.",
    description:
      "Agents save commitments, update the case, and schedule the next follow-up. Every call builds on what came before.",
  },
  {
    title: "“Done” needs a ground check.",
    description:
      "Completion claims open a public survey. Residents share observations and photos. AI assesses the images to support human review; conflicting evidence keeps the case open.",
  },
]

export default function Page() {
  return (
    <main className="bg-background text-foreground">
      <div className="relative isolate flex min-h-dvh flex-col overflow-hidden">
        <a
          href="#main-content"
          className="sr-only fixed top-3 left-3 z-50 rounded-lg bg-background px-4 py-2 focus:not-sr-only"
        >
          Skip to content
        </a>
        <PublicNavigation current="home" />
        <section
          id="main-content"
          className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-6 pt-16 pb-48 text-center sm:pt-20 sm:pb-56"
        >
          <h1
            className={`${instrumentSerif.className} max-w-3xl text-[2.8rem] leading-[1.04] font-normal tracking-[-0.025em] text-balance sm:text-[4.5rem]`}
          >
            <LocalizedText text="You report the problem." />
            <br />
            <span className="italic">
              <LocalizedText text="We keep following up." />
            </span>
          </h1>
          <p className="mt-7 max-w-lg text-sm leading-7 text-pretty text-muted-foreground sm:text-base">
            <LocalizedText text="An accountability office run by autonomous voice agents. They call for action, track commitments, and check repair claims against residents’ reports and photos." />
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button
              size="lg"
              nativeButton={false}
              render={<Link href="/dashboard" />}
              className="min-w-40"
            >
              <LocalizedText text="Open dashboard" />
            </Button>
            <Button
              size="lg"
              variant="secondary"
              nativeButton={false}
              render={<Link href="/app" />}
              className="min-w-40"
            >
              <LocalizedText text="Explore issue map" />
            </Button>
          </div>
        </section>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-[-10%] bottom-[-145px] -z-0 h-[330px] opacity-85 blur-[26px] sm:h-[360px] dark:opacity-40"
          style={{
            background:
              "radial-gradient(ellipse 85% 95% at 50% 100%, #0055eb 0%, #0055eb 28%, #9fc6e7 39%, #ffe33a 48%, #ff9517 56%, #ff3bd5 65%, transparent 80%)",
          }}
        />
      </div>
      <section
        aria-labelledby="follow-through-heading"
        className="border-t px-6 py-16 sm:px-10 sm:py-24"
      >
        <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] md:gap-16">
          <div className="space-y-5">
            <h2
              id="follow-through-heading"
              className="font-heading text-4xl leading-tight font-normal tracking-tight sm:text-5xl"
            >
              <LocalizedText text="Complaints don’t fix themselves." />
            </h2>
            <p className="max-w-md text-sm leading-7 text-muted-foreground sm:text-base">
              <LocalizedText text="Democracy gives people a voice in how they are governed. Our taxes fund public services, and public officials are answerable to the people they serve." />
            </p>
            <p className="max-w-md text-sm leading-7 text-muted-foreground sm:text-base">
              <LocalizedText text="Pramanik groups related complaints, keeps a shared case history, and prepares a brief before calling the responsible contact. Agents record commitments, schedule follow-ups, and check repair claims against residents’ observations and photos." />
            </p>
          </div>
          <FollowThroughAccordion steps={followThrough} />
        </div>
      </section>
      <section
        aria-label="Public accountability and community participation"
        className="border-t px-6 py-12 sm:px-10 sm:py-16"
      >
        <div className="mx-auto grid max-w-5xl gap-8 sm:grid-cols-2 sm:gap-16">
          <div className="space-y-3">
            <h2 className="text-lg font-medium">
              <LocalizedText text="A record everyone can inspect." />
            </h2>
            <p className="text-sm leading-7 text-muted-foreground">
              <LocalizedText text="The public case board and case file show published conversations, promises, evidence, completed actions, and next steps." />
            </p>
          </div>
          <div className="space-y-3">
            <h2 className="text-lg font-medium">
              <LocalizedText text="Less chasing. More participation." />
            </h2>
            <p className="text-sm leading-7 text-muted-foreground">
              <LocalizedText text="Residents report issues, add evidence, and check progress together. Everyone can question a commitment and see whether it was kept." />
            </p>
          </div>
        </div>
      </section>
      <TechnologyStack />
    </main>
  )
}
