# Lapak Antre

Antrean virtual untuk klinik dan UMKM. Pelanggan memindai QR di lokasi, mendapat nomor di HP, lalu dikabari saat gilirannya dekat. Petugas memanggil nomor dari konsol loket, dan layar TV ruang tunggu ikut berubah lengkap dengan suara panggilan.

Proyek ini adalah proyek portofolio. Semua hosting yang dipakai gratis.

- Kebutuhan produk: [docs/PRD.md](docs/PRD.md)
- Cara kerja dan alasan desain: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- Pelajaran dari bug selama pengerjaan: [docs/LESSONS.md](docs/LESSONS.md)
- Langkah deploy gratis: [docs/DEPLOY.md](docs/DEPLOY.md)

## Stack

| Bagian | Pilihan |
|---|---|
| Framework | Next.js 16 (App Router, Server Components, Server Actions), React 19, TypeScript |
| Database | MySQL 8 di lokal, TiDB Cloud Starter untuk produksi |
| ORM | Prisma 7 dengan `@prisma/adapter-mariadb` |
| UI | Tailwind CSS v4, shadcn/ui (preset `base-nova`, primitif Base UI) |
| Form | TanStack Form |
| Realtime | Server-Sent Events |
| Notifikasi | Web Push (`web-push`) lewat service worker |

## Menjalankan di komputer sendiri

Siapkan dulu Node.js 22 atau lebih baru dan MySQL 8 yang sedang berjalan.

1. Pasang dependensi. Perintah ini juga menjalankan `prisma generate`.
	```bash
	npm install
	```
2. Buat database kosong di MySQL.
	```sql
	CREATE DATABASE lapak_antre;
	```
3. Salin `.env.example` menjadi `.env`, lalu isi `DATABASE_URL` dengan user dan password MySQL kamu.
4. Buat pasangan kunci Web Push, lalu tempel hasilnya ke `NEXT_PUBLIC_VAPID_PUBLIC_KEY` dan `VAPID_PRIVATE_KEY` di `.env`. Lewati langkah ini kalau tidak butuh push.
	```bash
	npx web-push generate-vapid-keys
	```
5. Buat tabel dan isi data demo.
	```bash
	npm run db:migrate
	npm run db:seed
	```
6. Jalankan server pengembangan, lalu buka http://localhost:3100.
	```bash
	npm run dev
	```

Data demo berisi satu klinik dengan riwayat 14 hari dan antrean yang sedang berjalan.

| Yang dicoba | Tempat |
|---|---|
| Ambil nomor seperti pelanggan | http://localhost:3100/demo |
| Tiket contoh | http://localhost:3100/tiket/demo |
| Layar TV ruang tunggu | http://localhost:3100/klinik-kasih-ibu/margonda/display |
| Dashboard petugas | http://localhost:3100/masuk dengan `demo@lapakantre.test` dan kata sandi `demo12345` |

Kalau halaman terus berkedip atau tidak bisa diklik setelah `npm install` atau `prisma generate`, cache Turbopack sudah basi. Jalankan `npm run dev:clean`. Penjelasannya ada di [docs/LESSONS.md](docs/LESSONS.md).

## Perintah

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Server pengembangan di port 3100 |
| `npm run dev:clean` | Hapus `.next`, lalu jalankan server pengembangan |
| `npm run build` | Build produksi |
| `npm run typecheck` | Cek tipe dengan `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Unit test `lib/*.test.ts` dengan `node:test` |
| `npm run db:migrate` | `prisma migrate dev`. Setelah mengubah skema, jalankan juga `npx prisma generate` |
| `npm run db:seed` | Isi ulang data demo. Hanya klinik demo dan akun demo yang dihapus |
| `npm run check:race` | Uji 40 pengambilan nomor bersamaan. Hasilnya harus 1 sampai 40 tanpa duplikat |
| `npm run check:smoke` | Buka semua halaman lewat HTTP. Butuh `npm run dev` yang sedang berjalan |
| `npm run check:isolation` | Pastikan tenant lain tidak bisa melihat data klinik demo. Butuh `npm run dev` |

## Struktur folder

| Folder | Isi |
|---|---|
| `app/` | Halaman dan route. `[tenant]/[branch]` untuk pelanggan, `tiket/[token]` untuk tiket, `dashboard/` untuk petugas, `api/branches/[branchId]/events` untuk SSE |
| `components/queue/` | Komponen yang dilihat pelanggan: form ambil nomor, tiket live, layar TV, ubin `FlapCode` |
| `components/dashboard/` | Komponen petugas: konsol loket, tiket manual, layanan, laporan, poster QR |
| `components/ui/` | Komponen shadcn/ui |
| `lib/` | Logika server dan logika murni. Lihat tabel di bawah |
| `prisma/` | Skema, migrasi, dan seed |
| `public/sw.js` | Service worker untuk offline dan push |
| `scripts/` | Skrip uji yang bisa dijalankan ulang |
| `docs/` | PRD, arsitektur, pelajaran, dan langkah deploy |

| File di `lib/` | Isi |
|---|---|
| `actions.ts` | Semua Server Action: ambil nomor, konsol loket, layanan, login, daftar |
| `queries.ts` | Semua pembacaan data untuk halaman |
| `auth.ts`, `crypto.ts` | Sesi login, hash kata sandi, dan kode QR harian |
| `ticket-number.ts` | Penomoran tiket yang aman dari request bersamaan |
| `push.ts` | Pengiriman Web Push |
| `validation.ts`, `form.ts` | Aturan validasi bersama dan helper TanStack Form |
| `queue.ts` | Rumus perkiraan waktu tunggu |
| `db.ts`, `db-adapter.ts` | Koneksi Prisma ke MySQL atau TiDB |

## Yang belum dibangun

Bagian ini cocok dijadikan latihan lanjutan.

- Notifikasi WhatsApp lewat WhatsApp Cloud API. Butuh akun Meta Business.
- Model regresi untuk perkiraan waktu tunggu (PRD bagian 8 tahap 2). Saat ini memakai rata-rata lama layanan.
- Heatmap jam sibuk per hari, ekspor CSV, dan tiket prioritas.
- Pemilih cabang di dashboard. Saat ini petugas bekerja di cabang pertama tenant.
- Deploy ke Vercel dan TiDB. Langkahnya ada di [docs/DEPLOY.md](docs/DEPLOY.md).
