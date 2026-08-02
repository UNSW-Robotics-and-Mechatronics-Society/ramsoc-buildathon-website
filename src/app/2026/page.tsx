import Hero from "@/app/2026/_components/Hero";
import About from "@/app/2026/_components/About";
import Timeline from "@/app/2026/_components/Timeline";
import Resources from "@/app/2026/_components/Resources";
import Faq from "@/app/2026/_components/Faq";
import Sponsors from "@/app/2026/_components/Sponsors";
import Support from "@/app/2026/_components/Support";
import RegisterCta from "@/app/2026/_components/RegisterCta";

export default function Home() {
  return (
    <>
      <Hero />
      <About />
      <Timeline />
      <RegisterCta />
      <Resources />
      <Faq />
      <Sponsors />
      <Support />
    </>
  );
}
