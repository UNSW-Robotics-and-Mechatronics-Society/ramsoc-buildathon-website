"use server";

import { auth } from "@clerk/nextjs/server";
import { getSupabaseSecretClient } from "@/app/_utils/supabase";
import { SquareClient, SquareEnvironment } from "square";
import {
  MEMBER_LIMITS,
  getEntryFeeCents,
  grossUpForSquareFee,
} from "@/app/2026/_data/teamConfig";
import { logError } from "@/app/_utils/errorLog";

function getSquareClient() {
  const environment =
    process.env.NEXT_PUBLIC_SQUARE_ENVIRONMENT === "production"
      ? SquareEnvironment.Production
      : SquareEnvironment.Sandbox;

  return new SquareClient({
    token: process.env.SQUARE_ACCESS_TOKEN,
    environment,
  });
}

/** Square amounts are BigInt; JSON.stringify throws on those. */
function toJsonSafe(obj: unknown): unknown {
  return JSON.parse(
    JSON.stringify(obj, (_key, value) =>
      typeof value === "bigint" ? Number(value) : value,
    ),
  );
}

export type PaymentQuote = {
  baseCents: number;
  totalCents: number;
  feeCents: number;
};

/**
 * What the captain will actually be charged. The form and the server action
 * both derive this from the same helper so the displayed figure can never
 * drift from the amount charged.
 */
export async function getPaymentQuote(): Promise<PaymentQuote> {
  const baseCents = getEntryFeeCents();
  const totalCents = grossUpForSquareFee(baseCents);
  return { baseCents, totalCents, feeCents: totalCents - baseCents };
}

export async function processPayment(
  sourceId: string,
  billing?: { cardholderName?: string; postalCode?: string },
): Promise<{ success: boolean; error?: string }> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Not authenticated" };

  const supabase = getSupabaseSecretClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email")
    .eq("clerk_user_id", userId)
    .single();

  if (!profile) return { success: false, error: "Profile not found" };

  const { data: membership } = await supabase
    .from("team_members")
    .select("team_id, role")
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (!membership) return { success: false, error: "You are not on a team" };
  if (membership.role !== "captain") {
    return { success: false, error: "Only the team captain can pay" };
  }

  const { data: team } = await supabase
    .from("teams")
    .select("id, name, paid")
    .eq("id", membership.team_id)
    .single();

  if (!team) return { success: false, error: "Team not found" };
  if (team.paid) return { success: false, error: "Your team has already paid" };

  const { count } = await supabase
    .from("team_members")
    .select("id", { count: "exact", head: true })
    .eq("team_id", team.id);

  if ((count ?? 0) < MEMBER_LIMITS.min) {
    return {
      success: false,
      error: `You need at least ${MEMBER_LIMITS.min} members before paying.`,
    };
  }

  const baseCents = getEntryFeeCents();
  const amountCents = grossUpForSquareFee(baseCents);

  const square = getSquareClient();

  try {
    const response = await square.payments.create({
      sourceId,
      idempotencyKey: crypto.randomUUID(),
      amountMoney: { amount: BigInt(amountCents), currency: "AUD" },
      locationId: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID,
      // referenceId is the machine-readable link back to the team. The webhook
      // reads this field rather than parsing the human-readable note, so the
      // note text is free to change without breaking reconciliation.
      // Square caps referenceId at 40 chars; a UUID is 36.
      referenceId: team.id,
      note: `Buildathon 2026 entry fee: ${team.name}`,
      buyerEmailAddress: profile.email,
      billingAddress: {
        postalCode: billing?.postalCode || undefined,
        country: "AU",
      },
    });

    if (response.payment?.status !== "COMPLETED") {
      await logError("payment", "Payment not completed", {
        teamId: team.id,
        userId,
        paymentStatus: response.payment?.status,
      });
      return {
        success: false,
        error: "Payment was not completed. Please try again.",
      };
    }

    // Mark the team paid FIRST. If the payments-history insert fails we still
    // want the team activated, the money has already left the card, and the
    // webhook will backfill the history row.
    const { error: updateError } = await supabase
      .from("teams")
      .update({ paid: true })
      .eq("id", team.id);

    if (updateError) {
      await logError("payment", "Payment succeeded but failed to mark team paid", {
        teamId: team.id,
        squarePaymentId: response.payment.id,
        error: updateError.message,
      });
      return {
        success: false,
        error:
          "Your payment went through but we could not activate your team. Please contact an organiser. Do not pay again.",
      };
    }

    const { error: insertError } = await supabase.from("payments").insert({
      team_id: team.id,
      square_payment_id: response.payment.id,
      amount_cents: amountCents,
      currency: "AUD",
      status: response.payment.status,
      source: "checkout",
      cardholder_name: billing?.cardholderName || null,
      billing_postcode: billing?.postalCode || null,
      square_response: toJsonSafe(response.payment),
    });

    if (insertError) {
      // Non-fatal: the team is active and the webhook will record the history.
      await logError("payment", "Failed to record payment history", {
        teamId: team.id,
        squarePaymentId: response.payment.id,
        error: insertError.message,
      });
    }

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : JSON.stringify(err);
    await logError("payment", "Square payment error", {
      teamId: team.id,
      userId,
      error: message,
    });
    return {
      success: false,
      error: "Sorry, payments aren't working right now. Please try again later.",
    };
  }
}
