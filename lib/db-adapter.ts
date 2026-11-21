import { PrismaMariaDb } from "@prisma/adapter-mariadb"

/** Prisma driver adapter from a mysql:// URL. Works for local MySQL 8 and TiDB Cloud (`?ssl=true`). */
export function createAdapter(databaseUrl = process.env.DATABASE_URL) {
  if (!databaseUrl) throw new Error("DATABASE_URL is not set. Copy .env.example to .env and fill it in.")
  const url = new URL(databaseUrl)
  return new PrismaMariaDb({
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1),
    connectionLimit: 5,
    // MySQL 8 default auth (caching_sha2_password) over a non-TLS local connection.
    allowPublicKeyRetrieval: true,
    ssl: url.searchParams.get("ssl") === "true" ? { minVersion: "TLSv1.2" } : undefined,
  })
}
