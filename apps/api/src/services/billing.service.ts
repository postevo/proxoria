import Stripe from "stripe";
import { prisma } from "../lib/db.js";
import { logger } from "../lib/logger.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-06-20",
});

export const PLAN_PRICE_IDS: Record<string, string | undefined> = {
  STARTER: process.env.STRIPE_STARTER_PRICE_ID,
  PRO: process.env.STRIPE_PRO_PRICE_ID,
};

export const PLAN_OVERAGE_PRICE_IDS: Record<string, string | undefined> = {
  STARTER: process.env.STRIPE_STARTER_OVERAGE_PRICE_ID,
  PRO: process.env.STRIPE_PRO_OVERAGE_PRICE_ID,
};

// 14-day trial for new subscriptions
const TRIAL_DAYS = 14;

export async function getOrCreateStripeCustomer(orgId: string): Promise<string> {
  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: orgId },
    select: { stripeCustomerId: true, name: true, slug: true },
  });

  if (org.stripeCustomerId) return org.stripeCustomerId;

  const customer = await stripe.customers.create({
    name: org.name,
    metadata: { orgId, slug: org.slug },
  });

  await prisma.organization.update({
    where: { id: orgId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

export async function createCheckoutSession(
  orgId: string,
  plan: "STARTER" | "PRO",
  successUrl: string,
  cancelUrl: string,
): Promise<string> {
  const priceId = PLAN_PRICE_IDS[plan];
  if (!priceId) {
    throw new Error(`Stripe price ID not configured for plan: ${plan}`);
  }

  const customerId = await getOrCreateStripeCustomer(orgId);
  const overagePriceId = PLAN_OVERAGE_PRICE_IDS[plan];

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    { price: priceId, quantity: 1 },
  ];

  if (overagePriceId) {
    lineItems.push({ price: overagePriceId });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: lineItems,
    success_url: successUrl,
    cancel_url: cancelUrl,
    subscription_data: {
      trial_period_days: TRIAL_DAYS,
      metadata: { orgId, plan },
    },
    allow_promotion_codes: true,
    billing_address_collection: "auto",
  });

  return session.url!;
}

export async function createPortalSession(orgId: string, returnUrl: string): Promise<string> {
  const customerId = await getOrCreateStripeCustomer(orgId);

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session.url;
}

export async function getSubscriptionStatus(orgId: string) {
  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: orgId },
    select: {
      plan: true,
      subscriptionStatus: true,
      stripeSubscriptionId: true,
      trialEndsAt: true,
      currentPeriodEnd: true,
      cancelAtPeriodEnd: true,
      stripeCustomerId: true,
    },
  });

  return org;
}

export async function getInvoices(orgId: string) {
  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: orgId },
    select: { stripeCustomerId: true },
  });

  if (!org.stripeCustomerId) return [];

  const invoices = await stripe.invoices.list({
    customer: org.stripeCustomerId,
    limit: 24,
  });

  return invoices.data.map((inv) => ({
    id: inv.id,
    number: inv.number,
    status: inv.status,
    amountPaid: inv.amount_paid,
    amountDue: inv.amount_due,
    currency: inv.currency,
    periodStart: new Date(inv.period_start * 1000).toISOString(),
    periodEnd: new Date(inv.period_end * 1000).toISOString(),
    pdfUrl: inv.invoice_pdf,
    hostedUrl: inv.hosted_invoice_url,
    createdAt: new Date(inv.created * 1000).toISOString(),
  }));
}

