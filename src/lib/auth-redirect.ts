export const AUTH_ROLE_KEY = "zdt-auth-role";
export const AUTH_NEXT_KEY = "zdt-auth-next";

export type AuthRole = "tutor" | "parent";

export function parseRole(value: string | null): AuthRole {
  return value === "tutor" ? "tutor" : "parent";
}

/** Only same-site paths. Rejects protocol-relative and backslash URLs. */
export function safeNext(value: string | null): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return null;
  }
  return value;
}

export function destinationFor(role: AuthRole, next: string | null): string {
  return safeNext(next) ?? (role === "tutor" ? "/profile" : "/tutors");
}
