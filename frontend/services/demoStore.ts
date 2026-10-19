/**
 * demoStore – STUB (backend-only mode)
 *
 * This module previously hydrated local mock collections for offline use.
 * The app now runs exclusively against the FastAPI backend.
 * These exports are kept as no-ops to avoid breaking any existing imports.
 */

/** No-op: was used to load mock data from AsyncStorage. */
export function hydrateDemo(): Promise<void> {
  return Promise.resolve();
}

/** No-op: was used to persist mock data to AsyncStorage. */
export function persistDemo(): Promise<void> {
  return Promise.resolve();
}
