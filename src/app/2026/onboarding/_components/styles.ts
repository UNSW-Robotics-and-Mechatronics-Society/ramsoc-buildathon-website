/**
 * Shared class strings for the onboarding flow, so every step looks like a
 * page of the same drafting form.
 */

/** Primary CTA: the ui/Button primitive dressed as a LEGO brick. */
export const BRICK_CTA =
  "brick font-display text-base font-bold tracking-wide uppercase";

/** A large tappable option card (user type, create/join team). */
export const CHOICE_CARD =
  "brick font-main flex min-h-[72px] w-full flex-col items-start justify-center gap-0.5 border border-grid-major bg-white/6 px-4 py-4 text-left text-ink transition-colors hover:border-lego-yellow hover:bg-white/12 disabled:pointer-events-none disabled:opacity-50 sm:px-5";

/**
 * Turns the ui/Input and ui/Select labels into mono technical annotations.
 * Applied to the wrapping <form>; choice labels opt out with data-choice.
 */
export const DRAFTING_LABELS =
  "[&_label:not([data-choice])]:font-blueprint [&_label:not([data-choice])]:text-[0.7rem] [&_label:not([data-choice])]:uppercase [&_label:not([data-choice])]:text-ink-dim";

/** Native <option> menus render on the OS surface, force them readable. */
export const SELECT_OPTIONS = "[&>option]:bg-blueprint-900 [&>option]:text-ink";
