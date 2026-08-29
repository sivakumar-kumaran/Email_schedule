import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import passport from "passport";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";

import { config } from "./config";
import { configurePassport } from "./auth/google.strategy";
import { bullBoardRouter } from "./queues/bullBoard";
import authRoutes from "./routes/auth.routes";
import emailRoutes from "./routes/email.routes";
import slackRoutes from "./routes/slack.routes";
import senderRoutes from "./routes/sender.routes";
import queueRoutes from "./routes/queue.routes";
import { prisma } from "./db/prisma";
import { redisConnection } from "./queues/connection";

export function createApp(): Express {
  const app = express();

  // Trust reverse proxy headers (Render, Railway, Vercel, Heroku) for HTTPS & Host detection
  app.set("trust proxy", 1);

  app.use(
    helmet({
      contentSecurityPolicy: false,
    })
  );

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (curl, postman) or any frontend origin
        callback(null, true);
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  if (config.NODE_ENV !== "test") {
    app.use(morgan("dev"));
  }

  configurePassport();
  app.use(passport.initialize());

  // Mount Queue Administration Dashboard
  app.use("/admin/queues", bullBoardRouter);

  // API Routes
  app.use("/auth", authRoutes);
  app.use("/api/auth", authRoutes);
  app.use("/emails", emailRoutes);
  app.use("/api/emails", emailRoutes);
  app.use("/slack", slackRoutes);
  app.use("/api/slack", slackRoutes);
  app.use("/senders", senderRoutes);
  app.use("/api/senders", senderRoutes);
  app.use("/queue", queueRoutes);
  app.use("/api/queue", queueRoutes);

  // Health Endpoint
  app.get("/health", async (_req: Request, res: Response) => {
    let dbStatus = "ok";
    const redisStatus = redisConnection.status === "ready" ? "ok" : redisConnection.status;

    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = "error";
    }

    const healthy = dbStatus === "ok";
    res.status(healthy ? 200 : 503).json({
      status: healthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus,
        redis: redisStatus,
      },
      limits: {
        maxEmailsPerHour: config.MAX_EMAILS_PER_HOUR,
        minDelayMs: config.MIN_DELAY_MS,
        workerConcurrency: config.WORKER_CONCURRENCY,
      },
    });
  });

  // Global Error Handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error("Unhandled express error:", err);
    res.status(err.status || 500).json({
      error: err.message || "Internal Server Error",
    });
  });

  return app;
}
