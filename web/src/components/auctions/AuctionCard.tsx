"use client"

import Link from "next/link"
import { Gavel } from "lucide-react"
import { Card } from "@/components/ui/card"
import { AuctionStatusBadge } from "@/components/auctions/AuctionStatusBadge"
import { Countdown } from "@/components/auctions/Countdown"
import { formatMoney } from "@/lib/utils"
import type { Auction } from "@/types/auction"
import type { AuctionBidStats } from "@/hooks/useBidIndex"

export function AuctionCard({ auction, stats }: { auction: Auction; stats?: AuctionBidStats }): React.JSX.Element {
  const current = stats?.highest ?? auction.startingPrice
  const bidCount = stats?.count ?? 0

  return (
    <Link href={`/auctions/${auction._id}`} className="group block">
      <Card className="h-full overflow-hidden transition-shadow group-hover:shadow-lg">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {auction.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={auction.imageUrl}
              alt={auction.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <Gavel className="h-10 w-10" />
            </div>
          )}
          <div className="absolute left-3 top-3">
            <AuctionStatusBadge auction={auction} />
          </div>
        </div>
        <div className="space-y-3 p-4">
          <div className="space-y-1">
            <h3 className="line-clamp-1 font-semibold">{auction.title}</h3>
            <p className="line-clamp-2 text-sm text-muted-foreground">{auction.description}</p>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-muted-foreground">{bidCount > 0 ? "Current bid" : "Starting price"}</p>
              <p className="text-lg font-semibold tabular-nums">{formatMoney(current, auction.currency)}</p>
            </div>
            <div className="text-right text-sm">
              <p className="text-muted-foreground">{bidCount} {bidCount === 1 ? "bid" : "bids"}</p>
              {auction.status === "live" ? (
                <Countdown endsAt={auction.endsAt} className="text-sm font-medium" />
              ) : (
                <span className="text-muted-foreground">Closed</span>
              )}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  )
}
