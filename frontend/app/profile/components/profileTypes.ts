export type ProfileType = "BUSINESS_OWNER" | "POLICY_ANALYST" | "STUDENT";

export const PROFILE_TYPES: { value: ProfileType; label: string }[] = [
  { value: "BUSINESS_OWNER", label: "Business Owner" },
  { value: "POLICY_ANALYST", label: "Policy Analyst" },
  { value: "STUDENT", label: "Student" },
];

export const PROFILE_TYPE_LABELS: Record<ProfileType, string> = {
  BUSINESS_OWNER: "Business Owner",
  POLICY_ANALYST: "Policy Analyst",
  STUDENT: "Student",
};
