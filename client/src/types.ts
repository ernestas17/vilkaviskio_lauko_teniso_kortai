// Domain models for the single-court reservation system.

export interface Reservation {
  id: number;
  customerName: string;
  customerSurname: string;
  email: string | null;
  phone: string;
  date: string;
  startHour: number;
  endHour: number;
  createdAt: string;
}

// Result of confirming or cancelling a reservation via its email link.
export type ReservationActionStatus =
  | "confirmed" // just booked
  | "already" // was already confirmed
  | "cancelled" // was cancelled (or just cancelled)
  | "conflict" // slot got taken meanwhile
  | "notfound" // bad/expired token
  | "error"; // network/server error

export interface ReservationActionResult {
  status: ReservationActionStatus;
  date?: string;
  startHour?: number;
  endHour?: number;
  customerName?: string;
}

// A booked time slot, as returned by GET /api/reservations (no personal data).
export interface BookedSlot {
  date: string; // ISO datetime at UTC midnight
  startHour: number;
  endHour: number;
}

// Full reservation as seen by the admin (includes personal data + status).
export interface AdminReservation {
  id: number;
  customerName: string;
  customerSurname: string;
  email: string;
  phone: string;
  date: string;
  startHour: number;
  endHour: number;
  confirmed: boolean;
  cancelled: boolean;
  createdAt: string;
}

export interface AdminReservationInput {
  customerName: string;
  customerSurname: string;
  email: string;
  phone: string;
  date: string; // YYYY-MM-DD
  startHour: number;
  endHour: number;
  confirmed: boolean;
  cancelled: boolean;
}

export interface NewReservation {
  customerName: string;
  customerSurname: string;
  email: string;
  phone: string;
  date: string; // YYYY-MM-DD
  startHour: number;
  endHour: number;
}
