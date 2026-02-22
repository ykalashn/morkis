"use client";

import { useEffect, useRef } from "react";
import { HeartOff, Volume2 } from "lucide-react";
import { useFailureRoast } from "@/features/failures/hooks/useFailureRoast";
import type { FailurePayload } from "@/types/domain";

const MONSTER_IMAGE =
  "https://res.cloudinary.com/yevhenii-kalashnyk/image/upload/e_background_removal/c_fill,ar_3:4,g_auto,f_png/v1771693879/Gemini_Generated_Image_3goprg3goprg3gop_l9flik.png";

type FailureScreenProps = {
  payload: FailurePayload;
  onAcknowledge: () => void;
};

export function FailureScreen({ payload, onAcknowledge }: FailureScreenProps) {
  const { status, error, play } = useFailureRoast(payload);
  const autoPlayedRef = useRef(false);

  useEffect(() => {
    if (autoPlayedRef.current) return;
    autoPlayedRef.current = true;
    void play();
  }, [play]);

  const isPlaying = status === "playing";
  const isLoading = status === "loading";

  return (
    <>
      <style>{`
        @keyframes morkis-talk {
          0%, 100% { transform: scale(1) rotate(0deg); }
          20%  { transform: scale(1.08) rotate(-3deg); }
          40%  { transform: scale(1.05) rotate(2.5deg); }
          60%  { transform: scale(1.08) rotate(-2deg); }
          80%  { transform: scale(1.04) rotate(1.5deg); }
        }
        @keyframes charge-fill {
          0%   { width: 4%;  opacity: 0.55; }
          60%  { opacity: 1; }
          100% { width: 92%; opacity: 0.65; }
        }
      `}</style>

      <section className="mx-auto flex max-w-lg flex-col items-center space-y-4">
        <img
          src={MONSTER_IMAGE}
          alt="Morkis"
          className="w-28 object-contain"
          style={isPlaying ? { animation: "morkis-talk 0.45s ease-in-out infinite" } : undefined}
        />

        <p className="font-[var(--font-display)] text-lg font-extrabold uppercase tracking-[0.2em] text-coral">MORKIS HAS BITTEN</p>
        <p className="text-base text-muted">You broke your word. Here is what happened:</p>

        <div className="morkis-card w-full border-dashed p-5">
          <p className="font-[var(--font-mono)] text-xs uppercase tracking-[0.2em] text-muted">Bite Receipt - #MK-4491</p>
          <p className="mt-1 text-center font-[var(--font-display)] text-5xl font-extrabold text-coral">{payload.amount}</p>
          <p className="text-center text-base text-muted">captured & transferred via Stripe</p>
          <div className="mt-4 space-y-2 border-t-2 border-dashed border-ink/10 pt-3 text-sm">
            <div className="flex justify-between"><span className="font-[var(--font-mono)] text-xs uppercase text-muted">Pact</span><span className="font-[var(--font-display)] font-bold">{payload.failedGoal}</span></div>
            {payload.trigger && (
              <div className="flex justify-between"><span className="font-[var(--font-mono)] text-xs uppercase text-muted">Trigger</span><span className="font-[var(--font-display)] font-bold">{payload.trigger}</span></div>
            )}
            <div className="flex justify-between"><span className="font-[var(--font-mono)] text-xs uppercase text-muted">Sent to</span><span className="font-[var(--font-display)] font-bold text-coral">{payload.antiCharity}</span></div>
          </div>
        </div>

        {/* Replay roast button */}
        <div className="w-full space-y-1">
          <button
            type="button"
            onClick={() => void play()}
            disabled={isLoading}
            className="morkis-button relative w-full overflow-hidden bg-coral px-4 py-3 text-xs uppercase tracking-widest text-white disabled:cursor-not-allowed"
          >
            {isLoading && (
              <span
                className="absolute inset-y-0 left-0 rounded-full bg-white/25"
                style={{ animation: "charge-fill 1.6s cubic-bezier(0.4, 0, 0.6, 1) infinite" }}
              />
            )}
            <span className="relative flex items-center justify-center gap-2">
              <Volume2 className={`h-4 w-4 ${isPlaying ? "animate-pulse" : ""}`} />
              {isLoading ? "Charging roast..." : isPlaying ? "Playing..." : "Replay Roast"}
            </span>
          </button>
          {error ? <p className="text-center font-[var(--font-mono)] text-xs text-coral">{error}</p> : null}
        </div>

        <div className="grid w-full grid-cols-2 gap-3">
          <div className="p-3 text-center">
            <p className="font-[var(--font-display)] text-xl font-extrabold text-coral">-180</p>
            <p className="font-[var(--font-mono)] text-xs uppercase text-muted">IP Lost</p>
          </div>
          <div className="p-3 text-center">
            <HeartOff className="mx-auto h-5 w-5 text-coral" />
            <p className="font-[var(--font-mono)] text-xs uppercase text-muted">Streak Broken</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onAcknowledge}
          className="morkis-button w-full bg-ink px-6 py-4 text-base uppercase tracking-widest text-white"
        >
          I Accept My Shame
        </button>
      </section>
    </>
  );
}
