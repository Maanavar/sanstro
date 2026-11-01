// Contract for app/api/admin.py: elevation, who-am-I, two-step sign-in (TOTP)
// and admin roles (admin spec L3, D-14, D-15).
//
// The admin console calls these paths through its own fetch so it can attach
// the elevation header; it imports the types and `adminAccessPaths` from here,
// so a route or shape change has one place to land on the client side.

/** Every role defined server-side (app/core/auth.py ADMIN_ROLES). */
export type AdminRole = "owner" | "support" | "ops" | "privacy" | "viewer" | "astrologer";

/** Roles that can be granted today (admin_roles_service.ASSIGNABLE_ROLES). */
export const ASSIGNABLE_ADMIN_ROLES: readonly AdminRole[] = ["owner", "support"];

/**
 * `detail` of the 403 an admin without confirmed two-step sign-in gets from
 * every admin route except `me` and `mfa/*` (ADMIN_MFA_REQUIRED_DETAIL).
 */
export const ADMIN_MFA_REQUIRED = "mfa_required";

/** POST /admin/elevate body: a current TOTP code, or one unused recovery code. */
export interface ElevationRequest {
  code: string;
}

export interface ElevationGrant {
  token: string;
  expires_at: string;
  expires_in_seconds: number;
}

/** GET /admin/me — answers before two-step sign-in is set up, so the console can offer set-up. */
export interface AdminMe {
  user_id: string;
  email: string | null;
  role: AdminRole;
  mfa_enrolled: boolean;
  recovery_codes_remaining: number;
  /** Permission names the role holds (app/core/permissions.py). */
  permissions: string[];
}

/** POST /admin/mfa/enroll — the secret and its otpauth:// URI, for an authenticator app. */
export interface MfaEnrolment {
  secret: string;
  otpauth_uri: string;
}

/** POST /admin/mfa/confirm body. */
export interface MfaCodeRequest {
  code: string;
}

/** Ten single-use codes, shown once: POST /admin/mfa/confirm and /admin/mfa/recovery-codes. */
export interface RecoveryCodes {
  recovery_codes: string[];
}

/** GET /admin/roles row and PUT /admin/users/{id}/role response. */
export interface AdminRoleEntry {
  user_id: string;
  email: string | null;
  role: AdminRole;
  mfa_enrolled: boolean;
}

/** PUT /admin/users/{id}/role body. Owner-only, elevated, reason required. */
export interface RoleChangeRequest {
  role: AdminRole;
  reason: string;
}

export const adminAccessPaths = {
  elevate: "/admin/elevate",
  me: "/admin/me",
  mfaEnroll: "/admin/mfa/enroll",
  mfaConfirm: "/admin/mfa/confirm",
  mfaRecoveryCodes: "/admin/mfa/recovery-codes",
  roles: "/admin/roles",
  role: (userId: string) => `/admin/users/${encodeURIComponent(userId)}/role`,
  revokeRole: (userId: string, reason: string) =>
    `/admin/users/${encodeURIComponent(userId)}/role?reason=${encodeURIComponent(reason)}`,
  resetMfa: (userId: string, reason: string) =>
    `/admin/users/${encodeURIComponent(userId)}/mfa?reason=${encodeURIComponent(reason)}`,
} as const;
