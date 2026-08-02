import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { getSupabaseSecretClient } from "@/app/_utils/supabase";
import { logError } from "@/app/_utils/errorLog";

const WEBHOOK_SIGNATURE_KEY = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY ?? "";
const WEBHOOK_URL = process.env.SQUARE_WEBHOOK_URL ?? "";

/**
 * Square signs `notificationUrl + rawBody` with HMAC-SHA256. The URL must match
 * what is registered in the Square dashboard byte for byte, so it comes from
 * env rather than from the request (which sits behind a proxy in production).
 */
function isValidSignature(body: string, signatureHeader: string): boolean {
  if (!WEBHOOK_SIGNATURE_KEY || !signatureHeader) return false;

  const expected = createHmac("sha256", WEBHOOK_SIGNATURE_KEY)
    .update(WEBHOOK_URL + body)
    .digest();
  const received = Buffer.from(signatureHeader, "base64");

  // timingSafeEqual throws on length mismatch, so check that first.
  if (expected.length !== received.length) return false;
  return timingSafeEqual(expected, received);
}

/**
 * Webhook payloads are raw JSON in snake_case, unlike the Square SDK's
 * responses, which are camelCase. Read both so this keeps working if Square
 * ever normalises the shape.
 */
type WebhookPayment = {
  id?: string;
  status?: string;
  reference_id?: string;
  referenceId?: string;
  note?: string;
  amount_money?: { amount?: number; currency?: string };
  amountMoney?: { amount?: number; currency?: string };
};

function readAmount(payment: WebhookPayment): {
  cents: number;
  currency: string;
} {
  const money = payment.amount_money ?? payment.amountMoney;
  return {
    cents: Number(money?.amount ?? 0),
    currency: money?.currency ?? "AUD",
  };
}

function readTeamId(payment: WebhookPayment): string | null {
  const ref = payment.reference_id ?? payment.referenceId;
  if (ref) return ref;

  // Fallback for any payment taken before referenceId was set, or one entered
  // manually in the Square dashboard with the team id appended to the note.
  const match = (payment.note ?? "").match(
    /\[team:([0-9a-f-]{36})\]/i,
  );
  return match?.[1] ?? null;
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("x-square-hmacsha256-signature") ?? "";

  if (!isValidSignature(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  let event: { type?: string; data?: { object?: { payment?: WebhookPayment } } };
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Malformed JSON" }, { status: 400 });
  }

  if (event.type !== "payment.updated") {
    return NextResponse.json({ received: true, action: "ignored_event_type" });
  }

  const payment = event.data?.object?.payment;
  if (!payment?.id) {
    return NextResponse.json({ error: "No payment data" }, { status: 400 });
  }

  // Square emits payment.updated for pending/failed states too. Only completed
  // payments activate a team.
  if (payment.status !== "COMPLETED") {
    return NextResponse.json({ received: true, action: "ignored_not_complete" });
  }

  const supabase = getSupabaseSecretClient();

  // Already recorded by the checkout flow, just make sure the team is active.
  const { data: existing } = await supabase
    .from("payments")
    .select("team_id")
    .eq("square_payment_id", payment.id)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("teams")
      .update({ paid: true })
      .eq("id", existing.team_id);
    return NextResponse.json({ received: true, action: "ensured_paid" });
  }

  const teamId = readTeamId(payment);
  if (!teamId) {
    await logError("webhook", "Payment has no team reference", {
      squarePaymentId: payment.id,
      note: payment.note,
    });
    return NextResponse.json({ received: true, action: "skipped_no_match" });
  }

  const { data: team } = await supabase
    .from("teams")
    .select("id")
    .eq("id", teamId)
    .maybeSingle();

  if (!team) {
    await logError("webhook", "Team not found for payment", {
      teamId,
      squarePaymentId: payment.id,
    });
    return NextResponse.json({ received: true, action: "skipped_no_team" });
  }

  const { cents, currency } = readAmount(payment);

  await supabase.from("payments").insert({
    team_id: team.id,
    square_payment_id: payment.id,
    amount_cents: cents,
    currency,
    status: payment.status,
    source: "webhook",
    square_response: payment,
  });

  await supabase.from("teams").update({ paid: true }).eq("id", team.id);

  return NextResponse.json({ received: true, action: "payment_recorded" });
}
