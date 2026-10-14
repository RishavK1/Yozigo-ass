# yozigo - Movie Ticket Booking App

A full-stack movie ticket booking app . One cinema, one screen, 8x10 seat map, zero double bookings.

- **Frontend:** React + TypeScript + Vite + Tailwind CSS
- **Backend:** Node.js + Express + TypeScript
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** Email + password, bcrypt hashing, JWT stored in an httpOnly cookie

---

## 1. Project structure

```
YC/
  backend/     Express + TypeScript API, Prisma schema & migrations, Jest tests
  frontend/    React + TypeScript + Tailwind client
```

Each has its own `package.json`, `.env.example` and README-level setup instructions below.

---

## 2. Prerequisites

- Node.js 18+ (developed on Node 22)
- PostgreSQL 14+ running locally (developed on PostgreSQL 16)
- npm

---

## 3. Database setup

Create a dedicated role and two databases (one for development, one for the automated test suite):

```bash
psql -U postgres -c "CREATE ROLE yozigo WITH LOGIN PASSWORD 'yozigo_dev_pass' CREATEDB;"
psql -U postgres -c "CREATE DATABASE yozigo_db OWNER yozigo;"
psql -U postgres -c "CREATE DATABASE yozigo_test OWNER yozigo;"
```

(Adjust the `-U postgres` superuser name for your local setup. On macOS with Homebrew Postgres, you can usually run `psql -U "$(whoami)" -d postgres` instead.)

---

## 4. Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

`backend/.env` defaults already match the role/database created above:

```
DATABASE_URL="postgresql://yozigo:yozigo_dev_pass@localhost:5432/yozigo_db?schema=public"
JWT_SECRET="replace-this-with-a-long-random-string-in-production"
FRONTEND_URL="http://localhost:5173"
```

Run migrations and seed data:

```bash
npm run prisma:migrate   # creates all tables
npm run prisma:seed      # creates admin + customer test users, sample movies & shows
```

Start the API:

```bash
npm run dev     # http://localhost:4000
```

### Seeded accounts

| Role     | Email                 | Password     |
|----------|------------------------|--------------|
| Admin    | admin@yozigo.com       | Admin@1234   |
| Customer | customer@yozigo.com    | Customer@1234|

### Backend tests

Tests run against a **separate** database (`yozigo_test`, configured in `backend/.env.test`) so they never touch your development data:

```bash
npm test
```

This includes an automated test that proves the no-double-booking guarantee by firing two concurrent hold requests for the same seat and asserting exactly one succeeds (`tests/seats.test.ts`).

---

## 5. Frontend setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev     # http://localhost:5173
```

`frontend/.env` just needs to point at the backend:

```
VITE_API_URL=http://localhost:4000/api
```

Open `http://localhost:5173`, sign up as a new customer (or use the seeded customer account above), and start booking. Log in with the seeded admin account and visit `/admin` to manage movies and shows.

---

## 6. Completed flows

All 7 required flows are implemented and tested:

