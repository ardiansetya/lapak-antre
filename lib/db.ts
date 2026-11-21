import "server-only"

import { PrismaClient } from "@/generated/prisma/client"
import { createAdapter } from "@/lib/db-adapter"

// Reuse one client across hot reloads in dev.
const globalForDb = globalThis as unknown as { db?: PrismaClient }
export const db = globalForDb.db ?? new PrismaClient({ adapter: createAdapter() })
if (process.env.NODE_ENV !== "production") globalForDb.db = db
