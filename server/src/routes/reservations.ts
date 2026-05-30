import { Router, type Request, type Response, type NextFunction } from "express";
import { randomUUID } from "node:crypto";
import { prisma } from "../prisma.js";
import { sendConfirmationRequest, sendReservationConfirmed } from "../mail.js";

const router = Router();

interface CreateReservationBody {
  customerName?: string;
  customerSurname?: string;
  email?: string;
  phone?: string;
  date?: string;
  startHour?: number | string;
  endHour?: number | string;
}

// Per-email booking limits.
const MAX_PER_WEEK = 2;
const MAX_PER_DAY = 1;

// Monday–Sunday week containing `day` (UTC), as a [start, endExclusive) range.
function weekRange(day: Date): { start: Date; end: Date } {
  const start = new Date(day);
  const mondayOffset = (start.getUTCDay() + 6) % 7; // 0=Mon … 6=Sun
  start.setUTCDate(start.getUTCDate() - mondayOffset);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 7);
  return { start, end };
}

// GET /api/reservations — confirmed booked slots only (no personal data), so the
// client can mark reserved dates / times as unavailable in the calendar.
router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const booked = await prisma.reservation.findMany({
      where: { confirmed: true, cancelled: false, date: { gte: today } },
      select: { date: true, startHour: true, endHour: true },
      orderBy: [{ date: "asc" }, { startHour: "asc" }],
    });
    res.json(booked);
  } catch (err) {
    next(err);
  }
});

// POST /api/reservations — create a PENDING reservation and email a confirmation
// link. The slot is only actually booked once that link is clicked.
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      customerName,
      customerSurname,
      email,
      phone,
      date,
      startHour,
      endHour,
    } = req.body as CreateReservationBody;

    if (
      !customerName ||
      !customerSurname ||
      !email ||
      !phone ||
      !date ||
      startHour == null ||
      endHour == null
    ) {
      return res.status(400).json({
        error:
          "customerName, customerSurname, email, phone, date, startHour and endHour are required",
      });
    }

    const start = Number(startHour);
    const end = Number(endHour);

    if (
      !Number.isInteger(start) ||
      !Number.isInteger(end) ||
      start < 0 ||
      end > 24
    ) {
      return res
        .status(400)
        .json({ error: "startHour and endHour must be whole hours between 0 and 24" });
    }
    if (end <= start) {
      return res.status(400).json({ error: "endHour must be after startHour" });
    }

    const day = new Date(date);
    if (Number.isNaN(day.getTime())) {
      return res.status(400).json({ error: "Invalid date" });
    }
    // Normalize to the start of the day so reservations are matched by calendar day.
    day.setUTCHours(0, 0, 0, 0);

    // Reject only if a CONFIRMED, non-cancelled reservation overlaps this slot.
    const overlap = await prisma.reservation.findFirst({
      where: {
        confirmed: true,
        cancelled: false,
        date: day,
        startHour: { lt: end },
        endHour: { gt: start },
      },
    });
    if (overlap) {
      return res.status(409).json({ error: "Time slot already booked" });
    }

    // Per-email limits (pending + confirmed reservations count; cancelled don't).
    const sameDayCount = await prisma.reservation.count({
      where: { email, cancelled: false, date: day },
    });
    if (sameDayCount >= MAX_PER_DAY) {
      return res.status(409).json({
        error:
          "Su šiuo el. paštu tą pačią dieną galima rezervuoti tik vieną kartą.",
      });
    }

    const { start: weekStart, end: weekEnd } = weekRange(day);
    const weekCount = await prisma.reservation.count({
      where: {
        email,
        cancelled: false,
        date: { gte: weekStart, lt: weekEnd },
      },
    });
    if (weekCount >= MAX_PER_WEEK) {
      return res.status(409).json({
        error:
          "Su šiuo el. paštu per savaitę galima rezervuoti ne daugiau kaip 2 kartus.",
      });
    }

    const token = randomUUID();
    const reservation = await prisma.reservation.create({
      data: {
        customerName,
        customerSurname,
        email,
        phone,
        date: day,
        startHour: start,
        endHour: end,
        token,
      },
    });

    // Links point to the client app's pages (not server routes).
    const base = process.env.CLIENT_BASE_URL ?? "http://localhost:5173";
    const confirmUrl = `${base}/confirm/${token}`;
    const cancelUrl = `${base}/cancel/${token}`;

    try {
      await sendConfirmationRequest({
        to: email,
        customerName,
        customerSurname,
        date: day,
        startHour: start,
        endHour: end,
        confirmUrl,
        cancelUrl,
      });
    } catch (mailErr) {
      console.error("Failed to send confirmation email:", mailErr);
      // Without the email the user can't confirm, so roll the pending row back.
      await prisma.reservation.delete({ where: { id: reservation.id } }).catch(() => {});
      return res.status(502).json({
        error: "Nepavyko išsiųsti patvirtinimo el. laiško. Bandykite vėliau.",
      });
    }

    res.status(201).json({
      message: "Patvirtinimo nuoroda išsiųsta el. paštu.",
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/reservations/confirm/:token — called by the client confirmation
// page (linked from the email). Books the slot and returns a JSON result.
router.post(
  "/confirm/:token",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = req.params;
      const reservation = await prisma.reservation.findUnique({
        where: { token },
      });

      if (!reservation) {
        return res.status(404).json({ status: "notfound" });
      }

      const details = {
        date: reservation.date,
        startHour: reservation.startHour,
        endHour: reservation.endHour,
        customerName: reservation.customerName,
      };

      if (reservation.cancelled) {
        return res.status(409).json({ status: "cancelled", ...details });
      }
      if (reservation.confirmed) {
        return res.status(200).json({ status: "already", ...details });
      }

      // Make sure nobody confirmed an overlapping slot in the meantime.
      const clash = await prisma.reservation.findFirst({
        where: {
          confirmed: true,
          cancelled: false,
          id: { not: reservation.id },
          date: reservation.date,
          startHour: { lt: reservation.endHour },
          endHour: { gt: reservation.startHour },
        },
      });
      if (clash) {
        return res.status(409).json({ status: "conflict", ...details });
      }

      await prisma.reservation.update({
        where: { id: reservation.id },
        data: { confirmed: true },
      });

      // Send a "reservation confirmed" email (best-effort).
      try {
        const base = process.env.CLIENT_BASE_URL ?? "http://localhost:5173";
        await sendReservationConfirmed({
          to: reservation.email,
          customerName: reservation.customerName,
          customerSurname: reservation.customerSurname,
          date: reservation.date,
          startHour: reservation.startHour,
          endHour: reservation.endHour,
          cancelUrl: `${base}/cancel/${reservation.token}`,
        });
      } catch (mailErr) {
        console.error("Failed to send confirmed email:", mailErr);
      }

      return res.status(200).json({ status: "confirmed", ...details });
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/reservations/cancel/:token — called by the client cancel page
// (linked from the email). Works any time, for pending or confirmed bookings.
router.post(
  "/cancel/:token",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = req.params;
      const reservation = await prisma.reservation.findUnique({
        where: { token },
      });

      if (!reservation) {
        return res.status(404).json({ status: "notfound" });
      }

      const details = {
        date: reservation.date,
        startHour: reservation.startHour,
        endHour: reservation.endHour,
        customerName: reservation.customerName,
      };

      // Idempotent: already cancelled returns the same "cancelled" result.
      if (!reservation.cancelled) {
        await prisma.reservation.update({
          where: { id: reservation.id },
          data: { cancelled: true },
        });
      }

      return res.status(200).json({ status: "cancelled", ...details });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
