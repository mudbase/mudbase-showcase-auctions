"use client"

import Link from "next/link"
import { Gavel, LogOut, PlusCircle, Package } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"

export function Header(): React.JSX.Element {
  const { isAuthenticated, logout } = useAuth()

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-xl font-semibold tracking-tight">
          <Gavel className="h-5 w-5 text-primary" />
          Live Bid
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          {isAuthenticated && (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/auctions/mine">
                  <Package className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">My drops</span>
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/auctions/new">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">List a drop</span>
                </Link>
              </Button>
            </>
          )}

          {isAuthenticated ? (
            <Button variant="outline" size="sm" onClick={() => void logout()}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">Sign up</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
