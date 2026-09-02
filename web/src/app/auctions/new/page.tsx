"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CreateAuctionForm } from "@/components/auctions/CreateAuctionForm"
import { useAuth } from "@/hooks/useAuth"

export default function NewAuctionPage(): React.JSX.Element {
  const { isAuthenticated, loading } = useAuth()

  return (
    <div className="container max-w-xl py-12">
      <Card>
        <CardHeader>
          <CardTitle>List a drop</CardTitle>
          <CardDescription>Put an item up for live bidding. The highest bidder pays to claim when it closes.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : isAuthenticated ? (
            <CreateAuctionForm />
          ) : (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">Sign in to list a drop.</p>
              <div className="flex justify-center gap-2">
                <Button asChild variant="outline">
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">Create account</Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
