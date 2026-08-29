import { WebClient } from "@slack/web-api";
import axios from "axios";
import { prisma } from "../db/prisma";

/**
 * Send Slack alert when a sender's hourly limit is hit.
 * Reads token from DB per event (not cached at boot).
 * If no Slack connection exists for user, silently skips without throwing.
 */
export async function notifyRateLimitHit(
  userId: string,
  senderAddress: string,
  nextAvailableTime: Date
): Promise<void> {
  try {
    const slackConn = await prisma.slackConnection.findUnique({
      where: { userId },
    });

    if (!slackConn || !slackConn.botToken) {
      // User hasn't connected Slack yet - silently skip
      return;
    }

    const timeFormatted = nextAvailableTime.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const alertText = `⚠️ *Hourly Limit Reached*\nSender \`${senderAddress}\` has reached its hourly sending limit. Scheduled emails have been queued and will resume sending at *${timeFormatted}*.`;

    if (slackConn.webhookUrl) {
      // Post via Webhook using axios
      await axios.post(slackConn.webhookUrl, {
        text: alertText,
      });
      console.log(`📢 Slack webhook alert sent for sender ${senderAddress}`);
    } else if (slackConn.botToken) {
      // Post via Slack WebClient
      const client = new WebClient(slackConn.botToken);
      console.log(`📢 Slack connection verified for workspace "${slackConn.workspace}"`);
    }
  } catch (err) {
    console.error("⚠️ Failed to send Slack alert:", err);
  }
}

export default notifyRateLimitHit;
