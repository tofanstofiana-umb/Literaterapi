# Inventaris Konten Mentah LITERATERAPI-SAKTI

Tanggal inventaris: 2026-07-12

Catatan: berkas di folder ini adalah bahan mentah. File asli belum dipindah,
diubah, atau dihapus. Inventaris ini dibuat untuk memudahkan tahap berikutnya:
ekstraksi teks, perapihan metadata, pemetaan gambar, dan seed/import ke
Supabase.

## Ringkasan

- Dokumen cerpen: 19 file `.docx`
- Gambar: 201 file `.png`
- Audio: 1 file `.mp3`
- Aset umum di root `content-raw`: hero, avatar, ilustrasi dashboard, dan audio
- Cerpen Malaysia sudah rapi per folder `Cerpen 1` sampai `Cerpen 7`
- Cerpen Indonesia masih berada dalam satu folder besar dengan 12 dokumen dan
  127 gambar UUID, sehingga pemetaan gambar ke cerpen perlu ditentukan dulu

## Dokumen Cerpen

| Asal | File | Judul / baris judul | Kata | Catatan |
| --- | --- | --- | ---: | --- |
| Indonesia | `Cerpen Indonesia/Bintang yang Tidak Hilang.docx` | Bintang yang Tidak Hilang | 661 | Judul jelas dari isi dokumen |
| Indonesia | `Cerpen Indonesia/Cahaya yang Selalu Ada 7.docx` | Cahaya yang Selalu Ada | 642 | Judul jelas dari isi dokumen |
| Indonesia | `Cerpen Indonesia/Debu yang Menari.docx` | Debu yang Menari | 873 | Judul jelas dari isi dokumen |
| Indonesia | `Cerpen Indonesia/Layang 5.docx` | Layang-layang di Atas Kerikil | 783 | Nama file pendek, judul lengkap ada di isi |
| Indonesia | `Cerpen Indonesia/SAKTI_Anxiety_Cerpen 1_Pasar Malam di Dalam Kepalaku.docx` | Pasar Malam di Dalam Kepalaku | 1181 | Ada pengantar SAKTI sebelum judul cerpen |
| Indonesia | `Cerpen Indonesia/SAKTI_Anxiety_Cerpen 2_Satu Keping Sagu untuk Berdua.docx` | Satu Keping Sagu untuk Berdua | 1000 | Ada pengantar SAKTI sebelum judul cerpen |
| Indonesia | `Cerpen Indonesia/SAKTI_Behavioral_Cerpen 5_Hidup di Dalam Ceritamu Sendiri.docx` | Hidup di Dalam Ceritamu Sendiri | 866 | Judul jelas dari isi dokumen |
| Indonesia | `Cerpen Indonesia/SAKTI_Behavioral_Cerpen 6_Warisan Tanpa Nama.docx` | Warisan Tanpa Nama | 1128 | Ada pengantar SAKTI sebelum judul cerpen |
| Indonesia | `Cerpen Indonesia/SAKTI_Depressive_Cerpen 3_Langit yang Belajar Hujan.docx` | Langit yang Belajar Hujan | 1113 | Ada pengantar SAKTI sebelum judul cerpen |
| Indonesia | `Cerpen Indonesia/SAKTI_Depressive_Cerpen 4_Nyala yang Tidak Pernah Berkurang.docx` | Nyala yang Tidak Pernah Berkurang | 1209 | Ada pengantar SAKTI sebelum judul cerpen |
| Indonesia | `Cerpen Indonesia/Suara yang Hanya Aku Dengar.docx` | Suara yang Hanya Aku Dengar | 659 | Judul jelas dari isi dokumen |
| Indonesia | `Cerpen Indonesia/Tubuhku Bukan Musuhku 6.docx` | Tubuhku Bukan Musuhku | 784 | Judul jelas dari isi dokumen |
| Malaysia | `Cerpen Malaysia/Cerpen 1/Teks-cerpen-malay-1.docx` | Suara di Balai Muafakat | 793 | Sampul tersedia di folder yang sama |
| Malaysia | `Cerpen Malaysia/Cerpen 2/Teks-cerpen-malay-2.docx` | Kabus di Kaki Bukit | 705 | Sampul tersedia di folder yang sama |
| Malaysia | `Cerpen Malaysia/Cerpen 3/Teks-cerpen-malay-3.docx` | Cermin di Bilik Andam | 730 | Sampul tersedia di folder yang sama |
| Malaysia | `Cerpen Malaysia/Cerpen 4/Teks-cerpen-malay-4.docx` | Pintu Rumah Panjang | 770 | Sampul tersedia di folder yang sama |
| Malaysia | `Cerpen Malaysia/Cerpen 5/Teks-cepren-malay-5.docx` | Bunga Api dalam Kepala Ammar | 747 | Ada typo nama file: `cepren` |
| Malaysia | `Cerpen Malaysia/Cerpen 6/Teks-malay-6.docx` | Ruang di Bawah Bumbung Rumah Panjang | 722 | Sampul tersedia di folder yang sama |
| Malaysia | `Cerpen Malaysia/Cerpen 7/Teks-malay-7.docx` | Jalan Pulang ke Rumah Panjang | 768 | Sampul tersedia di folder yang sama |

