# PRD — Lapak Antre

**Sistem antrean virtual untuk UMKM & klinik**

| | |
|---|---|
| Status | Draft v1 |
| Tanggal | 19 November 2026 |
| Pemilik | Ardian |
| Stack | Next.js (App Router) + TypeScript, Prisma, MySQL |

---

## 1. Ringkasan

Pelanggan scan QR di lokasi, langsung dapat nomor antre di HP (tanpa install aplikasi, tanpa login), bisa pergi dulu, lalu dapat notifikasi saat gilirannya dekat. Pemilik usaha mengelola antrean dari dashboard sederhana. Estimasi waktu tunggu dihitung dari data historis tiap tempat usaha dan makin akurat seiring waktu.

Satu deployment melayani banyak tempat usaha (multi-tenant).

## 2. Masalah

- **Pelanggan** di klinik, bengkel, barbershop, laundry, dan layanan publik kecil menunggu berjam-jam di lokasi tanpa tahu kapan gilirannya. Kalau ditinggal pergi, mereka takut terlewat.
- **Pemilik usaha** masih memakai kertas nomor atau teriak nama. Ruang tunggu penuh, pelanggan yang tidak sabar pergi, dan mereka tidak punya data jam sibuk atau lama layanan.
- Mesin antrean komersial mahal (hardware + langganan) dan berlebihan untuk UMKM.

## 3. Tujuan & Non-tujuan

### Tujuan
1. Pelanggan dapat nomor antre dalam **< 15 detik** sejak scan QR.
2. Status antrean di HP pelanggan sinkron dengan dashboard dalam **< 2 detik**.
3. Pelanggan dapat notifikasi saat tinggal **N orang lagi** (default 3) dan saat dipanggil.
4. Estimasi waktu tunggu dengan galat rata-rata (MAE) **< 25%** dari waktu tunggu aktual setelah 2 minggu data.
5. Pemilik usaha bisa onboarding sendiri (daftar → cetak QR → mulai) dalam **< 10 menit**.

### Non-tujuan (v1)
- Booking/janji temu di hari lain (hanya antrean hari ini).
- Pembayaran, rekam medis, atau integrasi SIMRS/BPJS.
- Aplikasi native Android/iOS (cukup PWA).
- Hardware khusus (printer tiket, mesin display). Display ruang tunggu cukup lewat browser di TV/tablet.

## 4. Persona

| Persona | Contoh | Kebutuhan utama |
|---|---|---|
| **Pelanggan** | Ibu yang membawa anak ke klinik | Ambil nomor cepat, tahu estimasi, boleh pergi dulu, tidak terlewat |
| **Petugas loket** | Resepsionis klinik, kasir barbershop | Satu tombol "Panggil berikutnya", lewati/ulang panggil, dipakai sambil sibuk |
| **Pemilik (Owner)** | Pemilik 1–3 cabang usaha | Setup cepat, atur layanan & loket, lihat laporan jam sibuk |
| **Super admin** | Developer (kamu) | Kelola tenant, pantau sistem |

## 5. Alur Pengguna Utama

### 5.1 Pelanggan ambil nomor
1. Scan QR di lokasi → buka `/{tenant}/{cabang}/ambil?k={kode-harian}`.
2. Pilih layanan (mis. "Poli Umum", "Poli Gigi"), isi nama panggilan. Nomor HP opsional (untuk WhatsApp).
3. Dapat tiket: **A-017**, posisi ke-5, estimasi ±22 menit.
4. Halaman tiket meminta izin notifikasi dan menawarkan "Tambah ke layar utama".
5. Halaman tiket update realtime: posisi, nomor yang sedang dilayani, estimasi.
6. Notifikasi saat tinggal 3 orang, lalu saat dipanggil ("A-017 silakan ke Loket 2").
7. Pelanggan bisa membatalkan tiket sendiri.

