"use client"

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { localeNames, messages, type Locale } from "@/lib/i18n/messages"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
const Context = createContext<{
  locale: Locale
  setLocale: (value: Locale) => void
  translated: Record<string, string>
  request: (text: string) => void
  error: string
}>({
  locale: "en",
  setLocale: () => {},
  translated: {},
  request: () => {},
  error: "",
})
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en")
  const [translated, setTranslated] = useState<Record<string, string>>({})
  const [error, setError] = useState("")
  const pending = useRef(new Set<string>()),
    inFlight = useRef(new Set<string>())
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null),
    generation = useRef(0)
  const currentLocale = useRef(locale)
  currentLocale.current = locale
  function setLocale(value: Locale) {
    generation.current++
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
    pending.current.clear()
    inFlight.current.clear()
    setTranslated({})
    setError("")
    setLocaleState(value)
    currentLocale.current = value
    localStorage.setItem("pramanik-language", value)
  }
  useEffect(() => {
    const saved = localStorage.getItem("pramanik-language")
    if (saved === "mr" || saved === "hi" || saved === "en") setLocale(saved)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])
  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])
  function request(text: string) {
    if (!text.trim() || translated[text] || inFlight.current.has(text)) return
    pending.current.add(text)
    if (timer.current) return
    const revision = generation.current,
      target = currentLocale.current
    timer.current = setTimeout(async function flush() {
      timer.current = null
      if (generation.current !== revision) return
      const texts: string[] = []
      let length = 0
      for (const item of pending.current) {
        if (texts.length >= 40 || length + item.length > 16000) break
        texts.push(item)
        length += item.length
        pending.current.delete(item)
        inFlight.current.add(item)
      }
      if (!texts.length) return
      try {
        const response = await fetch("/api/translations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ language: target, texts }),
        })
        const result = await response.json()
        if (!response.ok) throw new Error(result.error)
        if (generation.current === revision) {
          setTranslated((prior) => ({ ...prior, ...result.translations }))
          setError("")
        }
      } catch {
        if (generation.current === revision)
          setError(
            "Translation is temporarily unavailable. Original text is shown."
          )
      } finally {
        if (generation.current === revision && pending.current.size)
          timer.current = setTimeout(flush, 80)
      }
    }, 80)
  }
  return (
    <Context.Provider value={{ locale, setLocale, translated, request, error }}>
      {children}
    </Context.Provider>
  )
}
export function useLanguage() {
  return useContext(Context)
}
function chunks(source: string) {
  return source.match(/[\s\S]{1,6000}/g) ?? []
}
export function useTranslatedText(source: string) {
  const { locale, translated, request } = useLanguage()
  const fixed = messages[source]
  const parts = chunks(source)
  const needsTranslation =
    !!source &&
    !(locale === "en" && !/[\u0900-\u097F]/.test(source)) &&
    !(locale !== "en" && fixed)
  useEffect(() => {
    if (needsTranslation)
      for (const part of parts) if (!translated[part]) request(part)
  }, [source, locale, needsTranslation, translated, request])
  return locale !== "en" && fixed
    ? fixed[locale]
    : needsTranslation
      ? parts.map((part) => translated[part] ?? part).join("")
      : source
}
export function LocalizedText({
  text,
  children,
}: {
  text?: unknown
  children?: ReactNode
}) {
  const { locale } = useLanguage()
  const source = (
    typeof text === "string" || typeof text === "number"
      ? String(text)
      : typeof children === "string"
        ? children
        : ""
  ).trim()
  const value = useTranslatedText(source)
  if (!source) return children ?? null
  return (
    <span title={value !== source ? source : undefined} lang={locale}>
      {value}
    </span>
  )
}
export function LanguageSwitcher() {
  const { locale, setLocale, error } = useLanguage()
  return (
    <div className="flex items-center gap-2">
      <Select
        value={locale}
        onValueChange={(value) => {
          if (value) setLocale(value as Locale)
        }}
      >
        <SelectTrigger
          aria-label="Language / भाषा"
          size="sm"
          className="w-full min-w-28 text-xs"
        >
          <SelectValue>{localeNames[locale]}</SelectValue>
        </SelectTrigger>
        <SelectContent align="start" alignItemWithTrigger={false}>
          {Object.entries(localeNames).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <span
          role="status"
          className="max-w-52 text-[10px] text-muted-foreground"
          title={error}
        >
          Translation unavailable · original text shown
        </span>
      )}
    </div>
  )
}
