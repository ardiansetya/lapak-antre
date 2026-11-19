import Link from "next/link"
import {
  ArrowRightIcon,
  BellRingIcon,
  BuildingIcon,
  CarIcon,
  ChartLineIcon,
  LandmarkIcon,
  MonitorSmartphoneIcon,
  PillIcon,
  QrCodeIcon,
  ScissorsIcon,
  ShirtIcon,
  StethoscopeIcon,
  FootprintsIcon,
  WifiOffIcon,
} from "lucide-react"

import { Logo } from "@/components/brand/logo"
import { SiteHeader } from "@/components/landing/site-header"
import { TicketPreview } from "@/components/queue/ticket-preview"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Kbd } from "@/components/ui/kbd"
import { SITE } from "@/lib/site"

const AUDIENCES = [
  { icon: StethoscopeIcon, label: "Klinik & praktik dokter" },
  { icon: ScissorsIcon, label: "Barbershop & salon" },
  { icon: CarIcon, label: "Bengkel" },
  { icon: ShirtIcon, label: "Laundry" },
  { icon: PillIcon, label: "Apotek" },
  { icon: LandmarkIcon, label: "Layanan publik" },
]

const STEPS = [
  {
    icon: QrCodeIcon,
    title: "Scan QR di lokasi",
    body: "Pelanggan memindai poster QR dan langsung mendapat nomor. Tanpa install aplikasi, tanpa daftar akun.",
  },
  {
    icon: FootprintsIcon,
    title: "Pergi dulu, pantau dari HP",
    body: "Halaman tiket menampilkan posisi dan perkiraan waktu yang terus diperbarui. Pelanggan bebas ngopi atau belanja dulu.",
  },
  {
    icon: BellRingIcon,
    title: "Kembali saat dikabari",
    body: "Notifikasi masuk saat tinggal beberapa orang lagi, lalu sekali lagi saat nomornya dipanggil.",
  },
]

