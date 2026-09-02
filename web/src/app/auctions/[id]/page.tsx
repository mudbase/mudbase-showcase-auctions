"use client"

import { Suspense, useMemo } from "react"
import Link from "next/link"
import { useParams, useSearchParams } from "next/navigation"
import { ArrowLeft, Gavel, Trophy } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import { AuctionStatusBadge } from "@/components/auctions/AuctionStatusBadge"
import { Countdown } from "@/components/auctions/Countdown"
import { BidPanel } from "@/components/auctions/BidPanel"
import { BidHistory } from "@/components/auctions/BidHistory"
import { ClaimPanel } from "@/components/auctions/ClaimPanel"
import { useAuction, useEndAuction } from "@/hooks/useAuctions"
import { useBids } from "@/hooks/useBids"
import { useBidsLive } from "@/hooks/useBidsLive"
import { useAuth } from "@/hooks/useAuth"
import { formatMoney, formatDateTime, timeRemaining } from "@/lib/utils"

function AuctionDetail(): React.JSX.Element {
  const params = useParams<{ id: string }>()
  const id = params?.id
  const searchParams = useSearchParams()
  const claimed = searchParams.get("claimed") === "1"

  const { data: auction, isLoading, isError } = useAuction(id)
  const { bids, highest, isLoading: bidsLoading } = useBids(id)
  useBidsLive(id)
  const { user, isAuthenticated } = useAuth()
  const endAuction = useEndAuction()

  const current = highest?.amount ?? auction?.startingPrice ?? 0
  const closed = useMemo(() => {
    if (!auction) return false
    return auction.status === "ended" || timeRemaining(auction.endsAt).ended
  }, [auction])

  if (isLoading) {
    return (
      <div className="container max-w-5xl py-10">
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div className="aspect-[4/3] animate-pulse rounded-xl bg-muted" />
          <div className="space-y-4">
            <div className="h-8 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-24 animate-pulse rounded bg-muted" />
            <div className="h-40 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>
    )
  }

  if (isError || !auction) {
    return (
      <div className="container max-w-5xl py-20 text-center">
        <p className="mb-4 font-medium">This drop could not be found.</p>
        <Button asChild variant="outline">
          <Link href="/">Back to drops</Link>
        </Button>
      </div>
    )
  }

  const isHost = !!user && auction.sellerId === user.id
  const winner = closed ? highest : null
  const isWinner = !!winner && !!user && winner.bidderId === user.id

  const onCloseNow = async (): Promise<void> => {
    await endAuction.mutateAsync({
      auctionId: auction._id,
      winnerId: highest?.bidderId ?? null,
      winnerName: highest?.bidderName ?? null,
    })
  }

  return (
    <div className="container max-w-5xl py-8">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link href="/">
          <ArrowLeft className="mr-2 h-4 w-4" />
          All drops
        </Link>
      </Button>

      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        {/* Left: item */}
        <div className="space-y-6">
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-muted">
            {auction.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={auction.imageUrl} alt={auction.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                <Gavel className="h-14 w-14" />
              </div>
            )}
            <div className="absolute left-4 top-4">
              <AuctionStatusBadge auction={auction} />
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-bold tracking-tight">{auction.title}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Avatar name={auction.sellerName} size="sm" className="h-6 w-6 text-[10px]" />
              Hosted by {auction.sellerName}
            </div>
            <p className="whitespace-pre-line leading-relaxed text-foreground/90">{auction.description}</p>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold">Bid history</h2>
            {bidsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
                ))}
              </div>
            ) : (
              <BidHistory bids={bids} currency={auction.currency} />
            )}
          </div>
        </div>

        {/* Right: bidding / result */}
        <div className="lg:sticky lg:top-20 lg:h-fit">
          <Card className="space-y-5 p-5">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{bids.length > 0 ? "Current bid" : "Starting price"}</p>
                <p className="text-3xl font-bold tabular-nums">{formatMoney(current, auction.currency)}</p>
                {highest && <p className="text-xs text-muted-foreground">by {highest.bidderName}</p>}
              </div>
              <div className="text-right text-sm">
                <p className="text-muted-foreground">{bids.length} {bids.length === 1 ? "bid" : "bids"}</p>
                {!closed ? (
                  <Countdown endsAt={auction.endsAt} className="font-semibold text-foreground" />
                ) : (
                  <span className="font-medium text-muted-foreground">Closed</span>
                )}
              </div>
            </div>

            {!closed ? (
              <>
                <BidPanel auction={auction} currentAmount={current} user={user} isAuthenticated={isAuthenticated} />
                {isHost && (
                  <div className="border-t border-border pt-4">
                    <Button variant="outline" size="sm" className="w-full" onClick={() => void onCloseNow()} disabled={endAuction.isPending}>
                      {endAuction.isPending ? "Closing…" : "Close drop now"}
                    </Button>
                    <p className="mt-2 text-center text-xs text-muted-foreground">
                      Ends {formatDateTime(auction.endsAt)}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-4 border-t border-border pt-4">
                {winner ? (
                  <div className="flex items-center gap-2 text-sm">
                    <Trophy className="h-4 w-4 text-accent" />
                    Won by <span className="font-semibold">{winner.bidderName}</span> for{" "}
                    <span className="font-semibold tabular-nums">{formatMoney(winner.amount, auction.currency)}</span>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">This drop closed with no bids.</p>
                )}

                {isWinner && (
                  <ClaimPanel auction={auction} amountDue={winner!.amount} user={user} claimed={claimed || auction.claimed === true} />
                )}
                {isHost && winner && !isWinner && (
                  <p className="rounded-md border border-border bg-secondary/40 p-3 text-xs text-muted-foreground">
                    The winner pays to claim from their own view. In production, a Mudbase payment webhook confirms
                    the collection and marks the drop claimed.
                  </p>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function AuctionDetailPage(): React.JSX.Element {
  return (
    <Suspense fallback={<div className="container py-20 text-center text-muted-foreground">Loading…</div>}>
      <AuctionDetail />
    </Suspense>
  )
}
