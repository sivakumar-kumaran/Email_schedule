import { Router, Request, Response } from "express";
import { WebClient } from "@slack/web-api";
import { config } from "../config";
import { prisma } from "../db/prisma";
import { requireAuth } from "../auth/jwt.middleware";

const router = Router();

// GET /slack/connect - Redirect user to Slack authorization page
router.get("/connect", requireAuth, (req: Request, res: Response) => {
  const userId = req.user!.id;
  const scopes = [
    "chat:write",
    "chat:write.public",
    "incoming-webhook",
    "commands",
  ].join(",");

  const state = Buffer.from(JSON.stringify({ userId })).toString("base64");

  const slackUrl = `https://slack.com/oauth/v2/authorize?client_id=${encodeURIComponent(
    config.SLACK_CLIENT_ID
  )}&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(
    config.SLACK_REDIRECT_URI
  )}&state=${encodeURIComponent(state)}`;

  res.json({ url: slackUrl });
});

// GET /slack/callback or /slack/oauth/callback - Handle Slack OAuth callback
router.get(["/callback", "/oauth/callback"], async (req: Request, res: Response) => {
  const { code, state, error } = req.query as {
    code?: string;
    state?: string;
    error?: string;
  };

  if (error) {
    console.error("Slack OAuth error:", error);
    return res.redirect(`${config.FRONTEND_URL}/dashboard?slack=error`);
  }

  if (!code || !state) {
    return res.redirect(`${config.FRONTEND_URL}/dashboard?slack=invalid_request`);
  }

  try {
    const decodedState = JSON.parse(Buffer.from(state, "base64").toString("utf-8"));
    const userId = decodedState.userId;

    if (!userId) {
      return res.redirect(`${config.FRONTEND_URL}/dashboard?slack=no_user`);
    }

    const client = new WebClient();
    const result: any = await client.oauth.v2.access({
      client_id: config.SLACK_CLIENT_ID,
      client_secret: config.SLACK_CLIENT_SECRET,
      code,
      redirect_uri: config.SLACK_REDIRECT_URI,
    });

    if (!result.ok) {
      console.error("Slack oauth.v2.access failed:", result.error);
      return res.redirect(`${config.FRONTEND_URL}/dashboard?slack=oauth_failed`);
    }

    const botToken = result.access_token;
    const webhookUrl = result.incoming_webhook?.url || null;
    const workspace = result.team?.name || "Slack Workspace";
    const teamId = result.team?.id || null;

    await prisma.slackConnection.upsert({
      where: { userId },
      update: {
        botToken,
        webhookUrl,
        workspace,
        teamId,
      },
      create: {
        userId,
        botToken,
        webhookUrl,
        workspace,
        teamId,
      },
    });

    console.log(`✅ Slack connected for user ${userId} to workspace "${workspace}"`);
    return res.redirect(`${config.FRONTEND_URL}/dashboard?slack=connected`);
  } catch (err) {
    console.error("Failed to process Slack callback:", err);
    return res.redirect(`${config.FRONTEND_URL}/dashboard?slack=server_error`);
  }
});

// GET /slack/status - Check connection status
router.get("/status", requireAuth, async (req: Request, res: Response) => {
  const connection = await prisma.slackConnection.findUnique({
    where: { userId: req.user!.id },
    select: {
      id: true,
      workspace: true,
      teamId: true,
      createdAt: true,
    },
  });

  res.json({ connected: !!connection, connection });
});

// DELETE /slack/disconnect - Remove Slack connection
router.delete("/disconnect", requireAuth, async (req: Request, res: Response) => {
  await prisma.slackConnection.deleteMany({
    where: { userId: req.user!.id },
  });

  res.json({ success: true, message: "Slack disconnected successfully" });
});

export default router;