### 5.2 Petugas melayani
1. Login → pilih loket.
2. Tekan **Panggil berikutnya** → tiket teratas berstatus `CALLED`, muncul di display dan HP pelanggan.
3. Pelanggan datang → **Mulai layani** (`SERVING`) → **Selesai** (`DONE`).
4. Pelanggan tidak datang → **Panggil ulang** (maks. 2x) atau **Lewati** (`NO_SHOW`). Tiket yang dilewati bisa dikembalikan ke antrean.

### 5.3 Owner onboarding
Daftar → buat usaha (nama, slug) → buat cabang → buat layanan (prefix huruf, jam buka) → buat loket → undang petugas → unduh/cetak poster QR.

## 6. Kebutuhan Fungsional

Prioritas: **P0** = wajib MVP, **P1** = rilis kedua, **P2** = nanti.

### 6.1 Multi-tenant & akun
| ID | Kebutuhan | Prio |
|---|---|---|
| T-1 | Satu tenant = satu usaha, dengan banyak cabang. Data antar tenant terisolasi penuh. | P0 |
| T-2 | Peran: `OWNER`, `STAFF` per tenant; `SUPERADMIN` global. | P0 |
| T-3 | Owner mengundang petugas lewat email/link undangan. | P0 |
| T-4 | URL publik berbasis path: `/{tenantSlug}/{branchSlug}`. Subdomain opsional nanti. | P0 |
| T-5 | Branding sederhana per tenant (logo, warna utama). | P1 |

### 6.2 Antrean & tiket
| ID | Kebutuhan | Prio |
|---|---|---|
| Q-1 | Pelanggan ambil tiket tanpa login. Tiket diakses lewat token acak yang tidak bisa ditebak. | P0 |
| Q-2 | Nomor tiket berformat `{prefix}-{urut}`, reset setiap hari per layanan, **tanpa duplikat meski diambil bersamaan**. | P0 |
| Q-3 | Status tiket: `WAITING → CALLED → SERVING → DONE`, plus `NO_SHOW`, `CANCELLED`. | P0 |
| Q-4 | Panggil berikutnya, panggil ulang, lewati, kembalikan ke antrean, selesai. | P0 |
| Q-5 | Satu layanan bisa dilayani beberapa loket; satu loket bisa melayani beberapa layanan. | P0 |
| Q-6 | Layanan bisa dibuka/ditutup manual; pengambilan tiket otomatis ditutup di luar jam operasional atau saat kuota harian habis. | P0 |
| Q-7 | Pelanggan membatalkan tiket sendiri. | P0 |
| Q-8 | Petugas menambah tiket manual (pelanggan tanpa HP) dan mencetak/menyebutkan nomornya. | P1 |
| Q-9 | Prioritas (lansia, ibu hamil) bisa disisipkan ke depan. | P2 |

### 6.3 Anti-penyalahgunaan
| ID | Kebutuhan | Prio |
|---|---|---|
| A-1 | QR berisi **kode harian yang berotasi**, supaya tiket tidak bisa diambil dari rumah lewat foto QR kemarin. | P0 |
| A-2 | Batas 1 tiket aktif per perangkat per layanan (cookie + fingerprint ringan) dan rate limit per IP. | P0 |
| A-3 | Opsi geofence (harus dalam radius X meter dari cabang), bisa dimatikan. | P2 |

### 6.4 Realtime
| ID | Kebutuhan | Prio |
|---|---|---|
| R-1 | Halaman tiket, dashboard petugas, dan display ruang tunggu ikut berubah dalam < 2 detik setelah ada perubahan. | P0 |
| R-2 | Kalau koneksi realtime putus, otomatis sambung ulang lalu ambil ulang snapshot (bukan replay event). | P0 |
| R-3 | Display ruang tunggu (`/display/{branch}`) untuk TV: nomor yang dipanggil + loket, dengan suara panggilan (Web Speech API, bahasa Indonesia). | P1 |

