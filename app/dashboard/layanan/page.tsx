import type { Metadata } from "next"

import { PageHeader } from "@/components/dashboard/page-header"
import { ServicesManager } from "@/components/dashboard/services-manager"
import { COUNTERS, SERVICES } from "@/lib/mock-data"

export const metadata: Metadata = { title: "Layanan & loket" }

export default function ServicesPage() {
  return (
    <>
      <PageHeader title="Layanan & loket" description="Atur apa yang bisa diantrekan dan siapa yang melayani." />
      <ServicesManager initialServices={SERVICES} counters={COUNTERS} />
    </>
  )
}
