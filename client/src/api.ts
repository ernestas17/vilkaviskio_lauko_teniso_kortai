// Thin wrapper around the reservation API.
//
// In production set VITE_API_URL to the deployed API base (e.g.
// "https://white-ostrich-337999.hostingersite.com/api") so calls go straight to
// the backend. In development it falls back to "/api", which the Vite dev proxy
// forwards to the Express server (see vite.config.ts).

import type {
  AdminReservation,
  AdminReservationInput,
  BookedSlot,
  NewReservation,
  ReservationActionResult,
} from "./types";

const BASE = (import.meta.env.VITE_API_URL ?? "/api").replace(/\/$/, "");

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return (res.status === 204 ? null : await res.json()) as T;
}

export const api = {
  getBookedSlots: () => request<BookedSlot[]>("/reservations"),
  // Creates a pending reservation; the server emails a confirmation link.
  createReservation: (data: NewReservation) =>
    request<{ message: string }>("/reservations", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  // Confirms (books) a reservation from its email-link token.
  confirmReservation: (token: string) => tokenAction("confirm", token),
  // Cancels a reservation from its email-link token (works any time).
  cancelReservation: (token: string) => tokenAction("cancel", token),
};

// Calls a token action endpoint. Reads the JSON result for any HTTP status, so
// callers branch on `status` rather than throw.
async function tokenAction(
  action: "confirm" | "cancel",
  token: string,
): Promise<ReservationActionResult> {
  const res = await fetch(
    `${BASE}/reservations/${action}/${encodeURIComponent(token)}`,
    { method: "POST" },
  );
  const body = (await res.json().catch(() => ({}))) as ReservationActionResult;
  return body.status ? body : { status: "error" };
}

// Admin endpoints — authenticated via an httpOnly cookie, so requests must send
// credentials. Errors carry the HTTP status so callers can detect 401.
class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function adminRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${BASE}/admin${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new HttpError(res.status, body.error || `Request failed: ${res.status}`);
  }
  return (res.status === 204 ? null : await res.json()) as T;
}

export const adminApi = {
  login: (email: string, password: string) =>
    adminRequest<{ email: string }>("/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  logout: () => adminRequest<null>("/logout", { method: "POST" }),
  me: () => adminRequest<{ email: string }>("/me"),
  list: () => adminRequest<AdminReservation[]>("/reservations"),
  create: (data: AdminReservationInput) =>
    adminRequest<AdminReservation>("/reservations", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: number, data: Partial<AdminReservationInput>) =>
    adminRequest<AdminReservation>(`/reservations/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  remove: (id: number) =>
    adminRequest<null>(`/reservations/${id}`, { method: "DELETE" }),
};

export { HttpError };
