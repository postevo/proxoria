import { logger } from "../lib/logger.js";

const RESEND_API_URL = "https://api.resend.com/emails";

async function sendEmail(to: string, subject: string, html: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    logger.warn("RESEND_API_KEY not configured — skipping email");
    return;
  }

  const from =
    process.env.EMAIL_FROM || "AI Gateway <onboarding@resend.dev>";

  try {
    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, html }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      logger.error({ body }, "Resend API error");
    } else {
      logger.info({ to, subject }, "Email sent");
    }
  } catch (err) {
    logger.error({ err, to, subject }, "Failed to send email");
  }
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

const baseStyle = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #f9fafb;
  margin: 0; padding: 0;
`;

function layout(body: string) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="${baseStyle}">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
    <div style="background:#2563eb;padding:24px 32px;">
      <span style="color:#fff;font-size:20px;font-weight:700;">AI Gateway</span>
    </div>
    <div style="padding:32px;">
      ${body}
    </div>
    <div style="padding:16px 32px;background:#f9fafb;border-top:1px solid #f3f4f6;">
      <p style="margin:0;font-size:12px;color:#9ca3af;">
        You're receiving this because you signed up for AI Gateway beta.
        Questions? Reply to this email or reach us at <a href="mailto:support@ai-gateway.dev" style="color:#2563eb;">support@ai-gateway.dev</a>
      </p>
    </div>
  </div>
</body></html>`;
}

function h1(text: string) {
  return `<h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#111827;">${text}</h1>`;
}

function p(text: string) {
  return `<p style="margin:16px 0;font-size:15px;color:#374151;line-height:1.6;">${text}</p>`;
}

function cta(text: string, url: string) {
  return `<a href="${url}" style="display:inline-block;margin:16px 0;padding:12px 24px;background:#2563eb;color:#fff;font-size:15px;font-weight:600;border-radius:8px;text-decoration:none;">${text}</a>`;
}

function codeBlock(code: string) {
  return `<pre style="background:#1f2937;color:#d1fae5;border-radius:8px;padding:16px;font-size:12px;overflow:auto;font-family:monospace;">${code}</pre>`;
}

function tip(icon: string, title: string, desc: string) {
  return `<div style="display:flex;gap:12px;margin:12px 0;padding:12px;background:#f9fafb;border-radius:8px;">
    <span style="font-size:20px;">${icon}</span>
    <div><strong style="font-size:14px;color:#111827;">${title}</strong><br><span style="font-size:13px;color:#6b7280;">${desc}</span></div>
  </div>`;
}

// ---------------------------------------------------------------------------
// Email 1: Welcome (sent on user.created)
// ---------------------------------------------------------------------------

function welcomeEmailHtml(firstName?: string) {
  const name = firstName || "there";
  const dashUrl = process.env.NEXT_PUBLIC_FRONTEND_URL
    ? `${process.env.NEXT_PUBLIC_FRONTEND_URL}/onboarding`
    : "https://app.ai-gateway.dev/onboarding";

  return layout(`
    ${h1(`Welcome to AI Gateway, ${name}!`)}
    ${p("You're in beta — thanks for being an early adopter. You now have access to a unified AI gateway that routes requests to Claude, GPT-4, and Gemini with a single API key.")}
    ${p("Here's what you can do:")}
    ${tip("🔑", "BYOK model", "Bring your own provider API keys — your keys, your costs, full control.")}
    ${tip("📊", "Usage & cost tracking", "Every call is logged with token counts, latency, and cost breakdowns.")}
    ${tip("💰", "Budget alerts", "Set monthly spend caps per org to avoid surprise bills.")}
    ${tip("👥", "Team access", "Invite teammates and manage roles from the dashboard.")}
    ${p("Ready to make your first AI call?")}
    ${cta("Complete onboarding →", dashUrl)}
    ${p("The whole setup takes under 5 minutes. If you hit any snag, just reply to this email — we respond within a few hours.")}
    <p style="margin:24px 0 0;font-size:14px;color:#6b7280;">– Sam<br>Founder, AI Gateway</p>
  `);
}

// ---------------------------------------------------------------------------
// Email 2: Activation (sent on organization.created)
// ---------------------------------------------------------------------------

