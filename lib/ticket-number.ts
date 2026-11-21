import type { Prisma } from "@/generated/prisma/client"

/**
 * Next ticket number for a service on a day, safe under concurrent requests (PRD 7.4).
 * The upsert takes a row lock that is held until the transaction commits, so the
 * read below sees this transaction's own increment and no other request can share it.
 * Plain INSERT ... ON DUPLICATE KEY UPDATE runs on both MySQL 8 and TiDB.
 */
export async function nextTicketNumber(tx: Prisma.TransactionClient, serviceId: string, date: Date) {
  // Pass the day as text: a raw Date would be shifted by the driver's local time zone.
  const day = date.toISOString().slice(0, 10)
  await tx.$executeRaw`
    INSERT INTO DailyCounter (serviceId, date, lastNumber) VALUES (${serviceId}, ${day}, 1)
    ON DUPLICATE KEY UPDATE lastNumber = lastNumber + 1`
  const row = await tx.dailyCounter.findUniqueOrThrow({
    where: { serviceId_date: { serviceId, date } },
    select: { lastNumber: true },
  })
  return row.lastNumber
}
