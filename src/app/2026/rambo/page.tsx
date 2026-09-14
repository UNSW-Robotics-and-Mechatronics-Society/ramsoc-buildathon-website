import type { Metadata } from "next";
import RamboStage from "./_components/RamboStage";

export const metadata: Metadata = {
  title: "Rambo",
  robots: { index: false, follow: false },
};

export default function RamboPage() {
  return <RamboStage />;
}
