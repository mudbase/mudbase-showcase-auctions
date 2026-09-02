import type { Document } from "@/lib/mudbase"

export type AuctionStatus = "live" | "ended"

export interface Auction extends Document {
  title: string
  description: string
  /** Plain image URL - end-user JWTs can't create bucket files (see mudbase.ts), so images are URLs. */
  imageUrl: string
  startingPrice: number
  currency: string
  status: AuctionStatus
  /** ISO timestamp when bidding closes. */
  endsAt: string
  sellerId: string
  sellerName: string
  /** Set by the host when they close the drop - the highest bidder at that moment. */
  winnerId?: string | null
  winnerName?: string | null
  /** Set to true after the winner completes payment collection (claimed). */
  claimed?: boolean
}

export type NewAuction = {
  title: string
  description: string
  imageUrl: string
  startingPrice: number
  currency: string
  status: AuctionStatus
  endsAt: string
  sellerId: string
  sellerName: string
}
