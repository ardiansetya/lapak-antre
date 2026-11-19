import type { Metadata } from "next"

import { CounterConsole } from "@/components/dashboard/counter-console"
import { PageHeader } from "@/components/dashboard/page-header"
import { COUNTERS, WAITING_TICKETS } from "@/lib/mock-data"

export const metadata: Metadata = { title: "Konsol loket" }

export default function CounterPage() {
  return (
    <>
      <PageHeader
        title="Konsol loket"
        description="Panggil, layani, dan tandai pelanggan. Tekan Spasi untuk aksi utama."
      />
      <CounterConsole counters={COUNTERS.filter((c) => c.isActive)} tickets={WAITING_TICKETS} />
    </>
  )
}
