"use client";

import { useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import { Building2, Flame, House, PlusCircle, RefreshCw, Store } from "lucide-react";
import { ContractScreen } from "@/components/app/ContractScreen";
import { OrgScreen } from "@/components/app/OrgScreen";
import { HomeScreen } from "@/components/app/HomeScreen";
import { ShopScreen } from "@/components/app/ShopScreen";
import { SyncScreen } from "@/components/app/SyncScreen";
import { FailureScreen } from "@/features/failures/components/FailureScreen";
import type { FailurePayload, Organization, Pact, ScreenId, Transaction } from "@/types/domain";
import { PLAID_USER_ID } from "@/components/app/PlaidConnectButton";

const API = "http://localhost:8000";

const MONSTER_IMAGE =
  "https://res.cloudinary.com/yevhenii-kalashnyk/image/upload/e_background_removal/c_fill,ar_3:4,g_auto,f_png/v1771693879/Gemini_Generated_Image_3goprg3goprg3gop_l9flik.png";

const INITIAL_PACTS: Pact[] = [
  {
    id: "pact-1",
    title: "No Wolt this week",
    stakeEuro: 30,
    daysRemaining: 3,
    status: "on_track",
    progressPercent: 0,
    category: "FOOD_AND_DRINK",
    spendingLimit: 30,
  },
  {
    id: "pact-2",
    title: "Max 2 fikas this week",
    stakeEuro: 20,
    daysRemaining: 1,
    status: "on_track",
    progressPercent: 0,
    category: "COFFEE",
    spendingLimit: 20,
  },
];

const NAV_ITEMS: Array<{ id: Exclude<ScreenId, "bite">; label: string; icon: ComponentType<{ className?: string }> }> = [
  { id: "home", label: "Home", icon: House },
  { id: "contract", label: "Pact", icon: PlusCircle },
  { id: "orgs", label: "Orgs", icon: Building2 },
  { id: "shop", label: "Shop", icon: Store },
  { id: "sync", label: "Sync", icon: RefreshCw },
];

/** Pure function — no React state dependency */
function computePactProgress(pacts: Pact[], transactions: Transaction[]): Pact[] {
  return pacts.map((pact) => {
    if (!pact.category || pact.spendingLimit == null) return pact;

    const matching = transactions.filter((t) => t.category === pact.category && t.amount > 0);
    const spentEuro = Math.round(matching.reduce((sum, t) => sum + t.amount, 0) * 100) / 100;
    const progressPercent = Math.min(100, Math.round((spentEuro / pact.spendingLimit) * 100));
    const status: "on_track" | "danger" = progressPercent >= 75 ? "danger" : "on_track";

    return { ...pact, spentEuro, progressPercent, status };
  });
}

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function AppShell() {
  const [screen, setScreen] = useState<ScreenId>("home");
  const [userName, setUserName] = useState<string>(() => loadFromStorage("morkis_user_name", "Erik"));
  const [pacts, setPacts] = useState<Pact[]>(() => loadFromStorage("morkis_pacts", INITIAL_PACTS));
  const [organizations, setOrganizations] = useState<Organization[]>(() =>
    loadFromStorage("morkis_orgs", [])
  );
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [apiReachable, setApiReachable] = useState(false);
  const [plaidConnected, setPlaidConnected] = useState(false);

  // Persist to localStorage whenever state changes
  useEffect(() => { localStorage.setItem("morkis_user_name", JSON.stringify(userName)); }, [userName]);
  useEffect(() => { localStorage.setItem("morkis_pacts", JSON.stringify(pacts)); }, [pacts]);
  useEffect(() => { localStorage.setItem("morkis_orgs", JSON.stringify(organizations)); }, [organizations]);

  const failurePayload: FailurePayload = useMemo(() => {
    const dangerPact = pacts.find((p) => p.status === "danger");
    return {
      userName,
      failedGoal: dangerPact?.title ?? "your goal",
      amount: `€${dangerPact?.stakeEuro ?? 30}`,
      antiCharity: dangerPact?.nemesis ?? "your nemesis",
    };
  }, [pacts, userName]);

  // ── Transaction sync ─────────────────────────────────────────────────────

  async function fetchTransactions(isPlaidConnected = plaidConnected) {
    try {
      let txns: Transaction[];

      if (isPlaidConnected) {
        // Real Plaid transactions (+ mocks merged server-side)
        const res = await fetch(
          `${API}/api/plaid/transactions?user_id=${PLAID_USER_ID}&days=30`
        );
        if (!res.ok) throw new Error("non-ok");
        const data = await res.json();
        txns = (data.transactions ?? []).map(
          (t: {
            id: string;
            name: string;
            amount: number;
            date: string;
            primary_category: string;
            is_mock: boolean;
          }) => ({
            id: t.id,
            name: t.name,
            amount: t.amount,
            date: t.date,
            category: t.primary_category,
            isMock: t.is_mock,
          })
        );
      } else {
        // Mock-only fallback
        const res = await fetch(`${API}/api/mock-transactions`);
        if (!res.ok) throw new Error("non-ok");
        const data = await res.json();
        txns = (data.transactions ?? []).map(
          (t: { id: number; name: string; amount: number; date: string; category: string }) => ({
            id: `mock_${t.id}`,
            name: t.name,
            amount: t.amount,
            date: t.date,
            category: t.category,
            isMock: true,
          })
        );
      }

      setTransactions(txns);
      setApiReachable(true);
      setPacts((current) => computePactProgress(current, txns));
      setLastSynced(new Date());
    } catch {
      setApiReachable(false);
    }
  }

  async function checkPlaidStatus() {
    try {
      const res = await fetch(`${API}/api/plaid/status?user_id=${PLAID_USER_ID}`);
      if (!res.ok) return false;
      const data = await res.json();
      return Boolean(data.has_access_token);
    } catch {
      return false;
    }
  }

  async function handlePlaidConnected() {
    setPlaidConnected(true);
    await fetchTransactions(true);
  }

  async function addMockTransaction(input: {
    name: string;
    amount: number;
    category: string;
    date: string;
  }) {
    try {
      await fetch(`${API}/api/mock-transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      await fetchTransactions();
    } catch {
      setApiReachable(false);
    }
  }

  async function deleteMockTransaction(id: string) {
    const numId = id.replace("mock_", "");
    try {
      await fetch(`${API}/api/mock-transactions/${numId}`, { method: "DELETE" });
      await fetchTransactions();
    } catch {
      setApiReachable(false);
    }
  }

  // On mount: check Plaid status, then fetch with the correct source
  useEffect(() => {
    checkPlaidStatus().then((connected) => {
      setPlaidConnected(connected);
      fetchTransactions(connected);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Org handlers ──────────────────────────────────────────────────────────

  function addOrg(org: Organization) {
    setOrganizations((current) => [...current, org]);
  }

  function removeOrg(id: string) {
    setOrganizations((current) => current.filter((o) => o.id !== id));
  }

  // ── Pact creation ─────────────────────────────────────────────────────────

  function createPact(input: { title: string; stakeEuro: number; category: string; nemesis: string }) {
    const nextPact: Pact = {
      id: crypto.randomUUID(),
      title: input.title.trim(),
      stakeEuro: input.stakeEuro,
      daysRemaining: 7,
      status: "on_track",
      progressPercent: 0,
      category: input.category,
      spendingLimit: input.stakeEuro,
      spentEuro: 0,
      nemesis: input.nemesis,
    };
    // Re-evaluate immediately against existing transactions
    setPacts((current) => computePactProgress([nextPact, ...current], transactions));
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
        {screen === "home" && (
          <HomeScreen
            pacts={pacts}
            userName={userName}
            onChangeUserName={setUserName}
            onOpenContract={() => setScreen("contract")}
            onOpenAddOrg={() => setScreen("orgs")}
            onTriggerFailure={() => setScreen("bite")}
            onDeletePact={(id) => setPacts((current) => current.filter((p) => p.id !== id))}
          />
        )}
        {screen === "contract" && <ContractScreen organizations={organizations} onCreate={createPact} />}
        {screen === "orgs" && <OrgScreen organizations={organizations} onAdd={addOrg} onRemove={removeOrg} />}
        {screen === "shop" && <ShopScreen />}
        {screen === "sync" && (
          <SyncScreen
            pacts={pacts}
            transactions={transactions}
            lastSynced={lastSynced}
            apiReachable={apiReachable}
            plaidConnected={plaidConnected}
            onSync={() => fetchTransactions()}
            onPlaidConnected={handlePlaidConnected}
            onAddTransaction={addMockTransaction}
            onDeleteTransaction={deleteMockTransaction}
          />
        )}
        {screen === "bite" && (
          <FailureScreen payload={failurePayload} onAcknowledge={() => setScreen("home")} />
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-white md:hidden">
        <div className="grid grid-cols-5">
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
