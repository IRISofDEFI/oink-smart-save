import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs.js";
import type { OinkSafe, MockUSDC } from "../typechain-types";
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

const USDC_DECIMALS = 6;
const ONE_DAY_SECS = 24 * 60 * 60;
const MINT_AMOUNT = ethers.parseUnits("1000", USDC_DECIMALS); // 1,000 USDC per wallet
const LOCK_AMOUNT = ethers.parseUnits("100", USDC_DECIMALS);  // 100 USDC per lock
const DURATION_DAYS = 30n;

describe("OinkSafe", function () {
  let oinkSafe: OinkSafe;
  let mockUSDC: MockUSDC;
  let deployer: HardhatEthersSigner;
  let alice: HardhatEthersSigner;
  let bob: HardhatEthersSigner;

  beforeEach(async function () {
    [deployer, alice, bob] = await ethers.getSigners();

    const MockUSDCFactory = await ethers.getContractFactory("MockUSDC");
    mockUSDC = (await MockUSDCFactory.deploy()) as unknown as MockUSDC;
    await mockUSDC.waitForDeployment();

    const OinkSafeFactory = await ethers.getContractFactory("OinkSafe");
    oinkSafe = (await OinkSafeFactory.deploy(
      await mockUSDC.getAddress()
    )) as unknown as OinkSafe;
    await oinkSafe.waitForDeployment();

    await mockUSDC.mint(alice.address, MINT_AMOUNT);
    await mockUSDC.mint(bob.address, MINT_AMOUNT);

    const oinkSafeAddress = await oinkSafe.getAddress();
    await mockUSDC.connect(alice).approve(oinkSafeAddress, MINT_AMOUNT);
    await mockUSDC.connect(bob).approve(oinkSafeAddress, MINT_AMOUNT);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Deployment
  // ────────────────────────────────────────────────────────────────────────────

  describe("Deployment", function () {
    it("Should set the correct USDC address", async function () {
      expect(await oinkSafe.usdc()).to.equal(await mockUSDC.getAddress());
    });

    it("Should set the deployer as owner", async function () {
      expect(await oinkSafe.owner()).to.equal(deployer.address);
    });

    it("Should start with nextLockId = 0", async function () {
      expect(await oinkSafe.nextLockId()).to.equal(0n);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // lock()
  // ────────────────────────────────────────────────────────────────────────────

  describe("lock()", function () {
    it("Should create a lock with correct fields", async function () {
      const tx = await oinkSafe.connect(alice).lock(LOCK_AMOUNT, DURATION_DAYS);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);
      const timestamp = BigInt(block!.timestamp);

      const lock = await oinkSafe.getLock(0n);

      expect(lock.id).to.equal(0n);
      expect(lock.owner).to.equal(alice.address);
      expect(lock.amount).to.equal(LOCK_AMOUNT);
      expect(lock.lockedAt).to.equal(timestamp);
      expect(lock.unlockAt).to.equal(timestamp + DURATION_DAYS * BigInt(ONE_DAY_SECS));
      expect(lock.durationDays).to.equal(DURATION_DAYS);
      expect(lock.withdrawn).to.equal(false);
      expect(lock.earlyWithdrawal).to.equal(false);
    });

    it("Should pull USDC from the user into the contract", async function () {
      const aliceBefore = await mockUSDC.balanceOf(alice.address);
      const contractBefore = await mockUSDC.balanceOf(await oinkSafe.getAddress());

      await oinkSafe.connect(alice).lock(LOCK_AMOUNT, DURATION_DAYS);

      expect(await mockUSDC.balanceOf(alice.address)).to.equal(aliceBefore - LOCK_AMOUNT);
      expect(await mockUSDC.balanceOf(await oinkSafe.getAddress())).to.equal(
        contractBefore + LOCK_AMOUNT
      );
    });

    it("Should increase totalLockedByUser by the locked amount", async function () {
      await oinkSafe.connect(alice).lock(LOCK_AMOUNT, DURATION_DAYS);
      expect(await oinkSafe.getTotalLocked(alice.address)).to.equal(LOCK_AMOUNT);
    });

    it("Should push the new lock ID into userLockIds", async function () {
      await oinkSafe.connect(alice).lock(LOCK_AMOUNT, DURATION_DAYS);
      const ids = await oinkSafe.getUserLockIds(alice.address);
      expect(ids.length).to.equal(1);
      expect(ids[0]).to.equal(0n);
    });

    it("Should increment nextLockId", async function () {
      await oinkSafe.connect(alice).lock(LOCK_AMOUNT, DURATION_DAYS);
      expect(await oinkSafe.nextLockId()).to.equal(1n);
    });

    it("Should emit a LockCreated event with correct args", async function () {
      await expect(oinkSafe.connect(alice).lock(LOCK_AMOUNT, DURATION_DAYS))
        .to.emit(oinkSafe, "LockCreated")
        .withArgs(0n, alice.address, LOCK_AMOUNT, DURATION_DAYS, anyValue);
    });

    it("Should revert if amount = 0", async function () {
      await expect(
        oinkSafe.connect(alice).lock(0n, DURATION_DAYS)
      ).to.be.revertedWith("OinkSafe: amount must be greater than zero");
    });

    it("Should revert if durationDays = 0", async function () {
      await expect(
        oinkSafe.connect(alice).lock(LOCK_AMOUNT, 0n)
      ).to.be.revertedWith("OinkSafe: duration must be greater than zero");
    });

    it("Should revert if durationDays > 3650", async function () {
      await expect(
        oinkSafe.connect(alice).lock(LOCK_AMOUNT, 3651n)
      ).to.be.revertedWith("OinkSafe: duration exceeds maximum");
    });

    it("Should revert if user has not approved USDC", async function () {
      const signers = await ethers.getSigners();
      const charlie = signers[3];
      await mockUSDC.mint(charlie.address, LOCK_AMOUNT);
      // charlie has tokens but has NOT approved OinkSafe
      await expect(
        oinkSafe.connect(charlie).lock(LOCK_AMOUNT, DURATION_DAYS)
      ).to.be.reverted;
    });

    it("Should allow the same user to create multiple locks", async function () {
      await oinkSafe.connect(alice).lock(LOCK_AMOUNT, DURATION_DAYS);
      await oinkSafe.connect(alice).lock(LOCK_AMOUNT, 60n);

      expect(await oinkSafe.nextLockId()).to.equal(2n);
      expect(await oinkSafe.getTotalLocked(alice.address)).to.equal(LOCK_AMOUNT * 2n);

      const ids = await oinkSafe.getUserLockIds(alice.address);
      expect(ids.length).to.equal(2);
      expect(ids[0]).to.equal(0n);
      expect(ids[1]).to.equal(1n);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // withdraw() — on time (after expiry)
  // ────────────────────────────────────────────────────────────────────────────

  describe("withdraw() — on time (after expiry)", function () {
    beforeEach(async function () {
      await oinkSafe.connect(alice).lock(LOCK_AMOUNT, DURATION_DAYS);
      // Fast-forward past the unlock timestamp
      await time.increase(Number(DURATION_DAYS) * ONE_DAY_SECS + 1);
    });

    it("Should return USDC to the lock owner", async function () {
      const aliceBefore = await mockUSDC.balanceOf(alice.address);
      await oinkSafe.connect(alice).withdraw(0n);
      expect(await mockUSDC.balanceOf(alice.address)).to.equal(aliceBefore + LOCK_AMOUNT);
    });

    it("Should mark the lock as withdrawn", async function () {
      await oinkSafe.connect(alice).withdraw(0n);
      const lock = await oinkSafe.getLock(0n);
      expect(lock.withdrawn).to.equal(true);
    });

    it("Should set earlyWithdrawal = false", async function () {
      await oinkSafe.connect(alice).withdraw(0n);
      const lock = await oinkSafe.getLock(0n);
      expect(lock.earlyWithdrawal).to.equal(false);
    });

    it("Should decrease totalLockedByUser", async function () {
      await oinkSafe.connect(alice).withdraw(0n);
      expect(await oinkSafe.getTotalLocked(alice.address)).to.equal(0n);
    });

    it("Should emit LockWithdrawn with earlyWithdrawal=false", async function () {
      await expect(oinkSafe.connect(alice).withdraw(0n))
        .to.emit(oinkSafe, "LockWithdrawn")
        .withArgs(0n, alice.address, LOCK_AMOUNT, false);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // withdraw() — early (before expiry)
  // ────────────────────────────────────────────────────────────────────────────

  describe("withdraw() — early (before expiry)", function () {
    beforeEach(async function () {
      await oinkSafe.connect(alice).lock(LOCK_AMOUNT, DURATION_DAYS);
      // Time is NOT advanced — this is an early withdrawal
    });

    it("Should still return USDC to the lock owner", async function () {
      const aliceBefore = await mockUSDC.balanceOf(alice.address);
      await oinkSafe.connect(alice).withdraw(0n);
      expect(await mockUSDC.balanceOf(alice.address)).to.equal(aliceBefore + LOCK_AMOUNT);
    });

    it("Should set earlyWithdrawal = true", async function () {
      await oinkSafe.connect(alice).withdraw(0n);
      const lock = await oinkSafe.getLock(0n);
      expect(lock.earlyWithdrawal).to.equal(true);
    });

    it("Should emit LockWithdrawn with earlyWithdrawal=true", async function () {
      await expect(oinkSafe.connect(alice).withdraw(0n))
        .to.emit(oinkSafe, "LockWithdrawn")
        .withArgs(0n, alice.address, LOCK_AMOUNT, true);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // withdraw() — security
  // ────────────────────────────────────────────────────────────────────────────

  describe("withdraw() — security", function () {
    it("Should revert if lock does not exist", async function () {
      await expect(
        oinkSafe.connect(alice).withdraw(999n)
      ).to.be.revertedWith("OinkSafe: lock does not exist");
    });

    it("Should revert if caller is not the lock owner", async function () {
      await oinkSafe.connect(alice).lock(LOCK_AMOUNT, DURATION_DAYS);
      await expect(
        oinkSafe.connect(bob).withdraw(0n)
      ).to.be.revertedWith("OinkSafe: not lock owner");
    });

    it("Should revert if lock already withdrawn (double-withdraw)", async function () {
      await oinkSafe.connect(alice).lock(LOCK_AMOUNT, DURATION_DAYS);
      await oinkSafe.connect(alice).withdraw(0n);
      await expect(
        oinkSafe.connect(alice).withdraw(0n)
      ).to.be.revertedWith("OinkSafe: already withdrawn");
    });

    it("The contract owner should NOT be able to withdraw alice's lock", async function () {
      await oinkSafe.connect(alice).lock(LOCK_AMOUNT, DURATION_DAYS);
      // deployer === contract owner — must be rejected regardless of admin role
      await expect(
        oinkSafe.connect(deployer).withdraw(0n)
      ).to.be.revertedWith("OinkSafe: not lock owner");
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // View functions
  // ────────────────────────────────────────────────────────────────────────────

  describe("View functions", function () {
    it("getActiveLocks should return only non-withdrawn locks", async function () {
      await oinkSafe.connect(alice).lock(LOCK_AMOUNT, DURATION_DAYS); // id 0
      await oinkSafe.connect(alice).lock(LOCK_AMOUNT, 60n);            // id 1
      await oinkSafe.connect(alice).withdraw(0n);                      // withdraw id 0

      const active = await oinkSafe.getActiveLocks(alice.address);
      expect(active.length).to.equal(1);
      expect(active[0].id).to.equal(1n);
    });

    it("getActiveLocks should return empty array if user has no locks", async function () {
      const active = await oinkSafe.getActiveLocks(alice.address);
      expect(active.length).to.equal(0);
    });

    it("getTotalLocked should reflect sum of active locks", async function () {
      await oinkSafe.connect(alice).lock(LOCK_AMOUNT, DURATION_DAYS);
      await oinkSafe.connect(alice).lock(LOCK_AMOUNT, 60n);
      expect(await oinkSafe.getTotalLocked(alice.address)).to.equal(LOCK_AMOUNT * 2n);
    });

    it("getTotalLocked should drop after a withdrawal", async function () {
      await oinkSafe.connect(alice).lock(LOCK_AMOUNT, DURATION_DAYS);
      await oinkSafe.connect(alice).lock(LOCK_AMOUNT, 60n);
      await oinkSafe.connect(alice).withdraw(0n);
      expect(await oinkSafe.getTotalLocked(alice.address)).to.equal(LOCK_AMOUNT);
    });

    it("getLock should return the correct lock", async function () {
      await oinkSafe.connect(alice).lock(LOCK_AMOUNT, DURATION_DAYS);
      const lock = await oinkSafe.getLock(0n);
      expect(lock.owner).to.equal(alice.address);
      expect(lock.amount).to.equal(LOCK_AMOUNT);
      expect(lock.durationDays).to.equal(DURATION_DAYS);
    });

    it("getLock should revert for non-existent ID", async function () {
      await expect(oinkSafe.getLock(999n)).to.be.revertedWith(
        "OinkSafe: lock does not exist"
      );
    });

    it("getUserLockIds should return all IDs including withdrawn ones", async function () {
      await oinkSafe.connect(alice).lock(LOCK_AMOUNT, DURATION_DAYS); // id 0
      await oinkSafe.connect(alice).lock(LOCK_AMOUNT, 60n);            // id 1
      await oinkSafe.connect(alice).withdraw(0n);                      // withdraw id 0 — still in list

      const ids = await oinkSafe.getUserLockIds(alice.address);
      expect(ids.length).to.equal(2);
      expect(ids[0]).to.equal(0n);
      expect(ids[1]).to.equal(1n);
    });
  });
});
