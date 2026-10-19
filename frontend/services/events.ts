/**
 * events.ts – STUB (backend-only mode)
 *
 * Previously pushed notifications into the in-memory MOCK_NOTIFICATIONS array.
 * Notifications are now managed entirely by the FastAPI backend.
 * This export is kept as a no-op to avoid breaking any remaining call sites.
 */
import type { NotificationType } from "@/types";

export function notify(
  _userId: string,
  _type: NotificationType,
  _title: string,
  _body: string,
  _bookingId?: string,
): void {
  // No-op: backend handles notification creation via its own event system.
}
