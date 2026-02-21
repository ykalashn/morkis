"use client";

import { useMemo, useState } from "react";
import type { ComponentType } from "react";
import { Flame, House, PlusCircle, Store, Users } from "lucide-react";
import { ContractScreen } from "@/components/app/ContractScreen";
import { GroupScreen } from "@/components/app/GroupScreen";
import { HomeScreen } from "@/components/app/HomeScreen";
import { ShopScreen } from "@/components/app/ShopScreen";
import { FailureScreen } from "@/features/failures/components/FailureScreen";
import type { FailurePayload, Pact, ScreenId } from "@/types/domain";

const MONSTER_IMAGE =
  "https://res.cloudinary.com/yevhenii-kalashnyk/image/upload/e_background_removal/c_fill,ar_3:4,g_auto,f_png/v1771693879/Gemini_Generated_Image_3goprg3goprg3gop_l9flik.png";

const INITIAL_PACTS: Pact[] = [
  { id: "pact-1", title: "No Wolt this week", stakeEuro: 30, daysRemaining: 3, status: "on_track", progressPercent: 57 },
  { id: "pact-2", title: "Max 2 fikas this week", stakeEuro: 20, daysRemaining: 1, status: "danger", progressPercent: 85 }
];

const NAV_ITEMS: Array<{ id: Exclude<ScreenId, "bite">; label: string; icon: ComponentType<{ className?: string }> }> = [
  { id: "home", label: "Home", icon: House },
  { id: "contract", label: "Pact", icon: PlusCircle },
  { id: "group", label: "Group", icon: Users },
  { id: "shop", label: "Shop", icon: Store }
];

export function AppShell() {
  const [screen, setScreen] = useState<ScreenId>("home");
  const [pacts, setPacts] = useState<Pact[]>(INITIAL_PACTS);

  const failurePayload: FailurePayload = useMemo(
    () => ({
      userName: "Erik",
      failedGoal: pacts.find((p) => p.status === "danger")?.title ?? "your goal",
      amount: `€${pacts.find((p) => p.status === "danger")?.stakeEuro ?? 30}`
    }),
    [pacts]
  );

  function createPact(input: { title: string; stakeEuro: number }) {
    const nextPact: Pact = {
      id: crypto.randomUUID(),
      title: input.title.trim(),
      stakeEuro: input.stakeEuro,
      daysRemaining: 7,
      status: "on_track",
      progressPercent: 5
    };

    setPacts((current) => [nextPact, ...current]);
    setScreen("home");
  }

  return (
    <div className="min-h-screen bg-white pb-24 md:pb-8">
      <header className="sticky top-0 z-20 border-b border-border bg-cream/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <img src={MONSTER_IMAGE} alt="Morkis" className="h-10 w-8 object-contain" />
            <p className="font-[var(--font-display)] text-xl font-extrabold text-ink">MORKIS</p>
          </div>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setScreen(item.id)}
                className={`rounded-full px-4 py-2 font-[var(--font-display)] text-sm font-bold transition ${
                  screen === item.id ? "bg-moss/10 text-moss" : "text-ink/50 hover:bg-ink/5"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <div className="morkis-card flex items-center gap-1.5 px-3 py-1" style={{ borderWidth: 2 }}>
              <Flame className="h-4 w-4 text-coral" />
              <span className="font-[var(--font-display)] text-sm font-extrabold">12</span>
            </div>
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-ink bg-moss/10 text-xs font-bold text-moss">
              EK
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-6">
        {screen === "home" ? (
          <HomeScreen
            pacts={pacts}
            onOpenContract={() => setScreen("contract")}
            onOpenGroup={() => setScreen("group")}
            onTriggerFailure={() => setScreen("bite")}
          />
        ) : null}

        {screen === "contract" ? <ContractScreen onCreate={createPact} /> : null}
        {screen === "group" ? <GroupScreen onSeal={() => setScreen("home")} /> : null}
        {screen === "shop" ? <ShopScreen /> : null}
        {screen === "bite" ? <FailureScreen payload={failurePayload} onAcknowledge={() => setScreen("home")} /> : null}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-white md:hidden">
        <div className="grid grid-cols-4">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = screen === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setScreen(item.id)}
                className={`flex flex-col items-center gap-1 px-2 py-2 text-[10px] font-bold ${
                  active ? "text-moss" : "text-muted"
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
