import { AlertTriangle, Coffee, Users, Utensils } from "lucide-react";
import type { Pact } from "@/types/domain";

const MONSTER_IMAGE =
  "https://res.cloudinary.com/yevhenii-kalashnyk/image/upload/e_background_removal/c_fill,ar_3:4,g_auto,f_png/v1771693879/Gemini_Generated_Image_3goprg3goprg3gop_l9flik.png";

type HomeScreenProps = {
  pacts: Pact[];
  onOpenContract: () => void;
  onOpenGroup: () => void;
  onTriggerFailure: () => void;
};

function PactIcon({ title }: { title: string }) {
  const normalized = title.toLowerCase();
  if (normalized.includes("coffee") || normalized.includes("fika")) return <Coffee className="h-5 w-5 text-coral" />;
  return <Utensils className="h-5 w-5 text-moss" />;
}

export function HomeScreen({ pacts, onOpenContract, onOpenGroup, onTriggerFailure }: HomeScreenProps) {
  return (
    <section className="grid gap-5 md:grid-cols-5">
      <div className="space-y-5 md:col-span-3">
        <div className="flex items-center justify-between md:hidden">
          <div>
            <p className="font-[var(--font-display)] text-2xl font-extrabold">Hey, Erik</p>
            <p className="text-sm text-muted">Day 12 of being honest</p>
          </div>
          <div className="morkis-card px-3 py-1.5">
            <p className="font-[var(--font-display)] text-base font-extrabold">12</p>
          </div>
        </div>

        <div className="hidden items-center justify-between md:flex">
          <div>
            <p className="font-[var(--font-display)] text-4xl font-extrabold">Hey, Erik</p>
            <p className="text-base text-muted">Day 12 of being honest</p>
          </div>
        </div>

        <div className="morkis-card border-moss p-6 text-center">
          <img src={MONSTER_IMAGE} alt="Morkis" className="mx-auto w-24 md:w-32" />
          <p className="mt-1 font-[var(--font-display)] text-lg font-extrabold text-moss">€340 saved by fear</p>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="font-[var(--font-display)] text-base font-bold uppercase tracking-widest">Active Pacts</p>
            <button type="button" onClick={onOpenContract} className="font-[var(--font-display)] text-sm font-bold uppercase tracking-widest text-moss">
              + New
            </button>
          </div>

          <div className="space-y-3">
            {pacts.map((pact) => {
              const isDanger = pact.status === "danger";
              return (
                <button
                  key={pact.id}
                  type="button"
                  onClick={isDanger ? onTriggerFailure : undefined}
                  className={`morkis-card w-full p-4 text-left ${isDanger ? "border-coral" : "border-moss/60"}`}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`inline-flex h-10 w-10 items-center justify-center rounded-lg border-2 ${
                          isDanger ? "border-coral bg-coral/10" : "border-moss bg-moss/10"
                        }`}
                      >
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
                    <span className="font-[var(--font-mono)] text-xs text-muted">Day {isDanger ? "6/7" : "4/7"}</span>
                    {isDanger ? (
                      <span className="font-[var(--font-mono)] text-xs font-bold text-coral">
                        <AlertTriangle className="mr-1 inline h-3 w-3" /> Danger zone
                      </span>
                    ) : (
                      <span className="font-[var(--font-mono)] text-xs font-bold text-moss">On track ✓</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="space-y-5 md:col-span-2">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border-2 border-moss bg-moss/20 font-[var(--font-display)] font-extrabold text-moss">
              IP
            </div>
            <div>
              <p className="font-[var(--font-display)] text-2xl font-extrabold">2,340</p>
              <p className="font-[var(--font-mono)] text-xs uppercase tracking-widest text-muted">Integrity Points</p>
            </div>
          </div>
          <p className="font-[var(--font-display)] text-base font-bold text-moss">+180</p>
        </div>

        <div className="p-4">
          <p className="mb-3 font-[var(--font-display)] text-sm font-bold uppercase tracking-widest">Trust Streak</p>
          <div className="grid grid-cols-7 gap-1.5">
            {[
              ["M", true],
              ["T", true],
              ["W", true],
              ["T", true],
              ["F", false],
              ["S", false],
              ["S", false]
            ].map(([day, active], index) => (
              <div
                key={`${String(day)}-${index}`}
                className={`flex h-8 items-center justify-center rounded-lg border-2 text-xs font-bold ${
                  active ? "border-ink bg-moss text-white" : "border-ink/10 bg-cream text-ink/30"
                }`}
              >
                {day}
              </div>
            ))}
          </div>
          <p className="mt-2 text-center font-[var(--font-mono)] text-xs text-muted">Don’t break it. Morkis gets dusty and sad.</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={onOpenContract} className="morkis-button bg-moss px-3 py-3 text-sm uppercase tracking-widest text-white">
            + New Pact
          </button>
          <button
            type="button"
            onClick={onOpenGroup}
            className="morkis-button border-2 border-ink/10 bg-cream px-3 py-3 text-sm uppercase tracking-widest text-ink"
          >
            <Users className="mr-1 inline h-4 w-4" />
            Group
          </button>
        </div>
      </div>
    </section>
  );
}
