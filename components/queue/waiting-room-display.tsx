"use client"

import { useEffect, useRef, useState } from "react"
import { Volume2Icon, VolumeXIcon } from "lucide-react"

import { FlapCode } from "@/components/queue/flap-code"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function speak(code: string, counter: string) {
  if (!("speechSynthesis" in window)) return
  const [prefix, n] = code.split("-")
  const u = new SpeechSynthesisUtterance(`Nomor antrean ${prefix}, ${Number(n)}. Silakan menuju ${counter}.`)
  u.lang = "id-ID"
  u.rate = 0.9
  window.speechSynthesis.speak(u)
}

type Props = {
  title: string
  counters: { id: string; name: string; code: string | null }[]
  latest: { counterName: string; code: string; callKey: string } | null
  upcoming: { service: string; codes: string[] }[]
}

export function WaitingRoomDisplay({ title, counters, latest, upcoming }: Props) {
  const [soundOn, setSoundOn] = useState(false)
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    const tick = () => setNow(new Date())
    const id = setInterval(tick, 1000)
    const first = setTimeout(tick, 0)
    return () => {
      clearInterval(id)
      clearTimeout(first)
    }
  }, [])

  // Announce each new call or recall once. callKey changes on both.
  const announced = useRef(latest?.callKey)
  useEffect(() => {
    if (!latest || latest.callKey === announced.current) return
    announced.current = latest.callKey
    if (soundOn) speak(latest.code, latest.counterName)
  }, [latest, soundOn])

  return (
    <div className="dark flex min-h-svh flex-col bg-board p-6 text-foreground lg:p-10">
      <header className="flex items-center justify-between gap-4">
        <h1 className="font-mono text-lg tracking-widest text-white/60 uppercase lg:text-xl">{title}</h1>
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setSoundOn((v) => !v)} aria-pressed={soundOn}>
            {soundOn ? <Volume2Icon data-icon="inline-start" /> : <VolumeXIcon data-icon="inline-start" />}
            {soundOn ? "Suara aktif" : "Aktifkan suara"}
          </Button>
          <time suppressHydrationWarning className="font-mono text-3xl font-medium text-board-foreground tabular-nums">
            {now?.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
          </time>
        </div>
      </header>

      <main className="mt-8 grid flex-1 gap-6 lg:grid-cols-[1.35fr_1fr]">
        <section
          aria-live="assertive"
          className="flex flex-col items-center justify-center gap-8 rounded-xl border border-white/10 bg-white/[0.03] p-10 text-center"
        >
          <p className="font-mono text-xl tracking-[0.3em] text-white/50 uppercase">Nomor dipanggil</p>
          {latest ? (
            <>
              <FlapCode key={latest.callKey} code={latest.code} size="xl" />
              <p className="font-heading text-5xl font-extrabold tracking-tight text-board-foreground">{latest.counterName}</p>
            </>
          ) : (
            <p className="font-heading text-4xl font-bold text-white/40">Belum ada yang dipanggil</p>
          )}
        </section>

        <section className="flex flex-col gap-3">
          {counters.map((c) => (
            <div
              key={c.id}
              className={cn(
                "flex items-center justify-between gap-4 rounded-lg border border-white/10 px-6 py-5 transition-colors",
                c.code === latest?.code && "border-board-foreground/60 bg-board-foreground/5",
              )}
            >
              <span className="text-2xl text-white/70">{c.name}</span>
              {c.code ? <FlapCode code={c.code} size="md" /> : <span className="font-mono text-3xl text-white/25">---</span>}
            </div>
          ))}
        </section>
      </main>

      <footer className="mt-6 grid gap-6 border-t border-white/10 pt-6 md:grid-cols-3">
        {upcoming.map((u) => (
          <div key={u.service}>
            <p className="font-mono text-sm tracking-widest text-white/45 uppercase">Berikutnya, {u.service}</p>
            <p className="mt-2 font-mono text-2xl font-semibold tracking-wider text-white/85">{u.codes.join("  ") || "Kosong"}</p>
          </div>
        ))}
      </footer>
    </div>
  )
}
