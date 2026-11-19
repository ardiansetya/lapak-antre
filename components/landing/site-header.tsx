import Link from "next/link"

import { Logo } from "@/components/brand/logo"
import { ModeToggle } from "@/components/mode-toggle"
import { buttonVariants } from "@/components/ui/button"

const NAV = [
  { href: "#cara-kerja", label: "Cara kerja" },
  { href: "#fitur", label: "Fitur" },
  { href: "#faq", label: "Tanya jawab" },
]

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur supports-backdrop-filter:bg-background/70">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 md:px-6">
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
          <Link href="/masuk" className={buttonVariants({ variant: "ghost", className: "hidden sm:inline-flex" })}>
            Masuk
          </Link>
          <Link href="/daftar" className={buttonVariants()}>
            Coba gratis
          </Link>
        </div>
      </div>
    </header>
  )
}
