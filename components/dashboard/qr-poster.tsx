"use client"

import { PrinterIcon } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

export function QrPoster({ url, tenantName, branchName }: { url: string; tenantName: string; branchName: string }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
      <div
        id="qr-poster"
        className="mx-auto flex w-full max-w-sm flex-col items-center gap-6 rounded-2xl border bg-white p-8 text-center text-zinc-950"
      >
        <div>
          <p className="text-sm text-zinc-600">{branchName}</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-balance">{tenantName}</h2>
        </div>
        <QRCodeSVG value={url} size={220} level="M" marginSize={2} title="QR ambil nomor antrean" />
        <div>
          <p className="text-xl font-semibold">Scan untuk ambil nomor</p>
          <p className="mt-1 text-sm text-zinc-600">Tidak perlu aplikasi. Anda akan dikabari saat giliran dekat.</p>
        </div>
        <p className="text-xs text-zinc-500">Lapak Antre</p>
      </div>

      <div className="flex flex-col gap-4">
        <Alert>
          <AlertTitle>Kode QR berganti setiap hari</AlertTitle>
          <AlertDescription>
            Poster ini memakai kode harian supaya nomor tidak bisa diambil dari foto QR kemarin. Untuk poster tetap,
            tampilkan halaman ini di tablet atau cetak ulang setiap pagi.
          </AlertDescription>
        </Alert>
        <p className="text-sm break-all text-muted-foreground">{url}</p>
        <Button className="self-start" onClick={() => window.print()}>
          <PrinterIcon data-icon="inline-start" />
          Cetak poster
        </Button>
      </div>
    </div>
  )
}
