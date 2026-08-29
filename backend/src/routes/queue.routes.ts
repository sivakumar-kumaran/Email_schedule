import { Router, Request, Response } from "express";
import { emailQueue, QUEUE_NAME } from "../queues/emailQueue";
import { config } from "../config";
import { requireAuth } from "../auth/jwt.middleware";
import { prisma, EmailStatus } from "../db/prisma";
import { redisConnection } from "../queues/connection";

const router = Router();

// GET /api/queue/stats - Get comprehensive live BullMQ queue stats
router.get("/stats", requireAuth, async (_req: Request, res: Response) => {
  try {
    let counts = {
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
      paused: 0,
    };
    let isPaused = false;
    let redisReady = redisConnection.status === "ready";

    if (redisReady) {
      try {
        const rawCounts = await emailQueue.getJobCounts(
          "waiting",
          "active",
          "completed",
          "failed",
          "delayed",
          "paused"
        );
        counts = {
          waiting: rawCounts.waiting || 0,
          active: rawCounts.active || 0,
          completed: rawCounts.completed || 0,
          failed: rawCounts.failed || 0,
          delayed: rawCounts.delayed || 0,
          paused: rawCounts.paused || 0,
        };
        isPaused = await emailQueue.isPaused();
      } catch (err: any) {
        console.warn("Could not fetch real-time BullMQ job counts from Redis:", err.message);
      }
    }

    // Fallback/Augment with PostgreSQL database records
    const [dbScheduled, dbSent, dbFailed, dbPending] = await Promise.all([
      prisma.email.count({ where: { status: EmailStatus.SCHEDULED } }),
      prisma.email.count({ where: { status: EmailStatus.SENT } }),
      prisma.email.count({ where: { status: EmailStatus.FAILED } }),
      prisma.email.count({ where: { status: EmailStatus.PENDING } }),
    ]);

    // Fetch recent live jobs
    const recentEmails = await prisma.email.findMany({
      take: 25,
      orderBy: { scheduledAt: "desc" },
      include: {
        sender: {
          select: { id: true, address: true, name: true },
        },
      },
    });

    res.json({
      queueName: QUEUE_NAME,
      redisConnected: redisReady,
      isPaused,
      counts: {
        waiting: counts.waiting,
        active: counts.active,
        completed: Math.max(counts.completed, dbSent),
        failed: Math.max(counts.failed, dbFailed),
        delayed: Math.max(counts.delayed, dbScheduled),
        pendingRateLimited: dbPending,
        total: dbScheduled + dbSent + dbFailed + dbPending,
      },
      config: {
        workerConcurrency: config.WORKER_CONCURRENCY,
        maxEmailsPerHour: config.MAX_EMAILS_PER_HOUR,
        minDelayMs: config.MIN_DELAY_MS,
        redisUrl: config.REDIS_URL || config.REDIS_HOST,
      },
      recentJobs: recentEmails,
    });
  } catch (err: any) {
    console.error("Queue stats error:", err);
    res.status(500).json({ error: err.message || "Failed to fetch queue statistics" });
  }
});

// POST /api/queue/pause - Pause the email queue
router.post("/pause", requireAuth, async (_req: Request, res: Response) => {
  try {
    await emailQueue.pause();
    res.json({ success: true, message: "Queue paused successfully" });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to pause queue" });
  }
});

// POST /api/queue/resume - Resume the email queue
router.post("/resume", requireAuth, async (_req: Request, res: Response) => {
  try {
    await emailQueue.resume();
    res.json({ success: true, message: "Queue resumed successfully" });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to resume queue" });
  }
});

// POST /api/queue/retry-failed - Retry all failed email jobs
router.post("/retry-failed", requireAuth, async (_req: Request, res: Response) => {
  try {
    // Reset FAILED emails to SCHEDULED in DB
    const updated = await prisma.email.updateMany({
      where: { status: EmailStatus.FAILED },
      data: { status: EmailStatus.SCHEDULED, scheduledAt: new Date() },
    });

    res.json({
      success: true,
      message: `Re-queued ${updated.count} failed email(s) for immediate delivery`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to retry jobs" });
  }
});

// POST /api/queue/clean - Clean completed/failed queue artifacts
router.post("/clean", requireAuth, async (_req: Request, res: Response) => {
  try {
    if (redisConnection.status === "ready") {
      await emailQueue.clean(0, 1000, "completed");
      await emailQueue.clean(0, 1000, "failed");
    }
    res.json({ success: true, message: "Cleaned queue history" });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to clean queue" });
  }
});

export default router;
