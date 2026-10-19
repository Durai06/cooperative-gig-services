import type { BookingStatus } from "@/types";
export const VALID_TRANSITIONS: Partial<
  Record<BookingStatus, BookingStatus[]>
> = {
  pending: ["worker_assigned", "cancelled"],
  worker_assigned: ["accepted", "pending", "cancelled"],
  accepted: ["in_progress", "cancelled"],
  in_progress: ["completed"],
};
export function assertTransition(from: BookingStatus, to: BookingStatus) {
  if (!VALID_TRANSITIONS[from]?.includes(to))
    throw new Error(`Cannot transition from ${from} to ${to}.`);
}
