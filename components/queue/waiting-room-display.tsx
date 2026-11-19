"use client"

import { useEffect, useRef, useState } from "react"
import { Volume2Icon, VolumeXIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { formatTicketCode } from "@/lib/queue"
import { cn } from "@/lib/utils"

type CounterView = { id: string; name: string; code: string }

function speak(code: string, counter: string) {
  if (!("speechSynthesis" in window)) return
  const [prefix, n] = code.split("-")
  const u = new SpeechSynthesisUtterance(`Nomor antrean ${prefix}, ${Number(n)}. Silakan menuju ${counter}.`)
  u.lang = "id-ID"
  u.rate = 0.9
  window.speechSynthesis.speak(u)
}

function nextCode(code: string) {
  const [prefix, n] = code.split("-")
  return formatTicketCode(prefix, Number(n) + 1)
}

const DEMO_CALL_MS = 9000

export function WaitingRoomDisplay({
  title,
  initialCounters,
  upcoming,
}: {
  title: string
  initialCounters: CounterView[]
  upcoming: { service: string; codes: string[] }[]
}) {
  const [counters, setCounters] = useState(initialCounters)
  const [latestId, setLatestId] = useState(initialCounters[0]?.id)
  const [soundOn, setSoundOn] = useState(false)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  // Refs keep the timer stable and keep side effects out of state updaters.
  const countersRef = useRef(initialCounters)
  const soundRef = useRef(soundOn)
  useEffect(() => {
    soundRef.current = soundOn
  }, [soundOn])

  // Demo stand-in for realtime events: one counter calls its next number on a timer.
  useEffect(() => {
    let turn = 0
    const id = setInterval(() => {
      turn += 1
      const prev = countersRef.current
      const target = prev[turn % prev.length]
      const code = nextCode(target.code)
      const next = prev.map((c) => (c.id === target.id ? { ...c, code } : c))
      countersRef.current = next
      setCounters(next)
      setLatestId(target.id)
      if (soundRef.current) speak(code, target.name)
    }, DEMO_CALL_MS)
    return () => clearInterval(id)
  }, [])

  const latest = counters.find((c) => c.id === latestId) ?? counters[0]

  return (
    <div className="dark flex min-h-svh flex-col bg-background p-6 text-foreground lg:p-10">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-medium text-muted-foreground lg:text-2xl">{title}</h1>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => setSoundOn((v) => !v)}
            aria-pressed={soundOn}
          >
            {soundOn ? <Volume2Icon data-icon="inline-start" /> : <VolumeXIcon data-icon="inline-start" />}
            {soundOn ? "Suara aktif" : "Aktifkan suara"}
          </Button>
          <time suppressHydrationWarning className="font-mono text-3xl font-medium tabular-nums">
            {now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
          </time>
        </div>
      </header>

      <main className="mt-8 grid flex-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section
          aria-live="assertive"
          className="flex flex-col items-center justify-center rounded-3xl bg-primary p-10 text-center text-primary-foreground"
        >
          <p className="text-2xl font-medium opacity-80">Nomor dipanggil</p>
          <p
            key={latest?.code}
            className="font-mono text-[clamp(6rem,16vw,14rem)] leading-none font-semibold tracking-tighter motion-safe:animate-in motion-safe:zoom-in-90 motion-safe:fade-in motion-safe:duration-500"
          >
            {latest?.code}
          </p>
          <p className="mt-4 text-4xl font-medium">{latest?.name}</p>
        </section>

        <section className="flex flex-col gap-3">
          {counters.map((c) => (
            <div
              key={c.id}
              className={cn(
                "flex items-center justify-between rounded-2xl border px-6 py-5 transition-colors",
                c.id === latestId && "border-primary",
              )}
            >
              <span className="text-2xl text-muted-foreground">{c.name}</span>
              <span className="font-mono text-5xl font-semibold tracking-tight">{c.code}</span>
            </div>
          ))}
        </section>
      </main>

      <footer className="mt-6 grid gap-4 border-t pt-6 md:grid-cols-3">
        {upcoming.map((u) => (
          <div key={u.service}>
            <p className="text-lg text-muted-foreground">Berikutnya, {u.service}</p>
            <p className="font-mono text-2xl font-medium">{u.codes.join("   ") || "Kosong"}</p>
          </div>
        ))}
      </footer>
    </div>
  )
}
