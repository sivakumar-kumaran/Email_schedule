import { prisma, EmailStatus } from "../db/prisma";
import { emailQueue, EmailJobData } from "./queue";
import { executeEmailSend } from "./worker";

/**
 * Background dispatcher for due emails in PostgreSQL.
 * Checks for any email with status IN ('SCHEDULED', 'PENDING') where scheduledAt <= now,
 * and delivers it immediately with idempotency guards.
 */
export async function dispatchDueEmails(): Promise<number> {
  const now = new Date();
  const dueEmails = await prisma.email.findMany({
    where: {
      status: {
        in: [EmailStatus.SCHEDULED, EmailStatus.PENDING],
      },
      scheduledAt: {
        lte: now,
      },
    },
    include: {
      sender: true,
    },
    take: 50,
  });

  let dispatchedCount = 0;
  for (const email of dueEmails) {
    try {
      const success = await executeEmailSend(email.id);
      if (success) {
        dispatchedCount++;
      }
    } catch (err) {
      console.error(`Error dispatching due email ${email.id}:`, err);
    }
  }

  return dispatchedCount;
}

/**
 * On worker / API boot, reconcile DB vs queue:
 * Any DB row in `SCHEDULED` or `PENDING` state without a live BullMQ job
 * gets re-enqueued with the correct remaining delay.
 */
export async function reconcile(): Promise<{ reconciledCount: number }> {
  console.log("🔄 Running scheduler boot reconciliation & starting dispatcher loop...");

  // Start continuous 2-second background dispatcher
    setInterval(() => {
    dispatchDueEmails().catch(() => {});
  }, 2000);

  // Run immediate initial dispatch
  await dispatchDueEmails();

  const pendingEmails = await prisma.email.findMany({
    where: {
      status: {
        in: [EmailStatus.SCHEDULED, EmailStatus.PENDING],
      },
      scheduledAt: {
        gt: new Date(),
      },
    },
    include: {
      sender: true,
    },
  });

  let reconciledCount = 0;
  const now = Date.now();

  for (const email of pendingEmails) {
    try {
      const scheduledTime = email.scheduledAt.getTime();
      const delay = Math.max(0, scheduledTime - now);

      const jobData: EmailJobData = {
        emailId: email.id,
        idempotencyKey: email.idempotencyKey,
        senderAddress: email.sender.address,
        recipient: email.recipient,
        subject: email.subject,
        body: email.body,
        userId: email.userId,
      };

      const newJob = await emailQueue.add("send-email", jobData, {
        jobId: email.idempotencyKey,
        delay,
      });

      await prisma.email.update({
        where: { id: email.id },
        data: {
          bullJobId: newJob.id || email.idempotencyKey,
        },
      });

      reconciledCount++;
    } catch (err) {
      // BullMQ may be connecting to Redis
    }
  }

  console.log(`✅ Scheduler loop active. Re-enqueued ${reconciledCount} future jobs.`);
  return { reconciledCount };
}