### 6.5 Notifikasi
| ID | Kebutuhan | Prio |
|---|---|---|
| N-1 | Web Push (VAPID) saat posisi ≤ N dan saat dipanggil. N diatur per layanan. | P0 |
| N-2 | Notifikasi hanya dikirim **sekali per jenis per tiket** (idempoten). | P0 |
| N-3 | Fallback WhatsApp jika pelanggan mengisi nomor HP dan owner mengaktifkannya. | P1 |
| N-4 | Log pengiriman notifikasi (terkirim/gagal) untuk debugging dan biaya. | P1 |

### 6.6 Estimasi waktu tunggu
| ID | Kebutuhan | Prio |
|---|---|---|
| E-1 | Setiap tiket menampilkan estimasi menit hingga dipanggil, diperbarui saat antrean bergerak. | P0 |
| E-2 | Estimasi tampil sebagai rentang yang jujur ("15–25 menit"), bukan angka palsu-presisi. | P0 |
| E-3 | Model belajar dari data historis per layanan (lihat §8). | P1 |
| E-4 | Dashboard menunjukkan akurasi estimasi (MAE) per layanan. | P1 |

### 6.7 PWA & offline
| ID | Kebutuhan | Prio |
|---|---|---|
| O-1 | Bisa diinstal (manifest + service worker). | P0 |
| O-2 | Halaman tiket tetap terbuka saat offline, menampilkan status terakhir + "terakhir diperbarui HH:MM" + banner offline. | P0 |
| O-3 | Saat kembali online, otomatis sinkron ulang. | P0 |
| O-4 | Dashboard petugas: aksi saat offline **ditolak dengan jelas** (bukan diantrekan), karena memanggil pelanggan yang sudah tidak ada lebih buruk daripada tombol yang mati. | P0 |

### 6.8 Laporan (owner)
| ID | Kebutuhan | Prio |
|---|---|---|
| L-1 | Hari ini: total tiket, selesai, no-show, rata-rata tunggu, rata-rata layanan. | P0 |
| L-2 | Heatmap jam sibuk per hari dalam seminggu. | P1 |
| L-3 | Ekspor CSV. | P2 |

## 7. Arsitektur Teknis

### 7.1 Stack
| Lapisan | Pilihan | Catatan |
|---|---|---|
| Framework | Next.js App Router + TypeScript (strict) | Server Components untuk halaman, Server Actions untuk mutasi dashboard, Route Handlers untuk API publik & SSE |
| DB | MySQL 8 | |
| ORM | Prisma | Client extension untuk otomatis menyaring `tenantId` |
| Auth staff | Auth.js atau Better Auth (email + password / magic link) | Pelanggan tidak login |
| Validasi | Zod | Dipakai bersama di client & server |
| UI | Tailwind CSS + komponen headless | Mobile-first; halaman pelanggan harus ringan di HP low-end |
| Realtime | Server-Sent Events (SSE) | Lihat 7.3 |
| Push | `web-push` (VAPID) | |
| WhatsApp | WhatsApp Cloud API (resmi) | Penyedia tidak resmi berisiko nomor diblokir |
| Job terjadwal | Cron (node-cron di worker / cron hosting) | Retrain model, tutup antrean harian, bersihkan data |
| Deploy | VPS/Docker (Node runtime, bukan serverless) | SSE butuh koneksi panjang |

### 7.2 Multi-tenancy
- **Shared database, shared schema**, setiap tabel bisnis punya kolom `tenantId` + index komposit diawali `tenantId`.
- Akses data dari dashboard selalu lewat `getTenantDb(tenantId)`, yaitu Prisma client extension yang menyuntikkan `where: { tenantId }` pada setiap query, sehingga lupa filter tidak membocorkan data.
- `tenantId` diambil dari sesi + membership, **tidak pernah** dari input client.
- Tes otomatis: user tenant A mencoba membaca/mengubah resource tenant B harus gagal.

