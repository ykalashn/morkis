import { AlertTriangle, Skull, User } from "lucide-react";

const MONSTER_IMAGE =
  "https://res.cloudinary.com/yevhenii-kalashnyk/image/upload/e_background_removal/c_fill,ar_3:4,g_auto,f_png/v1771693879/Gemini_Generated_Image_3goprg3goprg3gop_l9flik.png";

type GroupScreenProps = {
  onSeal: () => void;
};

export function GroupScreen({ onSeal }: GroupScreenProps) {
  const participants = [
    { name: "You", score: "88%", risk: false, image: true },
    { name: "Sara", score: "60%", risk: true },
    { name: "Erik", score: "72%", risk: false },
    { name: "Dave", score: "92%", risk: false }
  ];

  return (
    <section className="mx-auto max-w-lg space-y-4">
      <div>
        <h2 className="font-[var(--font-display)] text-3xl font-extrabold text-ink">Group Pact</h2>
        <p className="text-base text-muted">Mutual Assured Destruction</p>
      </div>

      <p className="text-base text-ink/50">One person fails, <span className="font-semibold text-ink">everyone loses.</span></p>

      <div className="morkis-card border-moss p-4">
        <p className="font-[var(--font-mono)] text-xs uppercase tracking-[0.2em] text-muted">Group Contract</p>
        <p className="mt-2 font-[var(--font-display)] text-lg font-bold">No fast fashion this month</p>
        <p className="text-sm text-muted">30 days · Ends Feb 28</p>
      </div>

      <div className="morkis-card border-moss p-4 text-center">
        <p className="font-[var(--font-mono)] text-xs uppercase tracking-[0.2em] text-muted">Total Stake Pool</p>
        <p className="font-[var(--font-display)] text-4xl font-extrabold text-moss">€200</p>
        <p className="text-sm text-muted">4 people × €50</p>
      </div>

      <div>
        <p className="mb-3 font-[var(--font-display)] text-sm font-bold uppercase tracking-widest">Participants</p>
        <div className="grid grid-cols-2 gap-2">
          {participants.map((person) => (
            <div key={person.name} className="rounded-xl border-2 border-ink/10 bg-cream p-3 text-center">
              <div className="mx-auto mb-1 inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-ink/20 bg-ink/5">
                {person.image ? (
                  <img src={MONSTER_IMAGE} alt="avatar" className="h-8 w-6 object-contain" />
                ) : (
                  <User className="h-5 w-5 text-ink/40" />
                )}
              </div>
              <p className="font-[var(--font-display)] text-sm font-bold">{person.name}</p>
              <p className={`font-[var(--font-mono)] text-xs font-bold ${person.risk ? "text-coral" : "text-moss"}`}>
                {person.score} {person.risk ? <AlertTriangle className="inline h-3 w-3" /> : null}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-xl bg-coral/10 p-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-coral" />
        <div>
          <p className="font-[var(--font-display)] text-sm font-bold text-coral">Sara’s integrity score is only 60%.</p>
          <p className="text-sm text-ink/50">If she fails, you all lose €50. Trust her?</p>
        </div>
      </div>

      <button type="button" onClick={onSeal} className="morkis-button w-full bg-coral px-6 py-4 text-base uppercase tracking-widest text-white">
        <Skull className="mr-1 inline h-4 w-4" /> Seal the Blood Pact
      </button>
      <p className="text-center font-[var(--font-mono)] text-xs text-muted">No backing out. Friendships may be casualties.</p>
    </section>
  );
}
