import Link from "next/link";

const MONSTER_IMAGE =
  "https://res.cloudinary.com/yevhenii-kalashnyk/image/upload/e_background_removal/c_fill,ar_3:4,g_auto,f_png/v1771693879/Gemini_Generated_Image_3goprg3goprg3gop_l9flik.png";

export function LandingHero() {
  return (
    <section className="border-b border-border/80 bg-cream/40">
      <div className="mx-auto grid min-h-[70vh] max-w-6xl items-center gap-10 px-6 py-16 md:grid-cols-2">
        <div>
          <p className="font-[var(--font-mono)] text-xs uppercase tracking-[0.2em] text-coral">
            Morkis
          </p>
          <h1 className="mt-4 font-[var(--font-display)] text-5xl font-extrabold leading-tight text-ink">
            Prove you mean it.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-ink/70">
            Build goals with real stakes. If you fail, your money goes where it hurts and Morkis
            roasts you with ElevenLabs.
          </p>
          <div className="mt-8 flex gap-3">
            <Link
              href="/app"
              className="morkis-button bg-moss px-7 py-3 text-sm uppercase tracking-widest text-white"
            >
              Make A Pact
            </Link>
          </div>
        </div>
        <div className="flex justify-center">
          <img src={MONSTER_IMAGE} alt="Morkis mascot" className="w-[300px] max-w-full" />
        </div>
      </div>
    </section>
  );
}
