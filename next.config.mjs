import createNextIntlPlugin from "next-intl/plugin";

// Konfigurasi next-intl membaca src/i18n/request.ts untuk memuat pesan
// per-locale (lihat berkas itu untuk aturan fallback bahasa cerita/UI,
// PRD bagian 9 "Sistem Multibahasa").
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
  // PWA (service worker, manifest) sengaja BELUM ditambahkan di fondasi ini
  // — PRD bagian 3 menyebut PWA sebagai target, tapi itu ditambahkan setelah
  // fondasi routing/i18n/data ini stabil, supaya cache service worker tidak
  // mengganggu iterasi awal (lihat pelajaran dari proyek Vite sebelumnya:
  // service worker basi pernah menyebabkan kebingungan panjang saat debug).
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
