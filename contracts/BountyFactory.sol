// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./Bounty.sol";

/**
 * @title BountyFactory
 * @notice 使用ERC1167 Clones模式创建Bounty合约实例，降低部署成本
 */
contract BountyFactory is Ownable {
    using Clones for address;

    // ============ 自定义错误 ============
    error ZeroImplementation();
    error ZeroPlatformAddress();
    error ZeroReward();
    error EmptyQuestionHash();
    error OnlyPlatform();
    error ZeroCreatorAddress();
    error InvalidBountyId();

    // ============ 状态变量 ============
    address public bountyImplementation;
    address public platform;

    uint256 public bountyCount;
    mapping(uint256 => address) public bounties;
    mapping(address => bool) public isBounty;

    // 用户创建的悬赏
    mapping(address => uint256[]) public userBounties;

    // ============ 事件 ============
    event BountyCreated(
        address indexed bountyAddress,
        address indexed creator,
        uint256 indexed bountyId,
        uint256 reward,
        uint256 deadline
    );
    event ImplementationUpdated(address oldImpl, address newImpl);

    // ============ 构造函数 ============
    constructor(address _bountyImplementation) {
        if (_bountyImplementation == address(0)) revert ZeroImplementation();
        bountyImplementation = _bountyImplementation;
    }

    // ============ 管理函数 ============

    function setPlatform(address _platform) external onlyOwner {
        if (_platform == address(0)) revert ZeroPlatformAddress();
        platform = _platform;
    }

    function updateImplementation(address _newImpl) external onlyOwner {
        if (_newImpl == address(0)) revert ZeroImplementation();
        address oldImpl = bountyImplementation;
        bountyImplementation = _newImpl;
        emit ImplementationUpdated(oldImpl, _newImpl);
    }

    // ============ 核心功能 ============

    /**
     * @notice 创建新的悬赏合约实例（用户直接调用）
     * @param _questionIpfsHash 题目图片的IPFS哈希
     * @param _deadlineDays 截止天数（1-30天）
     * @return bountyAddress 新创建的Bounty合约地址
     */
    function createBounty(
        string memory _questionIpfsHash,
        uint256 _deadlineDays
    ) external payable returns (address bountyAddress) {
        return _createBounty(msg.sender, _questionIpfsHash, _deadlineDays);
    }

    /**
     * @notice 代理创建悬赏（仅Platform合约可调用，正确传递用户地址）
     * @param _creator 实际发布者地址
     * @param _questionIpfsHash 题目图片的IPFS哈希
     * @param _deadlineDays 截止天数（1-30天）
     * @return bountyAddress 新创建的Bounty合约地址
     */
    function createBountyFor(
        address _creator,
        string memory _questionIpfsHash,
        uint256 _deadlineDays
    ) external payable returns (address bountyAddress) {
        if (msg.sender != platform) revert OnlyPlatform();
        if (_creator == address(0)) revert ZeroCreatorAddress();
        return _createBounty(_creator, _questionIpfsHash, _deadlineDays);
    }

    function _createBounty(
        address _creator,
        string memory _questionIpfsHash,
        uint256 _deadlineDays
    ) internal returns (address bountyAddress) {
        if (msg.value == 0) revert ZeroReward();
        if (bytes(_questionIpfsHash).length == 0) revert EmptyQuestionHash();

        // 使用Clones创建最小代理
        bountyAddress = bountyImplementation.clone();

        // 初始化Bounty实例
        Bounty(payable(bountyAddress)).initialize{value: msg.value}(
            _creator,
            _questionIpfsHash,
            _deadlineDays,
            platform != address(0) ? platform : address(this)
        );

        // 记录
        uint256 bountyId = bountyCount;
        bounties[bountyId] = bountyAddress;
        isBounty[bountyAddress] = true;
        userBounties[_creator].push(bountyId);
        bountyCount++;

        emit BountyCreated(bountyAddress, _creator, bountyId, msg.value, block.timestamp + (_deadlineDays * 1 days));

        return bountyAddress;
    }

    // ============ 视图函数 ============

    function getBountyAddress(uint256 _bountyId) external view returns (address) {
        if (_bountyId >= bountyCount) revert InvalidBountyId();
        return bounties[_bountyId];
    }

    function getUserBounties(address _user) external view returns (uint256[] memory) {
        return userBounties[_user];
    }

    function getAllBounties() external view returns (address[] memory) {
        address[] memory result = new address[](bountyCount);
        for (uint256 i = 0; i < bountyCount; i++) {
            result[i] = bounties[i];
        }
        return result;
    }
}
