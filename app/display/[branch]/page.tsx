import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { WaitingRoomDisplay } from "@/components/queue/waiting-room-display"
import { COUNTERS, DEMO_BRANCH, DEMO_TENANT, NOW_SERVING, SERVICES, waitingFor } from "@/lib/mock-data"

export const metadata: Metadata = {
  title: "Layar ruang tunggu",
  robots: { index: false, follow: false },
}

export default async function DisplayPage({ params }: { params: Promise<{ branch: string }> }) {
  const { branch } = await params
  if (branch !== DEMO_BRANCH.slug) notFound()

  const counters = COUNTERS.filter((c) => c.isActive).map((c) => ({
    id: c.id,
    name: c.name,
    code: NOW_SERVING.find((n) => n.counterId === c.id)?.code ?? "-",
  }))
  const upcoming = SERVICES.filter((s) => s.isOpen).map((s) => ({
    service: s.name,
    codes: waitingFor(s.id).slice(0, 3).map((t) => t.code),
  }))

  return (
    <WaitingRoomDisplay
      title={`${DEMO_TENANT.name}, ${DEMO_BRANCH.name}`}
      initialCounters={counters}
      upcoming={upcoming}
    />
  )
}
