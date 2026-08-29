import { Router, Request, Response } from "express";
import { z } from "zod";
import crypto from "crypto";
import { prisma, EmailStatus } from "../db/prisma";
import { emailQueue, EmailJobData, addEmailJob } from "../queues/emailQueue";
import { requireAuth } from "../auth/jwt.middleware";
import { indexEmail, searchEmails } from "../services/elasticsearch.service";

const router = Router();

const scheduleEmailSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Body is required"),
  recipients: z
    .array(z.string().email("Invalid recipient email"))
    .min(1, "At least one recipient is required"),
  senderId: z.string().min(1, "Sender ID is required"),
  scheduledAt: z
    .any()
    .optional()
    .transform((val) => {
      if (!val) return new Date();
      const parsed = new Date(val);
      return isNaN(parsed.getTime()) ? new Date() : parsed;
    }),
  delayBetweenSendsMs: z.coerce.number().min(0).default(0),
});

// Helper: schedule a single email record
async function scheduleSingleEmail(params: {
  userId: string;
  senderId: string;
  senderAddress: string;
  recipient: string;
  subject: string;
  body: string;
  scheduledAt: Date;
}) {
  const { userId, senderId, senderAddress, recipient, subject, body, scheduledAt } = params;

  // Compute idempotency key = hash(userId + senderId + recipient + subject + scheduledAt)
  const hashPayload = `${userId}:${senderId}:${recipient}:${subject}:${scheduledAt.getTime()}`;
  const idempotencyKey = crypto.createHash("sha256").update(hashPayload).digest("hex");

  // Check if existing record with this idempotency key already exists
  const existing = await prisma.email.findUnique({
    where: { idempotencyKey },
  });

  if (existing) {
    return existing;
  }

  // 1. Persist to Postgres FIRST (Source of Truth)
  const email = await prisma.email.create({
    data: {
      userId,
      senderId,
      recipient,
      subject,
      body,
      status: EmailStatus.SCHEDULED,
      scheduledAt,
      idempotencyKey,
    },
    include: { sender: true },
  });

  // 2. Enqueue delayed job to BullMQ
  const jobData: EmailJobData = {
    emailJobId: email.id,
    idempotencyKey: email.idempotencyKey,
    senderId,
    recipientEmail: recipient,
    subject,
    body,
  };

  const job = await addEmailJob(jobData, scheduledAt);

  // Update Bull job ID in DB
  const updated = await prisma.email.update({
    where: { id: email.id },
    data: { bullJobId: job.id || idempotencyKey },
    include: { sender: true },
  });

  // 3. Index to Elasticsearch
  await indexEmail({
    emailId: email.id,
    userId: email.userId,
    senderId: email.senderId,
    sender: senderAddress,
    recipient: email.recipient,
    subject: email.subject,
    body: email.body,
    status: EmailStatus.SCHEDULED,
    scheduledAt: scheduledAt.toISOString(),
    createdAt: email.createdAt.toISOString(),
  });

  return updated;
}

// POST /emails/schedule - Schedule one or multiple emails
router.post("/schedule", requireAuth, async (req: Request, res: Response) => {
  try {
    const data = scheduleEmailSchema.parse(req.body);
    const userId = req.user!.id;

    // Verify sender belongs to this user
    const sender = await prisma.sender.findFirst({
      where: { id: data.senderId, userId },
    });

    if (!sender) {
      return res.status(400).json({ error: "Sender not found or not owned by user" });
    }

    const baseScheduledAt = new Date(data.scheduledAt);
    const createdEmails = [];

    for (let i = 0; i < data.recipients.length; i++) {
      const recipient = data.recipients[i];
      const sendTime = new Date(baseScheduledAt.getTime() + i * data.delayBetweenSendsMs);

      const email = await scheduleSingleEmail({
        userId,
        senderId: sender.id,
        senderAddress: sender.address,
        recipient,
        subject: data.subject,
        body: data.body,
        scheduledAt: sendTime,
      });

      createdEmails.push(email);
    }

    res.status(201).json({
      success: true,
      count: createdEmails.length,
      emails: createdEmails,
    });
  } catch (err: any) {
    console.error("Schedule error:", err);
    res.status(400).json({ error: err.message || "Failed to schedule emails" });
  }
});

// GET /emails - List emails with filters & pagination
router.get("/", requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { status, senderId, page = "1", limit = "20" } = req.query as {
    status?: EmailStatus;
    senderId?: string;
    page?: string;
    limit?: string;
  };

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * pageSize;

  const where: any = { userId };
  if (status && Object.values(EmailStatus).includes(status)) {
    where.status = status;
  }
  if (senderId) {
    where.senderId = senderId;
  }

  const [emails, total] = await Promise.all([
    prisma.email.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { scheduledAt: "desc" },
      include: {
        sender: {
          select: { id: true, address: true, name: true },
        },
      },
    }),
    prisma.email.count({ where }),
  ]);

  res.json({
    emails,
    total,
    page: pageNum,
    limit: pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
});

// GET /emails/search?q= - Search via Elasticsearch with fallback to Postgres
router.get("/search", requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const query = (req.query.q as string) || "";

  if (!query.trim()) {
    return res.json({ results: [] });
  }

  try {
    const esResults = await searchEmails(query, userId);
    return res.json({ source: "elasticsearch", results: esResults });
  } catch (esErr) {
    console.warn("Elasticsearch search failed, falling back to Postgres LIKE search:", esErr);
    // Fallback to Postgres search
    const fallbackResults = await prisma.email.findMany({
      where: {
        userId,
        OR: [
          { subject: { contains: query, mode: "insensitive" } },
          { body: { contains: query, mode: "insensitive" } },
          { recipient: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 20,
      orderBy: { scheduledAt: "desc" },
      include: { sender: true },
    });

    return res.json({ source: "postgres_fallback", results: fallbackResults });
  }
});

// DELETE /emails/:id - Cancel a scheduled email OR hard-delete a sent/cancelled email
router.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;

  const email = await prisma.email.findFirst({
    where: { id, userId },
  });

  if (!email) {
    return res.status(404).json({ error: "Email not found" });
  }

  const isPendingOrScheduled =
    email.status === EmailStatus.SCHEDULED || email.status === EmailStatus.PENDING;

  if (isPendingOrScheduled) {
    // Cancel: remove from BullMQ queue and mark as CANCELLED
    if (email.bullJobId) {
      try {
        const job = await emailQueue.getJob(email.bullJobId);
        if (job) {
          await job.remove();
        }
      } catch (err) {
        console.warn("Could not remove job from queue:", err);
      }
    }
    await prisma.email.update({
      where: { id },
      data: { status: EmailStatus.CANCELLED },
    });
    return res.json({ success: true, message: "Email cancelled successfully" });
  }

  // For SENT / CANCELLED / FAILED — hard delete from DB
  await prisma.email.delete({ where: { id } });
  return res.json({ success: true, message: "Email deleted successfully" });
});

export default router;
