"use client"

import { useMemo } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { AuctionGrid } from "@/components/auctions/AuctionGrid"
import { useAuctions } from "@/hooks/useAuctions"
import { useAuctionsLive } from "@/hooks/useAuctionsLive"
import { useBidIndex } from "@/hooks/useBidIndex"
import { useAuth } from "@/hooks/useAuth"
import { timeRemaining } from "@/lib/utils"
import type { Auction } from "@/types/auction"

export default function MyDropsPage(): React.JSX.Element {
  const { data, isLoading, isError } = useAuctions()
  const { stats } = useBidIndex()
  const { user, isAuthenticated, loading } = useAuth()
  useAuctionsLive(true)

  const all = useMemo(() => data?.data ?? [], [data])

  const hosting = useMemo<Auction[]>(() => (user ? all.filter((a) => a.sellerId === user.id) : []), [all, user])

  const won = useMemo<Auction[]>(() => {
    if (!user) return []
    return all.filter((a) => {
      const closed = a.status === "ended" || timeRemaining(a.endsAt).ended
      return closed && stats.get(a._id)?.topBidderId === user.id
    })
  }, [all, user, stats])

  if (loading || (isLoading && isAuthenticated)) {
    return (
      <div className="container py-10">
        <div className="h-8 w-40 animate-pulse rounded bg-muted" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="container max-w-md py-20">
        <Card className="flex flex-col items-center gap-4 p-10 text-center">
          <p className="font-medium">Sign in to see your drops</p>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Create account</Link>
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="container space-y-12 py-10">
      <section>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Drops you&apos;re hosting</h1>
            <p className="text-sm text-muted-foreground">Items you&apos;ve listed for bidding.</p>
          </div>
          <Button asChild size="sm">
            <Link href="/auctions/new">List a drop</Link>
          </Button>
        </div>
        <AuctionGrid
          auctions={hosting}
          stats={stats}
          isLoading={false}
          isError={isError}
          emptyTitle="You haven't listed anything yet"
          emptyBody="List your first drop and watch the bids roll in."
        />
      </section>

      <section>
        <div className="mb-5">
          <h2 className="text-2xl font-semibold tracking-tight">Drops you&apos;ve won</h2>
          <p className="text-sm text-muted-foreground">Closed auctions where you were the top bidder - pay to claim.</p>
        </div>
        <AuctionGrid
          auctions={won}
          stats={stats}
          isLoading={false}
          emptyTitle="No wins yet"
          emptyBody="Place the top bid on a drop before it closes to win it."
          showCreateCta={false}
        />
      </section>
    </div>
  )
}
