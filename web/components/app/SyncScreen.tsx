"use client";

import { useState } from "react";
import { RefreshCw, Wifi, WifiOff, Plus, Trash2, CreditCard } from "lucide-react";
import type { Pact, Transaction } from "@/types/domain";
import { PlaidConnectButton } from "@/components/app/PlaidConnectButton";

interface SyncScreenProps {
  pacts: Pact[];
  transactions: Transaction[];
  lastSynced: Date | null;
  apiReachable: boolean;
  plaidConnected: boolean;
  onSync: () => void;
  onPlaidConnected: () => void;
  onPlaidDisconnect: () => void;
  onAddTransaction: (t: { name: string; amount: number; category: string; date: string }) => Promise<void>;
  onDeleteTransaction: (id: string) => Promise<void>;
}

export function SyncScreen({
  transactions,
  lastSynced,
  apiReachable,
  plaidConnected,
  onSync,
  onPlaidConnected,
  onPlaidDisconnect,
  onAddTransaction,
  onDeleteTransaction,
}: SyncScreenProps) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("FOOD_AND_DRINK");

  async function handleAddMock(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !amount) return;
    await onAddTransaction({
      name: name.trim(),
      amount: parseFloat(amount),
      category,
      date: new Date().toISOString().slice(0, 10),
    });
    setName("");
    setAmount("");
  }

  const mockTxns = transactions.filter((t) => t.isMock);
  const realTxns = transactions.filter((t) => !t.isMock);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-[var(--font-display)] text-2xl font-extrabold text-ink">Sync & Transactions</h2>
        <p className="mt-1 text-sm text-ink/50">Connect your bank or add test transactions manually.</p>
      </div>

      {/* Status */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border-2 border-ink/10 bg-white p-4">
          <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-ink/40">API</div>
          <div className="flex items-center gap-2">
            {apiReachable ? <Wifi className="h-4 w-4 text-moss" /> : <WifiOff className="h-4 w-4 text-coral" />}
            <span className="text-sm font-bold text-ink">{apiReachable ? "Connected" : "Offline"}</span>
          </div>
        </div>
        <div className="rounded-xl border-2 border-ink/10 bg-white p-4">
          <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-ink/40">Plaid</div>
          <div className="flex items-center gap-2">
            <CreditCard className={`h-4 w-4 ${plaidConnected ? "text-moss" : "text-ink/30"}`} />
            <span className="text-sm font-bold text-ink">{plaidConnected ? "Linked" : "Not linked"}</span>
          </div>
        </div>
        <div className="rounded-xl border-2 border-ink/10 bg-white p-4">
          <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-ink/40">Last Synced</div>
          <span className="text-sm font-bold text-ink">{lastSynced ? lastSynced.toLocaleTimeString() : "Never"}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onSync}
          className="inline-flex items-center gap-2 rounded-full bg-moss px-5 py-2.5 text-sm font-bold text-white shadow-[0_4px_0_rgba(0,0,0,0.15)] transition hover:shadow-[0_2px_0_rgba(0,0,0,0.15)] hover:translate-y-0.5"
        >
          <RefreshCw className="h-4 w-4" /> Sync Now
        </button>
        {plaidConnected ? (
          <button
            type="button"
            onClick={onPlaidDisconnect}
            className="inline-flex items-center gap-2 rounded-full border-2 border-ink/10 bg-cream px-5 py-2.5 text-sm font-bold text-ink transition hover:bg-ink/5"
          >
            Disconnect Bank
          </button>
        ) : (
          <PlaidConnectButton onSuccess={onPlaidConnected} />
        )}
      </div>

      {/* Add mock transaction */}
      <form onSubmit={handleAddMock} className="space-y-4 rounded-2xl border-2 border-ink/10 bg-white p-6">
        <h3 className="text-sm font-bold uppercase tracking-widest text-ink/40">Add Test Transaction</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Merchant name"
            className="rounded-xl border-2 border-ink/10 bg-cream px-4 py-3 text-sm text-ink placeholder:text-ink/30 focus:border-moss focus:outline-none"
          />
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            type="number"
            step="0.01"
            placeholder="Amount (€)"
            className="rounded-xl border-2 border-ink/10 bg-cream px-4 py-3 text-sm text-ink placeholder:text-ink/30 focus:border-moss focus:outline-none"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-xl border-2 border-ink/10 bg-cream px-4 py-3 text-sm text-ink focus:border-moss focus:outline-none"
          >
            <option value="FOOD_AND_DRINK">Food & Drink</option>
            <option value="COFFEE">Coffee</option>
            <option value="GENERAL_MERCHANDISE">Shopping</option>
            <option value="ENTERTAINMENT">Entertainment</option>
            <option value="TRANSPORTATION">Transport</option>
          </select>
        </div>
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-full border-2 border-ink/10 bg-cream px-5 py-2.5 text-sm font-bold text-ink transition hover:bg-ink/5"
        >
          <Plus className="h-4 w-4" /> Add Transaction
        </button>
      </form>

      {/* Transaction lists */}
      {mockTxns.length > 0 && (
        <div>
          <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-ink/40">Mock Transactions ({mockTxns.length})</h3>
          <div className="space-y-2">
            {mockTxns.map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-xl border-2 border-ink/10 bg-white px-4 py-3">
                <div>
                  <div className="text-sm font-bold text-ink">{t.name}</div>
                  <div className="text-[10px] text-ink/40">{t.date} · {t.category}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-coral">€{t.amount.toFixed(2)}</span>
                  <button type="button" onClick={() => onDeleteTransaction(t.id)} className="text-ink/30 hover:text-coral">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {realTxns.length > 0 && (
        <div>
          <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-ink/40">Bank Transactions ({realTxns.length})</h3>
          <div className="space-y-2">
            {realTxns.slice(0, 20).map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-xl border-2 border-ink/10 bg-white px-4 py-3">
                <div>
                  <div className="text-sm font-bold text-ink">{t.name}</div>
                  <div className="text-[10px] text-ink/40">{t.date} · {t.category}</div>
                </div>
                <span className="text-sm font-bold text-ink/60">€{t.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
