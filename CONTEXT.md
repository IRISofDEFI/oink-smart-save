# OinkAI Project Context

## What this is
AI-powered savings app on Arc (Circle's stablecoin L1). Users lock USDC for chosen durations via a time-locked smart contract. Interact via chat-based AI agent.

## Stack
- Frontend: React + Vite + TypeScript (Lovable-scaffolded)
- UI Theme: Dark cosmic, deep blue/purple gradients, glowing pig-orb mascot
- Smart contract: Solidity, to deploy to Arc Testnet (Chain ID 5042002)
- Wallet: RainbowKit + wagmi + viem (TBD)
- AI Agent: TBD — likely Claude or Groq + LangChain
- Hosting: Vercel (planned)

## MVP scope (locked)
1. Connect wallet
2. Lock USDC for X days
3. View active locks
4. Withdraw after expiry
5. Chat agent with 5 commands

## Not in scope (parking lot)
- Auto-save rules
- Early-withdrawal penalties
- Multi-currency
- Buy/sell/invest
- DeFi research/yield analytics
- Notifications
- Mobile app

## Arc network info
- Chain ID: 5042002
- RPC: https://rpc.testnet.arc.network
- USDC contract (Arc testnet): 0x3600000000000000000000000000000000000000
- Block explorer: testnet.arcscan.app
- Faucet: faucet.circle.com


## Current state
- ✅ Landing page (polished, ships)
- ✅ AppShell + sidebar nav
- ✅ Dashboard with Active Locks section
- ✅ Chat UI (mock botReply only, real agent next)
- ✅ OinkSafe smart contract written, tested (33 passing), and DEPLOYED to Arc Testnet
- ✅ Deployment address: 0x8CA4e4037d853Fa63Ee96A100631d21F4daC29E6
- ✅ OinkSafe smart contract written, tested (33 passing), deployed, AND VERIFIED on Arc block explorer
- 🔴 Frontend wallet integration: not started
- 🔴 Real AI agent: not started
- 🔴 Frontend → contract wiring: not started
- 🔴 Contract verification on arcscan.app: pending

## Build log
- 2026-06-26 Day 1: Repo cloned, dev server up, Active Locks section shipped to dashboard.
- 2026-06-26 Day 2: Cleaned Lovable branding, drafted OinkSafe contract, OpenZeppelin installed, trust guarantees added. Set up Hardhat. Wrote 33-test suite — all passing.
- 2026-06-27 Day 3: OinkSafe DEPLOYED to Arc Testnet at 0x8CA4e4037d853Fa63Ee96A100631d21F4daC29E6.
- 2026-07-02 Day 4: OinkSafe VERIFIED on Arc block explorer (exact match). Source code publicly readable, trust guarantees visible on-chain. Contract address 0x8CA4e4037d853Fa63Ee96A100631d21F4daC29E6 now fully auditable at testnet.arcscan.app.