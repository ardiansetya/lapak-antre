"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/** Re-renders the current server page whenever the branch queue changes (SSE). */
export function LiveRefresh({ branchId, version }: { branchId: string; version: number }) {
  const router = useRouter()
  useEffect(() => {
    const events = new EventSource(`/api/branches/${branchId}/events?v=${version}`)
    events.onmessage = () => router.refresh()
    return () => events.close()
  }, [branchId, version, router])
  return null
}
