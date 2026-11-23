# Lapak Antre

[![CI](https://github.com/ardiansetya/lapak-antre/actions/workflows/ci.yml/badge.svg)](https://github.com/ardiansetya/lapak-antre/actions/workflows/ci.yml)

**Demo live: https://lapak-antre.vercel.app** (login demo `demo@lapakantre.test` / `demo12345`)

Antrean virtual untuk klinik dan UMKM. Pelanggan memindai QR di lokasi, mendapat nomor di HP, lalu dikabari saat gilirannya dekat. Petugas memanggil nomor dari konsol loket, dan layar TV ruang tunggu ikut berubah lengkap dengan suara panggilan.

Proyek ini adalah proyek portofolio. Semua hosting yang dipakai gratis.

- Kebutuhan produk: [docs/PRD.md](docs/PRD.md)
- Cara kerja dan alasan desain: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- Pelajaran dari bug selama pengerjaan: [docs/LESSONS.md](docs/LESSONS.md)
- Langkah deploy gratis: [docs/DEPLOY.md](docs/DEPLOY.md)
- Pipeline CI/CD dan alur kerja PR: [docs/CI-CD.md](docs/CI-CD.md)

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
| `npm run check:smoke` | Buka semua halaman lewat HTTP. Butuh `npm run dev` yang sedang berjalan, atau `BASE_URL` ke deployment lain |
| `npm run check:isolation` | Pastikan tenant lain tidak bisa melihat data klinik demo. Butuh `npm run dev`, atau `BASE_URL` |

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
| `docs/` | PRD, arsitektur, pelajaran, deploy, dan CI/CD |
| `.github/workflows/ci.yml` | Pemeriksaan otomatis di GitHub Actions |
| `vercel.json` | Region dan perintah build Vercel (migrasi lalu build) |

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

## Status fitur

Kode di kurung adalah ID kebutuhan di [docs/PRD.md](docs/PRD.md). P0 artinya wajib untuk MVP, P1 untuk rilis kedua, dan P2 untuk nanti.

### Sudah selesai

**Pelanggan**
- [x] Ambil nomor tanpa login lewat QR yang kodenya berganti setiap hari (Q-1, A-1)
- [x] Nomor `{prefix}-{urut}` yang reset setiap hari dan tidak pernah dobel, juga teruji di TiDB (Q-2)
- [x] Satu tiket aktif per HP per layanan, dan batas 20 tiket per IP per 10 menit (A-2)
- [x] Batalkan tiket sendiri (Q-7)
- [x] Halaman tiket ikut berubah tanpa dimuat ulang, dan tersambung ulang otomatis kalau koneksi putus (R-1, R-2)
- [x] Perkiraan waktu tunggu sebagai rentang, misalnya "15–25 menit" (E-1, E-2)
- [x] Web Push saat giliran dekat dan saat dipanggil, masing-masing sekali per tiket (N-1, N-2)
- [x] Bisa diinstal sebagai PWA (O-1)

**Petugas dan owner**
- [x] Daftar akun yang langsung membuat usaha, cabang, layanan, dan loket (T-1, T-4)
- [x] Data antar-usaha terisolasi, dibuktikan oleh `check:isolation` (T-1)
- [x] Konsol loket: panggil, panggil ulang, lewati, kembalikan ke antrean, dan selesai (Q-3, Q-4)
- [x] Satu loket bisa melayani beberapa layanan (Q-5)
- [x] Buka atau tutup layanan secara manual, dan kuota harian (Q-6, sebagian)
- [x] Tiket manual untuk pelanggan tanpa HP (Q-8)
- [x] Layar TV ruang tunggu dengan suara panggilan bahasa Indonesia (R-3)
- [x] Laporan harian dan akurasi perkiraan waktu tunggu (MAE) per layanan (L-1, E-4)
- [x] Poster QR siap cetak

**Infrastruktur**
- [x] CI di GitHub Actions: lint, typecheck, unit test, migrasi, uji balapan nomor, build, smoke test, dan uji isolasi
- [x] CD ke Vercel. Setiap PR mendapat Preview, dan setiap merge ke `main` langsung ke produksi
- [x] Deploy gratis di Vercel Hobby dan TiDB Cloud Starter, region Singapura

### Belum selesai

| ID | Fitur | Prioritas | Catatan |
|---|---|---|---|
| T-3 | Owner mengundang petugas lewat email atau link | P0 | Saat ini hanya owner yang bisa login |
| T-2 | Peran `SUPERADMIN` global | P0 | Baru ada `OWNER` dan `STAFF` |
| Q-6 | Layanan tertutup otomatis di luar jam operasional | P0 | Buka/tutup manual dan kuota harian sudah jalan |
| O-4 | Konsol loket menolak aksi dengan jelas saat offline | P0 | Peringatan offline baru ada di halaman tiket pelanggan |
| O-2, O-3 | Halaman tiket tetap tampil saat offline, lalu sinkron ulang | P0 | Sudah dibuat, tapi belum diuji di build produksi |
| N-3 | Notifikasi WhatsApp | P1 | Butuh akun Meta Business |
| N-4 | Log pengiriman notifikasi | P1 | |
| E-3 | Model regresi untuk perkiraan waktu tunggu | P1 | Saat ini memakai rata-rata lama layanan |
| L-2 | Heatmap jam sibuk per hari | P1 | |
| T-5 | Logo dan warna per usaha | P1 | |
| L-3 | Ekspor CSV | P2 | |
| Q-9 | Tiket prioritas untuk lansia dan ibu hamil | P2 | |
| A-3 | Geofence radius cabang | P2 | |
| — | Pemilih cabang di dashboard | — | Saat ini petugas bekerja di cabang pertama usaha |

Fitur yang belum selesai cocok dijadikan latihan. Kerjakan lewat alur PR di [docs/CI-CD.md](docs/CI-CD.md).
