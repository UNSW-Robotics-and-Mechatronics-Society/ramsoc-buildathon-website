export type UserType = "unsw" | "other_uni" | "high_school";

export type Profile = {
  id: string;
  clerk_user_id: string;
  email: string;
  full_name: string;
  phone: string;
  user_type: UserType;

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

  onboarded: boolean;
  created_at: string;
  updated_at: string;
};

/**
 * Buildathon runs a single division, unlike Sumobots there is no
 * standard/open category split. Every team pays the same flat entry fee and
 * has the same 2-6 member limits.
 */
export type Team = {
  id: string;
  name: string;
  join_code: string;
  paid: boolean;
  competition_year: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type TeamMember = {
  id: string;
  team_id: string;
  profile_id: string;
  role: "captain" | "member";
  joined_at: string;
};

export type TeamWithMembers = Team & {
  members: (TeamMember & { profile: Profile })[];
};

export type TeamBrowseItem = {
  name: string;
  member_count: number;
};

export type ProfileWithTeam = Profile & {
  team_name: string | null;
  team_id: string | null;
  team_role: "captain" | "member" | null;
};

export type AdminTeamRow = Team & {
  member_count: number;
  member_names: string[];
};

export type Payment = {
  id: string;
  team_id: string;
  square_payment_id: string;
  amount_cents: number;
  currency: string;
  status: string;
  source: "checkout" | "webhook";
  cardholder_name: string | null;
  billing_postcode: string | null;
  created_at: string;
};
