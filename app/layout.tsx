import { Geist_Mono, Inter } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { LanguageProvider } from "@/components/language-provider"
import { cn } from "@/lib/utils"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        inter.variable
      )}
    >
      <body>
        <ThemeProvider defaultTheme="light" storageKey="pramanik-theme">
          <LanguageProvider>
            <TooltipProvider>{children}</TooltipProvider>
            <div className="pointer-events-none fixed right-3 bottom-3 z-50 rounded-full border bg-background/90 px-3 py-1 text-[10px] text-muted-foreground shadow-sm backdrop-blur">
              Demo workspace
            </div>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
