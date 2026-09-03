# LITERATERAPI-SAKTI

Aplikasi Next.js untuk ruang membaca reflektif S-A-K-T-I bagi pengguna
Indonesia dan Malaysia. Proyek ini memakai Supabase untuk autentikasi,
penyimpanan progres, refleksi, peran pengguna, serta data pendampingan.

## Cakupan Saat Ini

- **Bahasa aplikasi**: Indonesia (`id-ID`) dan Melayu Malaysia (`ms-MY`).
- **Konten cerita**: 19 cerpen lokal dari `content-prepared`, digenerate ke
  `src/content/stories.generated.ts` dan aset di `public/assets/stories`.
- **Alur siswa**: dashboard, pemilihan avatar/tema, pustaka cerita, pembaca
  cerpen, jeda napas, musik latar, prompt S-A-K-T-I, progres, XP, level, hadiah,
  dan layar selesai.
- **Peran pengguna**: siswa, fasilitator, konselor/pendamping psikologis,
  moderator, editor konten, ahli, peneliti, dan administrator.
- **Dashboard peran**: halaman khusus untuk admin, fasilitator, konselor,
  moderator, editor konten, ahli, dan peneliti dengan fitur MVP yang saling
  terhubung.
- **Keamanan akses**: middleware dan guard role melindungi halaman siswa,
  pembaca cerita, dan halaman internal. Pengguna yang belum login diarahkan ke
  halaman masuk sesuai locale.
- **Database**: migrasi Supabase dengan RLS dasar, role helper, dan tabel
  riwayat migrasi internal yang tidak terbuka untuk browser role.

## Yang Masih Perlu Dipoles Berikutnya

- Audit UX lapangan bersama siswa, guru, dan pendamping.
- Review final seluruh teks Melayu Malaysia oleh penutur/editor lokal.
- Penajaman rubrik ahli dan protokol eskalasi non-klinis.
- Observabilitas produksi: logging error, monitoring, dan backup berkala.
- PWA/offline mode bila aplikasi sudah stabil.

## Cara Menjalankan Lokal

```powershell
copy .env.example .env.local
# isi .env.local dengan URL dan key Supabase

npm.cmd install
npm.cmd run dev
```

Buka:

- `http://localhost:3000/` untuk bahasa Indonesia.
- `http://localhost:3000/ms-MY/` untuk Melayu Malaysia.

Jika port 3000 sedang dipakai:

```powershell
npm.cmd run dev -- -p 3001
```

## Migrasi Database

Pastikan `DIRECT_URL` atau `DATABASE_URL` sudah terisi di `.env.local`, lalu:

```powershell
npm.cmd run db:migrate
```

Runner migrasi akan membuat atau memperbarui tabel
`public.literaterapi_schema_migrations`. Tabel ini hanya untuk kebutuhan
internal server; RLS diaktifkan dan akses browser role dicabut.

## Cek Manual Setelah Dev Server Menyala

1. `/` tampil sebagai landing page dengan hero dan ringkasan 19 cerpen.
2. Pengalih bahasa berpindah antara `/` dan `/ms-MY/`.
3. Tanpa login, akses `/pustaka`, `/dashboard`, atau `/cerita/[slug]/baca`
   diarahkan ke `/masuk` atau `/ms-MY/masuk`.
4. Login siswa masuk ke `/dashboard` dan dapat memilih cerita dari seluruh
   koleksi.
5. Reader menampilkan tahap S-A-K-T-I, ilustrasi adegan, musik latar, tombol
   selesai, XP, level, dan hadiah.
6. Login akun dengan banyak role dapat berpindah ke halaman role yang sesuai.
7. Halaman admin, fasilitator, konselor, moderator, editor, ahli, dan peneliti
   tidak dapat diakses tanpa role yang benar.

## Verifikasi Teknis

Jalankan sebelum deploy:

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
```

## Regenerasi Konten Cerita

Jika isi `content-prepared` berubah:

```powershell
npm.cmd run generate:content
```

Generator memperbarui `src/content/stories.generated.ts` dan menyalin aset yang
dibutuhkan ke `public/assets/stories`.
