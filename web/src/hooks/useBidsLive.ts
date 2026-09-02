"use client"

import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { getMudbaseSocket } from "@/lib/mudbase-socket"
import { useMudbase } from "@/lib/mudbase-provider"
import { BIDS_COLLECTION_ID } from "@/lib/config"
import { addBidToCache } from "@/hooks/useBids"
import type { Bid } from "@/types/bid"

interface RowEvent {
  projectId: string
  collectionId: string
  action: string
  data: Bid
  timestamp: string
}

/**
 * Live bidding: subscribes to the `bids` collection's realtime room so a bid placed by anyone
 * else on this auction appears instantly - driving the shared "current price" up in real time
 * with no polling. Same `subscribe:collection` / `db:create` contract the other Mudbase
 * showcases use for their live feeds.
 */
export function useBidsLive(auctionId: string | null | undefined): void {
  const { client } = useMudbase()
  const queryClient = useQueryClient()
  const projectId = client.getProjectId()

  useEffect(() => {
    if (!auctionId) return
    const socket = getMudbaseSocket()

    const trySubscribe = (): void => {
      if (!socket.connected) return
      socket.emit("subscribe:collection", { projectId, collectionId: BIDS_COLLECTION_ID })
    }
    trySubscribe()
    const offStatus = socket.onStatus(trySubscribe)

    const onCreate = (ev: RowEvent): void => {
      if (ev.collectionId !== BIDS_COLLECTION_ID) return
      if (ev.data.auctionId !== auctionId) return
      addBidToCache(queryClient, auctionId, ev.data)
    }
    const offCreate = socket.on<RowEvent>("db:create", onCreate)

    return () => {
      socket.emit("unsubscribe:collection", { collectionId: BIDS_COLLECTION_ID })
      offStatus()
      offCreate()
    }
  }, [auctionId, projectId, queryClient])
}
