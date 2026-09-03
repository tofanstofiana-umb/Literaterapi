import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const inputPath = path.join(root, "docs", "naskah-akademik-haki-literaterapi-sakti.md");
const outDir = path.join(root, "docs", "dist");
const workDir = path.join(outDir, "_docx_haki_work");
const outputPath = process.env.HAKI_DOCX_OUTPUT
  ? path.resolve(root, process.env.HAKI_DOCX_OUTPUT)
  : path.join(outDir, "Naskah Akademik HAKI LITERATERAPI-SAKTI.docx");

const NS = {
  w: "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
  r: "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
  rel: "http://schemas.openxmlformats.org/package/2006/relationships",
};

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function normalizeInline(text) {
  return text
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)")
    .replace(/^- \[ \] /, "");
}

function p(text, style = "Normal", extra = "") {
  const keep = style.startsWith("Heading") || style === "Title" || style === "Subtitle";
  return `<w:p>${extra}<w:pPr><w:pStyle w:val="${style}"/>${keep ? "<w:keepNext/>" : ""}</w:pPr><w:r><w:t xml:space="preserve">${esc(normalizeInline(text))}</w:t></w:r></w:p>`;
}

function pRun(runs, style = "Normal", extra = "") {
  const body = runs
    .map((run) => {
      const props = [
        run.bold ? "<w:b/>" : "",
        run.italic ? "<w:i/>" : "",
        run.color ? `<w:color w:val="${run.color}"/>` : "",
        run.size ? `<w:sz w:val="${run.size * 2}"/>` : "",
      ].join("");
      return `<w:r>${props ? `<w:rPr>${props}</w:rPr>` : ""}<w:t xml:space="preserve">${esc(run.text)}</w:t></w:r>`;
    })
    .join("");
  return `<w:p>${extra}<w:pPr><w:pStyle w:val="${style}"/></w:pPr>${body}</w:p>`;
}

function pageBreak() {
  return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
}

function listP(text, kind = "bullet") {
  const numId = kind === "number" ? 2 : 1;
  return `<w:p><w:pPr><w:pStyle w:val="ListParagraph"/><w:numPr><w:ilvl w:val="0"/><w:numId w:val="${numId}"/></w:numPr></w:pPr><w:r><w:t xml:space="preserve">${esc(normalizeInline(text))}</w:t></w:r></w:p>`;
}

function checkboxP(text) {
  return `<w:p><w:pPr><w:pStyle w:val="ListParagraph"/><w:ind w:left="720" w:hanging="360"/></w:pPr><w:r><w:t xml:space="preserve">☐ ${esc(normalizeInline(text))}</w:t></w:r></w:p>`;
}

function table(rows) {
  if (!rows.length) return "";
  const cols = rows[0].length;
  const widthsByCols = {
    2: [3000, 6360],
    3: [2200, 3580, 3580],
    4: [1600, 2600, 2580, 2580],
  };
  const widths = widthsByCols[cols] ?? Array.from({ length: cols }, () => Math.floor(9360 / cols));
  const grid = widths.map((width) => `<w:gridCol w:w="${width}"/>`).join("");
  const trs = rows
    .map((row, rowIndex) => {
      const cells = row
        .map((cell, cellIndex) => {
          const fill = rowIndex === 0 ? '<w:shd w:fill="F2F4F7"/>' : "";
          const bold = rowIndex === 0 ? "<w:b/>" : "";
          return `<w:tc><w:tcPr><w:tcW w:w="${widths[cellIndex] ?? widths[0]}" w:type="dxa"/>${fill}</w:tcPr><w:p><w:pPr><w:spacing w:after="60" w:line="280" w:lineRule="auto"/></w:pPr><w:r>${bold ? `<w:rPr>${bold}</w:rPr>` : ""}<w:t xml:space="preserve">${esc(normalizeInline(cell))}</w:t></w:r></w:p></w:tc>`;
        })
        .join("");
      return `<w:tr>${cells}</w:tr>`;
    })
    .join("");
  return `<w:tbl><w:tblPr><w:tblW w:w="9360" w:type="dxa"/><w:tblInd w:w="120" w:type="dxa"/><w:tblBorders><w:top w:val="single" w:sz="4" w:color="D9E0EA"/><w:left w:val="single" w:sz="4" w:color="D9E0EA"/><w:bottom w:val="single" w:sz="4" w:color="D9E0EA"/><w:right w:val="single" w:sz="4" w:color="D9E0EA"/><w:insideH w:val="single" w:sz="4" w:color="D9E0EA"/><w:insideV w:val="single" w:sz="4" w:color="D9E0EA"/></w:tblBorders><w:tblCellMar><w:top w:w="80" w:type="dxa"/><w:left w:w="120" w:type="dxa"/><w:bottom w:w="80" w:type="dxa"/><w:right w:w="120" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>${grid}</w:tblGrid>${trs}</w:tbl>`;
}