## Aset Umum

- `hero-literaterapi-remaja.png` - kandidat hero/beranda
- `animasi-dashboard.png` - kandidat ilustrasi dashboard
- `avatar-laki.png` - kandidat avatar siswa
- `avatar-perempuan.png` - kandidat avatar siswa
- `avatar-netral.png` - kandidat avatar siswa
- `bensound-relaxing.mp3` - kandidat audio relaksasi/latar

## Struktur Saat Ini

```text
content-raw/
  Cerpen Indonesia/
    12 dokumen .docx
    127 gambar .png
  Cerpen Malaysia/
    Cerpen 1/
      1 dokumen .docx
      Sampul.png
      beberapa ilustrasi .png
    ...
    Cerpen 7/
      1 dokumen .docx
      Sampul.png
      beberapa ilustrasi .png
  hero-literaterapi-remaja.png
  animasi-dashboard.png
  avatar-laki.png
  avatar-perempuan.png
  avatar-netral.png
  bensound-relaxing.mp3
```

## Rekomendasi Perapihan Berikutnya

1. Ekstrak semua `.docx` menjadi teks/Markdown bersih.
2. Pisahkan konten naratif cerpen dari pengantar SAKTI dan catatan
   pembelajaran.
3. Buat satu folder terstruktur per cerita, misalnya:

```text
content-prepared/stories/
  id/pasar-malam-di-dalam-kepalaku/
    story.md
    metadata.json
    cover.png
    illustrations/
  ms/suara-di-balai-muafakat/
    story.md
    metadata.json
    cover.png
    illustrations/
```

4. Untuk Malaysia, pemetaan gambar cukup aman karena gambar sudah berada di
   folder cerpen masing-masing.
5. Untuk Indonesia, pemetaan gambar perlu dilakukan dengan melihat thumbnail
   atau diberi aturan dari Bapak/Ibu karena gambar masih berupa nama UUID di
   satu folder besar.
6. Setelah metadata stabil, buat seed SQL atau file JSON import untuk tabel:
   `stories`, `story_versions`, `story_translations`,
   `story_category_links`, `cultural_glossary`, dan `content_warnings`.

## Catatan Keamanan Bahasa Produk

Beberapa nama file dan isi dokumen memakai istilah klinis seperti anxiety,
depressive, behavioral, ADHD, atau kebergantungan ubat. Ini boleh dipakai
sebagai metadata internal, tetapi label yang tampil ke siswa sebaiknya tetap
non-klinis dan suportif, sesuai desain database yang memisahkan
`internal_category` dari `story_categories`.
