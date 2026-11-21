"use client"

import { useEffect, useRef, useState, useSyncExternalStore, useTransition } from "react"
import Link from "next/link"
import { BellIcon, BellRingIcon, CircleCheckIcon, SmartphoneIcon, TicketXIcon, WifiOffIcon } from "lucide-react"
import { toast } from "sonner"

import { FlapCode, Perforation } from "@/components/queue/flap-code"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/components/ui/item"
import { Spinner } from "@/components/ui/spinner"
import { useOnline } from "@/hooks/use-online"
import { cancelTicket } from "@/lib/actions"
import type { TicketStatus } from "@/lib/queue"
import { cn } from "@/lib/utils"

// Tiny store so the permission badge re-renders after requestPermission().
const permissionListeners = new Set<() => void>()
function subscribePermission(cb: () => void) {
  permissionListeners.add(cb)
  return () => permissionListeners.delete(cb)
}
function readPermission(): NotificationPermission | "unsupported" {
  return "Notification" in window ? Notification.permission : "unsupported"
}

function notify(title: string, body: string) {
  navigator.vibrate?.(300)
  if (readPermission() === "granted") {
    try {
      new Notification(title, { body })
      return
    } catch {
      // Android Chrome only allows notifications from a service worker. Falls through to toast.
    }
  }
  toast(title, { description: body })
}

export type TicketView = {
  token: string
  code: string
  name: string
  status: TicketStatus
  ahead: number
  counterName: string | null
  servingCode: string | null
  estimate: string
  notifyAhead: number
  serviceName: string
  branchName: string
  tenantName: string
  takeAgainHref: string
}

const timeFormat = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })

