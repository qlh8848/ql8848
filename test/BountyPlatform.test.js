const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("MathBounty DApp", function () {
  let bountyImpl, factory, reputation, arbitration, platform;
  let owner, creator, solver, solver2, voter1, voter2;

  const ONE_ETH = ethers.parseEther("1");
  const HALF_ETH = ethers.parseEther("0.5");
  const PROPOSAL_STAKE = ethers.parseEther("0.01");
  const QUESTION_HASH = "QmTestQuestionHash123";
  const SOLUTION_HASH = "QmTestSolutionHash456";
  const DISPUTE_HASH = "QmTestDisputeHash789";
  const EVIDENCE_HASH = "QmTestEvidenceHash000";

  beforeEach(async function () {
    [owner, creator, solver, solver2, voter1, voter2] = await ethers.getSigners();

    // 部署所有合约
    const BountyImpl = await ethers.getContractFactory("Bounty");
    bountyImpl = await BountyImpl.deploy();
    await bountyImpl.waitForDeployment();

    const BountyFactory = await ethers.getContractFactory("BountyFactory");
    factory = await BountyFactory.deploy(await bountyImpl.getAddress());
    await factory.waitForDeployment();

    const ReputationSystem = await ethers.getContractFactory("ReputationSystem");
    reputation = await ReputationSystem.deploy();
    await reputation.waitForDeployment();

    const ArbitrationDAO = await ethers.getContractFactory("ArbitrationDAO");
    arbitration = await ArbitrationDAO.deploy(await reputation.getAddress());
    await arbitration.waitForDeployment();

    const BountyPlatform = await ethers.getContractFactory("BountyPlatform");
    platform = await BountyPlatform.deploy(
      await factory.getAddress(),
      await reputation.getAddress(),
      await arbitration.getAddress()
    );
    await platform.waitForDeployment();

    // 配置关联
    await factory.setPlatform(await platform.getAddress());
    await arbitration.setFactory(await factory.getAddress());

    const UPDATER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("UPDATER_ROLE"));
    const PLATFORM_ROLE = ethers.keccak256(ethers.toUtf8Bytes("PLATFORM_ROLE"));
    await reputation.grantRole(UPDATER_ROLE, await platform.getAddress());
    await reputation.grantRole(PLATFORM_ROLE, await platform.getAddress());
    await arbitration.grantRole(PLATFORM_ROLE, await platform.getAddress());
  });

  // ============================
  // BountyFactory Tests
  // ============================
  describe("BountyFactory", function () {
    it("should create a bounty via factory", async function () {
      const tx = await factory.connect(creator).createBounty(QUESTION_HASH, 7, { value: ONE_ETH });
      const receipt = await tx.wait();

      expect(await factory.bountyCount()).to.equal(1);
      const bountyAddr = await factory.bounties(0);
      expect(bountyAddr).to.not.equal(ethers.ZeroAddress);

      const bounty = await ethers.getContractAt("Bounty", bountyAddr);
      expect(await bounty.creator()).to.equal(creator.address);
      expect(await bounty.reward()).to.equal(ONE_ETH);
      expect(await bounty.questionIpfsHash()).to.equal(QUESTION_HASH);
    });

    it("should reject zero reward", async function () {
      await expect(
        factory.connect(creator).createBounty(QUESTION_HASH, 7, { value: 0 })
      ).to.be.revertedWithCustomError(factory, "ZeroReward");
    });

    it("should reject invalid deadline", async function () {
      await expect(
        factory.connect(creator).createBounty(QUESTION_HASH, 0, { value: ONE_ETH })
      ).to.be.revertedWithCustomError(bountyImpl, "InvalidDeadline");

      await expect(
        factory.connect(creator).createBounty(QUESTION_HASH, 31, { value: ONE_ETH })
      ).to.be.revertedWithCustomError(bountyImpl, "InvalidDeadline");
    });

    it("should track user bounties", async function () {
      await factory.connect(creator).createBounty(QUESTION_HASH, 7, { value: ONE_ETH });
      await factory.connect(creator).createBounty(QUESTION_HASH, 14, { value: HALF_ETH });

      const userBounties = await factory.getUserBounties(creator.address);
      expect(userBounties.length).to.equal(2);
    });

    it("should return all bounties", async function () {
      await factory.connect(creator).createBounty(QUESTION_HASH, 7, { value: ONE_ETH });
      await factory.connect(solver).createBounty(QUESTION_HASH, 5, { value: HALF_ETH });

      const allBounties = await factory.getAllBounties();
      expect(allBounties.length).to.equal(2);
    });
  });

  // ============================
  // Bounty Core Tests
  // ============================
  describe("Bounty Core", function () {
    let bounty, bountyAddr;

    beforeEach(async function () {
      await factory.connect(creator).createBounty(QUESTION_HASH, 7, { value: ONE_ETH });
      bountyAddr = await factory.bounties(0);
      bounty = await ethers.getContractAt("Bounty", bountyAddr);
    });

    it("should submit a solution", async function () {
      await bounty.connect(solver).submitSolution(SOLUTION_HASH);
      expect(await bounty.solver()).to.equal(solver.address);
      expect(await bounty.solutionIpfsHash()).to.equal(SOLUTION_HASH);
      expect(await bounty.status()).to.equal(1); // Submitted
    });

    it("should reject solution from creator", async function () {
      await expect(
        bounty.connect(creator).submitSolution(SOLUTION_HASH)
      ).to.be.revertedWithCustomError(bounty, "CreatorCannotSolve");
    });

    it("should approve solution and transfer reward", async function () {
      await bounty.connect(solver).submitSolution(SOLUTION_HASH);

      const balanceBefore = await ethers.provider.getBalance(solver.address);
      await bounty.connect(creator).approveSolution();
      const balanceAfter = await ethers.provider.getBalance(solver.address);

      expect(balanceAfter - balanceBefore).to.equal(ONE_ETH);
      expect(await bounty.status()).to.equal(2); // Approved
    });

    it("should cancel bounty and refund", async function () {
      const balanceBefore = await ethers.provider.getBalance(creator.address);
      const tx = await bounty.connect(creator).cancelBounty();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      const balanceAfter = await ethers.provider.getBalance(creator.address);

      expect(balanceAfter + gasUsed - balanceBefore).to.equal(ONE_ETH);
      expect(await bounty.status()).to.equal(5); // Cancelled
    });

    it("should not cancel when solution submitted", async function () {
      await bounty.connect(solver).submitSolution(SOLUTION_HASH);
      await expect(
        bounty.connect(creator).cancelBounty()
      ).to.be.revertedWithCustomError(bounty, "InvalidStatus");
    });

    it("should auto-release after deadline", async function () {
      await bounty.connect(solver).submitSolution(SOLUTION_HASH);

      // Fast forward past deadline
      await time.increase(8 * 24 * 60 * 60); // 8 days

      const balanceBefore = await ethers.provider.getBalance(solver.address);
      await bounty.connect(owner).autoRelease();
      const balanceAfter = await ethers.provider.getBalance(solver.address);

      expect(balanceAfter - balanceBefore).to.equal(ONE_ETH);
      expect(await bounty.status()).to.equal(4); // AutoReleased
    });

    it("should not auto-release before deadline", async function () {
      await bounty.connect(solver).submitSolution(SOLUTION_HASH);
      await expect(
        bounty.connect(owner).autoRelease()
      ).to.be.revertedWithCustomError(bounty, "DeadlineNotPassed");
    });

    it("should split reward among multiple solvers", async function () {
      await bounty.connect(solver).submitSolution(SOLUTION_HASH);

      const balance1Before = await ethers.provider.getBalance(solver.address);
      const balance2Before = await ethers.provider.getBalance(solver2.address);

      await bounty.connect(creator).splitReward(
        [solver.address, solver2.address],
        [70, 30]
      );

      const balance1After = await ethers.provider.getBalance(solver.address);
      const balance2After = await ethers.provider.getBalance(solver2.address);

      expect(balance1After - balance1Before).to.equal(ethers.parseEther("0.7"));
      expect(balance2After - balance2Before).to.equal(ethers.parseEther("0.3"));
      expect(await bounty.status()).to.equal(2); // Approved
    });

    it("should reject split with invalid ratios", async function () {
      await bounty.connect(solver).submitSolution(SOLUTION_HASH);
      await expect(
        bounty.connect(creator).splitReward([solver.address, solver2.address], [50, 40])
      ).to.be.revertedWithCustomError(bounty, "RatiosSumNot100");
    });

    it("should dispute bounty after waiting period", async function () {
      await bounty.connect(solver).submitSolution(SOLUTION_HASH);

      // Need to wait 1 day
      await time.increase(2 * 24 * 60 * 60);

      await bounty.connect(solver).disputeBounty(DISPUTE_HASH);
      expect(await bounty.status()).to.equal(3); // Disputed
      expect(await bounty.disputeReasonIpfsHash()).to.equal(DISPUTE_HASH);
    });

    it("should reject dispute before waiting period", async function () {
      await bounty.connect(solver).submitSolution(SOLUTION_HASH);
      await expect(
        bounty.connect(solver).disputeBounty(DISPUTE_HASH)
      ).to.be.revertedWithCustomError(bounty, "WaitPeriodNotMet");
    });

    it("should return bounty info", async function () {
      const info = await bounty.getBountyInfo();
      expect(info._creator).to.equal(creator.address);
      expect(info._reward).to.equal(ONE_ETH);
      expect(info._questionIpfsHash).to.equal(QUESTION_HASH);
    });

    it("should return time remaining", async function () {
      const remaining = await bounty.getTimeRemaining();
      expect(remaining).to.be.greaterThan(0);

      await time.increase(8 * 24 * 60 * 60);
      expect(await bounty.getTimeRemaining()).to.equal(0);
    });
  });

  // ============================
  // ReputationSystem Tests
  // ============================
  describe("ReputationSystem", function () {
    it("should update solver reputation on success", async function () {
      const UPDATER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("UPDATER_ROLE"));
      await reputation.grantRole(UPDATER_ROLE, owner.address);

      await reputation.updateSolverReputation(solver.address, true, false);
      const rep = await reputation.getReputation(solver.address);
      expect(rep.solverScore).to.equal(10);
      expect(rep.totalSolved).to.equal(1);
    });

    it("should update solver reputation on auto-release (+15)", async function () {
      const UPDATER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("UPDATER_ROLE"));
      await reputation.grantRole(UPDATER_ROLE, owner.address);

      await reputation.updateSolverReputation(solver.address, true, true);
      const rep = await reputation.getReputation(solver.address);
      expect(rep.solverScore).to.equal(15);
    });

    it("should deduct solver reputation on dispute (-5)", async function () {
      const UPDATER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("UPDATER_ROLE"));
      await reputation.grantRole(UPDATER_ROLE, owner.address);

      // First give some score
      await reputation.updateSolverReputation(solver.address, true, false); // +10
      await reputation.updateSolverReputation(solver.address, false, true); // -5
      const rep = await reputation.getReputation(solver.address);
      expect(rep.solverScore).to.equal(5);
    });

    it("should update creator reputation on payment (+5)", async function () {
      const UPDATER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("UPDATER_ROLE"));
      await reputation.grantRole(UPDATER_ROLE, owner.address);

      await reputation.updateCreatorReputation(creator.address, true, false);
      const rep = await reputation.getReputation(creator.address);
      expect(rep.creatorScore).to.equal(5);
    });

    it("should deduct creator reputation on dispute (-10)", async function () {
      const UPDATER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("UPDATER_ROLE"));
      await reputation.grantRole(UPDATER_ROLE, owner.address);

      // Give some score first
      for (let i = 0; i < 5; i++) {
        await reputation.updateCreatorReputation(creator.address, true, false);
      }
      await reputation.updateCreatorReputation(creator.address, false, true); // -10
      const rep = await reputation.getReputation(creator.address);
      expect(rep.creatorScore).to.equal(15); // 25 - 10
    });

    it("should mint SBT when solver score >= 50", async function () {
      const UPDATER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("UPDATER_ROLE"));
      await reputation.grantRole(UPDATER_ROLE, owner.address);

      // 5 successful solves = 50 points
      for (let i = 0; i < 5; i++) {
        await reputation.updateSolverReputation(solver.address, true, false);
      }

      expect(await reputation.hasNFT(solver.address)).to.equal(true);
      expect(await reputation.balanceOf(solver.address)).to.equal(1);
    });

    it("should not allow SBT transfer", async function () {
      const UPDATER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("UPDATER_ROLE"));
      await reputation.grantRole(UPDATER_ROLE, owner.address);

      for (let i = 0; i < 5; i++) {
        await reputation.updateSolverReputation(solver.address, true, false);
      }

      const tokenId = await reputation.userTokenId(solver.address);
      await expect(
        reputation.connect(solver).transferFrom(solver.address, creator.address, tokenId)
      ).to.be.revertedWithCustomError(reputation, "SBTNonTransferable");
    });

    it("should prevent score going below 0", async function () {
      const UPDATER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("UPDATER_ROLE"));
      await reputation.grantRole(UPDATER_ROLE, owner.address);

      // Try to deduct from 0
      await reputation.updateSolverReputation(solver.address, false, true);
      const rep = await reputation.getReputation(solver.address);
      expect(rep.solverScore).to.equal(0);
    });
  });

  // ============================
  // ArbitrationDAO Tests
  // ============================
  describe("ArbitrationDAO", function () {
    let bounty, bountyAddr;

    beforeEach(async function () {
      // Create bounty, submit solution, dispute
      await factory.connect(creator).createBounty(QUESTION_HASH, 7, { value: ONE_ETH });
      bountyAddr = await factory.bounties(0);
      bounty = await ethers.getContractAt("Bounty", bountyAddr);

      await bounty.connect(solver).submitSolution(SOLUTION_HASH);
      await time.increase(2 * 24 * 60 * 60); // Wait 2 days
      await bounty.connect(solver).disputeBounty(DISPUTE_HASH);
    });

    it("should create a proposal with stake", async function () {
      await arbitration.connect(solver).createProposal(
        0, bountyAddr, EVIDENCE_HASH, { value: PROPOSAL_STAKE }
      );
      expect(await arbitration.proposalCount()).to.equal(1);

      const proposal = await arbitration.getProposal(0);
      expect(proposal.proposer).to.equal(solver.address);
      expect(proposal.bountyId).to.equal(0);
    });

    it("should reject proposal without sufficient stake", async function () {
      await expect(
        arbitration.connect(solver).createProposal(0, bountyAddr, EVIDENCE_HASH, { value: 0 })
      ).to.be.revertedWithCustomError(arbitration, "InsufficientProposalStake");
    });

    it("should allow staking as arbitrator", async function () {
      const stake = ethers.parseEther("0.1");
      await arbitration.connect(voter1).stakeToBecomeArbitrator({ value: stake });
      expect(await arbitration.isArbitrator(voter1.address)).to.equal(true);
      expect(await arbitration.arbitratorStakes(voter1.address)).to.equal(stake);
    });
  });

  // ============================
  // BountyPlatform Integration Tests
  // ============================
  describe("BountyPlatform", function () {
    it("should create bounty through platform with correct creator", async function () {
      await platform.connect(creator).createBounty(QUESTION_HASH, 7, { value: ONE_ETH });

      const stats = await platform.getPlatformStats();
      expect(stats._totalBounties).to.equal(1);
      expect(stats._totalRewardPool).to.equal(ONE_ETH);

      // 验证creator地址正确（非Platform合约地址）
      const details = await platform.getBountyDetails(0);
      expect(details._creator).to.equal(creator.address);
    });

    it("should return platform stats", async function () {
      await platform.connect(creator).createBounty(QUESTION_HASH, 7, { value: ONE_ETH });
      await platform.connect(creator).createBounty(QUESTION_HASH, 14, { value: HALF_ETH });

      const stats = await platform.getPlatformStats();
      expect(stats._totalBounties).to.equal(2);
      expect(stats._totalRewardPool).to.equal(ONE_ETH + HALF_ETH);
      expect(stats._activeBounties).to.equal(2);
    });

    it("should get bounty details through platform", async function () {
      await platform.connect(creator).createBounty(QUESTION_HASH, 7, { value: ONE_ETH });

      const details = await platform.getBountyDetails(0);
      expect(details._creator).to.equal(creator.address);
      expect(details._reward).to.equal(ONE_ETH);
      expect(details._questionIpfsHash).to.equal(QUESTION_HASH);
    });

    it("should notify and update reputation after approve", async function () {
      // 通过Platform创建悬赏
      await platform.connect(creator).createBounty(QUESTION_HASH, 7, { value: ONE_ETH });
      const bountyAddr = await factory.bounties(0);
      const bounty = await ethers.getContractAt("Bounty", bountyAddr);

      // 用户直接调用Bounty合约
      await bounty.connect(solver).submitSolution(SOLUTION_HASH);
      await bounty.connect(creator).approveSolution();

      // 通知Platform更新信誉
      await platform.notifySolutionApproved(0);

      const stats = await platform.getPlatformStats();
      expect(stats._totalResolved).to.equal(1);
    });

    it("should notify and update reputation after auto-release", async function () {
      await platform.connect(creator).createBounty(QUESTION_HASH, 7, { value: ONE_ETH });
      const bountyAddr = await factory.bounties(0);
      const bounty = await ethers.getContractAt("Bounty", bountyAddr);

      await bounty.connect(solver).submitSolution(SOLUTION_HASH);
      await time.increase(8 * 24 * 60 * 60); // 8 days
      await bounty.connect(owner).autoRelease();

      // 通知Platform更新信誉
      await platform.notifyAutoReleased(0);

      const stats = await platform.getPlatformStats();
      expect(stats._totalResolved).to.equal(1);
    });

    it("should pause and unpause platform", async function () {
      await platform.pause();
      await expect(
        platform.connect(creator).createBounty(QUESTION_HASH, 7, { value: ONE_ETH })
      ).to.be.revertedWith("Pausable: paused"); // OpenZeppelin internal, still uses string

      await platform.unpause();
      await platform.connect(creator).createBounty(QUESTION_HASH, 7, { value: ONE_ETH });
    });
  });
});
