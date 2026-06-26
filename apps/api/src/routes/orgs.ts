import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../lib/db.js";
import { NotFoundError } from "../lib/errors.js";
import { requireAdmin } from "../middleware/auth.js";

export const orgsRouter = Router();

// GET /v1/orgs/me — current org overview
orgsRouter.get("/me", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const org = await prisma.organization.findUnique({
      where: { id: req.orgId },
      include: {
        _count: {
          select: {
            members: true,
            apiKeys: { where: { revokedAt: null } },
            projects: true,
          },
        },
      },
    });

    if (!org) throw new NotFoundError("Organization");

    res.json({
      id: org.id,
      name: org.name,
      slug: org.slug,
      plan: org.plan,
      monthlyBudget: org.monthlyBudget ? Number(org.monthlyBudget) : null,
      createdAt: org.createdAt,
      counts: {
        members: org._count.members,
        activeApiKeys: org._count.apiKeys,
        projects: org._count.projects,
      },
    });
  } catch (err) {
    next(err);
  }
});

const UpdateOrgSchema = z.object({
  monthlyBudget: z.number().min(0).nullable().optional(),
});

// PATCH /v1/orgs/me — update org settings (admin only)
orgsRouter.patch("/me", requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  const parsed = UpdateOrgSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
    return;
  }

  try {
    const update: Record<string, unknown> = {};
    if (parsed.data.monthlyBudget !== undefined) {
      update.monthlyBudget = parsed.data.monthlyBudget;
    }

    const org = await prisma.organization.update({
      where: { id: req.orgId },
      data: update,
      select: { id: true, name: true, plan: true, monthlyBudget: true },
    });

    res.json({ ...org, monthlyBudget: org.monthlyBudget ? Number(org.monthlyBudget) : null });
  } catch (err) {
    next(err);
  }
});

// GET /v1/orgs/me/members — list members with roles
orgsRouter.get("/me/members", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const members = await prisma.orgMember.findMany({
      where: { orgId: req.orgId },
      orderBy: { createdAt: "asc" },
    });
    res.json(members);
  } catch (err) {
    next(err);
  }
});
