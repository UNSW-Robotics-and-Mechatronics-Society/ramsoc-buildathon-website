import type { Metadata } from "next";
import Prelab from "./_components/walnut";

export const metadata: Metadata = {
  title: "walnut",
  robots: { index: false, follow: false },
};

export default function prelabPage() {
  return <Prelab />;
}
