"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ComponentType } from "react";
import { Building2, Flame, House, PlusCircle, RefreshCw, Store } from "lucide-react";
import { ContractScreen } from "@/components/app/ContractScreen";
import { OrgScreen } from "@/components/app/OrgScreen";
import { HomeScreen } from "@/components/app/HomeScreen";
import { ShopScreen } from "@/components/app/ShopScreen";
import { SyncScreen } from "@/components/app/SyncScreen";
import { FailureScreen } from "@/features/failures/components/FailureScreen";
import type { FailurePayload, MatchConfig, Organization, Pact, ScreenId, Transaction } from "@/types/domain";
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
  {
    id: "pact-3",
    title: "No Zalando last week",
    stakeEuro: 50,
    daysRemaining: 0,
    status: "completed",
    progressPercent: 42,
    category: "GENERAL_MERCHANDISE",
    spendingLimit: 50,
    spentEuro: 21,
    nemesis: "The Rival",
  },
];

const NAV_ITEMS: Array<{ id: Exclude<ScreenId, "bite">; label: string; icon: ComponentType<{ className?: string }> }> = [
  { id: "home", label: "Home", icon: House },
  { id: "contract", label: "Pact", icon: PlusCircle },
  { id: "orgs", label: "Orgs", icon: Building2 },
  { id: "shop", label: "Shop", icon: Store },
  { id: "sync", label: "Sync", icon: RefreshCw },
];

function txnMatchesPact(t: Transaction, pact: Pact): boolean {
  if (t.amount <= 0) return false;
  if (pact.matchConfig) {
    const { categories, merchantKeywords } = pact.matchConfig;
    const catMatch = categories.length === 0 || categories.includes(t.category);
    if (!catMatch) return false;
    if (merchantKeywords.length === 0) return true;
    const name = t.name.toLowerCase();
    return merchantKeywords.some((kw) => name.includes(kw));
  }
  // Legacy fallback for pacts created before AI matching
  return pact.category ? t.category === pact.category : false;
}

