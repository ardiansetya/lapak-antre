import type { Metadata } from "next"

import { PageHeader } from "@/components/dashboard/page-header"
import { ServicesManager } from "@/components/dashboard/services-manager"
import { requireStaff } from "@/lib/auth"
import { getServicesAdmin } from "@/lib/queries"

export const metadata: Metadata = { title: "Layanan & loket" }

export default async function ServicesPage() {
  const staff = await requireStaff()
  const { services, counters } = await getServicesAdmin(staff)
  return (
    <>
      <PageHeader title="Layanan & loket" description="Atur apa yang bisa diantrekan dan siapa yang melayani." />
      <ServicesManager services={services} counters={counters} />
    </>
  )
}
