"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  Blocks,
  Database,
  Sparkles,
  Target,
  Trash2,
  Trophy,
  Type,
  User,
  Volume2,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { DeleteRandomRedemptionResult } from "@/features/marketplace/contracts/marketplace";
import { cn } from "@/lib/utils";

type DeleteRandomRouletteDialogProps = {
  result: DeleteRandomRedemptionResult | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type SegmentKey = DeleteRandomRedemptionResult["segments"][number]["key"];

type WheelSegmentLayout = DeleteRandomRedemptionResult["segments"][number] & {
  startAngle: number;
  endAngle: number;
  midpointAngle: number;
  sweepAngle: number;
};

type AudioWindow = Window & {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
};

const spinDurationMs = 8_400;
const completeSpins = 8;

const wheelIconMap: Record<SegmentKey, LucideIcon> = {
  phrase: Type,
  component: Blocks,
  market: Target,
  user: User,
  ranking: Trophy,
  database: Database,
};

function buildWheelSegments(
  result: DeleteRandomRedemptionResult,
): WheelSegmentLayout[] {
  const totalWeight = result.segments.reduce(
    (weight, segment) => weight + segment.weight,
    0,
  );
  let cursor = 0;

  return result.segments.map((segment) => {
    const angle = (segment.weight / totalWeight) * 360;
    const startAngle = cursor;
    const endAngle = cursor + angle;
    cursor = endAngle;

    return {
      ...segment,
      startAngle,
      endAngle,
      midpointAngle: startAngle + angle / 2,
      sweepAngle: angle,
    };
  });
}

function buildWheelBackground(segments: WheelSegmentLayout[]) {
  const stops = segments.map(
    (segment) =>
      `${segment.color} ${segment.startAngle}deg ${segment.endAngle}deg`,
  );

  return `conic-gradient(from -90deg, ${stops.join(", ")})`;
}

function playRouletteSound(durationMs: number) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const audioWindow = window as AudioWindow;
  const AudioContextCtor =
    audioWindow.AudioContext ?? audioWindow.webkitAudioContext;

  if (!AudioContextCtor) {
    return () => undefined;
  }

  const audioContext = new AudioContextCtor();
  const startedAt = performance.now();
  const durationSeconds = durationMs / 1_000;
  const now = audioContext.currentTime;
  const mainGain = audioContext.createGain();
  const oscillator = audioContext.createOscillator();
  let tickTimer: number | null = null;
  let closeTimer: number | null = null;
  let stopped = false;

  void audioContext.resume().catch(() => undefined);

  mainGain.gain.setValueAtTime(0.0001, now);
  mainGain.gain.exponentialRampToValueAtTime(0.045, now + 0.18);
  mainGain.gain.exponentialRampToValueAtTime(0.0001, now + durationSeconds);

  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(132, now);
  oscillator.frequency.exponentialRampToValueAtTime(42, now + durationSeconds);
  oscillator.connect(mainGain).connect(audioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + durationSeconds);

  const playTick = () => {
    if (stopped) {
      return;
    }

    const elapsed = performance.now() - startedAt;

    if (elapsed >= durationMs) {
      return;
    }

    const tickGain = audioContext.createGain();
    const tick = audioContext.createOscillator();
    const tickNow = audioContext.currentTime;

    tick.type = "square";
    tick.frequency.setValueAtTime(360, tickNow);
    tickGain.gain.setValueAtTime(0.028, tickNow);
    tickGain.gain.exponentialRampToValueAtTime(0.0001, tickNow + 0.06);
    tick.connect(tickGain).connect(audioContext.destination);
    tick.start(tickNow);
    tick.stop(tickNow + 0.065);

    tickTimer = window.setTimeout(playTick, 90 + (elapsed / durationMs) * 260);
  };

  playTick();
  closeTimer = window.setTimeout(() => {
    void audioContext.close().catch(() => undefined);
  }, durationMs + 500);

  return () => {
    stopped = true;

    if (tickTimer) {
      window.clearTimeout(tickTimer);
    }

    if (closeTimer) {
      window.clearTimeout(closeTimer);
    }

    void audioContext.close().catch(() => undefined);
  };
}

