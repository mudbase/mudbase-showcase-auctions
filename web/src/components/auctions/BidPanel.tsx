"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { usePlaceBid } from "@/hooks/useBids"
import { MudbaseError, type UserObject } from "@/lib/mudbase"
import { formatMoney } from "@/lib/utils"
import type { Auction } from "@/types/auction"

const MIN_INCREMENT = 1

export function BidPanel({
  auction,
  currentAmount,
  user,
  isAuthenticated,
}: {
  auction: Auction
  currentAmount: number
  user: UserObject | null
  isAuthenticated: boolean
}): React.JSX.Element {
  const minBid = Math.round((currentAmount + MIN_INCREMENT) * 100) / 100
  const [amount, setAmount] = useState<string>(String(minBid))
  const [error, setError] = useState<string | null>(null)
  const placeBid = usePlaceBid(auction._id)

  // Keep the input's floor in step with the live current price as other people bid.
  useEffect(() => {
    setAmount((prev) => {
      const n = Number(prev)
      return !prev || Number.isNaN(n) || n < minBid ? String(minBid) : prev
    })
  }, [minBid])

  const isOwnDrop = !!user && auction.sellerId === user.id

  if (!isAuthenticated) {
    return (
      <div className="rounded-lg border border-border bg-secondary/40 p-4 text-center text-sm">
        <p className="mb-3 text-muted-foreground">Sign in to place a bid.</p>
        <Button asChild size="sm">
          <Link href="/login">Sign in to bid</Link>
        </Button>
      </div>
    )
  }

  if (isOwnDrop) {
    return (
      <div className="rounded-lg border border-border bg-secondary/40 p-4 text-center text-sm text-muted-foreground">
        This is your drop - you can&apos;t bid on it.
      </div>
    )
  }

  const onSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setError(null)
    const value = Number(amount)
    if (Number.isNaN(value) || value < minBid) {
      setError(`Your bid must be at least ${formatMoney(minBid, auction.currency)}.`)
      return
    }
    try {
      await placeBid.mutateAsync({
        auctionId: auction._id,
        amount: value,
        bidderId: user!.id,
        bidderName: `${user!.firstName} ${user!.lastName}`.trim(),
      })
    } catch (err) {
      setError(err instanceof MudbaseError ? err.message : "Could not place your bid. Please try again.")
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="bid">Your bid</Label>
        <div className="flex gap-2">
          <Input
            id="bid"
            type="number"
            inputMode="decimal"
            step="0.01"
            min={minBid}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="tabular-nums"
          />
          <Button type="submit" disabled={placeBid.isPending}>
            <TrendingUp className="mr-2 h-4 w-4" />
            {placeBid.isPending ? "Bidding…" : "Place bid"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Minimum next bid: {formatMoney(minBid, auction.currency)}
        </p>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </form>
  )
}
