// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title OinkSafe — Time-locked USDC savings on Arc
/// @author OinkAI (Iris)
/// @notice Lock USDC for a chosen duration. Withdraw any time, but the UI discourages early withdrawal.
/// @dev Designed for Arc Testnet. USDC address is set at deployment.

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract OinkSafe is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    // ────────────────────────────────────────────────────────────────────────
    // Data structures
    // ────────────────────────────────────────────────────────────────────────

    struct Lock {
        uint256 id;
        address owner;
        uint256 amount;          // in USDC base units (6 decimals)
        uint256 lockedAt;        // block.timestamp at creation
        uint256 unlockAt;        // block.timestamp when lock naturally expires
        uint256 durationDays;    // original duration in days (for UI display)
        bool withdrawn;          // true once funds have been taken back
        bool earlyWithdrawal;    // true if withdrawn before unlockAt
    }

    // ────────────────────────────────────────────────────────────────────────
    // State variables
    // ────────────────────────────────────────────────────────────────────────

    /// @notice The USDC token contract on Arc (set once at deployment, never changes).
    IERC20 public immutable usdc;

    /// @notice Auto-incrementing counter used to assign unique IDs to each lock.
    uint256 public nextLockId;

    /// @notice Mapping from lock ID to its Lock data.
    mapping(uint256 => Lock) public locks;

    /// @notice Mapping from user address to the list of lock IDs they have created.
    mapping(address => uint256[]) public userLockIds;

    /// @notice Mapping from user address to the total USDC currently active (non-withdrawn) across all their locks.
    mapping(address => uint256) public totalLockedByUser;

    // ────────────────────────────────────────────────────────────────────────
    // Events
    // ────────────────────────────────────────────────────────────────────────

    /// @notice Emitted when a user creates a new USDC lock.
    /// @param lockId   The unique ID assigned to this lock.
    /// @param owner    The user who created the lock.
    /// @param amount   USDC amount locked, in 6-decimal base units.
    /// @param durationDays The number of days the funds are intended to remain locked.
    /// @param unlockAt Unix timestamp after which the lock naturally expires.
    event LockCreated(
        uint256 indexed lockId,
        address indexed owner,
        uint256 amount,
        uint256 durationDays,
        uint256 unlockAt
    );

    /// @notice Emitted when a user withdraws a lock (early or on time).
    /// @param lockId        The ID of the lock being withdrawn.
    /// @param owner         The user who withdrew the funds.
    /// @param amount        USDC amount returned to the user.
    /// @param earlyWithdrawal True if the withdrawal happened before unlockAt.
    event LockWithdrawn(
        uint256 indexed lockId,
        address indexed owner,
        uint256 amount,
        bool earlyWithdrawal
    );

    // ────────────────────────────────────────────────────────────────────────
    // Constructor
    // ────────────────────────────────────────────────────────────────────────

    /// @param _usdc Address of the USDC ERC-20 token on Arc.
    constructor(address _usdc) Ownable(msg.sender) {
        require(_usdc != address(0), "OinkSafe: USDC address cannot be zero");
        usdc = IERC20(_usdc);
    }

    // ────────────────────────────────────────────────────────────────────────
    // Core functions
    // ────────────────────────────────────────────────────────────────────────

    /// @notice Lock a specified amount of USDC for a chosen number of days.
    /// @dev Caller must have approved this contract for at least `amount` USDC
    ///      before calling. State changes occur before the external transfer
    ///      (checks-effects-interactions pattern is maintained via nonReentrant).
    /// @param amount      USDC to lock, in 6-decimal base units (e.g., 1 USDC = 1_000_000).
    /// @param durationDays How many days the funds should remain locked (1–3650).
    /// @return lockId     The unique ID assigned to the new lock.
    function lock(uint256 amount, uint256 durationDays)
        external
        nonReentrant
        returns (uint256 lockId)
    {
        require(amount > 0, "OinkSafe: amount must be greater than zero");
        require(durationDays > 0, "OinkSafe: duration must be greater than zero");
        require(durationDays <= 3650, "OinkSafe: duration exceeds maximum");

        lockId = nextLockId;
        nextLockId++;

        uint256 unlockAt = block.timestamp + (durationDays * 1 days);

        locks[lockId] = Lock({
            id: lockId,
            owner: msg.sender,
            amount: amount,
            lockedAt: block.timestamp,
            unlockAt: unlockAt,
            durationDays: durationDays,
            withdrawn: false,
            earlyWithdrawal: false
        });

        userLockIds[msg.sender].push(lockId);
        totalLockedByUser[msg.sender] += amount;

        usdc.safeTransferFrom(msg.sender, address(this), amount);

        emit LockCreated(lockId, msg.sender, amount, durationDays, unlockAt);
    }

    /// @notice Withdraw a lock's USDC back to the owner. Can be called at any time
    ///         (before or after the lock expires). The UI discourages early withdrawal,
    ///         but the contract does not penalise it.
    /// @param lockId The ID of the lock to withdraw.
    function withdraw(uint256 lockId) external nonReentrant {
        require(locks[lockId].owner != address(0), "OinkSafe: lock does not exist");
        require(locks[lockId].owner == msg.sender, "OinkSafe: not lock owner");
        require(!locks[lockId].withdrawn, "OinkSafe: already withdrawn");

        Lock memory l = locks[lockId];
        bool isEarly = block.timestamp < l.unlockAt;

        // Effects before external call (checks-effects-interactions)
        locks[lockId].withdrawn = true;
        if (isEarly) {
            locks[lockId].earlyWithdrawal = true;
        }
        totalLockedByUser[msg.sender] -= l.amount;

        usdc.safeTransfer(msg.sender, l.amount);

        emit LockWithdrawn(lockId, msg.sender, l.amount, isEarly);
    }

    // ────────────────────────────────────────────────────────────────────────
    // View functions
    // ────────────────────────────────────────────────────────────────────────

    /// @notice Returns all locks for `user` that have not yet been withdrawn.
    ///         Includes locks that are past their unlock date but not yet claimed.
    /// @param user  The address to query.
    /// @return      Array of active (non-withdrawn) Lock structs.
    function getActiveLocks(address user) external view returns (Lock[] memory) {
        uint256[] storage ids = userLockIds[user];

        // First pass: count non-withdrawn locks.
        uint256 activeCount;
        for (uint256 i = 0; i < ids.length; i++) {
            if (!locks[ids[i]].withdrawn) {
                activeCount++;
            }
        }

        // Allocate exact-size array and fill it.
        Lock[] memory active = new Lock[](activeCount);
        uint256 cursor;
        for (uint256 i = 0; i < ids.length; i++) {
            if (!locks[ids[i]].withdrawn) {
                active[cursor] = locks[ids[i]];
                cursor++;
            }
        }

        return active;
    }

    /// @notice Returns the total USDC currently locked (non-withdrawn) by `user`.
    /// @param user The address to query.
    /// @return     Total active locked amount in 6-decimal USDC base units.
    function getTotalLocked(address user) external view returns (uint256) {
        return totalLockedByUser[user];
    }

    /// @notice Returns the full Lock struct for a given lock ID.
    /// @param lockId The ID of the lock to retrieve.
    /// @return       The Lock struct.
    function getLock(uint256 lockId) external view returns (Lock memory) {
        require(locks[lockId].owner != address(0), "OinkSafe: lock does not exist");
        return locks[lockId];
    }

    /// @notice Returns the raw array of lock IDs created by `user`.
    ///         Useful for frontend pagination when a user has many historical locks.
    /// @param user The address to query.
    /// @return     Array of lock IDs (includes withdrawn locks).
    function getUserLockIds(address user) external view returns (uint256[] memory) {
        return userLockIds[user];
    }
}
