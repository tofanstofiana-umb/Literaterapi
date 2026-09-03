# Naskah Akademik Pencatatan Hak Cipta

## LITERATERAPI-SAKTI

**Ruang Membaca Reflektif untuk Mengenal Diri dan Sesama**

### Identitas Awal

| Komponen | Keterangan |
| --- | --- |
| Judul ciptaan | LITERATERAPI-SAKTI |
| Bentuk ciptaan utama | Program komputer/aplikasi web edukatif |
| Bentuk ciptaan pendukung | Naskah cerpen, rancangan alur reflektif S-A-K-T-I, desain antarmuka, basis data, dokumentasi, dan aset visual yang dimiliki/diizinkan |
| Pengembang aplikasi | Vismaia S. Damaianti; Rosita Rahma; Lira Fessia Damaianti; Tofan Stofiana; Dedi Irawan; Muhammad Pahruroji |
| Pencipta/pengembang yang dicantumkan dalam dokumen | Vismaia S. Damaianti; Rosita Rahma; Lira Fessia Damaianti; Tofan Stofiana; Dedi Irawan; Muhammad Pahruroji |
| Pemegang hak cipta | Para pengembang LITERATERAPI-SAKTI, sepanjang tidak ditentukan lain dalam surat pernyataan atau pengalihan hak cipta |
| Tahun pembuatan | 2026 |
| Tanggal versi naskah | 8 Agustus 2026 |
| URL produksi | https://literaterapi-sakti-next.vercel.app |
| Repositori kerja | `C:\Users\Bahmel\Desktop\literaterapi-sakti-next` |
| Status dokumen | Final akademik untuk penyiapan pencatatan HAKI |

> Catatan: dokumen ini disusun sebagai naskah akademik dan teknis pendukung. Untuk berkas final pencatatan hak cipta, data identitas pencipta, pemegang hak, tanggal publikasi pertama, surat pernyataan, dan lampiran resmi tetap perlu disesuaikan dengan ketentuan DJKI yang berlaku.

---

## Abstrak

LITERATERAPI-SAKTI adalah aplikasi web edukatif berbasis cerpen reflektif untuk siswa Indonesia dan Malaysia. Aplikasi ini menggabungkan pustaka cerita lintas budaya, alur membaca reflektif lima tahap S-A-K-T-I, dashboard siswa, gamifikasi, pendampingan berbasis peran, dan tata kelola konten melalui dashboard editor, moderator, ahli, peneliti, fasilitator, konselor/pendamping psikologis, serta administrator. Fokus karya ini adalah menyediakan ruang membaca yang aman, non-klinis, dan mendukung refleksi diri siswa melalui cerita, bukan menyediakan layanan diagnosis atau terapi klinis.

Secara teknis, aplikasi dibangun dengan Next.js, Supabase, dan Vercel. Sistem menggunakan autentikasi, role-based access control, Row Level Security, penyimpanan progres membaca, refleksi siswa, data pendampingan, rubrik tinjauan ahli, serta dashboard penelitian agregat. Secara pedagogis, aplikasi mengembangkan model S-A-K-T-I: Sadar, Aktif, Kritis, Terbuka, dan Imersif. Model ini memandu siswa untuk menyadari kesiapan membaca, berhubungan dengan pengalaman tokoh, merefleksikan makna dan nilai budaya, membuka kemungkinan cara pandang baru, serta menyusun gagasan baru setelah membaca.

Kebaruan utama karya terletak pada integrasi cerpen reflektif dua budaya, kategori publik non-klinis, tahapan S-A-K-T-I yang terstruktur, perlindungan akses siswa, peran pendamping yang saling terhubung, gamifikasi ringan, dan dashboard penelitian agregat untuk evaluasi penggunaan. Naskah ini menjelaskan dasar akademik, ruang lingkup ciptaan, arsitektur sistem, komponen orisinal, batasan etis, dan bahan lampiran yang disarankan untuk pencatatan hak cipta.

---

## 1. Latar Belakang

