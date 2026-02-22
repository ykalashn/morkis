"use client";

import { Building2, Loader2, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { MatchConfig, Organization } from "@/types/domain";
import { analyzePact } from "@/lib/api";

type ContractScreenProps = {
  organizations: Organization[];
  onCreate: (input: { title: string; stakeEuro: number; matchConfig: MatchConfig; nemesis: string }) => void;
};

type AnalysisState =
  | { status: "idle" }
  | { status: "analyzing" }
  | { status: "done"; config: MatchConfig }
  | { status: "error" };

export function ContractScreen({ organizations, onCreate }: ContractScreenProps) {
  const [title, setTitle] = useState("");
  const [stake, setStake] = useState(30);
  const [duration, setDuration] = useState(7);
  const [selectedNemesis, setSelectedNemesis] = useState(organizations[0]?.name ?? "");
  const [analysis, setAnalysis] = useState<AnalysisState>({ status: "idle" });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce: analyze pact title 700ms after user stops typing
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = title.trim();
    if (!trimmed) {
      setAnalysis({ status: "idle" });
      return;
    }
    setAnalysis({ status: "analyzing" });
    debounceRef.current = setTimeout(async () => {
      try {
        const config = await analyzePact(trimmed);
        setAnalysis({ status: "done", config });
      } catch {
        setAnalysis({ status: "error" });
      }
    }, 700);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [title]);

  const reaction = useMemo(() => {
    if (stake <= 20) return { text: "That all?", color: "text-muted" };
    if (stake <= 40) return { text: "Not bad!", color: "text-moss" };
    if (stake <= 70) return { text: "Now we're talking!", color: "text-moss" };
    return { text: "BRAVE!", color: "text-coral" };
  }, [stake]);

  const canSign = title.trim() && selectedNemesis && analysis.status === "done";

  function handleSign() {
    if (!canSign || analysis.status !== "done") return;
    onCreate({ title, stakeEuro: stake, matchConfig: analysis.config, nemesis: selectedNemesis });
  }

  return (
    <section className="mx-auto max-w-lg space-y-5">
      <h2 className="font-[var(--font-display)] text-3xl font-extrabold">New Pact</h2>

      <div className="morkis-card border-dashed border-moss p-5">
        <p className="mb-2 font-[var(--font-display)] text-sm font-bold uppercase tracking-widest text-ink/40">I promise to...</p>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-xl border-2 border-ink/10 bg-cream px-3 py-2.5 font-[var(--font-display)] text-base font-bold outline-none focus:border-moss"
          placeholder="e.g. No Wolt this week"
        />

        {/* AI analysis preview */}
        <div className="mt-3">
          {analysis.status === "analyzing" && (
            <div className="flex items-center gap-2 rounded-xl border-2 border-ink/10 bg-cream px-3 py-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted" />
              <p className="font-[var(--font-mono)] text-xs text-muted">Morkis is figuring out what to track...</p>
            </div>
          )}
          {analysis.status === "done" && (
            <div className="rounded-xl border-2 border-moss/40 bg-moss/5 px-3 py-2.5">
              <div className="flex items-start gap-2">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-moss" />
                <div className="min-w-0">
                  <p className="font-[var(--font-mono)] text-[10px] uppercase tracking-widest text-moss">Morkis will track</p>
                  <p className="font-[var(--font-display)] text-sm font-bold text-ink">{analysis.config.trackingLabel}</p>
                  {analysis.config.merchantKeywords.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {analysis.config.merchantKeywords.map((kw) => (
                        <span key={kw} className="rounded-full bg-moss/10 px-2 py-0.5 font-[var(--font-mono)] text-[10px] text-moss">
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {analysis.status === "error" && (
            <p className="font-[var(--font-mono)] text-xs text-coral">Could not analyze — check your connection.</p>
          )}
        </div>

        <div className="mt-4 mb-4 border-t-2 border-dashed border-ink/10" />

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
          onChange={(e) => setStake(Number(e.target.value))}
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

        {organizations.length === 0 ? (
          <div className="morkis-card flex flex-col items-center gap-2 p-6 text-center">
            <Building2 className="h-6 w-6 text-muted" />
            <p className="font-[var(--font-display)] text-sm font-bold">No organizations yet</p>
            <p className="font-[var(--font-mono)] text-xs text-muted">
              Go to Orgs and add at least one org you&apos;d hate to fund.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {organizations.map((org) => {
              const selected = org.name === selectedNemesis;
              return (
                <button
                  key={org.id}
                  type="button"
                  onClick={() => setSelectedNemesis(org.name)}
                  className={`flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left ${
                    selected ? "border-moss bg-moss/5" : "border-ink/10 bg-cream"
                  }`}
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border-2 border-ink/20 bg-coral/10">
                    <Building2 className="h-4 w-4 text-coral" />
                  </span>
                  <span className="flex-1">
                    <span className="block font-[var(--font-display)] text-base font-bold">{org.name}</span>
                    <span className="block font-[var(--font-mono)] text-xs text-muted">{org.type}</span>
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
        )}
      </div>

      <button
        type="button"
        onClick={handleSign}
        disabled={!canSign}
        className="morkis-button w-full bg-moss px-6 py-4 text-base uppercase tracking-widest text-white disabled:opacity-40"
      >
        {analysis.status === "analyzing" ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Analyzing...
          </span>
        ) : "Sign the Pact"}
      </button>
      <p className="text-center font-[var(--font-mono)] text-xs text-muted">By signing, you agree Morkis owns your dignity.</p>
    </section>
  );
}
