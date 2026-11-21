import Link from "next/link"

import { Logo } from "@/components/brand/logo"
import { ModeToggle } from "@/components/mode-toggle"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const NAV = [
  { href: "#cara-kerja", label: "Cara kerja" },
  { href: "#fitur", label: "Fitur" },
  { href: "#faq", label: "Tanya jawab" },
]

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 md:gap-8 md:px-6">
        <Logo />
        <nav aria-label="Navigasi utama" className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          {NAV.map((item) => (
            <a key={item.href} href={item.href} className="transition-colors hover:text-foreground">
              {item.label}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <ModeToggle />
          <span className="hidden sm:contents">
            <Link href="/masuk" className={buttonVariants({ variant: "ghost" })}>
              Masuk
            </Link>
          </span>
          <Link href="/daftar" className={cn(buttonVariants(), "px-3")}>
            Coba gratis
          </Link>
        </div>
      </div>
    </header>
  )
}
