# Aegis — Monad-Native Intelligence

> Every morning: 14 open tabs, 6 Discords, 3 Telegrams, one Twitter timeline of screenshots. Twenty minutes of scrolling to answer *"what actually moved on Monad since I slept?"* — Aegis answers it in **seven seconds**, with block-anchored proof.

**Live:** https://aegis.glavior.ai · **Mainnet:** Chain 143 · **Contract:** [`0x740CDB7Cb4e2d7bA3e6296E4CB48f0A820688782`](https://monadexplorer.com/address/0x740CDB7Cb4e2d7bA3e6296E4CB48f0A820688782)

Aegis is a Monad-native intelligence layer that solves a real daily chore: the manual morning research grind. It reads Monad the way a professional desk would — rolling TPS, gas load, whale flow, narrative rotation, wallet risk — and every claim in the UI, plus every sentence Ask Aegis writes, is anchored to a real event with a citable `[E-<id>]` receipt you can open in Replay or verify on-chain.

Built for the **BuildAnything · Spark** hackathon (theme: *something that solves a daily problem*), deployed to **Monad Mainnet** (+500 XP path).

---

## What ships

| Surface | What it does | Powered by |
| --- | --- | --- |
| **Address Inspector** (landing + `/app/wallet`) | Paste any Monad address → balance, tx count, contract check, gas runway, A–F grade | Batched `eth_getBalance` / `eth_getTransactionCount` / `eth_getCode` |
| **Daily Digest** (`/app/digest`) | 60-second morning read that replaces the 20-minute research chore | Evidence engine |
| **Intelligence Timeline** (`/app/timeline`) | Every event carries a citable `[E-<id>]` id, a **Verify** drawer with tx/block links, and an **Explain with Aegis** deep-link | Deterministic evidence engine + `verify-button.tsx` |
| **Replay the Chain** (`/app/replay`) | Scrub 1h/6h/24h and watch whales / liquidity / narratives rebuild UTC block-by-block. Events reveal only as the playhead passes them. | RPC-anchored samples spread across the full window |
| **Opportunity Engine** (`/app/opportunities`) | Setups scored on momentum, turnover, whale flow, narrative — each with 3 evidence receipts | `src/lib/opportunity-engine.ts` |
| **Whale Intelligence** (`/app/whales`) | Cluster maps, buy/sell distribution, "Insufficient Evidence" states when volume is zero | Evidence engine |
| **Market Radar** (`/app/radar`) | All-chain radar with Monad pinned at the top, live Binance/CoinGecko prices | `src/lib/binance-prices.ts` |
| **Ask Aegis** (`/app/chat`) | Tool-calling agent: `inspectMonadWallet`, `getMonadFirehose`, `rankOpportunities`, `lookupEvent`. Cites `[E-<id>]` back into the timeline. Verify/Explain deep-links preload the event id. | AI SDK + Lovable AI Gateway |
| **On-Chain Registry** (`/app/onchain`) | Subscribe (payable MON), set watchlists, snapshot portfolios, publish + verify AI briefs — all on Monad Mainnet | `contracts/AegisRegistry.sol` + viem |
| **Judges · 30-Second Tour** | Persistent auto-tour of every flagship surface, driven by a global host so it survives route changes | `src/components/aegis/demo-mode.tsx` |

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
| Monad Mainnet | `143` | `0x740CDB7Cb4e2d7bA3e6296E4CB48f0A820688782` |
| Monad Testnet | `10143` | override via `VITE_AEGIS_CONTRACT_ADDRESS` |

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

The landing hero has a premium **30-Second Tour** button. One click auto-navigates through the 7 flagship surfaces with a caption bar that survives route changes (global `DemoModeHost`). No login, no wallet, no setup — just click.

---

## Demo script (~90s)

1. **0:00** Landing hero → the "daily problem" callout, live price ticker (Binance), Monad Mainnet chip.
2. **0:10** Address Inspector: paste any Monad address → A–F grade in one call.
3. **0:25** `/app/digest` → 60-second morning brief that replaces the 20-minute chore.
4. **0:40** `/app/timeline` → click **Verify** on any row → evidence drawer with block/tx explorer links.
5. **0:55** `/app/replay` → scrub 24h, events reveal UTC block-by-block as the playhead passes.
6. **1:10** `/app/opportunities` → open a setup, show its three evidence receipts.
7. **1:20** `/app/chat` → *"is 0x… safe and what's the top MON setup right now?"* — agent calls `inspectMonadWallet` + `rankOpportunities`, cites `[E-<id>]`.
8. **1:30** `/app/onchain` → subscribe on Monad Mainnet; tx hash appears on monadexplorer.

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
