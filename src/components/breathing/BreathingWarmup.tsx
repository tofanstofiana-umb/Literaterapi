"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";

const PHASES = [
  {
    key: "inhale",
    durationMs: 4000,
    scale: 1.18,
  },
  {
    key: "pause",
    durationMs: 1000,
    scale: 1.18,
  },
  {
    key: "exhale",
    durationMs: 6000,
    scale: 0.82,
  },
  {
    key: "rest",
    durationMs: 1000,
    scale: 0.82,
  },
] as const;

const TOTAL_CYCLES = 3;
const TICK_MS = 250;
const AMBIENT_AUDIO_SRC = "/assets/audio/ambient-reading.mp3";
const cycleDurationMs = PHASES.reduce((total, phase) => total + phase.durationMs, 0);
const totalDurationMs = cycleDurationMs * TOTAL_CYCLES;

function getPhase(elapsedMs: number) {
  const cycleElapsed = elapsedMs % cycleDurationMs;
  let cursor = 0;

  for (const phase of PHASES) {
    cursor += phase.durationMs;
    if (cycleElapsed < cursor) return phase;
  }

  return PHASES[0];
}

export default function BreathingWarmup({
  readHref,
  storyTitle,
}: {
  readHref: string;
  storyTitle: string;
}) {
  const t = useTranslations("breathing");
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const ambientAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!isRunning || isComplete) return;

    const intervalId = window.setInterval(() => {
      setElapsedMs((current) => {
        const next = Math.min(current + TICK_MS, totalDurationMs);
        if (next >= totalDurationMs) {
          window.clearInterval(intervalId);
          setIsRunning(false);
          setIsComplete(true);
        }
        return next;
      });
    }, TICK_MS);

    return () => window.clearInterval(intervalId);
  }, [isComplete, isRunning]);

  useEffect(() => {
    const audio = ambientAudioRef.current;
    if (!audio) return;

    if (isRunning && isSoundEnabled) {
      audio.volume = 0.22;
      void audio.play();
    } else {
      audio.pause();
    }
  }, [isRunning, isSoundEnabled]);

  useEffect(() => {
    return () => pauseAmbientSound();
  }, []);

  const phase = useMemo(() => getPhase(elapsedMs), [elapsedMs]);
  const cycle = Math.min(TOTAL_CYCLES, Math.floor(elapsedMs / cycleDurationMs) + 1);
  const progress = Math.round((elapsedMs / totalDurationMs) * 100);
  const secondsLeft = Math.ceil((totalDurationMs - elapsedMs) / 1000);

  async function startAmbientSound() {
    if (!isSoundEnabled) return;

    const audio = ambientAudioRef.current ?? new Audio(AMBIENT_AUDIO_SRC);
    audio.loop = true;
    audio.volume = 0.22;
    audio.preload = "auto";
    ambientAudioRef.current = audio;
    await audio.play().catch(() => undefined);
  }

  function pauseAmbientSound() {
    const audio = ambientAudioRef.current;
    if (!audio) return;
    audio.pause();
  }

  function toggleBreathing() {
    if (isComplete) return;
    setIsRunning((current) => {
      const next = !current;
      if (next) void startAmbientSound();
      return next;
    });
  }

  function resetBreathing() {
    setIsRunning(false);
    setIsComplete(false);
    setElapsedMs(0);
    pauseAmbientSound();
    if (ambientAudioRef.current) ambientAudioRef.current.currentTime = 0;
  }

  function skipWarmup() {
    setIsRunning(false);
    setIsComplete(true);
    setElapsedMs(totalDurationMs);
    pauseAmbientSound();
  }

  function toggleSound() {
    setIsSoundEnabled((current) => {
      const next = !current;
      if (!next) pauseAmbientSound();
      if (next && isRunning) void startAmbientSound();
      return next;
    });
  }

  return (
    <section className="mt-7 rounded-sakti border border-sakti-mist bg-white p-5 shadow-sm">
      <div className="grid gap-6 md:grid-cols-[minmax(0,0.9fr)_minmax(260px,1.1fr)] md:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-sakti-gold">
            {t("eyebrow")}
          </p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-sakti-forestDark">
            {t("title")}
          </h2>
          <p className="mt-3 text-sm leading-6 text-sakti-forestDark/75">
            {t.rich("body", {
              title: storyTitle,
              strong: (chunks) => <span className="font-semibold">{chunks}</span>,
            })}
          </p>
          <p className="mt-3 rounded-xl bg-sakti-gold/10 p-3 text-xs leading-5 text-sakti-forestDark/75">
            {t("safety")}
          </p>
        </div>

        <div className="rounded-sakti bg-sakti-paper p-5 text-center">
          <button
            type="button"
            onClick={toggleBreathing}
            className="group mx-auto flex h-44 w-44 items-center justify-center rounded-full border border-sakti-forest/20 bg-white shadow-sm outline-none transition focus-visible:ring-4 focus-visible:ring-sakti-gold/40"
            aria-label={isRunning ? t("pauseAria") : t("startAria")}
          >
            <span
              className="flex h-28 w-28 items-center justify-center rounded-full bg-sakti-forest text-center text-sm font-semibold text-white shadow-inner transition-transform ease-in-out motion-reduce:transform-none"
              style={{
                transform: `scale(${isRunning || isComplete ? phase.scale : 0.9})`,
                transitionDuration: `${phase.durationMs}ms`,
              }}
            >
              {isComplete ? t("readyShort") : isRunning ? t(`phases.${phase.key}.label`) : t("clickStart")}
            </span>
          </button>

          <div className="mt-5">
            <p className="font-display text-2xl font-semibold text-sakti-forestDark">
              {isComplete ? t("readyTitle") : isRunning ? t(`phases.${phase.key}.label`) : t("startTitle")}
            </p>
            <p className="mt-1 text-sm leading-6 text-sakti-forestDark/70">
              {isComplete ? t("readyBody") : t(`phases.${phase.key}.helper`)}
            </p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-sakti-gold">
              {isComplete
                ? t("cycleComplete", { cycle, total: TOTAL_CYCLES })
                : t("cycleRunning", { cycle, total: TOTAL_CYCLES, seconds: secondsLeft })}
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-sakti-mist">
              <div
                className="h-full rounded-full bg-sakti-forest transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={toggleSound}
              className="rounded-full border border-sakti-mist px-4 py-2 text-sm font-semibold text-sakti-forestDark"
            >
              {t("sound")}: {isSoundEnabled ? t("on") : t("off")}
            </button>
            <button
              type="button"
              onClick={resetBreathing}
              className="rounded-full border border-sakti-forest px-4 py-2 text-sm font-semibold text-sakti-forest"
            >
              {t("repeat")}
            </button>
            {!isComplete ? (
              <button
                type="button"
                onClick={skipWarmup}
                className="rounded-full border border-sakti-mist px-4 py-2 text-sm font-semibold text-sakti-forestDark"
              >
                {t("skip")}
              </button>
            ) : null}
            <Link
              href={readHref}
              aria-disabled={!isComplete}
              className={`rounded-full px-5 py-2 text-sm font-semibold ${
                isComplete
                  ? "bg-sakti-forest text-white"
                  : "pointer-events-none bg-sakti-mist text-sakti-forestDark/50"
              }`}
            >
              {t("startReading")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
