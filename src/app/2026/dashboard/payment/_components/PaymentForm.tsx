"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/app/2026/_components/ui/Button";
import { processPayment, type PaymentQuote } from "@/app/2026/_actions/payment";
import { formatAud } from "@/app/2026/_data/teamConfig";
import Path from "@/app/path";

/* ------------------------------------------------------------------ */
/*  Square Web Payments SDK — minimal typings                         */
/* ------------------------------------------------------------------ */

interface TokenResult {
  status: string;
  token?: string;
  errors?: { message?: string; detail?: string }[];
}

interface SquareCard {
  attach: (selector: string) => Promise<void>;
  tokenize: () => Promise<TokenResult>;
  destroy: () => Promise<boolean> | void;
}

interface SquareDigitalWallet {
  attach: (selector: string, options?: Record<string, unknown>) => Promise<void>;
  tokenize: () => Promise<TokenResult>;
  destroy: () => Promise<boolean> | void;
  addEventListener: (
    event: string,
    callback: (event: { detail: { tokenResult: TokenResult } }) => void,
  ) => void;
}

interface PaymentRequestConfig {
  countryCode: string;
  currencyCode: string;
  total: { amount: string; label: string };
}

/** Opaque handle returned by payments.paymentRequest(). */
type SquarePaymentRequest = object;

interface SquarePayments {
  card: (options?: Record<string, unknown>) => Promise<SquareCard>;
  paymentRequest: (config: PaymentRequestConfig) => SquarePaymentRequest;
  applePay: (req: SquarePaymentRequest) => Promise<SquareDigitalWallet>;
  googlePay: (req: SquarePaymentRequest) => Promise<SquareDigitalWallet>;
}

interface SquareGlobal {
  payments: (appId: string, locationId: string) => Promise<SquarePayments>;
}

declare global {
  interface Window {
    Square?: SquareGlobal;
  }
}

/* ------------------------------------------------------------------ */
/*  SDK loading                                                       */
/* ------------------------------------------------------------------ */

const SQUARE_SDK_URL =
  process.env.NEXT_PUBLIC_SQUARE_ENVIRONMENT === "production"
    ? "https://web.squarecdn.com/v1/square.js"
    : "https://sandbox.web.squarecdn.com/v1/square.js";

const SDK_SCRIPT_ATTR = "data-square-web-payments";

/**
 * Loads the Square SDK exactly once per page, however many times this
 * component mounts. Failures clear the cached promise so a remount (or a
 * "try again" reload) gets a fresh attempt rather than a permanently poisoned
 * cache.
 */
let sdkPromise: Promise<void> | null = null;

function loadSquareSdk(): Promise<void> {
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise<void>((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Square SDK can only load in the browser."));
      return;
    }
    if (window.Square) {
      resolve();
      return;
    }

    const fail = () => {
      sdkPromise = null;
      reject(new Error("Failed to load the Square payment library."));
    };

    const existing = document.querySelector<HTMLScriptElement>(
      `script[${SDK_SCRIPT_ATTR}]`,
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", fail, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = SQUARE_SDK_URL;
    script.async = true;
    script.setAttribute(SDK_SCRIPT_ATTR, "");
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener(
      "error",
      () => {
        script.remove();
        fail();
      },
      { once: true },
    );
    document.head.appendChild(script);
  });

  return sdkPromise;
}

/**
 * Init and teardown are serialised through one module-level chain. Under React
 * StrictMode the effect mounts, unmounts and remounts; without this the two
 * runs would race to attach a card into the same container and could leave a
 * duplicate iframe behind.
 */
let squareQueue: Promise<unknown> = Promise.resolve();

const CARD_CONTAINER_ID = "square-card-container";
const GOOGLE_PAY_CONTAINER_ID = "square-google-pay-container";

/**
 * Blueprint theming for the card iframe. Square validates this object and
 * throws on anything it does not recognise, so initialisation retries with an
 * unstyled card if the theme is ever rejected — an ugly form still takes
 * money, a broken one does not.
 */
