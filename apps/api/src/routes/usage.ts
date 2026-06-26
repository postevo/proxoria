import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../lib/db.js";

export const usageRouter = Router();

// GET /v1/usage - aggregated usage stats
usageRouter.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { period = "month", projectId } = req.query;

    const now = new Date();
    let since: Date;
    if (period === "day") {
      since = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === "week") {
      since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else {
      since = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const [totalAgg, byProvider, byDay] = await Promise.all([
      prisma.usageLog.aggregate({
        where: {
          orgId: req.orgId,
          ...(projectId && { projectId: String(projectId) }),
          createdAt: { gte: since },
        },
        _sum: { costUsd: true, totalTokens: true },
        _count: true,
      }),
      prisma.usageLog.groupBy({
        by: ["provider"],
        where: {
          orgId: req.orgId,
          ...(projectId && { projectId: String(projectId) }),
          createdAt: { gte: since },
        },
        _sum: { costUsd: true, totalTokens: true },
        _count: true,
      }),
      prisma.$queryRaw`
        SELECT DATE_TRUNC('day', "createdAt") as day,
               SUM("costUsd") as cost,
               SUM("totalTokens") as tokens,
               COUNT(*) as requests
        FROM "UsageLog"
        WHERE "orgId" = ${req.orgId}
          AND "createdAt" >= ${since}
        GROUP BY day
        ORDER BY day ASC
      `,
    ]);

    res.json({
      period,
      since,
      total: {
        requests: totalAgg._count,
        tokens: Number(totalAgg._sum.totalTokens || 0),
        costUsd: Number(totalAgg._sum.costUsd || 0),
      },
      byProvider: byProvider.map((p) => ({
        provider: p.provider.toLowerCase(),
        requests: p._count,
        tokens: Number(p._sum.totalTokens || 0),
        costUsd: Number(p._sum.costUsd || 0),
      })),
      byDay,
    });
  } catch (err) {
    next(err);
  }
});

// GET /v1/usage/logs - raw log entries with pagination
usageRouter.get("/logs", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.usageLog.findMany({
        where: { orgId: req.orgId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          provider: true,
          model: true,
          promptTokens: true,
          completionTokens: true,
          totalTokens: true,
          costUsd: true,
          latencyMs: true,
          statusCode: true,
          createdAt: true,
          projectId: true,
        },
      }),
      prisma.usageLog.count({ where: { orgId: req.orgId } }),
    ]);

    res.json({ data: logs, total, page, limit });
  } catch (err) {
    next(err);
  }
});
