# 🚀 Panduan Migrasi Database & Deploy Mariners SC ke Vercel (Online 24/7)

Panduan ini akan memandu Anda memindahkan database lokal dan mempublikasikan website **Mariners SC** ke **Vercel** sehingga website publik dan **Portal Admin** dapat diakses langsung melalui link internet (misal: `https://marinerssc.vercel.app/admin`), bukan lagi localhost.

---

## 📌 Mengapa Butuh Database Cloud (PostgreSQL)?
Vercel menggunakan arsitektur **Serverless** (penyimpanan sementara), sehingga database file lokal SQLite (`dev.db`) tidak bisa menyimpan data secara permanen di server Vercel. Oleh karena itu, kita menghubungkan Prisma dengan database cloud gratis dan cepat seperti **Neon.tech** (rekomendasi resmi Vercel) atau **Supabase**.

---

## 📋 Langkah 1: Buat Database Cloud Gratis (Neon.tech - 1 Menit)
1. Buka [https://neon.tech](https://neon.tech) lalu klik **Sign Up** (bisa login menggunakan akun GitHub Anda).
2. Buat project baru dengan nama **`marinerssc-db`**.
3. Setelah selesai dibuat, Neon akan menampilkan **Connection String** (URL Database), contohnya:
   ```text
   postgresql://mariners_owner:password@ep-cool-cloud.ap-southeast-1.aws.neon.tech/marinerssc?sslmode=require
   ```
4. **Salin (Copy)** URL database tersebut.

---

## 📋 Langkah 2: Migrasikan Seluruh Data dari Lokal ke Cloud
Kami sudah membuat script otomatis (`npm run db:restore`) yang menyimpan seluruh data pemain, pertandingan, statistik, lineup, artikel, dan akun admin Anda di `prisma/backup_data.json`.

1. Buka file `.env` di VS Code / editor Anda, lalu ubah baris `DATABASE_URL` menjadi URL database Neon Anda:
   ```env
   DATABASE_URL="postgresql://mariners_owner:password@ep-cool-cloud.ap-southeast-1.aws.neon.tech/marinerssc?sslmode=require"
   JWT_SECRET="mariners-fc-super-secret-key-2026-gold-navy"
   ADMIN_ENABLED="true"
   ```
2. Ubah `provider` di `prisma/schema.prisma` menjadi `postgresql`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
3. Buka terminal di project dan jalankan 2 perintah berikut:
   ```bash
   npx prisma db push
   npm run db:restore
   ```
4. 🎉 **Selesai!** Seluruh 19 pemain, jadwal laga, lineup formasi, acara gol, dan artikel berita Anda kini sudah 100% tersimpan di database online cloud.

---

## 📋 Langkah 3: Deploy Project ke Vercel
1. Buka [https://vercel.com](https://vercel.com) dan login dengan akun GitHub Anda.
2. Klik tombol **"Add New..."** -> **"Project"**.
3. Pilih repository GitHub Anda: **`tirangga30/marinerssc`**, lalu klik **Import**.
4. Pada bagian **Environment Variables**, tambahkan 3 variabel berikut:
   * **`DATABASE_URL`**: (Paste URL database Neon PostgreSQL Anda dari Langkah 1)
   * **`JWT_SECRET`**: `mariners-fc-super-secret-key-2026-gold-navy`
   * **`ADMIN_ENABLED`**: `true`
5. Klik tombol **Deploy**.
6. Tunggu sekitar 1–2 menit hingga proses build selesai.

---

## 🌐 Hasil Akhir
Setelah deploy selesai, Vercel akan memberikan domain online resmi, misalnya:
* 🌍 **Website Publik**: `https://marinerssc.vercel.app`
* 🔐 **Portal Admin Online**: `https://marinerssc.vercel.app/admin`

Anda sekarang bisa mengelola skuad, membuat artikel berita, dan mengatur pertandingan langsung dari HP atau laptop mana pun secara online tanpa perlu menyalakan komputer lokal atau XAMPP lagi!
