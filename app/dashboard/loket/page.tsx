import type { Metadata } from "next"

import { CounterConsole } from "@/components/dashboard/counter-console"
import { PageHeader } from "@/components/dashboard/page-header"
import { LiveRefresh } from "@/components/queue/live-refresh"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { requireStaff } from "@/lib/auth"
import { getConsole } from "@/lib/queries"

export const metadata: Metadata = { title: "Konsol loket" }

export default async function CounterPage({ searchParams }: { searchParams: Promise<{ loket?: string }> }) {
  const staff = await requireStaff()
  const { loket } = await searchParams
  const data = await getConsole(staff, loket)

  return (
    <>
      <LiveRefresh branchId={staff.branch.id} version={staff.branch.version} />
      <PageHeader title="Konsol loket" description="Panggil, layani, dan tandai pelanggan. Tekan Spasi untuk aksi utama." />
      {data.counter ? (
        <CounterConsole {...data} counter={data.counter} />
      ) : (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>Belum ada loket aktif</EmptyTitle>
            <EmptyDescription>Aktifkan atau tambah loket di halaman Layanan & loket.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </>
  )
}
