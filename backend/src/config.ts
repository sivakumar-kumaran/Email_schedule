import { z } from "zod";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), "backend/.env") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config();

const configSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  FRONTEND_URL: z.string().url().default("http://localhost:3000"),

  // Database
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  // Redis
  REDIS_URL: z.string().optional().default("redis://localhost:6379"),
  REDIS_HOST: z.string().default("localhost"),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),

  // Elasticsearch
  ELASTICSEARCH_URL: z.string().url().default("http://localhost:9200"),

  // Google OAuth
  GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID is required"),
  GOOGLE_CLIENT_SECRET: z.string().min(1, "GOOGLE_CLIENT_SECRET is required"),
  GOOGLE_CALLBACK_URL: z.string().url(),

  // JWT
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),

  // Session
  SESSION_SECRET: z.string().default("reachinbox_super_secret_session_2026"),

  // Slack
  SLACK_CLIENT_ID: z.string().default("placeholder-slack-client-id"),
  SLACK_CLIENT_SECRET: z.string().default("placeholder-slack-client-secret"),
  SLACK_REDIRECT_URI: z.string().url().default("http://localhost:5000/api/slack/oauth/callback"),

  // Ethereal SMTP
  ETHEREAL_USER: z.string().optional(),
  ETHEREAL_PASS: z.string().optional(),
  ETHEREAL_HOST: z.string().default("smtp.ethereal.email"),
  ETHEREAL_PORT: z.coerce.number().default(587),

  // Scheduler limits
  MAX_EMAILS_PER_HOUR: z.coerce.number().positive().default(50),
  MIN_DELAY_MS: z.coerce.number().nonnegative().default(2000),
  WORKER_CONCURRENCY: z.coerce.number().positive().default(5),
});

const envInput = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || "development",
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
  DATABASE_URL: process.env.DATABASE_URL,
  REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",
  REDIS_HOST: process.env.REDIS_HOST || "localhost",
  REDIS_PORT: process.env.REDIS_PORT || 6379,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || undefined,
  ELASTICSEARCH_URL: process.env.ELASTICSEARCH_URL || "http://localhost:9200",
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL:
    process.env.GOOGLE_REDIRECT_URI ||
    process.env.GOOGLE_CALLBACK_URL ||
    "http://localhost:5000/api/auth/google/callback",
  JWT_SECRET: process.env.JWT_SECRET || "reachinbox_super_secret_jwt_key_2026",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  SESSION_SECRET: process.env.SESSION_SECRET || process.env.JWT_SECRET || "reachinbox_super_secret_session_2026",
  SLACK_CLIENT_ID: process.env.SLACK_CLIENT_ID || "placeholder-slack-client-id",
  SLACK_CLIENT_SECRET: process.env.SLACK_CLIENT_SECRET || "placeholder-slack-client-secret",
  SLACK_REDIRECT_URI:
    process.env.SLACK_REDIRECT_URI || "http://localhost:5000/api/slack/oauth/callback",
  ETHEREAL_USER: process.env.ETHEREAL_SMTP_USER || process.env.ETHEREAL_USER || undefined,
  ETHEREAL_PASS: process.env.ETHEREAL_SMTP_PASS || process.env.ETHEREAL_PASS || undefined,
  ETHEREAL_HOST: process.env.ETHEREAL_SMTP_HOST || process.env.ETHEREAL_HOST || "smtp.ethereal.email",
  ETHEREAL_PORT: process.env.ETHEREAL_SMTP_PORT || process.env.ETHEREAL_PORT || 587,
  MAX_EMAILS_PER_HOUR:
    process.env.MAX_EMAILS_PER_HOUR_PER_SENDER || process.env.MAX_EMAILS_PER_HOUR || 50,
  MIN_DELAY_MS:
    process.env.MIN_DELAY_BETWEEN_SENDS_MS || process.env.MIN_DELAY_MS || 2000,
  WORKER_CONCURRENCY: process.env.WORKER_CONCURRENCY || 5,
};

const parsed = configSchema.safeParse(envInput);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = parsed.data;
export type Config = typeof config;
