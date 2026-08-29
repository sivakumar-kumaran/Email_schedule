import { Queue, QueueOptions } from "bullmq";
import { redis } from "../redis";

export const QUEUE_NAME = "email-scheduler";

export const queueOptions: QueueOptions = {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: {
      age: 86400, // keep completed jobs for 24h for visibility in Bull Board
      count: 2000,
    },
    removeOnFail: {
      age: 604800, // keep failed jobs for 7 days
    },
  },
};

export const emailQueue = new Queue(QUEUE_NAME, queueOptions);

export interface EmailJobData {
  emailId: string;
  idempotencyKey: string;
  senderAddress: string;
  recipient: string;
  subject: string;
  body: string;
  userId: string;
}
