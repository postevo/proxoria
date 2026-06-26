import { clerkClient } from "@clerk/clerk-sdk-node";
import { prisma } from "../lib/db.js";
import { logger } from "../lib/logger.js";
import { sendBudgetAlertEmail } from "./email.service.js";

// ─── Slack ────────────────────────────────────────────────────────────────────

async function sendSlackAlert(webhookUrl: string, text: string): Promise<void> {
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      logger.warn({ status: res.status }, "Slack webhook returned non-OK");
    }
  } catch (err) {
    logger.warn({ err }, "Failed to send Slack alert");
  }
}

// ─── Period helpers ───────────────────────────────────────────────────────────

function startOfCurrentMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function isAlreadyNotifiedThisPeriod(notifiedAt: Date | null): boolean {
  if (!notifiedAt) return false;
  const periodStart = startOfCurrentMonth();
  return notifiedAt >= periodStart;
}

// ─── Get admin email addresses for an org ────────────────────────────────────

async function getAdminEmails(orgId: string): Promise<string[]> {
  try {
    const adminMembers = await prisma.orgMember.findMany({
      where: { orgId, role: { in: ["OWNER", "ADMIN"] } },
    });
    const emails: string[] = [];
    for (const member of adminMembers) {
      try {
        const user = await clerkClient.users.getUser(member.userId);
        const primary = user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId);
        if (primary) emails.push(primary.emailAddress);
      } catch {
        // skip individual lookup failures
      }
    }
    return emails;
  } catch (err) {
    logger.warn({ err, orgId }, "Failed to fetch admin emails");
    return [];
  }
}

// ─── Core check logic ─────────────────────────────────────────────────────────

interface SpendCheck {
  orgId: string;
  orgName: string;
  slackWebhookUrl: string | null;
  scope: "org" | "project";
  scopeName: string;
  projectId: string | null;
  budget: number;
  spend: number;
  pct: number;
}

async function gatherSpendChecks(): Promise<SpendCheck[]> {
  const monthStart = startOfCurrentMonth();

  // All orgs with a budget set
  const orgs = await prisma.organization.findMany({
    where: { monthlyBudget: { not: null } },
    select: {
      id: true,
      name: true,
      monthlyBudget: true,
      slackWebhookUrl: true,
    },
  });

  // All projects with a budget set
  const projects = await prisma.project.findMany({
    where: { monthlyBudget: { not: null } },
    select: {
      id: true,
      name: true,
      monthlyBudget: true,
      orgId: true,
      org: { select: { name: true, slackWebhookUrl: true } },
    },
  });

  const checks: SpendCheck[] = [];

  // Org-level spend
  if (orgs.length > 0) {
    const orgSpendRows = await prisma.usageLog.groupBy({
      by: ["orgId"],
      where: {
        orgId: { in: orgs.map((o) => o.id) },
        createdAt: { gte: monthStart },
      },
      _sum: { costUsd: true },
    });

    const spendByOrg = new Map(orgSpendRows.map((r) => [r.orgId, Number(r._sum.costUsd ?? 0)]));

    for (const org of orgs) {
      const budget = Number(org.monthlyBudget);
      const spend = spendByOrg.get(org.id) ?? 0;
      checks.push({
        orgId: org.id,
        orgName: org.name,
        slackWebhookUrl: org.slackWebhookUrl,
        scope: "org",
        scopeName: org.name,
        projectId: null,
        budget,
        spend,
        pct: spend / budget,
      });
    }
  }

  // Project-level spend
  if (projects.length > 0) {
    const projectSpendRows = await prisma.usageLog.groupBy({
      by: ["projectId"],
      where: {
        projectId: { in: projects.map((p) => p.id) },
        createdAt: { gte: monthStart },
      },
      _sum: { costUsd: true },
    });

    const spendByProject = new Map(
      projectSpendRows.map((r) => [r.projectId!, Number(r._sum.costUsd ?? 0)]),
    );

    for (const project of projects) {
      const budget = Number(project.monthlyBudget);
      const spend = spendByProject.get(project.id) ?? 0;
      checks.push({
        orgId: project.orgId,
        orgName: project.org.name,
        slackWebhookUrl: project.org.slackWebhookUrl,
        scope: "project",
        scopeName: project.name,
        projectId: project.id,
        budget,
        spend,
        pct: spend / budget,
      });
    }
  }

  return checks;
}

