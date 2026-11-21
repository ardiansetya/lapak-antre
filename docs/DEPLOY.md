# Deploy gratis ke Vercel dan TiDB

Panduan ini memindahkan Lapak Antre ke Vercel Hobby dengan database TiDB Cloud Starter. Keduanya gratis. Vercel Hobby hanya boleh dipakai untuk proyek non-komersial, dan proyek portofolio memenuhi syarat itu.

## Siapkan database TiDB

1. Buat akun di https://tidbcloud.com, lalu buat cluster **Starter**. Pilih region Singapura kalau tersedia.
2. Buat database `lapak_antre`.
3. Salin connection string MySQL dari halaman **Connect**.
4. Tambahkan `?ssl=true` di akhir URL. TiDB Cloud mewajibkan TLS.
	```
	mysql://USER.root:PASSWORD@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/lapak_antre?ssl=true
	```
5. Jalankan migrasi dan seed dari komputer kamu dengan URL tersebut.
	```bash
	DATABASE_URL="mysql://...?ssl=true" npx prisma migrate deploy
	DATABASE_URL="mysql://...?ssl=true" npm run db:seed
	```
6. Jalankan `npm run check:race` dengan URL yang sama. Hasilnya harus `ok`, sebagai bukti bahwa penomoran tiket juga aman di TiDB.

## Deploy ke Vercel

1. Impor repo `ardiansetya/lapak-antre` di https://vercel.com/new.
2. Isi environment variable berikut di **Settings**, lalu **Environment Variables**.

	| Nama | Nilai |
	|---|---|
	| `DATABASE_URL` | URL TiDB dengan `?ssl=true` |
	| `NEXT_PUBLIC_SITE_URL` | URL produksi, misalnya `https://lapak-antre.vercel.app` |
	| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Kunci publik dari `npx web-push generate-vapid-keys` |
	| `VAPID_PRIVATE_KEY` | Kunci privat dari perintah yang sama |
	| `VAPID_SUBJECT` | `mailto:` diikuti email kamu |

3. Atur region function ke Singapura (`sin1`) di **Settings**, lalu **Functions**.
4. Klik **Deploy**. Perintah `postinstall` menjalankan `prisma generate` otomatis.

## Periksa hasil deploy

1. Buka `/demo` dan ambil nomor.
2. Buka `/masuk` dengan akun demo, lalu panggil nomor dari **Konsol loket**.
3. Pastikan halaman tiket berubah tanpa dimuat ulang.
4. Isi tautan demo di halaman portofolio dengan URL produksi.

## Batasan paket gratis

- Function Vercel Hobby berhenti setelah 300 detik. Stream SSE ditutup di 280 detik dan browser menyambung ulang sendiri.
- Setiap layar yang terbuka menjalankan satu query setiap 1,5 detik. Pemakaian portofolio jauh di bawah kuota TiDB Starter.
- Kalau proyek dipakai usaha sungguhan, pindah ke Vercel Pro atau VPS dengan Dokploy. Kodenya tidak perlu diubah.