Perkembangan teknologi pendidikan membuka peluang baru untuk menghadirkan bahan bacaan yang tidak hanya melatih literasi, tetapi juga membantu siswa mengenali pengalaman diri dan orang lain secara aman. Pada usia remaja awal, siswa sering berhadapan dengan perubahan emosi, tekanan pertemanan, penyesuaian belajar, pencarian identitas, dan pengalaman lintas budaya. Cerita pendek dapat menjadi medium yang ramah karena siswa tidak dipaksa membicarakan dirinya secara langsung; ia dapat terlebih dahulu mendekati pengalaman melalui tokoh, alur, konflik, dan simbol budaya.

LITERATERAPI-SAKTI dirancang untuk menjawab kebutuhan tersebut melalui pendekatan literasi reflektif non-klinis. Aplikasi ini tidak memosisikan siswa sebagai pasien dan tidak menggunakan label klinis pada tampilan siswa. Kategori yang tampil kepada siswa dibuat dalam bahasa publik, seperti "Menemukan Ketenangan", "Menemukan Harapan", "Mengelola Emosi", "Membangun Pertemanan Sehat", dan "Meminta Bantuan". Metadata internal yang lebih teknis hanya dipakai untuk kurasi dan tidak ditampilkan sebagai identitas siswa atau diagnosis.

Konteks Indonesia dan Malaysia menjadi penting karena aplikasi ini memuat dua bahasa antarmuka, dua konteks budaya, dan koleksi cerita dari kedua negara. Hal ini memungkinkan siswa membaca cerita yang dekat dengan lingkungannya sekaligus belajar mengenali pengalaman sesama dari budaya serumpun.

---

## 2. Tujuan Pengembangan

Tujuan umum pengembangan LITERATERAPI-SAKTI adalah menyediakan aplikasi membaca reflektif berbasis cerpen yang aman, terstruktur, dan relevan bagi siswa Indonesia dan Malaysia.

Tujuan khusus:

1. Menyediakan pustaka cerpen reflektif dengan kategori publik non-klinis.
2. Membimbing siswa melalui lima tahap membaca S-A-K-T-I.
3. Menghadirkan pengalaman membaca yang menarik melalui avatar, tema, level, XP, hadiah, dan layar penyelesaian.
4. Memastikan akses cerita dan fitur siswa hanya tersedia setelah login.
5. Menyediakan dashboard peran untuk fasilitator, konselor/pendamping psikologis, moderator, editor konten, ahli, peneliti, dan administrator.
6. Mendukung pendampingan siswa melalui catatan, status tindak lanjut, dan pemetaan kelas.
7. Mendukung tata kelola konten melalui status revisi, laporan keamanan, rubrik ahli, dan studio draft cerita.
8. Menyediakan data agregat anonim bagi peneliti untuk evaluasi penggunaan aplikasi.
9. Menjaga batas etis bahwa aplikasi bersifat edukatif dan reflektif, bukan alat diagnosis atau terapi klinis.

---

## 3. Dasar Konseptual

### 3.1 Literasi Reflektif

Literasi reflektif dipahami sebagai praktik membaca yang mendorong pembaca menghubungkan teks dengan pengalaman, emosi, nilai, dan kemungkinan tindakan secara sadar. Dalam aplikasi ini, refleksi tidak dibangun melalui pertanyaan evaluatif yang menghakimi, tetapi melalui pernyataan dan respons ringan yang memberi ruang aman bagi siswa.

### 3.2 Cerita Pendek sebagai Medium Pengenalan Diri

Cerpen memungkinkan pengalaman sulit didekati secara tidak langsung. Siswa dapat melihat konflik tokoh, mengenali perasaan yang mirip, lalu membuat jarak aman sebelum menulis refleksi pribadi. Karena itu, cerpen dalam aplikasi ini diposisikan sebagai wahana literasi dan empati, bukan instrumen klinis.

### 3.3 Prinsip Non-Klinis

Aplikasi membedakan antara:

- **Kategori publik**, yang tampil kepada siswa dengan bahasa aman dan umum.
- **Metadata internal**, yang hanya dipakai untuk kurasi, penelitian desain, atau tinjauan ahli.

Prinsip ini penting agar aplikasi tidak memberi label psikologis kepada siswa. Konselor/pendamping psikologis juga diarahkan untuk memakai sapaan aman, tindak lanjut suportif, dan eskalasi manusia bila diperlukan.

