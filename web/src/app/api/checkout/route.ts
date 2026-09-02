import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAuctionSettlement, initPaymentCollection } from "@/lib/mudbase-server"

const bodySchema = z.object({
  auctionId: z.string().min(1),
  email: z.string().email(),
  name: z.string().min(1).max(120),
  origin: z.string().url(),
})

export async function POST(request: NextRequest): Promise<NextResponse> {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
  const { auctionId, email, name, origin } = parsed.data

  // Re-derive the amount server-side from the real winning bid - never trust a client-sent price.
  const settlement = await getAuctionSettlement(auctionId)
  if (!settlement.ok) {
    const status = settlement.reason === "not_found" ? 404 : settlement.reason === "not_configured" ? 503 : 502
    return NextResponse.json({ error: settlement.message, reason: settlement.reason }, { status })
  }

  const { auction, amountDue } = settlement
  const closed = auction.status === "ended" || new Date(auction.endsAt).getTime() <= Date.now()
  if (!closed) {
    return NextResponse.json({ error: "This drop has not ended yet - checkout opens when the auction closes." }, { status: 409 })
  }

  const result = await initPaymentCollection({
    amount: amountDue,
    currency: auction.currency,
    customer: { email, name },
    title: `Claim: ${auction.title}`,
    description: `Winning bid for "${auction.title}" on Live Bid`,
    redirectUrl: `${origin}/auctions/${auctionId}?claimed=1`,
    reference: auctionId,
  })

  if (!result.ok) {
    const status =
      result.reason === "collection_unavailable" ? 409 : result.reason === "not_configured" ? 503 : result.reason === "invalid" ? 400 : 502
    return NextResponse.json({ error: result.message, reason: result.reason }, { status })
  }

  return NextResponse.json({ link: result.link, amount: result.amount, currency: result.currency }, { status: 201 })
}
