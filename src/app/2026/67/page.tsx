import type { Metadata } from "next";
import SixSeven from "./_components/SixSeven";

export const metadata: Metadata = {
  title: "6 7",
  robots: { index: false, follow: false },
};

export default function SixSevenPage() {
  return <SixSeven />;
}
