import type { Document } from "@/lib/mudbase"

/**
 * Bids are an append-only collection, one document per bid, owned by the bidder (create-own).
 * The current price of an auction is derived from the highest bid, not stored back onto the
 * auction - this keeps every bidder writing only their own documents (clean ownership) while
 * still driving a live, shared price via realtime `db:create` events on this collection.
 */
export interface Bid extends Document {
  auctionId: string
  amount: number
  bidderId: string
  bidderName: string
}

export type NewBid = {
  auctionId: string
  amount: number
  bidderId: string
  bidderName: string
}
