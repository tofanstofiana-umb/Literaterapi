"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import type { PreparedStory } from "@/content/stories";
import { applyStaticStoryTranslation, getStaticStoryTranslation } from "@/content/storyTranslations";
import { isTranslationLocale, type TranslationLocale } from "@/lib/translation/locales";

type TranslationStatus = "original" | "static" | "loading" | "ready" | "unconfigured" | "error";

interface UseAutoTranslatedStoryOptions {
  includeParagraphs?: boolean;
  targetLocale?: TranslationLocale;
}

interface TranslationCache {
  fields: string[];
  translatedAt: string;
}

const BATCH_SIZE = 18;

function getStorySignature(story: PreparedStory, includeParagraphs: boolean) {
  return [
    story.cleanWordCount,
    story.title.length,
    story.subtitle.length,
    story.excerpt.length,
    includeParagraphs ? story.paragraphs.length : 0,
  ].join("-");
}

function getCacheKey(story: PreparedStory, targetLocale: TranslationLocale, includeParagraphs: boolean) {
  return [
    "literaterapi",
    "auto-translation",
    story.slug,
    story.originalLanguage,
    targetLocale,
    getStorySignature(story, includeParagraphs),
  ].join(":");
}

function buildFields(story: PreparedStory, includeParagraphs: boolean) {
  return [
    story.title,
    story.subtitle,
    story.excerpt,
    ...(includeParagraphs ? story.paragraphs : []),
  ];
}

function storyFromFields(story: PreparedStory, fields: string[], includeParagraphs: boolean) {
  return {
    ...story,
    title: fields[0] || story.title,
    subtitle: fields[1] || story.subtitle,
    excerpt: fields[2] || story.excerpt,
    paragraphs: includeParagraphs ? fields.slice(3) : story.paragraphs,
  };
}

async function translateBatch(
  sourceLocale: TranslationLocale,
  targetLocale: TranslationLocale,
  items: string[],
  signal: AbortSignal,
) {
  const response = await fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sourceLocale, targetLocale, items }),
    signal,
  });

  const payload = (await response.json().catch(() => ({}))) as {
    translations?: unknown;
    error?: unknown;
  };

  if (!response.ok) {
    const error = typeof payload.error === "string" ? payload.error : "Translation failed.";
    throw new Error(error);
  }

  if (!Array.isArray(payload.translations)) {
    throw new Error("Invalid translation response.");
  }

  return payload.translations.map((item) => (typeof item === "string" ? item : ""));
}

export function useAutoTranslatedStory(
  story: PreparedStory,
  options: UseAutoTranslatedStoryOptions = {},
) {
  const activeLocale = useLocale();
  const targetLocale =
    options.targetLocale ??
    (isTranslationLocale(activeLocale) ? activeLocale : story.originalLanguage);
  const includeParagraphs = options.includeParagraphs ?? false;
  const fields = useMemo(() => buildFields(story, includeParagraphs), [story, includeParagraphs]);
  const [translatedStory, setTranslatedStory] = useState(story);
  const [status, setStatus] = useState<TranslationStatus>("original");
  const [error, setError] = useState("");

  useEffect(() => {
    setTranslatedStory(story);
    setError("");

    if (targetLocale === story.originalLanguage) {
      setStatus("original");
      return;
    }

    const staticTranslation = getStaticStoryTranslation(story, targetLocale);
    if (staticTranslation) {
      setTranslatedStory(applyStaticStoryTranslation(story, staticTranslation, includeParagraphs));
      setStatus("static");
      return;
    }

    const cacheKey = getCacheKey(story, targetLocale, includeParagraphs);
    const cached = window.localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as TranslationCache;
        if (Array.isArray(parsed.fields) && parsed.fields.length === fields.length) {
          setTranslatedStory(storyFromFields(story, parsed.fields, includeParagraphs));
          setStatus("ready");
          return;
        }
      } catch {
        window.localStorage.removeItem(cacheKey);
      }
    }

    const controller = new AbortController();
    setStatus("loading");

    async function run() {
      try {
        const translatedFields: string[] = [];

        for (let index = 0; index < fields.length; index += BATCH_SIZE) {
          const batch = fields.slice(index, index + BATCH_SIZE);
          const translatedBatch = await translateBatch(
            story.originalLanguage,
            targetLocale,
            batch,
            controller.signal,
          );
          translatedFields.push(...translatedBatch);
        }

        window.localStorage.setItem(
          cacheKey,
          JSON.stringify({
            fields: translatedFields,
            translatedAt: new Date().toISOString(),
          } satisfies TranslationCache),
        );

        setTranslatedStory(storyFromFields(story, translatedFields, includeParagraphs));
        setStatus("ready");
      } catch (translationError) {
        if (controller.signal.aborted) return;
        const message =
          translationError instanceof Error ? translationError.message : "Translation failed.";
        setStatus(message.includes("not configured") ? "unconfigured" : "error");
        setError(message);
      }
    }

    void run();
    return () => controller.abort();
  }, [fields, includeParagraphs, story, targetLocale]);

  return {
    story: translatedStory,
    targetLocale,
    status,
    error,
    isTranslated: (status === "static" || status === "ready") && targetLocale !== story.originalLanguage,
  };
}
