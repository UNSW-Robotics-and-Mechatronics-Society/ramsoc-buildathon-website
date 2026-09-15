/**
 * The Black Market: an anonymous room where members of paid teams trade the
 * bonus tickets they find around the site. Everyone gets a dealer name and a
 * minifig avatar the first time they walk in, both saved to their profile so
 * they are the same person every visit.
 */

export const MARKET_MESSAGE_MAX = 500;

/** Minimum gap between two messages from one person. */
export const MARKET_RATE_LIMIT_MS = 1500;

/** How often an open client asks for new messages. */
export const MARKET_POLL_MS = 3000;

/** A dealer counts as "in the market" if seen within this window. */
export const MARKET_PRESENCE_MS = 2 * 60 * 1000;

/** Messages loaded on first open. Older history is not paged in. */
export const MARKET_HISTORY = 120;

/**
 * Nothing in the room is kept: a message older than this is hard-deleted the
 * next time anyone visits or polls the market, moderation records included.
 * There is no scheduled job behind this, it is swept opportunistically on
 * read, which is effectively continuous while anyone is in the room (the
 * client polls every MARKET_POLL_MS) and catches up the moment someone next
 * opens the door if the room sat empty for a while.
 */
export const MARKET_MESSAGE_TTL_MS = 3 * 60 * 60 * 1000;

// ── aliases ──────────────────────────────────────────────────────────────────

/*
 * Dealer names are one adjective and one noun. The nouns are LEGO parts and
 * kit components, the adjectives are what you'd expect of someone selling
 * them out of a trench coat.
 */
export const ALIAS_ADJECTIVES = [
  "Crooked",
  "Velvet",
  "Midnight",
  "Rusty",
  "Shady",
  "Gilded",
  "Smoky",
  "Hollow",
  "Quiet",
  "Loose",
  "Copper",
  "Sleepy",
  "Tinny",
  "Brassy",
  "Dusty",
  "Backdoor",
  "Sideways",
  "Lucky",
  "Grim",
  "Slick",
  "Cagey",
  "Frosty",
  "Nervous",
  "Oily",
] as const;

export const ALIAS_NOUNS = [
  "Minifig",
  "Stud",
  "Baseplate",
  "Brick",
  "Plate",
  "Tile",
  "Torso",
  "Wrench",
  "Antenna",
  "Sprocket",
  "Servo",
  "Resistor",
  "Capacitor",
  "Solder",
  "Diode",
  "Jumper",
  "Breadboard",
  "Gearbox",
  "Piston",
  "Axle",
  "Technic",
  "Sensor",
  "Relay",
  "Mosfet",
] as const;

// ── avatars ──────────────────────────────────────────────────────────────────

/**
 * Minifig head colourways. Classic yellow leads, the rest are the flesh and
 * novelty tones LEGO actually moulds heads in.
 */
export const AVATAR_SKINS = [
  "#f7d117",
  "#f7d117",
  "#f7d117",
  "#f5c189",
  "#c47a3a",
  "#6b4a2b",
  "#a5c6e8",
  "#b6d58a",
] as const;

/** Hat and hair colours. Deliberately muted: this is a back room, not a toy shop. */
export const AVATAR_HAT_COLOURS = [
  "#1b1b1b",
  "#3b2a1a",
  "#4a4a4a",
  "#5a2d2d",
  "#2f5c8a",
  "#6b5a2e",
  "#1f3a2a",
  "#7a1e28",
] as const;

/** Background bricks behind the head. */
export const AVATAR_BACKDROPS = [
  "#0b1a33",
  "#122a4d",
  "#1a1f2e",
  "#2a1a1a",
  "#1a2a1a",
  "#2b2340",
] as const;

export const AVATAR_HATS = [
  "none",
  "beanie",
  "fedora",
  "hood",
  "cap",
  "spiky",
  "bob",
] as const;

export const AVATAR_EYES = [
  "dots",
  "dots",
  "sunglasses",
  "eyepatch",
  "monocle",
  "visor",
] as const;

export const AVATAR_MOUTHS = [
  "smirk",
  "flat",
  "grin",
  "moustache",
  "stubble",
  "cigar",
] as const;

export type AvatarHat = (typeof AVATAR_HATS)[number];
export type AvatarEyes = (typeof AVATAR_EYES)[number];
export type AvatarMouth = (typeof AVATAR_MOUTHS)[number];

export type AvatarSpec = {
  skin: string;
  hatColour: string;
  backdrop: string;
  hat: AvatarHat;
  eyes: AvatarEyes;
  mouth: AvatarMouth;
  /** Head tilt in degrees, a little life without a full pose. */
  tilt: number;
};

/** mulberry32: small, deterministic, good enough for picking hats. */
function prng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rand: () => number, list: readonly T[]): T {
  return list[Math.floor(rand() * list.length)];
}

/** Same seed, same minifig, on the server and in every browser. */
export function avatarFromSeed(seed: number): AvatarSpec {
  const rand = prng(seed);
  return {
    skin: pick(rand, AVATAR_SKINS),
    hatColour: pick(rand, AVATAR_HAT_COLOURS),
    backdrop: pick(rand, AVATAR_BACKDROPS),
    hat: pick(rand, AVATAR_HATS),
    eyes: pick(rand, AVATAR_EYES),
    mouth: pick(rand, AVATAR_MOUTHS),
    tilt: Math.round((rand() - 0.5) * 12),
  };
}

/** Random alias parts. Uniqueness is enforced by the database. */
export function randomAliasParts(rand: () => number = Math.random): {
  adjective: string;
  noun: string;
} {
  return {
    adjective: pick(rand, ALIAS_ADJECTIVES),
    noun: pick(rand, ALIAS_NOUNS),
  };
}
