import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma";
import { requireAuth } from "../auth/jwt.middleware";

const router = Router();

const createSenderSchema = z.object({
  address: z.string().email("Invalid sender email address"),
  name: z.string().min(1, "Sender name is required").optional(),
});

// GET /senders - List user's senders
router.get("/", requireAuth, async (req: Request, res: Response) => {
  const senders = await prisma.sender.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: "asc" },
  });

  res.json({ senders });
});

// POST /senders - Create sender
router.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const data = createSenderSchema.parse(req.body);

    const sender = await prisma.sender.upsert({
      where: {
        userId_address: {
          userId: req.user!.id,
          address: data.address,
        },
      },
      update: {
        name: data.name,
      },
      create: {
        userId: req.user!.id,
        address: data.address,
        name: data.name,
      },
    });

    res.status(201).json({ sender });
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Invalid sender data" });
  }
});

// DELETE /senders/:id
router.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  const { id } = req.params;

  await prisma.sender.deleteMany({
    where: {
      id,
      userId: req.user!.id,
    },
  });

  res.json({ success: true });
});

export default router;