function activationEmailHtml(orgName: string) {
  const setupUrl = process.env.NEXT_PUBLIC_FRONTEND_URL
    ? `${process.env.NEXT_PUBLIC_FRONTEND_URL}/onboarding/setup`
    : "https://app.ai-gateway.dev/onboarding/setup";

  return layout(`
    ${h1(`"${orgName}" is ready 🎉`)}
    ${p("Your organization has been created. The next step is to connect your first AI provider and generate a gateway API key.")}
    ${p("The setup wizard walks you through 3 steps:")}
    <ol style="margin:12px 0;padding-left:20px;color:#374151;font-size:15px;line-height:2;">
      <li>Add your Anthropic / OpenAI / Google API key (encrypted at rest)</li>
      <li>Create a gateway key for your app</li>
      <li>Make your first AI call</li>
    </ol>
    ${cta("Complete setup →", setupUrl)}
    ${p("Once you have your gateway key, making an AI call is as simple as:")}
    ${codeBlock(`curl -X POST https://api.ai-gateway.dev/v1/gateway/chat \\
  -H "Authorization: Bearer ak_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{"provider":"anthropic","model":"claude-haiku-4-5-20251001",
       "messages":[{"role":"user","content":"Hello!"}]}'`)}
    ${p("Questions? Hit reply — we're happy to help.")}
    <p style="margin:24px 0 0;font-size:14px;color:#6b7280;">– Sam<br>Founder, AI Gateway</p>
  `);
}

// ---------------------------------------------------------------------------
// Email 3: Usage tips (sent D+3 after first call — trigger externally)
// ---------------------------------------------------------------------------

function usageTipsEmailHtml() {
  const dashUrl = process.env.NEXT_PUBLIC_FRONTEND_URL
    ? `${process.env.NEXT_PUBLIC_FRONTEND_URL}/dashboard`
    : "https://app.ai-gateway.dev/dashboard";

  return layout(`
    ${h1("5 tips to get the most out of AI Gateway")}
    ${p("You've made your first call — here are a few things power users do to get more value:")}
    ${tip("📉", "Use model fallbacks", "Start with claude-haiku-4-5 or gpt-4o-mini for cheap tasks. Only reach for claude-opus-4-8 when quality matters.")}
    ${tip("🔑", "Create scoped keys", "Give each environment (dev/staging/prod) its own API key so you can rotate or revoke independently.")}
    ${tip("📊", "Set budget alerts", "Under Settings → Budget, cap monthly spend so you're never surprised at end of month.")}
    ${tip("👥", "Invite your team", "Team members can view usage and share a gateway key without accessing billing or provider credentials.")}
    ${tip("📥", "Query logs via API", 'GET /v1/usage/logs returns raw call logs with provider, model, tokens, cost, and latency — pipe into your own dashboards.')}
    ${cta("View your dashboard →", dashUrl)}
    ${p("Anything you'd like to see in the product? Reply here — beta feedback shapes the roadmap directly.")}
    <p style="margin:24px 0 0;font-size:14px;color:#6b7280;">– Sam<br>Founder, AI Gateway</p>
  `);
}

// ---------------------------------------------------------------------------
// Email 4: Budget alert
// ---------------------------------------------------------------------------

interface BudgetAlertParams {
  orgName: string;
  scopeName: string;
  scope: "org" | "project";
  threshold: number;
  spend: number;
  budget: number;
  pct: number;
}

function budgetAlertHtml(params: BudgetAlertParams) {
  const { orgName, scopeName, scope, threshold, spend, budget, pct } = params;
  const pctDisplay = Math.round(pct * 100);
  const exceeded = threshold >= 1;
  const dashUrl = process.env.NEXT_PUBLIC_FRONTEND_URL
    ? `${process.env.NEXT_PUBLIC_FRONTEND_URL}/dashboard/billing`
    : "https://app.ai-gateway.dev/dashboard/billing";

  const scopeLabel = scope === "project" ? `project <strong>${scopeName}</strong>` : `organization <strong>${orgName}</strong>`;

  return layout(`
    ${h1(exceeded ? `Budget exceeded` : `Budget alert: ${Math.round(threshold * 100)}% reached`)}
    ${p(exceeded
      ? `Your ${scopeLabel} has <strong>exceeded its monthly budget</strong>. Current spend is <strong>$${spend.toFixed(2)}</strong> against a budget of <strong>$${budget.toFixed(2)}</strong>.`
      : `Your ${scopeLabel} has reached <strong>${pctDisplay}%</strong> of its monthly budget. Current spend is <strong>$${spend.toFixed(2)}</strong> of <strong>$${budget.toFixed(2)}</strong>.`
    )}
    <div style="margin:24px 0;padding:16px;background:#fef3c7;border:1px solid #fbbf24;border-radius:8px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <span style="font-size:14px;font-weight:600;color:#92400e;">Monthly spend</span>
        <span style="font-size:14px;font-weight:700;color:#92400e;">$${spend.toFixed(2)} / $${budget.toFixed(2)}</span>
      </div>
      <div style="background:#e5e7eb;border-radius:4px;height:8px;overflow:hidden;">
        <div style="background:${exceeded ? "#ef4444" : "#f59e0b"};height:100%;width:${Math.min(pctDisplay, 100)}%;"></div>
      </div>
      <div style="text-align:right;margin-top:4px;font-size:12px;color:#92400e;">${pctDisplay}%</div>
    </div>
    ${p("You can adjust your budget limits or review usage details in the billing dashboard.")}
    ${cta("View billing dashboard →", dashUrl)}
    <p style="margin:16px 0 0;font-size:13px;color:#6b7280;">To stop receiving these alerts, set your budget to unlimited in the dashboard.</p>
  `);
}

// ---------------------------------------------------------------------------
// Exported functions
// ---------------------------------------------------------------------------

export async function sendWelcomeEmail(to: string, firstName?: string) {
  await sendEmail(to, "Welcome to AI Gateway 🎉", welcomeEmailHtml(firstName));
}

export async function sendActivationEmail(to: string, orgName: string) {
  await sendEmail(to, `Your AI Gateway org "${orgName}" is ready`, activationEmailHtml(orgName));
}

export async function sendUsageTipsEmail(to: string) {
  await sendEmail(to, "5 tips to get the most out of AI Gateway", usageTipsEmailHtml());
}

export async function sendBudgetAlertEmail(to: string, params: BudgetAlertParams) {
  const threshold = params.threshold;
  const subject =
    threshold >= 1
      ? `Budget exceeded: ${params.scopeName} has spent $${params.spend.toFixed(2)} of $${params.budget.toFixed(2)}`
      : `Budget alert: ${params.scopeName} has reached ${Math.round(threshold * 100)}% of budget`;
  await sendEmail(to, subject, budgetAlertHtml(params));
}
