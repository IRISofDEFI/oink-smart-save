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
- UI scaffolded by Lovable (incomplete — credits ran out mid-build)
- Local dev server running on localhost:8080
- Smart contract: not started
- Wallet integration: not started
- AI agent: not started

## Build log
- 2026-06-26: Repo cloned, dependencies installed, dev server confirmed running