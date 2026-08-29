import { PrismaClient } from "@prisma/client";
import { config } from "../config";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  global.__prisma ??
  new PrismaClient({
    log: config.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (config.NODE_ENV !== "production") {
  global.__prisma = prisma;
}

export const EmailStatus = {
  SCHEDULED: "SCHEDULED",
  PENDING: "PENDING",
  SENT: "SENT",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
} as const;

export type EmailStatus = (typeof EmailStatus)[keyof typeof EmailStatus];

export default prisma;
