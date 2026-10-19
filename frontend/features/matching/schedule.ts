import type { Booking, Worker } from "@/types";
type ScheduleRequest = Pick<Booking, "serviceId" | "latitude" | "longitude"> &
  Partial<Pick<Booking, "preferredDate" | "preferredTime" | "emergency">>;
function minutes(time: string) {
  const match = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return undefined;
  let hours = Number(match[1]);
  if (match[3])
    hours = (hours % 12) + (match[3].toUpperCase() === "PM" ? 12 : 0);
  return hours * 60 + Number(match[2]);
}
export function fitsSchedule(
  worker: Worker,
  booking: ScheduleRequest,
): boolean {
  if (booking.emergency && worker.emergencyAvailable === false) return false;
  if (!booking.preferredDate || !worker.schedule) return true;
  const day = new Date(`${booking.preferredDate}T12:00:00`).toLocaleDateString(
    "en-US",
    { weekday: "long" },
  );
  const shift = worker.schedule.find((s) => s.day === day);
  if (!shift) return true;
  if (!shift.enabled) return false;
  if (!booking.preferredTime) return true;
  const [start, end] = shift.shift.split(/\s*[–—-]\s*/).map(minutes);
  const time = minutes(booking.preferredTime);
  return (
    time === undefined ||
    start === undefined ||
    end === undefined ||
    (time >= start && time < end)
  );
}
