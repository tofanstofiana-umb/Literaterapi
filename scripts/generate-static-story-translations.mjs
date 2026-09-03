import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const preparedRoot = path.join(root, "content-prepared");
const generatedPath = path.join(root, "src", "content", "storyTranslations.generated.ts");

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function isInstructionalParagraph(paragraph) {
  const text = paragraph.trim();
  return (
    /^Narator:/i.test(text) ||
    /^Mari isi tabel/i.test(text) ||
    /Isilah tabel berikut/i.test(text) ||
    /sudah mengisi tabel/i.test(text) ||
    /Ucapkan kalimat berikut/i.test(text) ||
    /^"Saya membuka diri/i.test(text) ||
    /^"Dengan penuh perhatian/i.test(text) ||
    /^"Mempelajari/i.test(text)
  );
}

function parseStoryMarkdown(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const titleLine = lines.find((line) => line.startsWith("# ")) ?? "# Cerita";
  const title = titleLine.replace(/^#\s+/, "").trim();
  const subtitleLine = lines.find((line) => line.startsWith("_") && line.endsWith("_"));
  const subtitle = subtitleLine ? subtitleLine.replace(/^_/, "").replace(/_$/, "").trim() : "";

  const paragraphs = [];
  let buffer = [];
  const flushBuffer = () => {
    if (!buffer.length) return;
    const paragraph = buffer.join(" ").trim();
    if (paragraph && !isInstructionalParagraph(paragraph)) paragraphs.push(paragraph);
    buffer = [];
  };

  for (const line of lines) {
    if (line.startsWith("# ")) continue;
    if (subtitleLine && line === subtitleLine) continue;
    if (!line.trim()) {
      flushBuffer();
      continue;
    }
    buffer.push(line.trim());
  }
  flushBuffer();

  const notesIndex = paragraphs.findIndex((paragraph) => /^Catatan untuk Pembaca$/i.test(paragraph));
  return { title, subtitle, paragraphs: notesIndex >= 0 ? paragraphs.slice(0, notesIndex) : paragraphs };
}

function buildExcerpt(paragraphs) {
  const text = paragraphs.join(" ");
  return text.length > 180 ? `${text.slice(0, 177).trim()}...` : text;
}

function preserveCase(source, replacement) {
  if (!source) return replacement;
  if (source.toUpperCase() === source) return replacement.toUpperCase();
  if (source[0]?.toUpperCase() === source[0]) return `${replacement[0].toUpperCase()}${replacement.slice(1)}`;
  return replacement;
}

function replaceWords(text, map) {
  return text.replace(/\b[\p{L}'-]+\b/gu, (match) => {
    const replacement = map[match.toLowerCase()];
    return replacement ? preserveCase(match, replacement) : match;
  });
}

const idToMsPhrases = [
  ["orang tua/wali", "ibu bapa/penjaga"],
  ["orang tua", "ibu bapa"],
  ["di dalam", "di dalam"],
  ["tidak apa-apa", "tidak mengapa"],
  ["kapan saja", "bila-bila masa"],
  ["pelan-pelan", "perlahan-lahan"],
  ["teman-teman", "rakan-rakan"],
  ["teman satu kelompok", "rakan satu kumpulan"],
  ["guru bahasa indonesia", "guru Bahasa Indonesia"],
  ["sekolah menengah pertama", "sekolah menengah"],
];

const msToIdPhrases = [
  ["ibu bapa/penjaga", "orang tua/wali"],
  ["ibu bapa", "orang tua"],
  ["tidak mengapa", "tidak apa-apa"],
  ["bila-bila masa", "kapan saja"],
  ["perlahan-lahan", "pelan-pelan"],
  ["rakan-rakan", "teman-teman"],
  ["rakan satu kumpulan", "teman satu kelompok"],
  ["rumah panjang", "rumah panjang"],
  ["balai muafakat", "balai mufakat"],
];

const idToMsWords = {
  adalah: "ialah",
  aku: "aku",
  anda: "awak",
  anak: "anak",
  apalagi: "lebih-lebih lagi",
  apa: "apa",
  bagaimana: "bagaimana",
  bahwa: "bahawa",
  bercerita: "bercerita",
  berada: "berada",
  berbeda: "berbeza",
  bertanya: "bertanya",
  besar: "besar",
  bisa: "boleh",
  boleh: "boleh",
  bunga: "bunga",
  cukup: "cukup",
  dari: "daripada",
  dengan: "dengan",
  diri: "diri",
  dokter: "doktor",
  dua: "dua",
  duduk: "duduk",
  guru: "guru",
  harus: "perlu",
  hidup: "hidup",
  ia: "dia",
  ibu: "ibu",
  ingin: "ingin",
  jangan: "jangan",
  juga: "juga",
  kalau: "jika",
  kami: "kami",
  kamu: "kamu",
  kanan: "kanan",
  karena: "kerana",
  kata: "kata",
  kecil: "kecil",
  kepala: "kepala",
  kembali: "kembali",
  kemudian: "kemudian",
  kepada: "kepada",
  kelas: "kelas",
  kita: "kita",
  kosong: "kosong",
  kuat: "kuat",
  lalu: "lalu",
  lebih: "lebih",
  melihat: "melihat",
  membaca: "membaca",
  membawa: "membawa",
  membuat: "membuat",
  membantu: "membantu",
  membuka: "membuka",
  memberi: "memberi",
  meminta: "meminta",
  menemukan: "menemukan",
  mendapat: "mendapat",
  menjadi: "menjadi",
  menulis: "menulis",
  mereka: "mereka",
  mungkin: "mungkin",
  murid: "murid",
  namun: "namun",
  napas: "nafas",
  nenek: "nenek",
  orang: "orang",
  paling: "paling",
  panjang: "panjang",
  pelan: "perlahan",
  perasaan: "perasaan",
  pernah: "pernah",
  pergi: "pergi",
  pikir: "fikir",
  pikiran: "fikiran",
  punya: "mempunyai",
  rumah: "rumah",
  saat: "ketika",
  saja: "sahaja",
  sama: "sama",
  sangat: "sangat",
  saya: "saya",
  sekolah: "sekolah",
  sendiri: "sendiri",
  seperti: "seperti",
  siapa: "siapa",
  siswa: "murid",
  sudah: "sudah",
  supaya: "supaya",
  takut: "takut",
  tangan: "tangan",
  tapi: "tetapi",
  teman: "rakan",
  tentang: "tentang",
  terasa: "terasa",
  terbaik: "terbaik",
  tidak: "tidak",
  tidur: "tidur",
  tiba: "tiba",
  tubuh: "tubuh",
  untuk: "untuk",
  wajah: "wajah",
  waktu: "masa",
  yang: "yang",
};

const msToIdWords = {
  adalah: "adalah",
  agar: "agar",
  aku: "aku",
  amat: "sangat",
  awak: "kamu",
  bahagian: "bagian",
  bahawa: "bahwa",
  berbeza: "berbeda",
  boleh: "bisa",
  cuma: "hanya",
  dalam: "dalam",
  daripada: "dari",
  dia: "dia",
  doktor: "dokter",
  fikir: "pikir",
  fikiran: "pikiran",
  hendak: "ingin",
  ialah: "adalah",
  jika: "kalau",
  juga: "juga",
  kamu: "kamu",
  kerana: "karena",
  ketika: "saat",
  lagi: "lagi",
  lalu: "lalu",
  masa: "waktu",
  mempunyai: "punya",
  murid: "siswa",
  nafas: "napas",
  pelajar: "siswa",
  perlahan: "pelan",
  punya: "punya",
  rakan: "teman",
  sahaja: "saja",
  saya: "saya",
  sekolah: "sekolah",
  sendiri: "sendiri",
  sangat: "sangat",
  seperti: "seperti",
  tak: "tidak",
  tetapi: "tapi",
  tidak: "tidak",
  untuk: "untuk",
  yang: "yang",
};

function applyPhrases(text, phrases) {
  return phrases.reduce((current, [source, target]) => {
    const pattern = new RegExp(source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "giu");
    return current.replace(pattern, (match) => preserveCase(match, target));
  }, text);
}

function translateDraft(text, sourceLocale, targetLocale) {
  if (sourceLocale === targetLocale) return text;
  if (sourceLocale === "id-ID" && targetLocale === "ms-MY") {
    return replaceWords(applyPhrases(text, idToMsPhrases), idToMsWords);
  }
  if (sourceLocale === "ms-MY" && targetLocale === "id-ID") {
    return replaceWords(applyPhrases(text, msToIdPhrases), msToIdWords);
  }
  return text;
}

const index = readJson(path.join(preparedRoot, "stories.index.json"));
const translations = index.stories.flatMap((entry) => {
  const folder = path.join(root, entry.folder);
  const metadataPath = path.join(folder, "metadata.json");
  const storyPath = path.join(folder, "story.md");
  if (!existsSync(metadataPath) || !existsSync(storyPath)) return [];

  const metadata = readJson(metadataPath);
  const parsed = parseStoryMarkdown(readFileSync(storyPath, "utf8"));
  const targetLocale = metadata.originalLanguage === "id-ID" ? "ms-MY" : "id-ID";
  const paragraphs = parsed.paragraphs.map((paragraph) =>
    translateDraft(paragraph, metadata.originalLanguage, targetLocale),
  );

  return [
    {
      slug: metadata.slug,
      sourceLocale: metadata.originalLanguage,
      targetLocale,
      quality: "draft-offline",
      title: translateDraft(parsed.title, metadata.originalLanguage, targetLocale),
      subtitle: translateDraft(parsed.subtitle, metadata.originalLanguage, targetLocale),
      excerpt: buildExcerpt(paragraphs),
      paragraphs,
    },
  ];
});

const output = `// This file is generated by scripts/generate-static-story-translations.mjs.
// Do not edit by hand; update content-prepared and regenerate instead.

export interface StaticStoryTranslation {
  slug: string;
  sourceLocale: "id-ID" | "ms-MY";
  targetLocale: "id-ID" | "ms-MY";
  quality: "draft-offline";
  title: string;
  subtitle: string;
  excerpt: string;
  paragraphs: string[];
}

export const STORY_STATIC_TRANSLATIONS = ${JSON.stringify(translations, null, 2)} as const satisfies readonly StaticStoryTranslation[];
`;

mkdirSync(path.dirname(generatedPath), { recursive: true });
writeFileSync(generatedPath, output, "utf8");

console.log(`Generated ${translations.length} static story translations`);
console.log(`Wrote ${path.relative(root, generatedPath)}`);
