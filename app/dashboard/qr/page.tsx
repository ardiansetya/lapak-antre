import type { Metadata } from "next"

import { PageHeader } from "@/components/dashboard/page-header"
import { QrPoster } from "@/components/dashboard/qr-poster"
import { DEMO_BRANCH, DEMO_TENANT } from "@/lib/mock-data"
import { SITE } from "@/lib/site"

export const metadata: Metadata = { title: "Poster QR" }

// Mock daily code. Server will derive it from Branch.qrSecret + today's date (PRD A-1).
const DAILY_CODE = "20261119-7f3a"

export default function QrPage() {
  const url = `${SITE.url}/${DEMO_TENANT.slug}/${DEMO_BRANCH.slug}?k=${DAILY_CODE}`
  return (
    <>
      <PageHeader title="Poster QR" description="Tempel di pintu masuk atau meja resepsionis." />
      <QrPoster url={url} tenantName={DEMO_TENANT.name} branchName={DEMO_BRANCH.name} />
    </>
  )
}
