"use client"

import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query"
import { useMudbase } from "@/lib/mudbase-provider"
import { AUCTIONS_COLLECTION_ID } from "@/lib/config"
import type { ListResponse } from "@/lib/mudbase"
import type { Auction, NewAuction } from "@/types/auction"

const auctionsKey = ["auctions", "list"] as const
const auctionKey = (id: string) => ["auctions", "doc", id] as const

/** All drops, newest first. Live updates arrive via useAuctionsLive writing into this cache. */
export function useAuctions() {
  const { client, session, loading: sessionLoading } = useMudbase()
  const result = useQuery<ListResponse<Auction>>({
    queryKey: auctionsKey,
    queryFn: () => client.getDocuments<Auction>(AUCTIONS_COLLECTION_ID, { sort: "-createdAt", limit: 100 }),
    enabled: !!session,
  })
  return { ...result, isLoading: result.isLoading || (sessionLoading && !result.data) }
}

export function useAuction(id: string | null | undefined) {
  const { client } = useMudbase()
  return useQuery<Auction>({
    queryKey: auctionKey(id ?? "none"),
    queryFn: () => {
      if (!id) throw new Error("useAuction called without an id")
      return client.getDocument<Auction>(AUCTIONS_COLLECTION_ID, id)
    },
    enabled: !!id,
  })
}

export function useCreateAuction() {
  const { client } = useMudbase()
  const queryClient = useQueryClient()
  return useMutation<Auction, Error, NewAuction>({
    mutationFn: (data) => client.createDocument<Auction>(AUCTIONS_COLLECTION_ID, data),
    onSuccess: (created) => {
      upsertAuction(queryClient, created)
      queryClient.setQueryData(auctionKey(created._id), created)
    },
  })
}

export function useEndAuction() {
  const { client } = useMudbase()
  const queryClient = useQueryClient()
  return useMutation<Auction, Error, { auctionId: string; winnerId: string | null; winnerName: string | null }>({
    mutationFn: ({ auctionId, winnerId, winnerName }) =>
      client.updateDocument<Auction>(AUCTIONS_COLLECTION_ID, auctionId, {
        status: "ended",
        winnerId,
        winnerName,
      }),
    onSuccess: (updated) => {
      upsertAuction(queryClient, updated)
      queryClient.setQueryData(auctionKey(updated._id), updated)
    },
  })
}

export function useMarkClaimed() {
  const { client } = useMudbase()
  const queryClient = useQueryClient()
  return useMutation<Auction, Error, string>({
    mutationFn: (auctionId) => client.updateDocument<Auction>(AUCTIONS_COLLECTION_ID, auctionId, { claimed: true }),
    onSuccess: (updated) => {
      upsertAuction(queryClient, updated)
      queryClient.setQueryData(auctionKey(updated._id), updated)
    },
  })
}

// ── Cache helpers (shared with useAuctionsLive) ──────────────────────────────

/** Insert a new auction (front) or replace an existing one in place, without reordering. */
export function upsertAuction(queryClient: QueryClient, auction: Auction): void {
  queryClient.setQueryData<ListResponse<Auction>>(auctionsKey, (prev) => {
    if (!prev) return prev
    const idx = prev.data.findIndex((a) => a._id === auction._id)
    if (idx === -1) return { ...prev, data: [auction, ...prev.data] }
    const next = prev.data.slice()
    next[idx] = auction
    return { ...prev, data: next }
  })
  queryClient.setQueryData(auctionKey(auction._id), auction)
}
