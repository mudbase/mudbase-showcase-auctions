# Mudbase Showcase - Live Bid

A live-auction / paid-drops app built **entirely on [Mudbase](https://www.mudbase.dev)** - auth,
database, realtime, and **payment collection** - with **zero custom backend**. List a one-of-a-kind
item, watch bids climb the instant they land, and let the winner check out by card or mobile money.

This is a reference implementation: every feature below is wired to the real Mudbase API, not a
mock. It shows four Mudbase capabilities working together in one project.

## What it does

| Feature | Mudbase capability | Where |
|---|---|---|
| Sign up / sign in, guest browsing, sessions | **Auth** (local email/password, anonymous sessions, JWT + refresh) | `web/src/hooks/useAuth.ts`, `web/src/lib/mudbase.ts` |
| Create & list auction "drops" | **Database** (collections, ownership-scoped permissions) | `auctions` collection, `web/src/hooks/useAuctions.ts` |
| Bids that update live for every viewer | **Realtime** (collection rooms, `db:create` / `db:update`) | `bids` collection, `web/src/hooks/useBidsLive.ts`, `useAuctionsLive.ts` |
| Winner pays to claim at checkout | **Payment collection** (card + mobile money) | `web/src/app/api/checkout/route.ts`, `web/src/lib/mudbase-server.ts` |

Everyone signs up as a single role (`bidder`): you can host your own drops **and** bid on others'.
The current price of a drop is derived from its highest bid, so every user only ever writes their
own documents - clean ownership, with a shared live price driven by realtime events.

### Honest scope

- **Payments = collection only.** The app collects the winning bidder's payment (get-paid). It does
  **not** disburse or settle to a seller - there is no payout side. In production, a Mudbase payment
  webhook would confirm the collection and mark the drop claimed.
- No wallet, no KYC flow, no streaming - just the four capabilities above.

## Built on Mudbase

One Mudbase project is the entire backend. There is no server of our own: the browser talks to
Mudbase for auth, data, and realtime; a single Next.js Route Handler (`/api/checkout`) holds a
server-side scoped key to start collecting a payment. Nothing else runs server-side.

## Setup

```
# 1. Clone
git clone https://github.com/mudbase/mudbase-showcase-auctions
cd mudbase-showcase-auctions/web

# 2. Provision a Mudbase project + key (dogfoods the API - creates the project,
#    the two collections, the "bidder" role, and a scoped payments key)
MUDBASE_OWNER_EMAIL=you@example.com MUDBASE_OWNER_PASSWORD=... node ../scripts/provision.mjs
#    ...then paste the printed env block into web/.env.local
#    (or set the same values by hand from the Mudbase console - see .env.example)

# 3. Run
npm install
npm run dev        # http://localhost:3000
```

Then set your Mudbase key: copy `web/.env.example` to `web/.env.local` and fill in your project ID,
the two collection IDs, and your scoped payments key (`MUDBASE_PAYMENTS_API_KEY`, server-only -
never prefix it with `NEXT_PUBLIC_`).

Built with Mudbase One-Shot: https://www.mudbase.dev/oneshot

## Data model

- **auctions** - `title`, `description`, `imageUrl`, `startingPrice`, `currency`, `status`
  (`live` / `ended`), `endsAt`, `sellerId`, `sellerName`, `winnerId?`, `winnerName?`, `claimed?`.
  Permissions: any signed-in user reads and creates; only the owner updates/deletes their own.
- **bids** - `auctionId`, `amount`, `bidderId`, `bidderName`. Append-only: read + create for any
  signed-in user, no update/delete. Realtime enabled - new bids stream to every open tab.

## Payment collection flow

1. A drop closes (its timer runs out, or the host closes it early).
2. The winning bidder clicks **Pay to claim**.
3. The `/api/checkout` Route Handler re-derives the amount from the real winning bid server-side
   (never trusting a client-sent price), then asks Mudbase to start collecting the payment and
   returns a hosted checkout link.
4. The winner is redirected to pay by **card or mobile money**, then returns to the drop.

If a demo project has not finished enabling payment collection, Mudbase returns a clear "not yet
available" response and the UI says so honestly - it never fakes a paid outcome.

## Known limitations

- **Auction images are plain URLs.** Mudbase file/bucket creation is gated to org-level roles, so
  a project end-user JWT can't upload; paste an image URL instead.
- **Claiming is confirmed client-side after checkout for the demo.** A production build would set
  `claimed` from a server-side Mudbase payment webhook, not the browser.

## Onboarding friction (dogfooding feedback)

Provisioning was attempted programmatically first. The Mudbase **console signup is protected by an
invisible, score-based CAPTCHA**, which blocks automated/agent self-registration outright (a
datacenter request scores far below the pass threshold). Org-owner **login** is not CAPTCHA-gated,
so `scripts/provision.mjs` signs in with an existing console account and drives the rest via the
API. Worth considering: an API-token or headless path to create a first project/key without the
interactive CAPTCHA, for exactly this kind of automated reference build.

## License

MIT - see [LICENSE](./LICENSE).

---

Content byline: Mudbase Team.