function parseMarkdown(markdown) {
  const blocks = [];
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line.trim() || line.trim() === "---") continue;
    if (line.trim().startsWith("> ")) {
      blocks.push({ type: "callout", text: line.trim().replace(/^> /, "") });
      continue;
    }
    if (line.trim().startsWith("|")) {
      const rows = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        const current = lines[i].trim();
        if (!/^\|\s*-+/.test(current)) {
          rows.push(
            current
              .replace(/^\|/, "")
              .replace(/\|$/, "")
              .split("|")
              .map((cell) => cell.trim()),
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
      blocks.push({ type: "heading", level: heading[1].length, text: heading[2] });
      continue;
    }
    const numbered = line.match(/^\s*(\d+)\.\s+(.+)$/);
    if (numbered) {
      blocks.push({ type: "number", text: numbered[2] });
      continue;
    }
    const checkbox = line.match(/^\s*-\s+\[\s\]\s+(.+)$/);
    if (checkbox) {
      blocks.push({ type: "checkbox", text: checkbox[1] });
      continue;
    }
    const bullet = line.match(/^\s*-\s+(.+)$/);
    if (bullet) {
      blocks.push({ type: "bullet", text: bullet[1] });
      continue;
    }
    blocks.push({ type: "para", text: line.trim() });
  }
  return blocks;
}

const markdown = readFileSync(inputPath, "utf8");
const blocks = parseMarkdown(markdown);
const headings = blocks.filter((block) => block.type === "heading" && block.level >= 2 && block.level <= 3);

const body = [];
body.push(pRun([{ text: "Naskah Akademik Pencatatan Hak Cipta", size: 28, color: "0B2545" }], "Title"));
body.push(pRun([{ text: "LITERATERAPI-SAKTI", bold: true, size: 22, color: "2E74B5" }], "Subtitle"));
body.push(p("Ruang Membaca Reflektif untuk Mengenal Diri dan Sesama", "Subtitle"));
body.push(p("Program komputer/aplikasi web edukatif berbasis cerpen reflektif untuk pengguna Indonesia dan Malaysia.", "Normal"));
body.push(table([
  ["Komponen", "Keterangan"],
  ["Status dokumen", "Final akademik pendukung pencatatan HAKI"],
  [
    "Pengembang aplikasi",
    "Vismaia S. Damaianti; Rosita Rahma; Lira Fessia Damaianti; Tofan Stofiana; Dedi Irawan; Muhammad Pahruroji",
  ],
  [
    "Pemegang hak cipta",
    "Para pengembang LITERATERAPI-SAKTI, sepanjang tidak ditentukan lain dalam surat pernyataan atau pengalihan hak cipta",
  ],
  ["Tanggal versi", "8 Agustus 2026"],
  ["URL produksi", "https://literaterapi-sakti-next.vercel.app"],
  [
    "Catatan",
    "Lengkapi data administratif pemohon, tanggal/tempat publikasi pertama, surat pernyataan, dan lampiran resmi sesuai ketentuan DJKI sebelum pengajuan.",
  ],
]));
body.push(pageBreak());
body.push(p("Daftar Isi", "Heading1"));
for (const item of headings) {
  if (item.text === "LITERATERAPI-SAKTI") continue;
  const indent = item.level === 3 ? '<w:pPr><w:ind w:left="360"/></w:pPr>' : "";
  body.push(`<w:p>${indent}<w:r><w:t xml:space="preserve">${esc(normalizeInline(item.text))}</w:t></w:r></w:p>`);
}
body.push(pageBreak());

