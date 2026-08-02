"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { getSupabaseSecretClient } from "@/app/_utils/supabase";
import { logError } from "@/app/_utils/errorLog";
import type { Profile, UserType } from "@/app/_types/registration";

/**
 * Buildathon is open to three cohorts, UNSW students, students at other
 * universities, and high schoolers, and which fields are required depends on
 * which cohort the entrant picked. There is no division/category concept here,
 * so nothing in this file gates on one.
 */

const USER_TYPES: UserType[] = ["unsw", "other_uni", "high_school"];

/** UNSW student numbers are the letter z followed by seven digits. */
const ZID_PATTERN = /^z\d{7}$/i;

export type ProfileInput = {
  full_name: string;
  user_type: UserType;
  phone: string;

  // UNSW students
  zid: string;
  faculty: string;
  degree: string;
  majors: string;
  degree_stage: string;
  undergrad_postgrad: string;
  domestic_international: string;
  year_of_study: string;
  is_ramsoc_member: boolean;
  is_arc_member: boolean;

  // Non-UNSW university students
  university: string;
  uni_id: string;

  // High school students
  high_school: string;

  gender: string;
  gender_other: string;
  heard_from: string;
  heard_from_other: string;
  dietary_requirements: string;
};

/** Every profiles column this action owns, with cohort-safe defaults. */
const EMPTY_INPUT: ProfileInput = {
  full_name: "",
  user_type: "unsw",
  phone: "",
  zid: "",
  faculty: "",
  degree: "",
  majors: "",
  degree_stage: "",
  undergrad_postgrad: "",
  domestic_international: "",
  year_of_study: "",
  is_ramsoc_member: false,
  is_arc_member: false,
  university: "",
  uni_id: "",
  high_school: "",
  gender: "",
  gender_other: "",
  heard_from: "",
  heard_from_other: "",
  dietary_requirements: "",
};

// ── getProfile ───────────────────────────────────────────────────────────────

export async function getProfile(): Promise<Profile | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const supabase = getSupabaseSecretClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("clerk_user_id", userId)
    .maybeSingle();

  if (error) {
    await logError("profile.getProfile", "Failed to fetch profile", {
      userId,
      error: error.message,
    });
    return null;
  }

  return (data as Profile | null) ?? null;
}

// ── validation ───────────────────────────────────────────────────────────────

/**
 * Validate a complete profile. Returns an error message, or null if valid.
 * Both create and update run this against the full (merged) profile so that a
 * partial edit can never leave the record in a state create would have refused.
 */
function validate(input: ProfileInput): string | null {
  if (!input.full_name.trim()) return "Full name is required";

  if (!USER_TYPES.includes(input.user_type)) return "Invalid user type";

  if (input.user_type === "unsw") {
    const zid = input.zid.trim();
    if (!zid) return "zID is required for UNSW students";
    if (!ZID_PATTERN.test(zid)) {
      return "zID must be the letter z followed by 7 digits (e.g. z1234567)";
    }
  }

  if (input.user_type === "other_uni") {
    if (!input.university.trim()) return "University is required";
    if (!input.uni_id.trim()) return "University ID is required";
  }

  if (input.user_type === "high_school" && !input.high_school.trim()) {
    return "High school is required";
  }

  // University-specific details, not asked of high school students.
  if (input.user_type !== "high_school") {
    if (!input.year_of_study) return "Year of study is required";
    if (!input.degree_stage) return "Degree stage is required";
    if (!input.undergrad_postgrad) {
      return "Please select undergraduate or postgraduate";
    }
    if (!input.domestic_international) {
      return "Please select domestic or international";
    }
    if (!input.degree.trim()) return "Degree is required";
    if (!input.faculty.trim()) return "Faculty is required";
  }

  if (!input.gender) return "Gender is required";
  if (input.gender === "other" && !input.gender_other.trim()) {
    return "Please specify your gender";
  }

  if (!input.heard_from) return "Please tell us how you heard about us";
  if (input.heard_from === "other" && !input.heard_from_other.trim()) {
    return "Please specify how you heard about us";
  }

  if (!input.phone.trim()) return "Phone number is required";

  return null;
}

/**
 * Trim, and blank out every field that does not apply to the chosen cohort, so
 * switching cohort never leaves stale data behind (e.g. a zID on a profile that
 * is now a high schooler).
 */
