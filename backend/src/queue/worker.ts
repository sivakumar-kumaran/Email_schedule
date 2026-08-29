import { Worker, Job } from "bullmq";
import { prisma, EmailStatus } from "../db/prisma";
import { config } from "../config";
import {
  sendEmail,
  SendEmailParams,
  indexEmail,
  notifyRateLimitHit,
} from "../services";
import { QUEUE_NAME, EmailJobData } from "./queue";
import { redis, incrementRateLimit, getCurrentRateLimit, msUntilNextHour } from "../redis";

/**
 * Universal email execution engine:
 * 1. Idempotency guard: skips if already SENT or CANCELLED
 * 2. Rate limit check: pushes to PENDING & alerts Slack if limit hit
 * 3. Nodemailer SMTP dispatch (Ethereal test preview)
 * 4. Updates PostgreSQL status to SENT
 * 5. Updates Elasticsearch index
 */
export async function executeEmailSend(emailIdentifier: string): Promise<boolean> {
  const email = await prisma.email.findFirst({
    where: {
      OR: [{ id: emailIdentifier }, { idempotencyKey: emailIdentifier }],
    },
    include: { sender: true },
  });

  if (!email) {
    console.warn(`⚠️ Email not found for identifier: ${emailIdentifier}`);
    return false;
  }

  // 1. Idempotency guards
  if (email.status === EmailStatus.SENT) {
    console.info(`ℹ️ Email ${email.id} already marked as SENT. Skipping duplicate.`);
    return true;
  }

  if (email.status === EmailStatus.CANCELLED) {
    console.info(`ℹ️ Email ${email.id} was CANCELLED. Skipping.`);
    return false;
  }

  const senderAddress = email.sender.address;

  // 2. Hourly rate limit check (per sender)
  const currentCount = await getCurrentRateLimit(senderAddress);
  if (currentCount >= config.MAX_EMAILS_PER_HOUR) {
    const delay = msUntilNextHour();
    const nextAvailableTime = new Date(Date.now() + delay);
    console.warn(
      `⏳ Hourly limit (${config.MAX_EMAILS_PER_HOUR}/hr) hit for ${senderAddress}. Delaying email ${email.id} until ${nextAvailableTime.toLocaleTimeString()}`
    );

    // Update DB status to PENDING
    await prisma.email.update({
      where: { id: email.id },
      data: { status: EmailStatus.PENDING },
    });

    // Notify user via Slack
    await notifyRateLimitHit(email.userId, senderAddress, nextAvailableTime);
    return false;
  }

  // 3. Send email via Nodemailer (Ethereal)
  const mailParams: SendEmailParams = {
    from: `${email.sender.name || "ReachInbox"} <${senderAddress}>`,
    to: email.recipient,
    subject: email.subject,
    html: email.body,
  };

  try {
    const { previewUrl } = await sendEmail(mailParams);

    // 4. Atomically mark as SENT in Postgres
    const sentAt = new Date();
    await prisma.email.update({
      where: { id: email.id },
      data: {
        status: EmailStatus.SENT,
        sentAt,
        errorMessage: previewUrl ? `Preview: ${previewUrl}` : null,
      },
    });

    // 5. Increment Redis hourly counter
    await incrementRateLimit(senderAddress);

    // 6. Update Elasticsearch index with SENT status
    await indexEmail({
      emailId: email.id,
      userId: email.userId,
      senderId: email.senderId,
      sender: senderAddress,
      recipient: email.recipient,
      subject: email.subject,
      body: email.body,
      status: EmailStatus.SENT,
      scheduledAt: email.scheduledAt.toISOString(),
      sentAt: sentAt.toISOString(),
      createdAt: email.createdAt.toISOString(),
    });

    console.log(`✅ Successfully delivered email ${email.id} to ${email.recipient}`);
    return true;
  } catch (err: any) {
    console.error(`❌ Failed to send email ${email.id}:`, err);
    await prisma.email.update({
      where: { id: email.id },
      data: {
        status: EmailStatus.FAILED,
        errorMessage: err.message || "Delivery failed",
      },
    });

    await indexEmail({
      emailId: email.id,
      userId: email.userId,
      senderId: email.senderId,
      sender: senderAddress,
      recipient: email.recipient,
      subject: email.subject,
      body: email.body,
      status: EmailStatus.FAILED,
      scheduledAt: email.scheduledAt.toISOString(),
      createdAt: email.createdAt.toISOString(),
    });

    return false;
  }
}

/**
 * Worker processor for a single BullMQ job.
 */
export async function processEmail(job: Job<EmailJobData>): Promise<void> {
  const { idempotencyKey } = job.data;
  await executeEmailSend(idempotencyKey);
}

// ─── Initialize BullMQ Worker ───────────────────────────────────────────────
export const emailWorker = new Worker<EmailJobData>(
  QUEUE_NAME,
  async (job) => {
    await processEmail(job);
  },
  {
    connection: redis,
    concurrency: config.WORKER_CONCURRENCY,
    limiter: {
      max: 1,
      duration: config.MIN_DELAY_MS,
    },
  }
);

emailWorker.on("ready", () => {
  console.log(`🚀 BullMQ Worker ready (concurrency=${config.WORKER_CONCURRENCY}, min_delay=${config.MIN_DELAY_MS}ms)`);
});

emailWorker.on("error", (err: any) => {
  if (err?.code !== "ECONNREFUSED") {
    console.error("❌ BullMQ Worker error:", err.message || err);
  }
});

emailWorker.on("failed", (job, err) => {
  console.error(`❌ BullMQ Job ${job?.id} failed:`, err);
});
