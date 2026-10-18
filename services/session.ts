import type { User } from "@/types";
let current: User | null = null;
export function setSessionUser(user: User | null) {
  current = user;
}
export function sessionUser() {
  return current;
}
export function requireRole(...roles: User["role"][]) {
  if (!current || !roles.includes(current.role))
    throw new Error("You do not have access to this action.");
  return current;
}
