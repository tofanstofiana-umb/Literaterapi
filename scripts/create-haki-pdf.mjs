import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const inputPath = path.join(root, "docs", "naskah-akademik-haki-literaterapi-sakti.md");
const outDir = path.join(root, "docs", "dist");
const outputPath = process.env.HAKI_PDF_OUTPUT
  ? path.resolve(root, process.env.HAKI_PDF_OUTPUT)
  : path.join(outDir, "Naskah Akademik HAKI LITERATERAPI-SAKTI.pdf");

const PAGE = { width: 612, height: 792 };
const MARGIN = { left: 54, right: 54, top: 58, bottom: 56 };
const usableWidth = PAGE.width - MARGIN.left - MARGIN.right;

function cleanText(value) {
  return String(value ?? "")
    .replace(/\r/g, "")
    .replace(/[`*_]/g, "")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)")
    .replace(/^- \[ \] /, "[ ] ")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/☐/g, "[ ]")
    .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, "")
    .trim();
}

function pdfEscape(value) {
  return cleanText(value)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function textWidth(text, size, font = "regular") {
  const factor = font === "bold" ? 0.55 : 0.51;
  return cleanText(text).length * size * factor;
}

function wrapText(text, size, maxWidth, font = "regular") {
  const words = cleanText(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (textWidth(candidate, size, font) <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      if (textWidth(word, size, font) > maxWidth) {
        let fragment = "";
        for (const char of word) {
          const next = `${fragment}${char}`;
          if (textWidth(next, size, font) <= maxWidth) fragment = next;
          else {
            if (fragment) lines.push(fragment);
            fragment = char;
          }
        }
        current = fragment;
      } else {
        current = word;
      }
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

function parseBlocks(markdown) {
  const blocks = [];
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i];
    const line = raw.trim();
    if (!line || line === "---") {
      blocks.push({ type: "space" });
      continue;
    }
    if (line.startsWith("|")) {
      const rows = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        const current = lines[i].trim();
        if (!/^\|\s*-+/.test(current)) {
          rows.push(
            current
              .replace(/^\|/, "")
              .replace(/\|$/, "")
              .split("|")
              .map((cell) => cleanText(cell)),
          );
        }
        i += 1;
      }
      i -= 1;
      blocks.push({ type: "table", rows });
      continue;
    }
    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      blocks.push({ type: "heading", level: heading[1].length, text: cleanText(heading[2]) });
      continue;
    }
    const number = line.match(/^(\d+)\.\s+(.+)$/);
    if (number) {
      blocks.push({ type: "number", text: cleanText(`${number[1]}. ${number[2]}`) });
      continue;
    }
    const bullet = line.match(/^-\s+(.+)$/);
    if (bullet) {
      blocks.push({ type: "bullet", text: cleanText(`- ${bullet[1]}`) });
      continue;
    }
    const quote = line.match(/^>\s+(.+)$/);
    if (quote) {
      blocks.push({ type: "quote", text: cleanText(quote[1]) });
      continue;
    }
    blocks.push({ type: "para", text: cleanText(line) });
  }
  return blocks;
}

const pages = [];
let commands = [];
let y = PAGE.height - MARGIN.top;
let pageNumber = 1;

function addPage() {
  if (commands.length) pages.push(commands.join("\n"));
  commands = [];
  y = PAGE.height - MARGIN.top;
  pageNumber += 1;
}

function ensureSpace(height) {
  if (y - height < MARGIN.bottom) addPage();
}

function drawTextLine(text, x, size, fontName = "F1", color = "0 0 0") {
  commands.push(`BT ${color} rg /${fontName} ${size} Tf 1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm (${pdfEscape(text)}) Tj ET`);
}

function drawParagraph(text, options = {}) {
  const size = options.size ?? 10.5;
  const lineHeight = options.lineHeight ?? size * 1.45;
  const x = options.x ?? MARGIN.left;
  const width = options.width ?? usableWidth;
  const font = options.font ?? "regular";
  const fontName = font === "bold" ? "F2" : "F1";
  const color = options.color ?? "0.08 0.18 0.16";
  const lines = wrapText(text, size, width, font);
  ensureSpace(lines.length * lineHeight + (options.after ?? 5));
  for (const line of lines) {
    drawTextLine(line, x, size, fontName, color);
    y -= lineHeight;
  }
  y -= options.after ?? 5;
}

function drawHeading(text, level) {
  const sizes = { 1: 22, 2: 16, 3: 13, 4: 11.5 };
  const before = level <= 2 ? 14 : 10;
  const after = level <= 2 ? 8 : 5;
  y -= before;
  drawParagraph(text, {
    size: sizes[level] ?? 11.5,
    lineHeight: (sizes[level] ?? 11.5) * 1.2,
    font: "bold",
    color: level === 1 ? "0.04 0.15 0.28" : "0.18 0.45 0.71",
    after,
  });
}

function drawRule() {
  ensureSpace(14);
  commands.push(`0.84 0.88 0.92 RG 0.75 w ${MARGIN.left} ${y.toFixed(2)} m ${PAGE.width - MARGIN.right} ${y.toFixed(2)} l S`);
  y -= 10;
}

function drawFooter() {
  const footer = `LITERATERAPI-SAKTI - Naskah Akademik HAKI - Halaman ${pages.length + 1}`;
  commands.push(`BT 0.42 0.45 0.50 rg /F3 8 Tf 1 0 0 1 ${MARGIN.left} 32 Tm (${pdfEscape(footer)}) Tj ET`);
}

function finalizeCurrentPage() {
  drawFooter();
  pages.push(commands.join("\n"));
}

const markdown = readFileSync(inputPath, "utf8");
const blocks = parseBlocks(markdown);

drawParagraph("Naskah Akademik Pencatatan Hak Cipta", {
  size: 22,
  lineHeight: 27,
  font: "bold",
  color: "0.04 0.15 0.28",
  after: 8,
});
drawParagraph("LITERATERAPI-SAKTI", {
  size: 24,
  lineHeight: 30,
  font: "bold",
  color: "0.18 0.45 0.71",
  after: 10,
});
drawParagraph("Ruang Membaca Reflektif untuk Mengenal Diri dan Sesama", {
  size: 13,
  lineHeight: 19,
  color: "0.12 0.25 0.34",
  after: 20,
});
drawRule();
drawParagraph("Status dokumen: Final akademik pendukung pencatatan HAKI", { size: 10.5 });
drawParagraph(
  "Pengembang aplikasi: Vismaia S. Damaianti; Rosita Rahma; Lira Fessia Damaianti; Tofan Stofiana; Dedi Irawan; Muhammad Pahruroji",
  { size: 10.5 },
);
drawParagraph(
  "Pemegang hak cipta: Para pengembang LITERATERAPI-SAKTI, sepanjang tidak ditentukan lain dalam surat pernyataan atau pengalihan hak cipta",
  { size: 10.5 },
);
drawParagraph("Tanggal versi: 8 Agustus 2026", { size: 10.5 });
drawParagraph("URL produksi: https://literaterapi-sakti-next.vercel.app", { size: 10.5 });
drawParagraph(
  "Catatan: lengkapi data administratif pemohon, tanggal/tempat publikasi pertama, surat pernyataan, dan lampiran resmi sesuai ketentuan DJKI sebelum pengajuan.",
  { size: 10.5 },
);
addPage();

let start = false;
for (const block of blocks) {
  if (!start) {
    if (block.type === "heading" && block.text === "Abstrak") start = true;
    else continue;
  }
  if (block.type === "space") {
    y -= 2;
    continue;
  }
  if (block.type === "heading") {
    drawHeading(block.text, block.level);
    continue;
  }
  if (block.type === "bullet" || block.type === "number") {
    drawParagraph(block.text, { x: MARGIN.left + 16, width: usableWidth - 16, size: 10.2, after: 3 });
    continue;
  }
  if (block.type === "quote") {
    drawParagraph(block.text, {
      x: MARGIN.left + 14,
      width: usableWidth - 28,
      size: 10.2,
      color: "0.18 0.36 0.50",
      after: 8,
    });
    continue;
  }
  if (block.type === "table") {
    ensureSpace(18);
    drawRule();
    for (const [index, row] of block.rows.entries()) {
      const text = row.join(" | ");
      drawParagraph(text, {
        x: MARGIN.left + 10,
        width: usableWidth - 20,
        size: index === 0 ? 9.6 : 9.2,
        font: index === 0 ? "bold" : "regular",
        color: "0.09 0.13 0.18",
        after: 2,
      });
    }
    drawRule();
    continue;
  }
  drawParagraph(block.text, { size: 10.5 });
}

finalizeCurrentPage();

function makeObject(body) {
  return `${body}`;
}

function buildPdf() {
  const objects = [];
  const pageObjectIds = [];
  const contentObjectIds = [];

  objects.push(makeObject("<< /Type /Catalog /Pages 2 0 R >>"));
  objects.push("");
  objects.push(makeObject("<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman >>"));
  objects.push(makeObject("<< /Type /Font /Subtype /Type1 /BaseFont /Times-Bold >>"));
  objects.push(makeObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"));

  for (const page of pages) {
    const contentId = objects.length + 1;
    const content = Buffer.from(page, "latin1");
    objects.push(`<< /Length ${content.length} >>\nstream\n${page}\nendstream`);
    contentObjectIds.push(contentId);

    const pageId = objects.length + 1;
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE.width} ${PAGE.height}] /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R >> >> /Contents ${contentId} 0 R >>`,
    );
    pageObjectIds.push(pageId);
  }

  objects[1] = `<< /Type /Pages /Count ${pageObjectIds.length} /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] >>`;

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, "latin1"));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(pdf, "latin1");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i < offsets.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(pdf, "latin1");
}

mkdirSync(outDir, { recursive: true });
writeFileSync(outputPath, buildPdf());
console.log(outputPath);
