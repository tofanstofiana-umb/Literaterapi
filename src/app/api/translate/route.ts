import { NextResponse } from "next/server";
import {
  LIBRE_TRANSLATE_LOCALE,
  TRANSLATION_LOCALE_NAME,
  type TranslationLocale,
  isTranslationLocale,
} from "@/lib/translation/locales";
import { getCurrentUser } from "@/lib/auth/currentUser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_ITEMS = 40;
const MAX_TOTAL_CHARS = 24000;

interface TranslationRequest {
  sourceLocale?: unknown;
  targetLocale?: unknown;
  items?: unknown;
}

function normalizeItems(items: unknown): string[] | undefined {
  if (!Array.isArray(items)) return undefined;
  if (items.length > MAX_ITEMS) return undefined;
  const normalized = items.map((item) => (typeof item === "string" ? item : ""));
  const totalChars = normalized.reduce((sum, item) => sum + item.length, 0);
  if (totalChars > MAX_TOTAL_CHARS) return undefined;
  return normalized;
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function sameLengthOrThrow(translations: unknown, length: number): string[] {
  if (!Array.isArray(translations)) {
    throw new Error("Translation provider returned an invalid payload.");
  }

  const normalized = translations.map((item) => (typeof item === "string" ? item : ""));
  if (normalized.length !== length) {
    throw new Error("Translation provider returned a different number of items.");
  }

  return normalized;
}

function extractOpenAIText(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const data = payload as {
    output_text?: unknown;
    output?: Array<{ content?: Array<{ text?: unknown }> }>;
  };

  if (typeof data.output_text === "string") return data.output_text;

  return (
    data.output
      ?.flatMap((item) => item.content ?? [])
      .map((content) => (typeof content.text === "string" ? content.text : ""))
      .join("") ?? ""
  );
}

async function translateWithOpenAI(
  sourceLocale: TranslationLocale,
  targetLocale: TranslationLocale,
  items: string[],
) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return undefined;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_TRANSLATION_MODEL ?? "gpt-4o-mini",
      input: [
        {
          role: "system",
          content:
            "You translate youth short-story app content faithfully. Preserve paragraph boundaries, tone, names, cultural terms, punctuation style, and emotional nuance. Return only valid JSON.",
        },
        {
          role: "user",
          content: JSON.stringify({
            sourceLanguage: TRANSLATION_LOCALE_NAME[sourceLocale],
            targetLanguage: TRANSLATION_LOCALE_NAME[targetLocale],
            items,
            requiredJsonShape: { translations: ["..."] },
          }),
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "translation_batch",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              translations: {
                type: "array",
                items: { type: "string" },
              },
            },
            required: ["translations"],
          },
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI translation failed with status ${response.status}.`);
  }

  const payload = await response.json();
  const text = extractOpenAIText(payload);
  const parsed = JSON.parse(text) as { translations?: unknown };
  return sameLengthOrThrow(parsed.translations, items.length);
}

async function translateWithLibreTranslate(
  sourceLocale: TranslationLocale,
  targetLocale: TranslationLocale,
  items: string[],
) {
  const baseUrl = process.env.LIBRETRANSLATE_URL;
  if (!baseUrl) return undefined;

  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/translate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      q: items,
      source: LIBRE_TRANSLATE_LOCALE[sourceLocale],
      target: LIBRE_TRANSLATE_LOCALE[targetLocale],
      format: "text",
      api_key: process.env.LIBRETRANSLATE_API_KEY || undefined,
    }),
  });

  if (!response.ok) {
    throw new Error(`LibreTranslate failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as { translatedText?: unknown };
  if (typeof payload.translatedText === "string" && items.length === 1) {
    return [payload.translatedText];
  }
  return sameLengthOrThrow(payload.translatedText, items.length);
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return jsonError("Authentication required.", 401);
  }

  let body: TranslationRequest;
  try {
    body = (await request.json()) as TranslationRequest;
  } catch {
    return jsonError("Invalid JSON body.", 400);
  }

  if (!isTranslationLocale(body.sourceLocale) || !isTranslationLocale(body.targetLocale)) {
    return jsonError("Invalid sourceLocale or targetLocale.", 400);
  }

  const items = normalizeItems(body.items);
  if (!items) {
    return jsonError("Invalid items payload.", 400);
  }

  if (body.sourceLocale === body.targetLocale) {
    return NextResponse.json({ translations: items, provider: "none" });
  }

  try {
    const translations =
      (await translateWithOpenAI(body.sourceLocale, body.targetLocale, items)) ??
      (await translateWithLibreTranslate(body.sourceLocale, body.targetLocale, items));

    if (!translations) {
      return jsonError(
        "Automatic translation is not configured. Set OPENAI_API_KEY or LIBRETRANSLATE_URL.",
        503,
      );
    }

    return NextResponse.json({ translations, provider: "automatic" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Translation failed.";
    return jsonError(message, 502);
  }
}
