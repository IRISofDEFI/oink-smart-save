# OinkAI — Future Ideas

A running log of feature ideas, product directions, and market plays for OinkAI beyond v1.

Not roadmap. Not commitments. Just captured thinking. Ideas here get evaluated after v1 ships and we have real user feedback. Some will make the cut. Some won't. All get to live here until we decide.

---

## Idea Log

---

### 2026-07-03 — Gamified Savings + Discipline Leaderboard

**Source:** Iris, mid-Phase-5 of v1 build.

**The idea:**
Layer a game-fi reward system on top of the core save-and-lock functionality. The longer and more consistently a user locks USDC, the more perks and status they unlock. A public (or opt-in public) leaderboard ranks users by savings discipline — not by amount saved, but by *behavioral consistency*: streaks, completed locks, no early withdrawals, etc.

**Why it works:**
- Duolingo built a billion-dollar company on streak psychology alone.
- Savings *is* fundamentally a discipline problem. Gamifying discipline directly attacks the core user pain.
- A leaderboard converts saving from a private struggle into a social identity ("I'm a disciplined saver on OinkAI").
- Works especially well with the emerging-markets user we care about, where community/social recognition is often more culturally powerful than pure financial incentive.

**Possible mechanics:**
- Streaks: consecutive weeks/months with an active lock
- Ranks / titles based on total time locked (e.g. "Piglet", "Piggy", "Golden Pig")
- Milestone rewards for hitting durations (first 30-day lock, first 90-day lock, etc.)
- No-early-withdrawal streaks
- Group challenges — sub-communities that save together and compete

**Preconditions:**
- V1 must ship and have real users generating real lock data
- Consider only after we have enough on-chain activity to make a leaderboard meaningful (10s to 100s of active users minimum)
- May require token or on-chain rewards infrastructure — deferred until Arc mainnet + potential OinkAI token conversation

**Tie-in:**
- Aligns with the v3 "AI-driven savings advice" direction already in the whitepaper — the AI can nudge users toward maintaining streaks and hitting milestones
- Reinforces the "trust and discipline are the product" positioning

---

### 2026-07-03 — AI-Powered Onboarding for Non-Crypto Users (Account Abstraction + Chat-First Wallet Creation)

**Source:** Iris, mid-Phase-5 of v1 build.

**The idea:**
An onboarding path where non-crypto users can start using OinkAI without ever touching a traditional wallet, seed phrase, or exchange interface. The user chats with the AI. The AI spins up a smart wallet in the background (account abstraction). The AI walks them through buying USDC through an integrated on-ramp. The AI helps them make their first lock — all in one conversational flow.

**Why it works:**
- The single biggest wall between "crypto-curious" people and crypto adoption is wallet UX and seed phrase management. Account abstraction solves this.
- For our stated primary user (emerging-market savers whose local currency is losing value), the current "download MetaMask, back up 12 words, add a network, get an on-ramp, swap to USDC" path is *impossibly high friction*.
- If a user can go from "TikTok ad → chat with OinkAI → have a locked savings position" in under 10 minutes without ever seeing a seed phrase, that's a 10x adoption story.
- Circle already provides Programmable Wallets, Paymasters, and Circle Wallet infrastructure that make this technically feasible on Arc.

**The distribution wedge:**
- TikTok ads targeted at users in high-inflation / weakening-currency markets (Nigeria, Argentina, Turkey, Egypt, etc.)
- Ad copy angle: *"You don't need to be crypto-native to save in dollars. Chat with OinkAI. Save. Done."*
- Landing straight into the AI chat, wallet creation happens invisibly, first small on-ramp facilitated in the chat.

**Possible mechanics:**
- Email/social login → smart account creation (via Circle Programmable Wallets or similar)
- Paymaster subsidizes early gas so users don't need to think about it
- Integrated fiat on-ramp (potentially through Circle Mint or partner ramps like MoonPay, Yellow Card for Africa specifically)
- AI walks the user through: "Fund your wallet → Save your first $5 → Lock it for 30 days"
- Recovery via social/email — no seed phrase burden

**Preconditions:**
- V1 must ship and prove the core lock/save UX works for existing crypto users
- Requires integration work with Circle Wallets or equivalent AA provider
- Requires partnership or integration with a fiat on-ramp that covers the target markets
- Requires compliance thinking (KYC, jurisdictional restrictions) — this is where the founder's law background becomes especially useful

**Tie-in:**
- Aligns with Arc's own strategic push for the agentic economy + stablecoin-native infrastructure
- Aligns with the v2 direction already in the whitepaper ("email/social login: smart account abstraction so non-crypto-natives can use OinkAI without a wallet")
- Directly serves the "young African professional" secondary persona from the whitepaper

---

## Template for Future Entries

### YYYY-MM-DD — Idea Name

**Source:** Where the idea came from (conversation, user feedback, market observation, etc.)

**The idea:**
One paragraph description in plain English.

**Why it works:**
- Bullet reasons the idea is compelling

**Possible mechanics:**
- Bullet possible implementation angles

**Preconditions:**
- What has to be true before we build this

**Tie-in:**
- How this connects to existing OinkAI strategy or the whitepaper roadmap

---

*This file is a working notebook. Ideas here are not commitments. They get re-evaluated on merit after each round of real user feedback. Not everything here will ship. That's the point of a parking lot — it lets us think freely without over-committing.*