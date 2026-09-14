import Link from "next/link";
import type { MarketAccess } from "@/app/2026/_actions/market";
import Path from "@/app/path";

/**
 * The back door, shut. Everyone can see it; the copy on the sign depends on
 * why the doorman will not let this particular person in.
 */

type Shut = Exclude<MarketAccess, { state: "ok" }>;

function signFor(access: Shut): {
  title: string;
  body: string;
  cta?: { label: string; href: string };
  secondary?: { label: string; href: string };
} {
  const backHere = `${Path[2026].SignIn}?redirect_url=${encodeURIComponent(Path[2026].Market)}`;
  switch (access.state) {
    case "signed-out":
      return {
        title: "No name, no entry.",
        body: "The doorman needs to know who you are. Paid teams only past this point.",
        cta: { label: "Sign in", href: backHere },
        secondary: { label: "Register", href: Path[2026].SignUp },
      };
    case "no-profile":
      return {
        title: "You're not on the list.",
        body: "Finish registering first. Then come back and knock.",
        cta: { label: "Finish registering", href: Path[2026].Onboarding },
      };
    case "no-team":
      return {
        title: "Lone operators not admitted.",
        body: "You need a team, and that team needs to have paid. Create one or join one from your dashboard.",
        cta: { label: "Go to my dashboard", href: Path[2026].Dashboard },
      };
    case "unpaid":
      return {
        title: "Your team hasn't paid.",
        body: access.isCaptain
          ? "The doorman checks. Pay the entry fee and the door opens for your whole team."
          : "The doorman checks. Ask your captain to pay the entry fee and the door opens for your whole team.",
        cta: access.isCaptain
          ? { label: "Pay the entry fee", href: Path[2026].Payment }
          : { label: "Go to my dashboard", href: Path[2026].Dashboard },
      };
    case "closed":
      return {
        title: "Shutters down.",
        body: "Management closed the market. Try again later.",
        cta: { label: "Back to Buildathon", href: Path[2026].Root },
      };
    case "muted":
      return {
        title: "You've been asked to leave.",
        body: "Talk to a RAMSoc organiser if you think that's a mistake.",
        cta: { label: "Back to Buildathon", href: Path[2026].Root },
      };
  }
}

export default function LockedDoor({ access }: { access: Shut }) {
  const sign = signFor(access);

  return (
    <section className="market-wall relative flex min-h-[calc(100vh-8rem)] items-center justify-center overflow-hidden px-4 py-16">
      <div className="flex w-full max-w-md flex-col items-center text-center">
        <p className="font-blueprint text-[#d9a441] mb-6 text-xs uppercase">
          Back of the makerspace · Knock twice
        </p>

        {/* The door: a tall studded slab with a peephole slid open. */}
        <div className="lego-studs relative w-56 rounded-t-[2rem] bg-[#2a1a12] px-5 pt-8 pb-6 shadow-[0_0.5rem_0_rgba(0,0,0,0.5)] [--stud-color:#2a1a12]">
          <div className="mx-auto h-8 w-32 rounded-sm border border-black/40 bg-[#120a06]">
            <div className="flex h-full items-center justify-center gap-5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ffcf00] shadow-[0_0_8px_2px_rgba(255,207,0,0.6)]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#ffcf00] shadow-[0_0_8px_2px_rgba(255,207,0,0.6)]" />
            </div>
          </div>
          <div className="mt-10 ml-auto h-3 w-3 rounded-full bg-[#c9a227]" />
          <div className="mt-8 grid grid-cols-2 gap-2 opacity-40">
            {Array.from({ length: 6 }, (_, i) => (
              <span key={i} className="h-6 rounded-sm bg-black/40" />
            ))}
          </div>
        </div>

        <h1 className="font-stud text-ink mt-8 lowercase">
          black <span className="text-[#d9a441]">market</span>
        </h1>
        <h2 className="text-ink mt-4 text-xl">{sign.title}</h2>
        <p className="text-ink-dim mt-2 text-base">{sign.body}</p>

        <div className="mt-6 flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
          {sign.cta && (
            <Link href={sign.cta.href} className="button text-base">
              {sign.cta.label}
            </Link>
          )}
          {sign.secondary && (
            <Link href={sign.secondary.href} className="button-outline text-base">
              {sign.secondary.label}
            </Link>
          )}
        </div>

        <p className="font-blueprint text-ink-dim/70 mt-10 max-w-xs text-[0.65rem] uppercase">
          An anonymous room for members of paid teams to trade bonus
          component-shop tickets. Organisers can see everything.
        </p>
      </div>
    </section>
  );
}
