#!/usr/bin/env node
/**
 * One-shot provisioning for the Live Bid showcase - dogfoods the Mudbase API end to end:
 * creates the project, the two collections (with realtime + ownership permissions), the
 * "bidder" application role, and a scoped server-side payments API key. Prints the exact
 * env block to paste into web/.env.local (and your Vercel project).
 *
 * Auth: Mudbase console signup is protected by an invisible score-based CAPTCHA, so a headless
 * agent cannot self-register (see the repo README "Onboarding friction"). This script therefore
 * signs IN with an existing console org-owner account (org-owner login is NOT CAPTCHA-gated),
 * or accepts a bearer token you already hold.
 *
 *   MUDBASE_OWNER_EMAIL=you@example.com MUDBASE_OWNER_PASSWORD=... node scripts/provision.mjs
 *   # or
 *   MUDBASE_OWNER_TOKEN=<access-jwt> node scripts/provision.mjs
 *
 * Optional: MUDBASE_URL (default https://cloud.mudbase.dev), CURRENCY (default USD).
 */

const BASE = process.env.MUDBASE_URL || "https://cloud.mudbase.dev"
const CURRENCY = process.env.CURRENCY || "USD"

async function api(path, { method = "GET", token, body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  const json = text ? JSON.parse(text) : {}
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}: ${json.error || text}`)
  return json
}

async function getToken() {
  if (process.env.MUDBASE_OWNER_TOKEN) return process.env.MUDBASE_OWNER_TOKEN
  const email = process.env.MUDBASE_OWNER_EMAIL
  const password = process.env.MUDBASE_OWNER_PASSWORD
  if (!email || !password) {
    throw new Error("Set MUDBASE_OWNER_EMAIL + MUDBASE_OWNER_PASSWORD, or MUDBASE_OWNER_TOKEN.")
  }
  // Org-owner login omits projectId, so it is not CAPTCHA-gated.
  const res = await api("/api/auth/local/login", { method: "POST", body: { email, password } })
  if (!res.token) throw new Error("Login returned no token (email verification pending?).")
  return res.token
}

const AUCTION_FIELDS = [
  { name: "title", type: "string", required: true },
  { name: "description", type: "string", required: true },
  { name: "imageUrl", type: "url" },
  { name: "startingPrice", type: "number", required: true },
  { name: "currency", type: "string", required: true },
  { name: "status", type: "string", required: true },
  { name: "endsAt", type: "date", required: true },
  { name: "sellerId", type: "string", required: true },
  { name: "sellerName", type: "string", required: true },
  { name: "winnerId", type: "string" },
  { name: "winnerName", type: "string" },
  { name: "claimed", type: "boolean" },
]

const BID_FIELDS = [
  { name: "auctionId", type: "string", required: true },
  { name: "amount", type: "number", required: true },
  { name: "bidderId", type: "string", required: true },
  { name: "bidderName", type: "string", required: true },
]

// Any signed-in user reads/creates; only the document owner can update/delete their own row.
const AUCTION_PERMISSIONS = [
  { role: "authenticated", actions: ["read", "create"] },
  { role: "owner", actions: ["read", "create", "update", "delete"] },
]
// Bids are append-only: read + create for everyone signed in, no update/delete.
const BID_PERMISSIONS = [
  { role: "authenticated", actions: ["read", "create"] },
  { role: "owner", actions: ["read", "create"] },
]

async function main() {
  const token = await getToken()
  console.log("Authenticated. Creating project…")

  const projectRes = await api("/api/projects", {
    method: "POST",
    token,
    body: { name: "Live Bid", description: "Live-auction / paid-drops showcase built on Mudbase." },
  })
  const project = projectRes.project || projectRes.data || projectRes
  const projectId = project._id || project.id
  console.log("  projectId:", projectId)

  const mkCollection = async (name, slug, fields, permissions) => {
    const res = await api(`/api/schemas/projects/${projectId}/collections`, {
      method: "POST",
      token,
      body: { name, slug, fields, permissions, settings: { enableRealtime: true } },
    })
    const col = res.collection || res.data || res
    console.log(`  ${slug} collection:`, col._id || col.id)
    return col._id || col.id
  }

  const auctionsId = await mkCollection("Auctions", "auctions", AUCTION_FIELDS, AUCTION_PERMISSIONS)
  const bidsId = await mkCollection("Bids", "bids", BID_FIELDS, BID_PERMISSIONS)

  // Application role that end-users sign up as.
  try {
    await api(`/api/projects/${projectId}/multi-role/roles`, {
      method: "POST",
      token,
      body: { slug: "bidder", name: "Bidder", signupEndpoint: "bidder" },
    })
    console.log("  role: bidder")
  } catch (e) {
    console.warn("  role create skipped/failed (set NEXT_PUBLIC_APP_ROLE to the default role if needed):", e.message)
  }

  // Scoped server-side payments key: read collection data + start payment collection.
  const keyRes = await api("/api/api-keys", {
    method: "POST",
    token,
    body: {
      projectId,
      name: "live-bid-payments",
      permissions: [
        { resource: "database", actions: ["read"] },
        { resource: "payments", actions: ["create"] },
      ],
    },
  })
  const apiKey = keyRes.apiKey || keyRes.key || keyRes.data
  const rawKey = apiKey?.rawKey || apiKey?.key || keyRes.rawKey
  console.log("  payments API key:", rawKey ? "created" : "created (retrieve raw value from response)")

  console.log("\n--- paste into web/.env.local ---\n")
  console.log(`NEXT_PUBLIC_MUDBASE_URL=${BASE}`)
  console.log(`NEXT_PUBLIC_MUDBASE_PROJECT_ID=${projectId}`)
  console.log(`NEXT_PUBLIC_AUCTIONS_COLLECTION_ID=${auctionsId}`)
  console.log(`NEXT_PUBLIC_BIDS_COLLECTION_ID=${bidsId}`)
  console.log(`NEXT_PUBLIC_CURRENCY=${CURRENCY}`)
  console.log(`NEXT_PUBLIC_APP_ROLE=bidder`)
  console.log(`MUDBASE_PAYMENTS_API_KEY=${rawKey || "<copy from api-key response>"}`)
  console.log("\nDone.")
}

main().catch((err) => {
  console.error("Provisioning failed:", err.message)
  process.exit(1)
})
