"use client";

import { Crown, Flame, Gem, GraduationCap, Sparkles, Wind } from "lucide-react";
import type { ComponentType } from "react";

const MONSTER_IMAGE =
  "https://res.cloudinary.com/yevhenii-kalashnyk/image/upload/e_background_removal/c_fill,ar_3:4,g_auto,f_png/v1771693879/Gemini_Generated_Image_3goprg3goprg3gop_l9flik.png";

type ShopItem = {
  name: string;
  cost: number;
  Icon: ComponentType<{ className?: string }>;
  // Where the icon sits on the monster preview
  overlayClass: string;
  iconClass: string;
};

const SHOP_ITEMS: ShopItem[] = [
  {
    name: "Tiny Crown",
    cost: 0,
    Icon: Crown,
    overlayClass: "absolute -top-5 left-1/2 -translate-x-1/2",
    iconClass: "h-7 w-7 text-yellow-400 drop-shadow",
  },
  {
    name: "Top Hat",
    cost: 5000,
    Icon: GraduationCap,
    overlayClass: "absolute -top-9 left-1/2 -translate-x-1/2",
    iconClass: "h-10 w-10 text-ink drop-shadow",
  },
  {
    name: "Golden Tooth",
    cost: 800,
    Icon: Sparkles,
    overlayClass: "absolute top-[52%] left-[58%]",
    iconClass: "h-5 w-5 text-yellow-400 drop-shadow",
  },
  {
    name: "Nordic Scarf",
    cost: 500,
    Icon: Wind,
    overlayClass: "absolute top-[62%] left-1/2 -translate-x-1/2",
    iconClass: "h-6 w-6 text-blue-400 drop-shadow",
  },
  {
    name: "Flame Aura",
    cost: 3000,
    Icon: Flame,
    overlayClass: "absolute -bottom-3 left-1/2 -translate-x-1/2",
    iconClass: "h-10 w-10 text-orange-500 animate-pulse drop-shadow",
  },
  {
    name: "Diamond Eyes",
    cost: 10000,
    Icon: Gem,
    overlayClass: "absolute top-[30%] left-1/2 -translate-x-1/2",
    iconClass: "h-5 w-5 text-cyan-400 drop-shadow",
  },
];

type ShopScreenProps = {
  ip: number;
  ownedItems: string[];
  equippedItem: string | null;
  onBuy: (name: string, cost: number) => void;
  onEquip: (name: string) => void;
};

export function ShopScreen({ ip, ownedItems, equippedItem, onBuy, onEquip }: ShopScreenProps) {
  const equipped = SHOP_ITEMS.find((i) => i.name === equippedItem);

  return (
    <section className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-[var(--font-display)] text-3xl font-extrabold text-ink">Monster Shop</h2>
        <div className="morkis-card px-3 py-1 text-sm font-extrabold text-moss">
          {ip.toLocaleString()} IP
        </div>
      </div>

      <p className="text-base text-muted">Prove you are disciplined enough to dress your monster.</p>

      {/* Monster preview */}
      <div className="morkis-card bg-gradient-to-b from-[#D0ECE6] to-[#E0F5F0] p-6 text-center">
        <div className="relative inline-block">
          <img src={MONSTER_IMAGE} alt="Morkis" className="mx-auto w-24 object-contain" />
          {equipped && (
            <span className={equipped.overlayClass}>
              <equipped.Icon className={equipped.iconClass} />
            </span>
          )}
        </div>
        <p className="mt-3 font-[var(--font-display)] text-sm font-bold text-moss">
          {equippedItem ? `WEARING: ${equippedItem.toUpperCase()}` : "NO ITEM EQUIPPED"}
        </p>
        {equippedItem && (
          <button
            type="button"
            onClick={() => onEquip(equippedItem)}
            className="mt-1 font-[var(--font-mono)] text-[10px] uppercase tracking-widest text-muted underline underline-offset-2"
          >
            Remove
          </button>
        )}
      </div>

      <p className="font-[var(--font-display)] text-sm font-bold uppercase tracking-widest">Cosmetics</p>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {SHOP_ITEMS.map(({ name, cost, Icon }) => {
          const owned = ownedItems.includes(name);
          const isEquipped = equippedItem === name;
          const canAfford = ip >= cost;

          return (
            <article
              key={name}
              className={`morkis-card p-4 text-center transition ${
                isEquipped ? "border-moss bg-moss/5" : owned ? "border-moss/40" : ""
              }`}
            >
              <Icon className={`mx-auto h-6 w-6 ${isEquipped ? "text-moss" : owned ? "text-moss/70" : canAfford ? "text-ink/60" : "text-ink/25"}`} />
              <p className="mt-2 font-[var(--font-display)] text-sm font-bold">{name}</p>

              {owned ? (
                <button
                  type="button"
                  onClick={() => onEquip(name)}
                  className={`mt-2 w-full rounded-full py-1.5 font-[var(--font-mono)] text-xs font-bold transition ${
                    isEquipped
                      ? "bg-moss text-white"
                      : "border-2 border-moss/40 bg-transparent text-moss hover:bg-moss/10"
                  }`}
                >
                  {isEquipped ? "Equipped ✓" : "Equip"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onBuy(name, cost)}
                  disabled={!canAfford}
                  className={`mt-2 w-full rounded-full py-1.5 font-[var(--font-mono)] text-xs font-bold transition ${
                    canAfford
                      ? "bg-moss text-white hover:bg-moss/80"
                      : "cursor-not-allowed bg-ink/5 text-ink/25"
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
