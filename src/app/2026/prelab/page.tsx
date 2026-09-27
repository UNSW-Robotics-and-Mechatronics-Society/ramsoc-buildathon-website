import type { Metadata } from "next";
import Prelab from "./_components/Prelab";

export const metadata: Metadata = {
  title: "prelab",
  robots: { index: false, follow: false },
};

export default function prelabPage() {
  return <Prelab />;
}