### 7.3 Realtime
- Setiap mutasi antrean (ambil, panggil, selesai, dst.) → tulis ke DB dalam transaksi → publish event `{branchId, version}` ke event bus.
- Client berlangganan `GET /api/stream/branch/{id}` (SSE). Saat dapat event, client **mengambil ulang snapshot** (`GET /api/branch/{id}/state`), bukan menerapkan diff. Ini lebih sederhana dan otomatis pulih dari event yang hilang.
- Event bus: in-memory `EventEmitter` untuk MVP (1 instance). Kalau perlu lebih dari 1 instance → Redis pub/sub. Antarmukanya dibuat sama supaya tinggal diganti.
- Heartbeat tiap 20 detik untuk menjaga koneksi melewati proxy. Fallback polling 10 detik jika SSE gagal.

### 7.4 Nomor tiket tanpa duplikat (Q-2)
Tabel `DailyCounter(serviceId, date, lastNumber)` dengan PK komposit. Dalam satu transaksi:
```sql
INSERT INTO DailyCounter (serviceId, date, lastNumber) VALUES (?, ?, 1)
ON DUPLICATE KEY UPDATE lastNumber = LAST_INSERT_ID(lastNumber + 1);
```
lalu buat `Ticket`. Ditambah unique constraint `(serviceId, date, number)` sebagai pengaman terakhir. Diuji dengan 100 request paralel.

### 7.5 Pemicu notifikasi
Setelah setiap "panggil", hitung ulang posisi tiket `WAITING` di layanan itu. Tiket yang posisinya ≤ N dan belum punya `NotificationLog(type=NEAR)` dimasukkan ke antrean kirim. Pengiriman dilakukan di luar request (fire-and-forget dengan retry), sehingga tombol petugas tetap cepat.

## 8. Model Estimasi Waktu Tunggu

### Tahap 1 — Baseline (P0)
```
estimasi = orang_di_depan × rata_rata_durasi_layanan / jumlah_loket_aktif
```
`rata_rata_durasi_layanan` = EWMA (α ≈ 0.2) dari durasi `SERVING→DONE` hari ini, jatuh ke rata-rata 14 hari terakhir pada slot jam yang sama, lalu ke default layanan jika data belum ada.

### Tahap 2 — Regresi linear (P1)
Target: menit dari tiket dibuat sampai dipanggil.

Fitur:
- jumlah orang di depan
- jumlah loket aktif
- jam dalam hari (one-hot per blok 2 jam)
- hari dalam minggu (hari kerja/akhir pekan)
- rata-rata durasi layanan 1 jam terakhir
- tingkat no-show hari ini

Pelatihan: tiap malam per layanan dengan ≥ 200 tiket selesai, memakai OLS dengan regularisasi ridge kecil (implementasi sendiri di TypeScript, cukup operasi matriks kecil; tidak perlu library ML). Koefisien disimpan di tabel `WaitModel`. Model baru hanya dipakai jika MAE-nya pada data 3 hari terakhir (holdout) lebih baik daripada baseline.

Rentang yang ditampilkan: `prediksi ± 1×MAE`, dibulatkan ke 5 menit.

Ini adalah cerita interview yang kuat: baseline yang jujur, model yang harus *mengalahkan* baseline sebelum dipakai, dan metrik akurasi yang terlihat di dashboard.

## 9. Model Data (draft Prisma)

