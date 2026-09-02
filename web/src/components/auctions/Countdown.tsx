"use client"

import { useEffect, useState } from "react"
import { Clock } from "lucide-react"
import { timeRemaining } from "@/lib/utils"
import { cn } from "@/lib/utils"

/**
 * Ticking countdown to an ISO deadline. Fires `onEnded` once when the deadline passes so a
 * parent can flip local UI (e.g. open checkout) without waiting for a round-trip.
 */
export function Countdown({
  endsAt,
  className,
  onEnded,
}: {
  endsAt: string
  className?: string
  onEnded?: () => void
}): React.JSX.Element {
  const [state, setState] = useState(() => timeRemaining(endsAt))

  useEffect(() => {
    setState(timeRemaining(endsAt))
    const id = setInterval(() => {
      const next = timeRemaining(endsAt)
      setState((prev) => {
        if (next.ended && !prev.ended) onEnded?.()
        return next
      })
      if (next.ended) clearInterval(id)
    }, 1000)
    return () => clearInterval(id)
  }, [endsAt, onEnded])

  return (
    <span className={cn("inline-flex items-center gap-1.5 tabular-nums", state.ended && "text-muted-foreground", className)}>
      <Clock className="h-4 w-4" />
      {state.ended ? "Ended" : state.label}
    </span>
  )
}