### 3.4 Model S-A-K-T-I

S-A-K-T-I adalah kerangka membaca reflektif lima tahap:

| Tahap | Makna | Fungsi dalam aplikasi |
| --- | --- | --- |
| Sadar | Mengenali suasana tema cerita dan menyadari kesiapan membaca | Dilakukan sebelum teks cerpen dibuka melalui pernyataan persetujuan/kesiapan |
| Aktif | Melibatkan diri dengan cerita dan tokoh secara langsung | Dilakukan setelah membaca bagian cerita melalui respons pengalaman yang mirip/tidak mirip |
| Kritis | Menelaah makna, emosi, dan nilai budaya | Siswa menulis refleksi tentang tokoh, konflik, nilai, atau pengalaman yang berelasi |
| Terbuka | Menyadari bahwa cara dan keputusan berbeda boleh dilakukan | Siswa menyusun kemungkinan respons atau cara pandang baru |
| Imersif | Membuat gagasan baru untuk dimasukkan ke isi cerita | Siswa menulis dukungan, gagasan, atau tambahan adegan reflektif |

---

## 4. Deskripsi Karya

LITERATERAPI-SAKTI adalah aplikasi web yang terdiri atas:

1. Landing page bilingual Indonesia dan Malaysia.
2. Sistem login dan registrasi berbasis Supabase Auth.
3. Dashboard siswa dengan avatar, tema, level, XP, hadiah, statistik progres, dan rekomendasi cerita.
4. Pustaka cerita dengan filter negara dan kategori perasaan/kebutuhan reflektif.
5. Halaman pembaca cerita dengan ilustrasi adegan, musik latar, simulasi napas, prompt S-A-K-T-I, tombol selesai, dan animasi penyelesaian.
6. Dashboard fasilitator untuk memantau siswa dampingan dan membuat catatan pendampingan.
7. Dashboard konselor/pendamping psikologis untuk tindak lanjut non-diagnostik.
8. Dashboard moderator untuk laporan konten dan catatan keamanan.
9. Dashboard editor konten untuk kurasi cerita, status revisi, catatan editorial, dan pembuatan draft cerita baru.
10. Dashboard ahli untuk rubrik tinjauan budaya, usia, bahasa non-klinis, kategori publik, dan afirmasi S-A-K-T-I.
11. Dashboard peneliti untuk melihat grafik agregat tanpa identitas siswa.
12. Dashboard administrator untuk pengelolaan akun, role, kelas, siswa, dan kesehatan sistem.

---

## 5. Inventaris Konten Cerita

Pada versi ini, aplikasi memuat 19 cerpen:

- 12 cerpen berkonteks Indonesia.
- 7 cerpen berkonteks Malaysia.

Contoh judul Indonesia:

1. Bintang yang Tidak Hilang
2. Cahaya yang Selalu Ada
3. Debu yang Menari
4. Layang-layang di Atas Kerikil
5. Pasar Malam di Dalam Kepalaku
6. Satu Keping Sagu untuk Berdua
7. Hidup di Dalam Ceritamu Sendiri
8. Warisan Tanpa Nama
9. Langit yang Belajar Hujan
10. Nyala yang Tidak Pernah Berkurang
11. Suara yang Hanya Aku Dengar
12. Tubuhku Bukan Musuhku

Contoh judul Malaysia:

1. Suara di Balai Muafakat
2. Kabus di Kaki Bukit
3. Cermin di Bilik Andam
4. Pintu Rumah Panjang
5. Bunga Api dalam Kepala Ammar
6. Ruang di Bawah Bumbung Rumah Panjang
7. Jalan Pulang ke Rumah Panjang

Setiap cerita memiliki metadata, estimasi waktu baca, kategori publik, gambar sampul, dan ilustrasi adegan. Sebagian cerita juga memiliki pemetaan gambar adegan agar visual lebih sinkron dengan konteks naratif.

---

## 6. Kebaruan dan Orisinalitas

Kebaruan LITERATERAPI-SAKTI terletak pada kombinasi komponen berikut:

