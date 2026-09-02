"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Gavel, Radio, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AuctionGrid } from "@/components/auctions/AuctionGrid"
import { useAuctions } from "@/hooks/useAuctions"
import { useAuctionsLive } from "@/hooks/useAuctionsLive"
import { useBidIndex } from "@/hooks/useBidIndex"
import { useAuth } from "@/hooks/useAuth"
import { cn } from "@/lib/utils"
import type { Auction } from "@/types/auction"

type Filter = "live" | "ended" | "all"

export default function HomePage(): React.JSX.Element {
  const { data, isLoading, isError } = useAuctions()
  const { stats } = useBidIndex()
  const { isAuthenticated } = useAuth()
  useAuctionsLive(true)
  const [filter, setFilter] = useState<Filter>("live")

  const all = useMemo(() => data?.data ?? [], [data])
  const filtered = useMemo<Auction[]>(() => {
    if (filter === "all") return all
    return all.filter((a) => a.status === filter)
  }, [all, filter])

  const liveCount = all.filter((a) => a.status === "live").length

  return (
    <div>
      <section className="border-b border-border bg-gradient-to-b from-secondary/60 to-background">
        <div className="container flex flex-col items-start gap-6 py-16 md:py-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
            <Radio className="h-3.5 w-3.5 text-accent" />
            Built entirely on Mudbase - auth, database, realtime, payments
          </span>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight md:text-5xl">
            Live drops. Real-time bidding. Pay to claim.
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            List a one-of-a-kind item, watch bids climb the moment they land, and let the winner check out with card
            or mobile money - all on a single backend, no server code of your own.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href={isAuthenticated ? "/auctions/new" : "/register"}>
                <Gavel className="mr-2 h-4 w-4" />
                {isAuthenticated ? "List a drop" : "Start bidding"}
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href="https://www.mudbase.dev/oneshot" target="_blank" rel="noreferrer">
                <Zap className="mr-2 h-4 w-4" />
                Built with Mudbase One-Shot
              </a>
            </Button>
          </div>
        </div>
      </section>

      <section className="container py-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              {filter === "live" ? "Live now" : filter === "ended" ? "Closed drops" : "All drops"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {liveCount} {liveCount === 1 ? "auction" : "auctions"} live right now
            </p>
          </div>
          <div className="inline-flex rounded-lg border border-border bg-secondary/40 p-1">
            {(["live", "ended", "all"] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors",
                  filter === f ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <AuctionGrid
          auctions={filtered}
          stats={stats}
          isLoading={isLoading}
          isError={isError}
          emptyTitle={filter === "live" ? "No live drops right now" : "Nothing here yet"}
          emptyBody={filter === "live" ? "Check back soon, or list one yourself." : "List a drop to get started."}
        />
      </section>
    </div>
  )
}
