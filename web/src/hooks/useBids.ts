"use client"

import { useMemo } from "react"
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query"
import { useMudbase } from "@/lib/mudbase-provider"
import { BIDS_COLLECTION_ID } from "@/lib/config"
import type { ListResponse } from "@/lib/mudbase"
import type { Bid, NewBid } from "@/types/bid"

const bidsKey = (auctionId: string) => ["bids", auctionId] as const

/** Every bid on one auction, highest first. Live bids arrive via useBidsLive into this cache. */
export function useBids(auctionId: string | null | undefined) {
  const { client, session } = useMudbase()
  const query = useQuery<ListResponse<Bid>>({
    queryKey: bidsKey(auctionId ?? "none"),
    queryFn: () => {
      if (!auctionId) throw new Error("useBids called without an auctionId")
      return client.getDocuments<Bid>(BIDS_COLLECTION_ID, {
        filter: { auctionId },
        sort: "-amount",
        limit: 100,
      })
    },
    enabled: !!auctionId && !!session,
  })

  const bids = useMemo(() => query.data?.data ?? [], [query.data])
  const highest = bids.length > 0 ? bids[0] : null
  return { ...query, bids, highest }
}

export function usePlaceBid(auctionId: string) {
  const { client } = useMudbase()
  const queryClient = useQueryClient()
  return useMutation<Bid, Error, NewBid>({
    mutationFn: (data) => client.createDocument<Bid>(BIDS_COLLECTION_ID, data),
    onSuccess: (created) => {
      addBidToCache(queryClient, auctionId, created)
    },
  })
}

// ── Cache helpers (shared with useBidsLive) ──────────────────────────────────

/** Insert a bid into an auction's bid cache, keeping it sorted highest-first and de-duped. */
export function addBidToCache(queryClient: QueryClient, auctionId: string, bid: Bid): void {
  queryClient.setQueryData<ListResponse<Bid>>(bidsKey(auctionId), (prev) => {
    if (!prev) return prev
    if (prev.data.some((b) => b._id === bid._id)) return prev
    const data = [...prev.data, bid].sort((a, b) => b.amount - a.amount)
    return { ...prev, data }
  })
}