function playRevealSuccessSound() {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const audioWindow = window as AudioWindow;
  const AudioContextCtor =
    audioWindow.AudioContext ?? audioWindow.webkitAudioContext;

  if (!AudioContextCtor) {
    return () => undefined;
  }

  const audioContext = new AudioContextCtor();
  const now = audioContext.currentTime;
  const masterGain = audioContext.createGain();
  let closeTimer: number | null = null;
  let stopped = false;

  void audioContext.resume().catch(() => undefined);

  masterGain.gain.setValueAtTime(0.0001, now);
  masterGain.gain.exponentialRampToValueAtTime(0.085, now + 0.02);
  masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.82);
  masterGain.connect(audioContext.destination);

  const scheduleTone = (
    offset: number,
    frequency: number,
    duration: number,
  ) => {
    const oscillator = audioContext.createOscillator();
    const toneGain = audioContext.createGain();
    const toneStart = now + offset;

    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(frequency, toneStart);
    oscillator.connect(toneGain).connect(masterGain);

    toneGain.gain.setValueAtTime(0.0001, toneStart);
    toneGain.gain.exponentialRampToValueAtTime(0.92, toneStart + 0.03);
    toneGain.gain.exponentialRampToValueAtTime(0.0001, toneStart + duration);

    oscillator.start(toneStart);
    oscillator.stop(toneStart + duration + 0.04);
  };

  scheduleTone(0, 523.25, 0.16);
  scheduleTone(0.14, 659.25, 0.18);
  scheduleTone(0.3, 783.99, 0.28);

  closeTimer = window.setTimeout(() => {
    if (!stopped) {
      void audioContext.close().catch(() => undefined);
    }
  }, 1_000);

  return () => {
    stopped = true;

    if (closeTimer) {
      window.clearTimeout(closeTimer);
    }

    void audioContext.close().catch(() => undefined);
  };
}

