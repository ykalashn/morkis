"use client";

import { Crown, Flame, Gem, GraduationCap, Sparkles, Wind } from "lucide-react";
import type { ComponentType } from "react";

const MONSTER_IMAGE =
  "https://res.cloudinary.com/yevhenii-kalashnyk/image/upload/e_background_removal/c_fill,ar_3:4,g_auto,f_png/v1771693879/Gemini_Generated_Image_3goprg3goprg3gop_l9flik.png";

const SHOP_ITEMS: Array<{ name: string; cost: number; Icon: ComponentType<{ className?: string }> }> = [
  { name: "Tiny Crown",    cost: 0,      Icon: Crown },
  { name: "Golden Tooth",  cost: 800,    Icon: Sparkles },
  { name: "Nordic Scarf",  cost: 500,    Icon: Wind },
  { name: "Flame Aura",    cost: 3000,   Icon: Flame },
  { name: "Top Hat",       cost: 5000,   Icon: GraduationCap },
  { name: "Diamond Eyes",  cost: 10000,  Icon: Gem },
];

type ShopScreenProps = {
  ip: number;
  ownedItems: string[];
  onBuy: (name: string, cost: number) => void;
};

export function ShopScreen({ ip, ownedItems, onBuy }: ShopScreenProps) {
  return (
    <section className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-[var(--font-display)] text-3xl font-extrabold text-ink">Monster Shop</h2>
        <div className="morkis-card px-3 py-1 text-sm font-extrabold text-moss">
          {ip.toLocaleString()} IP
        </div>
      </div>

      <p className="text-base text-muted">Prove you are disciplined enough to dress your monster.</p>

      <div className="morkis-card bg-gradient-to-b from-[#D0ECE6] to-[#E0F5F0] p-6 text-center">
        <div className="relative inline-block">
          <img src={MONSTER_IMAGE} alt="Morkis" className="mx-auto w-24 object-contain" />
          {ownedItems.includes("Tiny Crown") && (
            <Crown className="absolute -top-4 left-1/2 h-6 w-6 -translate-x-1/2 text-yellow-400" />
          )}
        </div>
        <p className="mt-2 font-[var(--font-display)] text-sm font-bold text-moss">
          YOUR MORKIS — {ownedItems.length} ITEMS
        </p>
      </div>

      <p className="font-[var(--font-display)] text-sm font-bold uppercase tracking-widest">Cosmetics</p>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {SHOP_ITEMS.map(({ name, cost, Icon }) => {
          const owned = ownedItems.includes(name);
          const canAfford = ip >= cost;

          return (
            <article
              key={name}
              className={`morkis-card p-4 text-center ${owned ? "border-moss/60" : ""}`}
            >
              <Icon className={`mx-auto h-6 w-6 ${owned ? "text-moss" : canAfford ? "text-ink/60" : "text-ink/25"}`} />
              <p className="mt-2 font-[var(--font-display)] text-sm font-bold">{name}</p>

              {owned ? (
                <p className="mt-1 inline-block rounded-full bg-moss/10 px-2 py-0.5 font-[var(--font-mono)] text-xs font-bold text-moss">
                  OWNED ✓
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => onBuy(name, cost)}
                  disabled={!canAfford}
                  className={`mt-2 w-full rounded-full py-1.5 font-[var(--font-mono)] text-xs font-bold transition ${
                    canAfford
                      ? "bg-moss text-white hover:bg-moss/80"
                      : "bg-ink/5 text-ink/25 cursor-not-allowed"
                  }`}
                >
                  {cost === 0 ? "Free" : `${cost.toLocaleString()} IP`}
                </button>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
