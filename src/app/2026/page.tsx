import Hero from "@/app/2026/_components/Hero";
import About from "@/app/2026/_components/About";
import Timeline from "@/app/2026/_components/Timeline";
import Resources from "@/app/2026/_components/Resources";
import Faq from "@/app/2026/_components/Faq";
import Sponsors from "@/app/2026/_components/Sponsors";
import Support from "@/app/2026/_components/Support";
import FindTeamCallout from "@/app/2026/_components/FindTeamCallout";
import CornerRambo from "@/app/2026/_components/eggs/CornerRambo";

/**
 * Served from the cache and regenerated at most every five minutes. The
 * homepage reads the live key dates and timeline, but neither changes often,
 * and under a crowd this is the difference between one database read every
 * five minutes and one per visitor. Admin edits call revalidatePath() to skip
 * the wait.
 */
export const revalidate = 300;

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
      <Resources />
      <Faq />
      <Sponsors />
      <Support />

      {/* Easter egg. Renders nothing until he turns up. */}
      <CornerRambo />
    </>
  );
}
