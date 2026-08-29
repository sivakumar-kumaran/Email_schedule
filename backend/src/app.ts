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

  // 1. Core middlewares
  app.use(
    helmet({
      contentSecurityPolicy: false, // Allow Bull Board UI scripts
    })
  );

  app.use(
    cors({
      origin: [config.FRONTEND_URL, "http://localhost:3000"],
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

  // 2. Passport auth initialization
  configurePassport();
  app.use(passport.initialize());

  // 3. Bull Board Setup for Queue UI at /admin/queues
  app.use("/admin/queues", bullBoardRouter);

  // 4. API Routes (Mounted at both / and /api)
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

  // 5. Health Check
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

  // 6. Global Error Handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error("Unhandled express error:", err);
    res.status(err.status || 500).json({
      error: err.message || "Internal Server Error",
    });
  });

  return app;
}
