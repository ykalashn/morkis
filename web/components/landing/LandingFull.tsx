"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ComponentType } from "react";
import {
  Beer,
  BookOpen,
  Coffee,
  Dumbbell,
  Flame,
  HeartCrack,
  Landmark,
  Megaphone,
  PiggyBank,
  Pizza,
  Salad,
  ShoppingCart,
  Store,
  Utensils,
  UtensilsCrossed,
  X
} from "lucide-react";

const MONSTER_IMAGE =
  "https://res.cloudinary.com/yevhenii-kalashnyk/image/upload/e_background_removal/c_fill,ar_3:4,g_auto,f_png/v1771693879/Gemini_Generated_Image_3goprg3goprg3gop_l9flik.png";

type NemesisCard = {
  title: string;
  category: string;
  description: string;
  stat: string;
  Icon: ComponentType<{ className?: string }>;
};

const nemesisCards: NemesisCard[] = [
  {
    title: "The Politician",
    category: "Politics",
    description: "Your money funds the campaign of the candidate whose values you find most repulsive.",
    stat: "Most chosen: 42%",
    Icon: Landmark
  },
  {
    title: "The Influencer",
    category: "Cringe",
    description: "Your stake sponsors the most insufferable content creator you can think of.",
    stat: "Pain index: 9.2/10",
    Icon: Megaphone
  },
  {
    title: "The Anti-Cause",
    category: "Ideology",
    description: "Your deposit funds an organization that stands for everything you are against.",
    stat: "Existential dread: 10/10",
    Icon: Flame
  }
];

const waveformBars = 72;

function Waveform() {
  const [playing, setPlaying] = useState(false);

  const bars = useMemo(
    () =>
      Array.from({ length: waveformBars }, (_, index) => {
        const idle = 8;
        const active = 12 + Math.round(Math.random() * 62);
        return {
          id: index,
          height: playing ? active : idle,
          color:
            index < waveformBars * 0.3
              ? "#FF4B4B"
              : index < waveformBars * 0.65
                ? "#006D5B"
                : "#006D5B66"
        };
      }),
    [playing]
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setPlaying((v) => !v)}
        className="flex h-24 w-full items-center justify-center gap-[3px]"
      >
        {bars.map((bar) => (
          <span
            key={bar.id}
            className="block w-1 rounded-full transition-all duration-150"
            style={{ height: `${bar.height}px`, backgroundColor: bar.color }}
          />
        ))}
      </button>
      <button
        type="button"
        onClick={() => setPlaying((v) => !v)}
        className="morkis-button mt-6 inline-flex items-center gap-3 bg-coral px-8 py-3 text-sm uppercase tracking-widest text-white"
      >
        {playing ? "Playing..." : "Play Roast"}
      </button>
    </>
  );
}

