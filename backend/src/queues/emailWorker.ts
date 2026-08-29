import { Worker, Job } from "bullmq";
import { prisma, EmailStatus } from "../db/prisma";
import { config } from "../config";
import { redisConnection } from "./connection";
import { QUEUE_NAME, EmailJobData, addEmailJob } from "./emailQueue";
import { sendEmail, indexEmail, notifyRateLimitHit } from "../services";
import { getCurrentRateLimit, incrementRateLimit, msUntilNextHour } from "../redis";

export let emailWorker: Worker<EmailJobData> | null = null;

/**
 * Processor for each individual BullMQ email job
 */
export async function processEmailJob(job: Job<EmailJobData>): Promise<{ previewUrl?: string }> {
  const { emailJobId, recipientEmail, subject, body, senderId, idempotencyKey } = job.data;

  // 1. Fetch DB record and sender details
  const email = await prisma.email.findFirst({
    where: {
      OR: [{ id: emailJobId }, { idempotencyKey }],
    },
    include: { sender: true },
  });

  if (!email) {
    console.warn(`⚠️ Email record not found for job: ${job.id}`);
    return {};
  }

  // 2. Idempotency guards
  if (email.status === EmailStatus.SENT) {
    console.info(`ℹ️ Email ${email.id} already marked as SENT. Skipping duplicate execution.`);
    return {};
  }

  if (email.status === EmailStatus.CANCELLED) {
    console.info(`ℹ️ Email ${email.id} was CANCELLED. Skipping.`);
    return {};
  }

  const senderAddress = email.sender.address;

  // 3. Hourly Rate Limit Check
  const currentCount = await getCurrentRateLimit(senderAddress);
  if (currentCount >= config.MAX_EMAILS_PER_HOUR) {
    const delay = msUntilNextHour();
    const nextAvailableTime = new Date(Date.now() + delay);

    console.warn(
      `⏳ Rate limit (${config.MAX_EMAILS_PER_HOUR}/hr) reached for sender ${senderAddress}. ` +
        `Re-scheduling email ${email.id} for ${nextAvailableTime.toLocaleTimeString()}`
    );

    // Update status to PENDING
    await prisma.email.update({
      where: { id: email.id },
      data: { status: EmailStatus.PENDING },
    });

    // Notify user via Slack
    await notifyRateLimitHit(email.userId, senderAddress, nextAvailableTime);

    // Re-enqueue job into next hour window
    await addEmailJob(job.data, nextAvailableTime);

    return {};
  }

  // 4. Dispatch Email via SMTP (Ethereal test preview)
  const mailResult = await sendEmail({
    from: `${email.sender.name || "ReachInbox"} <${senderAddress}>`,
    to: recipientEmail,
    subject,
    html: body,
  });

  // 5. Increment rate limit counter in Redis
  await incrementRateLimit(senderAddress);

  return { previewUrl: mailResult.previewUrl };
}

/**
 * Initializes and starts the BullMQ Worker instance with lifecycle event listeners
 */
export function startWorker(): Worker<EmailJobData> {
  if (emailWorker) {
    return emailWorker;
  }

  emailWorker = new Worker<EmailJobData>(
    QUEUE_NAME,
    async (job) => {
      return await processEmailJob(job);
    },
    {
      connection: redisConnection,
      concurrency: config.WORKER_CONCURRENCY,
      limiter: {
        max: 1,
        duration: config.MIN_DELAY_MS,
      },
    }
  );

  // Completed event listener: Sync with Postgres & Elasticsearch
  emailWorker.on("completed", async (job, result) => {
    try {
      const email = await prisma.email.findFirst({
        where: {
          OR: [{ id: job.data.emailJobId }, { idempotencyKey: job.data.idempotencyKey }],
        },
        include: { sender: true },
      });

      if (!email || email.status === EmailStatus.SENT) return;

      const sentAt = new Date();
      await prisma.email.update({
        where: { id: email.id },
        data: {
          status: EmailStatus.SENT,
          sentAt,
          errorMessage: result?.previewUrl ? `Preview: ${result.previewUrl}` : null,
        },
      });

      await indexEmail({
        emailId: email.id,
        userId: email.userId,
        senderId: email.senderId,
        sender: email.sender.address,
        recipient: email.recipient,
        subject: email.subject,
        body: email.body,
        status: EmailStatus.SENT,
        scheduledAt: email.scheduledAt.toISOString(),
        sentAt: sentAt.toISOString(),
        createdAt: email.createdAt.toISOString(),
      });

      console.log(`✅ [Worker] Delivered email ${email.id} to ${email.recipient}`);
    } catch (err: any) {
      console.error(`❌ [Worker] Error syncing completed state for job ${job.id}:`, err.message || err);
    }
  });

  // Failed event listener: Mark FAILED in Postgres & Elasticsearch
  emailWorker.on("failed", async (job, err) => {
    if (!job) return;
    try {
      const email = await prisma.email.findFirst({
        where: {
          OR: [{ id: job.data.emailJobId }, { idempotencyKey: job.data.idempotencyKey }],
        },
        include: { sender: true },
      });

      if (email) {
        await prisma.email.update({
          where: { id: email.id },
          data: {
            status: EmailStatus.FAILED,
            errorMessage: err.message || "Execution failed",
          },
        });

        await indexEmail({
          emailId: email.id,
          userId: email.userId,
          senderId: email.senderId,
          sender: email.sender.address,
          recipient: email.recipient,
          subject: email.subject,
          body: email.body,
          status: EmailStatus.FAILED,
          scheduledAt: email.scheduledAt.toISOString(),
          createdAt: email.createdAt.toISOString(),
        });
      }

      console.error(`❌ [Worker] Job ${job.id} failed:`, err.message || err);
    } catch (dbErr: any) {
      console.error(`❌ [Worker] Failed to sync error state:`, dbErr.message || dbErr);
    }
  });

  emailWorker.on("ready", () => {
    console.log(`🚀 BullMQ Worker active (concurrency=${config.WORKER_CONCURRENCY}, minDelay=${config.MIN_DELAY_MS}ms)`);
  });

  emailWorker.on("error", (err: any) => {
    if (err?.code !== "ECONNREFUSED") {
      console.warn("⚠️ [Worker] Redis notice:", err.message || err);
    }
  });

  return emailWorker;
}
