import { avatarFromSeed } from "@/app/2026/_data/market";
import { cn } from "@/app/_utils/cn";

/**
 * A minifig head drawn from a seed, so the same dealer looks the same on
 * every device without storing an image. Pure SVG, renders on the server.
 *
 * The features are the ones a back-room trader would wear: hoods, fedoras,
 * eyepatches, a monocle, a cigar. Skin tones are the ones LEGO moulds.
 */
export default function LegoAvatar({
  seed,
  className,
  title,
}: {
  seed: number;
  className?: string;
  title?: string;
}) {
  const a = avatarFromSeed(seed);

  return (
    <svg
      viewBox="0 0 64 64"
      className={cn("h-10 w-10 shrink-0 rounded-md", className)}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title && <title>{title}</title>}

      {/* Backdrop brick with two studs. */}
      <rect width="64" height="64" fill={a.backdrop} />
      <rect x="10" y="2" width="12" height="4" rx="1" fill="#ffffff" opacity="0.08" />
      <rect x="42" y="2" width="12" height="4" rx="1" fill="#ffffff" opacity="0.08" />

      <g transform={`rotate(${a.tilt} 32 36)`}>
        {/* Neck stud and head. */}
        <rect x="26" y="52" width="12" height="6" rx="1.5" fill={a.skin} />
        <rect x="27" y="10" width="10" height="6" rx="1.5" fill={a.skin} />
        <rect x="17" y="15" width="30" height="38" rx="7" fill={a.skin} />
        {/* Cheek shadow, gives the cylinder some roundness. */}
        <rect x="41" y="15" width="6" height="38" rx="3" fill="#000" opacity="0.08" />

        {/* Eyes */}
        {a.eyes === "dots" && (
          <>
            <circle cx="26" cy="31" r="2.2" fill="#111" />
            <circle cx="38" cy="31" r="2.2" fill="#111" />
          </>
        )}
        {a.eyes === "sunglasses" && (
          <>
            <rect x="20" y="27" width="11" height="8" rx="2" fill="#111" />
            <rect x="33" y="27" width="11" height="8" rx="2" fill="#111" />
            <rect x="30" y="30" width="4" height="2" fill="#111" />
            <rect x="22" y="29" width="4" height="1.5" fill="#fff" opacity="0.35" />
            <rect x="35" y="29" width="4" height="1.5" fill="#fff" opacity="0.35" />
          </>
        )}
        {a.eyes === "eyepatch" && (
          <>
            <circle cx="26" cy="31" r="2.2" fill="#111" />
            <rect x="33" y="26" width="10" height="9" rx="2" fill="#111" />
            <path d="M17 24 L34 27 M43 27 L47 24" stroke="#111" strokeWidth="1.5" fill="none" />
          </>
        )}
        {a.eyes === "monocle" && (
          <>
            <circle cx="26" cy="31" r="2.2" fill="#111" />
            <circle cx="38" cy="31" r="5.5" fill="none" stroke="#c9a227" strokeWidth="1.6" />
            <circle cx="38" cy="31" r="2.2" fill="#111" />
            <path d="M43 34 Q46 40 45 46" stroke="#c9a227" strokeWidth="1.2" fill="none" />
          </>
        )}
        {a.eyes === "visor" && (
          <>
            <rect x="19" y="26" width="26" height="9" rx="3" fill="#0b2a44" />
            <rect x="21" y="28" width="22" height="3" rx="1.5" fill="#35a3e0" opacity="0.9" />
          </>
        )}

        {/* Mouths */}
        {a.mouth === "smirk" && (
          <path d="M26 42 Q32 46 38 41" stroke="#111" strokeWidth="2" fill="none" strokeLinecap="round" />
        )}
        {a.mouth === "flat" && (
          <path d="M26 43 L38 43" stroke="#111" strokeWidth="2" strokeLinecap="round" />
        )}
        {a.mouth === "grin" && (
          <path d="M25 41 Q32 48 39 41 Z" fill="#111" />
        )}
        {a.mouth === "moustache" && (
          <>
            <path d="M23 40 Q28 36 32 40 Q36 36 41 40 Q36 43 32 41 Q28 43 23 40 Z" fill="#111" />
            <path d="M28 46 L36 46" stroke="#111" strokeWidth="1.5" strokeLinecap="round" />
          </>
        )}
        {a.mouth === "stubble" && (
          <>
            <path d="M26 43 L38 43" stroke="#111" strokeWidth="2" strokeLinecap="round" />
            <g fill="#111" opacity="0.35">
              <circle cx="24" cy="46" r="0.8" />
              <circle cx="28" cy="48" r="0.8" />
              <circle cx="32" cy="49" r="0.8" />
              <circle cx="36" cy="48" r="0.8" />
              <circle cx="40" cy="46" r="0.8" />
              <circle cx="26" cy="49.5" r="0.8" />
              <circle cx="38" cy="49.5" r="0.8" />
            </g>
          </>
        )}
        {a.mouth === "cigar" && (
          <>
            <path d="M26 43 L34 43" stroke="#111" strokeWidth="2" strokeLinecap="round" />
            <rect x="33" y="41" width="12" height="4" rx="1" fill="#4a2c17" />
            <rect x="44" y="41" width="2" height="4" fill="#ff6a00" />
          </>
        )}

        {/* Hats and hair */}
        {a.hat === "beanie" && (
          <>
            <path d="M16 22 Q32 2 48 22 Z" fill={a.hatColour} />
            <rect x="15" y="19" width="34" height="6" rx="2" fill={a.hatColour} />
            <rect x="15" y="22" width="34" height="1.5" fill="#000" opacity="0.2" />
          </>
        )}
        {a.hat === "fedora" && (
          <>
            <path d="M19 20 Q32 4 45 20 Z" fill={a.hatColour} />
            <rect x="11" y="18" width="42" height="5" rx="2.5" fill={a.hatColour} />
            <rect x="19" y="15" width="26" height="3" fill="#000" opacity="0.25" />
          </>
        )}
        {a.hat === "hood" && (
          <>
            <path d="M12 56 L12 26 Q32 -2 52 26 L52 56 L44 56 L44 30 Q32 14 20 30 L20 56 Z" fill={a.hatColour} />
          </>
        )}
        {a.hat === "cap" && (
          <>
            <path d="M17 22 Q32 6 47 22 Z" fill={a.hatColour} />
            <rect x="17" y="19" width="30" height="5" rx="2" fill={a.hatColour} />
            <rect x="38" y="20" width="18" height="4" rx="2" fill={a.hatColour} />
          </>
        )}
        {a.hat === "spiky" && (
          <path d="M17 22 L20 10 L25 20 L29 8 L33 20 L37 8 L41 20 L45 10 L47 22 Z" fill={a.hatColour} />
        )}
        {a.hat === "bob" && (
          <path d="M15 40 L15 22 Q32 4 49 22 L49 40 L44 40 L44 28 Q32 18 20 28 L20 40 Z" fill={a.hatColour} />
        )}
      </g>
    </svg>
  );
}