export function DeleteRandomRouletteDialog({
  result,
  open,
  onOpenChange,
}: DeleteRandomRouletteDialogProps) {
  const [phase, setPhase] = useState<"idle" | "spinning" | "revealed">("idle");
  const [rotation, setRotation] = useState(0);
  const segments = useMemo(
    () => (result ? buildWheelSegments(result) : []),
    [result],
  );
  const wheelBackground = useMemo(
    () => buildWheelBackground(segments),
    [segments],
  );
  const selectedSegment = segments.find(
    (segment) => segment.key === result?.outcome.key,
  );
  const finalRotation = selectedSegment
    ? completeSpins * 360 - selectedSegment.midpointAngle
    : 0;
  const isRevealed = phase === "revealed";
  const wheelStyle = {
    backgroundImage: wheelBackground,
    transform: `rotate(${rotation}deg)`,
    transitionDuration: phase === "spinning" ? `${spinDurationMs}ms` : "0ms",
  } satisfies CSSProperties;

  useEffect(() => {
    if (!open || !result) {
      return;
    }

    const soundCleanup = playRouletteSound(spinDurationMs);
    let revealSoundCleanup: (() => void) | null = null;
    let spinFrame: number | null = null;
    const resetFrame = window.requestAnimationFrame(() => {
      setPhase("spinning");
      setRotation(0);

      spinFrame = window.requestAnimationFrame(() => {
        setRotation(finalRotation);
      });
    });
    const revealTimer = window.setTimeout(() => {
      setPhase("revealed");
      revealSoundCleanup = playRevealSuccessSound();
    }, spinDurationMs + 250);

    return () => {
      window.cancelAnimationFrame(resetFrame);

      if (spinFrame) {
        window.cancelAnimationFrame(spinFrame);
      }

      window.clearTimeout(revealTimer);
      soundCleanup();

      if (revealSoundCleanup) {
        revealSoundCleanup();
      }
    };
  }, [finalRotation, open, result]);

  if (!result) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && isRevealed) {
          onOpenChange(false);
        }
      }}
    >
      <DialogContent
        showCloseButton={isRevealed}
        className="code-surface max-h-[calc(100dvh-1rem)] w-full max-w-[calc(100vw-1rem)] overflow-hidden rounded-[34px] border border-white/8 bg-[linear-gradient(180deg,rgba(2,6,23,0.99),rgba(15,23,42,0.98))] p-0 text-white shadow-[0_42px_140px_-48px_rgba(0,0,0,0.96)] ring-1 ring-white/8 sm:max-w-[min(58rem,calc(100vw-2rem))]"
      >
        <div className="max-h-[calc(100dvh-1rem)] overflow-y-auto px-4 pb-4 pt-4 sm:px-6 sm:pb-6 sm:pt-6">
          <DialogHeader className="gap-3 pr-10 text-left">
            <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-white/48">
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-400/18 bg-slate-400/10 px-3 py-1 text-slate-100">
                <Volume2 className="h-3.5 w-3.5" />
                Som ligado
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/5 px-3 py-1 text-white/58">
                <Sparkles className="h-3.5 w-3.5" />
                Sorteio salvo
              </span>
            </div>
            <DialogTitle className="max-w-3xl text-2xl font-semibold leading-tight text-white sm:text-3xl">
              {result.title}
            </DialogTitle>
            <DialogDescription className="max-w-2xl text-sm leading-7 text-white/62">
              {result.subtitle}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:items-center">
            <div className="relative mx-auto aspect-square w-full max-w-[24rem]">
              <div className="absolute left-1/2 top-1 z-20 h-0 w-0 -translate-x-1/2 border-x-16 border-t-28 border-x-transparent border-t-slate-200 drop-shadow-[0_8px_18px_rgba(0,0,0,0.55)]" />
              <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(30,41,59,0.34),rgba(15,23,42,0.12)_42%,transparent_64%)] blur-xl" />
              <div
                className="relative h-full w-full rounded-full border-12 border-white/8 shadow-[0_26px_90px_-42px_rgba(2,6,23,0.95)] transition-transform ease-[cubic-bezier(0.08,0.82,0.18,1)]"
                style={wheelStyle}
              >
                <div className="absolute left-1/2 top-1/2 grid h-20 w-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/12 bg-slate-950/82 shadow-[0_16px_42px_-22px_rgba(0,0,0,1)] backdrop-blur-sm">
                  <Trash2 className="h-8 w-8 text-slate-100" />
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-[28px] border border-white/8 bg-white/3 p-5">
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-white/40">
                  {isRevealed ? "Resultado" : "Girando"}
                </p>
                <h3
                  className={cn(
                    "mt-3 text-3xl font-semibold text-white transition-opacity",
                    isRevealed ? "opacity-100" : "opacity-45",
                  )}
                  aria-live="polite"
                >
                  {isRevealed ? result.outcome.label : "..."}
                </h3>
                <p className="mt-3 text-sm leading-7 text-white/62">
                  {isRevealed
                    ? result.outcome.description
                    : "A roleta está girando e ainda não liberou o resultado."}
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {segments.map((segment) => {
                  const SegmentIcon = wheelIconMap[segment.key];

                  return (
                    <div
                      key={segment.key}
                      className={cn(
                        "flex items-center justify-between gap-3 rounded-2xl border px-3 py-2 text-sm",
                        segment.key === result.outcome.key && isRevealed
                          ? "border-slate-300/24 bg-slate-300/10 text-slate-50"
                          : "border-white/8 bg-white/[0.028] text-white/58",
                      )}
                    >
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: segment.color }}
                        />
                        <SegmentIcon className="h-3.5 w-3.5 shrink-0" />
                        {segment.label}
                      </span>
                      <span className="font-mono text-xs">
                        {segment.weight}%
                      </span>
                    </div>
                  );
                })}
              </div>

              {isRevealed ? (
                <Button
                  type="button"
                  className="h-11 cursor-pointer rounded-2xl"
                  onClick={() => onOpenChange(false)}
                >
                  Fechar
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
