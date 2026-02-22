"use client";

import { Building2, Flame, Globe, HeartCrack, Landmark, Megaphone, UserX } from "lucide-react";
import { useMemo, useState } from "react";

type ContractScreenProps = {
  onCreate: (input: { title: string; stakeEuro: number }) => void;
};

const presets = [
  "Not order from Wolt this week",
  "Max 2 Espresso House visits",
  "No Zalando purchases",
  "No alcohol this week",
  "Gym at least 3 times"
];

const nemesisOptions = [
  { title: "The Politician", detail: "Funds the campaign you despise", Icon: Landmark },
  { title: "The Ex", detail: "Swish payment with your name on it", Icon: HeartCrack },
  { title: "The Influencer", detail: "Sponsors the most insufferable creator", Icon: Megaphone },
  { title: "The Anti-Cause", detail: "Funds an org against your values", Icon: Flame },
  { title: "A lobbying group you hate", detail: "Donation to their advocacy fund", Icon: Building2 },
  { title: "The cause you oppose most", detail: "Your stake becomes their donation", Icon: Globe },
  { title: "Someone specific", detail: "They get a payment with your name", Icon: UserX }
];

export function ContractScreen({ onCreate }: ContractScreenProps) {
  const [title, setTitle] = useState("Not order from Wolt this week");
  const [stake, setStake] = useState(30);
  const [duration, setDuration] = useState(7);
  const [selectedNemesis, setSelectedNemesis] = useState("The Politician");

  const reaction = useMemo(() => {
    if (stake <= 20) return { text: "That all?", color: "text-muted" };
    if (stake <= 40) return { text: "Not bad!", color: "text-moss" };
    if (stake <= 70) return { text: "Now we're talking!", color: "text-moss" };
    return { text: "BRAVE!", color: "text-coral" };
  }, [stake]);

  return (
    <section className="mx-auto max-w-lg space-y-5">
      <h2 className="font-[var(--font-display)] text-3xl font-extrabold">New Pact</h2>

      <div className="morkis-card border-dashed border-moss p-5">
        <p className="mb-3 font-[var(--font-mono)] text-xs uppercase tracking-[0.2em] text-muted">Smart Contract - Draft</p>
        <p className="mb-2 font-[var(--font-display)] text-sm font-bold uppercase tracking-widest text-ink/40">I promise to...</p>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="w-full rounded-xl border-2 border-ink/10 bg-cream px-3 py-2.5 font-[var(--font-display)] text-base font-bold outline-none focus:border-moss"
          placeholder="Type your promise here"
        />

        <div className="mt-3 flex flex-wrap gap-2">
          {presets.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setTitle(preset)}
              className="rounded-full border-2 border-ink/10 bg-cream px-3 py-2 text-sm font-semibold text-ink/60 hover:border-moss hover:text-moss"
            >
              {preset.replace("Not order from ", "No ").replace(" this week", "")}
            </button>
          ))}
        </div>

        <div className="my-5 border-t-2 border-dashed border-ink/10" />

        <div className="text-center">
          <p className="font-[var(--font-mono)] text-xs uppercase tracking-[0.2em] text-muted">Your Stake</p>
          <p className="font-[var(--font-display)] text-5xl font-extrabold">€{stake}</p>
          <p className={`mt-1 text-xs font-bold ${reaction.color}`}>{reaction.text}</p>
        </div>

        <input
          type="range"
          min={1}
          max={100}
          step={1}
          value={stake}
          onChange={(event) => setStake(Number(event.target.value))}
          className="mt-3 w-full accent-moss"
        />
        <div className="mt-1 flex justify-between font-[var(--font-mono)] text-xs text-muted">
          <span>€1</span>
          <span>€100</span>
        </div>
      </div>

      <div>
        <p className="mb-3 font-[var(--font-display)] text-sm font-bold uppercase tracking-widest">Duration</p>
        <div className="flex gap-2">
          {[7, 14, 30].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setDuration(value)}
              className={`flex-1 rounded-xl border-2 px-3 py-3 text-sm font-bold ${
                duration === value ? "border-moss bg-moss text-white" : "border-ink/10 bg-cream text-ink"
              }`}
            >
              {value} days
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="font-[var(--font-display)] text-sm font-bold uppercase tracking-widest">If you fail, your money goes to...</p>
        <p className="mb-3 font-[var(--font-mono)] text-xs text-muted">Pick something you would hate to fund. That is the point.</p>
        <div className="space-y-2">
          {nemesisOptions.map((option) => {
            const selected = option.title === selectedNemesis;
            return (
              <button
                key={option.title}
                type="button"
                onClick={() => setSelectedNemesis(option.title)}
                className={`flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left ${
                  selected ? "border-moss bg-moss/5" : "border-ink/10 bg-cream"
                }`}
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border-2 border-ink/20 bg-coral/10">
                  <option.Icon className="h-4 w-4 text-coral" />
                </span>
                <span className="flex-1">
                  <span className="block font-[var(--font-display)] text-base font-bold">{option.title}</span>
                  <span className="block font-[var(--font-mono)] text-xs text-muted">{option.detail}</span>
                </span>
                <span
                  className={`inline-flex h-5 w-5 items-center justify-center rounded-full border-2 text-[10px] font-black ${
                    selected ? "border-moss bg-moss text-white" : "border-ink/20 text-transparent"
                  }`}
                >
                  ✓
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onCreate({ title, stakeEuro: stake })}
        className="morkis-button w-full bg-moss px-6 py-4 text-base uppercase tracking-widest text-white"
      >
        Sign the Pact
      </button>
      <p className="text-center font-[var(--font-mono)] text-xs text-muted">By signing, you agree Morkis owns your dignity.</p>
    </section>
  );
}
