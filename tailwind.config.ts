import type { Config } from "tailwindcss";

// Palet warna sementara/placeholder — belum final secara identitas visual
// (lihat PRD bagian 11: "ilustrasi orisinal, kartu membulat, warna cerah
// tapi tidak berlebihan"). Ini cukup untuk fondasi teknis; identitas visual
// penuh (ilustrasi, tema avatar, dst.) adalah pekerjaan fase MVP/Pilot,
// bukan fondasi ini.
const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/features/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        sakti: {
          paper: "rgb(var(--color-sakti-paper) / <alpha-value>)",
          forest: "rgb(var(--color-sakti-forest) / <alpha-value>)",
          forestDark: "rgb(var(--color-sakti-forest-dark) / <alpha-value>)",
          gold: "rgb(var(--color-sakti-gold) / <alpha-value>)",
          mist: "rgb(var(--color-sakti-mist) / <alpha-value>)",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        sakti: "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
