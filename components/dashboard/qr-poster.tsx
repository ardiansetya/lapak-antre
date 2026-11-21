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
        className="mx-auto flex w-full max-w-sm flex-col overflow-hidden rounded-lg border bg-white text-center text-zinc-950"
      >
        <div className="bg-[#3b3f4c] px-8 py-6 text-white">
          <p className="font-mono text-xs tracking-widest text-white/60 uppercase">{branchName}</p>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-balance">{tenantName}</h2>
        </div>
        <div className="flex flex-col items-center gap-5 p-8">
          <QRCodeSVG value={url} size={220} level="M" marginSize={2} title="QR ambil nomor antrean" />
          <div>
            <p className="font-heading text-2xl font-extrabold tracking-tight">Scan untuk ambil nomor</p>
            <p className="mt-1 text-sm text-zinc-600">Tidak perlu aplikasi. Anda dikabari saat giliran dekat.</p>
          </div>
          <p className="font-mono text-xs tracking-widest text-zinc-500 uppercase">lapak antre</p>
        </div>
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
