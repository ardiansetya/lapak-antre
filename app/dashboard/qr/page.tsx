import type { Metadata } from "next"

import { PageHeader } from "@/components/dashboard/page-header"
import { QrPoster } from "@/components/dashboard/qr-poster"
import { requireStaff } from "@/lib/auth"
import { qrCodeForToday } from "@/lib/queries"
import { SITE } from "@/lib/site"

export const metadata: Metadata = { title: "Poster QR" }

export default async function QrPage() {
  const staff = await requireStaff()
  const url = `${SITE.url}/${staff.tenant.slug}/${staff.branch.slug}?k=${qrCodeForToday(staff.branch)}`
  return (
    <>
      <PageHeader title="Poster QR" description="Tempel di pintu masuk atau tampilkan di tablet meja resepsionis." />
      <QrPoster url={url} tenantName={staff.tenant.name} branchName={staff.branch.name} />
    </>
  )
}
