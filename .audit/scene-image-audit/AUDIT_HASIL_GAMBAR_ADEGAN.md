# Audit Hasil Gambar Adegan

Audit ini memeriksa kecocokan ilustrasi dengan konteks paragraf di reader. Acuan utamanya adalah kesinambungan tokoh, lokasi, tindakan, dan urutan emosi dalam cerita.

## Keputusan Implementasi

- Pemetaan otomatis dipertahankan hanya untuk cerpen yang gambar dan urutannya sudah cukup sinkron.
- Pemetaan manual ditambahkan untuk cerpen yang berisiko salah adegan, salah tokoh, atau gambar menumpuk di akhir cerita.
- Gambar yang terlalu rancu, duplikatif, atau tidak sesuai konteks ditahan dari reader sementara, bukan dihapus dari folder aset.
- Pada audit lanjutan, gambar yang jelas tidak sinkron diganti dengan aset baru yang dibuat khusus sesuai adegan.

## Cerpen yang Dipetakan Manual

- Bintang yang Tidak Hilang: gambar malam berbintang dipindahkan ke bagian refleksi akhir, bukan adegan dokter.
- Debu yang Menari: gambar aktivitas luar yang tidak cocok dengan paragraf diagnosis tidak lagi ditampilkan di titik tersebut.
- Layang-layang di Atas Kerikil: gambar pantai/layang-layang difokuskan ke bagian penutup, bukan adegan guru BK.
- Pasar Malam di Dalam Kepalaku: gambar membaca/presentasi diganti ke aset baru Dika membaca puisi; gambar pendamping perempuan/teks konteks cerita lain ditarik dari adegan Pak Yusuf dan diganti dengan aset baru Pak Yusuf laki-laki yang mendampingi Dika.
- Satu Keping Sagu untuk Berdua: gambar ujian lisan dan kegiatan kelompok digeser ke paragraf yang sesuai.
- Langit yang Belajar Hujan: gambar pelukan ayah setelah berenang dipakai untuk adegan kolam; gambar nenek tidak lagi muncul di adegan tersebut.
- Suara yang Hanya Aku Dengar: gambar teman sebaya tidak lagi ditempatkan pada paragraf ayah/dokter/psikolog.
- Suara yang Hanya Aku Dengar: aset baru Dimas bersama ayah dan profesional ditambahkan ke bagian dukungan/pendampingan profesional.
- Tubuhku Bukan Musuhku: gambar lukisan hitam tidak lagi ditempatkan di paragraf cermin.
- Kabus di Kaki Bukit: gambar sungai, kamar, sekolah, dan pendamping dipasang sesuai lokasi adegan.
- Cermin di Bilik Andam: variasi gambar akhir dikurangi agar tidak menumpuk pada paragraf terakhir.
- Pintu Rumah Panjang: gambar pintu rusak, muafakat, perbaikan pintu, dan kantin diurutkan sesuai alur.
- Bunga Api dalam Kepala Ammar: gambar kemenangan lomba sains dipindahkan ke bagian pertandingan.
- Ruang di Bawah Bumbung Rumah Panjang: variasi gambar akhir dikurangi dan adegan komunitas dipasang di bagian muafakat.
- Jalan Pulang ke Rumah Panjang: gambar jurnal, pemulihan, dan dukungan Tok Ngah dipasang sesuai urutan adegan.

## Cerpen yang Tetap Otomatis

- Cahaya yang Selalu Ada
- Hidup di Dalam Ceritamu Sendiri
- Warisan Tanpa Nama
- Nyala yang Tidak Pernah Berkurang

## Berkas Pendukung

- `audit-input.md`: daftar posisi gambar setelah audit.
- `audit-input.json`: data audit terstruktur.
- `contact-sheets/`: lembar visual per cerpen untuk pemeriksaan manual.
