import type { User } from "@/types";

export const TOKEN_KEY = "coopconnect_token";
export const USER_KEY = "coopconnect_user";

let current: User | null = null;
let currentToken: string | null = null;

export function setSessionUser(user: User | null) {
  current = user;
}

export function sessionUser(): User | null {
  return current;
}

export function setSessionToken(token: string | null) {
  currentToken = token;
}

export function getSessionToken(): string | null {
  return currentToken;
}

export function requireRole(...roles: User["role"][]): User {
  if (!current || !roles.includes(current.role))
    throw new Error("You do not have access to this action.");
  return current;
}
