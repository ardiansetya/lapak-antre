import { redirect } from "next/navigation"

import { db } from "@/lib/db"
import { qrCodeForToday } from "@/lib/queries"

/** Landing-page shortcut: sends visitors to the demo clinic with today's valid QR code, as if they scanned the poster. */
export async function GET() {
  const branch = await db.branch.findFirst({ where: { slug: "margonda", tenant: { slug: "klinik-kasih-ibu" } } })
  if (!branch) redirect("/")
  redirect(`/klinik-kasih-ibu/margonda?k=${qrCodeForToday(branch)}`)
}
