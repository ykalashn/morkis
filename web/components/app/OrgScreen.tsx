"use client";

import { useState } from "react";
import { Building2, Plus, Trash2 } from "lucide-react";
import type { Organization } from "@/types/domain";

interface OrgScreenProps {
  organizations: Organization[];
  onAdd: (org: Organization) => void;
  onRemove: (id: string) => void;
}

export function OrgScreen({ organizations, onAdd, onRemove }: OrgScreenProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [iban, setIban] = useState("");
  const [notes, setNotes] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd({
      id: crypto.randomUUID(),
      name: name.trim(),
      type: type.trim() || "Charity",
      iban: iban.trim(),
      notes: notes.trim(),
    });
    setName("");
    setType("");
    setIban("");
    setNotes("");
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-[var(--font-display)] text-2xl font-extrabold text-ink">Nemesis Organizations</h2>
        <p className="mt-1 text-sm text-ink/50">Add organizations that your failed stakes will be donated to.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border-2 border-ink/10 bg-white p-6">
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-ink/40">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. The Rival's Campaign"
            className="w-full rounded-xl border-2 border-ink/10 bg-cream px-4 py-3 text-sm text-ink placeholder:text-ink/30 focus:border-moss focus:outline-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-ink/40">Type</label>
            <input
              value={type}
              onChange={(e) => setType(e.target.value)}
              placeholder="Charity / Political / Other"
              className="w-full rounded-xl border-2 border-ink/10 bg-cream px-4 py-3 text-sm text-ink placeholder:text-ink/30 focus:border-moss focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-ink/40">IBAN</label>
            <input
              value={iban}
              onChange={(e) => setIban(e.target.value)}
              placeholder="SE00 0000 0000 0000"
              className="w-full rounded-xl border-2 border-ink/10 bg-cream px-4 py-3 text-sm text-ink placeholder:text-ink/30 focus:border-moss focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-ink/40">Notes</label>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Why this nemesis?"
            className="w-full rounded-xl border-2 border-ink/10 bg-cream px-4 py-3 text-sm text-ink placeholder:text-ink/30 focus:border-moss focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-full bg-moss px-6 py-3 text-sm font-bold text-white shadow-[0_4px_0_rgba(0,0,0,0.15)] transition hover:shadow-[0_2px_0_rgba(0,0,0,0.15)] hover:translate-y-0.5"
        >
          <Plus className="h-4 w-4" /> Add Organization
        </button>
      </form>

      {organizations.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-ink/10 py-12 text-center">
          <Building2 className="mx-auto mb-3 h-8 w-8 text-ink/20" />
          <p className="text-sm text-ink/40">No nemesis organizations yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {organizations.map((org) => (
            <div key={org.id} className="flex items-center justify-between rounded-xl border-2 border-ink/10 bg-white px-5 py-4">
              <div>
                <div className="font-[var(--font-display)] text-sm font-bold text-ink">{org.name}</div>
                <div className="text-xs text-ink/40">{org.type}{org.iban ? ` · ${org.iban}` : ""}</div>
              </div>
              <button type="button" onClick={() => onRemove(org.id)} className="text-coral hover:text-coral/70">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