1. **Kerangka S-A-K-T-I** sebagai alur membaca reflektif yang berurutan dan eksplisit.
2. **Kategori publik non-klinis** yang menjaga pengalaman siswa tetap aman dan tidak memberi label diagnostik.
3. **Koleksi cerpen Indonesia-Malaysia** yang memuat konteks budaya serumpun.
4. **Integrasi gamifikasi ringan** berupa XP, level, hadiah, dan layar penyelesaian.
5. **Pendampingan berbasis role** yang membedakan siswa, fasilitator, konselor, moderator, editor, ahli, peneliti, dan admin.
6. **Dashboard penelitian agregat** untuk membaca pola penggunaan tanpa membuka identitas siswa.
7. **Studio draft cerita** yang memungkinkan editor membuat naskah, metadata, prompt S-A-K-T-I, serta mengunggah gambar sampul dan adegan tanpa menulis script.
8. **Pengamanan teknis berbasis Supabase RLS** untuk membatasi akses data sesuai peran.
9. **Bilingual antarmuka dan cerita** untuk pengguna Indonesia dan Malaysia.

Karya ini bukan sekadar kumpulan cerpen digital, melainkan sistem terpadu yang menggabungkan kurasi cerita, alur refleksi, perlindungan akses, pendampingan, tinjauan ahli, dan data agregat.

---

## 7. Arsitektur Sistem

### 7.1 Teknologi Utama

| Lapisan | Teknologi |
| --- | --- |
| Frontend dan server rendering | Next.js App Router |
| Bahasa pemrograman | TypeScript |
| Styling | Tailwind CSS |
| Autentikasi | Supabase Auth |
| Basis data | Supabase Postgres |
| Keamanan data | Row Level Security, role helper, middleware route protection |
| Penyimpanan aset draft | Supabase Storage bucket privat |
| Hosting produksi | Vercel |
| Internationalization | next-intl |

### 7.2 Modul Utama

1. **Modul publik**: landing page, tentang, panduan, privasi, login, registrasi.
2. **Modul siswa**: dashboard, pustaka, pembaca cerita, refleksi, progres, gamifikasi.
3. **Modul pendamping**: kelas, siswa dampingan, catatan, status tindak lanjut.
4. **Modul konselor**: tindak lanjut psikologis non-diagnostik.
5. **Modul editor**: katalog editorial, status revisi, catatan editorial, draft studio.
6. **Modul ahli**: rubrik tinjauan cerita.
7. **Modul moderator**: laporan konten dan keamanan bahasa.
8. **Modul peneliti**: grafik agregat dan data anonim.
9. **Modul admin**: role, akun, kelas, siswa, dan kesehatan sistem.

### 7.3 Proteksi Akses

Halaman seperti `/pustaka`, `/dashboard`, `/cerita/[slug]/baca`, `/fasilitator`, `/konselor`, `/moderator`, `/editor-konten`, `/ahli`, `/peneliti`, `/admin`, dan `/penelitian` dilindungi oleh middleware. Pengguna tanpa sesi login diarahkan ke halaman masuk. Validasi role otoritatif dilakukan di Server Component/Server Action.

---

## 8. Struktur Data dan Keamanan

Aplikasi menggunakan Supabase dengan tabel antara lain:

- `profiles`
- `user_roles`
- `user_preferences`
- `classes`
- `class_members`
- `reading_progress`
- `reflection_entries`
- `companion_notes`
- `content_review_notes`
- `content_safety_reports`
- `story_review_statuses`
- `expert_story_rubrics`
- `editor_story_drafts`

Prinsip keamanan:

1. RLS aktif pada tabel publik.
2. Role browser tidak mendapat akses berlebih seperti truncate atau delete yang tidak diperlukan.
3. Service role tidak dikirim ke browser.
4. Data siswa hanya dapat diakses sesuai peran.
5. Dashboard penelitian menggunakan agregasi dan tidak menampilkan identitas personal siswa.
6. Gambar draft editor disimpan di bucket privat selama belum dipublikasikan.

---

## 9. Alur Penggunaan Siswa