/** Pure function — no React state dependency */
function computePactProgress(pacts: Pact[], transactions: Transaction[]): Pact[] {
  return pacts.map((pact) => {
    if (pact.status === "completed" || pact.status === "lost") return pact;
    if (!pact.matchConfig && !pact.category) return pact;
    if (pact.spendingLimit == null) return pact;

    const matching = transactions.filter((t) => txnMatchesPact(t, pact));
    const spentEuro = Math.round(matching.reduce((sum, t) => sum + t.amount, 0) * 100) / 100;
    const progressPercent = Math.min(100, Math.round((spentEuro / pact.spendingLimit) * 100));
    const status: Pact["status"] =
      progressPercent >= 100 ? "lost" : progressPercent >= 75 ? "danger" : "on_track";

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
  const [ip, setIp] = useState<number>(() => loadFromStorage("morkis_ip", 2340));
  const [ownedItems, setOwnedItems] = useState<string[]>(() => loadFromStorage("morkis_owned_items", ["Tiny Crown"]));
  const [equippedItem, setEquippedItem] = useState<string | null>(() => loadFromStorage("morkis_equipped_item", "Tiny Crown"));
  const [pacts, setPacts] = useState<Pact[]>(() => loadFromStorage("morkis_pacts", INITIAL_PACTS));
  const [organizations, setOrganizations] = useState<Organization[]>(() =>
    loadFromStorage("morkis_orgs", [])
  );
  // Local mock transactions — stored in localStorage, no server needed
  const [localMocks, setLocalMocks] = useState<Transaction[]>(() => loadFromStorage("morkis_local_mocks", []));
  // Real transactions from Plaid (only populated when bank is connected)
  const [plaidTxns, setPlaidTxns] = useState<Transaction[]>([]);
  // Merged view used everywhere
  const transactions = useMemo(() => [...plaidTxns, ...localMocks], [plaidTxns, localMocks]);

  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [apiReachable, setApiReachable] = useState(false);
  const [plaidConnected, setPlaidConnected] = useState(false);
  const [activeLostPact, setActiveLostPact] = useState<Pact | null>(null);

  // Refs so async functions always see latest values without stale closure
  const pactsRef = useRef(pacts);
  useEffect(() => { pactsRef.current = pacts; }, [pacts]);
  const plaidTxnsRef = useRef(plaidTxns);
  useEffect(() => { plaidTxnsRef.current = plaidTxns; }, [plaidTxns]);
  const localMocksRef = useRef(localMocks);
  useEffect(() => { localMocksRef.current = localMocks; }, [localMocks]);

  // Persist to localStorage whenever state changes
  useEffect(() => { localStorage.setItem("morkis_user_name", JSON.stringify(userName)); }, [userName]);
  useEffect(() => { localStorage.setItem("morkis_ip", JSON.stringify(ip)); }, [ip]);
  useEffect(() => { localStorage.setItem("morkis_owned_items", JSON.stringify(ownedItems)); }, [ownedItems]);
  useEffect(() => { localStorage.setItem("morkis_equipped_item", JSON.stringify(equippedItem)); }, [equippedItem]);
  useEffect(() => { localStorage.setItem("morkis_pacts", JSON.stringify(pacts)); }, [pacts]);
  useEffect(() => { localStorage.setItem("morkis_orgs", JSON.stringify(organizations)); }, [organizations]);
  useEffect(() => { localStorage.setItem("morkis_local_mocks", JSON.stringify(localMocks)); }, [localMocks]);

  const failurePayload: FailurePayload = useMemo(() => {
    const sourcePact = activeLostPact ?? pacts.find((p) => p.status === "danger");
    const lastTxn = sourcePact?.category
      ? transactions
          .filter((t) => t.category === sourcePact.category && t.amount > 0)
          .sort((a, b) => b.date.localeCompare(a.date))[0]
      : undefined;
    return {
      userName,
      failedGoal: sourcePact?.title ?? "your goal",
      amount: `€${sourcePact?.stakeEuro ?? 30}`,
      antiCharity: sourcePact?.nemesis ?? "your nemesis",
      trigger: lastTxn ? `${lastTxn.name} — €${lastTxn.amount.toFixed(2)}` : undefined,
    };
  }, [activeLostPact, pacts, transactions, userName]);

  // ── Transaction sync ─────────────────────────────────────────────────────

  async function fetchTransactions(isPlaidConnected = plaidConnected) {
    let fetchedPlaid: Transaction[] = [];

    if (isPlaidConnected) {
      try {
        const res = await fetch(
          `${API}/api/plaid/transactions?user_id=${PLAID_USER_ID}&days=30`
        );
        if (!res.ok) throw new Error("non-ok");
        const data = await res.json();
        fetchedPlaid = (data.transactions ?? [])
          .filter((t: { is_mock: boolean }) => !t.is_mock)
          .map((t: {
            id: string; name: string; amount: number;
            date: string; primary_category: string;
          }) => ({
            id: t.id,
            name: t.name,
            amount: t.amount,
            date: t.date,
            category: t.primary_category,
            isMock: false,
          }));
        setApiReachable(true);
      } catch {
        setApiReachable(false);
      }
    }

    setPlaidTxns(fetchedPlaid);

    const merged = [...fetchedPlaid, ...localMocksRef.current];
    const prevPacts = pactsRef.current;
    const updatedPacts = computePactProgress(prevPacts, merged);

    const newlyLost = updatedPacts.find(
      (p) => p.status === "lost" && prevPacts.find((c) => c.id === p.id)?.status !== "lost"
    );

    setPacts(updatedPacts);
    setLastSynced(new Date());

    if (newlyLost) {
      setActiveLostPact(newlyLost);
      setScreen("bite");
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

  async function handlePlaidDisconnect() {
    try {
      await fetch(`${API}/api/plaid/disconnect?user_id=${PLAID_USER_ID}`, { method: "DELETE" });
    } catch { /* ignore — clear locally regardless */ }
    setPlaidConnected(false);
    setPlaidTxns([]);
    setPacts((current) => computePactProgress(current, localMocksRef.current));
  }

  function addMockTransaction(input: { name: string; amount: number; category: string; date: string }) {
    const newTxn: Transaction = {
      id: `mock_${crypto.randomUUID()}`,
      name: input.name,
      amount: input.amount,
      category: input.category,
      date: input.date,
      isMock: true,
    };
    const updatedMocks = [newTxn, ...localMocksRef.current];
    const merged = [...plaidTxnsRef.current, ...updatedMocks];
    const prevPacts = pactsRef.current;
    const updatedPacts = computePactProgress(prevPacts, merged);
    const newlyLost = updatedPacts.find(
      (p) => p.status === "lost" && prevPacts.find((c) => c.id === p.id)?.status !== "lost"
    );
    setLocalMocks(updatedMocks);
    setPacts(updatedPacts);
    if (newlyLost) { setActiveLostPact(newlyLost); setScreen("bite"); }
  }

  function deleteMockTransaction(id: string) {
    const updatedMocks = localMocksRef.current.filter((t) => t.id !== id);
    const merged = [...plaidTxnsRef.current, ...updatedMocks];
    setLocalMocks(updatedMocks);
    setPacts((current) => computePactProgress(current, merged));
  }

  // On mount: apply local mocks immediately, then check Plaid and fetch real data if connected
  useEffect(() => {
    const mocks = localMocksRef.current;
    setPacts((current) => computePactProgress(current, mocks));

    checkPlaidStatus().then((connected) => {
      setPlaidConnected(connected);
      if (connected) void fetchTransactions(true);
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

  function createPact(input: { title: string; stakeEuro: number; matchConfig: MatchConfig; nemesis: string }) {
    const nextPact: Pact = {
      id: crypto.randomUUID(),
      title: input.title.trim(),
      stakeEuro: input.stakeEuro,
      daysRemaining: 7,
      status: "on_track",
      progressPercent: 0,
      matchConfig: input.matchConfig,
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
              <span className="font-[var(--font-display)] text-sm font-extrabold">{ip.toLocaleString()} IP</span>
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
            onViewReceipt={(pact) => { setActiveLostPact(pact); setScreen("bite"); }}
          />
        )}
        {screen === "contract" && <ContractScreen organizations={organizations} onCreate={createPact} />}
        {screen === "orgs" && <OrgScreen organizations={organizations} onAdd={addOrg} onRemove={removeOrg} />}
        {screen === "shop" && (
          <ShopScreen
            ip={ip}
            ownedItems={ownedItems}
            equippedItem={equippedItem}
            onBuy={(name, cost) => {
              setIp((prev) => prev - cost);
              setOwnedItems((prev) => [...prev, name]);
            }}
            onEquip={(name) => setEquippedItem((prev) => (prev === name ? null : name))}
          />
        )}
        {screen === "sync" && (
          <SyncScreen
            pacts={pacts}
            transactions={transactions}
            lastSynced={lastSynced}
            apiReachable={apiReachable}
            plaidConnected={plaidConnected}
            onSync={() => fetchTransactions()}
            onPlaidConnected={handlePlaidConnected}
            onPlaidDisconnect={handlePlaidDisconnect}
            onAddTransaction={(t) => { addMockTransaction(t); return Promise.resolve(); }}
            onDeleteTransaction={(id) => { deleteMockTransaction(id); return Promise.resolve(); }}
          />
        )}
        {screen === "bite" && (
          <FailureScreen
            payload={failurePayload}
            onAcknowledge={() => { setActiveLostPact(null); setScreen("home"); }}
          />
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
