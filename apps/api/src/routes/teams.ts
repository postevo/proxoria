import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { clerkClient } from "@clerk/clerk-sdk-node";
import { prisma } from "../lib/db.js";
import { NotFoundError, ForbiddenError } from "../lib/errors.js";
import { requireAdmin } from "../middleware/auth.js";

export const teamsRouter = Router();

// GET /v1/teams/members
teamsRouter.get("/members", async (req: Request, res: Response, next: NextFunction) => {
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

const InviteSchema = z.object({
  emailAddress: z.string().email(),
  role: z.enum(["org:admin", "org:member", "org:viewer"]).default("org:member"),
});

// POST /v1/teams/invite — send Clerk org invitation
teamsRouter.post("/invite", requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  const parsed = InviteSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
    return;
  }

  try {
    const org = await prisma.organization.findUnique({ where: { id: req.orgId } });
    if (!org?.clerkOrgId) throw new NotFoundError("Organization");

    const invitation = await clerkClient.organizations.createOrganizationInvitation({
      organizationId: org.clerkOrgId,
      emailAddress: parsed.data.emailAddress,
      role: parsed.data.role,
      inviterUserId: req.userId!,
    });

    await prisma.auditLog.create({
      data: {
        orgId: req.orgId,
        actorId: req.userId!,
        actorType: "user",
        action: "member.invited",
        metadata: { emailAddress: parsed.data.emailAddress, role: parsed.data.role },
      },
    });

    res.status(201).json({ id: invitation.id, emailAddress: parsed.data.emailAddress });
  } catch (err) {
    next(err);
  }
});

// DELETE /v1/teams/members/:userId — remove member
teamsRouter.delete(
  "/members/:userId",
  requireAdmin,
  async (req: Request, res: Response, next: NextFunction) => {
    const targetUserId = req.params.userId;
    if (targetUserId === req.userId) {
      res.status(400).json({ error: "Cannot remove yourself from the organization" });
      return;
    }

    try {
      const org = await prisma.organization.findUnique({ where: { id: req.orgId } });
      if (!org?.clerkOrgId) throw new NotFoundError("Organization");

      const member = await prisma.orgMember.findUnique({
        where: { orgId_userId: { orgId: req.orgId, userId: targetUserId } },
      });
      if (!member) throw new NotFoundError("Member");

      await clerkClient.organizations.deleteOrganizationMembership({
        organizationId: org.clerkOrgId,
        userId: targetUserId,
      });

      // The webhook will handle DB cleanup; optimistically delete here too
      await prisma.orgMember.delete({
        where: { orgId_userId: { orgId: req.orgId, userId: targetUserId } },
      });

      await prisma.auditLog.create({
        data: {
          orgId: req.orgId,
          actorId: req.userId!,
          actorType: "user",
          action: "member.removed",
          targetId: targetUserId,
          targetType: "user",
        },
      });

      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },
);

// GET /v1/teams/projects
teamsRouter.get("/projects", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projects = await prisma.project.findMany({
      where: { orgId: req.orgId },
      orderBy: { createdAt: "desc" },
    });
    res.json(projects);
  } catch (err) {
    next(err);
  }
});

const CreateProjectSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  monthlyBudget: z.number().positive().optional(),
});

// POST /v1/teams/projects
teamsRouter.post(
  "/projects",
  requireAdmin,
  async (req: Request, res: Response, next: NextFunction) => {
    const parsed = CreateProjectSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
      return;
    }

    try {
      const project = await prisma.project.create({
        data: { orgId: req.orgId, ...parsed.data },
      });
      res.status(201).json(project);
    } catch (err) {
      next(err);
    }
  },
);
