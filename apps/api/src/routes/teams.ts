import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../lib/db.js";
import { NotFoundError } from "../lib/errors.js";

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
teamsRouter.post("/projects", async (req: Request, res: Response, next: NextFunction) => {
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
});
