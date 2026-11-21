# Deploy gratis ke Vercel dan TiDB

Panduan ini memasang Lapak Antre di Vercel Hobby dengan database TiDB Cloud Starter. Keduanya gratis. Vercel Hobby hanya boleh dipakai untuk proyek non-komersial, dan proyek portofolio memenuhi syarat itu.

Setelah setup awal ini, deploy berjalan otomatis setiap ada push ke GitHub. Penjelasan pipeline-nya ada di [CI-CD.md](CI-CD.md).

## 1. Siapkan database TiDB

1. Buat akun di https://tidbcloud.com, lalu buat cluster **Starter**. Pilih region Singapura (`ap-southeast-1`) kalau tersedia, supaya dekat dengan function Vercel di `sin1`.
2. Buka **SQL Editor** di cluster itu, lalu buat dua database, satu untuk produksi dan satu untuk preview PR.
	```sql
	CREATE DATABASE lapak_antre;
	CREATE DATABASE lapak_antre_preview;
	```
3. Salin connection string MySQL dari halaman **Connect**, lalu tambahkan `?ssl=true` di akhir URL. TiDB Cloud mewajibkan TLS.
	```
	mysql://USER.root:PASSWORD@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/lapak_antre?ssl=true
	```

## 2. Hubungkan Vercel

Project `lapak-antre` di Vercel sudah dibuat dan tersambung ke repo GitHub. Kalau membuat ulang dari nol, jalankan `vercel link` lalu `vercel git connect`.

Isi environment variable di **Settings > Environment Variables**:

| Nama | Production | Preview |
|---|---|---|
| `DATABASE_URL` | URL TiDB ke `lapak_antre` | URL TiDB ke `lapak_antre_preview` |
| `NEXT_PUBLIC_SITE_URL` | `https://lapak-antre.vercel.app` | (kosongkan) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | sudah terisi | sudah terisi |
| `VAPID_PRIVATE_KEY` | sudah terisi | sudah terisi |
| `VAPID_SUBJECT` | sudah terisi | sudah terisi |

Kunci VAPID produksi dibuat baru dengan `web-push`, jadi berbeda dari kunci di `.env` lokal.

Region function sudah diatur ke Singapura lewat `"regions": ["sin1"]` di `vercel.json`.

## 3. Deploy pertama

1. Push ke `main`, atau klik **Redeploy** di dashboard Vercel.
2. Perintah build di `vercel.json` adalah `prisma migrate deploy && next build`. Tabel dibuat otomatis di database environment tersebut.
3. Isi data demo sekali saja dari laptop, memakai URL produksi:
	```bash
	DATABASE_URL="mysql://...lapak_antre?ssl=true" npm run db:seed
	DATABASE_URL="mysql://...lapak_antre?ssl=true" npm run check:race
	```
	`check:race` harus mencetak `ok`, sebagai bukti bahwa penomoran tiket juga aman di TiDB.

## 4. Periksa hasil deploy

1. Buka `/demo` dan ambil nomor.
2. Buka `/masuk` dengan akun demo, lalu panggil nomor dari **Konsol loket**.
3. Pastikan halaman tiket berubah tanpa dimuat ulang.
4. Isi tautan demo di halaman portofolio dengan URL produksi.

## Batasan paket gratis

- Function Vercel Hobby berhenti setelah 300 detik. Stream SSE ditutup di 280 detik dan browser menyambung ulang sendiri.
- Setiap layar yang terbuka menjalankan satu query setiap 1,5 detik. Pemakaian portofolio jauh di bawah kuota TiDB Starter.
- GitHub Actions gratis tanpa batas untuk repo publik.
- Kalau proyek dipakai usaha sungguhan, pindah ke Vercel Pro atau VPS dengan Dokploy. Kodenya tidak perlu diubah.
