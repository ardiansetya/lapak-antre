# Pelajaran dari bug selama pengerjaan

Setiap bug di dokumen ini benar-benar terjadi saat proyek dibangun. Setiap bagian menjelaskan gejalanya, cara menemukan penyebabnya, dan perbaikannya. Polanya sama di semua bagian. Bug direproduksi dulu, penyebab dibuktikan dengan data, baru kemudian kode diubah.

## Halaman berkedip karena cache Turbopack basi

**Gejala.** Halaman dengan form terus memuat ulang dan tidak bisa diklik. Log dev server bertambah ribuan baris per detik.

**Cara menemukan penyebabnya.**

1. Semua tab aplikasi diarahkan ke `about:blank`, dan log langsung berhenti. Artinya pemicunya ada di browser.
2. Landing page stabil, sedangkan halaman form terus reload.
3. Sebuah skrip disisipkan sebelum halaman dimuat. Skrip itu mencatat pesan WebSocket HMR ke `sessionStorage`. Catatannya menunjukkan server terus mengirim `type: "restart"` untuk chunk entry bawaan Next.
4. Folder `.next` dihapus dan dev server dijalankan ulang. Reload berhenti total.

**Penyebab.** Cache dev Turbopack di `.next` menjadi basi setelah `npm install` atau `prisma generate` dijalankan di antara dua sesi dev.

**Perbaikan.** Jalankan `npm run dev:clean` setelah mengubah dependensi.

**Pelajaran.** Dugaan pertama saya adalah service worker, karena kebetulan sedang aktif. Dugaan itu salah. Loop tetap terjadi tanpa service worker. Uji setiap dugaan dengan percobaan yang bisa membuktikannya salah.

## Server Action gagal setelah skema berubah

**Gejala.** Mengambil nomor menghasilkan error 500 dengan `PrismaClientValidationError`. Form tidak menampilkan apa pun.

**Penyebab.** `lib/db.ts` menyimpan `PrismaClient` di `globalThis` supaya tidak dibuat ulang setiap hot reload. Setelah kolom baru ditambahkan dan client di-generate ulang, dev server masih memakai client lama yang belum mengenal kolom itu.

**Perbaikan.** Jalankan ulang dev server setelah `prisma generate`. Form sekarang juga menampilkan pesan lewat `orServerError()`, sehingga error 500 tidak lagi tersembunyi.

## Isian form hilang setelah validasi gagal

**Gejala.** Pengguna salah mengisi satu isian. Setelah error muncul, semua isian lain ikut kosong.

**Penyebab.** Form yang memakai `<form action={...}>` di React 19 otomatis di-reset setiap kali action selesai, termasuk saat action mengembalikan error.

**Perbaikan.** Form sekarang memakai TanStack Form. Nilainya ada di state form dan tidak tersentuh oleh reset itu.

## Dialog terlihat tidak tertutup saat diuji otomatis

**Gejala.** Setelah layanan baru tersimpan, elemen dialog masih ada di halaman.

**Penyebab.** Ini bukan bug aplikasi. Tab yang dipakai alat uji berjalan di latar belakang. Browser menjeda animasi CSS di tab yang tidak terlihat, jadi event akhir animasi tutup tidak pernah terpicu. Dialog sebenarnya sudah ditandai `data-closed`.

**Pelajaran.** Sebelum mengubah kode, cek dulu apakah state yang terlihat memang salah. Begitu tab diaktifkan, dialog langsung hilang.

## Service worker menyajikan kode basi di mode dev

**Gejala.** Setelah halaman tiket pernah dibuka, halaman lain di `localhost:3100` menjalankan kode lama.

**Penyebab.** Service worker menyimpan file di `/_next/static/` ke cache. Di build produksi, nama file berisi hash isinya, jadi file baru selalu punya nama baru. Di mode dev, nama file tetap sama walaupun isinya berubah.

**Perbaikan.** Di mode dev, service worker didaftarkan sebagai `/sw.js?dev=1` dan tidak menyimpan cache sama sekali. Unregister service worker baru berlaku setelah semua tab yang dikendalikannya ditutup.

## Script PowerShell merusak empat file

**Gejala.** Setelah penggantian teks otomatis, empat file berisi teks rusak. Contohnya, `toast` berubah menjadi `towst` dan `react` menjadi `rewct`.

**Penyebab.** Di PowerShell, `@(@('a', 'b'))` menjadi array datar. Kode mengira setiap item adalah pasangan teks, padahal setiap item adalah satu string. `$pair[0]` lalu berisi satu karakter, sehingga penggantian terjadi per huruf.

**Perbaikan.** File dipulihkan dengan `git checkout`. Perubahannya diterapkan ulang satu per satu.

**Pelajaran.** Commit kecil dan sering membuat kesalahan seperti ini murah untuk diperbaiki.

## Migrasi lolos di Windows tapi gagal di Linux

**Gejala.** Run CI pertama gagal di langkah **Apply migrations** dengan `Table 'lapak_antre.ticket' doesn't exist`. Di laptop semua migrasi berjalan normal.

**Penyebab.** Migrasi `init` membuat tabel `Ticket`. Dua migrasi berikutnya ditulis Prisma sebagai ``ALTER TABLE `ticket` ``, dengan huruf kecil. MySQL di Windows memakai `lower_case_table_names=1`, sehingga nama tabel disimpan dan dibandingkan dalam huruf kecil. Prisma membaca nama itu dari database lalu menulisnya apa adanya. MySQL di Linux dan TiDB membedakan huruf besar dan kecil, jadi `ticket` dan `Ticket` adalah dua tabel berbeda.

**Perbaikan.** Kedua file migrasi diubah menjadi `Ticket`. Hal ini aman karena migrasi itu belum pernah dijalankan di database produksi. Checksum di tabel `_prisma_migrations` lokal ikut diperbarui. Nilainya adalah SHA-256 dari isi `migration.sql`.

**Pelajaran.** Inilah gunanya CI. Pemeriksaan berjalan di sistem operasi yang sama dengan produksi, bukan di laptop. Setiap kali membuat migrasi di Windows, periksa nama tabel di file SQL-nya sebelum commit. CI akan menangkapnya kalau terlewat.
## Prisma CLI tersambung ke TiDB tanpa TLS

**Gejala.** `prisma db execute` ke TiDB gagal dengan `Connections using insecure transport are prohibited`. Padahal URL sudah berakhiran `?ssl=true`.

**Penyebab.** `?ssl=true` hanya dibaca oleh adapter kita di `lib/db-adapter.ts`. Prisma CLI (migrate, db execute) membaca parameter TLS lain, yaitu `sslaccept`. CLI mengabaikan `ssl=true` lalu tersambung tanpa TLS.

**Perbaikan.** Semua URL TiDB memakai `?sslaccept=strict`. Adapter sekarang menyalakan TLS kalau parameter itu ada. Satu parameter dipahami oleh dua pembaca.

**Pelajaran.** Kalau sebuah nilai dibaca oleh lebih dari satu program, uji setiap pembacanya. Aplikasi yang berjalan belum membuktikan migrasi juga berjalan.