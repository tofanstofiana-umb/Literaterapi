"use client";

import { useTranslations } from "next-intl";
import type { StoryCategorySlug } from "@/content/stories";

export default function CategoryChips({
  categories,
  compact = false,
}: {
  categories: StoryCategorySlug[];
  compact?: boolean;
}) {
  const t = useTranslations("categories");

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => (
        <span
          key={category}
          className={
            compact
              ? "rounded-full bg-sakti-mist/60 px-2.5 py-1 text-xs font-medium text-sakti-forestDark"
              : "rounded-full bg-sakti-mist/70 px-3 py-1.5 text-sm font-medium text-sakti-forestDark"
          }
        >
          {t(category)}
        </span>
      ))}
    </div>
  );
}
