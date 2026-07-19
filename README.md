# Aegis — Monad-Native Intelligence

> Traders lose an hour every morning reading Monad by hand. Aegis replaces that hour with one grounded briefing built on live Monad RPC. Evidence, not vibes.

Aegis is a fully on-chain intelligence layer for Monad. It reads Monad the way a professional desk would: rolling TPS, gas load, whale flow, narrative rotation, wallet risk. Every claim in the UI and every sentence Ask Aegis writes is anchored to a real Monad event with a citable `[E-<id>]` receipt.

Built for the BA vibecode hackathon (theme: *something that solves a daily problem*) and aimed squarely at Monad mainnet.

---

## What ships

| Surface | What it does | Powered by |
| --- | --- | --- |
| **Live Firehose** (landing) | Real Monad RPC: head block, rolling TPS, per-block tx bars, gas gwei | `eth_blockNumber`, batched `eth_getBlockByNumber` |
| **Wallet Guardian** (landing) | Paste any Monad address, get balance, tx count, contract check, gas runway, A–F grade | Batched `eth_getBalance` / `eth_getTransactionCount` / `eth_getCode` |
| **Market Brief** (`/app`) | AI-written daily brief grounded in Monad market state | AI Gateway + evidence engine |
| **Intelligence Timeline** (`/app/timeline`) | Every event carries a citable `[E-<id>]` id | Deterministic evidence engine |
| **Replay the Chain** (`/app/replay`) | Scrub any recent window and watch whales / liquidity / price rebuild block-by-block | Simulated Monad state seeded from live head |
| **Opportunity Engine** (`/app/opportunities`) | Setups scored on momentum, turnover, whale flow, narrative, each with 3 evidence receipts | `src/lib/opportunity-engine.ts` |
| **Wallet DNA** (`/app/wallet`) | Behavioural profile for any address | `src/lib/wallet-dna.ts` |
| **Ask Aegis** (`/app/chat`) | Tool-calling agent: `inspectMonadWallet`, `getMonadFirehose`, `rankOpportunities`, `lookupEvent`. Cites `[E-<id>]` back into the timeline | AI SDK + Lovable AI Gateway |
| **Daily Digest** (`/app/digest`) | 60-second morning read replacing the manual research routine | Evidence engine |
| **On-Chain** (`/app/onchain`) | Subscribe, set watchlists, commit portfolio snapshots, verify AI briefs, all on Monad | `contracts/AegisRegistry.sol` + viem |
| **Judges · 30s tour** | Scripted 7-step auto-tour of every flagship surface | `src/components/aegis/demo-mode.tsx` |

---

## The on-chain layer

`contracts/AegisRegistry.sol` deploys to Monad and exposes:

- `subscribe(months)` — payable in MON, unlocks Pro tier.
- `setWatchlist(bytes32[])` — per-user watchlist (max 32 tickers).
- `snapshotPortfolio(hash, uri)` — daily commitments that can be proven later.
- `publishBrief(hash, uri)` / `verifyBrief(hash)` — publisher-signed AI brief attestations anyone can verify.

All writes emit indexed events (The Graph / Envio ready). See `contracts/README.md` for a one-shot Remix deploy walkthrough.

### Deployment

| Network | Chain ID | Address |
| --- | --- | --- |
| Monad Mainnet | `143` | *paste `VITE_AEGIS_CONTRACT_ADDRESS` after deploy* |
| Monad Testnet | `10143` | *paste `VITE_AEGIS_CONTRACT_ADDRESS` after deploy* |

Configure via `.env`:

```
VITE_AEGIS_CONTRACT_ADDRESS=0xYourDeployedAddress
VITE_AEGIS_CHAIN=mainnet    # or "testnet"
```

---

## Architecture

- **Framework** — TanStack Start (React 19, Vite 7, SSR on Cloudflare Workers).
- **Live chain reads** — `src/lib/monad-live.functions.ts` and `src/lib/wallet-guardian.functions.ts` batch JSON-RPC calls against Monad, with a 2s worker-memory cache so the ticker feels live without saturating the RPC.
- **Evidence-first AI** — `src/lib/intelligence.functions.ts` builds a deterministic evidence bus. `src/routes/api/chat.ts` runs a tool-calling agent (`google/gemini-2.0-flash` via Lovable AI Gateway) that can call `inspectMonadWallet`, `getMonadFirehose`, `rankOpportunities`, `lookupEvent` and must cite `[E-<id>]` back to the timeline.
- **Wallet** — `src/lib/monad-wallet.ts` handles EIP-1193 injection, iframe detection, mainnet/testnet switching.
- **On-chain writes** — `src/routes/app.onchain.tsx` uses viem for subscribe / watchlist / snapshot / attest flows against `AegisRegistry`.

### Why Monad

Aegis was built for Monad's characteristics on purpose. Sub-second finality and 10k TPS are what make a live firehose, a scrubbable replay, and evidence-anchored answers feel *instant*. On slower L1s this product is a delayed dashboard. On Monad it is a live desk.

---

## Running locally

```bash
bun install
bun dev             # http://localhost:8080
```

Set `LOVABLE_API_KEY` (Ask Aegis + Market Brief) and optionally `VITE_AEGIS_CONTRACT_ADDRESS` (on-chain writes).

---

## Judging in 30 seconds

Every page (landing + app) has a floating **Judges · 30s tour** button. One click auto-navigates through the 7 flagship surfaces with captions and a timer. Ideal for hackathon review.

---

## Demo script (Loom, ~90s)

1. **0:00** Landing hero → Live Firehose ticking, real head block, real TPS.
2. **0:15** Wallet Guardian: paste your own address → A–F grade in one call.
3. **0:30** `/app` dashboard → Intelligence Timeline with `[E-<id>]` receipts.
4. **0:45** `/app/replay` → scrub the timeline, watch whales rebuild block-by-block.
5. **1:00** `/app/opportunities` → open a setup, show the three evidence receipts.
6. **1:15** `/app/chat` → ask *"is 0x… safe and what's the top MON setup right now?"*. Agent calls `inspectMonadWallet` + `rankOpportunities`, cites `[E-<id>]`.
7. **1:25** `/app/onchain` → subscribe on Monad mainnet; show tx hash on monadexplorer.
8. **1:30** Hit **Judges · 30s tour** to close.

---

## Repo layout

```
contracts/          AegisRegistry.sol + Remix deploy notes
src/routes/         TanStack routes (landing, app.*, api/chat)
src/routes/api/     Streaming chat endpoint (tool-calling agent)
src/lib/            Monad RPC, wallet, evidence engine, opportunity/wallet DNA
src/components/     LiveFirehose, WalletGuardian, DemoMode, FloatingChat, sidebar
```

Built with love for the Monad ecosystem.
