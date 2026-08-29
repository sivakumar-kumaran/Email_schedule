import { Queue, QueueOptions, JobsOptions } from "bullmq";
import { redisConnection } from "./connection";

export const QUEUE_NAME = "email-send";

export interface EmailJobData {
  emailJobId: string;
  recipientEmail: string;
  subject: string;
  body: string;
  senderId: string;
  batchId?: string;
  idempotencyKey: string;
}

export const defaultJobOptions: JobsOptions = {
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 5000,
  },
  removeOnComplete: 500,
  removeOnFail: 1000,
};

export const queueOptions: QueueOptions = {
  connection: redisConnection,
  defaultJobOptions,
};

export const emailQueue = new Queue<EmailJobData>(QUEUE_NAME, queueOptions);

/**
 * Type-safe helper to enqueue an email job with computed delay and SHA-256 idempotency key as jobId
 */
export async function addEmailJob(data: EmailJobData, scheduledAt: Date) {
  const now = Date.now();
  const delay = Math.max(0, scheduledAt.getTime() - now);

  return emailQueue.add("send-email", data, {
    ...defaultJobOptions,
    jobId: data.idempotencyKey,
    delay,
  });
}
