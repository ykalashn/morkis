"use client";

import { useEffect, useRef } from "react";
import { HeartOff, Search, Volume2 } from "lucide-react";
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

  return (
    <section className="mx-auto flex max-w-lg flex-col items-center space-y-4">
      <img src={MONSTER_IMAGE} alt="Morkis" className="w-28 object-contain" />

      <p className="font-[var(--font-display)] text-lg font-extrabold uppercase tracking-[0.2em] text-coral">MORKIS HAS BITTEN</p>
      <p className="text-base text-muted">You broke your word. Here is what happened:</p>

      <div className="w-full rounded-xl bg-coral/10 p-4">
        <p className="font-[var(--font-display)] text-sm font-bold uppercase tracking-widest text-coral">
          <Search className="mr-1 inline h-4 w-4" /> How we caught you
        </p>
        <div className="mt-2 space-y-2 text-sm text-ink/60">
          <p><strong className="text-ink/80">Tink Open Banking</strong> monitored your transactions in real-time.</p>
          <p>It detected a <strong className="text-ink/80">Wolt payment</strong> matching your failed pact.</p>
          <p><strong className="text-ink/80">Stripe</strong> transferred your stake to your nemesis automatically.</p>
        </div>
      </div>

      <div className="morkis-card w-full border-dashed p-5">
        <p className="font-[var(--font-mono)] text-xs uppercase tracking-[0.2em] text-muted">Bite Receipt - #MK-4491</p>
        <p className="mt-1 text-center font-[var(--font-display)] text-5xl font-extrabold text-coral">{payload.amount}</p>
        <p className="text-center text-base text-muted">captured & transferred via Stripe</p>
        <div className="mt-4 space-y-2 border-t-2 border-dashed border-ink/10 pt-3 text-sm">
          <div className="flex justify-between"><span className="font-[var(--font-mono)] text-xs uppercase text-muted">Pact</span><span className="font-[var(--font-display)] font-bold">{payload.failedGoal}</span></div>
          <div className="flex justify-between"><span className="font-[var(--font-mono)] text-xs uppercase text-muted">Broken</span><span className="font-[var(--font-display)] font-bold text-coral">Thu 01:47 AM</span></div>
          <div className="flex justify-between"><span className="font-[var(--font-mono)] text-xs uppercase text-muted">Trigger</span><span className="font-[var(--font-display)] font-bold">Wolt — €34.90</span></div>
          <div className="flex justify-between"><span className="font-[var(--font-mono)] text-xs uppercase text-muted">Detected by</span><span className="font-[var(--font-display)] font-bold">Tink Open Banking</span></div>
          <div className="flex justify-between"><span className="font-[var(--font-mono)] text-xs uppercase text-muted">Sent to</span><span className="font-[var(--font-display)] font-bold text-coral">{payload.antiCharity}</span></div>
        </div>
      </div>

      <div className="w-full rounded-xl bg-coral/10 p-4">
        <p className="font-[var(--font-display)] text-sm font-bold uppercase tracking-widest text-coral">Your Roast</p>
        <div className="mt-2 rounded-xl border-2 border-ink/5 bg-cream p-3">
          <p className="font-[var(--font-display)] text-sm italic leading-relaxed text-ink/70">
            "Oh look, {payload.userName} failed &quot;{payload.failedGoal}&quot;. {payload.antiCharity} just got <span className="font-extrabold text-coral not-italic">{payload.amount} richer.</span>"
          </p>
        </div>

        <button
          type="button"
          onClick={() => void play()}
          disabled={status === "loading"}
          className="morkis-button mt-3 w-full bg-coral px-4 py-3 text-xs uppercase tracking-widest text-white disabled:opacity-70"
        >
          <Volume2 className="mr-2 inline h-4 w-4" />
          {status === "loading" ? "Loading Roast..." : "Play AI Roast"}
        </button>
        <p className="mt-2 text-center font-[var(--font-mono)] text-xs text-muted">
          {status === "playing" ? "Now playing" : status === "loading" ? "Contacting ElevenLabs..." : "Voice roast ready"}
        </p>
        {error ? <p className="mt-1 text-center text-xs text-coral">{error}</p> : null}
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
  );
}
