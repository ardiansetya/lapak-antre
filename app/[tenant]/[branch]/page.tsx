import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ClockIcon, MapPinIcon, QrCodeIcon } from "lucide-react"

import { Logo } from "@/components/brand/logo"
import { LiveRefresh } from "@/components/queue/live-refresh"
import { TakeTicketForm, type ServiceOption } from "@/components/queue/take-ticket-form"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { isValidQrCode, localDate } from "@/lib/crypto"
import { getPublicBranch } from "@/lib/queries"
import { formatWaitRange } from "@/lib/queue"

type Props = {
  params: Promise<{ tenant: string; branch: string }>
  searchParams: Promise<{ k?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tenant, branch } = await params
  const found = await getPublicBranch(tenant, branch)
  if (!found) return {}
  return {
    title: `Ambil nomor antrean ${found.branch.tenant.name}`,
    description: `Ambil nomor antrean ${found.branch.tenant.name} ${found.branch.name} dari HP Anda.`,
    robots: { index: false },
  }
}

export default async function TakeTicketPage({ params, searchParams }: Props) {
  const [{ tenant, branch: branchSlug }, { k }] = await Promise.all([params, searchParams])
  const found = await getPublicBranch(tenant, branchSlug)
  if (!found) notFound()
  const { branch, services } = found
  const qrValid = isValidQrCode(branch.qrSecret, localDate(branch.timezone), k)

  // Only what the client form needs (server-serialization).
  const options: ServiceOption[] = services.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    isOpen: s.isOpen,
    waiting: s.waiting,
    estimate: formatWaitRange(s.estimate),
  }))

  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col gap-8 px-4 py-6">
      <LiveRefresh branchId={branch.id} version={branch.version} />
      <Logo className="text-base" />
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl leading-tight font-extrabold tracking-tight">{branch.tenant.name}</h1>
        <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
          <MapPinIcon className="mt-0.5 size-4 shrink-0" /> {branch.name}
          {branch.address && `, ${branch.address}`}
        </p>
        {branch.hours && (
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <ClockIcon className="size-4" /> {branch.hours}
          </p>
        )}
      </header>
      {qrValid ? (
        <TakeTicketForm services={options} branchSlug={branch.slug} qrCode={k!} />
      ) : (
        <Alert>
          <QrCodeIcon />
          <AlertTitle>Scan QR di lokasi untuk mengambil nomor</AlertTitle>
          <AlertDescription>
            Kode QR berganti setiap hari supaya nomor hanya bisa diambil oleh orang yang datang. Tautan ini sudah tidak
            berlaku.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
