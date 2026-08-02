import Link from "next/link";
import Path from "@/app/path";
import { getLiveRegistrationStatus } from "@/app/2026/_actions/appConfig";
import {
  MEMBER_LIMITS,
  getEntryFeeCents,
  formatAud,
} from "@/app/2026/_data/teamConfig";

const DATE_FORMAT = new Intl.DateTimeFormat("en-AU", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "Australia/Sydney",
});

export default async function RegisterCta() {
  const status = await getLiveRegistrationStatus();

  const headline = status.isOpen
    ? "Registrations are open"
    : status.isUpcoming
      ? "Registrations open soon"
      : "Registrations have closed";

  return (
    <section className="py-8 md:py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="lego-studs brick bg-lego-yellow flex flex-col items-start gap-6 p-7 text-[#0a2a55] sm:p-9 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="mb-2 text-[#0a2a55]">{headline}</h2>
            <p className="font-blueprint text-sm text-[#0a2a55]/80 uppercase">
              {formatAud(getEntryFeeCents())} per team · {MEMBER_LIMITS.min}–
              {MEMBER_LIMITS.max} people
              {status.nextDeadline && status.nextDeadlineLabel && (
                <>
                  {" · "}
                  {status.nextDeadlineLabel}{" "}
                  {DATE_FORMAT.format(status.nextDeadline)}
                </>
              )}
            </p>
          </div>

          {status.isOpen ? (
            <Link
              href={Path[2026].SignUp}
              className="brick font-display inline-flex min-h-[44px] shrink-0 items-center justify-center bg-[#0a2a55] px-7 py-3 text-lg font-bold tracking-wide text-white uppercase hover:bg-[#0e3a72]"
            >
              Register now
            </Link>
          ) : (
            <Link
              href={Path[2026].SignIn}
              className="font-display inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-lg border-2 border-[#0a2a55] px-7 py-3 text-lg font-bold tracking-wide text-[#0a2a55] uppercase hover:bg-[#0a2a55]/10"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
