import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../lib/db.js";

export const auditRouter = Router();

// GET /v1/audit/logs
auditRouter.get("/logs", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: { orgId: req.orgId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where: { orgId: req.orgId } }),
    ]);

    res.json({ data: logs, total, page, limit });
  } catch (err) {
    next(err);
  }
});
