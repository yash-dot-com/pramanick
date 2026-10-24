import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  AudioLines,
  Check,
  CheckCheck,
  CircleCheck,
  Clock3,
  FileText,
  MapPin,
  MessageCircle,
  Mic,
  Phone,
  Radio,
  ShieldCheck,
  Users,
} from "lucide-react"
import { LanguageSwitcher, LocalizedText } from "@/components/language-provider"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Pramanik — Don’t just report it. Follow it through.",
  description:
    "Community reports. AI voice follow-ups. A public record of what was promised, what happened, and what residents verified. Explore Pramanik’s civic accountability demo.",
  openGraph: {
    title: "Pramanik — Follow it through.",
    description:
      "The follow-up and accountability layer between citizens and public services.",
    type: "website",
  },
}

const steps = [
  {
    number: "01",
    Icon: Mic,
    title: "Tell us what’s wrong.",
    description:
      "Speak in Marathi, Hindi or English. Review your complaint, choose the location, and add your voice to a shared issue.",
  },
  {
    number: "02",
    Icon: Phone,
    title: "Let the agent follow up.",
    description:
      "Start a follow-up. The agent gathers the reports, prepares its questions, calls the configured contact, and remembers their commitments.",
  },
  {
    number: "03",
    Icon: ShieldCheck,
    title: "Check what actually changed.",
    description:
      "A claim that the work is done opens a resident check. Photos, location context and reviewed observations help close the loop.",
  },
]

