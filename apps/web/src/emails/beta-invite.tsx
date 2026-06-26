import type React from "react";

/**
 * Beta invite email template for the first 5 beta customers.
 *
 * Usage: render this component to HTML with a library like `@react-email/render`
 * and send via your transactional email provider (Resend, Postmark, etc.).
 *
 * Variables to fill in before sending:
 *   - recipientName: customer's first name
 *   - apiKey: their pre-provisioned gateway API key (ak_live_...)
 *   - slackInviteUrl: single-use Slack invite link
 */

export interface BetaInviteProps {
  recipientName: string;
  apiKey: string;
  slackInviteUrl: string;
}

export function BetaInviteEmail({ recipientName, apiKey, slackInviteUrl }: BetaInviteProps) {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Welcome to the AI Gateway beta</title>
      </head>
      <body style={styles.body}>
        <div style={styles.container}>
          {/* Header */}
          <div style={styles.header}>
            <p style={styles.logo}>AI Gateway</p>
          </div>

          {/* Content */}
          <div style={styles.content}>
            <h1 style={styles.heading}>Welcome to the AI Gateway beta, {recipientName}.</h1>

            <p style={styles.paragraph}>
              You&apos;re one of the first five customers to access AI Gateway — a unified control plane
              for Claude, GPT-4, and Gemini. Thank you for joining us early.
            </p>

            <p style={styles.paragraph}>
              Here&apos;s everything you need to make your first call in under 5 minutes.
            </p>

            <hr style={styles.divider} />

            {/* Step 1 */}
            <h2 style={styles.subheading}>1. Your API key</h2>
            <p style={styles.paragraph}>
              We&apos;ve pre-provisioned a gateway API key for you. Keep it secret — treat it like a
              password. You can rotate or revoke it any time from the dashboard.
            </p>
            <div style={styles.codeBlock}>
              <code style={styles.code}>{apiKey}</code>
            </div>

            {/* Step 2 */}
            <h2 style={styles.subheading}>2. Store your provider key</h2>
            <p style={styles.paragraph}>
              The gateway routes requests through your own Anthropic / OpenAI / Google API key
              (BYOK). Add one from <strong>Settings → AI Providers</strong> in the dashboard, or via cURL:
            </p>
            <div style={styles.codeBlock}>
              <code style={styles.code}>
                {`curl -X PUT https://api.ai-gateway.dev/v1/provider-keys/anthropic \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"key": "sk-ant-api03-..."}'`}
              </code>
            </div>

            {/* Step 3 */}
            <h2 style={styles.subheading}>3. Make your first call</h2>
            <div style={styles.codeBlock}>
              <code style={styles.code}>
                {`curl -X POST https://api.ai-gateway.dev/v1/gateway/chat \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "provider": "anthropic",
    "model": "claude-sonnet-4-6",
    "messages": [{"role":"user","content":"Hello!"}]
  }'`}
              </code>
            </div>
            <p style={styles.paragraph}>
              Full quickstart with Python and Node.js examples →{" "}
              <a href="https://ai-gateway.dev/docs/quickstart" style={styles.link}>
                ai-gateway.dev/docs/quickstart
              </a>
            </p>

            <hr style={styles.divider} />

            {/* CTA */}
            <div style={styles.ctaBlock}>
              <a href="https://ai-gateway.dev/dashboard" style={styles.ctaButton}>
                Open dashboard
              </a>
            </div>

            <hr style={styles.divider} />

            {/* Slack */}
            <h2 style={styles.subheading}>Join our beta Slack</h2>
            <p style={styles.paragraph}>
              As a beta customer you have direct access to the founding team. Join our private
              Slack channel for real-time support, feature previews, and to shape the roadmap.
            </p>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <a href={slackInviteUrl} style={styles.ctaButtonOutline}>
                Join Slack (#beta-support)
              </a>
            </div>

            <p style={styles.paragraph}>
              You can also reach us at{" "}
              <a href="mailto:support@ai-gateway.dev" style={styles.link}>
                support@ai-gateway.dev
              </a>{" "}
              any time.
            </p>
          </div>

          {/* Footer */}
          <div style={styles.footer}>
            <p style={styles.footerText}>
              AI Gateway · Built for enterprise AI teams ·{" "}
              <a href="https://ai-gateway.dev" style={styles.footerLink}>
                ai-gateway.dev
              </a>
            </p>
            <p style={styles.footerText}>
              You received this because you signed up for the AI Gateway beta program.
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}

const styles = {
  body: {
    backgroundColor: "#f9fafb",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    margin: 0,
    padding: "40px 16px",
  } as React.CSSProperties,
  container: {
    maxWidth: 560,
    margin: "0 auto",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    overflow: "hidden",
  } as React.CSSProperties,
  header: {
    backgroundColor: "#111827",
    padding: "20px 32px",
  } as React.CSSProperties,
  logo: {
    color: "#ffffff",
    fontWeight: 700,
    fontSize: 18,
    margin: 0,
  } as React.CSSProperties,
  content: {
    padding: "32px 32px 24px",
  } as React.CSSProperties,
  heading: {
    fontSize: 22,
    fontWeight: 700,
    color: "#111827",
    margin: "0 0 16px",
    lineHeight: 1.3,
  } as React.CSSProperties,
  subheading: {
    fontSize: 15,
    fontWeight: 600,
    color: "#111827",
    margin: "24px 0 8px",
  } as React.CSSProperties,
  paragraph: {
    fontSize: 14,
    color: "#4b5563",
    lineHeight: 1.6,
    margin: "0 0 16px",
  } as React.CSSProperties,
  codeBlock: {
    backgroundColor: "#111827",
    borderRadius: 8,
    padding: "12px 16px",
    marginBottom: 16,
    overflowX: "auto" as const,
  } as React.CSSProperties,
  code: {
    fontFamily: "ui-monospace, 'Cascadia Code', 'Source Code Pro', monospace",
    fontSize: 12,
    color: "#e5e7eb",
    whiteSpace: "pre" as const,
    display: "block",
  } as React.CSSProperties,
  divider: {
    border: "none",
    borderTop: "1px solid #f3f4f6",
    margin: "24px 0",
  } as React.CSSProperties,
  ctaBlock: {
    textAlign: "center" as const,
    marginBottom: 24,
  } as React.CSSProperties,
  ctaButton: {
    display: "inline-block",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    fontWeight: 600,
    fontSize: 14,
    padding: "12px 28px",
    borderRadius: 8,
    textDecoration: "none",
  } as React.CSSProperties,
  ctaButtonOutline: {
    display: "inline-block",
    backgroundColor: "transparent",
    color: "#2563eb",
    fontWeight: 600,
    fontSize: 14,
    padding: "10px 24px",
    borderRadius: 8,
    textDecoration: "none",
    border: "1.5px solid #2563eb",
  } as React.CSSProperties,
  link: {
    color: "#2563eb",
    textDecoration: "underline",
  } as React.CSSProperties,
  footer: {
    backgroundColor: "#f9fafb",
    borderTop: "1px solid #e5e7eb",
    padding: "16px 32px",
  } as React.CSSProperties,
  footerText: {
    fontSize: 12,
    color: "#9ca3af",
    margin: "0 0 4px",
  } as React.CSSProperties,
  footerLink: {
    color: "#9ca3af",
  } as React.CSSProperties,
};
