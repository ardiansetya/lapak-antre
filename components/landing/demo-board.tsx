"use client"

import { useEffect, useState } from "react"

import { FlapCode } from "@/components/queue/flap-code"
import { formatTicketCode } from "@/lib/queue"

const ROWS = [
  { service: "Poli Umum", prefix: "A", start: 12, room: "Ruang 1" },
  { service: "Poli Gigi", prefix: "B", start: 5, room: "Ruang Gigi" },
  { service: "Ambil Obat", prefix: "C", start: 20, room: "Apotek" },
]

/** Landing-page board. Advances one row every few seconds to show the flip, as the real display does. */
export function DemoBoard() {
  const [calls, setCalls] = useState([0, 0, 0])
  const [latest, setLatest] = useState(0)

  useEffect(() => {
    let turn = 0
    const id = setInterval(() => {
      const row = turn++ % ROWS.length
      setCalls((prev) => prev.map((n, i) => (i === row ? n + 1 : n)))
      setLatest(row)
    }, 2600)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="dark overflow-hidden rounded-lg border bg-board text-foreground shadow-xl shadow-black/10">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-3 font-mono text-xs tracking-widest text-white/60 uppercase">
        <span>Klinik Kasih Ibu</span>
        <span className="flex items-center gap-2 text-board-foreground">
          <span className="size-1.5 animate-pulse rounded-full bg-board-foreground motion-reduce:animate-none" />
          Langsung
        </span>
      </div>
      <table className="w-full text-left">
        <thead className="font-mono text-[0.7rem] tracking-widest text-white/45 uppercase">
          <tr>
            <th className="px-5 pt-4 pb-2 font-normal">Layanan</th>
            <th className="px-2 pt-4 pb-2 font-normal">Nomor</th>
            <th className="hidden px-5 pt-4 pb-2 font-normal sm:table-cell">Menuju</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row, i) => (
            <tr key={row.prefix} className="border-t border-white/5">
              <td className="px-5 py-3 text-sm text-white/85">{row.service}</td>
              <td className="px-2 py-3">
                <FlapCode code={formatTicketCode(row.prefix, row.start + calls[i])} size="sm" />
              </td>
              <td className="hidden px-5 py-3 font-mono text-sm sm:table-cell">
                <span className={i === latest ? "text-board-foreground" : "text-white/60"}>{row.room}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
