// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title ReputationSystem
 * @notice 信誉系统合约，追踪用户信誉分数并铸造Soulbound NFT
 * @dev SBT实现：ERC721但禁用transfer（仅mint/burn）
 */
contract ReputationSystem is ERC721, AccessControl {
    // ============ 自定义错误 ============
    error AlreadyHasNFT();
    error ScoreTooLow();
    error SBTNonTransferable();

    // ============ 角色 ============
    bytes32 public constant PLATFORM_ROLE = keccak256("PLATFORM_ROLE");
    bytes32 public constant UPDATER_ROLE = keccak256("UPDATER_ROLE");

    // ============ 数据结构 ============
    struct UserReputation {
        uint256 solverScore;
        uint256 creatorScore;
        uint256 totalSolved;
        uint256 totalCreated;
        uint256 totalDisputed;
    }

    // ============ 状态变量 ============
    mapping(address => UserReputation) public reputations;
    mapping(address => bool) public hasReputationNFT;

    uint256 public nextTokenId;
    mapping(uint256 => address) public tokenOwners;
    mapping(address => uint256) public userTokenId;

    // SBT资质阈值
    uint256 public constant SOLVER_NFT_THRESHOLD = 20;
    uint256 public constant CREATOR_NFT_THRESHOLD = 15;

    // ============ 事件 ============
    event ReputationUpdated(
        address indexed user,
        uint256 solverScore,
        uint256 creatorScore,
        string updateType
    );
    event ReputationNFTMinted(address indexed user, uint256 tokenId);

    // ============ 构造函数 ============
    constructor() ERC721("MathBounty Reputation SBT", "MBSBT") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PLATFORM_ROLE, msg.sender);
        _grantRole(UPDATER_ROLE, msg.sender);
    }

    // ============ 信誉更新 ============

    /**
     * @notice 更新解答者信誉
     * @param _solver 解答者地址
     * @param _success 是否成功解答
     * @param _disputed 是否经过争议
     */
    function updateSolverReputation(
        address _solver,
        bool _success,
        bool _disputed
    ) external onlyRole(UPDATER_ROLE) {
        UserReputation storage rep = reputations[_solver];

        if (_success && !_disputed) {
            // 正常成功解答: +10分
            rep.solverScore += 10;
            rep.totalSolved += 1;
            emit ReputationUpdated(_solver, rep.solverScore, rep.creatorScore, "solver_success");
        } else if (_success && _disputed) {
            // 经过争议后获得赏金（自动释放）: +15分
            rep.solverScore += 15;
            rep.totalSolved += 1;
            emit ReputationUpdated(_solver, rep.solverScore, rep.creatorScore, "solver_auto_released");
        } else if (_disputed) {
            // 被争议扣分: -5分
            if (rep.solverScore >= 5) {
                rep.solverScore -= 5;
            } else {
                rep.solverScore = 0;
            }
            rep.totalDisputed += 1;
            emit ReputationUpdated(_solver, rep.solverScore, rep.creatorScore, "solver_disputed");
        }

        _checkAndMintNFT(_solver);
    }

    /**
     * @notice 更新发布者信誉
     * @param _creator 发布者地址
     * @param _paid 是否正常支付
     * @param _disputed 是否经过争议
     */
    function updateCreatorReputation(
        address _creator,
        bool _paid,
        bool _disputed
    ) external onlyRole(UPDATER_ROLE) {
        UserReputation storage rep = reputations[_creator];

        if (_paid && !_disputed) {
            // 正常支付: +5分
            rep.creatorScore += 5;
            rep.totalCreated += 1;
            emit ReputationUpdated(_creator, rep.solverScore, rep.creatorScore, "creator_paid");
        } else if (_disputed) {
            // 被争议: -10分
            if (rep.creatorScore >= 10) {
                rep.creatorScore -= 10;
            } else {
                rep.creatorScore = 0;
            }
            rep.totalDisputed += 1;
            emit ReputationUpdated(_creator, rep.solverScore, rep.creatorScore, "creator_disputed");
        } else if (!_paid) {
            // 超时自动释放（未主动支付）: -20分
            if (rep.creatorScore >= 20) {
                rep.creatorScore -= 20;
            } else {
                rep.creatorScore = 0;
            }
            emit ReputationUpdated(_creator, rep.solverScore, rep.creatorScore, "creator_auto_released");
        }

        _checkAndMintNFT(_creator);
    }

    // ============ SBT NFT ============

    /**
     * @notice 检查并铸造信誉NFT
     */
    function _checkAndMintNFT(address _user) internal {
        if (hasReputationNFT[_user]) return;

        UserReputation storage rep = reputations[_user];
        if (rep.solverScore >= SOLVER_NFT_THRESHOLD || rep.creatorScore >= CREATOR_NFT_THRESHOLD) {
            uint256 tokenId = nextTokenId;
            nextTokenId++;

            _safeMint(_user, tokenId);
            tokenOwners[tokenId] = _user;
            userTokenId[_user] = tokenId;
            hasReputationNFT[_user] = true;

            emit ReputationNFTMinted(_user, tokenId);
        }
    }

    /**
     * @notice 手动请求铸造信誉NFT
     */
    function getReputationNFT(address _user) external {
        if (hasReputationNFT[_user]) revert AlreadyHasNFT();
        UserReputation storage rep = reputations[_user];
        if (rep.solverScore < SOLVER_NFT_THRESHOLD && rep.creatorScore < CREATOR_NFT_THRESHOLD) {
            revert ScoreTooLow();
        }
        _checkAndMintNFT(_user);
    }

    // ============ Soulbound: 禁用转移 ============

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal virtual override {
        // 只允许mint(from=0)和burn(to=0)
        if (from != address(0) && to != address(0)) revert SBTNonTransferable();
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function approve(address, uint256) public pure override {
        revert SBTNonTransferable();
    }

    function setApprovalForAll(address, bool) public pure override {
        revert SBTNonTransferable();
    }

    // ============ 视图函数 ============

    function getReputation(address _user) external view returns (UserReputation memory) {
        return reputations[_user];
    }

    function hasNFT(address _user) external view returns (bool) {
        return hasReputationNFT[_user];
    }

    // ============ 接口支持 ============

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
