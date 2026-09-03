import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const inputPath = path.join(root, "docs", "lampiran-cuplikan-source-code-haki-literaterapi-sakti.md");
const outDir = path.join(root, "docs", "dist");
const workDir = path.join(outDir, "_docx_source_snippets_work");
const outputPath = process.env.SOURCE_SNIPPETS_DOCX_OUTPUT
  ? path.resolve(root, process.env.SOURCE_SNIPPETS_DOCX_OUTPUT)
  : path.join(outDir, "Lampiran Cuplikan Source Code HAKI LITERATERAPI-SAKTI.docx");

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
  return String(text ?? "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)")
    .replace(/^- \[ \] /, "[ ] ");
}

function paragraph(text, style = "Normal", extra = "") {
  const keep = style.startsWith("Heading") || style === "Title" || style === "Subtitle";
  return `<w:p>${extra}<w:pPr><w:pStyle w:val="${style}"/>${keep ? "<w:keepNext/>" : ""}</w:pPr><w:r><w:t xml:space="preserve">${esc(normalizeInline(text))}</w:t></w:r></w:p>`;
}

function codeParagraph(text) {
  const safe = String(text ?? "").replace(/\t/g, "  ");
  return `<w:p><w:pPr><w:pStyle w:val="Code"/><w:spacing w:after="0" w:line="220" w:lineRule="auto"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Courier New" w:hAnsi="Courier New"/><w:sz w:val="18"/><w:color w:val="111827"/></w:rPr><w:t xml:space="preserve">${esc(safe || " ")}</w:t></w:r></w:p>`;
}

function pageBreak() {
  return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
}

function listParagraph(text) {
  return `<w:p><w:pPr><w:pStyle w:val="ListParagraph"/><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t xml:space="preserve">${esc(normalizeInline(text))}</w:t></w:r></w:p>`;
}

function table(rows) {
  if (!rows.length) return "";
  const colCount = rows[0].length;
  const widths = colCount === 2 ? [2700, 6660] : Array.from({ length: colCount }, () => Math.floor(9360 / colCount));
  const grid = widths.map((width) => `<w:gridCol w:w="${width}"/>`).join("");
  const trs = rows
    .map((row, rowIndex) => {
      const cells = row
        .map((cell, cellIndex) => {
          const fill = rowIndex === 0 ? '<w:shd w:fill="EAF2F8"/>' : "";
          const bold = rowIndex === 0 ? "<w:b/>" : "";
          return `<w:tc><w:tcPr><w:tcW w:w="${widths[cellIndex] ?? widths[0]}" w:type="dxa"/>${fill}</w:tcPr><w:p><w:pPr><w:spacing w:after="60" w:line="260" w:lineRule="auto"/></w:pPr><w:r>${bold ? `<w:rPr>${bold}</w:rPr>` : ""}<w:t xml:space="preserve">${esc(normalizeInline(cell))}</w:t></w:r></w:p></w:tc>`;
        })
        .join("");
      return `<w:tr>${cells}</w:tr>`;
    })
    .join("");
  return `<w:tbl><w:tblPr><w:tblW w:w="9360" w:type="dxa"/><w:tblInd w:w="120" w:type="dxa"/><w:tblBorders><w:top w:val="single" w:sz="4" w:color="D9E0EA"/><w:left w:val="single" w:sz="4" w:color="D9E0EA"/><w:bottom w:val="single" w:sz="4" w:color="D9E0EA"/><w:right w:val="single" w:sz="4" w:color="D9E0EA"/><w:insideH w:val="single" w:sz="4" w:color="D9E0EA"/><w:insideV w:val="single" w:sz="4" w:color="D9E0EA"/></w:tblBorders><w:tblCellMar><w:top w:w="100" w:type="dxa"/><w:left w:w="130" w:type="dxa"/><w:bottom w:w="100" w:type="dxa"/><w:right w:w="130" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>${grid}</w:tblGrid>${trs}</w:tbl>`;
}