export default function Page() {
  return (
    <main className="min-h-dvh overflow-hidden bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only fixed top-3 left-3 z-50 rounded-lg bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only"
      >
        Skip to content
      </a>
      <header className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
        <Link
          href="/"
          aria-label="Pramanik home"
          className="flex items-center gap-2.5"
        >
          <span className="flex size-9 items-center justify-center rounded-xl border bg-muted/50">
            <AudioLines className="size-5" />
          </span>
          <span className="text-xl font-semibold tracking-tight">
            pramanik
            <span className="text-emerald-600 dark:text-emerald-400">.</span>
          </span>
        </Link>
        <nav
          aria-label="Main navigation"
          className="flex items-center gap-3 sm:gap-6"
        >
          <Link
            href="#how-it-works"
            className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground md:block"
          >
            <LocalizedText text="How it works" />
          </Link>
          <Link
            href="/dashboard"
            className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:block"
          >
            <LocalizedText text="Agent dashboard" />
          </Link>
          <ThemeSwitcher />
          <Button size="sm" nativeButton={false} render={<Link href="/app" />}>
            <LocalizedText text="Open app" />
            <ArrowUpRight />
          </Button>
        </nav>
      </header>

      <section
        id="main-content"
        className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 pt-14 pb-20 sm:px-8 sm:pt-20 sm:pb-28 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:pt-24"
      >
        <div className="relative z-10">
          <Badge
            variant="outline"
            className="mb-7 gap-2 py-1.5 text-[11px] font-normal"
          >
            <span className="size-1.5 rounded-full bg-emerald-500" />
            <LocalizedText text="Public problems. Public follow-through." />
          </Badge>
          <h1 className="max-w-2xl text-[clamp(2.75rem,5.8vw,5.1rem)] leading-[1.04] font-semibold tracking-[-0.055em]">
            <LocalizedText text="Don’t just report it." />
            <span className="mt-2 block text-muted-foreground">
              <LocalizedText text="Follow it through." />
            </span>
          </h1>
          <p className="mt-7 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
            <LocalizedText text="You’ve reported the pothole. Who’s chasing the repair? Pramanik brings neighbours together and gives their shared issues an AI voice that keeps following up." />
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              size="lg"
              nativeButton={false}
              render={<Link href="/app" />}
            >
              <MapPin />
              <LocalizedText text="Explore the issue map" />
              <ArrowRight />
            </Button>
            <Button
              size="lg"
              variant="outline"
              nativeButton={false}
              render={<Link href="/dashboard" />}
            >
              <LocalizedText text="See the agent at work" />
              <ArrowUpRight />
            </Button>
          </div>
          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Mic className="size-3.5" />
              <span>मराठी · हिन्दी · English</span>
            </span>
            <span className="flex items-center gap-1.5">
              <FileText className="size-3.5" />
              <LocalizedText text="Every follow-up has a record" />
            </span>
          </div>
        </div>

        <div
          className="relative mx-auto w-full max-w-lg lg:ml-auto"
          aria-label="Illustrative complaint follow-up timeline"
        >
          <div
            aria-hidden
            className="absolute -inset-8 -z-0 rounded-full bg-muted/50 blur-3xl"
          />
          <Card className="relative gap-0 overflow-hidden rounded-2xl border bg-card py-0 shadow-xl shadow-foreground/5">
            <div className="flex items-center justify-between gap-3 border-b bg-muted/30 px-5 py-3 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <MapPin className="size-3" />
                Pune, Maharashtra
              </span>
              <span>
                <LocalizedText text="Illustrative case" />
              </span>
            </div>
            <CardContent className="space-y-6 p-5 sm:p-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="secondary" className="gap-1.5 text-[10px]">
                    <span className="size-1.5 rounded-full bg-amber-500" />
                    <LocalizedText text="Awaiting a resident check" />
                  </Badge>
                  <Users className="size-4 text-muted-foreground" />
                </div>
                <h2 className="text-xl leading-snug font-semibold tracking-tight">
                  <LocalizedText text="A dark street. A shared concern." />
                </h2>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  <LocalizedText text="Broken streetlights near the metro. One shared case, with its reports and follow-ups kept together." />
                </p>
              </div>
              <ol className="space-y-5">
                {[
                  {
                    Icon: MessageCircle,
                    title: "Neighbours report the problem",
                    detail: "Reports and photos gathered in one case.",
                    complete: true,
                  },
                  {
                    Icon: Phone,
                    title: "The agent asks for an update",
                    detail:
                      "The conversation and next step join the public record.",
                    complete: true,
                  },
                  {
                    Icon: Clock3,
                    title: "A promise becomes a follow-up",
                    detail: "The next call remembers the previous commitment.",
                    complete: true,
                  },
                  {
                    Icon: ShieldCheck,
                    title: "Residents check the repair",
                    detail: "A completion claim is waiting to be checked.",
                    complete: false,
                  },
                ].map(({ Icon, title, detail, complete }, index) => (
                  <li key={title} className="relative flex gap-3">
                    {index < 3 && (
                      <span
                        aria-hidden
                        className="absolute top-8 bottom-[-20px] left-4 w-px bg-border"
                      />
                    )}
                    <span
                      className={`relative flex size-8 shrink-0 items-center justify-center rounded-full border ${complete ? "bg-muted text-foreground" : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"}`}
                    >
                      <Icon className="size-3.5" />
                    </span>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <p className="flex items-center justify-between gap-2 text-xs font-medium">
                        <LocalizedText text={title} />
                        {complete && (
                          <Check className="size-3 text-muted-foreground" />
                        )}
                      </p>
                      <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                        <LocalizedText text={detail} />
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="flex items-center gap-2 rounded-lg border bg-muted/20 px-3 py-2.5 text-[11px] text-muted-foreground">
                <Radio className="size-3.5 shrink-0" />
                <LocalizedText text="Reported → followed up → checked by people." />
              </div>
            </CardContent>
          </Card>
          <p className="mt-3 text-center text-[10px] text-muted-foreground">
            <LocalizedText text="An example of the loop. Explore labeled demo cases in the app." />
          </p>
        </div>
      </section>

      <section className="border-y bg-muted/25">
        <div className="mx-auto grid max-w-7xl gap-6 px-5 py-10 sm:px-8 md:grid-cols-[1fr_1.15fr] md:gap-16 md:py-14">
          <p className="text-2xl leading-snug font-medium tracking-tight sm:text-3xl">
            <LocalizedText text="A complaint number is only the beginning." />
          </p>
          <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              <LocalizedText text="Potholes, overflowing drains, broken lights. Reporting is the first step. Someone still has to ask for progress, remember the promised date, and check whether the work happened." />
            </p>
            <p className="font-medium text-foreground">
              <LocalizedText text="Pramanik is the follow-up layer between citizens and public services." />
            </p>
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="mx-auto max-w-7xl scroll-mt-6 px-5 py-20 sm:px-8 sm:py-24"
      >
        <div className="mb-10 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="mb-3 text-xs font-medium text-muted-foreground">
              <LocalizedText text="From a report to a reviewed result" />
            </p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              <LocalizedText text="Three steps. A complete loop." />
            </h2>
          </div>
          <ArrowDown className="hidden size-5 text-muted-foreground sm:block" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {steps.map(({ number, Icon, title, description }) => (
            <Card key={number} className="gap-0 bg-background py-0 shadow-none">
              <CardContent className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                  <span className="flex size-10 items-center justify-center rounded-xl border bg-muted/30">
                    <Icon className="size-5" />
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {number}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold tracking-tight">
                    <LocalizedText text={title} />
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    <LocalizedText text={description} />
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-20 sm:px-8 sm:pb-24">
        <div className="grid gap-10 rounded-2xl border bg-muted/25 p-6 sm:p-10 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
          <div>
            <Badge variant="outline" className="mb-5 bg-background">
              <LocalizedText text="Accountability you can inspect" />
            </Badge>
            <h2 className="max-w-md text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
              <LocalizedText text="The agent does the chasing. Everyone can follow along." />
            </h2>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground">
              <LocalizedText text="See the plan, the work in progress, and the responses. Follow an issue’s timeline from the first report to the resident’s final check." />
            </p>
            <Button
              className="mt-6"
              variant="outline"
              nativeButton={false}
              render={<Link href="/dashboard" />}
            >
              <LocalizedText text="Open the public dashboard" />
              <ArrowUpRight />
            </Button>
          </div>
          <div className="divide-y">
            {[
              {
                Icon: FileText,
                title: "One shared case",
                description:
                  "Community reports, evidence and earlier conversations stay together.",
              },
              {
                Icon: Phone,
                title: "A memory for every promise",
                description:
                  "Recorded commitments shape the next follow-up, with their original history intact.",
              },
              {
                Icon: CheckCheck,
                title: "A claim is followed by a check",
                description:
                  "Resident observations and reviewed evidence determine whether the repair is verified.",
              },
            ].map(({ Icon, title, description }) => (
              <div key={title} className="flex gap-4 py-5 first:pt-0 last:pb-0">
                <Icon className="mt-1 size-5 shrink-0 text-muted-foreground" />
                <div>
                  <h3 className="text-sm font-semibold">
                    <LocalizedText text={title} />
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    <LocalizedText text={description} />
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-5 py-14 sm:px-8 md:flex-row md:items-center">
          <div>
            <p className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
              <CircleCheck className="size-3.5" />
              <LocalizedText text="Communities report. Agents follow up. People verify." />
            </p>
            <h2 className="text-3xl font-semibold tracking-tight">
              <LocalizedText text="Give your neighbourhood a follow-through." />
            </h2>
          </div>
          <Button size="lg" nativeButton={false} render={<Link href="/app" />}>
            <LocalizedText text="Explore Pramanik" />
            <ArrowRight />
          </Button>
        </div>
      </section>
      <footer className="border-t bg-muted/20">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-5 px-5 py-7 pb-12 text-xs text-muted-foreground sm:px-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="font-semibold text-foreground">
              pramanik.
            </Link>
            <LanguageSwitcher />
          </div>
          <p className="max-w-md text-[11px] leading-relaxed">
            <LocalizedText text="Demonstration cases are labeled. Recordings are shared with permission. Official complaint filing remains a separate step." />
          </p>
          <div className="flex gap-5">
            <Link href="/app" className="hover:text-foreground">
              <LocalizedText text="Issue map" />
            </Link>
            <Link href="/dashboard" className="hover:text-foreground">
              <LocalizedText text="Agent dashboard" />
            </Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