let skipOpening = true;
for (const block of blocks) {
  if (skipOpening) {
    if (block.type === "heading" && block.level === 2 && block.text === "Abstrak") skipOpening = false;
    else continue;
  }
  if (block.type === "heading") {
    const style = block.level === 1 ? "Title" : block.level === 2 ? "Heading1" : block.level === 3 ? "Heading2" : "Heading3";
    body.push(p(block.text, style));
  } else if (block.type === "table") {
    body.push(table(block.rows));
  } else if (block.type === "bullet") {
    body.push(listP(block.text, "bullet"));
  } else if (block.type === "number") {
    body.push(listP(block.text, "number"));
  } else if (block.type === "checkbox") {
    body.push(checkboxP(block.text));
  } else if (block.type === "callout") {
    body.push(`<w:tbl><w:tblPr><w:tblW w:w="9360" w:type="dxa"/><w:tblInd w:w="120" w:type="dxa"/><w:tblBorders><w:top w:val="single" w:sz="4" w:color="D9E0EA"/><w:left w:val="single" w:sz="4" w:color="D9E0EA"/><w:bottom w:val="single" w:sz="4" w:color="D9E0EA"/><w:right w:val="single" w:sz="4" w:color="D9E0EA"/></w:tblBorders><w:shd w:fill="F4F6F9"/></w:tblPr><w:tblGrid><w:gridCol w:w="9360"/></w:tblGrid><w:tr><w:tc><w:tcPr><w:tcW w:w="9360" w:type="dxa"/><w:shd w:fill="F4F6F9"/></w:tcPr><w:p><w:r><w:t xml:space="preserve">${esc(normalizeInline(block.text))}</w:t></w:r></w:p></w:tc></w:tr></w:tbl>`);
  } else {
    body.push(p(block.text));
  }
}

const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="${NS.w}" xmlns:r="${NS.r}">
  <w:body>
    ${body.join("\n")}
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708" w:gutter="0"/>
      <w:footerReference w:type="default" r:id="rId2"/>
    </w:sectPr>
  </w:body>
</w:document>`;

const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="${NS.w}">
  <w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/><w:color w:val="1F2937"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="264" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:after="120" w:line="264" w:lineRule="auto"/></w:pPr><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:before="0" w:after="200"/><w:keepNext/></w:pPr><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:b/><w:sz w:val="56"/><w:color w:val="0B2545"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Subtitle"><w:name w:val="Subtitle"/><w:basedOn w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:after="160"/></w:pPr><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="28"/><w:color w:val="1F4D78"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:before="320" w:after="160"/><w:outlineLvl w:val="0"/><w:keepNext/></w:pPr><w:rPr><w:b/><w:sz w:val="32"/><w:color w:val="2E74B5"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:before="240" w:after="120"/><w:outlineLvl w:val="1"/><w:keepNext/></w:pPr><w:rPr><w:b/><w:sz w:val="26"/><w:color w:val="2E74B5"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="heading 3"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:before="160" w:after="80"/><w:outlineLvl w:val="2"/><w:keepNext/></w:pPr><w:rPr><w:b/><w:sz w:val="24"/><w:color w:val="1F4D78"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="ListParagraph"><w:name w:val="List Paragraph"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="120" w:line="280" w:lineRule="auto"/></w:pPr></w:style>
</w:styles>`;

const numberingXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering xmlns:w="${NS.w}">
  <w:abstractNum w:abstractNumId="1"><w:multiLevelType w:val="hybridMultilevel"/><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/><w:lvlJc w:val="left"/><w:pPr><w:tabs><w:tab w:val="num" w:pos="720"/></w:tabs><w:ind w:left="720" w:hanging="360"/></w:pPr></w:lvl></w:abstractNum>
  <w:num w:numId="1"><w:abstractNumId w:val="1"/></w:num>
  <w:abstractNum w:abstractNumId="2"><w:multiLevelType w:val="hybridMultilevel"/><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1."/><w:lvlJc w:val="left"/><w:pPr><w:tabs><w:tab w:val="num" w:pos="720"/></w:tabs><w:ind w:left="720" w:hanging="360"/></w:pPr></w:lvl></w:abstractNum>
  <w:num w:numId="2"><w:abstractNumId w:val="2"/></w:num>
</w:numbering>`;

const footerXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:ftr xmlns:w="${NS.w}" xmlns:r="${NS.r}">
  <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:color w:val="6B7280"/><w:sz w:val="18"/></w:rPr><w:t>LITERATERAPI-SAKTI — Naskah Akademik HAKI</w:t></w:r></w:p>
</w:ftr>`;

const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="${NS.rel}"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`;
const docRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="${NS.rel}"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/></Relationships>`;
const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>`;
const core = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>Naskah Akademik HAKI LITERATERAPI-SAKTI</dc:title><dc:creator>Codex</dc:creator><cp:lastModifiedBy>Codex</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">2026-08-08T00:00:00Z</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">2026-08-08T00:00:00Z</dcterms:modified></cp:coreProperties>`;
const app = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>Codex</Application></Properties>`;

if (existsSync(workDir)) rmSync(workDir, { recursive: true, force: true });
mkdirSync(path.join(workDir, "_rels"), { recursive: true });
mkdirSync(path.join(workDir, "word", "_rels"), { recursive: true });
mkdirSync(path.join(workDir, "docProps"), { recursive: true });
mkdirSync(outDir, { recursive: true });

writeFileSync(path.join(workDir, "[Content_Types].xml"), contentTypes);
writeFileSync(path.join(workDir, "_rels", ".rels"), rels);
writeFileSync(path.join(workDir, "word", "document.xml"), documentXml);
writeFileSync(path.join(workDir, "word", "styles.xml"), stylesXml);
writeFileSync(path.join(workDir, "word", "numbering.xml"), numberingXml);
writeFileSync(path.join(workDir, "word", "footer1.xml"), footerXml);
writeFileSync(path.join(workDir, "word", "_rels", "document.xml.rels"), docRels);
writeFileSync(path.join(workDir, "docProps", "core.xml"), core);
writeFileSync(path.join(workDir, "docProps", "app.xml"), app);

const zipPath = `${outputPath}.zip`;
if (existsSync(outputPath)) rmSync(outputPath, { force: true });
if (existsSync(zipPath)) rmSync(zipPath, { force: true });
execFileSync("powershell.exe", [
  "-NoProfile",
  "-Command",
  [
    "Add-Type -AssemblyName System.IO.Compression.FileSystem",
    "$src=$env:DOCX_WORK_DIR",
    "$dst=$env:DOCX_ZIP_PATH",
    "$zip=[IO.Compression.ZipFile]::Open($dst,'Create')",
    "try {",
    "  Get-ChildItem -LiteralPath $src -Recurse -File | ForEach-Object {",
    "    $rel=$_.FullName.Substring($src.Length).TrimStart('\\','/').Replace('\\','/')",
    "    [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip,$_.FullName,$rel) | Out-Null",
    "  }",
    "} finally {",
    "  $zip.Dispose()",
    "}",
    "Move-Item -LiteralPath $dst -Destination $env:DOCX_OUTPUT_PATH -Force",
  ].join("; "),
], {
  env: {
    ...process.env,
    DOCX_WORK_DIR: workDir,
    DOCX_ZIP_PATH: zipPath,
    DOCX_OUTPUT_PATH: outputPath,
  },
});

console.log(outputPath);
