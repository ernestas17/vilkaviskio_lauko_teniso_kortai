import { Router, type Request, type Response, type NextFunction } from "express";
import { randomUUID } from "node:crypto";
import { prisma } from "../prisma.js";
import {
  clearAdminCookie,
  issueAdminCookie,
  requireAdmin,
  verifyCredentials,
} from "../auth.js";

const router = Router();

interface ReservationBody {
  customerName?: string;
  customerSurname?: string;
  email?: string;
  phone?: string;
  date?: string;
  startHour?: number | string;
  endHour?: number | string;
  confirmed?: boolean;
  cancelled?: boolean;
}

interface ParsedReservation {
  customerName: string;
  customerSurname: string;
  email: string;
  phone: string;
  date: Date;
  startHour: number;
  endHour: number;
  confirmed: boolean;
  cancelled: boolean;
}

// Validates and normalizes a reservation payload. Returns an error string or the
// parsed fields.
function parseReservation(
  body: ReservationBody,
): { error: string } | { data: ParsedReservation } {
  const { customerName, customerSurname, email, phone, date, startHour, endHour } =
    body;

  if (
    !customerName ||
    !customerSurname ||
    !email ||
    !phone ||
    !date ||
    startHour == null ||
    endHour == null
  ) {
    return {
      error:
        "customerName, customerSurname, email, phone, date, startHour ir endHour yra privalomi",
    };
  }

  const start = Number(startHour);
  const end = Number(endHour);
  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end > 24) {
    return { error: "startHour ir endHour turi būti sveiki skaičiai (0–24)" };
  }
  if (end <= start) {
    return { error: "endHour turi būti vėlesnis už startHour" };
  }

  const day = new Date(date);
  if (Number.isNaN(day.getTime())) {
    return { error: "Neteisinga data" };
  }
  day.setUTCHours(0, 0, 0, 0);

  return {
    data: {
      customerName,
      customerSurname,
      email,
      phone,
      date: day,
      startHour: start,
      endHour: end,
      confirmed: body.confirmed ?? true,
      cancelled: body.cancelled ?? false,
    },
  };
}

// Returns true if an active (confirmed, not cancelled) reservation overlaps the
// given slot. `excludeId` skips the row being updated.
async function hasOverlap(
  data: ParsedReservation,
  excludeId?: number,
): Promise<boolean> {
  if (!data.confirmed || data.cancelled) return false;
  const clash = await prisma.reservation.findFirst({
    where: {
      confirmed: true,
      cancelled: false,
      date: data.date,
      startHour: { lt: data.endHour },
      endHour: { gt: data.startHour },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });
  return clash != null;
}

// --- Auth ---

// POST /api/admin/login
router.post("/login", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      return res.status(400).json({ error: "El. paštas ir slaptažodis privalomi" });
    }
    const adminEmail = await verifyCredentials(email, password);
    if (!adminEmail) {
      return res.status(401).json({ error: "Neteisingas el. paštas arba slaptažodis" });
    }
    issueAdminCookie(res, adminEmail);
    res.json({ email: adminEmail });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/logout
router.post("/logout", (_req: Request, res: Response) => {
  clearAdminCookie(res);
  res.status(204).end();
});

// GET /api/admin/me — current admin (used by the client to check auth state)
router.get("/me", requireAdmin, (_req: Request, res: Response) => {
  res.json({ email: res.locals.adminEmail });
});

// --- Reservations CRUD (all protected) ---

// GET /api/admin/reservations — full list with all details
router.get(
  "/reservations",
  requireAdmin,
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const reservations = await prisma.reservation.findMany({
        orderBy: { createdAt: "desc" }, // newest reservations first
      });
      res.json(reservations);
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/admin/reservations — create (confirmed by default, no email sent)
router.post(
  "/reservations",
  requireAdmin,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = parseReservation(req.body as ReservationBody);
      if ("error" in parsed) {
        return res.status(400).json({ error: parsed.error });
      }
      if (await hasOverlap(parsed.data)) {
        return res.status(409).json({ error: "Šis laikas jau užimtas" });
      }
      const reservation = await prisma.reservation.create({
        data: { ...parsed.data, token: randomUUID() },
      });
      res.status(201).json(reservation);
    } catch (err) {
      next(err);
    }
  },
);

// PATCH /api/admin/reservations/:id — update
router.patch(
  "/reservations/:id",
  requireAdmin,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params.id);
      const existing = await prisma.reservation.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ error: "Rezervacija nerasta" });
      }

      const body = req.body as ReservationBody;
      // Merge incoming fields over the existing row, then validate the result.
      const parsed = parseReservation({
        customerName: body.customerName ?? existing.customerName,
        customerSurname: body.customerSurname ?? existing.customerSurname,
        email: body.email ?? existing.email,
        phone: body.phone ?? existing.phone,
        date: body.date ?? existing.date.toISOString(),
        startHour: body.startHour ?? existing.startHour,
        endHour: body.endHour ?? existing.endHour,
        confirmed: body.confirmed ?? existing.confirmed,
        cancelled: body.cancelled ?? existing.cancelled,
      });
      if ("error" in parsed) {
        return res.status(400).json({ error: parsed.error });
      }
      if (await hasOverlap(parsed.data, id)) {
        return res.status(409).json({ error: "Šis laikas jau užimtas" });
      }

      const reservation = await prisma.reservation.update({
        where: { id },
        data: parsed.data,
      });
      res.json(reservation);
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /api/admin/reservations/:id
router.delete(
  "/reservations/:id",
  requireAdmin,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await prisma.reservation.delete({ where: { id: Number(req.params.id) } });
      res.status(204).end();
    } catch (err) {
      if ((err as { code?: string }).code === "P2025") {
        return res.status(404).json({ error: "Rezervacija nerasta" });
      }
      next(err);
    }
  },
);

export default router;
