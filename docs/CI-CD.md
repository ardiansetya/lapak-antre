# CI/CD di Lapak Antre

Dokumen ini menjelaskan pipeline yang dipakai proyek ini, alasan tiap langkahnya, dan cara bekerja sehari-hari dengannya. Kamu bisa membacanya sambil membuka `.github/workflows/ci.yml` dan `vercel.json`.

## Dua istilah dasar

**CI (Continuous Integration)** artinya setiap perubahan kode diperiksa otomatis oleh mesin sebelum digabung. Mesin itu tidak percaya "di laptop saya jalan". Ia menyiapkan komputer bersih, memasang dependensi dari nol, lalu menjalankan semua pemeriksaan.

**CD (Continuous Deployment)** artinya kode yang sudah lolos langsung terpasang ke server tanpa langkah manual. Di proyek ini, setiap commit di `main` otomatis menjadi versi produksi.

## Gambaran pipeline

```
 kamu push / buka PR
        │
        ├──► GitHub Actions (CI)            .github/workflows/ci.yml
        │      lint → typecheck → unit test
        │      → migrasi + seed MySQL sementara → uji balapan nomor tiket
        │      → build → nyalakan server → smoke test → uji isolasi tenant
        │
        └──► Vercel (CD)                    vercel.json
               PR      → Preview deployment (URL unik per PR, database preview)
               main    → Production deployment (database produksi)
               build   = prisma migrate deploy && next build
```

GitHub Actions dan Vercel berjalan bersamaan. Keduanya memberi tanda centang di PR. Kalau salah satu merah, jangan merge.

## Bagian CI: `.github/workflows/ci.yml`

| Bagian | Fungsi | Kenapa perlu |
|---|---|---|
| `on: push (main)` dan `pull_request` | Kapan workflow jalan | PR diperiksa sebelum merge, dan `main` diperiksa lagi setelah merge |
| `concurrency` | Push baru membatalkan run lama di branch yang sama | Hemat menit gratis GitHub Actions |
| `services: mysql` | MySQL 8 sementara, hanya hidup selama run | Pemeriksaan butuh database sungguhan. Tidak ada data asli yang tersentuh |
| `npm ci` | Pasang dependensi persis sesuai `package-lock.json` | `npm install` bisa diam-diam menaikkan versi. `npm ci` tidak |
| `cache: npm` | Simpan cache unduhan npm | Run berikutnya lebih cepat |
| `lint`, `typecheck`, `npm test` | Pemeriksaan cepat tanpa database | Gagal lebih awal, sebelum langkah yang mahal |
| `prisma migrate deploy` | Terapkan semua migrasi ke database kosong | Membuktikan migrasi bisa dijalankan dari nol, sama seperti di produksi |
| `check:race` | 40 nomor tiket diambil bersamaan | Bug balapan tidak muncul di unit test biasa |
| `build` lalu `next start` | Jalankan build produksi | Ada error yang hanya muncul di build produksi |
| `check:smoke`, `check:isolation` | Buka semua halaman lewat HTTP | Memastikan halaman benar-benar tampil dan data antar-klinik tidak bocor |

Urutannya sengaja dari yang paling murah ke yang paling mahal. Kalau lint gagal dalam 30 detik, kamu tidak perlu menunggu build 2 menit.

### Membaca CI yang gagal

1. Buka tab **Actions** di GitHub, atau klik tanda silang merah di PR.
2. Klik langkah yang merah. Baca beberapa baris terakhir log, karena pesan error-nya biasanya di sana.
3. Jalankan perintah yang sama di laptop, misalnya `npm run typecheck`. Semua langkah CI adalah script di `package.json`, jadi bisa diulang secara lokal.
4. Perbaiki, commit, lalu push. CI jalan lagi otomatis.

Dari terminal juga bisa:

```bash
gh run list                 # daftar run terbaru
gh run watch                # pantau run yang sedang jalan
gh run view --log-failed    # tampilkan log langkah yang gagal saja
```

