"use client"

import Link from "next/link"
import { Gavel } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AuctionCard } from "@/components/auctions/AuctionCard"
import type { Auction } from "@/types/auction"
import type { AuctionBidStats } from "@/hooks/useBidIndex"

export function AuctionGrid({
  auctions,
  stats,
  isLoading,
  isError,
  emptyTitle = "No drops yet",
  emptyBody = "Be the first to list one.",
  showCreateCta = true,
}: {
  auctions: Auction[]
  stats: Map<string, AuctionBidStats>
  isLoading: boolean
  isError?: boolean
  emptyTitle?: string
  emptyBody?: string
  showCreateCta?: boolean
}): React.JSX.Element {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="h-full overflow-hidden">
            <div className="aspect-[4/3] animate-pulse bg-muted" />
            <div className="space-y-3 p-4">
              <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
              <div className="h-3 w-full animate-pulse rounded bg-muted" />
              <div className="h-6 w-1/3 animate-pulse rounded bg-muted" />
            </div>
          </Card>
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <Card className="flex flex-col items-center gap-2 p-12 text-center">
        <p className="font-medium">Could not load drops</p>
        <p className="text-sm text-muted-foreground">Check your connection and try again.</p>
      </Card>
    )
  }

  if (auctions.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-3 p-12 text-center">
        <Gavel className="h-10 w-10 text-muted-foreground" />
        <div>
          <p className="font-medium">{emptyTitle}</p>
          <p className="text-sm text-muted-foreground">{emptyBody}</p>
        </div>
        {showCreateCta && (
          <Button asChild size="sm">
            <Link href="/auctions/new">List a drop</Link>
          </Button>
        )}
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {auctions.map((auction) => (
        <AuctionCard key={auction._id} auction={auction} stats={stats.get(auction._id)} />
      ))}
    </div>
  )
}
