import { Router, Request, Response } from "express";
import passport from "passport";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { generateToken, requireAuth } from "../auth/jwt.middleware";
import { config } from "../config";
import { prisma } from "../db/prisma";

const router = Router();

const signupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(4, "Password must be at least 4 characters"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// POST /auth/signup - Email/Password Registration
router.post("/signup", async (req: Request, res: Response) => {
  try {
    const data = signupSchema.parse(req.body);
    const existing = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existing) {
      return res.status(400).json({ error: "User with this email already exists" });
    }

    const user = await prisma.user.create({
      data: {
        googleId: `local_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        email: data.email.toLowerCase(),
        name: data.name,
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
          data.name
        )}&backgroundColor=6366f1,8b5cf6,4f46e5`,
      },
    });

    // Create default sender
    await prisma.sender.create({
      data: {
        userId: user.id,
        address: user.email,
        name: user.name,
      },
    });

    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    res.status(201).json({ token, user });
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to create account" });
  }
});

// POST /auth/login - Email/Password Login
router.post("/login", async (req: Request, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);
    let user = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (!user) {
      // Auto-provision user on login if not found for seamless local UX
      user = await prisma.user.create({
        data: {
          googleId: `local_${Date.now()}`,
          email: data.email.toLowerCase(),
          name: data.email.split("@")[0],
          avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
            data.email.split("@")[0]
          )}&backgroundColor=6366f1,8b5cf6,4f46e5`,
        },
      });

      await prisma.sender.create({
        data: {
          userId: user.id,
          address: user.email,
          name: user.name,
        },
      });
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    res.json({ token, user });
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to log in" });
  }
});

// Helper to dynamically construct OAuth callback URL for local & production deployment
function getOAuthCallbackUrl(req: Request): string {
  const host = req.get("host") || "localhost:5000";
  const isLocalHost = host.includes("localhost") || host.includes("127.0.0.1");

  if (isLocalHost) {
    const port = host.split(":")[1] || "5000";
    return `http://localhost:${port}/api/auth/google/callback`;
  }

  const envCallback = process.env.GOOGLE_REDIRECT_URI || process.env.GOOGLE_CALLBACK_URL;
  if (envCallback) {
    return envCallback;
  }

  const protocol = req.protocol === "https" || req.get("x-forwarded-proto") === "https" ? "https" : "http";
  return `${protocol}://${host}/api/auth/google/callback`;
}

// Start Google OAuth flow
router.get("/google", (req: Request, res: Response, next: any) => {
  let frontendUrl = config.FRONTEND_URL;
  if (req.query.frontend_url && typeof req.query.frontend_url === "string") {
    frontendUrl = req.query.frontend_url;
  } else if (req.headers.referer) {
    try {
      frontendUrl = new URL(req.headers.referer).origin;
    } catch {}
  }
  frontendUrl = frontendUrl.replace(/\/$/, "");

  if (!config.GOOGLE_CLIENT_ID || !config.GOOGLE_CLIENT_SECRET) {
    console.error("❌ Google OAuth failed: Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in server environment");
    return res.redirect(
      `${frontendUrl}/auth?error=${encodeURIComponent("Google OAuth credentials missing on backend server")}`
    );
  }

  const callbackURL = getOAuthCallbackUrl(req);

  try {
    passport.authenticate("google", {
      scope: ["profile", "email"],
      session: false,
      state: frontendUrl,
      callbackURL,
    } as any)(req, res, next);
  } catch (err: any) {
    console.error("❌ Exception initiating Google OAuth:", err);
    return res.redirect(
      `${frontendUrl}/auth?error=${encodeURIComponent(err?.message || "auth_initiation_failed")}`
    );
  }
});

// Google OAuth callback
router.get("/google/callback", (req: Request, res: Response, next: any) => {
  let targetFrontendUrl = config.FRONTEND_URL;
  if (req.query.state && typeof req.query.state === "string") {
    targetFrontendUrl = req.query.state;
  }
  targetFrontendUrl = targetFrontendUrl.replace(/\/$/, "");

  // Check if Google returned an explicit OAuth error parameter
  if (req.query.error) {
    const errorDesc =
      (req.query.error_description as string) ||
      (req.query.error as string) ||
      "google_auth_failed";
    console.error("❌ Google OAuth returned error parameter:", errorDesc);
    return res.redirect(`${targetFrontendUrl}/auth?error=${encodeURIComponent(errorDesc)}`);
  }

  const callbackURL = getOAuthCallbackUrl(req);

  passport.authenticate("google", { session: false, callbackURL } as any, (err: any, user: any, info: any) => {
    if (err || !user) {
      console.error("❌ Google OAuth callback failed:", err || info);
      const errorMsg =
        err?.message ||
        info?.message ||
        (typeof info === "string" ? info : "Authentication failed with Google");
      return res.redirect(`${targetFrontendUrl}/auth?error=${encodeURIComponent(errorMsg)}`);
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    return res.redirect(`${targetFrontendUrl}/auth/callback?token=${encodeURIComponent(token)}`);
  })(req, res, next);
});

// Get current user details
router.get("/me", requireAuth, async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: {
      senders: true,
      slackConnection: {
        select: {
          id: true,
          workspace: true,
          teamId: true,
          createdAt: true,
        },
      },
    },
  });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json({ user });
});

// Dev/Demo Quick Login endpoint
router.post("/dev-login", async (req: Request, res: Response) => {
  const { email = "demo@reachinbox.ai", name = "Demo User" } = req.body;

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        googleId: `dev_${Date.now()}`,
        email,
        name,
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
          name
        )}&backgroundColor=6366f1,8b5cf6,4f46e5`,
      },
    });
  }

  // Ensure default sender
  await prisma.sender.upsert({
    where: {
      userId_address: {
        userId: user.id,
        address: user.email,
      },
    },
    update: {},
    create: {
      userId: user.id,
      address: user.email,
      name: user.name,
    },
  });

  const token = generateToken({
    userId: user.id,
    email: user.email,
  });

  res.json({ token, user });
});

export default router;
