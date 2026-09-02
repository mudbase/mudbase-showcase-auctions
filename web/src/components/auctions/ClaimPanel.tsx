"use client"

import { useState } from "react"
import { CheckCircle2, CreditCard, Smartphone, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatMoney } from "@/lib/utils"
import type { UserObject } from "@/lib/mudbase"
import type { Auction } from "@/types/auction"

export function ClaimPanel({
  auction,
  amountDue,
  user,
  claimed,
}: {
  auction: Auction
  amountDue: number
  user: UserObject | null
  claimed: boolean
}): React.JSX.Element {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [unavailable, setUnavailable] = useState(false)

  if (claimed) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-accent/40 bg-accent/5 p-4">
        <CheckCircle2 className="mt-0.5 h-5 w-5 text-accent" />
        <div className="text-sm">
          <p className="font-medium">Payment received - you&apos;ve claimed this drop.</p>
          <p className="text-muted-foreground">A receipt has been sent to your email.</p>
        </div>
      </div>
    )
  }

  const onPay = async (): Promise<void> => {
    if (!user) return
    setLoading(true)
    setMessage(null)
    setUnavailable(false)
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auctionId: auction._id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`.trim(),
          origin: window.location.origin,
        }),
      })
      const body = (await res.json().catch(() => ({}))) as { link?: string; error?: string; reason?: string }
      if (res.ok && body.link) {
        window.location.href = body.link
        return
      }
      if (body.reason === "collection_unavailable" || body.reason === "not_configured") {
        setUnavailable(true)
        setMessage(body.error ?? "Payment collection is being finalized for this demo.")
      } else {
        setMessage(body.error ?? "Could not start checkout. Please try again.")
      }
    } catch {
      setMessage("Could not reach checkout. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-border bg-secondary/40 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">You won - amount due</p>
          <p className="text-2xl font-bold tabular-nums">{formatMoney(amountDue, auction.currency)}</p>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <CreditCard className="h-5 w-5" />
          <Smartphone className="h-5 w-5" />
        </div>
      </div>
      <Button onClick={() => void onPay()} disabled={loading} className="w-full" size="lg">
        {loading ? "Starting checkout…" : "Pay to claim"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">Pay securely by card or mobile money.</p>
      {message && (
        <div
          role="status"
          className={
            unavailable
              ? "flex items-start gap-2 rounded-md border border-border bg-background p-3 text-xs text-muted-foreground"
              : "text-center text-sm text-destructive"
          }
        >
          {unavailable && <Info className="mt-0.5 h-4 w-4 shrink-0" />}
          <span>{message}</span>
        </div>
      )}
    </div>
  )
}