const CARD_STYLE = {
  ".input-container": {
    borderColor: "rgba(255, 255, 255, 0.25)",
    borderRadius: "8px",
  },
  ".input-container.is-focus": {
    borderColor: "#ffcf00",
  },
  ".input-container.is-error": {
    borderColor: "#ff9b9b",
  },
  input: {
    backgroundColor: "transparent",
    color: "#eaf1ff",
    fontSize: "15px",
  },
  "input::placeholder": {
    color: "rgba(234, 241, 255, 0.45)",
  },
  ".message-text": {
    color: "#ff9b9b",
  },
  ".message-icon": {
    color: "#ff9b9b",
  },
};

/** Pull something human-readable out of a Square tokenization failure. */
function describeTokenErrors(result: TokenResult): string {
  const messages = (result.errors ?? [])
    .map((e) => e.detail || e.message)
    .filter((m): m is string => !!m);

  if (messages.length > 0) return messages.join(" ");
  if (result.status === "ABORT") return "Payment was cancelled.";
  return "Your card details could not be verified. Please check them and try again.";
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export default function PaymentForm({
  teamName,
  memberCount,
  quote,
}: {
  teamName: string;
  memberCount: number;
  /** Computed server-side by getPaymentQuote(). Never recomputed here. */
  quote: PaymentQuote;
}) {
  const router = useRouter();

  /** True until the SDK settles, either way. Drives the field placeholder. */
  const [loading, setLoading] = useState(true);
  /** Only true once a card is actually attached and tokenizable. */
  const [cardReady, setCardReady] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState(false);
  const [cardholderName, setCardholderName] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [applePayAvailable, setApplePayAvailable] = useState(false);
  const [googlePayAvailable, setGooglePayAvailable] = useState(false);

  const cardRef = useRef<SquareCard | null>(null);
  const applePayRef = useRef<SquareDigitalWallet | null>(null);
  const googlePayRef = useRef<SquareDigitalWallet | null>(null);

  /**
   * Authoritative in-flight flag. React state updates are async, so two fast
   * clicks could both pass a `processing === false` check; a ref cannot.
   */
  const inFlightRef = useRef(false);

  // Refs mirror the billing inputs so the stable tokenization callback (used
  // by the Google Pay event listener) always reads the current values.
  const cardholderNameRef = useRef(cardholderName);
  const postalCodeRef = useRef(postalCode);
  cardholderNameRef.current = cardholderName;
  postalCodeRef.current = postalCode;

  const totalLabel = formatAud(quote.totalCents);

  /** Shared tail of every payment path: token -> server action -> UI. */
  const handleTokenResult = useCallback(
    async (result: TokenResult) => {
      try {
        if (result.status !== "OK" || !result.token) {
          setError(describeTokenErrors(result));
          return;
        }

        const response = await processPayment(result.token, {
          cardholderName: cardholderNameRef.current.trim(),
          postalCode: postalCodeRef.current.trim(),
        });

        if (response.success) {
          setSuccess(true);
          // Team is now paid — make sure the dashboard reflects that.
          router.refresh();
        } else {
          setError(response.error ?? "Payment failed. Please try again.");
        }
      } catch {
        setError(
          "We could not confirm your payment. Please check your email for a receipt before trying again, or contact an organiser.",
        );
      } finally {
        // Always release the lock, so a failed attempt can be retried.
        inFlightRef.current = false;
        setProcessing(false);
      }
    },
    [router],
  );

  /* ------------------------------- init ------------------------------- */

  useEffect(() => {
    const appId = process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID;
    const locationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID;

    if (!appId || !locationId) {
      setError(
        "Payments are not configured. Please contact an organiser — do not try again.",
      );
      setLoading(false);
      return;
    }

    let cancelled = false;

    squareQueue = squareQueue.then(async () => {
      if (cancelled) return;
      try {
        await loadSquareSdk();
        if (cancelled || !window.Square) return;

        const payments = await window.Square.payments(appId, locationId);
        if (cancelled) return;

        // Themed card, falling back to the SDK default if Square rejects the
        // style object for any reason.
        let card: SquareCard;
        try {
          card = await payments.card({ style: CARD_STYLE });
        } catch (styleErr) {
          console.warn("[Square] card style rejected, using default:", styleErr);
          card = await payments.card();
        }
        if (cancelled) {
          await card.destroy();
          return;
        }

        await card.attach(`#${CARD_CONTAINER_ID}`);
        if (cancelled) {
          await card.destroy();
          return;
        }
        cardRef.current = card;
        setCardReady(true);
        setLoading(false);

        // ---- digital wallets (best effort; never block the card path) ----
        const paymentRequest = payments.paymentRequest({
          countryCode: "AU",
          currencyCode: "AUD",
          total: {
            amount: (quote.totalCents / 100).toFixed(2),
            label: "Buildathon 2026 entry fee",
          },
        });

        try {
          // Apple Pay is not attached — the SDK only validates availability,
          // and tokenize() must be called straight from the click handler.
          const applePay = await payments.applePay(paymentRequest);
          if (cancelled) {
            await applePay.destroy();
          } else {
            applePayRef.current = applePay;
            setApplePayAvailable(true);
          }
        } catch (e) {
          console.warn("[Square] Apple Pay unavailable:", e);
        }

        try {
          const googlePay = await payments.googlePay(paymentRequest);
          if (cancelled) {
            await googlePay.destroy();
          } else {
            await googlePay.attach(`#${GOOGLE_PAY_CONTAINER_ID}`);
            googlePay.addEventListener("ontokenization", (event) => {
              // Google Pay resolves its own sheet, so mark in-flight here.
              if (inFlightRef.current) return;
              inFlightRef.current = true;
              setProcessing(true);
              setError(undefined);
              void handleTokenResult(event.detail.tokenResult);
            });
            googlePayRef.current = googlePay;
            setGooglePayAvailable(true);
          }
        } catch (e) {
          console.warn("[Square] Google Pay unavailable:", e);
        }
      } catch (e) {
        console.error("[Square] initialisation failed:", e);
        if (!cancelled) {
          setError(
            "The payment form could not be loaded. Please refresh the page and try again.",
          );
          setLoading(false);
        }
      }
    });

    return () => {
      cancelled = true;
      // Tear down on the same chain so the next mount's init cannot start
      // until this instance's handles are gone.
      squareQueue = squareQueue.then(async () => {
        const handles = [cardRef, applePayRef, googlePayRef];
        for (const ref of handles) {
          try {
            await ref.current?.destroy();
          } catch {
            /* the SDK throws if already destroyed — nothing to do */
          }
          ref.current = null;
        }
      });
    };
    // quote.totalCents and handleTokenResult are stable for this component's
    // lifetime; the effect is intended to run once.
  }, [quote.totalCents, handleTokenResult]);

  /* ------------------------------ actions ----------------------------- */

  /** Claim the in-flight lock. Returns false if a payment is already running. */
  function beginPayment(): boolean {
    if (inFlightRef.current || !cardReady) return false;
    inFlightRef.current = true;
    setProcessing(true);
    setError(undefined);
    return true;
  }

  function releasePayment(message: string) {
    inFlightRef.current = false;
    setProcessing(false);
    setError(message);
  }

  async function handleCardPay() {
    if (!cardRef.current) {
      setError(
        "The card form has not finished loading. Please refresh the page and try again.",
      );
      return;
    }
    if (!cardholderName.trim()) {
      setError("Please enter the name on the card.");
      return;
    }
    if (!beginPayment()) return;

    try {
      const result = await cardRef.current.tokenize();
      await handleTokenResult(result);
    } catch (e) {
      console.error("[Square] card tokenize threw:", e);
      releasePayment(
        "We could not read your card details. Please check them and try again.",
      );
    }
  }

  async function handleWalletPay(
    wallet: SquareDigitalWallet | null,
    label: string,
  ) {
    if (!wallet) return;
    if (!beginPayment()) return;

    try {
      const result = await wallet.tokenize();
      await handleTokenResult(result);
    } catch (e) {
      console.error(`[Square] ${label} tokenize threw:`, e);
      releasePayment(`${label} could not complete. Please try again.`);
    }
  }

  /* ------------------------------ success ----------------------------- */

  if (success) {
    return (
      <div className="drafting-frame bg-blueprint-900/60 flex flex-col items-center gap-5 rounded-xl px-5 py-10 text-center">
        <div
          className="bg-lego-green/20 text-lego-green flex h-20 w-20 items-center justify-center rounded-full"
          aria-hidden
        >
          <svg
            className="h-10 w-10"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <p className="spec-label">Payment received</p>
          <h1 className="mt-1 text-3xl">Team activated</h1>
          <p className="font-main text-ink-dim mt-2 text-sm">
            {teamName} is registered for Buildathon 2026. A receipt is on its
            way to your email.
          </p>
        </div>
        <Link href={Path[2026].Dashboard} className="button">
          Back to dashboard
        </Link>
      </div>
    );
  }

  /* ------------------------------- form ------------------------------- */

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={Path[2026].Dashboard}
        className="font-blueprint text-ink-dim hover:text-ink -ml-1 inline-flex min-h-[44px] items-center gap-1.5 px-1 text-xs uppercase transition-colors"
      >
        <svg
          className="h-3.5 w-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to dashboard
      </Link>

      <div className="border-grid-major border-b pb-4">
        <p className="spec-label">RAMSoc Buildathon 2026 &middot; Checkout</p>
        <h1 className="mt-1 text-3xl sm:text-4xl">Pay entry fee</h1>
      </div>

      {/* ---------------------- order summary ---------------------- */}
      <section
        aria-labelledby="order-summary-heading"
        className="bg-blueprint-900/60 rounded-xl border border-white/15 p-4 sm:p-5"
      >
        <h2 id="order-summary-heading" className="spec-label mb-3">
          Order summary
        </h2>

        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-3">
          <div className="min-w-0">
            <p className="font-main text-ink text-sm">
              Team entry &mdash; one division, flat fee
            </p>
            <p className="font-blueprint text-ink-dim mt-0.5 truncate text-[0.65rem] uppercase">
              {teamName} &middot; {memberCount} member
              {memberCount !== 1 ? "s" : ""}
            </p>
          </div>
          <span className="font-blueprint text-ink shrink-0 text-sm">
            {formatAud(quote.baseCents)}
          </span>
        </div>

        <dl className="font-main mt-3 flex flex-col gap-1.5 text-sm">
          <div className="text-ink-dim flex justify-between gap-4">
            <dt>Entry fee</dt>
            <dd className="font-blueprint">{formatAud(quote.baseCents)}</dd>
          </div>
          <div className="text-ink-dim flex justify-between gap-4">
            <dt>Card processing</dt>
            <dd className="font-blueprint">{formatAud(quote.feeCents)}</dd>
          </div>
          <div className="border-grid-major mt-1.5 flex items-baseline justify-between gap-4 border-t pt-2.5">
            <dt className="font-display text-ink text-base uppercase">Total</dt>
            <dd className="font-display text-lego-yellow text-2xl">
              {totalLabel}
            </dd>
          </div>
        </dl>

        <p className="font-main text-ink-dim mt-3 text-xs">
          {formatAud(quote.baseCents)} entry fee + {formatAud(quote.feeCents)}{" "}
          card processing = {totalLabel} total.
        </p>
      </section>

      {/* ----------------------- digital wallets ----------------------
          The Google Pay container keeps a fixed position in the tree and is
          only hidden with CSS. Moving it between branches would unmount the
          node Square has already attached its iframe to. */}
      <div className="flex flex-col gap-3">
        {applePayAvailable && (
          <button
            id="apple-pay-button"
            type="button"
            aria-label={`Pay ${totalLabel} with Apple Pay`}
            onClick={() => handleWalletPay(applePayRef.current, "Apple Pay")}
            disabled={processing || !cardReady}
            style={{
              WebkitAppearance: "-apple-pay-button" as never,
              appearance: "-apple-pay-button" as never,
              width: "100%",
              height: "48px",
              borderRadius: "8px",
              cursor: processing ? "progress" : "pointer",
              opacity: processing ? 0.6 : 1,
            }}
          />
        )}

        {/* Never `display: none` — Square attaches to this node before we
            know whether Google Pay is available, and it cannot measure a
            hidden element. Empty, it collapses to zero height. */}
        <div
          id={GOOGLE_PAY_CONTAINER_ID}
          className={`${googlePayAvailable ? "min-h-[48px]" : ""} [&_button]:!h-[48px] [&_button]:!w-full [&_button]:!rounded-lg [&_button]:!border-0 [&_button]:!outline-none`}
        />

        {(applePayAvailable || googlePayAvailable) && (
          <div className="font-blueprint text-ink-dim my-1 flex items-center gap-3 text-[0.65rem] uppercase">
            <span className="bg-grid-major h-px flex-1" />
            or pay by card
            <span className="bg-grid-major h-px flex-1" />
          </div>
        )}
      </div>

      {/* --------------------------- card ---------------------------- */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="cardholder-name" className="spec-label">
            Name on card
          </label>
          <input
            id="cardholder-name"
            type="text"
            autoComplete="cc-name"
            placeholder="A. Builder"
            value={cardholderName}
            onChange={(e) => setCardholderName(e.target.value)}
            disabled={processing}
            className="font-main text-ink placeholder:text-ink-dim/70 focus-visible:border-lego-yellow focus-visible:ring-ring/40 bg-blueprint-850 min-h-[44px] rounded-lg border border-white/25 px-3 py-2.5 text-sm outline-none transition-colors focus-visible:ring-2"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span id="card-details-label" className="spec-label">
            Card details
          </span>
          {/* The Square iframe body is transparent, so this wrapper supplies
              the blueprint ground behind the white input text. */}
          <div
            id={CARD_CONTAINER_ID}
            role="group"
            aria-labelledby="card-details-label"
            className="bg-blueprint-850 min-h-[90px] rounded-lg"
          >
            {!cardReady && (
              <div className="font-blueprint text-ink-dim flex h-[90px] items-center justify-center px-3 text-center text-xs uppercase">
                {loading
                  ? "Loading secure card form…"
                  : "Card form unavailable — please refresh"}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="billing-postcode" className="spec-label">
              Billing postcode
            </label>
            <input
              id="billing-postcode"
              type="text"
              autoComplete="postal-code"
              inputMode="numeric"
              maxLength={10}
              placeholder="2052"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              disabled={processing}
              className="font-main text-ink placeholder:text-ink-dim/70 focus-visible:border-lego-yellow focus-visible:ring-ring/40 bg-blueprint-850 min-h-[44px] rounded-lg border border-white/25 px-3 py-2.5 text-sm outline-none transition-colors focus-visible:ring-2"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="spec-label">Country</span>
            <div className="font-main text-ink-dim bg-blueprint-850 flex min-h-[44px] items-center rounded-lg border border-white/25 px-3 text-sm">
              Australia
            </div>
          </div>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="font-main bg-lego-red/15 border-lego-red/40 rounded-lg border px-3 py-2.5 text-sm text-[#ffc9c9]"
        >
          {error}
        </p>
      )}

      <Button
        size="full"
        onClick={handleCardPay}
        disabled={!cardReady || processing}
        loading={processing}
        className="font-display brick text-lg font-bold tracking-wide uppercase"
      >
        {processing ? "Processing payment…" : `Pay ${totalLabel}`}
      </Button>

      <p className="font-blueprint text-ink-dim flex items-center justify-center gap-2 text-center text-[0.65rem] uppercase">
        <svg
          className="h-3.5 w-3.5 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
        Card details are handled by Square. We never see them.
      </p>
    </div>
  );
}
