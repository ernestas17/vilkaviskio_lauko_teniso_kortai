# Vilkaviškio lauko teniso kortų rezervacijos sistema

Online booking system for the single public outdoor tennis court in Vilkaviškis.
Visitors reserve a 2‑hour slot and **confirm or cancel by email link**; an admin
manages all reservations from a protected dashboard.

- **server/** — Express REST API (TypeScript) with Prisma 7 (MySQL via the
  MariaDB driver adapter), Nodemailer email, and JWT cookie admin auth.
- **client/** — React + TypeScript SPA (Vite, React Router, Tailwind CSS v4,
  shadcn/ui).

## Features

- **Multi‑step booking wizard** — pick a day + time slot, then enter contact
  details. Only the current month is selectable; past and fully‑booked days are
  disabled.
- **Double opt‑in by email** — booking creates a _pending_ reservation and emails
  a confirmation link. The slot is only booked once the link is clicked, which
  then sends a "reservation confirmed" email. Every email also carries a
  **cancel** link that works any time.
- **Availability** — the calendar greys out fully‑booked days and the time
  dropdown disables taken slots; the server rejects overlapping confirmed slots.
- **Per‑email limits** — max **2 reservations per week** (Mon–Sun) and **1 per
  day** (pending + confirmed count; cancelled don't).
- **Admin dashboard** — JWT (httpOnly cookie) login; view all reservations
  (newest first), search by client/email/phone, filter by date, paginate, edit a
  reservation's confirmed/cancelled status, and delete.

## Prerequisites

- Node.js 20.11+ (Node 22 recommended)
- An SMTP account for sending email (any provider)

## Server

```bash
cd server
npm install
cp .env.example .env        # then edit values (see below) — or create .env
npx prisma migrate deploy   # apply migrations (create the tables) on the MySQL DB
npm run admin:create        # create the admin account from ADMIN_EMAIL/ADMIN_PASSWORD
npm run seed                # (optional) add a couple of sample reservations
npm run dev                 # http://localhost:4000  (tsx watch — no build step)
```

Use `prisma migrate deploy` against the hosted MySQL database. `npm run
prisma:migrate` (`prisma migrate dev`) is for local development only — it needs
shadow‑database privileges that shared MySQL hosts usually don't grant.

Other scripts: `npm run build` (compile TS → `dist/`), `npm start` (run the
compiled output), `npm run typecheck`, `npm run prisma:studio`.

### Environment (`server/.env`)

| Variable              | Purpose                                                             |
| --------------------- | ------------------------------------------------------------------- |
| `PORT`                | API port (default 4000)                                             |
| `DATABASE_URL`        | MySQL connection string, e.g. `mysql://user:pass@host:3306/db` (URL-encode special chars in the password) |
| `CLIENT_BASE_URL`     | Public URL of the client app; used to build email confirm/cancel links |
| `SMTP_HOST/PORT/USER/PASS` | SMTP server (port 465 = implicit TLS, otherwise STARTTLS)      |
| `MAIL_FROM`           | "From" header, e.g. `Vilkaviškio lauko teniso kortai <no-reply@…>`  |
| `ADMIN_EMAIL`         | Admin login email (used by `npm run admin:create`)                  |
| `ADMIN_PASSWORD`      | Admin plaintext password — hashed at seeding time                   |
| `JWT_SECRET`          | Secret for signing admin session cookies                            |

> `ADMIN_EMAIL`/`ADMIN_PASSWORD` are only read by `npm run admin:create`, which
> upserts a row in the `Admin` table. The app authenticates against that table.

### Public API

| Method | Path                                  | Description                                                        |
| ------ | ------------------------------------- | ----------------------------------------------------------------- |
| GET    | `/api/health`                         | Health check                                                      |
| GET    | `/api/reservations`                   | Confirmed, future booked slots only (`date`, `startHour`, `endHour`) — no personal data |
| POST   | `/api/reservations`                   | Create a **pending** reservation and email a confirm/cancel link  |
| POST   | `/api/reservations/confirm/:token`    | Confirm (book) the reservation; emails a confirmation             |
| POST   | `/api/reservations/cancel/:token`     | Cancel the reservation (any time)                                 |

### Admin API (JWT httpOnly cookie required, except login)

| Method | Path                              | Description                          |
| ------ | --------------------------------- | ------------------------------------ |
| POST   | `/api/admin/login`                | Email + password → sets session cookie |
| POST   | `/api/admin/logout`               | Clear the session cookie             |
| GET    | `/api/admin/me`                   | Current admin (auth check)           |
| GET    | `/api/admin/reservations`         | All reservations (newest first)      |
| POST   | `/api/admin/reservations`         | Create (confirmed; no email)         |
| PATCH  | `/api/admin/reservations/:id`     | Update a reservation                 |
| DELETE | `/api/admin/reservations/:id`     | Delete a reservation                 |

## Client

```bash
cd client
npm install
npm run dev              # http://localhost:5173
npm run build            # type-check + production build into dist/
npm run preview          # serve the production build
```

The Vite dev server proxies `/api/*` to the Express server on port 4000.

### Routes

- `/` — booking wizard
- `/confirm/:token` — confirmation result page (opened from the email link)
- `/cancel/:token` — cancellation result page (opened from the email link)
- `/admin/login` — admin login
- `/admin` — admin dashboard (redirects to login when the session is missing)

## Data model (Prisma)

- **Reservation** — `customerName`, `customerSurname`, `email`, `phone`, `date`,
  `startHour`, `endHour`, `confirmed`, `cancelled`, unique `token` (used in the
  confirm/cancel links), `createdAt`.
- **Admin** — unique `email`, bcrypt‑hashed `password`, `createdAt`.

Time slots are fixed 2‑hour blocks from 08:00 to 22:00.

## Notes & production

- The **current‑month‑only** booking restriction is enforced in the client
  calendar; the API does not validate the month.
- Email sending is **best‑effort** on confirm/cancel, but a booking is rolled
  back if the initial confirmation email can't be sent.
- For production set `CLIENT_BASE_URL` to the real frontend domain, serve over
  HTTPS, run with `NODE_ENV=production` (so the session cookie is `Secure`), and
  ensure the client's `/api` reaches the API (same origin or a reverse proxy).

## Switching to PostgreSQL

In `server/prisma/schema.prisma` change the datasource `provider` to
`"postgresql"`, set `DATABASE_URL` to your connection string, swap the Prisma
driver adapter in `server/src/prisma.ts` for the Postgres adapter, then re‑run
`npm run prisma:migrate`.