1. Siswa login.
2. Siswa masuk ke dashboard.
3. Siswa memilih avatar dan tema.
4. Siswa memilih cerita berdasarkan negara, kategori publik, dan perasaan/kebutuhan reflektif.
5. Sebelum membaca, siswa menjalani tahap Sadar dan simulasi napas.
6. Siswa membaca cerita dengan ilustrasi adegan dan musik latar lembut.
7. Siswa merespons tahap Aktif, Kritis, Terbuka, dan Imersif.
8. Setelah selesai, siswa menekan tombol selesai.
9. Aplikasi menampilkan animasi penyelesaian, XP, level, dan hadiah.
10. Progres tersimpan sebagai perjalanan membaca, bukan penilaian diri.

---

## 10. Alur Tata Kelola Konten

1. Editor membuat draft cerita melalui dashboard.
2. Editor mengisi teks Indonesia/Malaysia, sinopsis, kategori, metadata, prompt S-A-K-T-I, dan aset visual.
3. Draft disimpan dengan status editorial.
4. Moderator dapat melihat kebutuhan moderasi.
5. Ahli memberi rubrik tinjauan.
6. Editor memperbaiki cerita, gambar, atau prompt.
7. Konten yang siap dipublikasikan dipindahkan ke alur publikasi cerita.

Pada versi saat ini, draft baru belum otomatis tampil di pustaka siswa. Hal ini disengaja sebagai pengaman mutu.

---

## 11. Batasan Etis dan Non-Klinis

Aplikasi ini memiliki batasan sebagai berikut:

1. Tidak melakukan diagnosis.
2. Tidak menggantikan psikolog, psikiater, konselor sekolah, atau tenaga kesehatan.
3. Tidak menggunakan label klinis pada tampilan siswa.
4. Tidak menyimpulkan kondisi mental siswa dari respons membaca.
5. Tidak menjanjikan penyembuhan.
6. Mengarahkan pendamping untuk memakai bahasa aman, suportif, dan tidak menghakimi.
7. Menggunakan data penelitian secara agregat.

Jika dalam implementasi lapangan muncul risiko keselamatan atau indikasi kebutuhan bantuan profesional, pendamping manusia perlu mengikuti protokol sekolah/lembaga yang berlaku.

---

## 12. Ruang Lingkup Ciptaan yang Diajukan

Ruang lingkup yang disarankan untuk dicantumkan dalam pencatatan hak cipta:

1. Program komputer LITERATERAPI-SAKTI.
2. Desain alur membaca S-A-K-T-I.
3. Desain antarmuka aplikasi.
4. Struktur dashboard pengguna dan role.
5. Basis data dan migrasi yang disusun khusus untuk aplikasi.
6. Dokumentasi akademik dan teknis.
7. Naskah cerpen yang diciptakan sendiri atau haknya dimiliki pemohon.
8. Aset visual yang diciptakan sendiri atau hak/lisensinya dimiliki pemohon.

Yang perlu dikecualikan atau dijelaskan:

1. Library open-source pihak ketiga seperti Next.js, React, Supabase SDK, Tailwind, dan dependensi lain tetap mengikuti lisensi masing-masing.
2. Infrastruktur pihak ketiga seperti Supabase dan Vercel bukan bagian yang diklaim sebagai ciptaan sendiri.
3. Aset visual yang dibuat pihak ketiga atau berbasis AI perlu dicatat sumber, lisensi, dan status haknya.
4. Konsep umum membaca reflektif atau edukasi digital tidak diklaim secara mutlak; yang diklaim adalah ekspresi, desain sistem, naskah, kode, struktur, dan komposisi karya LITERATERAPI-SAKTI.

### 12.1 Status Hak Aset Visual dan Musik

Status hak aset pendukung yang telah dicatat untuk versi dokumen ini:

