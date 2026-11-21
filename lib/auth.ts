import "server-only"

import { cache } from "react"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { randomToken, sha256 } from "@/lib/crypto"
import { db } from "@/lib/db"

const COOKIE = "la_session"
const MAX_AGE_DAYS = 30

export async function createSession(userId: string) {
  const token = randomToken()
  const expiresAt = new Date(Date.now() + MAX_AGE_DAYS * 86_400_000)
  await db.session.create({ data: { tokenHash: sha256(token), userId, expiresAt } })
  const jar = await cookies()
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  })
}

export async function destroySession() {
  const jar = await cookies()
  const token = jar.get(COOKIE)?.value
  if (token) await db.session.deleteMany({ where: { tokenHash: sha256(token) } })
  jar.delete(COOKIE)
}

/** Current staff user with their tenant and first branch, or null. Deduped per request. */
export const getStaff = cache(async () => {
  const token = (await cookies()).get(COOKIE)?.value
  if (!token) return null
  const session = await db.session.findUnique({
    where: { tokenHash: sha256(token) },
    include: {
      user: {
        include: {
          memberships: {
            take: 1,
            include: { tenant: { include: { branches: { take: 1, orderBy: { name: "asc" } } } } },
          },
        },
      },
    },
  })
  if (!session || session.expiresAt < new Date()) return null
  const membership = session.user.memberships[0]
  const branch = membership?.tenant.branches[0]
  if (!membership || !branch) return null
  return {
    userId: session.user.id,
    name: session.user.name,
    role: membership.role,
    tenant: { id: membership.tenant.id, slug: membership.tenant.slug, name: membership.tenant.name },
    // shortcut: staff works on the tenant's first branch; add a branch switcher when tenants have several
    branch,
  }
})

export type Staff = NonNullable<Awaited<ReturnType<typeof getStaff>>>

/** Use in every dashboard page and every staff server action. */
export async function requireStaff() {
  const staff = await getStaff()
  if (!staff) redirect("/masuk")
  return staff
}
