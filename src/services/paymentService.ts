// src/services/paymentService.ts

type CustomerInfo = {
  name?: string;
  email?: string;
  phone?: string;
};

type NewCheckoutPayload = {
  tourId: string;
  quantity?: number;           // defaults to 1
  date?: string;               // 'YYYY-MM-DD' (optional)
  customerInfo?: CustomerInfo; // preferred
  currency?: string;           // backend defaults to 'usd'
  metadata?: Record<string, string>;
};

// Legacy fields (still accepted by callers, but ignored by backend)
type LegacyFields = {
  tourName?: string;
  price?: number;              // major or minor units (unused by backend route)
  customerEmail?: string;      // mapped into customerInfo.email
  // successUrl/cancelUrl are server-controlled; no longer sent
};

/**
 * Create Stripe Checkout Session via backend.
 * Accepts both the new payload (preferred) and legacy fields; maps them correctly.
 * Returns: { url } to redirect the user to Stripe Checkout.
 */
export async function createCheckoutSession(
  payload: NewCheckoutPayload & Partial<LegacyFields>
): Promise<{ url: string }> {
  const baseRaw = import.meta.env.VITE_API_URL;
  if (!baseRaw) {
    throw new Error('VITE_API_URL is not set in your environment.');
  }
  const base = baseRaw.replace(/\/+$/, ''); // strip trailing slash

  // --- Build request body expected by backend ---
  const quantity =
    Number.isFinite(Number(payload.quantity)) && Number(payload.quantity!) >= 1
      ? Math.floor(Number(payload.quantity!))
      : 1;

  const customerInfo: CustomerInfo = {
    // prefer explicit customerInfo passed by caller
    ...(payload.customerInfo || {}),
    // map legacy customerEmail if present
    email: payload.customerInfo?.email ?? payload.customerEmail ?? undefined,
  };

  const body: NewCheckoutPayload = {
    tourId: String(payload.tourId),
    quantity,
    currency: payload.currency || undefined,
    date: payload.date || undefined,
    customerInfo,
    metadata: payload.metadata || undefined,
  };

  // --- Make request ---
  let res: Response;
  try {
    res = await fetch(`${base}/api/v1/payments/checkout-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (networkErr: any) {
    // Helpful message for CORS / network issues
    throw new Error(
      `Network error contacting payments API: ${networkErr?.message || networkErr}`
    );
  }

  // --- Handle non-2xx with a clearer error ---
  if (!res.ok) {
    let details: any = {};
    try {
      details = await res.json();
    } catch {
      /* ignore parse error */
    }
    const msg =
      details?.error ||
      `Checkout session failed (HTTP ${res.status}) — ensure tourId, quantity, and JSON Content-Type are correct.`;
    throw new Error(msg);
  }

  const data = (await res.json()) as { url?: string };
  if (!data?.url) {
    throw new Error('Checkout session created but no redirect URL was returned.');
  }

  // Optional dev log for visibility
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.debug('[createCheckoutSession] success:', { redirectUrl: data.url });
  }

  return { url: data.url };
}
