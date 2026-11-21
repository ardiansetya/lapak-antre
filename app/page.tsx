import Link from "next/link"
import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  BellRingIcon,
  CarIcon,
  ChartLineIcon,
  FootprintsIcon,
  LandmarkIcon,
  PillIcon,
  QrCodeIcon,
  ScissorsIcon,
  ShirtIcon,
  StethoscopeIcon,
  WifiOffIcon,
} from "lucide-react"

import { Logo } from "@/components/brand/logo"
import { DemoBoard } from "@/components/landing/demo-board"
import { SiteHeader } from "@/components/landing/site-header"
import { FlapCode } from "@/components/queue/flap-code"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Kbd } from "@/components/ui/kbd"
import { SITE } from "@/lib/site"

const AUDIENCES = [
  { icon: StethoscopeIcon, label: "Klinik" },
  { icon: ScissorsIcon, label: "Barbershop" },
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
    q: "Kenapa QR-nya berganti setiap hari?",
    a: "Supaya nomor tidak bisa diambil dari rumah memakai foto poster kemarin. Antrean hanya berisi orang yang benar-benar datang.",
  },
  {
    q: "Seberapa akurat perkiraan waktu tunggunya?",
    a: "Perkiraan dihitung dari lama layanan hari itu dan ditampilkan sebagai rentang. Dashboard menunjukkan seberapa meleset perkiraannya setiap hari.",
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
        {/* Hero: headline left, live departure board right */}
        <section className="mx-auto grid max-w-6xl items-center gap-14 px-4 pt-14 pb-20 md:px-6 md:pt-20 lg:grid-cols-[1.1fr_1fr]">
          <div className="flex flex-col items-start gap-7 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-700">
            <h1 className="text-5xl leading-[0.95] font-extrabold tracking-[-0.04em] text-balance md:text-7xl">
              Antre tanpa{" "}
              <span className="inline-block -rotate-1 rounded-md bg-primary px-2 pb-1 text-primary-foreground">duduk</span>{" "}
              menunggu.
            </h1>
            <p className="max-w-md text-lg leading-relaxed text-muted-foreground">
              Pelanggan scan QR, dapat nomor di HP, lalu dikabari saat gilirannya dekat. Ruang tunggu Anda jadi lega.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/demo" className={cn(buttonVariants({ size: "lg" }), "h-11 px-5 text-base")}>
                Coba ambil nomor
                <ArrowRightIcon data-icon="inline-end" />
              </Link>
              <Link href="/masuk" className={cn(buttonVariants({ size: "lg", variant: "outline" }), "h-11 px-5 text-base")}>
                Masuk sebagai petugas
              </Link>
            </div>
          </div>
          <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-4 motion-safe:duration-700">
            <DemoBoard />
          </div>
        </section>

        {/* Audience marquee: the only marquee on the page */}
        <section aria-label="Cocok untuk" className="overflow-hidden border-y bg-board py-4 text-white/80">
          <div className="animate-marquee flex w-max gap-12 font-mono text-sm tracking-widest uppercase">
            {[...AUDIENCES, ...AUDIENCES].map(({ icon: Icon, label }, i) => (
              <span key={i} aria-hidden={i >= AUDIENCES.length} className="flex items-center gap-3">
                <Icon className="size-4 text-board-foreground" strokeWidth={1.75} />
                {label}
              </span>
            ))}
          </div>
        </section>

        {/* How it works: sticky headline + list */}
        <section id="cara-kerja" className="mx-auto grid max-w-6xl scroll-mt-20 gap-12 px-4 py-24 md:grid-cols-[1fr_1.3fr] md:px-6">
          <div className="md:sticky md:top-28 md:self-start">
            <h2 className="text-4xl leading-none font-extrabold tracking-[-0.03em] text-balance md:text-5xl">
              Antrean pindah dari kursi ke saku pelanggan.
            </h2>
            <p className="mt-5 max-w-sm leading-relaxed text-muted-foreground">
              Tidak ada perangkat yang perlu dibeli. Cetak QR, tempel di pintu, dan mulai melayani.
            </p>
          </div>
          <ol className="flex flex-col">
            {STEPS.map(({ icon: Icon, title, body }) => (
              <li key={title} className="group grid grid-cols-[auto_1fr] gap-6 border-t py-8 first:border-t-0 first:pt-0">
                <span className="flex size-12 items-center justify-center rounded-md bg-board text-board-foreground transition-transform group-hover:-rotate-6">
                  <Icon className="size-5" strokeWidth={1.75} />
                </span>
                <div>
                  <h3 className="text-2xl font-bold tracking-tight">{title}</h3>
                  <p className="mt-2 max-w-prose leading-relaxed text-muted-foreground">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Features: bento, five cells */}
        <section id="fitur" className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-24 md:px-6">
          <h2 className="max-w-2xl text-4xl leading-none font-extrabold tracking-[-0.03em] text-balance md:text-5xl">
            Dibuat untuk jam sibuk, bukan untuk presentasi.
          </h2>
          <div className="mt-12 grid gap-3 md:grid-cols-6">
            <div className="flex flex-col justify-between gap-10 rounded-lg bg-primary p-7 text-primary-foreground md:col-span-4">
              <div>
                <h3 className="text-2xl font-bold tracking-tight">Satu klik, semua layar ikut berubah</h3>
                <p className="mt-2 max-w-md leading-relaxed opacity-80">
                  Saat petugas memanggil nomor, HP pelanggan, dashboard, dan TV ruang tunggu diperbarui dalam hitungan detik.
                </p>
              </div>
              <div className="flex flex-wrap gap-4">
                <FlapCode code="A-012" />
                <FlapCode code="C-020" />
              </div>
            </div>

            <div className="flex flex-col gap-4 rounded-lg bg-secondary p-7 text-secondary-foreground md:col-span-2">
              <BellRingIcon className="size-6" strokeWidth={1.75} />
              <h3 className="text-2xl font-bold tracking-tight">Dikabari sebelum terlambat</h3>
              <p className="leading-relaxed opacity-80">
                Pemilik menentukan kapan pelanggan dikabari, misalnya saat tinggal tiga orang.
              </p>
            </div>

            <div className="flex flex-col gap-4 rounded-lg border bg-card p-7 md:col-span-2">
              <ChartLineIcon className="size-6" strokeWidth={1.75} />
              <h3 className="text-2xl font-bold tracking-tight">Perkiraan yang jujur</h3>
              <p className="leading-relaxed text-muted-foreground">
                Ditampilkan sebagai rentang dan dihitung dari lama layanan hari itu.
              </p>
              <p className="mt-auto font-mono text-3xl font-semibold tracking-tight">15-25 mnt</p>
            </div>

            <div className="flex flex-col gap-4 rounded-lg border bg-[repeating-linear-gradient(135deg,var(--color-border)_0_1px,transparent_1px_10px)] p-7 md:col-span-2">
              <WifiOffIcon className="size-6" strokeWidth={1.75} />
              <h3 className="text-2xl font-bold tracking-tight">Sinyal hilang, tiket tetap ada</h3>
              <p className="leading-relaxed text-muted-foreground">
                Tiket tetap terbuka saat offline dan menyesuaikan diri begitu sinyal kembali.
              </p>
            </div>

            <div className="flex flex-col gap-4 rounded-lg border bg-card p-7 md:col-span-2">
              <QrCodeIcon className="size-6" strokeWidth={1.75} />
              <h3 className="text-2xl font-bold tracking-tight">QR yang berganti tiap hari</h3>
              <p className="leading-relaxed text-muted-foreground">
                Foto poster kemarin tidak bisa dipakai. Antrean hanya berisi orang yang benar-benar datang.
              </p>
            </div>
          </div>
        </section>

        {/* For staff */}
        <section className="border-y bg-muted/50">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-24 md:grid-cols-2 md:px-6">
            <div className="mx-auto flex w-full max-w-sm flex-col gap-5 rounded-lg border bg-card p-6 shadow-sm">
              <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">Ruang Periksa 1</p>
              <FlapCode code="A-014" size="lg" />
              <p className="text-sm text-muted-foreground">Agus, ambil nomor 09.16</p>
              <div className="flex items-center justify-between border-t pt-4 text-sm">
                <span className="text-muted-foreground">6 orang menunggu</span>
                <span className="flex items-center gap-2 font-medium">
                  Panggil berikutnya <Kbd>Spasi</Kbd>
                </span>
              </div>
            </div>
            <div>
              <h2 className="text-4xl leading-none font-extrabold tracking-[-0.03em] text-balance md:text-5xl">
                Petugas cukup menekan satu tombol.
              </h2>
              <p className="mt-5 max-w-md leading-relaxed text-muted-foreground">
                Panggil, panggil ulang, lewati, selesai. Konsol loket dirancang untuk dipakai sambil melayani, bahkan dari
                tablet di meja resepsionis.
              </p>
              <Link
                href="/masuk"
                className={cn(buttonVariants({ variant: "link" }), "mt-4 px-0 text-base text-foreground underline decoration-primary decoration-2 underline-offset-4")}
              >
                Coba dashboard demo
                <ArrowUpRightIcon data-icon="inline-end" />
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="mx-auto max-w-2xl scroll-mt-20 px-4 py-24 md:px-6">
          <h2 className="text-4xl font-extrabold tracking-[-0.03em] md:text-5xl">Tanya jawab</h2>
          <Accordion className="mt-8">
            {FAQ.map((item) => (
              <AccordionItem key={item.q} value={item.q}>
                <AccordionTrigger className="py-4 text-base">{item.q}</AccordionTrigger>
                <AccordionContent className="leading-relaxed text-muted-foreground">{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* Final CTA */}
        <section className="mx-auto max-w-6xl px-4 pb-24 md:px-6">
          <div className="flex flex-col items-start justify-between gap-8 rounded-lg bg-board px-8 py-14 text-white md:flex-row md:items-end">
            <h2 className="max-w-xl text-4xl leading-none font-extrabold tracking-[-0.03em] md:text-5xl">
              Antrean pertama Anda, <span className="text-board-foreground">siap dalam sepuluh menit.</span>
            </h2>
            <Link href="/daftar" className={cn(buttonVariants({ size: "lg" }), "h-11 px-5 text-base")}>
              Coba gratis
              <ArrowRightIcon data-icon="inline-end" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between md:px-6">
          <Logo className="text-foreground" />
          <p>Proyek portofolio. Antrean virtual untuk usaha di Indonesia.</p>
          <nav aria-label="Tautan footer" className="flex gap-5">
            <Link href="/tiket/demo" className="hover:text-foreground">Contoh tiket</Link>
            <Link href="/klinik-kasih-ibu/margonda/display" className="hover:text-foreground">Contoh layar TV</Link>
          </nav>
        </div>
      </footer>
    </>
  )
}
