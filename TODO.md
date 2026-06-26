# OinkAI Build TODO

## Phase 1 — Scaffold (Day 1-2)
- [ ] X handle secured
- [ ] Lovable UI scaffold generated
- [ ] GitHub repo created and pushed
- [ ] README + TODO committed
- [ ] Project open in VS Code with Claude Code ready

## Phase 2 — Smart Contract (Day 3-5)
- [ ] Lock contract spec written
- [ ] Lock contract drafted (lockUSDC, withdraw, getActiveLocks)
- [ ] Lock contract tested locally
- [ ] Lock contract deployed to Arc testnet
- [ ] Contract address recorded

## Phase 3 — Wallet Integration (Day 6-8)
- [ ] Wallet connect (RainbowKit + wagmi + viem)
- [ ] Read USDC balance from Arc
- [ ] Write: lock USDC via contract
- [ ] Read: list of user's active locks
- [ ] Write: withdraw after lock expires

## Phase 4 — AI Agent Layer (Day 9-12)
- [ ] Agent prompt designed
- [ ] 5 commands implemented:
  - [ ] Check balance
  - [ ] Lock X USDC for Y days
  - [ ] Show my active locks
  - [ ] How much have I locked total
  - [ ] Send X USDC to address
- [ ] Agent connected to contract functions
- [ ] Error handling + safe-fail behavior

## Phase 5 — Polish + Ship (Day 13-15)
- [ ] UI polish pass
- [ ] Demo flow tested end-to-end
- [ ] Demo video recorded
- [ ] Launch tweet thread drafted
- [ ] Project deployed (Vercel)
- [ ] OinkAI launched publicly 🚀

---

## Parking Lot (v2 — don't touch until v1 ships)
- Auto-save percentage of incoming USDC
- Early-withdrawal penalty (PiggyVest-style)
- Savings goals with progress bars
- Recurring saves
- Multi-currency (EURC)
- DeFi research / yield analytics
- Mobile app
- Notifications