function toRow(input: ProfileInput) {
  const isUnsw = input.user_type === "unsw";
  const isOtherUni = input.user_type === "other_uni";
  const isHighSchool = input.user_type === "high_school";
  const isUni = !isHighSchool;

  return {
    full_name: input.full_name.trim(),
    user_type: input.user_type,
    phone: input.phone.trim(),

    // UNSW-only fields
    zid: isUnsw ? input.zid.trim().toLowerCase() : "",
    is_ramsoc_member: isUnsw ? input.is_ramsoc_member : false,
    is_arc_member: isUnsw ? input.is_arc_member : false,

    // Shared university fields
    university: isUnsw ? "UNSW" : isOtherUni ? input.university.trim() : "",
    faculty: isUni ? input.faculty.trim() : "",
    degree: isUni ? input.degree.trim() : "",
    majors: isUni ? input.majors.trim() : "",
    degree_stage: isUni ? input.degree_stage : "",
    undergrad_postgrad: isUni ? input.undergrad_postgrad : "",
    domestic_international: isUni ? input.domestic_international : "",
    year_of_study: isUni ? input.year_of_study : "",

    // Other-university-only field
    uni_id: isOtherUni ? input.uni_id.trim() : "",

    // High-school-only field
    high_school: isHighSchool ? input.high_school.trim() : "",

    gender: input.gender,
    gender_other: input.gender === "other" ? input.gender_other.trim() : "",
    heard_from: input.heard_from,
    heard_from_other:
      input.heard_from === "other" ? input.heard_from_other.trim() : "",
    dietary_requirements: input.dietary_requirements.trim(),
  };
}

// ── createProfile ────────────────────────────────────────────────────────────

export async function createProfile(
  input: ProfileInput,
): Promise<{ success: boolean; error?: string }> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Not authenticated" };

  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress;
  if (!email) return { success: false, error: "No email found" };

  const merged: ProfileInput = { ...EMPTY_INPUT, ...input };
  const invalid = validate(merged);
  if (invalid) return { success: false, error: invalid };

  const supabase = getSupabaseSecretClient();

  // clerk_user_id is unique in the schema; check first for a clear message.
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("clerk_user_id", userId)
    .maybeSingle();

  if (existing) return { success: false, error: "Profile already exists" };

  const { error } = await supabase.from("profiles").insert({
    clerk_user_id: userId,
    email,
    ...toRow(merged),
    onboarded: false,
  });

  if (error) {
    // Raced another submit for the same Clerk user.
    if (error.code === "23505") {
      return { success: false, error: "Profile already exists" };
    }
    await logError("profile.createProfile", "Failed to create profile", {
      userId,
      error: error.message,
    });
    return { success: false, error: "Failed to create profile" };
  }

  return { success: true };
}

// ── updateProfile ────────────────────────────────────────────────────────────

/**
 * Patch an existing profile. The supplied fields are merged over the stored
 * record and the result is validated as a whole, so a partial edit cannot
 * produce a profile that would have failed at creation.
 */
export async function updateProfile(
  input: Partial<ProfileInput>,
): Promise<{ success: boolean; error?: string }> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Not authenticated" };

  const supabase = getSupabaseSecretClient();

  const { data: current } = await supabase
    .from("profiles")
    .select("*")
    .eq("clerk_user_id", userId)
    .maybeSingle();

  if (!current) return { success: false, error: "Profile not found" };

  const stored = current as Profile;
  const merged: ProfileInput = {
    ...EMPTY_INPUT,
    full_name: stored.full_name ?? "",
    user_type: stored.user_type ?? EMPTY_INPUT.user_type,
    phone: stored.phone ?? "",
    zid: stored.zid ?? "",
    faculty: stored.faculty ?? "",
    degree: stored.degree ?? "",
    majors: stored.majors ?? "",
    degree_stage: stored.degree_stage ?? "",
    undergrad_postgrad: stored.undergrad_postgrad ?? "",
    domestic_international: stored.domestic_international ?? "",
    year_of_study: stored.year_of_study ?? "",
    is_ramsoc_member: stored.is_ramsoc_member ?? false,
    is_arc_member: stored.is_arc_member ?? false,
    university: stored.university ?? "",
    uni_id: stored.uni_id ?? "",
    high_school: stored.high_school ?? "",
    gender: stored.gender ?? "",
    gender_other: stored.gender_other ?? "",
    heard_from: stored.heard_from ?? "",
    heard_from_other: stored.heard_from_other ?? "",
    dietary_requirements: stored.dietary_requirements ?? "",
    ...input,
  };

  const invalid = validate(merged);
  if (invalid) return { success: false, error: invalid };

  // updated_at is also maintained by the profiles_set_updated_at trigger; set
  // it explicitly so the returned row is right even if the trigger is dropped.
  const { error } = await supabase
    .from("profiles")
    .update({ ...toRow(merged), updated_at: new Date().toISOString() })
    .eq("clerk_user_id", userId);

  if (error) {
    await logError("profile.updateProfile", "Failed to update profile", {
      userId,
      error: error.message,
    });
    return { success: false, error: "Failed to update profile" };
  }

  return { success: true };
}

// ── markOnboarded ────────────────────────────────────────────────────────────

/** Flip the onboarding flag once the entrant has finished the signup flow. */
export async function markOnboarded(): Promise<{
  success: boolean;
  error?: string;
}> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Not authenticated" };

  const supabase = getSupabaseSecretClient();
  const { error } = await supabase
    .from("profiles")
    .update({ onboarded: true, updated_at: new Date().toISOString() })
    .eq("clerk_user_id", userId);

  if (error) {
    await logError("profile.markOnboarded", "Failed to mark onboarded", {
      userId,
      error: error.message,
    });
    return { success: false, error: "Failed to update profile" };
  }

  return { success: true };
}
