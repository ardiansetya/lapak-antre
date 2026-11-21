import { db } from "@/lib/db"

// Vercel Hobby caps a function at 300 s. We close a bit earlier; EventSource reconnects on its own.
export const maxDuration = 300
const STREAM_MS = 280_000
const POLL_MS = 1_500
const PING_EVERY = 10 // polls, about 15 s, keeps proxies from closing an idle stream

/**
 * Server-Sent Events: pushes the branch's queue `version` whenever it changes.
 * Clients pass the version they rendered with (`?v=`), so a change that happened
 * before they connected is not missed. Works on serverless: no shared memory needed,
 * every instance just watches the same DB column.
 */
export async function GET(request: Request, { params }: { params: Promise<{ branchId: string }> }) {
  const { branchId } = await params
  let last = Number(new URL(request.url).searchParams.get("v") ?? Number.NaN)
  const encoder = new TextEncoder()
  const started = Date.now()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (chunk: string) => controller.enqueue(encoder.encode(chunk))
      send("retry: 2000\n\n")
      let polls = 0
      try {
        while (!request.signal.aborted && Date.now() - started < STREAM_MS) {
          const branch = await db.branch.findUnique({ where: { id: branchId }, select: { version: true } })
          if (!branch) break
          if (branch.version !== last) {
            if (!Number.isNaN(last)) send(`data: ${branch.version}\n\n`)
            last = branch.version
          } else if (++polls % PING_EVERY === 0) {
            send(": ping\n\n")
          }
          await new Promise((resolve) => setTimeout(resolve, POLL_MS))
        }
      } finally {
        try {
          controller.close()
        } catch {
          // client already gone
        }
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  })
}