| Jenis aset | Sumber/pembuatan | Status hak/keterangan |
| --- | --- | --- |
| Logo LITERATERAPI-SAKTI | Dibuat menggunakan AI ChatGPT berdasarkan arahan pengguna/pemohon. | Dicatat sebagai aset visual hasil keluaran AI yang digunakan sebagai identitas aplikasi. Pemohon perlu menyimpan bukti proses pembuatan, prompt/brief, tanggal pembuatan, dan file final. |
| Gambar animasi dan ilustrasi pendukung | Dibuat menggunakan AI ChatGPT berdasarkan arahan pengguna/pemohon. | Dicatat sebagai aset visual hasil keluaran AI untuk mendukung antarmuka, dashboard, dan pengalaman membaca. Pemohon perlu menyimpan bukti proses pembuatan dan memastikan tidak memakai gambar pihak ketiga tanpa izin. |
| Musik latar | Musik royalty-free dari Bensound. | Digunakan sebagai musik latar berlisensi, bukan diklaim sebagai ciptaan musik milik LITERATERAPI-SAKTI. Pemohon perlu menyimpan bukti unduhan/lisensi, judul track, URL sumber, tanggal unduhan, dan teks atribusi bila memakai Free License with Attribution. |
| Naskah cerpen | Disusun/dikurasi untuk LITERATERAPI-SAKTI. | Diklaim apabila naskah dibuat sendiri atau haknya dimiliki/dialihkan kepada pemohon. Setiap cerpen perlu dicatat judul, penulis/pencipta, tanggal pembuatan, dan status hak. |

Catatan kehati-hatian: istilah "tanpa copyright" untuk musik sebaiknya tidak dipakai dalam dokumen resmi. Formulasi yang lebih tepat adalah "musik royalty-free/berlisensi dari Bensound sesuai ketentuan lisensi yang berlaku", karena hak cipta atas musik tetap berada pada pemilik/lisensor kecuali ada perjanjian lain.

---

## 13. Bukti Pengembangan

Bukti yang dapat dilampirkan:

1. Screenshot aplikasi: landing page, dashboard siswa, pembaca cerita, dashboard editor, dashboard ahli, dashboard peneliti, dashboard admin.
2. Cuplikan kode sumber inti.
3. Daftar migrasi Supabase.
4. Daftar cerpen dan aset.
5. Dokumentasi README.
6. URL produksi.
7. Riwayat build/deploy.
8. Naskah akademik ini.

### 13.1 Paket Lampiran Final

Paket lampiran final yang disarankan untuk disertakan bersama naskah akademik:

| Kode lampiran | Nama lampiran | Isi utama | Status |
| --- | --- | --- | --- |
| Lampiran A | Naskah akademik LITERATERAPI-SAKTI | Dasar konseptual, tujuan, kebaruan, struktur aplikasi, status hak aset, dan rujukan resmi | Tersusun dalam dokumen ini |
| Lampiran B | Cuplikan source code | Proteksi rute, role, dashboard siswa, preferensi siswa, dukungan dua bahasa, editor konten, dashboard peneliti, dan skema Supabase/RLS | Tersusun sebagai dokumen terpisah |
| Lampiran C | Daftar cerpen dan aset cerita | Judul cerpen, negara/bahasa, kategori publik, sampul, ilustrasi adegan, dan status hak naskah | Perlu dilampirkan dari inventaris konten |
| Lampiran D | Screenshot aplikasi | Landing page, pustaka cerita, dashboard siswa, halaman baca, animasi selesai, dashboard role, dan admin | Perlu diambil dari versi produksi |
| Lampiran E | Bukti aset visual AI | Prompt/brief, tanggal pembuatan, file final logo, gambar animasi, dan ilustrasi pendukung yang dibuat menggunakan AI ChatGPT | Perlu disimpan oleh pemohon |
| Lampiran F | Bukti lisensi musik | Judul track Bensound, URL sumber, tanggal unduhan, jenis lisensi, dan teks atribusi/lisensi | Perlu disimpan oleh pemohon |
| Lampiran G | Bukti publikasi/deploy | URL produksi, tanggal publikasi pertama, riwayat build/deploy, dan versi aplikasi | Perlu dilengkapi saat pengajuan |
| Lampiran H | Dokumen pernyataan | Surat pernyataan kepemilikan ciptaan dan/atau surat pengalihan hak bila diperlukan | Mengikuti formulir/ketentuan DJKI |

---

## 14. Kesesuaian dengan Pencatatan Hak Cipta Program Komputer

