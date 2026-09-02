"use client"

import { Crown } from "lucide-react"
import { Avatar } from "@/components/ui/avatar"
import { formatMoney, formatRelativeTime, cn } from "@/lib/utils"
import type { Bid } from "@/types/bid"

export function BidHistory({ bids, currency }: { bids: Bid[]; currency: string }): React.JSX.Element {
  if (bids.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        No bids yet - be the first.
      </div>
    )
  }

  return (
    <ul className="divide-y divide-border rounded-lg border border-border">
      {bids.map((bid, i) => (
        <li key={bid._id} className={cn("flex items-center gap-3 p-3", i === 0 && "bg-accent/5")}>
          <Avatar name={bid.bidderName} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 truncate text-sm font-medium">
              {bid.bidderName}
              {i === 0 && <Crown className="h-3.5 w-3.5 text-accent" aria-label="Highest bid" />}
            </p>
            <p className="text-xs text-muted-foreground">{formatRelativeTime(bid.createdAt)}</p>
          </div>
          <p className="tabular-nums font-semibold">{formatMoney(bid.amount, currency)}</p>
        </li>
      ))}
    </ul>
  )
}
