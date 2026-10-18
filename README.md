# CoopConnect

A genuine React Native application using Expo SDK 53, TypeScript, Expo Router and Lucide icons. The interface follows the supplied multi-screen reference: navy headers, blue actions, green verification badges, pale service cards, compact forms and original offline SVG illustrations.

## Run

```sh
npm ci
npm start
npm run android
npm run web
```

The repository uses npm and `package-lock.json`. Install native packages with `npx expo install`, so Expo chooses compatible versions. Routes live in `src/app`; shared components, tokens, services and matching logic remain outside the route directory.

## Demo accounts

From the welcome screen, continue through onboarding, choose a role, then tap **Use Demo Account** and **Login**. Profiles also contain an explicitly labelled demo role switcher.

| Role          | Email                   |
| ------------- | ----------------------- |
| Customer      | customer@coopconnect.in |
| Worker        | worker@coopconnect.in   |
| Administrator | admin@coopconnect.in    |

This is **offline demo authentication**: any password of six or more characters is accepted for an existing demo account. Registered accounts are stored locally; passwords are not stored or authenticated. Password recovery checks the demo account only and sends no email. Do not enter real credentials.

## Screens and workflows

- Welcome/splash, three-page onboarding, role selection, login, customer registration, worker registration and demo account recovery.
- Customer home, searchable service list, service details, booking form, available workers, confirmation, booking history, status tracking, multi-criterion reviews, complaints with optional photos, complaint history, notifications and editable profile.
- Worker dashboard, job requests, upcoming/active/completed jobs, shared job details, earnings, editable profile and saved availability preferences.
- Administrator dashboard, searchable worker management, individual worker verification, booking management and assignment, complaint investigation/resolution, live analytics and saved cooperative settings.

Booking flow: select a service → enter problem/address/date/time → select a verified available worker → confirm → worker accepts or rejects → accepted job starts → active job completes → customer can review. Rejection releases the booking for reassignment; it does not cancel the customer's booking. Customers can cancel before work starts. Completed jobs cannot be completed or credited twice. Reviews are allowed once per completed booking. Complaints can be submitted from any owned booking, then investigated and resolved by an administrator.

Matching is conventional, deterministic TypeScript: skill and verification checks, availability, rating, experience, proximity, workload and a fairness adjustment. Saved working days, shift times, emergency preferences, travel radius (where coordinates exist), and existing time-slot bookings constrain eligibility. No AI, machine learning, chatbot or external matching API is included. Jobs are treated as one-hour scheduling slots; variable-duration scheduling requires a backend contract.

## Data and integration boundary

No backend server or documented HTTP contract exists in this repository. The service modules under `services/api/` therefore implement a clearly labelled demo repository, rather than pretending to call production endpoints. `services/mockData.ts` supplies seeds; `services/demoStore.ts` hydrates and serializes users, workers, bookings, ratings, complaints and notifications with AsyncStorage. Session tokens use SecureStore on native and localStorage on web. Cooperative settings are saved separately. Optional complaint images are compressed and saved as data URIs for the demo.

A booking's location button requests foreground location only when tapped. Denial leaves manual address entry available. On native it also attempts reverse geocoding. Without coordinates, distance is unknown and no distance claim is displayed. Tracking is booking-status tracking, not continuous GPS tracking. Notifications are local in-app records; no push server, payments, SMS, email or bank transfer is connected. Earnings use the service starting price when work completes.

To connect a real backend, replace the implementations behind the service methods while preserving their typed contracts. Authentication, authorization, transactions, password handling, image uploads, prices and concurrency must then be enforced by the server. An environment variable alone does not activate an API.

## Validation

```sh
npm run ts-check
npm run lint
npm test
npx expo install --check
npx expo export --platform android --output-dir dist/android
npx expo export --platform web --output-dir dist/web
```

The workflow tests execute the actual TypeScript services with an isolated in-memory storage adapter. They cover role restrictions, matching, schedules, booking transitions, rejection, earnings, review uniqueness, complaint resolution, registration/verification, availability and persistence. They never touch a user's saved demo data.

Browser validation is useful for navigation and responsive layout. Before release, test a development build on Android (including Vivo V30) and iOS: safe areas, gesture navigation, keyboard avoidance, scrolling, denied/granted location, photo selection, offline reload and back-button behavior. Native permission and keyboard behavior cannot be certified by browser testing.

# cooperative-gig-services