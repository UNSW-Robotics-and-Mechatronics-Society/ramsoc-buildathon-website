"use client";

import { useState } from "react";
import { useClerk } from "@clerk/nextjs";
import type { Profile } from "@/app/_types/registration";
import Card from "@/app/2026/_components/ui/Card";
import { Button } from "@/app/2026/_components/ui/Button";
import EditProfileForm from "./EditProfileForm";

const GENDER_LABELS: Record<string, string> = {
  male: "Male",
  female: "Female",
  "non-binary": "Non-binary",
  "prefer-not-to-say": "Prefer not to say",
  other: "Other",
};

const USER_TYPE_LABELS: Record<string, string> = {
  unsw: "UNSW student",
  other_uni: "University student",
  high_school: "High school student",
};

/** One ruled row of the spec table. Renders nothing when the value is blank. */
function SpecRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-[8rem_1fr] gap-x-3 border-b border-white/10 py-2 last:border-b-0 sm:grid-cols-[10rem_1fr]">
      <dt className="font-blueprint text-ink-dim text-[0.65rem] uppercase">
        {label}
      </dt>
      <dd className="font-main text-ink min-w-0 text-sm break-words">
        {value}
      </dd>
    </div>
  );
}

export default function ProfileTab({
  profile,
  onLogout,
}: {
  profile: Profile;
  onLogout?: () => void;
}) {
  const clerk = useClerk();
  const [editing, setEditing] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  function handleLogout() {
    if (onLogout) {
      onLogout();
    } else {
      clerk.signOut();
    }
  }

  if (editing) {
    return (
      <Card className="bg-blueprint-900/50 p-4 sm:p-5">
        <p className="spec-label">Revision</p>
        <h3 className="mt-1 mb-4 text-lg">Edit profile</h3>
        <EditProfileForm profile={profile} onCancel={() => setEditing(false)} />
      </Card>
    );
  }

  const school =
    profile.user_type === "unsw"
      ? profile.zid
        ? `UNSW (${profile.zid})`
        : "UNSW"
      : profile.user_type === "high_school"
        ? profile.high_school
        : profile.university;

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <Card className="bg-blueprint-900/50 p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="spec-label">Entrant record</p>
            <h3 className="mt-0.5 truncate text-lg">Your profile</h3>
          </div>
          <Button
            variant="secondary"
            onClick={() => setEditing(true)}
            className="shrink-0 px-4"
          >
            Edit
          </Button>
        </div>

        <dl className="border-grid-major border-t pt-1">
          <SpecRow label="Name" value={profile.full_name} />
          <SpecRow label="Email" value={profile.email} />
          <SpecRow
            label="Cohort"
            value={USER_TYPE_LABELS[profile.user_type] ?? ""}
          />
          <SpecRow label="Institution" value={school} />
          <SpecRow label="Uni ID" value={profile.uni_id} />
          <SpecRow label="Degree" value={profile.degree} />
          <SpecRow label="Majors" value={profile.majors} />
          <SpecRow label="Faculty" value={profile.faculty} />
          <SpecRow label="Year" value={profile.year_of_study} />
          <SpecRow label="Degree stage" value={profile.degree_stage} />
          <SpecRow label="Level" value={profile.undergrad_postgrad} />
          <SpecRow
            label="Student type"
            value={profile.domestic_international}
          />
          <SpecRow
            label="Gender"
            value={
              profile.gender === "other" && profile.gender_other
                ? profile.gender_other
                : (GENDER_LABELS[profile.gender] ?? profile.gender)
            }
          />
          {profile.user_type === "unsw" && (
            <>
              <SpecRow
                label="RAMSoc member"
                value={profile.is_ramsoc_member ? "Yes" : "No"}
              />
              <SpecRow
                label="Arc member"
                value={profile.is_arc_member ? "Yes" : "No"}
              />
            </>
          )}
          <SpecRow label="Phone" value={profile.phone} />
          <SpecRow label="Dietary" value={profile.dietary_requirements} />
        </dl>
      </Card>

      <Card className="bg-blueprint-900/50 p-4 sm:p-5">
        {showLogoutConfirm ? (
          <div className="flex flex-col items-center gap-3">
            <p className="font-main text-ink text-sm">
              Log out of your Buildathon account?
            </p>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <Button
                variant="ghost"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </Button>
              <Button variant="secondary" onClick={handleLogout}>
                Log out
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="secondary"
            size="full"
            onClick={() => setShowLogoutConfirm(true)}
          >
            Log out
          </Button>
        )}
      </Card>
    </div>
  );
}