function parseMarkdown(markdown) {
  const blocks = [];
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i];
    const line = raw.trim();
    if (!line || line === "---") continue;

    if (line.startsWith("```")) {
      const lang = line.replace(/```/, "").trim();
      const code = [];
      i += 1;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        code.push(lines[i]);
        i += 1;
      }
      blocks.push({ type: "code", lang, lines: code });
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

    const bullet = line.match(/^-\s+(.+)$/);
    if (bullet) {
      blocks.push({ type: "bullet", text: bullet[1] });
      continue;
    }

    blocks.push({ type: "para", text: line });
  }
  return blocks;
}

const blocks = parseMarkdown(readFileSync(inputPath, "utf8"));
const body = [];

for (const block of blocks) {
  if (block.type === "heading") {
    const style = block.level === 1 ? "Title" : block.level === 2 ? "Heading1" : block.level === 3 ? "Heading2" : "Heading3";
    body.push(paragraph(block.text, style));
    if (block.level === 2 && /^\d+\./.test(block.text) && body.length > 8) {
      // Keep each snippet section visually separated when Word repaginates.
      body.splice(body.length - 1, 0, pageBreak());
    }
  } else if (block.type === "table") {
    body.push(table(block.rows));
  } else if (block.type === "code") {
    body.push(table([["Cuplikan kode", block.lang || "source"]]));
    block.lines.forEach((line) => body.push(codeParagraph(line)));
    body.push(paragraph("", "Normal"));
  } else if (block.type === "bullet") {
    body.push(listParagraph(block.text));
  } else {
    body.push(paragraph(block.text));
  }
}

const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="${NS.w}" xmlns:r="${NS.r}">
  <w:body>
    ${body.join("\n")}
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1080" w:right="1080" w:bottom="1080" w:left="1080" w:header="708" w:footer="708" w:gutter="0"/>
      <w:footerReference w:type="default" r:id="rId2"/>
    </w:sectPr>
  </w:body>
</w:document>`;

const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="${NS.w}">
  <w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/><w:color w:val="1F2937"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="264" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:after="120" w:line="264" w:lineRule="auto"/></w:pPr><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:before="0" w:after="240"/><w:keepNext/></w:pPr><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:b/><w:sz w:val="44"/><w:color w:val="0B2545"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:before="240" w:after="120"/><w:outlineLvl w:val="0"/><w:keepNext/></w:pPr><w:rPr><w:b/><w:sz w:val="30"/><w:color w:val="2E74B5"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:before="180" w:after="100"/><w:outlineLvl w:val="1"/><w:keepNext/></w:pPr><w:rPr><w:b/><w:sz w:val="25"/><w:color w:val="1F4D78"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="heading 3"/><w:basedOn w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:before="120" w:after="80"/><w:keepNext/></w:pPr><w:rPr><w:b/><w:sz w:val="23"/><w:color w:val="1F4D78"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="ListParagraph"><w:name w:val="List Paragraph"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="100" w:line="260" w:lineRule="auto"/></w:pPr></w:style>
  <w:style w:type="paragraph" w:styleId="Code"><w:name w:val="Code"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="0" w:line="220" w:lineRule="auto"/><w:shd w:fill="F8FAFC"/><w:ind w:left="180" w:right="180"/></w:pPr><w:rPr><w:rFonts w:ascii="Courier New" w:hAnsi="Courier New"/><w:sz w:val="18"/><w:color w:val="111827"/></w:rPr></w:style>
</w:styles>`;

const numberingXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering xmlns:w="${NS.w}">
  <w:abstractNum w:abstractNumId="1"><w:multiLevelType w:val="hybridMultilevel"/><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/><w:lvlJc w:val="left"/><w:pPr><w:tabs><w:tab w:val="num" w:pos="720"/></w:tabs><w:ind w:left="720" w:hanging="360"/></w:pPr></w:lvl></w:abstractNum>
  <w:num w:numId="1"><w:abstractNumId w:val="1"/></w:num>
</w:numbering>`;

const footerXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:ftr xmlns:w="${NS.w}" xmlns:r="${NS.r}">
  <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:color w:val="6B7280"/><w:sz w:val="18"/></w:rPr><w:t>LITERATERAPI-SAKTI - Lampiran Cuplikan Source Code HAKI</w:t></w:r></w:p>
</w:ftr>`;

const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="${NS.rel}"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`;
const docRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="${NS.rel}"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/></Relationships>`;
const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>`;
const core = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>Lampiran Cuplikan Source Code HAKI LITERATERAPI-SAKTI</dc:title><dc:creator>Codex</dc:creator><cp:lastModifiedBy>Codex</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">2026-08-08T00:00:00Z</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">2026-08-08T00:00:00Z</dcterms:modified></cp:coreProperties>`;
const app = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Codex</Application></Properties>`;

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