```prisma
model Tenant {
  id        String   @id @default(cuid())
  slug      String   @unique
  name      String
  createdAt DateTime @default(now())
  branches  Branch[]
  members   Membership[]
}

model User {
  id           String       @id @default(cuid())
  email        String       @unique
  name         String
  passwordHash String?
  isSuperAdmin Boolean      @default(false)
  memberships  Membership[]
}

model Membership {
  id       String @id @default(cuid())
  tenantId String
  userId   String
  role     Role
  tenant   Tenant @relation(fields: [tenantId], references: [id])
  user     User   @relation(fields: [userId], references: [id])
  @@unique([tenantId, userId])
}

enum Role { OWNER STAFF }

model Branch {
  id        String    @id @default(cuid())
  tenantId  String
  slug      String
  name      String
  timezone  String    @default("Asia/Jakarta")
  qrSecret  String    // dasar kode QR harian
  tenant    Tenant    @relation(fields: [tenantId], references: [id])
  services  Service[]
  counters  Counter[]
  @@unique([tenantId, slug])
}

model Service {
  id              String   @id @default(cuid())
  tenantId        String
  branchId        String
  name            String
  prefix          String   @db.VarChar(3)
  isOpen          Boolean  @default(false)
  dailyQuota      Int?
  notifyAhead     Int      @default(3)
  defaultMinutes  Int      @default(10)
  openHours       Json     // { mon: ["08:00","16:00"], ... }
  branch          Branch   @relation(fields: [branchId], references: [id])
  tickets         Ticket[]
  counters        CounterService[]
  @@index([tenantId, branchId])
}

model Counter {
  id        String   @id @default(cuid())
  tenantId  String
  branchId  String
  name      String   // "Loket 1"
  isActive  Boolean  @default(false)
  branch    Branch   @relation(fields: [branchId], references: [id])
  services  CounterService[]
  @@index([tenantId, branchId])
}

model CounterService {
  counterId String
  serviceId String
  counter   Counter @relation(fields: [counterId], references: [id])
  service   Service @relation(fields: [serviceId], references: [id])
  @@id([counterId, serviceId])
}

model DailyCounter {
  serviceId  String
  date       DateTime @db.Date
  lastNumber Int
  @@id([serviceId, date])
}

model Ticket {
  id          String       @id @default(cuid())
  tenantId    String
  serviceId   String
  counterId   String?
  date        DateTime     @db.Date
  number      Int
  code        String       // "A-017"
  accessToken String       @unique // token akses pelanggan
  name        String
  phone       String?
  status      TicketStatus @default(WAITING)
  callCount   Int          @default(0)
  predictedMinutes Int?
  createdAt   DateTime     @default(now())
  calledAt    DateTime?
  servingAt   DateTime?
  doneAt      DateTime?
  service     Service      @relation(fields: [serviceId], references: [id])
  pushSubs    PushSubscription[]
  notifications NotificationLog[]
  @@unique([serviceId, date, number])
  @@index([tenantId, serviceId, date, status])
}

enum TicketStatus { WAITING CALLED SERVING DONE NO_SHOW CANCELLED }

model PushSubscription {
  id        String @id @default(cuid())
  ticketId  String
  endpoint  String @db.VarChar(512)
  p256dh    String
  auth      String
  ticket    Ticket @relation(fields: [ticketId], references: [id])
}

model NotificationLog {
  id        String   @id @default(cuid())
  ticketId  String
  type      NotifType
  channel   Channel
  status    String   // SENT | FAILED
  error     String?
  createdAt DateTime @default(now())
  ticket    Ticket   @relation(fields: [ticketId], references: [id])
  @@unique([ticketId, type, channel])
}

enum NotifType { NEAR CALLED }
enum Channel { WEBPUSH WHATSAPP }

model WaitModel {
  id          String   @id @default(cuid())
  serviceId   String
  coefficients Json
  maeMinutes  Float
  sampleSize  Int
  trainedAt   DateTime @default(now())
  isActive    Boolean  @default(false)
  @@index([serviceId, isActive])
}
```

## 10. Kebutuhan Non-fungsional

