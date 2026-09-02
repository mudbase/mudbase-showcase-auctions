import "server-only"
import { MUDBASE_URL, MUDBASE_PROJECT_ID } from "./config"

/**
 * Server-only payment-collection client for Mudbase. Collecting a payment is a project-scoped,
 * API-key-authorized action (`payment:create`), so this module holds the project's server-side
 * payments key and is imported only from Route Handlers. `server-only` turns any accidental
 * client import into a build error, and the key is never sent to the browser.
 *
 * Mudbase collects the payment (card or mobile money) on the hosted checkout page it returns.
 * This demo only ever COLLECTS - the winning bidder pays to claim their drop. There is no
 * payout/settlement side: this app never disburses to a seller (out of scope, see README).
 */

const PAYMENTS_API_KEY = process.env.MUDBASE_PAYMENTS_API_KEY ?? ""

const AUCTIONS_COLLECTION_ID = process.env.NEXT_PUBLIC_AUCTIONS_COLLECTION_ID ?? ""
const BIDS_COLLECTION_ID = process.env.NEXT_PUBLIC_BIDS_COLLECTION_ID ?? ""

export class PaymentsConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "PaymentsConfigError"
  }
}

interface ServerAuction {
  _id: string
  title: string
  startingPrice: number
  currency: string
  status: string
  endsAt: string
  sellerId: string
}

interface ServerBid {
  _id: string
  auctionId: string
  amount: number
  bidderId: string
  bidderName: string
}

/**
 * Read an auction and its highest bid server-side, using the project's API key. The amount to
 * collect is re-derived here from the real winning bid rather than trusted from the browser -
 * a client-supplied price must never be what gets charged.
 */
export async function getAuctionSettlement(
  auctionId: string,
): Promise<
  | { ok: true; auction: ServerAuction; topBid: ServerBid | null; amountDue: number }
  | { ok: false; reason: "not_configured" | "not_found" | "unknown"; message: string }
> {
  if (!PAYMENTS_API_KEY || !AUCTIONS_COLLECTION_ID || !BIDS_COLLECTION_ID) {
    return { ok: false, reason: "not_configured", message: "Payments are not configured for this deployment." }
  }

  const headers = { "X-API-Key": PAYMENTS_API_KEY }
  const dataPath = (collectionId: string, docId?: string): string =>
    `${MUDBASE_URL}/api/data/projects/${MUDBASE_PROJECT_ID}/collections/${collectionId}/data${docId ? `/${docId}` : ""}`

  let auction: ServerAuction
  try {
    const res = await fetch(dataPath(AUCTIONS_COLLECTION_ID, auctionId), { headers })
    if (res.status === 404) return { ok: false, reason: "not_found", message: "Auction not found." }
    if (!res.ok) return { ok: false, reason: "unknown", message: `Could not read auction (${res.status}).` }
    const body = (await res.json()) as { data: ServerAuction }
    auction = body.data
  } catch (err) {
    return { ok: false, reason: "unknown", message: err instanceof Error ? err.message : "Could not read auction." }
  }

  // Highest bid on this auction: sort by amount desc, take one.
  let topBid: ServerBid | null = null
  try {
    const qs = new URLSearchParams({
      filter: JSON.stringify({ auctionId }),
      sort: "-amount",
      limit: "1",
    })
    const res = await fetch(`${dataPath(BIDS_COLLECTION_ID)}?${qs.toString()}`, { headers })
    if (res.ok) {
      const body = (await res.json()) as { data: ServerBid[] }
      topBid = body.data[0] ?? null
    }
  } catch {
    // A read failure here just leaves topBid null; amountDue falls back to the starting price.
  }

  const amountDue = topBid ? topBid.amount : auction.startingPrice
  return { ok: true, auction, topBid, amountDue }
}

export interface InitPaymentParams {
  /** Amount to collect, in major units of the currency (e.g. 42.5). */
  amount: number
  currency: string
  customer: { email: string; name: string }
  /** Human-readable line item shown on the hosted checkout page. */
  title: string
  description: string
  /** Where the hosted checkout page returns the payer after completion. */
  redirectUrl: string
  /** Opaque reference the app can reconcile against later (e.g. the auction id). */
  reference?: string
}

export interface InitPaymentSuccess {
  ok: true
  /** Hosted checkout URL - redirect the payer here to pay by card or mobile money. */
  link: string
  txRef: string
  amount: number
  currency: string
}

export type InitPaymentResult =
  | InitPaymentSuccess
  | { ok: false; reason: "not_configured"; message: string }
  | { ok: false; reason: "collection_unavailable"; message: string }
  | { ok: false; reason: "invalid"; message: string }
  | { ok: false; reason: "unknown"; message: string }

/**
 * Ask Mudbase to start collecting a payment and hand back a hosted checkout link.
 *
 * Graceful, honest degradation: if this demo project has not finished enabling payment
 * collection yet, Mudbase returns 409 ("not enabled") or 403 (verification pending). We surface
 * that as a clear `collection_unavailable` state rather than faking a paid outcome - the exact
 * same discipline the ecommerce showcase uses.
 */
export async function initPaymentCollection(params: InitPaymentParams): Promise<InitPaymentResult> {
  if (!PAYMENTS_API_KEY) {
    return {
      ok: false,
      reason: "not_configured",
      message: "MUDBASE_PAYMENTS_API_KEY is not set - payment collection is not configured for this deployment.",
    }
  }

  let res: Response
  try {
    res = await fetch(`${MUDBASE_URL}/api/projects/${MUDBASE_PROJECT_ID}/payment-processing/initialize-payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": PAYMENTS_API_KEY,
      },
      body: JSON.stringify({
        amount: params.amount,
        currency: params.currency,
        customer: params.customer,
        metadata: {
          title: params.title,
          description: params.description,
          redirectUrl: params.redirectUrl,
          reference: params.reference,
        },
      }),
    })
  } catch (err) {
    return {
      ok: false,
      reason: "unknown",
      message: err instanceof Error ? err.message : "Could not reach the payment service",
    }
  }

  if (res.status === 409 || res.status === 403) {
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    return {
      ok: false,
      reason: "collection_unavailable",
      message:
        body.error ??
        "Payment collection is still being finalized for this demo - checkout is wired to Mudbase but not yet live.",
    }
  }

  if (res.status === 400) {
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    return { ok: false, reason: "invalid", message: body.error ?? "The payment request was rejected." }
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    return { ok: false, reason: "unknown", message: body.error ?? `Payment initialization failed (${res.status})` }
  }

  const body = (await res.json()) as {
    data?: { link?: string; txRef?: string; amount?: number; currency?: string }
  }
  const link = body.data?.link
  const txRef = body.data?.txRef
  if (!link || !txRef) {
    return { ok: false, reason: "unknown", message: "Payment initialization returned no checkout link." }
  }

  return {
    ok: true,
    link,
    txRef,
    amount: body.data?.amount ?? params.amount,
    currency: body.data?.currency ?? params.currency,
  }
}
