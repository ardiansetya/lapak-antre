import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { Logo } from "@/components/brand/logo"
import { LiveTicket } from "@/components/queue/live-ticket"
import { DEMO_TENANT, DEMO_TICKET, getService } from "@/lib/mock-data"

export const metadata: Metadata = {
  title: "Tiket antrean Anda",
  robots: { index: false, follow: false },
}

export default async function TicketPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  // Mock lookup by access token. Becomes a Prisma query in M1.
  if (token !== DEMO_TICKET.token) notFound()
  const service = getService(DEMO_TICKET.serviceId)
  if (!service) notFound()

  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col gap-6 px-4 py-6">
      <Logo className="text-sm" />
      <LiveTicket
        tenantName={DEMO_TENANT.name}
        serviceName={service.name}
        code={DEMO_TICKET.code}
        customerName={DEMO_TICKET.name}
        aheadAtStart={DEMO_TICKET.aheadAtStart}
        avgServiceMinutes={service.avgServiceMinutes}
        activeCounters={service.activeCounters}
        notifyAhead={service.notifyAhead}
      />
    </div>
  )
}
