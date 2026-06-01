import express, {
  type ErrorRequestHandler,
  type Express,
  type Request,
  type Response,
} from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import reservationsRouter from "./routes/reservations.js";
import adminRouter from "./routes/admin.js";

// Origins allowed to make credentialed (cookie) requests. Includes the prod
// client, local dev/preview, plus anything from CLIENT_BASE_URL / CORS_ORIGINS.
const allowedOrigins = new Set(
  [
    process.env.CLIENT_BASE_URL,
    ...(process.env.CORS_ORIGINS?.split(",") ?? []),
    "https://vilkaviskiolaukotenisokortai.lt",
    "http://localhost:5173",
    "http://localhost:4173",
  ]
    .map((o) => o?.trim())
    .filter((o): o is string => Boolean(o)),
);

export function createApp(): Express {
  const app = express();

  app.use(
    cors({
      origin(
        origin: string | undefined,
        callback: (err: Error | null, allow?: boolean) => void,
      ) {
        // Allow non-browser clients (no Origin) and allowlisted origins.
        if (!origin || allowedOrigins.has(origin)) callback(null, true);
        else callback(null, false);
      },
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(cookieParser());

  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "ok" });
  });

  app.use("/api/reservations", reservationsRouter);
  app.use("/api/admin", adminRouter);

  // Fallback 404 for unknown API routes.
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: "Not found" });
  });

  // Centralized error handler.
  const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message || "Server error" });
  };
  app.use(errorHandler);

  return app;
}
