import { redirect } from "next/navigation";
import { getProfile } from "@/app/2026/_actions/profile";
import { getMyTeam } from "@/app/2026/_actions/team";
import { getPaymentQuote } from "@/app/2026/_actions/payment";
import { MEMBER_LIMITS } from "@/app/2026/_data/teamConfig";
import Path from "@/app/path";
import PaymentForm from "./_components/PaymentForm";

export const metadata = { title: "Pay entry fee" };

export default async function PaymentPage() {
  const profile = await getProfile();
  if (!profile) redirect(Path[2026].Onboarding);

  const team = await getMyTeam();
  if (!team) redirect(Path[2026].Dashboard);
  if (team.paid) redirect(Path[2026].Dashboard);

  const isCaptain = team.members.some(
    (m) => m.profile_id === profile.id && m.role === "captain",
  );
  if (!isCaptain) redirect(Path[2026].Dashboard);

  if (team.members.length < MEMBER_LIMITS.min) redirect(Path[2026].Dashboard);

  // Single source of truth for the amount. processPayment() derives the charge
  // from the same helper, so what is shown here is exactly what is charged.
  const quote = await getPaymentQuote();

  return (
    <main className="mx-auto w-full max-w-xl px-4 pt-8 pb-16 sm:px-6 sm:pt-12">
      <PaymentForm
        teamName={team.name}
        memberCount={team.members.length}
        quote={quote}
      />
    </main>
  );
}
