import Hero from "@/app/2026/_components/Hero";
import About from "@/app/2026/_components/About";
import Timeline from "@/app/2026/_components/Timeline";
import Resources from "@/app/2026/_components/Resources";
import Faq from "@/app/2026/_components/Faq";
import Sponsors from "@/app/2026/_components/Sponsors";
import Support from "@/app/2026/_components/Support";
import RegisterCta from "@/app/2026/_components/RegisterCta";
import FindTeamCallout from "@/app/2026/_components/FindTeamCallout";

/**
 * The hero reads live key dates and the remaining team slots, both of which
 * would otherwise be baked in at build time and never move again. Sixty
 * seconds is short enough that a slot count stays honest on a busy night and
 * long enough that the page is still served from cache under load.
 */
export const revalidate = 60;

export default function Home() {
  return (
    <>
      <Hero />
      <About />

      <section className="pb-4 md:pb-8">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <FindTeamCallout />
        </div>
      </section>

      <Timeline />
      <RegisterCta />
      <Resources />
      <Faq />
      <Sponsors />
      <Support />
    </>
  );
}
