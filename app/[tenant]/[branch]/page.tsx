import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ClockIcon, MapPinIcon } from "lucide-react"

import { Logo } from "@/components/brand/logo"
import { TakeTicketForm, type ServiceOption } from "@/components/queue/take-ticket-form"
import { DEMO_BRANCH, DEMO_TENANT, SERVICES, waitingFor } from "@/lib/mock-data"
import { estimateWait, formatWaitRange } from "@/lib/queue"

type Params = Promise<{ tenant: string; branch: string }>

// Mock lookup. Becomes a Prisma query (tenant slug + branch slug) in M1.
function findBranch(tenant: string, branch: string) {
  if (tenant !== DEMO_TENANT.slug || branch !== DEMO_BRANCH.slug) return null
  return { tenant: DEMO_TENANT, branch: DEMO_BRANCH }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { tenant, branch } = await params
  const found = findBranch(tenant, branch)
  if (!found) return {}
  return {
    title: `Ambil nomor antrean ${found.tenant.name}`,
    description: `Ambil nomor antrean ${found.tenant.name} ${found.branch.name} dari HP Anda.`,
    robots: { index: false },
  }
}

export default async function TakeTicketPage({ params }: { params: Params }) {
  const { tenant, branch } = await params
  const found = findBranch(tenant, branch)
  if (!found) notFound()

  // Only pass what the client form needs (server-serialization).
  const options: ServiceOption[] = SERVICES.map((s) => {
    const waiting = waitingFor(s.id).length
    return {
      id: s.id,
      name: s.name,
      description: s.description,
      isOpen: s.isOpen,
      waiting,
      estimate: formatWaitRange(
        estimateWait({ ahead: waiting, avgServiceMinutes: s.avgServiceMinutes, activeCounters: s.activeCounters }),
      ),
    }
  })

  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col gap-8 px-4 py-6">
      <Logo className="text-sm" />
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">{found.tenant.name}</h1>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPinIcon className="size-4" /> {found.branch.name}, {found.branch.address}
        </p>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <ClockIcon className="size-4" /> {found.branch.hours}
        </p>
      </header>
      <TakeTicketForm services={options} />
    </div>
  )
}