// ─── Main entry point ─────────────────────────────────────────────────────────

export async function checkAndSendBudgetAlerts(): Promise<void> {
  logger.info("Running budget alert check");

  const checks = await gatherSpendChecks();
  if (checks.length === 0) {
    logger.info("No orgs/projects with budgets configured — skipping");
    return;
  }

  // Thresholds we notify at
  const THRESHOLDS = [0.8, 1.0];

  for (const check of checks) {
    for (const threshold of THRESHOLDS) {
      if (check.pct < threshold) continue;

      // Find or create the BudgetAlert record for this scope+threshold
      const existing = await prisma.budgetAlert.findFirst({
        where: {
          orgId: check.orgId,
          projectId: check.projectId ?? undefined,
          threshold: threshold,
          period: "MONTHLY",
        },
      });

      if (existing && isAlreadyNotifiedThisPeriod(existing.notifiedAt)) {
        logger.debug(
          { orgId: check.orgId, projectId: check.projectId, threshold },
          "Already notified this period — skipping",
        );
        continue;
      }

      // Send notifications
      const pctLabel = Math.round(threshold * 100) + "%";
      const spendLabel = `$${check.spend.toFixed(2)}`;
      const budgetLabel = `$${check.budget.toFixed(2)}`;
      const subject =
        threshold >= 1
          ? `Budget exceeded: ${check.scopeName} has spent ${spendLabel} of ${budgetLabel}`
          : `Budget alert: ${check.scopeName} has reached ${pctLabel} of ${budgetLabel}`;

      const adminEmails = await getAdminEmails(check.orgId);
      for (const email of adminEmails) {
        await sendBudgetAlertEmail(email, {
          orgName: check.orgName,
          scopeName: check.scopeName,
          scope: check.scope,
          threshold,
          spend: check.spend,
          budget: check.budget,
          pct: check.pct,
        });
      }

      if (check.slackWebhookUrl) {
        const icon = threshold >= 1 ? ":rotating_light:" : ":warning:";
        await sendSlackAlert(
          check.slackWebhookUrl,
          `${icon} *Budget alert for ${check.scopeName}*\n${subject}\nCurrent spend: ${spendLabel} / ${budgetLabel} (${Math.round(check.pct * 100)}%)`,
        );
      }

      // Upsert alert record and stamp notifiedAt
      if (existing) {
        await prisma.budgetAlert.update({
          where: { id: existing.id },
          data: { notifiedAt: new Date() },
        });
      } else {
        await prisma.budgetAlert.create({
          data: {
            orgId: check.orgId,
            projectId: check.projectId,
            threshold,
            period: "MONTHLY",
            notifiedAt: new Date(),
          },
        });
      }

      logger.info(
        { orgId: check.orgId, projectId: check.projectId, threshold, pct: check.pct },
        "Budget alert sent",
      );
    }
  }

  logger.info("Budget alert check complete");
}

// ─── Daily scheduler (runs at 06:00 UTC) ──────────────────────────────────────

export function scheduleDailyBudgetAlerts(): void {
  function msUntilNext6amUtc(): number {
    const now = new Date();
    const next = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 6, 0, 0, 0),
    );
    if (next.getTime() <= now.getTime()) {
      next.setUTCDate(next.getUTCDate() + 1);
    }
    return next.getTime() - now.getTime();
  }

  function tick() {
    checkAndSendBudgetAlerts().catch((err) =>
      logger.error({ err }, "Budget alert check failed"),
    );
    setTimeout(tick, 24 * 60 * 60 * 1000);
  }

  setTimeout(tick, msUntilNext6amUtc());
  logger.info("Daily budget alert scheduler started (fires at 06:00 UTC)");
}
