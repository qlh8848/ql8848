// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title Bounty
 * @notice 独立悬赏合约实例，由BountyFactory通过Clones模式创建
 * @dev 每个悬赏题目对应一个独立的Bounty合约
 */
contract Bounty is ReentrancyGuard {
    // ============ 自定义错误 ============
    error AlreadyInitialized();
    error ZeroAddressCreator();
    error EmptyQuestionHash();
    error InvalidDeadline();
    error ZeroReward();
    error CreatorCannotSolve();
    error EmptySolutionHash();
    error DeadlinePassed();
    error NotCreator();
    error InvalidStatus();
    error NotSolver();
    error EmptyReasonHash();
    error WaitPeriodNotMet();
    error DeadlineNotPassed();
    error TransferFailed();
    error EmptySolversArray();
    error ArrayLengthMismatch();
    error TooManySolvers();
    error ZeroRatio();
    error RatiosSumNot100();
    error ZeroAddressSolver();
    error OnlyPlatform();
    error NotDisputed();
    error EmptyRejectReason();
    error NotRejected();

    // ============ 枚举 ============
    enum BountyStatus {
        Open,          // 0 - 开放中，等待解答
        Submitted,     // 1 - 已提交解答
        Approved,      // 2 - 已批准，赏金已发放
        Disputed,      // 3 - 争议中
        AutoReleased,  // 4 - 超时自动释放
        Cancelled,     // 5 - 已取消
        Rejected       // 6 - 已拒绝，等待解答者确认或争议
    }

    // ============ 状态变量 ============
    address public creator;
    address public solver;
    string public questionIpfsHash;
    string public solutionIpfsHash;
    uint256 public reward;
    uint256 public deadline;
    uint256 public createdAt;
    uint256 public submittedAt;
    BountyStatus public status;
    bool private initialized;

    // 争议/拒绝相关
    string public disputeReasonIpfsHash;
    string public rejectReasonIpfsHash;

    // 平台合约地址（用于回调信誉更新）
    address public platform;

    // ============ 事件 ============
    event BountyInitialized(address indexed creator, uint256 reward, uint256 deadline);
    event SolutionSubmitted(address indexed solver, string solutionIpfsHash, uint256 timestamp);
    event SolutionApproved(address indexed solver, uint256 reward);
    event BountyDisputed(address indexed disputer, string reasonIpfsHash);
    event BountyAutoReleased(address indexed solver, uint256 reward);
    event BountyCancelled(address indexed creator, uint256 refundAmount);
    event SolutionRejected(address indexed solver, string reasonIpfsHash);
    event RejectionAccepted(address indexed solver);
    event RewardSplit(address[] solvers, uint256[] amounts);

    // ============ 修饰符 ============
    modifier onlyCreator() {
        if (msg.sender != creator) revert NotCreator();
        _;
    }

    modifier inStatus(BountyStatus _status) {
        if (status != _status) revert InvalidStatus();
        _;
    }

    // ============ 初始化函数（代替constructor，用于Clones模式） ============
    /**
     * @notice 初始化悬赏合约
     * @param _creator 发布者地址
     * @param _questionIpfsHash 题目图片的IPFS哈希
     * @param _deadlineDays 截止天数（1-30天）
     * @param _platform 平台合约地址
     */
    function initialize(
        address _creator,
        string memory _questionIpfsHash,
        uint256 _deadlineDays,
        address _platform
    ) external payable {
        if (initialized) revert AlreadyInitialized();
        if (_creator == address(0)) revert ZeroAddressCreator();
        if (bytes(_questionIpfsHash).length == 0) revert EmptyQuestionHash();
        if (_deadlineDays < 1 || _deadlineDays > 30) revert InvalidDeadline();
        if (msg.value == 0) revert ZeroReward();

        initialized = true;
        creator = _creator;
        questionIpfsHash = _questionIpfsHash;
        reward = msg.value;
        deadline = block.timestamp + (_deadlineDays * 1 days);
        createdAt = block.timestamp;
        status = BountyStatus.Open;
        platform = _platform;

        emit BountyInitialized(_creator, msg.value, deadline);
    }

    // ============ 核心功能 ============

    /**
     * @notice 提交解答
     * @param _solutionIpfsHash 解答图片的IPFS哈希
     */
    function submitSolution(string memory _solutionIpfsHash) external inStatus(BountyStatus.Open) {
        if (msg.sender == creator) revert CreatorCannotSolve();
        if (bytes(_solutionIpfsHash).length == 0) revert EmptySolutionHash();
        if (block.timestamp > deadline) revert DeadlinePassed();

        solver = msg.sender;
        solutionIpfsHash = _solutionIpfsHash;
        submittedAt = block.timestamp;
        status = BountyStatus.Submitted;

        emit SolutionSubmitted(msg.sender, _solutionIpfsHash, block.timestamp);
    }

    /**
     * @notice 发布者批准解答，立即发放赏金
     */
    function approveSolution() external onlyCreator inStatus(BountyStatus.Submitted) nonReentrant {
        status = BountyStatus.Approved;

        uint256 payout = reward;
        (bool success, ) = payable(solver).call{value: payout}("");
        if (!success) revert TransferFailed();

        emit SolutionApproved(solver, payout);
    }

    /**
     * @notice 发布者拒绝解答，进入Rejected状态等待解答者确认或争议
     * @param _reasonIpfsHash 拒绝理由的IPFS哈希
     */
    function rejectSolution(string memory _reasonIpfsHash) external onlyCreator inStatus(BountyStatus.Submitted) {
        if (bytes(_reasonIpfsHash).length == 0) revert EmptyRejectReason();

        rejectReasonIpfsHash = _reasonIpfsHash;
        status = BountyStatus.Rejected;

        emit SolutionRejected(solver, _reasonIpfsHash);
    }

    /**
     * @notice 解答者接受拒绝，悬赏重新开放
     */
    function acceptRejection() external inStatus(BountyStatus.Rejected) {
        if (msg.sender != solver) revert NotSolver();

        address previousSolver = solver;
        solver = address(0);
        solutionIpfsHash = "";
        rejectReasonIpfsHash = "";
        submittedAt = 0;
        status = BountyStatus.Open;

        emit RejectionAccepted(previousSolver);
    }

    /**
     * @notice 发起争议（解答者在Submitted或Rejected状态均可调用）
     * @param _reasonIpfsHash 争议理由的IPFS哈希
     */
    function disputeBounty(string memory _reasonIpfsHash) external {
        if (status != BountyStatus.Submitted && status != BountyStatus.Rejected) revert InvalidStatus();
        if (msg.sender != solver) revert NotSolver();
        if (bytes(_reasonIpfsHash).length == 0) revert EmptyReasonHash();

        disputeReasonIpfsHash = _reasonIpfsHash;
        status = BountyStatus.Disputed;

        emit BountyDisputed(msg.sender, _reasonIpfsHash);
    }

    /**
     * @notice 自动释放赏金（deadline过后任何人可调用）
     */
    function autoRelease() external inStatus(BountyStatus.Submitted) nonReentrant {
        if (block.timestamp <= deadline) revert DeadlineNotPassed();

        status = BountyStatus.AutoReleased;

        uint256 payout = reward;
        (bool success, ) = payable(solver).call{value: payout}("");
        if (!success) revert TransferFailed();

        emit BountyAutoReleased(solver, payout);
    }

    /**
     * @notice 取消悬赏（仅发布者，仅Open状态且无人提交时）
     */
    function cancelBounty() external onlyCreator inStatus(BountyStatus.Open) nonReentrant {
        status = BountyStatus.Cancelled;

        uint256 refund = reward;
        (bool success, ) = payable(creator).call{value: refund}("");
        if (!success) revert TransferFailed();

        emit BountyCancelled(creator, refund);
    }

    /**
     * @notice 按比例分配赏金给多个解答者
     * @param _solvers 解答者地址数组
     * @param _ratios 分配比例数组（总和必须为100）
     */
    function splitReward(
        address[] memory _solvers,
        uint256[] memory _ratios
    ) external onlyCreator inStatus(BountyStatus.Submitted) nonReentrant {
        if (_solvers.length == 0) revert EmptySolversArray();
        if (_solvers.length != _ratios.length) revert ArrayLengthMismatch();
        if (_solvers.length > 10) revert TooManySolvers();

        uint256 totalRatio = 0;
        for (uint256 i = 0; i < _ratios.length; i++) {
            if (_ratios[i] == 0) revert ZeroRatio();
            totalRatio += _ratios[i];
        }
        if (totalRatio != 100) revert RatiosSumNot100();

        status = BountyStatus.Approved;

        uint256 totalReward = reward;
        uint256[] memory amounts = new uint256[](_solvers.length);

        for (uint256 i = 0; i < _solvers.length; i++) {
            if (_solvers[i] == address(0)) revert ZeroAddressSolver();
            amounts[i] = (totalReward * _ratios[i]) / 100;
            (bool success, ) = payable(_solvers[i]).call{value: amounts[i]}("");
            if (!success) revert TransferFailed();
        }

        emit RewardSplit(_solvers, amounts);
    }

    // ============ 仲裁回调 ============

    /**
     * @notice 仲裁结果执行（仅平台合约可调用）
     * @param _toSolver true=赏金转解答者, false=退回发布者
     */
    function executeArbitrationResult(bool _toSolver) external nonReentrant {
        if (msg.sender != platform) revert OnlyPlatform();
        if (status != BountyStatus.Disputed) revert NotDisputed();

        uint256 payout = reward;

        if (_toSolver) {
            status = BountyStatus.Approved;
            (bool success, ) = payable(solver).call{value: payout}("");
            if (!success) revert TransferFailed();
            emit SolutionApproved(solver, payout);
        } else {
            status = BountyStatus.Cancelled;
            (bool success, ) = payable(creator).call{value: payout}("");
            if (!success) revert TransferFailed();
            emit BountyCancelled(creator, payout);
        }
    }

    // ============ 视图函数 ============

    function getBountyInfo()
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
            BountyStatus _status
        )
    {
        return (creator, solver, questionIpfsHash, solutionIpfsHash, reward, deadline, createdAt, status);
    }

    function getTimeRemaining() external view returns (uint256) {
        if (block.timestamp >= deadline) return 0;
        return deadline - block.timestamp;
    }

    receive() external payable {}
}