const FAQ = [
  {
    q: "Apakah pelanggan harus install aplikasi?",
    a: "Tidak. Cukup scan QR dengan kamera HP. Halaman tiket terbuka di browser dan bisa ditambahkan ke layar utama kalau pelanggan mau.",
  },
  {
    q: "Bagaimana dengan pelanggan yang tidak punya HP?",
    a: "Petugas bisa membuatkan nomor dari dashboard dan menyebutkannya langsung. Nomor itu ikut tampil di layar ruang tunggu.",
  },
  {
    q: "Notifikasinya lewat apa?",
    a: "Lewat notifikasi browser (Web Push). WhatsApp bisa diaktifkan sebagai cadangan untuk pelanggan yang mengisi nomor HP.",
  },
  {
    q: "Seberapa akurat perkiraan waktu tunggunya?",
    a: "Di awal, perkiraan dihitung dari rata-rata lama layanan hari itu. Setelah data cukup, sistem belajar dari pola jam sibuk usaha Anda dan menampilkan seberapa meleset perkiraannya.",
  },
  {
    q: "Apakah bisa untuk beberapa cabang?",
    a: "Bisa. Satu akun pemilik dapat mengelola banyak cabang, masing-masing dengan layanan, loket, dan QR sendiri.",
  },
]

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE.name,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: SITE.description,
    url: SITE.url,
    inLanguage: "id",
    offers: { "@type": "Offer", price: "0", priceCurrency: "IDR" },
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  },
]

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <SiteHeader />
      <main>
        {/* Hero: asymmetric split, real component preview on the right */}
        <section className="mx-auto grid max-w-6xl items-center gap-16 px-4 pt-14 pb-24 md:grid-cols-[1.15fr_1fr] md:px-6 md:pt-20">
          <div className="flex flex-col items-start gap-6 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-700">
            <h1 className="max-w-xl text-4xl leading-[1.05] font-semibold tracking-tighter text-balance md:text-6xl">
              Antre tanpa harus duduk menunggu.
            </h1>
            <p className="max-w-md text-lg leading-relaxed text-muted-foreground">
              Pelanggan scan QR, dapat nomor di HP, lalu dikabari saat gilirannya dekat. Ruang tunggu Anda jadi lega.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/daftar" className={buttonVariants({ size: "lg", className: "px-4" })}>
                Coba gratis
                <ArrowRightIcon data-icon="inline-end" />
              </Link>
              <Link
                href="/tiket/demo"
                className={buttonVariants({ size: "lg", variant: "outline", className: "px-4" })}
              >
                Lihat contoh tiket
              </Link>
            </div>
          </div>
          <div className="pb-20 motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-700 md:rotate-2">
            <TicketPreview />
          </div>
        </section>

        {/* Audience strip */}
        <section aria-label="Cocok untuk" className="border-y bg-muted/40">
          <ul className="mx-auto flex max-w-6xl flex-wrap justify-center gap-x-8 gap-y-3 px-4 py-6 text-sm text-muted-foreground md:justify-between md:px-6">
            {AUDIENCES.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2">
                <Icon className="size-4 text-primary" strokeWidth={1.75} />
                {label}
              </li>
            ))}
          </ul>
        </section>

        {/* How it works: sticky headline + ordered list */}
        <section id="cara-kerja" className="mx-auto grid max-w-6xl scroll-mt-20 gap-12 px-4 py-24 md:grid-cols-[1fr_1.3fr] md:px-6">
          <div className="md:sticky md:top-28 md:self-start">
            <h2 className="text-3xl font-semibold tracking-tight text-balance md:text-4xl">
              Antrean pindah dari kursi ke saku pelanggan.
            </h2>
            <p className="mt-4 max-w-sm leading-relaxed text-muted-foreground">
              Tidak ada perangkat yang perlu dibeli. Cetak QR, tempel di pintu, dan mulai melayani.
            </p>
          </div>
          <ol className="flex flex-col gap-10">
            {STEPS.map(({ icon: Icon, title, body }) => (
              <li key={title} className="grid grid-cols-[auto_1fr] gap-5">
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" strokeWidth={1.75} />
                </span>
                <div>
                  <h3 className="text-lg font-medium">{title}</h3>
                  <p className="mt-1.5 max-w-prose leading-relaxed text-muted-foreground">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Features: bento with 5 cells */}
        <section id="fitur" className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-24 md:px-6">
          <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-balance md:text-4xl">
            Dibuat untuk jam sibuk, bukan untuk presentasi.
          </h2>
          <div className="mt-10 grid gap-4 md:grid-cols-6">
            <div className="flex flex-col justify-between gap-8 rounded-2xl bg-primary p-7 text-primary-foreground md:col-span-4">
              <div>
                <MonitorSmartphoneIcon className="size-6" strokeWidth={1.75} />
                <h3 className="mt-4 text-xl font-medium">Satu kali klik, semua layar ikut berubah</h3>
                <p className="mt-2 max-w-md leading-relaxed opacity-85">
                  Saat petugas memanggil nomor, HP pelanggan, dashboard, dan TV ruang tunggu langsung diperbarui.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3 font-mono">
                {[
                  ["Ruang 1", "A-012"],
                  ["Ruang 2", "A-013"],
                  ["Apotek", "C-020"],
                ].map(([room, code]) => (
                  <div key={room} className="rounded-xl bg-primary-foreground/10 px-4 py-3">
                    <p className="text-xs opacity-75">{room}</p>
                    <p className="text-2xl font-semibold tracking-tight">{code}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4 rounded-2xl bg-muted p-7 md:col-span-2">
              <BellRingIcon className="size-6 text-primary" strokeWidth={1.75} />
              <h3 className="text-xl font-medium">Dikabari sebelum terlambat</h3>
              <p className="leading-relaxed text-muted-foreground">
                Pemilik menentukan kapan notifikasi dikirim, misalnya saat tinggal tiga orang.
              </p>
            </div>

            <div className="flex flex-col gap-4 rounded-2xl border p-7 md:col-span-2">
              <ChartLineIcon className="size-6 text-primary" strokeWidth={1.75} />
              <h3 className="text-xl font-medium">Perkiraan yang makin tepat</h3>
              <p className="leading-relaxed text-muted-foreground">
                Waktu tunggu ditampilkan sebagai rentang yang jujur dan belajar dari data usaha Anda sendiri.
              </p>
              <p className="mt-auto font-mono text-3xl font-semibold tracking-tight">15-25 menit</p>
            </div>

            <div className="flex flex-col gap-4 rounded-2xl border bg-[radial-gradient(var(--color-border)_1px,transparent_1px)] [background-size:14px_14px] p-7 md:col-span-2">
              <WifiOffIcon className="size-6 text-primary" strokeWidth={1.75} />
              <h3 className="text-xl font-medium">Sinyal hilang, tiket tetap ada</h3>
              <p className="leading-relaxed text-muted-foreground">
                Halaman tiket tetap terbuka saat offline dan menyesuaikan diri begitu sinyal kembali.
              </p>
            </div>

            <div className="flex flex-col gap-4 rounded-2xl bg-muted p-7 md:col-span-2">
              <BuildingIcon className="size-6 text-primary" strokeWidth={1.75} />
              <h3 className="text-xl font-medium">Banyak cabang, satu akun</h3>
              <p className="leading-relaxed text-muted-foreground">
                Setiap cabang punya layanan, loket, dan QR sendiri. Laporannya bisa dilihat dari satu tempat.
              </p>
            </div>
          </div>
        </section>

        {/* For staff: real console preview + copy */}
        <section className="border-y bg-muted/40">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-24 md:grid-cols-2 md:px-6">
            <Card className="mx-auto w-full max-w-sm">
              <CardHeader>
                <CardDescription>Ruang Periksa 1</CardDescription>
                <CardTitle className="font-mono text-5xl font-semibold tracking-tighter">A-014</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge>Dipanggil</Badge>
                Agus Prasetyo, ambil nomor 09.16
              </CardContent>
              <CardFooter className="justify-between border-t">
                <span className="text-sm text-muted-foreground">6 orang menunggu</span>
                <span className="flex items-center gap-2 text-sm font-medium">
                  Panggil berikutnya <Kbd>Spasi</Kbd>
                </span>
              </CardFooter>
            </Card>
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-balance md:text-4xl">
                Petugas cukup menekan satu tombol.
              </h2>
              <p className="mt-4 max-w-md leading-relaxed text-muted-foreground">
                Panggil, panggil ulang, lewati, selesai. Konsol loket dirancang untuk dipakai sambil melayani, bahkan
                dari tablet di meja resepsionis.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="mx-auto max-w-2xl scroll-mt-20 px-4 py-24 md:px-6">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Tanya jawab</h2>
          <Accordion className="mt-8">
            {FAQ.map((item) => (
              <AccordionItem key={item.q} value={item.q}>
                <AccordionTrigger className="text-base">{item.q}</AccordionTrigger>
                <AccordionContent className="leading-relaxed text-muted-foreground">{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* Final CTA */}
        <section className="mx-auto max-w-6xl px-4 pb-24 md:px-6">
          <div className="flex flex-col items-start justify-between gap-6 rounded-2xl bg-primary px-8 py-12 text-primary-foreground md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Gratis selama masa pilot.</h2>
              <p className="mt-2 max-w-md opacity-85">Siapkan antrean pertama Anda dalam kurang dari sepuluh menit.</p>
            </div>
            <Link href="/daftar" className={buttonVariants({ size: "lg", variant: "secondary", className: "px-4" })}>
              Coba gratis
              <ArrowRightIcon data-icon="inline-end" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between md:px-6">
          <Logo className="text-foreground" />
          <p>Antrean virtual untuk usaha di Indonesia.</p>
          <nav aria-label="Tautan footer" className="flex gap-5">
            <Link href="/masuk" className="hover:text-foreground">Masuk</Link>
            <Link href="/display/margonda" className="hover:text-foreground">Contoh layar TV</Link>
          </nav>
        </div>
      </footer>
    </>
  )
}