| Area | Target |
|---|---|
| Performa | Halaman tiket: LCP < 2.5 s di 4G lambat; JS halaman pelanggan < 100 KB gzip |
| Realtime | p95 propagasi < 2 s; 500 koneksi SSE bersamaan per instance |
| Ketersediaan | 99.5% pada jam operasional (07:00–21:00 WIB) |
| Keamanan | Token tiket ≥ 128 bit; rate limit endpoint publik; CSRF bawaan Server Actions; semua query dashboard lewat tenant-scoped client |
| Privasi (UU PDP No. 27/2022) | Data minimal (nama panggilan; HP opsional); nomor HP dihapus/disamarkan 30 hari setelah tiket selesai; halaman kebijakan privasi |
| Aksesibilitas | Kontras WCAG AA, teks besar di halaman tiket, bisa dipakai satu tangan |
| Bahasa | Bahasa Indonesia dulu; struktur siap i18n |
| Waktu | Semua "hari" dihitung di zona waktu cabang (WIB/WITA/WIT) |

## 11. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Web Push di iOS hanya jalan jika PWA dipasang ke layar utama (iOS 16.4+) | Sebagian pengguna iPhone tidak dapat notifikasi | Ajakan "Tambah ke layar utama" khusus iOS; fallback WhatsApp; halaman tiket tetap realtime saat terbuka |
| Biaya WhatsApp Cloud API per percakapan | Biaya membengkak | Hanya untuk notifikasi `CALLED`, opt-in per tenant, kuota bulanan |
| Penghematan baterai Android mematikan push | Notifikasi telat | Kirim `NEAR` cukup awal (N bisa diatur); urgensi tinggi untuk `CALLED` |
| Ambil tiket dari jauh | Antrean "hantu", no-show tinggi | QR harian berotasi, batas per perangkat, laporan no-show |
| Satu instance SSE jadi bottleneck | Realtime macet saat ramai | Event bus bisa ditukar ke Redis; fallback polling |
| Data historis sedikit di awal | Estimasi buruk | Baseline + rentang lebar + model hanya aktif jika lebih baik dari baseline |

## 12. Metrik Keberhasilan

**Produk (untuk cerita "dipakai oleh X toko"):**
- Jumlah tenant aktif mingguan (≥ 1 hari dengan ≥ 10 tiket)
- Tiket per minggu
- Persentase pelanggan yang mengaktifkan notifikasi
- Tingkat no-show sebelum vs sesudah memakai Lapak Antre
- MAE estimasi vs baseline

**Teknis:** p95 latensi realtime, tingkat keberhasilan push, error rate API.

Target pilot: **3–5 usaha nyata** (klinik, barbershop, bengkel) dalam 2 bulan setelah MVP, dengan testimoni dan angka sebelum/sesudah.

## 13. Rencana Rilis

| Fase | Isi | Perkiraan |
|---|---|---|
| **M0 — Fondasi** | Setup Next.js + Prisma + MySQL, auth staff, multi-tenant + tes isolasi, CRUD tenant/cabang/layanan/loket | 1 minggu |
| **M1 — Antrean inti** | Ambil tiket via QR, nomor anti-duplikat, dashboard petugas, halaman tiket, SSE realtime | 1–2 minggu |
| **M2 — Notifikasi & PWA** | Web Push, service worker, mode offline halaman tiket, display ruang tunggu + suara | 1 minggu |
| **M3 — Estimasi & laporan** | Baseline EWMA, laporan harian, poster QR | 1 minggu |
| **M4 — Pilot** | Deploy, onboarding 1–2 usaha, perbaikan dari lapangan | 2 minggu |
| **M5 — Pintar** | Regresi + panel akurasi, WhatsApp, heatmap jam sibuk | 2 minggu |

## 14. Pertanyaan Terbuka

1. Auth staff: Auth.js atau Better Auth? (keduanya cocok dengan Prisma + MySQL)
2. Hosting: VPS mana (biaya vs latensi Indonesia)? Perlu dicek apakah reverse proxy mendukung SSE tanpa buffering.
3. Model bisnis: gratis selamanya untuk pilot, lalu freemium (mis. gratis ≤ 300 tiket/bulan)?
4. Apakah klinik pilot butuh fitur prioritas (Q-9) lebih awal?
