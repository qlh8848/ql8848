// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./BountyFactory.sol";
import "./Bounty.sol";
import "./ReputationSystem.sol";
import "./ArbitrationDAO.sol";

/**
 * @title BountyPlatform
 * @notice 主入口合约，统一集成工厂+信誉+仲裁的调用
 */
contract BountyPlatform is AccessControl, ReentrancyGuard, Pausable {
    // ============ 自定义错误 ============
    error ZeroAddress();
    error InvalidBountyId();
    error InvalidBountyStatus();

    // ============ 角色 ============
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    // ============ 子合约引用 ============
    BountyFactory public factory;
    ReputationSystem public reputationSystem;
    ArbitrationDAO public arbitrationDAO;

    // ============ 平台统计 ============
    uint256 public totalRewardPool;
    uint256 public totalBountiesCreated;
    uint256 public totalBountiesResolved;
    uint256 public totalBountiesCancelled;

    // ============ 事件 ============
    event PlatformBountyCreated(
        uint256 indexed bountyId,
        address indexed bountyAddress,
        address indexed creator,
        uint256 reward
    );
    event PlatformSolutionSubmitted(uint256 indexed bountyId, address indexed solver);
    event PlatformSolutionApproved(uint256 indexed bountyId, address indexed solver, uint256 reward);
    event PlatformBountyAutoReleased(uint256 indexed bountyId, address indexed solver, uint256 reward);
    event PlatformBountyCancelled(uint256 indexed bountyId);
    event PlatformDisputeRaised(uint256 indexed bountyId, address indexed disputer);
    event PlatformArbitrationCreated(uint256 indexed proposalId, uint256 indexed bountyId);

    // ============ 构造函数 ============
    constructor(
        address _factory,
        address _reputationSystem,
        address _arbitrationDAO
    ) {
        if (_factory == address(0)) revert ZeroAddress();
        if (_reputationSystem == address(0)) revert ZeroAddress();
        if (_arbitrationDAO == address(0)) revert ZeroAddress();

        factory = BountyFactory(_factory);
        reputationSystem = ReputationSystem(_reputationSystem);
        arbitrationDAO = ArbitrationDAO(_arbitrationDAO);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
    }

    // ============ 平台功能 ============

    /**
     * @notice 通过平台创建悬赏
     */
    function createBounty(
        string memory _questionIpfsHash,
        uint256 _deadlineDays
    ) external payable whenNotPaused nonReentrant returns (address bountyAddress) {
        bountyAddress = factory.createBountyFor{value: msg.value}(msg.sender, _questionIpfsHash, _deadlineDays);
        
        uint256 bountyId = factory.bountyCount() - 1;
        totalRewardPool += msg.value;
        totalBountiesCreated++;

        // 更新发布者信誉（创建计数）
        reputationSystem.updateCreatorReputation(msg.sender, true, false);

        emit PlatformBountyCreated(bountyId, bountyAddress, msg.sender, msg.value);
        return bountyAddress;
    }

    /**
     * @notice 记录解答提交事件（用户直接调用Bounty合约后通知平台更新统计）
     * @dev 供前端在直接调用Bounty.submitSolution后调用，用于平台事件索引
     */
    function notifySolutionSubmitted(uint256 _bountyId) external whenNotPaused {
        address bountyAddress = factory.bounties(_bountyId);
        if (bountyAddress == address(0)) revert InvalidBountyId();
        Bounty bounty = Bounty(payable(bountyAddress));
        if (bounty.status() != Bounty.BountyStatus.Submitted) revert InvalidBountyStatus();

        emit PlatformSolutionSubmitted(_bountyId, bounty.solver());
    }

    /**
     * @notice 记录解答批准事件并更新信誉
     * @dev 用户直接调用Bounty.approveSolution后调用此函数更新信誉
     */
    function notifySolutionApproved(uint256 _bountyId) external whenNotPaused {
        address bountyAddress = factory.bounties(_bountyId);
        if (bountyAddress == address(0)) revert InvalidBountyId();
        Bounty bounty = Bounty(payable(bountyAddress));
        if (bounty.status() != Bounty.BountyStatus.Approved) revert InvalidBountyStatus();

        address solver = bounty.solver();
        address bountyCreator = bounty.creator();
        uint256 reward = bounty.reward();

        // 更新信誉
        reputationSystem.updateSolverReputation(solver, true, false);
        reputationSystem.updateCreatorReputation(bountyCreator, true, false);

        totalBountiesResolved++;
        if (totalRewardPool >= reward) {
            totalRewardPool -= reward;
        }

        emit PlatformSolutionApproved(_bountyId, solver, reward);
    }

    /**
     * @notice 记录自动释放事件并更新信誉
     */
    function notifyAutoReleased(uint256 _bountyId) external whenNotPaused {
        address bountyAddress = factory.bounties(_bountyId);
        if (bountyAddress == address(0)) revert InvalidBountyId();
        Bounty bounty = Bounty(payable(bountyAddress));
        if (bounty.status() != Bounty.BountyStatus.AutoReleased) revert InvalidBountyStatus();

        address solver = bounty.solver();
        address bountyCreator = bounty.creator();
        uint256 reward = bounty.reward();

        // 更新信誉：解答者获得额外奖励，发布者扣分
        reputationSystem.updateSolverReputation(solver, true, true);
        reputationSystem.updateCreatorReputation(bountyCreator, false, false);

        totalBountiesResolved++;
        if (totalRewardPool >= reward) {
            totalRewardPool -= reward;
        }

        emit PlatformBountyAutoReleased(_bountyId, solver, reward);
    }

    /**
     * @notice 记录取消事件
     */
    function notifyCancelled(uint256 _bountyId) external whenNotPaused {
        address bountyAddress = factory.bounties(_bountyId);
        if (bountyAddress == address(0)) revert InvalidBountyId();
        Bounty bounty = Bounty(payable(bountyAddress));
        if (bounty.status() != Bounty.BountyStatus.Cancelled) revert InvalidBountyStatus();

        uint256 reward = bounty.reward();
        if (totalRewardPool >= reward) {
            totalRewardPool -= reward;
        }
        totalBountiesCancelled++;

        // 更新发布者信誉（取消扣分）
        reputationSystem.updateCreatorReputation(bounty.creator(), false, false);

        emit PlatformBountyCancelled(_bountyId);
    }

    /**
     * @notice 记录争议事件
     */
    function notifyDisputed(uint256 _bountyId) external whenNotPaused {
        address bountyAddress = factory.bounties(_bountyId);
        if (bountyAddress == address(0)) revert InvalidBountyId();
        Bounty bounty = Bounty(payable(bountyAddress));
        if (bounty.status() != Bounty.BountyStatus.Disputed) revert InvalidBountyStatus();

        emit PlatformDisputeRaised(_bountyId, bounty.solver());
    }

    /**
     * @notice 通过平台创建仲裁提案
     */
    function createArbitrationProposal(
        uint256 _bountyId,
        string memory _evidenceIpfsHash
    ) external payable whenNotPaused nonReentrant returns (uint256) {
        address bountyAddress = factory.bounties(_bountyId);
        if (bountyAddress == address(0)) revert InvalidBountyId();

        uint256 proposalId = arbitrationDAO.createProposal{value: msg.value}(
            _bountyId,
            bountyAddress,
            _evidenceIpfsHash
        );

        emit PlatformArbitrationCreated(proposalId, _bountyId);
        return proposalId;
    }

    // ============ 视图函数 ============

    function getPlatformStats()
        external
        view
        returns (
            uint256 _totalBounties,
            uint256 _totalResolved,
            uint256 _totalRewardPool,
            uint256 _activeBounties
        )
    {
        return (
            totalBountiesCreated,
            totalBountiesResolved,
            totalRewardPool,
            totalBountiesCreated - totalBountiesResolved - totalBountiesCancelled
        );
    }

    function getBountyDetails(uint256 _bountyId)
        external
        view
        returns (
            address _creator,
            address _solver,
            string memory _questionIpfsHash,
            string memory _solutionIpfsHash,
            uint256 _reward,
            uint256 _deadline,
            uint256 _createdAt,
            Bounty.BountyStatus _status
        )
    {
        address bountyAddress = factory.bounties(_bountyId);
        if (bountyAddress == address(0)) revert InvalidBountyId();
        return Bounty(payable(bountyAddress)).getBountyInfo();
    }

    // ============ 管理功能 ============

    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    function updateFactory(address _factory) external onlyRole(ADMIN_ROLE) {
        if (_factory == address(0)) revert ZeroAddress();
        factory = BountyFactory(_factory);
    }

    function updateReputationSystem(address _reputation) external onlyRole(ADMIN_ROLE) {
        if (_reputation == address(0)) revert ZeroAddress();
        reputationSystem = ReputationSystem(_reputation);
    }

    function updateArbitrationDAO(address _arbitration) external onlyRole(ADMIN_ROLE) {
        if (_arbitration == address(0)) revert ZeroAddress();
        arbitrationDAO = ArbitrationDAO(_arbitration);
    }
}
