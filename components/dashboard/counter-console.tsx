"use client"

import { useEffect, useEffectEvent, useTransition } from "react"
import { useRouter } from "next/navigation"
import { MegaphoneIcon, RepeatIcon, RotateCcwIcon, UserCheckIcon, UserXIcon, UsersIcon } from "lucide-react"
import { toast } from "sonner"

import { FlapCode } from "@/components/queue/flap-code"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@/components/ui/item"
import { Kbd } from "@/components/ui/kbd"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { callNext, updateTicket } from "@/lib/actions"
import { STATUS_LABEL, type TicketStatus } from "@/lib/queue"

type ConsoleTicket = { id: string; code: string; name: string; status: TicketStatus; callCount: number; createdAt: Date }

type Props = {
  counters: { id: string; name: string }[]
  counter: { id: string; name: string }
  current: ConsoleTicket | null
  queue: ConsoleTicket[]
  skipped: ConsoleTicket[]
  history: { id: string; code: string; status: TicketStatus }[]
}

const MAX_CALLS = 3
const timeFormat = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" })

function isTyping(target: EventTarget | null) {
  return target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
}

export function CounterConsole({ counters, counter, current, queue, skipped, history }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function run(action: () => Promise<{ error?: string } | void>, success?: string) {
    startTransition(async () => {
      const result = await action()
      if (result?.error) toast.error(result.error)
      else if (success) toast(success)
    })
  }

  const primary = () => {
    if (!current) run(() => callNext(counter.id))
    else if (current.status === "CALLED") run(() => updateTicket(current.id, "start"))
    else run(() => updateTicket(current.id, "finish"))
  }

  // Space triggers the primary action for the current state.
  const onSpace = useEffectEvent(() => {
    if (!pending) primary()
  })
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code !== "Space" || e.repeat || isTyping(e.target)) return
      if (e.target instanceof HTMLButtonElement) return // focused buttons handle Space themselves
      e.preventDefault()
      onSpace()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const counterItems = counters.map((c) => ({ value: c.id, label: c.name }))

  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <div className="flex flex-col gap-4">
        <Select items={counterItems} value={counter.id} onValueChange={(v) => v && router.push(`?loket=${v}`)}>
          <SelectTrigger className="w-full sm:w-64" aria-label="Pilih loket">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {counterItems.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <Card className="min-h-80">
          {current ? (
            <>
              <CardHeader>
                <CardDescription className="font-mono text-xs tracking-widest uppercase">{counter.name}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                <FlapCode code={current.code} size="lg" />
                <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
                  <Badge variant={current.status === "SERVING" ? "default" : "secondary"}>{STATUS_LABEL[current.status]}</Badge>
                  <span>
                    {current.name}, ambil nomor {timeFormat.format(current.createdAt)}
                  </span>
                  {current.status === "CALLED" && current.callCount > 1 && (
                    <Badge variant="outline">Dipanggil {current.callCount}x</Badge>
                  )}
                </div>
              </CardContent>
              <CardFooter className="mt-auto flex-wrap gap-2 border-t">
                {current.status === "CALLED" ? (
                  <>
                    <Button size="lg" disabled={pending} onClick={primary}>
                      {pending ? <Spinner data-icon="inline-start" /> : <UserCheckIcon data-icon="inline-start" />}
                      Mulai layani <Kbd className="ml-1">Spasi</Kbd>
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      disabled={pending || current.callCount >= MAX_CALLS}
                      onClick={() => run(() => updateTicket(current.id, "recall"), `${current.code} dipanggil ulang`)}
                    >
                      <RepeatIcon data-icon="inline-start" />
                      Panggil ulang
                    </Button>
                    <Button size="lg" variant="destructive" disabled={pending} onClick={() => run(() => updateTicket(current.id, "noShow"))}>
                      <UserXIcon data-icon="inline-start" />
                      Tidak hadir
                    </Button>
                  </>
                ) : (
                  <Button size="lg" disabled={pending} onClick={primary}>
                    {pending && <Spinner data-icon="inline-start" />}
                    Selesai <Kbd className="ml-1">Spasi</Kbd>
                  </Button>
                )}
              </CardFooter>
            </>
          ) : (
            <CardContent className="flex flex-1 flex-col items-center justify-center gap-4 py-10">
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <MegaphoneIcon />
                  </EmptyMedia>
                  <EmptyTitle>{queue.length ? "Siap memanggil" : "Antrean kosong"}</EmptyTitle>
                  <EmptyDescription>
                    {queue.length
                      ? `${queue.length} orang menunggu di ${counter.name}.`
                      : "Belum ada pelanggan yang menunggu untuk loket ini."}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
              <Button size="lg" className="h-12 px-6 text-base" disabled={pending || !queue.length} onClick={primary}>
                {pending ? <Spinner data-icon="inline-start" /> : <MegaphoneIcon data-icon="inline-start" />}
                Panggil berikutnya <Kbd className="ml-1">Spasi</Kbd>
              </Button>
            </CardContent>
          )}
        </Card>
      </div>

      <div className="flex flex-col gap-4">
        <Card size="sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UsersIcon className="size-4" /> Menunggu
              <Badge variant="secondary" className="ml-auto font-mono tabular-nums">
                {queue.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {queue.length ? (
              <ItemGroup>
                {queue.slice(0, 6).map((t) => (
                  <Item key={t.id} size="xs">
                    <ItemContent>
                      <ItemTitle className="font-mono">{t.code}</ItemTitle>
                      <ItemDescription>{t.name}</ItemDescription>
                    </ItemContent>
                    <ItemActions className="font-mono text-xs text-muted-foreground">{timeFormat.format(t.createdAt)}</ItemActions>
                  </Item>
                ))}
                {queue.length > 6 && <p className="pt-2 text-center text-xs text-muted-foreground">dan {queue.length - 6} lainnya</p>}
              </ItemGroup>
            ) : (
              <p className="text-sm text-muted-foreground">Tidak ada yang menunggu.</p>
            )}
          </CardContent>
        </Card>

        {skipped.length > 0 && (
          <Card size="sm">
            <CardHeader>
              <CardTitle>Tidak hadir</CardTitle>
              <CardDescription>Kembalikan ke antrean jika pelanggan datang terlambat.</CardDescription>
            </CardHeader>
            <CardContent>
              <ItemGroup>
                {skipped.map((t) => (
                  <Item key={t.id} size="xs">
                    <ItemContent>
                      <ItemTitle className="font-mono">{t.code}</ItemTitle>
                      <ItemDescription>{t.name}</ItemDescription>
                    </ItemContent>
                    <ItemActions>
                      <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => updateTicket(t.id, "restore"))}>
                        <RotateCcwIcon data-icon="inline-start" />
                        Kembalikan
                      </Button>
                    </ItemActions>
                  </Item>
                ))}
              </ItemGroup>
            </CardContent>
          </Card>
        )}

        {history.length > 0 && (
          <Card size="sm">
            <CardHeader>
              <CardTitle>Baru saja</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {history.map((h) => (
                <Badge key={h.id} variant={h.status === "DONE" ? "secondary" : "outline"} className="font-mono">
                  {h.code} {STATUS_LABEL[h.status].toLowerCase()}
                </Badge>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
