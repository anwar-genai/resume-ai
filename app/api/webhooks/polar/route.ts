import prisma from "@/lib/db";
import { planForProductId, productIdFromEvent } from "@/lib/polar";
import { validateEvent, WebhookVerificationError } from "@polar-sh/sdk/webhooks";

// Polar delivers webhooks using the Standard Webhooks spec, so we verify the
// signature with the secret from the webhook endpoint you created in Polar.
//
// Local testing: expose this route with a tunnel (e.g. cloudflared) and set the
// tunnel URL + `/api/webhooks/polar` as the endpoint in Polar (sandbox).

export async function POST(req: Request) {
  const body = await req.text();
  const headers = {
    "webhook-id": req.headers.get("webhook-id") ?? "",
    "webhook-timestamp": req.headers.get("webhook-timestamp") ?? "",
    "webhook-signature": req.headers.get("webhook-signature") ?? "",
  };

  let event: any;
  try {
    event = validateEvent(body, headers, process.env.POLAR_WEBHOOK_SECRET ?? "");
  } catch (err) {
    if (err instanceof WebhookVerificationError) {
      return new Response("Invalid signature", { status: 403 });
    }
    console.error("Polar webhook parse error:", err);
    return new Response("Bad request", { status: 400 });
  }

  try {
    switch (event.type) {
      case "subscription.created":
      case "subscription.active": {
        // First activation — grant Pro and a fresh allowance.
        if (event.data.status === "active") await upgradeUser(event.data, true);
        break;
      }
      case "subscription.updated": {
        // Keep plan state in sync, but DON'T reset usage on every update
        // (otherwise a card change etc. would hand out free resets).
        const sub = event.data;
        if (sub.status === "active" && sub.cancelAtPeriodEnd) {
          // Cancel-at-period-end keeps status "active" but should show the
          // "Pro ends on X" banner — don't let this flip status back to active.
          await markCanceled(sub);
        } else if (sub.status === "active") {
          await upgradeUser(sub, false);
        } else if (sub.status === "canceled") {
          await markCanceled(sub);
        } else if (sub.status === "revoked" || sub.status === "unpaid") {
          await downgradeUser(sub);
        }
        break;
      }
      case "subscription.canceled": {
        // Cancellation scheduled — keep Pro until the period ends.
        await markCanceled(event.data);
        break;
      }
      case "subscription.revoked": {
        // Access actually ended — drop to Free.
        await downgradeUser(event.data);
        break;
      }
      case "order.paid": {
        // The reliable "money received" signal — fires on the initial purchase
        // AND on every renewal. We treat it as the primary upgrade trigger and
        // refresh the allowance (subscription.* events may not always arrive).
        await handleOrderPaid(event.data);
        break;
      }
      default:
        // Ignore other events.
        break;
    }
  } catch (err) {
    console.error(`Polar webhook handler error (${event?.type}):`, err);
    // Returning 500 makes Polar retry; safe because our updates are idempotent.
    return new Response("Handler error", { status: 500 });
  }

  return new Response("", { status: 202 });
}

// ---- helpers ----

// Resolve our internal user id from a Polar object (subscription or order).
async function resolveUserId(obj: any): Promise<string | null> {
  const fromExternal = obj?.customer?.externalId ?? obj?.customerExternalId ?? null;
  const fromMetadata = obj?.metadata?.userId ?? null;
  if (fromExternal) return fromExternal as string;
  if (fromMetadata) return fromMetadata as string;

  // Fall back to a previously-stored Polar customer id.
  const customerId = obj?.customerId ?? obj?.customer?.id ?? null;
  if (customerId) {
    const user = await prisma.user.findFirst({
      where: { polarCustomerId: customerId },
      select: { id: true },
    });
    return user?.id ?? null;
  }
  return null;
}

async function upgradeUser(sub: any, resetUsage: boolean) {
  const userId = await resolveUserId(sub);
  if (!userId) {
    console.warn("Polar upgrade: could not resolve user for subscription", sub?.id);
    return;
  }
  await prisma.user.update({
    where: { id: userId },
    data: {
      plan: planForProductId(productIdFromEvent(sub)),
      polarCustomerId: sub?.customerId ?? sub?.customer?.id ?? undefined,
      polarSubscriptionId: sub?.id ?? undefined,
      subscriptionStatus: "active",
      subscriptionEndsAt: sub?.currentPeriodEnd ? new Date(sub.currentPeriodEnd) : null,
      // Give a fresh allowance only on first activation.
      ...(resetUsage ? freshAllowance() : {}),
    },
  });
}

// Cancellation scheduled: the user keeps Pro until the current period ends.
// We only record the status + end date here; the actual downgrade happens on
// the `subscription.revoked` event when access truly lapses.
async function markCanceled(sub: any) {
  const userId = await resolveUserId(sub);
  if (!userId) {
    console.warn("Polar markCanceled: could not resolve user for subscription", sub?.id);
    return;
  }
  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionStatus: "canceled",
      subscriptionEndsAt: sub?.endsAt
        ? new Date(sub.endsAt)
        : sub?.currentPeriodEnd
        ? new Date(sub.currentPeriodEnd)
        : null,
    },
  });
}

async function downgradeUser(sub: any) {
  const userId = await resolveUserId(sub);
  if (!userId) {
    console.warn("Polar downgrade: could not resolve user for subscription", sub?.id);
    return;
  }
  await prisma.user.update({
    where: { id: userId },
    data: {
      plan: "free",
      subscriptionStatus: sub?.status ?? "canceled",
      subscriptionEndsAt: sub?.endsAt ? new Date(sub.endsAt) : null,
    },
  });
}

async function handleOrderPaid(order: any) {
  const userId = await resolveUserId(order);
  if (!userId) {
    console.warn("Polar order.paid: could not resolve user for order", order?.id);
    return;
  }
  await prisma.user.update({
    where: { id: userId },
    data: {
      plan: planForProductId(productIdFromEvent(order)),
      polarCustomerId: order?.customerId ?? order?.customer?.id ?? undefined,
      polarSubscriptionId: order?.subscriptionId ?? order?.subscription?.id ?? undefined,
      subscriptionStatus: "active",
      // Fresh allowance for the new billing period.
      ...freshAllowance(),
    },
  });
}

// Counter reset applied on first activation and on each paid renewal.
function freshAllowance() {
  return {
    resumeCount: 0,
    coverCount: 0,
    proposalCount: 0,
    dailyResumeCount: 0,
    dailyCoverCount: 0,
    dailyProposalCount: 0,
    currentPeriodStart: new Date(),
    currentDayStart: new Date(),
  };
}
