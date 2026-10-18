import type { NotificationType } from "@/types";
import { MOCK_NOTIFICATIONS } from "./mockData";
export function notify(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  bookingId?: string,
) {
  MOCK_NOTIFICATIONS.push({
    id: `notification-${Date.now()}-${MOCK_NOTIFICATIONS.length}`,
    userId,
    type,
    title,
    body,
    data: bookingId ? { bookingId } : undefined,
    read: false,
    createdAt: new Date().toISOString(),
  });
}
