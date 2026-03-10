# EduAdapt SLB - Rencana Pembelajaran Mendalam (RPM)

Aplikasi berbasis AI untuk membantu guru SLB (Sekolah Luar Biasa) dalam merancang Rencana Pembelajaran Mendalam (RPM) yang adaptif dan inklusif.

## Fitur Utama
- Perancangan RPM otomatis berbasis AI (Gemini 3 Flash).
- Format adaptif sesuai hambatan siswa (Tunanetra, Tunarungu, dll).
- Integrasi langsung ke Google Dokumen dengan format yang terjaga.
- Antarmuka modern dan responsif.

## Cara Menjalankan Secara Lokal
1. Clone repositori ini:
   ```bash
   git clone <url-repositori-anda>
   ```
2. Masuk ke direktori proyek:
   ```bash
   cd <nama-direktori>
   ```
3. Instal dependensi:
   ```bash
   npm install
   ```
4. Buat file `.env` di root direktori dan tambahkan API Key Anda:
   ```env
   GEMINI_API_KEY=your_actual_api_key_here
   ```
5. Jalankan aplikasi:
   ```bash
   npm run dev
   ```

## Cara Deployment ke Vercel
1. Hubungkan repositori GitHub Anda ke [Vercel](https://vercel.com).
2. Pilih proyek ini.
3. Di bagian **Environment Variables**, tambahkan:
   - `GEMINI_API_KEY`: Masukkan API Key Gemini Anda.
4. Klik **Deploy**.

## Lisensi
Apache-2.0
