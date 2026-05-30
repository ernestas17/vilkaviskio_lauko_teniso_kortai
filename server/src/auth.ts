import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma.js";

const COOKIE_NAME = "admin_token";
const TOKEN_TTL = "7d";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

function getSecret(): string {
  return process.env.JWT_SECRET ?? "dev-insecure-secret-change-me";
}

export interface AdminPayload {
  sub: string; // admin email
  role: "admin";
}

// Verifies credentials against the Admin table. Returns the admin's stored
// email on success, or null on failure.
export async function verifyCredentials(
  email: string,
  password: string,
): Promise<string | null> {
  const admin = await prisma.admin.findUnique({
    where: { email: email.trim().toLowerCase() },
  });
  if (!admin) return null;
  const ok = await bcrypt.compare(password, admin.password);
  return ok ? admin.email : null;
}

// Signs a JWT and sets it as an httpOnly cookie on the response.
export function issueAdminCookie(res: Response, email: string): void {
  const token = jwt.sign({ role: "admin" } satisfies Omit<AdminPayload, "sub">, getSecret(), {
    subject: email,
    expiresIn: TOKEN_TTL,
  });
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

export function clearAdminCookie(res: Response): void {
  res.clearCookie(COOKIE_NAME, { path: "/" });
}

// Express middleware: allow only requests carrying a valid admin JWT cookie.
export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) {
    res.status(401).json({ error: "Neautorizuota" });
    return;
  }
  try {
    const payload = jwt.verify(token, getSecret()) as AdminPayload;
    if (payload.role !== "admin") {
      res.status(401).json({ error: "Neautorizuota" });
      return;
    }
    res.locals.adminEmail = payload.sub;
    next();
  } catch {
    res.status(401).json({ error: "Neautorizuota" });
  }
}
