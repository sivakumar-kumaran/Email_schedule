import { createApp } from "./app";
import { config } from "./config";
import { prisma } from "./db/prisma";
import { redisConnection } from "./queues/connection";
import { emailQueue } from "./queues/emailQueue";
import { startWorker, emailWorker } from "./queues/emailWorker";
import { reconcile } from "./queue/reconcile";
import { ensureIndex } from "./services/elasticsearch.service";

async function bootstrap() {
  console.log("══════════════════════════════════════════════════════════════");
  console.log("  🚀 ReachInbox Email Scheduler Backend Service Booting...  ");
  console.log("══════════════════════════════════════════════════════════════");

  try {
    // 1. Establish & verify database connection
    await prisma.$connect();
    console.log("✅ PostgreSQL database connected via Prisma");

    // 2. Initialize Elasticsearch index
    ensureIndex().catch((esErr) => {
      console.warn("⚠️ Elasticsearch not reachable at boot (using DB fallback):", (esErr as Error).message);
    });

    // 3. Re-sync / rehydrate pending SCHEDULED jobs from Postgres into queue
    reconcile().catch((recErr) => {
      console.warn("⚠️ Startup queue reconciliation notice:", (recErr as Error).message);
    });

    // 4. Start BullMQ email worker
    const worker = startWorker();

    // 5. Start Express Web Server with Bull Board mounted at /admin/queues
    const app = createApp();
    const server = app.listen(config.PORT, () => {
      console.log(`\n🎉 Server running on http://localhost:${config.PORT}`);
      console.log(`📊 Bull Board UI:     http://localhost:${config.PORT}/admin/queues`);
      console.log(`🩺 Health Check:      http://localhost:${config.PORT}/health`);
      console.log(`🌐 Frontend URL:      ${config.FRONTEND_URL}`);
      console.log(`⚡ Redis connected:    ${config.REDIS_URL || config.REDIS_HOST}`);
      console.log(`⚙️  Worker started:    Concurrency = ${config.WORKER_CONCURRENCY}, RateLimit = ${config.MAX_EMAILS_PER_HOUR}/hr`);
      console.log("──────────────────────────────────────────────────────────────\n");
    });

    // 6. Graceful shutdown handler
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);

      server.close(async () => {
        console.log("HTTP server closed.");
        try {
          if (emailWorker) {
            await emailWorker.close();
            console.log("BullMQ Worker closed.");
          }
          await emailQueue.close();
          console.log("BullMQ Queue closed.");
          await redisConnection.quit();
          console.log("Redis connection closed.");
          await prisma.$disconnect();
          console.log("Prisma disconnected.");
          console.log("✅ Graceful shutdown completed.");
          process.exit(0);
        } catch (err) {
          console.error("Error during graceful shutdown:", err);
          process.exit(1);
        }
      });
    };

    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  } catch (err) {
    console.error("❌ Fatal startup error:", err);
    process.exit(1);
  }
}

bootstrap();
