"use client"

import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import Link from "next/link"
import { BellIcon, BellRingIcon, SmartphoneIcon, TicketXIcon, WifiOffIcon } from "lucide-react"
import { toast } from "sonner"

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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/components/ui/item"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { useOnline } from "@/hooks/use-online"
import { estimateWait, formatTicketCode, formatWaitRange } from "@/lib/queue"
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

const DEMO_TICK_MS = 7000
const CALLED_COUNTER = "Ruang Periksa 2"

type Props = {
  tenantName: string
  serviceName: string
  code: string
  customerName: string
  aheadAtStart: number
  avgServiceMinutes: number
  activeCounters: number
  notifyAhead: number
}

export function LiveTicket(props: Props) {
  const { code, aheadAtStart, notifyAhead } = props
  const online = useOnline()
  const permission = useSyncExternalStore(subscribePermission, readPermission, () => "default" as const)
  const [ahead, setAhead] = useState(aheadAtStart)
  const [status, setStatus] = useState<"WAITING" | "CALLED" | "CANCELLED">("WAITING")
  const [updatedAt, setUpdatedAt] = useState(() => new Date())
  const [confirmOpen, setConfirmOpen] = useState(false)
  const aheadRef = useRef(aheadAtStart)

  // Demo stand-in for the SSE stream: the queue advances on a timer while online.
  useEffect(() => {
    if (status !== "WAITING" || !online) return
    const id = setInterval(() => {
      // `ahead` = people in front of this ticket. Below zero means this ticket was called.
      const next = aheadRef.current - 1
      aheadRef.current = next
      setUpdatedAt(new Date())
      if (next < 0) {
        setStatus("CALLED")
        notify(`Nomor ${code} dipanggil`, `Silakan menuju ${CALLED_COUNTER}.`)
        return
      }
      setAhead(next)
      if (next === notifyAhead) notify("Giliran Anda sudah dekat", `Tinggal ${next} orang lagi.`)
    }, DEMO_TICK_MS)
    return () => clearInterval(id)
  }, [status, online, code, notifyAhead])

  async function enableNotifications() {
    if (readPermission() === "unsupported") {
      toast.error("Browser ini belum mendukung notifikasi. Biarkan halaman ini tetap terbuka.")
      return
    }
    await Notification.requestPermission()
    permissionListeners.forEach((cb) => cb())
    if (readPermission() === "granted") toast.success("Notifikasi aktif")
  }

  function cancelTicket() {
    setConfirmOpen(false)
    setStatus("CANCELLED")
    toast("Tiket dibatalkan")
  }

  if (status === "CANCELLED") {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <TicketXIcon />
          </EmptyMedia>
          <EmptyTitle>Tiket {code} dibatalkan</EmptyTitle>
          <EmptyDescription>Nomor Anda sudah dilepas. Anda bisa mengambil nomor baru kapan saja.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Link href="/klinik-kasih-ibu/margonda" className={buttonVariants()}>
            Ambil nomor baru
          </Link>
        </EmptyContent>
      </Empty>
    )
  }

  const [prefix, rawNumber] = code.split("-")
  const servingCode = formatTicketCode(prefix, Number(rawNumber) - ahead - 1)
  const called = status === "CALLED"
  const estimate = formatWaitRange(
    estimateWait({ ahead, avgServiceMinutes: props.avgServiceMinutes, activeCounters: props.activeCounters }),
  )
  const progress = ((aheadAtStart + 1 - ahead) / (aheadAtStart + 1)) * 100

  return (
    <div className="flex flex-col gap-4">
      {!online && (
        <Alert>
          <WifiOffIcon />
          <AlertTitle>Anda sedang offline</AlertTitle>
          <AlertDescription>
            Ini status terakhir yang kami terima. Halaman akan diperbarui otomatis begitu sinyal kembali.
          </AlertDescription>
        </Alert>
      )}

      <Card
        className={cn(
          "transition-colors",
          called && "bg-primary text-primary-foreground ring-primary motion-safe:animate-in motion-safe:zoom-in-95",
        )}
      >
        <CardHeader>
          <CardDescription className={cn(called && "text-primary-foreground/80")}>
            {props.tenantName}, {props.serviceName}
          </CardDescription>
          <CardTitle className="font-mono text-7xl font-semibold tracking-tighter">{code}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {called ? (
            <div aria-live="assertive" className="flex flex-col gap-1">
              <p className="text-xl font-medium">Giliran Anda, {props.customerName}.</p>
              <p className="opacity-85">Silakan menuju {CALLED_COUNTER} sekarang.</p>
            </div>
          ) : (
            <>
              <div aria-live="polite" className="flex items-center justify-between gap-3">
                <p className="text-lg font-medium">
                  {ahead === 0 ? "Anda berikutnya" : `Ada ${ahead} orang di depan Anda`}
                </p>
                <Badge variant="secondary">Menunggu</Badge>
              </div>
              <Progress value={progress} aria-label="Kemajuan antrean" />
              <Separator />
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Sedang dilayani</dt>
                  <dd className="font-mono text-xl font-medium">{servingCode}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Perkiraan dipanggil</dt>
                  <dd className="text-xl font-medium">{estimate}</dd>
                </div>
              </dl>
            </>
          )}
        </CardContent>
        <CardFooter
          className={cn("justify-between text-xs", called ? "border-primary-foreground/20 bg-transparent" : "text-muted-foreground")}
        >
          <span>
            Diperbarui{" "}
            <time suppressHydrationWarning dateTime={updatedAt.toISOString()}>
              {updatedAt.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </time>
          </span>
          <span>Mode demo</span>
        </CardFooter>
      </Card>

      {!called && (
        <Item variant="outline">
          <ItemMedia variant="icon">{permission === "granted" ? <BellRingIcon /> : <BellIcon />}</ItemMedia>
          <ItemContent>
            <ItemTitle>{permission === "granted" ? "Notifikasi aktif" : "Kabari saya saat giliran dekat"}</ItemTitle>
            <ItemDescription>
              {permission === "granted"
                ? `Kami kabari saat tinggal ${notifyAhead} orang dan saat Anda dipanggil.`
                : "Anda boleh menutup halaman ini setelah notifikasi aktif."}
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

      {!called && (
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogTrigger render={<Button variant="ghost" className="self-center text-muted-foreground" />}>
            Batalkan tiket
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Batalkan nomor {code}?</AlertDialogTitle>
              <AlertDialogDescription>
                Posisi Anda akan diberikan ke orang berikutnya dan tidak bisa dikembalikan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Tetap antre</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={cancelTicket}>
                Ya, batalkan
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}