DJKI menyediakan kanal pencatatan hak cipta dan memuat informasi tentang syarat/prosedur hak cipta. DJKI juga menjelaskan bahwa program komputer memiliki masa perlindungan tersendiri, yaitu 50 tahun sejak pertama kali dipublikasikan. Karena itu, LITERATERAPI-SAKTI dapat disiapkan sebagai ciptaan kategori program komputer/aplikasi, dengan lampiran pendukung berupa dokumentasi, tangkapan layar, deskripsi fungsi, dan bagian kode sumber yang diperlukan.

Rujukan resmi:

1. DJKI, "Hak Cipta - Syarat dan Prosedur Permohonan": https://www.dgip.go.id/menu-utama/hak-cipta/syarat-prosedur
2. DJKI, "Hak Cipta - Pengenalan": https://www.dgip.go.id/menu-utama/hak-cipta/pengenalan
3. DJKI, "Program Komputer Dilindungi Dalam Paten atau Hak Cipta?": https://www.dgip.go.id/artikel/detail-artikel-berita/program-komputer-dilindungi-dalam-paten-atau-hak-cipta?kategori=liputan-humas
4. OpenAI, "Terms of Use": https://openai.com/policies/row-terms-of-use/
5. Bensound, "Terms of Use": https://www.bensound.com/terms-and-conditions
6. Bensound, "Frequently Asked Questions": https://www.bensound.com/faq

---

## 15. Checklist Final Lampiran Pengajuan

Checklist final:

- [x] Nama pengembang aplikasi: Vismaia S. Damaianti; Rosita Rahma; Lira Fessia Damaianti; Tofan Stofiana; Dedi Irawan; Muhammad Pahruroji.
- [x] Deskripsi singkat aplikasi untuk formulir pencatatan.
- [x] Cuplikan kode sumber yang representatif.
- [x] Dokumen naskah akademik final.
- [x] File aplikasi atau tautan produksi: https://literaterapi-sakti-next.vercel.app.
- [x] Bukti kepemilikan/lisensi gambar dan musik latar: logo dan gambar animasi dibuat menggunakan AI ChatGPT; musik latar menggunakan musik royalty-free/berlisensi dari Bensound. Bukti prompt, file final, judul track, URL sumber, dan teks atribusi/lisensi Bensound tetap perlu disimpan.
- [ ] Nama pemegang hak cipta final sesuai formulir DJKI.
- [ ] Kewarganegaraan dan alamat pemohon.
- [ ] Tanggal dan tempat pertama kali dipublikasikan.
- [ ] Surat pernyataan kepemilikan ciptaan.
- [ ] Surat pengalihan hak bila pencipta dan pemegang hak berbeda.
- [ ] Identitas pemohon/pemegang hak.
- [ ] Screenshot aplikasi dari versi produksi.
- [ ] Daftar naskah cerita yang diklaim beserta status pencipta/pemegang haknya.
- [ ] Bukti lisensi/atribusi Bensound yang spesifik untuk track yang dipakai.

---

## 16. Pernyataan Orisinalitas Draft

LITERATERAPI-SAKTI merupakan karya aplikasi edukatif yang dikembangkan secara khusus untuk membaca reflektif berbasis cerpen dengan kerangka S-A-K-T-I. Karya ini menggabungkan rancangan pedagogis, naskah cerita, desain alur pengguna, desain basis data, desain dashboard role, dan implementasi perangkat lunak yang disusun untuk kebutuhan pengguna Indonesia dan Malaysia. Sepanjang pengetahuan penyusun, komposisi sistem, alur S-A-K-T-I, struktur peran, dan integrasi konten yang dijelaskan dalam naskah ini merupakan rancangan orisinal yang dikembangkan untuk aplikasi LITERATERAPI-SAKTI.

---

## 17. Template Halaman Cuplikan Source Code

Bagian ini digunakan untuk menyiapkan lampiran cuplikan source code yang akan disertakan dalam berkas pendukung pencatatan hak cipta program komputer. Setiap cuplikan kode sebaiknya dibuat pada halaman atau subbagian tersendiri agar pemeriksa dapat mengetahui lokasi file, versi kode, dan fungsi file secara jelas.

### 17.1 Template Wajib

Gunakan format berikut untuk setiap cuplikan source code:

