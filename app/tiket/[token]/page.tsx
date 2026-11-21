import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { Logo } from "@/components/brand/logo"
import { LiveRefresh } from "@/components/queue/live-refresh"
import { LiveTicket } from "@/components/queue/live-ticket"
import { getTicketView } from "@/lib/queries"

export const metadata: Metadata = {
  title: "Tiket antrean Anda",
  robots: { index: false, follow: false },
}

export default async function TicketPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const ticket = await getTicketView(token)
  if (!ticket) notFound()
  const { branchId, version, ...view } = ticket

  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col gap-6 px-4 py-6">
      <LiveRefresh branchId={branchId} version={version} />
      <Logo className="text-base" />
      <LiveTicket ticket={view} renderedAt={new Date().toISOString()} />
    </div>
  )
}
