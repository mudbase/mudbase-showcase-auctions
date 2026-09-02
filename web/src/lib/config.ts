function requireEnv(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

export const MUDBASE_PROJECT_ID = requireEnv(
  "NEXT_PUBLIC_MUDBASE_PROJECT_ID",
  process.env.NEXT_PUBLIC_MUDBASE_PROJECT_ID,
)
export const MUDBASE_URL = process.env.NEXT_PUBLIC_MUDBASE_URL ?? "https://cloud.mudbase.dev"

// Project publishable key - kept for parity with the platform dashboard and
// forward-compatibility. Collection access is authorized by the end-user's bearer JWT, so this
// value is not attached to any request from the browser today.
export const MUDBASE_API_KEY = process.env.NEXT_PUBLIC_MUDBASE_API_KEY ?? ""

export const AUCTIONS_COLLECTION_ID = requireEnv(
  "NEXT_PUBLIC_AUCTIONS_COLLECTION_ID",
  process.env.NEXT_PUBLIC_AUCTIONS_COLLECTION_ID,
)
export const BIDS_COLLECTION_ID = requireEnv(
  "NEXT_PUBLIC_BIDS_COLLECTION_ID",
  process.env.NEXT_PUBLIC_BIDS_COLLECTION_ID,
)

// The currency all drops in this demo are priced in. Mudbase payment collection supports card
// and mobile-money; the display currency here is a simple app-level choice, not a platform limit.
export const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY ?? "USD"