| Elemen | Isian |
| --- | --- |
| Nama file/path | `src/middleware.ts` |
| Versi/commit | `v0.1.0-HAKI-draft-2026-08-08` |
| Fungsi file | Mengatur proteksi awal rute aplikasi agar halaman siswa, cerita, dan dashboard role tidak dapat diakses tanpa sesi pengguna. |
| Cuplikan source code | Bagian konfigurasi rute terlindungi dan fungsi pemeriksaan cookie autentikasi. |
| Catatan orisinalitas | Menunjukkan rancangan akses aplikasi LITERATERAPI-SAKTI yang membedakan halaman publik dan halaman pengguna terdaftar. |

### 17.2 Contoh Format Pengisian

| Elemen | Contoh |
| --- | --- |
| Nama file/path | `src/middleware.ts` |
| Versi/commit | `v0.1.0-HAKI-draft-2026-08-08` |
| Fungsi file | Mengatur proteksi awal rute aplikasi agar halaman siswa, cerita, dan dashboard role tidak dapat diakses tanpa sesi pengguna. |
| Cuplikan source code | Bagian konfigurasi rute terlindungi dan fungsi pemeriksaan cookie autentikasi. |
| Catatan orisinalitas | Menunjukkan rancangan akses aplikasi LITERATERAPI-SAKTI yang membedakan halaman publik dan halaman pengguna terdaftar. |

### 17.3 Daftar File yang Disarankan untuk Lampiran

File berikut dapat dipilih sebagai cuplikan kode sumber inti:

1. `src/middleware.ts` - proteksi rute dan lokalisasi awal.
2. `src/lib/permissions/requireRole.ts` - pengamanan akses berbasis peran.
3. `src/components/student/StudentDashboard.tsx` - dashboard siswa, avatar, tema, progress, dan gamifikasi.
4. `src/lib/student/actions.ts` - aksi penyimpanan preferensi dan progres siswa.
5. `src/hooks/useAutoTranslatedStory.ts` - logika dukungan dua bahasa pada cerita.
6. `src/components/facilitator/FacilitatorDashboard.tsx` - dashboard pendamping/fasilitator.
7. `src/lib/roles/editorStoryDrafts.ts` - pengelolaan draft cerita oleh editor konten.
8. `src/lib/research/dashboardData.ts` - data agregat untuk dashboard peneliti.
9. `supabase/migrations/0001_core_schema.sql` - struktur awal basis data dan fungsi role.
10. `supabase/migrations/0011_editor_story_drafts.sql` - struktur draft cerita dan aset editor konten.

Catatan: commit atau versi final sebaiknya diambil dari repositori produksi/GitHub/Vercel pada saat dokumen HAKI difinalisasi. Jika aplikasi diajukan sebagai paket kode tanpa repository publik, gunakan kode versi rilis, tanggal rilis, atau nomor versi internal yang konsisten pada seluruh lampiran.

---

## 18. Penutup

Naskah akademik ini menunjukkan bahwa LITERATERAPI-SAKTI memiliki dasar konseptual, desain sistem, struktur teknis, batas etis, dan unsur kebaruan yang layak didokumentasikan sebagai ciptaan program komputer beserta karya pendukungnya. Dokumen ini dapat menjadi dasar penyiapan lampiran pencatatan hak cipta, pengembangan dokumentasi produk, serta komunikasi akademik kepada sekolah, lembaga, atau mitra penelitian.

Tahap lanjutan yang disarankan adalah:

1. Melengkapi identitas pencipta dan pemegang hak.
2. Status hak seluruh cerpen, gambar, logo, dan musik telah mulai dicatat: logo dan gambar animasi dibuat menggunakan AI ChatGPT, sedangkan musik latar menggunakan musik royalty-free/berlisensi dari Bensound. Bukti teknis dan dokumen lisensi tetap perlu dilampirkan saat finalisasi.
3. Mengambil screenshot versi produksi.
4. Menyiapkan cuplikan kode sumber.
5. Mengubah dokumen ini ke format DOCX/PDF.
6. Memeriksa kembali persyaratan terbaru pada laman resmi DJKI sebelum pengajuan.
