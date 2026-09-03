// Supabase Edge Function port of the mpesaInitiate/mpesaStatus/mpesaCallback
// trio from functions/index.js. Routes on path suffix so the client's
// existing "/mpesa/initiate" and "/mpesa/status" request shapes (already
// used for the non-Firebase backend in src/services/mpesa.service.ts) work
// unchanged — only the base URL needs to point here.
//
// verify_jwt is OFF for this function (set at deploy time): the client sends
// a Firebase ID token, not a Supabase-issued one, so Supabase's own JWT gate
// would reject every request. Auth is verified manually via firebaseAuth.ts
// instead. The callback route additionally has no auth at all by design —
// see the comment on handleCallback below.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { requireUser, AuthError } from "./firebaseAuth.ts";
import { getDoc, setDoc, addDoc, incrementFields } from "./firestore.ts";
import {
  stkPush,
  stkQuery,
  normalizePhone,
  planAmount,
  getSubscriptionExpiry,
  MPESA_TERMINAL_ERROR_CODES,
} from "./mpesaClient.ts";

function corsHeaders(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  };
}

// deno-lint-ignore no-explicit-any
function json(body: any, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders() },
  });
}

// Fires on every successful payment by a referred user, matching the "30%
// for every successful subscription" affiliate copy. Wrapped by the caller
// in try/catch so a bug here never breaks subscription activation.
async function creditAffiliateCommission(referredUid: string, plan: string, amount: number): Promise<void> {
  if (!amount) return;

  const referred = await getDoc(`users/${referredUid}`);
  const referredByUid = referred?.referred_by_uid;
  if (!referredByUid || referredByUid === referredUid) return;

  const affiliate = await getDoc(`affiliates/${referredByUid}`);
  if (!affiliate) return;

  const AFFILIATE_COMMISSION_RATE = 0.3;
  const AFFILIATE_COMMISSION_HOLD_DAYS = 7;
  const commissionAmount = Math.round(amount * AFFILIATE_COMMISSION_RATE * 100) / 100;
  const availableAt = new Date(Date.now() + AFFILIATE_COMMISSION_HOLD_DAYS * 24 * 60 * 60 * 1000);

  await addDoc("commissions", {
    affiliate_uid: referredByUid,
    referred_uid: referredUid,
    plan,
    amount,
    commission_amount: commissionAmount,
    status: "pending",
    created_at: new Date(),
    available_at: availableAt,
  });

  await incrementFields(`affiliates/${referredByUid}`, {
    pending_balance: commissionAmount,
    total_earned: commissionAmount,
  });
}

async function activateSubscription(uid: string, plan: string, amount: number): Promise<void> {
  await setDoc(`users/${uid}`, {
    is_subscribed: true,
    has_subscribed: true,
    chat_count: 0,
    subscription_plan: plan,
    subscription_expires_at: getSubscriptionExpiry(plan),
    updated_at: new Date(),
  });

  try {
    await creditAffiliateCommission(uid, plan, amount ?? planAmount(plan) ?? 0);
  } catch (error) {
    console.error("Affiliate commission crediting failed", error);
  }
}

// Resolves a payment's outcome by querying Safaricom directly (never by
// trusting caller-supplied result data) and persists it. Shared by the
// user-facing polling route and the Safaricom callback.
// deno-lint-ignore no-explicit-any
async function resolvePaymentWithMpesa(paymentPath: string, payment: Record<string, any>, checkoutId: string) {
  const result = await stkQuery(checkoutId);
  const resultCode = String(result.ResultCode ?? "");

  if (resultCode === "0") {
    await activateSubscription(payment.uid, payment.plan, payment.amount);
    await setDoc(paymentPath, { paid: true, status: "paid", result, updated_at: new Date() });
    return { status: "success", paid: true, message: "Payment confirmed." };
  }

  if (resultCode === "1032") {
    await setDoc(paymentPath, { paid: false, status: "cancelled", result, updated_at: new Date() });
    return { status: "cancelled", paid: false, message: "Payment cancelled by user." };
  }

  if (MPESA_TERMINAL_ERROR_CODES.has(resultCode)) {
    await setDoc(paymentPath, { paid: false, status: "failed", result, updated_at: new Date() });
    return { status: "failed", paid: false, message: result.ResultDesc || "M-Pesa payment failed." };
  }

  return { status: "pending", paid: false, message: "Waiting for payment confirmation." };
}

