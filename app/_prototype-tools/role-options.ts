import type { UserRole } from "@/lib/user-role";
import type { ToolOption } from "./tools";

// Role names as User Management writes them (um-data.ts). A public user has no account, so the
// name says what you see: the signed-out site.
export const ROLE_OPTIONS: Record<UserRole, Omit<ToolOption, "id">> = {
  "biodata-super-admin": { label: "BioData Super Admin", description: "BioData Admin plus Controlled Vocabulary and Voucher Management" },
  "biodata-admin": { label: "BioData Admin" },
  "biodata-user": { label: "BioData User" },
  "privileged-admin": { label: "Privileged Admin" },
  "privileged-user": { label: "Privileged User" },
  "registered-user": { label: "Registered User" },
  "public-user": { label: "Public user", description: "Signed out" },
};

/** A role as the Prototype tools bar names it ("BioData Admin"). */
export const roleLabel = (role: UserRole) => ROLE_OPTIONS[role].label;
