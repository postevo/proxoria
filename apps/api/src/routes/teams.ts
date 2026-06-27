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

const BudgetSchema = z.object({
  monthlyBudget: z.number().positive().nullable().optional(),
  thresholds: z.array(z.number().min(0.01).max(2)).optional(),
  projectId: z.string().optional(),
});

// POST /v1/teams/budget — set budget and alert thresholds for org or project
teamsRouter.post(
  "/budget",
  requireAdmin,
  async (req: Request, res: Response, next: NextFunction) => {
    const parsed = BudgetSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
      return;
    }

    const { monthlyBudget, thresholds, projectId } = parsed.data;

    try {
      // Update budget on org or project
      if (projectId) {
        const project = await prisma.project.findFirst({
          where: { id: projectId, orgId: req.orgId },
        });
        if (!project) {
          res.status(404).json({ error: "Project not found" });
          return;
        }
        if (monthlyBudget !== undefined) {
          await prisma.project.update({
            where: { id: projectId },
            data: { monthlyBudget: monthlyBudget ?? null },
          });
        }
      } else {
        if (monthlyBudget !== undefined) {
          await prisma.organization.update({
            where: { id: req.orgId },
            data: { monthlyBudget: monthlyBudget ?? null },
          });
        }
      }

      // Sync alert thresholds if provided
      if (thresholds !== undefined) {
        // Remove existing thresholds not in the new list
        await prisma.budgetAlert.deleteMany({
          where: {
            orgId: req.orgId,
            projectId: projectId ?? null,
            threshold: { notIn: thresholds },
          },
        });

        // Create any missing thresholds (preserve existing ones and their notifiedAt)
        for (const t of thresholds) {
          const existing = await prisma.budgetAlert.findFirst({
            where: { orgId: req.orgId, projectId: projectId ?? null, threshold: t },
          });
          if (!existing) {
            await prisma.budgetAlert.create({
              data: {
                orgId: req.orgId,
                projectId: projectId ?? null,
                threshold: t,
                period: "MONTHLY",
              },
            });
          }
        }
      }

      const alerts = await prisma.budgetAlert.findMany({
        where: { orgId: req.orgId, projectId: projectId ?? null },
        orderBy: { threshold: "asc" },
      });

      res.json({
        orgId: req.orgId,
        projectId: projectId ?? null,
        monthlyBudget,
        alerts: alerts.map((a) => ({
          id: a.id,
          threshold: Number(a.threshold),
          notifiedAt: a.notifiedAt,
          period: a.period,
        })),
      });
    } catch (err) {
      next(err);
    }
  },
);

// GET /v1/teams/budget — get current budget settings and alert thresholds
teamsRouter.get(
  "/budget",
  async (req: Request, res: Response, next: NextFunction) => {
    const { projectId } = req.query;

    try {
      const [org, alerts] = await Promise.all([
        prisma.organization.findUnique({
          where: { id: req.orgId },
          select: { monthlyBudget: true, slackWebhookUrl: true },
        }),
        prisma.budgetAlert.findMany({
          where: { orgId: req.orgId, projectId: (projectId as string) ?? null },
          orderBy: { threshold: "asc" },
        }),
      ]);

      let projectBudget: number | null = null;
      if (projectId) {
        const project = await prisma.project.findFirst({
          where: { id: projectId as string, orgId: req.orgId },
          select: { monthlyBudget: true },
        });
        projectBudget = project?.monthlyBudget ? Number(project.monthlyBudget) : null;
      }

      res.json({
        orgMonthlyBudget: org?.monthlyBudget ? Number(org.monthlyBudget) : null,
        slackAlertEnabled: !!org?.slackWebhookUrl,
        projectMonthlyBudget: projectBudget,
        alerts: alerts.map((a) => ({
          id: a.id,
          threshold: Number(a.threshold),
          notifiedAt: a.notifiedAt,
          period: a.period,
          projectId: a.projectId,
        })),
      });
    } catch (err) {
      next(err);
    }
  },
);
