import { Badge } from "@/components/ui/badge"
import type { Auction } from "@/types/auction"

export function AuctionStatusBadge({ auction }: { auction: Auction }): React.JSX.Element {
  if (auction.status === "live") {
    return (
      <Badge className="gap-1.5 bg-accent text-accent-foreground">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
        </span>
        Live
      </Badge>
    )
  }
  if (auction.claimed) return <Badge variant="secondary">Claimed</Badge>
  return <Badge variant="outline">Ended</Badge>
}
