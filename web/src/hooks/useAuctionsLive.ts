"use client"

import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { getMudbaseSocket } from "@/lib/mudbase-socket"
import { useMudbase } from "@/lib/mudbase-provider"
import { AUCTIONS_COLLECTION_ID } from "@/lib/config"
import { upsertAuction } from "@/hooks/useAuctions"
import type { Auction } from "@/types/auction"

interface RowEvent {
  projectId: string
  collectionId: string
  action: string
  data: Auction
  timestamp: string
}

/**
 * Live catalog: new drops appear and status changes (a drop closing, a winner being set)
 * propagate to every open tab instantly via the `auctions` collection's realtime room.
 */
export function useAuctionsLive(enabled: boolean): void {
  const { client } = useMudbase()
  const queryClient = useQueryClient()
  const projectId = client.getProjectId()

  useEffect(() => {
    if (!enabled) return
    const socket = getMudbaseSocket()

    const trySubscribe = (): void => {
      if (!socket.connected) return
      socket.emit("subscribe:collection", { projectId, collectionId: AUCTIONS_COLLECTION_ID })
    }
    trySubscribe()
    const offStatus = socket.onStatus(trySubscribe)

    const onCreate = (ev: RowEvent): void => {
      if (ev.collectionId !== AUCTIONS_COLLECTION_ID) return
      upsertAuction(queryClient, ev.data)
    }
    const onUpdate = (ev: RowEvent): void => {
      if (ev.collectionId !== AUCTIONS_COLLECTION_ID) return
      upsertAuction(queryClient, ev.data)
    }
    const offCreate = socket.on<RowEvent>("db:create", onCreate)
    const offUpdate = socket.on<RowEvent>("db:update", onUpdate)

    return () => {
      socket.emit("unsubscribe:collection", { collectionId: AUCTIONS_COLLECTION_ID })
      offStatus()
      offCreate()
      offUpdate()
    }
  }, [enabled, projectId, queryClient])
}