export async function reportUsageOverage(
  orgId: string,
  tokens: number,
): Promise<void> {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { stripeSubscriptionId: true, plan: true },
  });

  if (!org?.stripeSubscriptionId) return;

  const overagePriceId = PLAN_OVERAGE_PRICE_IDS[org.plan];
  if (!overagePriceId) return;

  try {
    const subscription = await stripe.subscriptions.retrieve(org.stripeSubscriptionId);
    const overageItem = subscription.items.data.find(
      (item) => item.price.id === overagePriceId,
    );

    if (!overageItem) return;

    await stripe.subscriptionItems.createUsageRecord(overageItem.id, {
      quantity: tokens,
      timestamp: Math.floor(Date.now() / 1000),
      action: "increment",
    });
  } catch (err) {
    logger.warn({ err, orgId }, "Failed to report usage overage to Stripe");
  }
}

export async function handleWebhookEvent(
  rawBody: Buffer,
  signature: string,
): Promise<void> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET not configured");

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    throw new Error(`Webhook signature verification failed: ${err}`);
  }

  // Idempotency check
  const alreadyProcessed = await prisma.stripeEvent.findUnique({
    where: { id: event.id },
  });
  if (alreadyProcessed) {
    logger.info({ eventId: event.id, type: event.type }, "Stripe event already processed, skipping");
    return;
  }

  logger.info({ eventId: event.id, type: event.type }, "Processing Stripe webhook");

  let orgId: string | undefined;

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      orgId = sub.metadata.orgId;
      if (!orgId) break;

      const plan = (sub.metadata.plan as "STARTER" | "PRO") || "STARTER";
      const status = mapStripeStatus(sub.status);

      await prisma.organization.update({
        where: { id: orgId },
        data: {
          plan,
          stripeSubscriptionId: sub.id,
          subscriptionStatus: status,
          trialEndsAt: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
          currentPeriodEnd: new Date(sub.current_period_end * 1000),
          cancelAtPeriodEnd: sub.cancel_at_period_end,
        },
      });
      logger.info({ orgId, plan, status }, "Subscription updated");
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      orgId = sub.metadata.orgId;
      if (!orgId) break;

      await prisma.organization.update({
        where: { id: orgId },
        data: {
          plan: "FREE",
          stripeSubscriptionId: null,
          subscriptionStatus: "CANCELED",
          cancelAtPeriodEnd: false,
        },
      });
      logger.info({ orgId }, "Subscription canceled");
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = typeof invoice.customer === "string"
        ? invoice.customer
        : invoice.customer?.id;
      if (!customerId) break;

      const org = await prisma.organization.findUnique({
        where: { stripeCustomerId: customerId },
      });
      if (!org) break;
      orgId = org.id;

      await prisma.organization.update({
        where: { id: orgId },
        data: { subscriptionStatus: "PAST_DUE" },
      });
      logger.warn({ orgId, invoiceId: invoice.id }, "Payment failed — access suspended");
      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = typeof invoice.customer === "string"
        ? invoice.customer
        : invoice.customer?.id;
      if (!customerId) break;

      const org = await prisma.organization.findUnique({
        where: { stripeCustomerId: customerId },
        select: { id: true, subscriptionStatus: true },
      });
      if (!org) break;
      orgId = org.id;

      if (org.subscriptionStatus === "PAST_DUE" || org.subscriptionStatus === "UNPAID") {
        await prisma.organization.update({
          where: { id: orgId },
          data: { subscriptionStatus: "ACTIVE" },
        });
        logger.info({ orgId }, "Payment succeeded — access restored");
      }
      break;
    }

    default:
      logger.debug({ type: event.type }, "Unhandled Stripe webhook event");
  }

  await prisma.stripeEvent.create({
    data: { id: event.id, orgId, type: event.type },
  });
}

function mapStripeStatus(
  stripeStatus: Stripe.Subscription.Status,
): "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED" | "UNPAID" | "PAUSED" {
  switch (stripeStatus) {
    case "trialing":   return "TRIALING";
    case "active":     return "ACTIVE";
    case "past_due":   return "PAST_DUE";
    case "canceled":   return "CANCELED";
    case "unpaid":     return "UNPAID";
    case "paused":     return "PAUSED";
    default:           return "ACTIVE";
  }
}
