import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin · Buildathon 2026",
  robots: { index: false, follow: false },
};

/**
 * The admin area always reads live data, organisers are moving people between
 * teams and marking payments, and a cached roster would be actively wrong.
 */
export const dynamic = "force-dynamic";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