export function LandingFull() {
  const [captureVisible, setCaptureVisible] = useState(false);
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);
  const [email, setEmail] = useState("");

  return (
    <main className="bg-white text-ink">
      <nav className="sticky top-0 z-50 border-b border-ink/10 bg-cream/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <img src={MONSTER_IMAGE} alt="Morkis" className="h-10 w-8 object-contain" />
            <span className="font-[var(--font-display)] text-xl font-extrabold tracking-wide">MORKIS</span>
          </div>
          <div className="hidden items-center gap-8 font-[var(--font-display)] text-sm font-semibold text-ink/60 md:flex">
            <a href="#nemesis">Nemesis Fund</a>
            <a href="#bite">The Bite</a>
            <a href="#oracle">Oracle</a>
            <a href="#roast">Roast</a>
          </div>
          <Link href="/app" className="morkis-button bg-moss px-6 py-2.5 text-sm tracking-wide text-white">
            TRY THE APP
          </Link>
        </div>
      </nav>

      <section className="min-h-[88vh] border-b border-border px-6 pt-16">
        <div className="mx-auto grid max-w-7xl items-center gap-12 py-16 md:grid-cols-2">
          <div>
            <h1 className="font-[var(--font-display)] text-5xl font-extrabold leading-tight sm:text-6xl">
              Prove you mean it.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink/65">
              Morkis is the AI that monitors your bank feed and <span className="font-semibold text-coral">eats your money</span> if
              you break your word. Powered by loss aversion.
            </p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row md:items-start">
              <Link
                href="/app"
                className="morkis-button inline-block bg-moss px-8 py-4 text-sm uppercase tracking-[0.2em] text-white"
              >
                TRY THE APP
              </Link>
              <button
                type="button"
                onClick={() => {
                  setWaitlistSubmitted(false);
                  setWaitlistOpen(true);
                }}
                className="morkis-button border-2 border-ink/10 bg-cream px-8 py-4 text-sm uppercase tracking-[0.2em] text-ink"
              >
                JOIN THE WAITLIST
              </button>
            </div>
          </div>
          <div className="flex justify-center">
            <img src={MONSTER_IMAGE} alt="Morkis Monster" className="w-[340px] max-w-full" />
          </div>
        </div>
      </section>

      <section id="nemesis" className="border-b border-border px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <p className="font-[var(--font-display)] text-xs font-bold uppercase tracking-[0.2em] text-coral">The Nemesis Fund</p>
          <h2 className="mt-4 font-[var(--font-display)] text-4xl font-extrabold sm:text-5xl">
            Choose your punishment.
          </h2>
          <p className="mt-4 max-w-2xl text-lg text-ink/65">
            If you fail, your Stripe deposit does not go to us. It goes to them.
          </p>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {nemesisCards.map((card) => (
              <Link key={card.title} href="/app" className="morkis-card group p-8 transition hover:-translate-y-1 hover:shadow-sm">
                <span className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl border-2 border-ink bg-coral/10">
                  <card.Icon className="h-5 w-5 text-coral" />
                </span>
                <p className="font-[var(--font-display)] text-xs font-bold uppercase tracking-widest text-coral">
                  Category: {card.category}
                </p>
                <h3 className="mt-2 font-[var(--font-display)] text-2xl font-extrabold">{card.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink/65">{card.description}</p>
                <div className="mt-6 flex items-center justify-between border-t-2 border-ink/10 pt-4">
                  <span className="font-[var(--font-mono)] text-xs text-muted">{card.stat}</span>
                  <span className="font-[var(--font-display)] text-sm font-bold text-moss transition group-hover:translate-x-1">
                    SELECT →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="bite" className="border-b border-border px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <p className="font-[var(--font-display)] text-xs font-bold uppercase tracking-[0.2em] text-moss">The Bite Mechanism</p>
          <h2 className="mt-4 font-[var(--font-display)] text-4xl font-extrabold sm:text-5xl">Promise. Fail. Pay.</h2>
          <p className="mt-4 max-w-2xl text-lg text-ink/65">
            Morkis watches your bank feed in real-time. The moment you break your word, the capture is instant.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <article className="morkis-card border-moss/60 overflow-hidden">
              <header className="flex items-center justify-between border-b-2 border-ink/10 px-6 py-4">
                <span className="font-[var(--font-display)] text-xs font-bold uppercase tracking-widest text-moss">The Promise</span>
                <span className="font-[var(--font-mono)] text-[10px] text-muted">SIGNED · 2026-02-21T21:22:00Z</span>
              </header>
              <div className="p-6">
                <div className="rounded-xl border-2 border-ink/10 bg-cream p-5">
                  <p className="font-[var(--font-display)] text-xl font-bold">
                    "I will not spend more than <span className="text-moss">€40</span> on takeout this week."
                  </p>
                  <p className="mt-3 text-xs text-muted">Erik Petersson · Verified</p>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border-2 border-ink/10 bg-cream p-3">
                    <p className="text-[10px] uppercase text-muted">Stake</p>
                    <p className="font-[var(--font-display)] text-lg font-bold">€20</p>
                  </div>
                  <div className="rounded-xl border-2 border-ink/10 bg-cream p-3">
                    <p className="text-[10px] uppercase text-muted">Nemesis</p>
                    <p className="font-[var(--font-display)] text-lg font-bold text-coral">The Politician</p>
                  </div>
                </div>
              </div>
            </article>

            <article className="morkis-card relative overflow-hidden">
              <header className="flex items-center justify-between border-b-2 border-ink/10 px-6 py-4">
                <span className="font-[var(--font-display)] text-xs font-bold uppercase tracking-widest">Bank Feed — Live</span>
                <span className="font-[var(--font-mono)] text-[10px] text-muted">transaction.created</span>
              </header>
              <div className="space-y-2 p-6">
                {[
                  { icon: Store, label: "ICA Nära", info: "Mon · Groceries", amount: "-€12.40", danger: false },
                  { icon: Coffee, label: "Espresso House", info: "Tue · Fika", amount: "-€5.80", danger: false },
                  { icon: Utensils, label: "Foodora", info: "Wed · Eating Out", amount: "-€18.90", danger: false },
                  { icon: UtensilsCrossed, label: "Wolt", info: "Thu 01:47 · LIMIT BREACHED", amount: "-€42.50", danger: true }
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => item.danger && setCaptureVisible(true)}
                    className={`flex w-full items-center justify-between rounded-xl border-2 px-3 py-3 text-left ${
                      item.danger ? "border-coral bg-coral/5" : "border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-ink/20 bg-cream">
                        <item.icon className={`h-4 w-4 ${item.danger ? "text-coral" : "text-ink/50"}`} />
                      </span>
                      <div>
                        <p className={`font-[var(--font-display)] text-sm font-bold ${item.danger ? "text-coral" : "text-ink"}`}>
                          {item.label}
                        </p>
                        <p className="font-[var(--font-mono)] text-[10px] text-muted">{item.info}</p>
                      </div>
                    </div>
                    <span className={`font-[var(--font-mono)] text-sm ${item.danger ? "font-bold text-coral" : "text-ink/60"}`}>
                      {item.amount}
                    </span>
                  </button>
                ))}
              </div>

              {captureVisible ? (
                <div className="absolute inset-0 grid place-items-center bg-cream/95 p-8">
                  <div className="max-w-xs text-center">
                    <img src={MONSTER_IMAGE} alt="Morkis" className="mx-auto h-20 w-16 object-contain" />
                    <p className="mt-3 font-[var(--font-display)] text-xs font-extrabold uppercase tracking-[0.25em] text-coral">
                      Morkis Has Bitten
                    </p>
                    <div className="morkis-card mt-3 border-coral p-5">
                      <p className="font-[var(--font-mono)] text-[10px] uppercase tracking-widest text-muted">Stripe Capture Receipt</p>
                      <p className="mt-2 font-[var(--font-display)] text-4xl font-extrabold text-coral">€50.00</p>
                      <p className="text-sm text-ink/65">Payment captured & transferred</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCaptureVisible(false)}
                      className="morkis-button mt-5 bg-white px-6 py-2 text-xs uppercase tracking-widest text-ink"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ) : null}
            </article>
          </div>
        </div>
      </section>

      <section id="oracle" className="border-b border-border px-6 py-24">
        <div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-5">
          <div className="md:col-span-2">
            <p className="font-[var(--font-display)] text-xs font-bold uppercase tracking-[0.2em] text-moss">The Oracle</p>
            <h2 className="mt-4 font-[var(--font-display)] text-4xl font-extrabold sm:text-5xl">Integrity Volatility.</h2>
            <p className="mt-4 text-lg text-ink/65">
              Our data engine analyzes six months of transactions to calculate your integrity score.
            </p>
            <div className="mt-6 space-y-3">
              <div className="morkis-card flex items-center justify-between p-4">
                <p className="text-sm text-ink/70">Integrity Score</p>
                <p className="font-[var(--font-display)] text-2xl font-extrabold text-coral">78%</p>
              </div>
              <div className="morkis-card flex items-center justify-between p-4">
                <p className="text-sm text-ink/70">Stake Multiplier</p>
                <p className="font-[var(--font-display)] text-2xl font-extrabold text-moss">2.4x</p>
              </div>
              <div className="morkis-card flex items-center justify-between p-4">
                <p className="text-sm text-ink/70">Weak Day</p>
                <p className="font-[var(--font-display)] text-2xl font-extrabold">THU</p>
              </div>
            </div>
          </div>

          <div className="morkis-card md:col-span-3 p-6">
            <p className="font-[var(--font-display)] text-xs font-bold uppercase tracking-widest text-moss">
              Integrity Volatility Index
            </p>
            <svg viewBox="0 0 620 300" className="mt-6 w-full" xmlns="http://www.w3.org/2000/svg" aria-label="integrity graph">
              <line x1="0" y1="60" x2="600" y2="60" stroke="#1E1E1E" strokeWidth="1" opacity="0.08" />
              <line x1="0" y1="120" x2="600" y2="120" stroke="#1E1E1E" strokeWidth="1" opacity="0.08" />
              <line x1="0" y1="180" x2="600" y2="180" stroke="#1E1E1E" strokeWidth="1" opacity="0.08" />
              <line x1="0" y1="240" x2="600" y2="240" stroke="#1E1E1E" strokeWidth="1" opacity="0.08" />

              <defs>
                <linearGradient id="graphFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#006D5B" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#FF4B4B" stopOpacity="0.05" />
                </linearGradient>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#006D5B" />
                  <stop offset="70%" stopColor="#006D5B" />
                  <stop offset="100%" stopColor="#FF4B4B" />
                </linearGradient>
              </defs>

              <path
                d="M 40 200 C 80 180, 100 160, 130 170 S 180 120, 220 140 S 260 100, 300 130 S 350 90, 380 110 S 420 80, 450 150 S 500 200, 540 220 S 570 250, 590 260 L 590 280 L 40 280 Z"
                fill="url(#graphFill)"
              />
              <path
                d="M 40 200 C 80 180, 100 160, 130 170 S 180 120, 220 140 S 260 100, 300 130 S 350 90, 380 110 S 420 80, 450 150 S 500 200, 540 220 S 570 250, 590 260"
                fill="none"
                stroke="url(#lineGrad)"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </section>

      <section id="roast" className="border-b border-border px-6 py-24">
        <div className="mx-auto max-w-4xl text-center">
          <p className="font-[var(--font-display)] text-xs font-bold uppercase tracking-[0.2em] text-coral">The Roast · ElevenLabs</p>
          <h2 className="mt-4 font-[var(--font-display)] text-4xl font-extrabold sm:text-5xl">Hear your failure.</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-ink/65">
            Morkis delivers personalized voice roasts. Posh. Malicious. Unforgettable.
          </p>

          <div className="morkis-card mx-auto mt-10 max-w-2xl border-coral p-8">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-ink bg-coral/10">
                  <img src={MONSTER_IMAGE} alt="Morkis" className="h-9 w-7 object-contain" />
                </span>
                <div className="text-left">
                  <p className="font-[var(--font-display)] text-sm font-bold">Morkis Voice Agent</p>
                  <p className="font-[var(--font-mono)] text-[10px] text-muted">ElevenLabs · Posh but Malicious</p>
                </div>
              </div>
              <p className="font-[var(--font-mono)] text-[10px] uppercase tracking-widest text-muted">00:08</p>
            </div>

            <Waveform />

            <div className="mt-6 rounded-xl border-2 border-ink/10 bg-cream p-5 text-left">
              <p className="font-[var(--font-mono)] text-[10px] uppercase tracking-widest text-muted">Transcript</p>
              <p className="mt-3 font-[var(--font-display)] text-lg italic text-ink/80">
                "I saw that 3 AM kebab. Your rival team just got <span className="font-extrabold text-coral not-italic">€20 richer</span>
                thanks to your lack of discipline. <span className="font-extrabold text-coral not-italic">Pathetic.</span>"
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="warroom" className="border-b border-border px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <p className="text-center font-[var(--font-display)] text-xs font-bold uppercase tracking-[0.2em] text-moss">
            The War Room · Miro AI
          </p>
          <h2 className="mt-4 text-center font-[var(--font-display)] text-4xl font-extrabold sm:text-5xl">
            Your habits, dissected.
          </h2>

          <div className="morkis-card mt-10 overflow-hidden">
            <div className="grid gap-8 bg-[#FAFAFA] p-8 md:grid-cols-2">
              <div>
                <p className="text-center font-[var(--font-display)] text-sm font-bold uppercase tracking-widest text-moss">
                  Wealth Builders
                </p>
                <div className="mt-4 space-y-3">
                  {[
                    { label: "Gym Membership", info: "€29.99/mo · 94% attendance", Icon: Dumbbell },
                    { label: "Storytel Subscription", info: "€9.99/mo · 12 books completed", Icon: BookOpen },
                    { label: "Savings Transfer", info: "€200/mo · Automated", Icon: PiggyBank },
                    { label: "Meal Prep Sunday", info: "€35/wk · Consistent 3 months", Icon: Salad }
                  ].map((item) => (
                    <article key={item.label} className="rounded-xl border-2 border-moss bg-white p-4">
                      <p className="font-[var(--font-display)] text-sm font-bold text-moss">
                        <item.Icon className="mr-1 inline h-4 w-4" />
                        {item.label}
                      </p>
                      <p className="mt-1 font-[var(--font-mono)] text-[10px] text-muted">{item.info}</p>
                    </article>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-center font-[var(--font-display)] text-sm font-bold uppercase tracking-widest text-coral">
                  Morkis Food
                </p>
                <div className="mt-4 space-y-3">
                  {[
                    { label: "Late Night Foodora", info: "€180/mo · 73% after midnight", Icon: Pizza },
                    { label: "Pub Fridays", info: "€120/mo · Always exceeds €40 limit", Icon: Beer },
                    { label: "Impulse Zalando", info: "€95/mo · 60% items unused", Icon: ShoppingCart },
                    { label: "Triple Oat Lattes", info: "€65/mo · I deserve it tax", Icon: Coffee }
                  ].map((item) => (
                    <article key={item.label} className="rounded-xl border-2 border-coral bg-white p-4">
                      <p className="font-[var(--font-display)] text-sm font-bold text-coral">
                        <item.Icon className="mr-1 inline h-4 w-4" />
                        {item.label}
                      </p>
                      <p className="mt-1 font-[var(--font-mono)] text-[10px] text-muted">{item.info}</p>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-24 text-center">
        <div className="mx-auto max-w-3xl">
          <img src={MONSTER_IMAGE} alt="Morkis" className="mx-auto h-36 w-28 object-contain" />
          <h2 className="mt-6 font-[var(--font-display)] text-4xl font-extrabold leading-tight sm:text-5xl">
            A cold digital mirror that stakes your fortune on the person you pretend to be.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-ink/65">
            If your bank data proves you lied, the monster eats your deposit and sends it to your worst enemy.
          </p>
          <Link
            href="/app"
            className="morkis-button mt-8 inline-block bg-moss px-12 py-5 text-lg uppercase tracking-[0.2em] text-white"
          >
            TRY THE APP
          </Link>
          <div className="mt-4">
            <button
              type="button"
              onClick={() => {
                setWaitlistSubmitted(false);
                setWaitlistOpen(true);
              }}
              className="morkis-button border-2 border-ink/10 bg-cream px-10 py-4 text-base uppercase tracking-[0.2em] text-ink"
            >
              JOIN THE WAITLIST
            </button>
          </div>
          <p className="mt-6 font-[var(--font-display)] text-xs font-bold uppercase tracking-widest text-ink/40">
            Be the first to know when Morkis launches.
          </p>
        </div>
      </section>

      {waitlistOpen ? (
        <div className="fixed inset-0 z-[100]">
          <button
            type="button"
            aria-label="Close waitlist"
            className="absolute inset-0 h-full w-full bg-ink/40 backdrop-blur-sm"
            onClick={() => setWaitlistOpen(false)}
          />
          <div className="absolute left-1/2 top-1/2 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2">
            <div className="relative rounded-2xl border-2 border-ink/10 bg-white p-8">
              <button
                type="button"
                aria-label="Close"
                onClick={() => setWaitlistOpen(false)}
                className="absolute right-4 top-4 text-ink/30 hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>

              {!waitlistSubmitted ? (
                <>
                  <div className="mb-6 text-center">
                    <img src={MONSTER_IMAGE} alt="Morkis" className="mx-auto mb-4 h-20 w-16 object-contain" />
                    <h3 className="font-[var(--font-display)] text-2xl font-extrabold text-ink">Join the Waitlist</h3>
                    <p className="mt-2 text-sm text-ink/50">
                      Morkis is currently in prototype stage. Sign up and we&apos;ll keep you informed on all future progress.
                    </p>
                  </div>

                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      setWaitlistSubmitted(true);
                    }}
                    className="space-y-4"
                  >
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="w-full rounded-xl border-2 border-ink/10 bg-cream px-4 py-3 text-base text-ink placeholder:text-ink/30 outline-none focus:border-moss"
                      placeholder="your@email.com"
                    />
                    <button type="submit" className="morkis-button w-full bg-moss px-6 py-4 text-sm uppercase tracking-widest text-white">
                      Sign Me Up
                    </button>
                  </form>
                </>
              ) : (
                <div className="py-6 text-center">
                  <img src={MONSTER_IMAGE} alt="Morkis" className="mx-auto mb-4 h-20 w-16 object-contain" />
                  <p className="font-[var(--font-display)] text-2xl font-extrabold text-moss">You&apos;re on the list!</p>
                  <p className="mt-2 text-sm text-ink/50">We&apos;ll be in touch when Morkis is ready to bite.</p>
                </div>
              )}

              <p className="mt-4 text-center font-[var(--font-mono)] text-[10px] leading-relaxed text-ink/30">
                We respect your privacy. Your email will only be used to send updates about Morkis. You can unsubscribe at any time.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <footer className="border-t border-ink/10 px-6 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 md:flex-row">
          <div className="flex items-center gap-2">
            <img src={MONSTER_IMAGE} alt="Morkis" className="h-8 w-6 object-contain" />
            <span className="font-[var(--font-display)] text-lg font-extrabold">MORKIS</span>
            <span className="text-sm text-muted">Swedish for moral hangover</span>
          </div>
          <p className="font-[var(--font-display)] text-xs uppercase tracking-widest text-ink/40">
            Monzo · Stripe · ElevenLabs · Miro AI
          </p>
          <p className="text-sm text-muted">Built at HackEurope 2026</p>
        </div>
      </footer>
    </main>
  );
}