export function LiveTicket({ ticket, renderedAt }: { ticket: TicketView; renderedAt: string }) {
  const { code, status, ahead, notifyAhead } = ticket
  const online = useOnline()
  const permission = useSyncExternalStore(subscribePermission, readPermission, () => "default" as const)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [cancelling, startCancel] = useTransition()

  // Notify on the transitions that matter: getting close, and being called.
  const prev = useRef({ status, ahead })
  useEffect(() => {
    const before = prev.current
    prev.current = { status, ahead }
    if (status === "CALLED" && before.status !== "CALLED")
      notify(`Nomor ${code} dipanggil`, `Silakan menuju ${ticket.counterName ?? "loket"} sekarang.`)
    else if (status === "WAITING" && ahead < notifyAhead && before.ahead >= notifyAhead)
      notify("Giliran Anda sudah dekat", ahead === 0 ? "Anda berikutnya." : `Tinggal ${ahead} orang lagi.`)
  }, [status, ahead, notifyAhead, code, ticket.counterName])

  async function enableNotifications() {
    if (readPermission() === "unsupported") {
      toast.error("Browser ini belum mendukung notifikasi. Biarkan halaman ini tetap terbuka.")
      return
    }
    await Notification.requestPermission()
    permissionListeners.forEach((cb) => cb())
    if (readPermission() === "granted") toast.success("Notifikasi aktif")
  }

  function confirmCancel() {
    startCancel(async () => {
      const result = await cancelTicket(ticket.token)
      if (result?.error) toast.error(result.error)
      setConfirmOpen(false)
    })
  }

  if (status === "CANCELLED" || status === "DONE" || status === "NO_SHOW") {
    const copy = {
      CANCELLED: { icon: TicketXIcon, title: `Tiket ${code} dibatalkan`, body: "Nomor Anda sudah dilepas." },
      DONE: { icon: CircleCheckIcon, title: "Terima kasih sudah antre", body: `Layanan untuk ${code} sudah selesai.` },
      NO_SHOW: {
        icon: TicketXIcon,
        title: `Nomor ${code} terlewat`,
        body: "Anda dipanggil tetapi belum datang. Temui petugas, nomor Anda bisa dikembalikan ke antrean.",
      },
    }[status]
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <copy.icon />
          </EmptyMedia>
          <EmptyTitle>{copy.title}</EmptyTitle>
          <EmptyDescription>{copy.body}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Link href={ticket.takeAgainHref} className={buttonVariants({ variant: "outline" })}>
            Kembali ke halaman layanan
          </Link>
        </EmptyContent>
      </Empty>
    )
  }

  const called = status === "CALLED" || status === "SERVING"

  return (
    <div className="flex flex-col gap-4">
      {!online && (
        <Alert>
          <WifiOffIcon />
          <AlertTitle>Anda sedang offline</AlertTitle>
          <AlertDescription>Ini status terakhir yang kami terima. Halaman diperbarui otomatis begitu sinyal kembali.</AlertDescription>
        </Alert>
      )}

      <article
        className={cn(
          "overflow-hidden rounded-lg border bg-card transition-colors",
          called && "border-transparent bg-primary text-primary-foreground",
        )}
      >
        <div className="flex flex-col gap-5 p-6">
          <div className="flex items-start justify-between gap-3">
            <p className={cn("text-sm text-muted-foreground", called && "text-primary-foreground/75")}>
              {ticket.tenantName}
              <br />
              {ticket.serviceName}
            </p>
            <Badge variant={called ? "outline" : "secondary"} className={cn(called && "border-primary-foreground/40 text-primary-foreground")}>
              {status === "SERVING" ? "Dilayani" : called ? "Dipanggil" : "Menunggu"}
            </Badge>
          </div>
          <FlapCode code={code} size="lg" />
          {called ? (
            <div aria-live="assertive">
              <p className="font-heading text-2xl font-extrabold tracking-tight">Giliran Anda, {ticket.name}.</p>
              <p className="mt-1 opacity-80">
                {status === "SERVING" ? "Sedang dilayani di" : "Silakan menuju"} {ticket.counterName ?? "loket"}.
              </p>
            </div>
          ) : (
            <p aria-live="polite" className="font-heading text-2xl font-extrabold tracking-tight">
              {ahead === 0 ? "Anda berikutnya." : `${ahead} orang di depan Anda.`}
            </p>
          )}
        </div>
        {!called && (
          <>
            <Perforation />
            <dl className="grid grid-cols-2 gap-3 p-6 text-sm">
              <div>
                <dt className="text-muted-foreground">Sedang dipanggil</dt>
                <dd className="mt-1 font-mono text-xl font-semibold">{ticket.servingCode ?? "-"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Perkiraan dipanggil</dt>
                <dd className="mt-1 text-xl font-semibold">{ticket.estimate}</dd>
              </div>
            </dl>
          </>
        )}
        <p className={cn("border-t px-6 py-3 text-xs text-muted-foreground", called && "border-primary-foreground/20 text-primary-foreground/70")}>
          Diperbarui otomatis, terakhir{" "}
          <time suppressHydrationWarning dateTime={renderedAt}>
            {timeFormat.format(new Date(renderedAt))}
          </time>
        </p>
      </article>

      {!called && (
        <Item variant="outline">
          <ItemMedia variant="icon">{permission === "granted" ? <BellRingIcon /> : <BellIcon />}</ItemMedia>
          <ItemContent>
            <ItemTitle>{permission === "granted" ? "Notifikasi aktif" : "Kabari saya saat giliran dekat"}</ItemTitle>
            <ItemDescription className="line-clamp-none">
              {permission === "granted"
                ? `Kami kabari saat tinggal ${notifyAhead} orang dan saat Anda dipanggil, selama halaman ini terbuka.`
                : "Aktifkan supaya HP bergetar saat giliran Anda dekat."}
            </ItemDescription>
          </ItemContent>
          {permission !== "granted" && (
            <ItemActions>
              <Button size="sm" onClick={enableNotifications} disabled={permission === "denied"}>
                {permission === "denied" ? "Diblokir" : "Aktifkan"}
              </Button>
            </ItemActions>
          )}
        </Item>
      )}

      <Item variant="muted" size="sm">
        <ItemMedia variant="icon">
          <SmartphoneIcon />
        </ItemMedia>
        <ItemContent>
          <ItemDescription className="line-clamp-none">
            Pengguna iPhone: tambahkan halaman ini ke layar utama lewat menu Bagikan agar notifikasi bisa masuk.
          </ItemDescription>
        </ItemContent>
      </Item>

      {status === "WAITING" && (
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogTrigger render={<Button variant="ghost" className="self-center text-muted-foreground" />}>
            Batalkan tiket
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Batalkan nomor {code}?</AlertDialogTitle>
              <AlertDialogDescription>Posisi Anda diberikan ke orang berikutnya dan tidak bisa dikembalikan.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Tetap antre</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={confirmCancel} disabled={cancelling}>
                {cancelling && <Spinner data-icon="inline-start" />}
                Ya, batalkan
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}
