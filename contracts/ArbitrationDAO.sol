// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./ReputationSystem.sol";
import "./Bounty.sol";

/**
 * @title ArbitrationDAO
 * @notice 去中心化仲裁合约，处理悬赏争议
 */
contract ArbitrationDAO is ReentrancyGuard, AccessControl {
    // ============ 自定义错误 ============
    error ZeroReputationAddress();
    error ZeroFactoryAddress();
    error InsufficientProposalStake();
    error EmptyEvidenceHash();
    error BountyNotDisputed();
    error InvalidProposalId();
    error ProposalNotActive();
    error VotingPeriodEnded();
    error AlreadyVoted();
    error MustHoldReputationNFT();
    error InsufficientReputation();
    error AlreadyExecuted();
    error VotingPeriodNotEnded();
    error InsufficientArbitratorStake();
    error AlreadyArbitrator();
    error StakeRefundFailed();

    // ============ 枚举 ============
    enum ProposalStatus {
        Active,
        Executed,
        Expired
    }

    // ============ 数据结构 ============
    struct Proposal {
        uint256 bountyId;
        address bountyAddress;
        address proposer;
        string evidenceIpfsHash;
        uint256 yesVotes;
        uint256 noVotes;
        uint256 deadline;
        bool executed;
        ProposalStatus status;
    }

    // ============ 状态变量 ============
    bytes32 public constant PLATFORM_ROLE = keccak256("PLATFORM_ROLE");

    ReputationSystem public reputationSystem;
    address public factory;

    uint256 public proposalCount;
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    // 仲裁节点质押
    mapping(address => uint256) public arbitratorStakes;
    mapping(address => bool) public isArbitrator;

    uint256 public constant PROPOSAL_STAKE = 0.01 ether;
    uint256 public constant ARBITRATOR_STAKE = 0.1 ether;
    uint256 public constant VOTING_PERIOD = 3 days;

    // 投票资质要求
    uint256 public constant MIN_SOLVER_SCORE_TO_VOTE = 20;
    uint256 public constant MIN_CREATOR_SCORE_TO_VOTE = 15;

    // ============ 事件 ============
    event ProposalCreated(
        uint256 indexed proposalId,
        uint256 indexed bountyId,
        address indexed proposer,
        string evidenceIpfsHash
    );
    event Voted(uint256 indexed proposalId, address indexed voter, bool support);
    event ArbitrationExecuted(
        uint256 indexed proposalId,
        uint256 indexed bountyId,
        bool solverWins,
        uint256 yesVotes,
        uint256 noVotes
    );
    event ArbitratorStaked(address indexed arbitrator, uint256 amount);

    // ============ 构造函数 ============
    constructor(address _reputationSystem) {
        if (_reputationSystem == address(0)) revert ZeroReputationAddress();
        reputationSystem = ReputationSystem(_reputationSystem);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PLATFORM_ROLE, msg.sender);
    }

    // ============ 管理 ============

    function setFactory(address _factory) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_factory == address(0)) revert ZeroFactoryAddress();
        factory = _factory;
    }

    // ============ 核心功能 ============

    /**
     * @notice 创建仲裁提案
     * @param _bountyId 悬赏ID
     * @param _bountyAddress 悬赏合约地址
     * @param _evidenceIpfsHash 证据材料的IPFS哈希
     */
    function createProposal(
        uint256 _bountyId,
        address _bountyAddress,
        string memory _evidenceIpfsHash
    ) external payable nonReentrant returns (uint256) {
        if (msg.value < PROPOSAL_STAKE) revert InsufficientProposalStake();
        if (bytes(_evidenceIpfsHash).length == 0) revert EmptyEvidenceHash();

        // 验证Bounty状态为Disputed
        Bounty bounty = Bounty(payable(_bountyAddress));
        if (bounty.status() != Bounty.BountyStatus.Disputed) revert BountyNotDisputed();

        uint256 proposalId = proposalCount;
        proposals[proposalId] = Proposal({
            bountyId: _bountyId,
            bountyAddress: _bountyAddress,
            proposer: msg.sender,
            evidenceIpfsHash: _evidenceIpfsHash,
            yesVotes: 0,
            noVotes: 0,
            deadline: block.timestamp + VOTING_PERIOD,
            executed: false,
            status: ProposalStatus.Active
        });
        proposalCount++;

        emit ProposalCreated(proposalId, _bountyId, msg.sender, _evidenceIpfsHash);
        return proposalId;
    }

    /**
     * @notice 对仲裁提案投票
     * @param _proposalId 提案ID
     * @param _support true=支持解答者获得赏金, false=支持退回发布者
     */
    function vote(uint256 _proposalId, bool _support) external {
        if (_proposalId >= proposalCount) revert InvalidProposalId();
        Proposal storage proposal = proposals[_proposalId];
        if (proposal.status != ProposalStatus.Active) revert ProposalNotActive();
        if (block.timestamp > proposal.deadline) revert VotingPeriodEnded();
        if (hasVoted[_proposalId][msg.sender]) revert AlreadyVoted();

        // 检查投票资质: 持有Reputation NFT 且 满足分数要求
        if (!reputationSystem.hasNFT(msg.sender)) revert MustHoldReputationNFT();
        ReputationSystem.UserReputation memory rep = reputationSystem.getReputation(msg.sender);
        if (rep.solverScore < MIN_SOLVER_SCORE_TO_VOTE && rep.creatorScore < MIN_CREATOR_SCORE_TO_VOTE) {
            revert InsufficientReputation();
        }

        hasVoted[_proposalId][msg.sender] = true;

        if (_support) {
            proposal.yesVotes++;
        } else {
            proposal.noVotes++;
        }

        emit Voted(_proposalId, msg.sender, _support);
    }

    /**
     * @notice 执行仲裁结果
     * @param _proposalId 提案ID
     */
    function executeArbitration(uint256 _proposalId) external nonReentrant {
        if (_proposalId >= proposalCount) revert InvalidProposalId();
        Proposal storage proposal = proposals[_proposalId];
        if (proposal.executed) revert AlreadyExecuted();
        if (block.timestamp <= proposal.deadline) revert VotingPeriodNotEnded();

        proposal.executed = true;
        proposal.status = ProposalStatus.Executed;

        Bounty bounty = Bounty(payable(proposal.bountyAddress));
        bool solverWins = proposal.yesVotes > proposal.noVotes;

        // 执行仲裁结果
        bounty.executeArbitrationResult(solverWins);

        // 退还提案者质押金
        (bool success, ) = payable(proposal.proposer).call{value: PROPOSAL_STAKE}("");
        if (!success) revert StakeRefundFailed();

        emit ArbitrationExecuted(
            _proposalId,
            proposal.bountyId,
            solverWins,
            proposal.yesVotes,
            proposal.noVotes
        );
    }

    /**
     * @notice 质押成为仲裁节点
     */
    function stakeToBecomeArbitrator() external payable nonReentrant {
        if (msg.value < ARBITRATOR_STAKE) revert InsufficientArbitratorStake();
        if (isArbitrator[msg.sender]) revert AlreadyArbitrator();

        arbitratorStakes[msg.sender] = msg.value;
        isArbitrator[msg.sender] = true;

        emit ArbitratorStaked(msg.sender, msg.value);
    }

    // ============ 视图函数 ============

    function getProposal(uint256 _proposalId) external view returns (Proposal memory) {
        if (_proposalId >= proposalCount) revert InvalidProposalId();
        return proposals[_proposalId];
    }

    function getProposalVotes(uint256 _proposalId) external view returns (uint256 yes, uint256 no) {
        if (_proposalId >= proposalCount) revert InvalidProposalId();
        return (proposals[_proposalId].yesVotes, proposals[_proposalId].noVotes);
    }

    function isVotingActive(uint256 _proposalId) external view returns (bool) {
        if (_proposalId >= proposalCount) return false;
        Proposal storage p = proposals[_proposalId];
        return p.status == ProposalStatus.Active && block.timestamp <= p.deadline;
    }
}
