"use client"

import { useEffect, useMemo } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useMudbase } from "@/lib/mudbase-provider"
import { getMudbaseSocket } from "@/lib/mudbase-socket"
import { BIDS_COLLECTION_ID } from "@/lib/config"
import type { ListResponse } from "@/lib/mudbase"
import type { Bid } from "@/types/bid"

const indexKey = ["bids", "index"] as const

export interface AuctionBidStats {
  highest: number
  count: number
  topBidderName: string | null
  topBidderId: string | null
}

interface RowEvent {
  collectionId: string
  action: string
  data: Bid
}

/**
 * One query + one realtime subscription that powers the "current bid" and "N bids" figures on
 * every card in the grid at once - instead of a query per card. New bids anywhere stream in live
 * via the shared `bids` collection room and update the whole grid without a refetch.
 */
export function useBidIndex(): { stats: Map<string, AuctionBidStats>; isLoading: boolean } {
  const { client, session, loading: sessionLoading } = useMudbase()
  const queryClient = useQueryClient()
  const projectId = client.getProjectId()

  const query = useQuery<ListResponse<Bid>>({
    queryKey: indexKey,
    queryFn: () => client.getDocuments<Bid>(BIDS_COLLECTION_ID, { sort: "-createdAt", limit: 500 }),
    enabled: !!session,
  })

  useEffect(() => {
    const socket = getMudbaseSocket()
    const trySubscribe = (): void => {
      if (!socket.connected) return
      socket.emit("subscribe:collection", { projectId, collectionId: BIDS_COLLECTION_ID })
    }
    trySubscribe()
    const offStatus = socket.onStatus(trySubscribe)
    const onCreate = (ev: RowEvent): void => {
      if (ev.collectionId !== BIDS_COLLECTION_ID) return
      queryClient.setQueryData<ListResponse<Bid>>(indexKey, (prev) => {
        if (!prev) return prev
        if (prev.data.some((b) => b._id === ev.data._id)) return prev
        return { ...prev, data: [ev.data, ...prev.data] }
      })
    }
    const offCreate = socket.on<RowEvent>("db:create", onCreate)
    return () => {
      offStatus()
      offCreate()
    }
  }, [projectId, queryClient])

  const stats = useMemo(() => {
    const map = new Map<string, AuctionBidStats>()
    for (const bid of query.data?.data ?? []) {
      const cur = map.get(bid.auctionId)
      if (!cur) {
        map.set(bid.auctionId, {
          highest: bid.amount,
          count: 1,
          topBidderName: bid.bidderName,
          topBidderId: bid.bidderId,
        })
      } else {
        cur.count += 1
        if (bid.amount > cur.highest) {
          cur.highest = bid.amount
          cur.topBidderName = bid.bidderName
          cur.topBidderId = bid.bidderId
        }
      }
    }
    return map
  }, [query.data])

  return { stats, isLoading: query.isLoading || (sessionLoading && !query.data) }
}