## Bagian CD: Vercel

Vercel tersambung ke repo GitHub lewat **Git integration**, jadi tidak ada file workflow deploy. Setiap push ke GitHub memicu deploy di Vercel.

| Kejadian | Hasil |
|---|---|
| Push ke branch selain `main` atau buka PR | **Preview deployment** dengan URL unik. Vercel menulis URL-nya di PR |
| Merge atau push ke `main` | **Production deployment** di domain utama |

### Migrasi database ikut saat build

`vercel.json` mengganti perintah build menjadi:

```
prisma migrate deploy && next build
```

`prisma migrate deploy` hanya menerapkan migrasi yang belum pernah dijalankan, jadi aman dijalankan berulang kali. Kalau migrasi gagal, build gagal dan Vercel tetap menyajikan versi lama. Pengguna tidak akan melihat kode baru yang berjalan di atas skema lama.

Production dan Preview memakai **database berbeda** (`lapak_antre` dan `lapak_antre_preview`). Nilai `DATABASE_URL` diatur terpisah per environment di Vercel. Tanpa pemisahan ini, PR yang berisi migrasi akan mengubah tabel produksi sebelum PR itu disetujui.

### Aturan menulis migrasi yang aman

Selama deploy berjalan, kode lama dan skema baru sempat hidup bersamaan. Jadi setiap migrasi harus tetap cocok dengan kode versi sebelumnya:

- **Menambah** kolom yang boleh kosong (`String?`) atau punya nilai default selalu aman.
- **Mengganti nama atau menghapus** kolom dibagi dua deploy. Deploy pertama menambah kolom baru dan kode menulis ke keduanya. Deploy kedua menghapus kolom lama setelah tidak ada kode yang memakainya. Pola ini disebut *expand and contract*.

### Rollback

Kalau versi produksi bermasalah, buka **Deployments** di dashboard Vercel, pilih deploy sebelumnya yang sehat, lalu klik **Instant Rollback**. Perubahan database tidak ikut mundur. Itu sebabnya aturan migrasi di atas penting.

## Alur kerja sehari-hari

```bash
git switch -c fitur/ekspor-csv      # 1. buat branch
# ... ubah kode ...
git commit -am "feat: ekspor laporan ke CSV"
git push -u origin fitur/ekspor-csv # 2. push memicu CI dan Preview
gh pr create --fill                 # 3. buka PR
gh pr checks --watch                # 4. tunggu semua centang hijau
# 5. buka URL Preview dari komentar Vercel, coba fiturnya
gh pr merge --squash --delete-branch # 6. merge memicu deploy produksi
```

Branch `main` dilindungi: PR hanya bisa di-merge kalau job CI `check` lolos. Kamu sebagai admin masih bisa push langsung ke `main`, tapi dengan begitu pemeriksaan dilewati sebelum deploy.

## Rahasia (secrets)

- Nilai rahasia seperti `DATABASE_URL` dan `VAPID_PRIVATE_KEY` hanya disimpan di **Vercel > Settings > Environment Variables**, tidak pernah di repo.
- CI tidak butuh rahasia apa pun. Database-nya sementara dan password-nya sengaja ditulis terbuka (`root`), karena database itu hilang begitu run selesai.
- Kunci VAPID produksi berbeda dari kunci di `.env` lokal. Langganan notifikasi dari laptop tidak bisa dipakai di produksi, begitu juga sebaliknya.

## Latihan

1. Buat branch, sengaja tulis error tipe (misalnya `const x: number = "a"`), lalu push. Amati langkah **Typecheck** gagal.
2. Ubah teks di halaman depan, buka PR, lalu buka URL Preview dari Vercel.
3. Tambahkan kolom `note String?` di model `Ticket`, jalankan `npm run db:migrate -- --name ticket_note`, lalu buka PR. Lihat migrasi diterapkan di log build Preview.
4. Setelah merge, coba **Instant Rollback** ke deploy sebelumnya di Vercel, lalu promosikan lagi deploy terbaru.
