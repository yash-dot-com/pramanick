import type { Metadata } from "next"
import Link from "next/link"
import { Instrument_Serif } from "next/font/google"
import { Button } from "@/components/ui/button"
import { LocalizedText } from "@/components/language-provider"

const instrumentSerif = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "Pramanik — An autonomous office that follows through.",
  description:
    "An autonomous office of voice agents that calls, follows up in real time, and keeps every response and promise on public record.",
}

export default function Page() {
  return (
    <main className="relative isolate flex min-h-dvh flex-col overflow-hidden bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only fixed top-3 left-3 z-50 rounded-lg bg-background px-4 py-2 focus:not-sr-only"
      >
        Skip to content
      </a>
      <header className="relative z-10 mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-7 sm:px-10">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Pramanik<span className="text-primary">.</span>
        </Link>
        <nav
          aria-label="Main navigation"
          className="flex items-center gap-5 text-xs text-muted-foreground sm:gap-7"
        >
          <Link href="/app" className="transition-colors hover:text-foreground">
            <LocalizedText text="Issue map" />
          </Link>
          <Link
            href="/dashboard"
            className="transition-colors hover:text-foreground"
          >
            <LocalizedText text="Follow-ups" />
          </Link>
          <Link
            href="/leaderboard"
            className="transition-colors hover:text-foreground"
          >
            <LocalizedText text="Service record" />
          </Link>
        </nav>
      </header>
      <section
        id="main-content"
        className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-6 pt-16 pb-48 text-center sm:pt-20 sm:pb-56"
      >
        <p className="mb-6 text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
          <LocalizedText text="A complaint shouldn’t become your second job." />
        </p>
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
          <LocalizedText text="An autonomous office of voice agents that calls the responsible office, follows up in real time, and remembers every promise. Every conversation and next step stays on public record." />
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button
            size="lg"
            nativeButton={false}
            render={<Link href="/app" />}
            className="min-w-40"
          >
            <LocalizedText text="Report an issue" />
          </Button>
          <Button
            size="lg"
            variant="secondary"
            nativeButton={false}
            render={<Link href="/dashboard" />}
            className="min-w-40"
          >
            <LocalizedText text="See the follow-ups" />
          </Button>
        </div>
        <p className="mt-7 max-w-md text-xs leading-6 text-muted-foreground">
          <LocalizedText text="What was said. What was promised. What actually changed." />
        </p>
      </section>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-[-10%] bottom-[-145px] -z-0 h-[330px] opacity-85 blur-[26px] sm:h-[360px] dark:opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 85% 95% at 50% 100%, #0055eb 0%, #0055eb 28%, #9fc6e7 39%, #ffe33a 48%, #ff9517 56%, #ff3bd5 65%, transparent 80%)",
        }}
      />
      <footer className="absolute inset-x-0 bottom-6 z-10 mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 text-[10px] text-foreground/65 sm:px-10">
        <p>
          Pramanik ·{" "}
          <LocalizedText text="Public problems. Public follow-through." />
        </p>
        <Link
          href="/leaderboard"
          className="underline-offset-4 hover:underline"
        >
          <LocalizedText text="Every response stays on record" />
        </Link>
      </footer>
    </main>
  )
}