1. **Sign up / log in** - hashed passwords (bcrypt), JWT in an httpOnly cookie, generic "Incorrect email or password" error, protected routes rejected both on the frontend (redirect to `/login`) and backend (`401` without a valid cookie).
2. **Browse movies and shows** - home page grid, movie detail page with shows grouped by date, past shows excluded, live available seat counts.
3. **Seat map** - 8x10 grid (A-H, 1-10), screen marker, three visual states (available / held / booked), seat map always reloaded from the backend.
4. **Select and hold seats** - up to 6 seats, backend-enforced 5 minute hold with a live countdown, conflicting seats reported by label, automatic expiry releases seats for everyone.
5. **Pay and confirm** - fake payment step with Success/Failure buttons; success creates the booking and marks seats booked; failure keeps the hold alive so the user can retry; paying after expiry is rejected. Double booking is prevented at the database/transaction level (details in section 8) and proven with an automated concurrency test.
6. **My bookings** - upcoming/past sections, booking id/movie/date/time/seats/amount/status, ownership enforced server-side (`404`, not `403`, if you try another user's booking id).
7. **Admin - movies & shows** - admin-only role (never created through public sign-up, only via the seed script), movie CRUD, show creation with an overlap check (start + movie duration vs. every other show), shows with existing bookings cannot be deleted, all admin routes reject non-admins with `403`.

Bonus flows also implemented:

8. **Cancel a booking** - allowed until 2 hours before the show, seats are released immediately, status flips to `CANCELLED`.
9. **Admin - bookings per show** - seats booked / 80, percent full, total revenue, full bookings list per show, and the same seat map customers see with booked seats marked.
10. **Live seat updates** - the seat selection page polls `GET /shows/:id/seats` every 4 seconds (see section 9 for why polling was chosen over WebSockets/SSE).


---

## 7. Database design

PostgreSQL, accessed through Prisma. Six tables:

| Table           | Key columns                                                                 | Notes |
|-----------------|------------------------------------------------------------------------------|-------|
| `users`         | id, name, email (unique), password_hash, role (`CUSTOMER`/`ADMIN`)           | Admins are only created by the seed script. |
| `movies`        | id, title, poster_url, language, duration_minutes, rating, description       | |
| `shows`         | id, movie_id -> movies, start_at, end_at, price                              | `end_at` is pre-computed as `start_at + movie.duration` so overlap checks are a single range comparison. |
| `seats`         | id, show_id -> shows, row_label, seat_number, status, held_by -> users, held_until | One row per seat per show (80 rows created when a show is added). `status` is `AVAILABLE` / `HELD` / `BOOKED`. Unique on `(show_id, row_label, seat_number)`. |
| `bookings`      | id, user_id -> users, show_id -> shows, total_amount, status, cancelled_at   | `status` is `CONFIRMED` / `CANCELLED`. |
| `booking_seats` | id, booking_id -> bookings, seat_id -> seats, row_label, seat_number         | Join table, kept even after cancellation so a booking's seat history is never lost. |

```mermaid
erDiagram
    USERS ||--o{ BOOKINGS : places
    USERS ||--o{ SEATS : holds
    MOVIES ||--o{ SHOWS : has
    SHOWS ||--o{ SEATS : contains
    SHOWS ||--o{ BOOKINGS : for
    BOOKINGS ||--o{ BOOKING_SEATS : includes
    SEATS ||--o{ BOOKING_SEATS : reserved_as
```

---

## 8. How double booking is prevented

This is the single rule the task says matters most, so here is the full reasoning:

1. Every seat for a show is its own row in `seats`, with a `status` column (`AVAILABLE` / `HELD` / `BOOKED`) plus `held_by` / `held_until`.
2. **Holding** and **confirming** a booking both run inside a single Postgres transaction (`prisma.$transaction`) that issues `SELECT ... FOR UPDATE` on the exact seat rows involved **before** checking their status. This takes a row-level lock, so if two requests race for the same seat, Postgres physically serializes them: the second transaction blocks until the first commits, then re-reads the now-updated status and correctly rejects.
3. Only after confirming every requested seat is actually available (or already held by the same user) does the transaction flip their status and commit. If even one seat fails the check, the whole transaction throws and **nothing** is written - no partial holds.
4. A booking is only created once a hold is confirmed with payment, inside the same lock-then-check-then-write pattern, so a hold that is simultaneously expiring (via the background cleanup job) or already converted into a booking can never be double-confirmed.
5. This was deliberately chosen over a bare unique constraint on `booking_seats.seat_id`, because a seat must be able to be booked again after a cancellation (seats are reusable per show across their lifetime) - a hard uniqueness constraint on that join table would make legitimate rebooking after cancellation impossible. The transaction + row lock gives the same race-safety guarantee without that limitation. There is still a unique constraint on `(show_id, row_label, seat_number)` in `seats` to make duplicate seat rows impossible at the schema level.
6. **Proof:** `backend/tests/seats.test.ts` fires two concurrent `POST /shows/:id/hold` requests for the same seat from two different logged-in users (`Promise.all`) and asserts exactly one receives `200` and the other receives `409`, and that the seat ends up held by the winner only.

A lightweight background job (`backend/src/jobs/holdExpiry.job.ts`) also runs every 15 seconds to release any holds whose 5 minute window has passed, independent of whether anyone is actively viewing that show - this keeps the seat map accurate even if nobody triggers a lazy refresh.

---

## 9. Key decisions

- **Express + Prisma + PostgreSQL**: Prisma gives type-safe queries and migrations out of the box, while still allowing raw parameterized SQL (`$queryRaw` with `FOR UPDATE`) exactly where strict row-locking is required for the double-booking guarantee - the best of both worlds for this task.
- **JWT in an httpOnly cookie** rather than `localStorage`, so the token can't be read by injected scripts; `withCredentials` + a CORS allow-list tied to `FRONTEND_URL` keeps this working cross-origin in local dev.
- **Feature-module backend structure** (`src/modules/auth`, `/movies`, `/shows`, `/bookings`, `/admin`, each with `*.schema.ts` / `*.service.ts` / `*.controller.ts` / `*.routes.ts`) keeps validation, business logic and HTTP wiring separate and easy to navigate, and lets the admin routes reuse the same `shows.service.ts` / `movies.service.ts` functions as the public routes instead of duplicating logic.
- **Zod** for request validation on the backend and form validation on the frontend (via `react-hook-form` + `@hookform/resolvers/zod`) - one schema style, consistent error shapes end to end.
- **TanStack Query** on the frontend for all server state (movies, seat maps, bookings, admin data) instead of a global store - it gives caching, polling (`refetchInterval`) and mutation state (loading/error) for free, which is most of what this app needs.
- **Polling over WebSockets/SSE** for live seat updates: the seat map is polled every 4 seconds while a show page is open. For a single-screen cinema with at most a handful of concurrent viewers per show, this is simpler to build, test and reason about than a socket/connection-management layer, while still meeting the "a few seconds" bar in the bonus requirement. The actual booking correctness never depends on this polling - it is purely a UI freshness feature, the transaction + row lock described above is what prevents double booking.
- **Lazy + active hold expiry**: holds are treated as expired the instant their `held_until` passes (both when reading the seat map and inside the locking transaction), with a periodic background sweep as a backstop so the database stays consistent even without user activity.

---

## 10. API overview

All endpoints are prefixed with `/api`.

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/signup` | - | Create a customer account |
| POST | `/auth/login` | - | Log in |
| POST | `/auth/logout` | - | Clear the session cookie |
| GET | `/auth/me` | customer | Current user |
| GET | `/movies` | - | List movies |
| GET | `/movies/:id` | - | Movie detail + upcoming shows grouped by date |
| GET | `/shows/:id/seats` | - | Seat map for a show |
| GET | `/shows/:id/hold` | customer | Current user's active hold, if any |
| POST | `/shows/:id/hold` | customer | Hold 1-6 seats for 5 minutes |
| POST | `/shows/:id/book` | customer | Simulated payment (`success`/`failure`) |
| GET | `/bookings` | customer | My bookings (upcoming/past) |
| GET | `/bookings/:id` | customer | One of my bookings |
| POST | `/bookings/:id/cancel` | customer | Cancel (outside the 2 hour cutoff) |
| GET/POST/PUT/DELETE | `/admin/movies` | admin | Movie CRUD |
| GET/POST/DELETE | `/admin/shows` | admin | Show scheduling, with overlap checks |
| GET | `/admin/shows/:id/stats` | admin | Occupancy + revenue |
| GET | `/admin/shows/:id/bookings` | admin | Bookings for a show |
| GET | `/admin/shows/:id/seats` | admin | Seat map with booked seats marked |

---

