import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { LiveRefresh } from "@/components/queue/live-refresh"
import { WaitingRoomDisplay } from "@/components/queue/waiting-room-display"
import { getDisplay } from "@/lib/queries"

export const metadata: Metadata = {
  title: "Layar ruang tunggu",
  robots: { index: false, follow: false },
}

export default async function DisplayPage({ params }: { params: Promise<{ tenant: string; branch: string }> }) {
  const { tenant, branch } = await params
  const display = await getDisplay(tenant, branch)
  if (!display) notFound()
  const { branchId, version, ...view } = display
  return (
    <>
      <LiveRefresh branchId={branchId} version={version} />
      <WaitingRoomDisplay {...view} />
    </>
  )
}