async function handleInitiate(req: Request): Promise<Response> {
  let authUser: { uid: string } | null = null;
  let phone: string | undefined;
  let plan: string | undefined;
  let amount: number | null = null;

  try {
    if (req.method !== "POST") return json({ status: "error", message: "Method not allowed" }, 405);

    authUser = await requireUser(req);
    const body = await req.json().catch(() => ({}));
    phone = body.phone;
    plan = body.plan;
    amount = planAmount(plan);

    if (!phone || !amount) {
      return json({ status: "error", message: "Phone and a valid plan are required." }, 422);
    }

    const result = await stkPush({ phone, amount, reference: String(plan).toUpperCase() });

    if (result.ResponseCode !== "0") {
      // Log the failed attempt even though no checkout was created, so a
      // systemic issue (bad credentials, Safaricom outage) is visible on
      // the admin dashboard instead of vanishing silently.
      await addDoc("paymentRequests", {
        uid: authUser.uid,
        phone: normalizePhone(phone),
        plan,
        amount,
        status: "failed",
        paid: false,
        provider: "mpesa",
        checkout_request_id: result.CheckoutRequestID || null,
        failure_reason: result.errorMessage || result.ResponseDescription || "STK Push failed.",
        created_at: new Date(),
        updated_at: new Date(),
      });

      return json({ status: "error", message: result.errorMessage || "STK Push failed. Try again.", mpesa: result }, 422);
    }

    const checkoutId = result.CheckoutRequestID;
    await setDoc(`paymentRequests/${checkoutId}`, {
      uid: authUser.uid,
      phone: normalizePhone(phone),
      plan,
      amount,
      status: "pending",
      paid: false,
      provider: "mpesa",
      checkout_request_id: checkoutId,
      merchant_request_id: result.MerchantRequestID || null,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return json({ status: "success", message: "STK Push sent. Enter your M-Pesa PIN.", checkout_request_id: checkoutId });
  } catch (error) {
    if (authUser) {
      try {
        await addDoc("paymentRequests", {
          uid: authUser.uid,
          phone: phone ? normalizePhone(phone) : null,
          plan: plan || null,
          amount: amount || null,
          status: "failed",
          paid: false,
          provider: "mpesa",
          failure_reason: (error as Error).message || "Could not connect to M-Pesa.",
          created_at: new Date(),
          updated_at: new Date(),
        });
      } catch (logError) {
        console.error("Failed to log failed M-Pesa initiation attempt", logError);
      }
    }

    const status = (error as { status?: number }).status || 500;
    return json({ status: "error", message: (error as Error).message || "Could not connect to M-Pesa. Please try again." }, status);
  }
}

async function handleStatus(req: Request): Promise<Response> {
  try {
    const authUser = await requireUser(req);

    let checkoutId: string | null = null;
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      checkoutId = body.checkout_request_id ?? null;
    } else {
      checkoutId = new URL(req.url).searchParams.get("checkout_request_id");
    }

    if (!checkoutId) {
      return json({ status: "error", message: "checkout_request_id is required." }, 422);
    }

    const paymentPath = `paymentRequests/${checkoutId}`;
    const payment = await getDoc(paymentPath);

    if (!payment) {
      return json({ status: "not_found", paid: false, message: "Payment request not found." }, 404);
    }

    if (payment.uid !== authUser.uid) {
      return json({ status: "error", paid: false, message: "You cannot access this payment request." }, 403);
    }

    if (payment.status === "paid" || payment.paid === true) {
      return json({ status: "success", paid: true, message: "Payment confirmed." });
    }

    const outcome = await resolvePaymentWithMpesa(paymentPath, payment, checkoutId);
    return json(outcome);
  } catch (error) {
    const status = (error as { status?: number }).status || 500;
    return json({ status: "pending", paid: false, message: (error as Error).message || "Awaiting confirmation." }, status);
  }
}

// Safaricom's callback body is unauthenticated — the CheckoutRequestID it
// carries is also handed to the paying client to poll with, so anyone could
// POST a forged { ResultCode: 0 } here. Treat the callback purely as a
// "check now" trigger: the actual paid/failed/cancelled outcome always comes
// from resolvePaymentWithMpesa's own query to Safaricom, authenticated with
// our own credentials — never from this request body.
async function handleCallback(req: Request): Promise<Response> {
  try {
    const body = await req.json().catch(() => ({}));
    const checkoutId = body?.Body?.stkCallback?.CheckoutRequestID;

    if (checkoutId) {
      const paymentPath = `paymentRequests/${checkoutId}`;
      const payment = await getDoc(paymentPath);
      if (payment && payment.status !== "paid" && payment.paid !== true) {
        await resolvePaymentWithMpesa(paymentPath, payment, checkoutId);
      }
    }

    return json({ ResultCode: 0, ResultDesc: "Accepted" });
  } catch (error) {
    console.error("M-Pesa callback error", error);
    return json({ ResultCode: 0, ResultDesc: "Accepted" });
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  const path = new URL(req.url).pathname;

  try {
    if (path.endsWith("/initiate")) return await handleInitiate(req);
    if (path.endsWith("/status")) return await handleStatus(req);
    if (path.endsWith("/callback")) return await handleCallback(req);
    return json({ status: "error", message: "Not found" }, 404);
  } catch (error) {
    // Defense in depth — each handler above already catches its own errors,
    // this only fires if something escapes unexpectedly.
    if (error instanceof AuthError) {
      return json({ status: "error", message: error.message }, error.status);
    }
    console.error("Unhandled mpesa function error", error);
    return json({ status: "error", message: "Server error" }, 500);
  }
});
