import Link from "next/link"
import { TicketIcon } from "lucide-react"

import { cn } from "@/lib/utils"

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link
      href={href}
      className={cn("flex shrink-0 items-center gap-2 font-semibold tracking-tight whitespace-nowrap", className)}
    >
      <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <TicketIcon className="size-4" strokeWidth={2} />
      </span>
      Lapak Antre
    </Link>
  )
}
