export const SITE = {
  name: "Lapak Antre",
  // Preview deploys have no NEXT_PUBLIC_SITE_URL; VERCEL_URL is their own URL (server-only, every importer is a server file).
  url:
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3100"),
  description:
    "Antrean virtual lewat scan QR. Pelanggan ambil nomor di HP, boleh pergi dulu, dan dapat notifikasi saat gilirannya dekat.",
} as const
