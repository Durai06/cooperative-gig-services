/** Offline demo repository only. No production endpoints are assumed or simulated as real. */
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  MOCK_BOOKINGS,
  MOCK_COMPLAINTS,
  MOCK_NOTIFICATIONS,
  MOCK_RATINGS,
  MOCK_USERS,
  MOCK_WORKERS,
} from "./mockData";
const KEY = "coopconnect.demo.v2";
const collections = {
  users: MOCK_USERS,
  workers: MOCK_WORKERS,
  bookings: MOCK_BOOKINGS,
  ratings: MOCK_RATINGS,
  complaints: MOCK_COMPLAINTS,
  notifications: MOCK_NOTIFICATIONS,
};
let ready: Promise<void> | undefined;
let writes = Promise.resolve();
export function hydrateDemo(): Promise<void> {
  return (ready ??= (async () => {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    for (const key of Object.keys(
      collections,
    ) as (keyof typeof collections)[]) {
      if (Array.isArray(data[key]))
        (collections[key] as unknown[]).splice(
          0,
          collections[key].length,
          ...data[key],
        );
    }
    for (const w of MOCK_WORKERS)
      w.user = MOCK_USERS.find((u) => u.id === w.userId) ?? w.user;
    for (const b of MOCK_BOOKINGS) {
      b.worker = MOCK_WORKERS.find((w) => w.id === b.workerId);
      b.customer = MOCK_USERS.find((u) => u.id === b.customerId);
    }
  })().catch((error) => {
    ready = undefined;
    throw error;
  }));
}
export function persistDemo(): Promise<void> {
  const json = JSON.stringify(collections);
  const write = writes
    .catch(() => {})
    .then(() => AsyncStorage.setItem(KEY, json));
  writes = write;
  return write;
}
