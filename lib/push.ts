import "server-only"

import { sendNotification, setVapidDetails, WebPushError } from "web-push"

import { db } from "@/lib/db"

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const privateKey = process.env.VAPID_PRIVATE_KEY
// Without keys, push is off; the ticket page still notifies while it is open.
const enabled = Boolean(publicKey && privateKey)
if (enabled) setVapidDetails(process.env.VAPID_SUBJECT || "mailto:admin@example.com", publicKey!, privateKey!)

type Message = { title: string; body: string; url: string; tag: string }

async function pushToTicket(ticketId: string, message: Message) {
  const subscriptions = await db.pushSubscription.findMany({ where: { ticketId } })
  await Promise.all(
    subscriptions.map(async (s) => {
      try {
        await sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify(message),
          { urgency: "high", TTL: 15 * 60 },
        )
      } catch (error) {
        // 404/410: the browser dropped this subscription for good.
        if (error instanceof WebPushError && (error.statusCode === 404 || error.statusCode === 410))
          await db.pushSubscription.deleteMany({ where: { id: s.id } })
        else console.error("web push failed", s.endpoint.slice(0, 60), error)
      }
    }),
  )
}

/**
 * After a call or recall: tell the called ticket, then tell each ticket that just moved
 * within its service's `notifyAhead` window. The "near" push is claimed with a conditional
 * update, so two calls racing each other still send it once.
 */
export async function notifyQueue(calledTicketId: string) {
  if (!enabled) return
  const called = await db.ticket.findUnique({
    where: { id: calledTicketId },
    include: { counter: { select: { name: true } }, service: { select: { notifyAhead: true } } },
  })
  if (!called) return

  await pushToTicket(called.id, {
    title: `Nomor ${called.code} dipanggil`,
    body: `Silakan menuju ${called.counter?.name ?? "loket"} sekarang.`,
    url: `/tiket/${called.accessToken}`,
    tag: called.code,
  })

  const near = await db.ticket.findMany({
    where: { serviceId: called.serviceId, date: called.date, status: "WAITING" },
    orderBy: { number: "asc" },
    take: called.service.notifyAhead,
    select: { id: true, code: true, accessToken: true, nearNotifiedAt: true },
  })
  for (const [ahead, ticket] of near.entries()) {
    if (ticket.nearNotifiedAt) continue
    const claimed = await db.ticket.updateMany({
      where: { id: ticket.id, nearNotifiedAt: null },
      data: { nearNotifiedAt: new Date() },
    })
    if (!claimed.count) continue
    await pushToTicket(ticket.id, {
      title: "Giliran Anda sudah dekat",
      body: ahead === 0 ? "Anda berikutnya." : `Tinggal ${ahead} orang lagi.`,
      url: `/tiket/${ticket.accessToken}`,
      tag: ticket.code,
    })
  }
}
