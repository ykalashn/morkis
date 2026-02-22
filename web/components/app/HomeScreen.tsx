"use client";

import { AlertTriangle, Building2, Coffee, Pencil, Trash2, Utensils } from "lucide-react";
import { useRef, useState } from "react";
import type { Pact } from "@/types/domain";

const MONSTER_IMAGE =
  "https://res.cloudinary.com/yevhenii-kalashnyk/image/upload/e_background_removal/c_fill,ar_3:4,g_auto,f_png/v1771693879/Gemini_Generated_Image_3goprg3goprg3gop_l9flik.png";

type HomeScreenProps = {
  pacts: Pact[];
  userName: string;
  onChangeUserName: (name: string) => void;
  onOpenContract: () => void;
  onOpenAddOrg: () => void;
  onTriggerFailure: () => void;
  onDeletePact: (id: string) => void;
};

function PactIcon({ title }: { title: string }) {
  const normalized = title.toLowerCase();
  if (normalized.includes("coffee") || normalized.includes("fika")) return <Coffee className="h-5 w-5 text-coral" />;
  return <Utensils className="h-5 w-5 text-moss" />;
}

export function HomeScreen({ pacts, userName, onChangeUserName, onOpenContract, onOpenAddOrg, onTriggerFailure, onDeletePact }: HomeScreenProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(userName);
  const inputRef = useRef<HTMLInputElement>(null);

  function startEditing() {
    setDraft(userName);
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  }

  function commitEdit() {
    const trimmed = draft.trim();
    if (trimmed) onChangeUserName(trimmed);
    setEditing(false);
  }

  return (
    <section className="mx-auto max-w-2xl space-y-5">

      {/* Greeting */}
      <div className="flex items-center gap-3">
        <img src={MONSTER_IMAGE} alt="Morkis" className="h-12 w-10 object-contain" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {editing ? (
              <input
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") setEditing(false); }}
                className="w-40 rounded-lg border-2 border-moss bg-transparent px-2 py-0.5 font-[var(--font-display)] text-2xl font-extrabold outline-none md:text-3xl"
                autoFocus
              />
            ) : (
              <button
                type="button"
                onClick={startEditing}
                className="group flex items-center gap-1.5"
              >
                <p className="font-[var(--font-display)] text-2xl font-extrabold md:text-3xl">Hey, {userName}</p>
                <Pencil className="h-4 w-4 text-muted opacity-0 transition-opacity group-hover:opacity-100" />
              </button>
            )}
          </div>
          <p className="text-sm text-muted">Day 12 of being honest</p>
        </div>
      </div>

      {/* Stat cards — IP and Streak side by side */}
      <div className="grid grid-cols-2 gap-4">
        <div className="morkis-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg border-2 border-moss bg-moss/10 font-[var(--font-display)] text-xs font-extrabold text-moss">
              IP
            </div>
            <p className="font-[var(--font-mono)] text-xs uppercase tracking-widest text-muted">Integrity</p>
          </div>
          <p className="font-[var(--font-display)] text-2xl font-extrabold">2,340</p>
          <p className="font-[var(--font-display)] text-sm font-bold text-moss">+180 today</p>
        </div>

        <div className="morkis-card p-4">
          <p className="mb-2 font-[var(--font-display)] text-xs font-bold uppercase tracking-widest text-muted">Streak</p>
          <div className="grid grid-cols-7 gap-1">
            {(["M","T","W","T","F","S","S"] as const).map((day, i) => (
              <div
                key={i}
                className={`flex h-7 items-center justify-center rounded text-[10px] font-bold ${
                  i < 4 ? "bg-moss text-white" : "bg-cream text-ink/25"
                }`}
              >
                {day}
              </div>
            ))}
          </div>
          <p className="mt-2 font-[var(--font-mono)] text-[10px] text-muted">4-day streak 🔥</p>
        </div>
      </div>

      {/* Active Pacts */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="font-[var(--font-display)] text-base font-bold uppercase tracking-widest">Active Pacts</p>
          <button
            type="button"
            onClick={onOpenContract}
            className="font-[var(--font-display)] text-sm font-bold uppercase tracking-widest text-moss"
          >
            + New
          </button>
        </div>

        <div className="space-y-3">
          {pacts.map((pact) => {
            const isDanger = pact.status === "danger";
            return (
              <div key={pact.id} className="group relative">
              <button
                type="button"
                onClick={isDanger ? onTriggerFailure : undefined}
                className={`morkis-card w-full p-4 text-left ${isDanger ? "danger-pulse" : "border-moss/60"}`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg border-2 ${isDanger ? "border-coral bg-coral/10" : "border-moss bg-moss/10"}`}>
                      <PactIcon title={pact.title} />
                    </div>
                    <div>
                      <p className="font-[var(--font-display)] text-base font-bold text-ink">{pact.title}</p>
                      <p className={`font-[var(--font-mono)] text-xs ${isDanger ? "text-coral" : "text-muted"}`}>
                        {isDanger ? "2/2 used — careful!" : `${pact.daysRemaining} days remaining`}
                      </p>
                    </div>
                  </div>
                  <p className={`font-[var(--font-display)] text-base font-extrabold ${isDanger ? "text-coral" : "text-moss"}`}>
                    €{pact.stakeEuro}
                  </p>
                </div>

                <div className="h-3 w-full overflow-hidden rounded-full border-2 border-ink/10 bg-cream">
                  <div
                    className={`h-full rounded-full ${isDanger ? "bg-coral" : "bg-moss"}`}
                    style={{ width: `${pact.progressPercent}%` }}
                  />
                </div>

                <div className="mt-1.5 flex justify-between">
                  <span className="font-[var(--font-mono)] text-xs text-muted">
                    {pact.spendingLimit != null
                      ? `€${pact.spentEuro ?? 0} / €${pact.spendingLimit}`
                      : `Day ${isDanger ? "6/7" : "4/7"}`}
                  </span>
                  {isDanger ? (
                    <span className="font-[var(--font-mono)] text-xs font-bold text-coral">
                      <AlertTriangle className="mr-1 inline h-3 w-3" /> Danger zone
                    </span>
                  ) : (
                    <span className="font-[var(--font-mono)] text-xs font-bold text-moss">On track ✓</span>
                  )}
                </div>

                <p className={`mt-2 border-t pt-2 font-[var(--font-mono)] text-[10px] text-muted ${isDanger ? "border-coral/20" : "border-ink/5"}`}>
                  {isDanger ? "One more visit → " : "If you fail → "}
                  <span className="font-bold text-coral">{pact.nemesis ?? "your nemesis"} gets €{pact.stakeEuro}</span>
                </p>
              </button>
              <button
                type="button"
                onClick={() => onDeletePact(pact.id)}
                className="absolute right-2 top-2 rounded-lg p-1.5 text-muted opacity-0 transition-opacity group-hover:opacity-100 hover:bg-coral/10 hover:text-coral"
                aria-label="Delete pact"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <button
          type="button"
          onClick={onOpenContract}
          className="morkis-button bg-moss px-3 py-3 text-sm uppercase tracking-widest text-white"
        >
          + New Pact
        </button>
        <button
          type="button"
          onClick={onOpenAddOrg}
          className="morkis-button border-2 border-ink/10 bg-cream px-3 py-3 text-sm uppercase tracking-widest text-ink"
        >
          <Building2 className="mr-1 inline h-4 w-4" />
          Add Org
        </button>
      </div>
    </section>
  );
}
