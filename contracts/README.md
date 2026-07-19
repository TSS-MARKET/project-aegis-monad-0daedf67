# AegisRegistry — Deploy to Monad

One-shot deploy via **Remix** (fastest for hackathon):

1. Open https://remix.ethereum.org, create `AegisRegistry.sol`, paste the source from this folder..
2. Compiler: Solidity `0.8.24`, EVM version `paris` (default), optimizer ON, 200 runs.
3. In MetaMask, add the network:
   - **Monad Mainnet** — Chain ID `143`, RPC `https://rpc.monad.xyz`, Symbol `MON`, Explorer `https://monadexplorer.com`
   - **Monad Testnet** — Chain ID `10143`, RPC `https://testnet-rpc.monad.xyz`, Explorer `https://testnet.monadexplorer.com`
4. Deploy tab → Environment `Injected Provider (MetaMask)` → select the Monad network.
5. Constructor:
   - `_monthlyPriceWei`: `1000000000000000` (0.001 MON / month)
   - `_publisher`: your deployer address (or a dedicated signer address)
6. Click **Deploy**, confirm in MetaMask.
7. Copy the deployed contract address into `.env`:
   ```
   VITE_AEGIS_CONTRACT_ADDRESS=0xYourDeployedAddress
   VITE_AEGIS_CHAIN=mainnet   # or "testnet"
   ```
8. Rebuild the app. The On-Chain page auto-detects the address and enables all writes.

## What lives on-chain

- **Subscriptions** — `subscribe(months)` payable in MON, unlocks Pro tier.
- **Watchlists** — `setWatchlist(bytes32[])` per user (max 32 tickers).
- **Portfolio snapshots** — `snapshotPortfolio(hash, uri)` — daily commitments users can prove later.
- **AI brief attestations** — publisher signs `publishBrief(hash, uri)`; anyone can `verifyBrief(hash)`.

All state is public, all writes emit indexed events for The Graph / Envio indexers.
