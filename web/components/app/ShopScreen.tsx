import { Crown, Flame, Gem, GraduationCap, Sparkles, Wind } from "lucide-react";

const MONSTER_IMAGE =
  "https://res.cloudinary.com/yevhenii-kalashnyk/image/upload/e_background_removal/c_fill,ar_3:4,g_auto,f_png/v1771693879/Gemini_Generated_Image_3goprg3goprg3gop_l9flik.png";

export function ShopScreen() {
  return (
    <section className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-[var(--font-display)] text-3xl font-extrabold text-ink">Monster Shop</h2>
        <div className="morkis-card px-3 py-1 text-sm font-extrabold text-moss">2,340 IP</div>
      </div>

      <p className="text-base text-muted">Prove you are disciplined enough to dress your monster.</p>

      <div className="morkis-card bg-gradient-to-b from-[#D0ECE6] to-[#E0F5F0] p-6 text-center">
        <div className="relative inline-block">
          <img src={MONSTER_IMAGE} alt="Morkis" className="mx-auto w-24 object-contain" />
          <Crown className="absolute -top-4 left-1/2 h-6 w-6 -translate-x-1/2 text-yellow-400" />
        </div>
        <p className="mt-2 font-[var(--font-display)] text-sm font-bold text-moss">YOUR MORKIS — LVL 12</p>
      </div>

      <p className="font-[var(--font-display)] text-sm font-bold uppercase tracking-widest">Cosmetics</p>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <article className="morkis-card border-moss p-4 text-center">
          <Crown className="mx-auto h-6 w-6 text-yellow-500" />
          <p className="mt-2 font-[var(--font-display)] text-sm font-bold">Tiny Crown</p>
          <p className="mt-1 inline-block rounded-full bg-moss/10 px-2 py-0.5 font-[var(--font-mono)] text-xs font-bold text-moss">OWNED ✓</p>
        </article>

        {[
          ["Golden Tooth", "800 IP", Sparkles],
          ["Nordic Scarf", "500 IP", Wind],
          ["Flame Aura", "3,000 IP", Flame],
          ["Top Hat", "5,000 IP", GraduationCap],
          ["Diamond Eyes", "10,000 IP", Gem]
        ].map(([name, cost, Icon]) => (
          <article key={String(name)} className="morkis-card p-4 text-center">
            <Icon className="mx-auto h-6 w-6 text-ink/60" />
            <p className="mt-2 font-[var(--font-display)] text-sm font-bold">{String(name)}</p>
            <p className="mt-1 inline-block rounded-full bg-yellow-100 px-2 py-0.5 font-[var(--font-mono)] text-xs font-bold text-ink/60">
              {String(cost)}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
