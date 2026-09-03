const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { STORIES } = require(process.cwd() + "/src/content/stories.generated.ts");

function readCustomPlacements() {
  const source = fs.readFileSync("src/components/reader/StoryReader.tsx", "utf8");
  const match = source.match(
    /const CUSTOM_ILLUSTRATION_PLACEMENTS: Record<string, IllustrationPlacement\[]> = (\{[\s\S]*?\n\});/,
  );
  if (!match) return {};
  return vm.runInNewContext(`(${match[1]})`);
}

const CUSTOM = readCustomPlacements();

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function placements(story) {
  if (CUSTOM[story.slug]) {
    return CUSTOM[story.slug].map((rule) => ({
      imageIndex: rule.imageIndex,
      shownBeforeParagraph: (rule.position === "after" ? rule.paragraphIndex + 1 : rule.paragraphIndex) + 1,
      sourceParagraph: rule.paragraphIndex + 1,
      mode: "custom",
    }));
  }

  const paragraphCount = story.paragraphs.length;
  const step = Math.max(2, Math.floor(paragraphCount / (story.illustrations.length + 1)));

  return story.illustrations.map((_, imageIndex) => {
    const paragraphIndex = clamp((imageIndex + 1) * step, 1, paragraphCount - 1);
    return {
      imageIndex,
      shownBeforeParagraph: paragraphIndex + 1,
      sourceParagraph: paragraphIndex + 1,
      mode: "auto",
    };
  });
}

const audit = STORIES.map((story) => {
  const byImage = new Map(placements(story).map((p) => [p.imageIndex, p]));
  return {
    slug: story.slug,
    title: story.title,
    country: story.originCountry,
    paragraphs: story.paragraphs.length,
    illustrations: story.illustrations.map((img, index) => {
      const p = byImage.get(index);
      return {
        index: index + 1,
        src: img.src,
        path: path.join("public", img.src.replace(/^\/assets\//, "assets/")),
        alt: img.alt,
        isShownInReader: Boolean(p),
        mode: p?.mode ?? "not-shown",
        shownBeforeParagraph: p?.shownBeforeParagraph ?? null,
        contextParagraph: p
          ? story.paragraphs[Math.max(0, Math.min(story.paragraphs.length - 1, p.sourceParagraph - 1))]
          : null,
      };
    }),
  };
});

fs.writeFileSync(".audit/scene-image-audit/audit-input.json", JSON.stringify(audit, null, 2));

let md = "# Audit Input Gambar Adegan\n\n";
for (const story of audit) {
  md += `## ${story.title} (${story.slug})\n\n`;
  md += `Paragraf: ${story.paragraphs}; Ilustrasi: ${story.illustrations.length}\n\n`;
  md += "| # | Reader | Posisi | Konteks paragraf | File |\n|---:|---|---|---|---|\n";

  for (const img of story.illustrations) {
    const ctx = (img.contextParagraph ?? "").replace(/\|/g, "/").slice(0, 120);
    md += `| ${img.index} | ${img.isShownInReader ? img.mode : "tidak tampil"} | ${img.shownBeforeParagraph ?? "-"} | ${ctx} | ${img.path} |\n`;
  }
  md += "\n";
}

fs.writeFileSync(".audit/scene-image-audit/audit-input.md", md);
console.log("Wrote .audit/scene-image-audit/audit-input.json and .md");
