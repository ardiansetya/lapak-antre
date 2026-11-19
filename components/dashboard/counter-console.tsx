"use client"

import { useEffect, useEffectEvent, useReducer } from "react"
import { MegaphoneIcon, RepeatIcon, RotateCcwIcon, UserCheckIcon, UserXIcon, UsersIcon } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemSeparator,
  ItemTitle,
} from "@/components/ui/item"
import { Kbd } from "@/components/ui/kbd"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { STATUS_LABEL, type Counter, type Ticket } from "@/lib/queue"

const MAX_CALLS = 3

type Current = Ticket & { status: "CALLED" | "SERVING"; calls: number }
type State = {
  counterId: string
  current: Current | null
  queue: Ticket[]
  skipped: Ticket[]
  history: { code: string; status: "DONE" | "NO_SHOW" }[]
}
type Action =
  | { type: "switch"; counterId: string; queue: Ticket[] }
  | { type: "callNext" }
  | { type: "recall" }
  | { type: "start" }
  | { type: "done" }
  | { type: "noShow" }
  | { type: "restore"; id: string }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "switch":
      return { counterId: action.counterId, current: null, queue: action.queue, skipped: [], history: [] }
    case "callNext": {
      if (state.current || state.queue.length === 0) return state
      const [head, ...rest] = state.queue
      return { ...state, current: { ...head, status: "CALLED", calls: 1 }, queue: rest }
    }
    case "recall":
      if (state.current?.status !== "CALLED" || state.current.calls >= MAX_CALLS) return state
      return { ...state, current: { ...state.current, calls: state.current.calls + 1 } }
    case "start":
      if (state.current?.status !== "CALLED") return state
      return { ...state, current: { ...state.current, status: "SERVING" } }
    case "done":
      if (!state.current) return state
      return {
        ...state,
        current: null,
        history: [{ code: state.current.code, status: "DONE" as const }, ...state.history].slice(0, 6),
      }
    case "noShow":
      if (state.current?.status !== "CALLED") return state
      return {
        ...state,
        current: null,
        skipped: [state.current, ...state.skipped],
        history: [{ code: state.current.code, status: "NO_SHOW" as const }, ...state.history].slice(0, 6),
      }
    case "restore": {
      const ticket = state.skipped.find((t) => t.id === action.id)
      if (!ticket) return state
      return {
        ...state,
        skipped: state.skipped.filter((t) => t.id !== action.id),
        queue: [{ ...ticket, status: "WAITING" }, ...state.queue],
      }
    }
  }
}

function isTyping(target: EventTarget | null) {
  return target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
}

export function CounterConsole({ counters, tickets }: { counters: Counter[]; tickets: Ticket[] }) {
  const queueFor = (counterId: string) => {
    const ids = new Set(counters.find((c) => c.id === counterId)?.serviceIds)
    return tickets.filter((t) => ids.has(t.serviceId))
  }
  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    counterId: counters[0].id,
    current: null,
    queue: queueFor(counters[0].id),
    skipped: [],
    history: [],
  }))
  const { current, queue, skipped, history } = state
  const counterName = counters.find((c) => c.id === state.counterId)?.name ?? ""

  // Space triggers the primary action for the current state.
  const runPrimary = useEffectEvent(() => {
    if (!current) dispatch({ type: "callNext" })
    else if (current.status === "CALLED") dispatch({ type: "start" })
    else dispatch({ type: "done" })
  })
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code !== "Space" || e.repeat || isTyping(e.target)) return
      if (e.target instanceof HTMLButtonElement) return // let focused buttons handle Space themselves
      e.preventDefault()
      runPrimary()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const counterItems = counters.map((c) => ({ value: c.id, label: c.name }))

  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <div className="flex flex-col gap-4">
        <Select
          items={counterItems}
          value={state.counterId}
          onValueChange={(v) => v && dispatch({ type: "switch", counterId: String(v), queue: queueFor(String(v)) })}
        >
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
                <CardDescription>{counterName}</CardDescription>
                <CardTitle
                  key={current.code}
                  className="font-mono text-7xl font-semibold tracking-tighter motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 md:text-8xl"
                >
                  {current.code}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center gap-2 text-muted-foreground">
                <Badge variant={current.status === "SERVING" ? "default" : "secondary"}>{STATUS_LABEL[current.status]}</Badge>
                <span>
                  {current.name}, ambil nomor {current.takenAt}
                </span>
                {current.status === "CALLED" && current.calls > 1 && (
                  <Badge variant="outline">Dipanggil {current.calls}x</Badge>
                )}
              </CardContent>
              <CardFooter className="mt-auto flex-wrap gap-2 border-t">
                {current.status === "CALLED" ? (
                  <>
                    <Button size="lg" onClick={() => dispatch({ type: "start" })}>
                      <UserCheckIcon data-icon="inline-start" />
                      Mulai layani <Kbd className="ml-1">Spasi</Kbd>
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      disabled={current.calls >= MAX_CALLS}
                      onClick={() => {
                        dispatch({ type: "recall" })
                        toast(`${current.code} dipanggil ulang`)
                      }}
                    >
                      <RepeatIcon data-icon="inline-start" />
                      Panggil ulang
                    </Button>
                    <Button size="lg" variant="destructive" onClick={() => dispatch({ type: "noShow" })}>
                      <UserXIcon data-icon="inline-start" />
                      Tidak hadir
                    </Button>
                  </>
                ) : (
                  <Button size="lg" onClick={() => dispatch({ type: "done" })}>
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
                      ? `${queue.length} orang menunggu di ${counterName}.`
                      : "Belum ada pelanggan yang menunggu untuk loket ini."}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
              <Button size="lg" className="h-11 px-5" disabled={!queue.length} onClick={() => dispatch({ type: "callNext" })}>
                <MegaphoneIcon data-icon="inline-start" />
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
              <Badge variant="secondary" className="ml-auto tabular-nums">{queue.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {queue.length ? (
              <ItemGroup>
                {queue.slice(0, 6).map((t, i) => (
                  <div key={t.id}>
                    {i > 0 && <ItemSeparator />}
                    <Item size="xs">
                      <ItemContent>
                        <ItemTitle className="font-mono">{t.code}</ItemTitle>
                        <ItemDescription>{t.name}</ItemDescription>
                      </ItemContent>
                      <ItemActions className="text-xs text-muted-foreground">{t.takenAt}</ItemActions>
                    </Item>
                  </div>
                ))}
                {queue.length > 6 && (
                  <p className="pt-2 text-center text-xs text-muted-foreground">dan {queue.length - 6} lainnya</p>
                )}
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
                      <Button size="sm" variant="outline" onClick={() => dispatch({ type: "restore", id: t.id })}>
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
              {history.map((h, i) => (
                <Badge key={`${h.code}-${i}`} variant={h.status === "DONE" ? "secondary" : "outline"} className="font-mono">
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
