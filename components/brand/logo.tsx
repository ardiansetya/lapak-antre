import Link from "next/link"

import { cn } from "@/lib/utils"

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link
      href={href}
      className={cn("flex shrink-0 items-center gap-2 font-heading text-lg font-bold tracking-tight whitespace-nowrap", className)}
    >
      <span className="flex h-7 items-center gap-px font-mono text-sm font-semibold">
        <span className="flex h-full w-5 items-center justify-center rounded-[3px] bg-board text-board-foreground">L</span>
        <span className="flex h-full w-5 items-center justify-center rounded-[3px] bg-primary text-primary-foreground">A</span>
      </span>
      <span>lapak antre</span>
    </Link>
  )
}
