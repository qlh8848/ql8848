import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAccount, useChainId, usePublicClient, useWalletClient } from 'wagmi';
import { parseEther, formatEther, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { hardhat } from 'viem/chains';
import { getContracts } from '../config/contracts';
import { BountyFactoryABI, BountyABI, BountyPlatformABI, ArbitrationDAOABI } from '../config/abi';

// Hardhat 默认账户私钥（仅用于本地开发，这些私钥是公开已知的）
const HARDHAT_PRIVATE_KEYS = {
  '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266': '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  '0x70997970c51812dc3a010c7d01b50e0d17dc79c8': '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
  '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc': '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a',
  '0x90f79bf6eb2c4f870365e785982e1f101e93b906': '0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6',
  '0x15d34aaf54267db7d7c367839aaf71a00a2c6a65': '0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a',
  '0x9965507d1a55bcc2695c58ba16fb37d819b0a4dc': '0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba',
  '0x976ea74026e726554db657fa54763abd0c3a0aa9': '0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e',
  '0x14dc79964da2c08da15fb5315796b02155b57a46': '0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356',
  '0x23618e81e3f5cdf7f54c3d65f7fbc0abf5b21e8f': '0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97',
  '0xa0ee7a142d267c1f36714e4a8f75612f20a79720': '0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6',
};

export function useBounty() {
  const { address } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { data: metamaskWallet } = useWalletClient();

  const [bounties, setBounties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const contracts = getContracts(chainId);

  // 本地 Hardhat 网络使用直连钱包（绕过 MetaMask provider 超时问题）
  const localWallet = useMemo(() => {
    if (chainId !== 31337 || !address) return null;
    const pk = HARDHAT_PRIVATE_KEYS[address.toLowerCase()];
    if (!pk) return null;
    const account = privateKeyToAccount(pk);
    return createWalletClient({
      account,
      chain: hardhat,
      transport: http('http://127.0.0.1:8545', { timeout: 60_000 }),
    });
  }, [chainId, address]);

  // 优先用直连钱包，回退到 MetaMask
  const walletClient = localWallet || metamaskWallet;

  // 获取所有悬赏列表
  const fetchBounties = useCallback(async () => {
    if (!publicClient || contracts.BountyFactory === '0x0000000000000000000000000000000000000000') return;
    setLoading(true);
    setError(null);

    try {
      const count = await publicClient.readContract({
        address: contracts.BountyFactory,
        abi: BountyFactoryABI,
        functionName: 'bountyCount',
      });

      const bountyList = [];
      for (let i = 0; i < Number(count); i++) {
        const bountyAddr = await publicClient.readContract({
          address: contracts.BountyFactory,
          abi: BountyFactoryABI,
          functionName: 'bounties',
          args: [BigInt(i)],
        });

        try {
          const info = await publicClient.readContract({
            address: bountyAddr,
            abi: BountyABI,
            functionName: 'getBountyInfo',
          });

          bountyList.push({
            id: i,
            address: bountyAddr,
            creator: info[0],
            solver: info[1],
            questionIpfsHash: info[2],
            solutionIpfsHash: info[3],
            reward: info[4],
            deadline: info[5],
            createdAt: info[6],
            status: Number(info[7]),
          });
        } catch (err) {
          console.warn(`Failed to read bounty ${i}:`, err);
        }
      }

      setBounties(bountyList.reverse());
    } catch (err) {
      console.error('Failed to fetch bounties:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [publicClient, contracts.BountyFactory]);

  // 创建悬赏（通过 BountyPlatform 调用，确保统计数据和信誉系统同步更新）
  const createBounty = useCallback(async (questionHash, deadlineDays, rewardEth) => {
    if (!walletClient) throw new Error('Please connect wallet');

    const hash = await walletClient.writeContract({
      address: contracts.BountyPlatform,
      abi: BountyPlatformABI,
      functionName: 'createBounty',
      args: [questionHash, BigInt(deadlineDays)],
      value: parseEther(rewardEth.toString()),
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    await fetchBounties();
    return receipt;
  }, [walletClient, publicClient, contracts.BountyPlatform, fetchBounties]);

  // 获取单个悬赏详情
  const getBountyDetail = useCallback(async (bountyId) => {
    if (!publicClient) return null;

    const bountyAddr = await publicClient.readContract({
      address: contracts.BountyFactory,
      abi: BountyFactoryABI,
      functionName: 'bounties',
      args: [BigInt(bountyId)],
    });

    const info = await publicClient.readContract({
      address: bountyAddr,
      abi: BountyABI,
      functionName: 'getBountyInfo',
    });

    const timeRemaining = await publicClient.readContract({
      address: bountyAddr,
      abi: BountyABI,
      functionName: 'getTimeRemaining',
    });

    return {
      id: bountyId,
      address: bountyAddr,
      creator: info[0],
      solver: info[1],
      questionIpfsHash: info[2],
      solutionIpfsHash: info[3],
      reward: info[4],
      deadline: info[5],
      createdAt: info[6],
      status: Number(info[7]),
      timeRemaining: Number(timeRemaining),
    };
  }, [publicClient, contracts.BountyFactory]);

  // 提交解答
  const submitSolution = useCallback(async (bountyAddress, bountyId, solutionHash) => {
    if (!walletClient) throw new Error('Please connect wallet');

    const hash = await walletClient.writeContract({
      address: bountyAddress,
      abi: BountyABI,
      functionName: 'submitSolution',
      args: [solutionHash],
    });
    await publicClient.waitForTransactionReceipt({ hash });

    // 通知平台更新统计
    const notifyHash = await walletClient.writeContract({
      address: contracts.BountyPlatform,
      abi: BountyPlatformABI,
      functionName: 'notifySolutionSubmitted',
      args: [BigInt(bountyId)],
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash: notifyHash });
    await fetchBounties();
    return receipt;
  }, [walletClient, publicClient, contracts.BountyPlatform, fetchBounties]);

  // 批准解答（同时更新信誉分数和平台统计）
  const approveSolution = useCallback(async (bountyAddress, bountyId) => {
    if (!walletClient) throw new Error('Please connect wallet');

    const hash = await walletClient.writeContract({
      address: bountyAddress,
      abi: BountyABI,
      functionName: 'approveSolution',
    });
    await publicClient.waitForTransactionReceipt({ hash });

    // 通知平台更新信誉和统计
    const notifyHash = await walletClient.writeContract({
      address: contracts.BountyPlatform,
      abi: BountyPlatformABI,
      functionName: 'notifySolutionApproved',
      args: [BigInt(bountyId)],
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash: notifyHash });
    await fetchBounties();
    return receipt;
  }, [walletClient, publicClient, contracts.BountyPlatform, fetchBounties]);

  // 拒绝解答（悬赏重新开放）
  const rejectSolution = useCallback(async (bountyAddress, reasonHash) => {
    if (!walletClient) throw new Error('Please connect wallet');

    const hash = await walletClient.writeContract({
      address: bountyAddress,
      abi: BountyABI,
      functionName: 'rejectSolution',
      args: [reasonHash],
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    await fetchBounties();
    return receipt;
  }, [walletClient, publicClient, fetchBounties]);

  // 接受拒绝（悬赏重新开放）
  const acceptRejection = useCallback(async (bountyAddress) => {
    if (!walletClient) throw new Error('Please connect wallet');

    const hash = await walletClient.writeContract({
      address: bountyAddress,
      abi: BountyABI,
      functionName: 'acceptRejection',
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    await fetchBounties();
    return receipt;
  }, [walletClient, publicClient, fetchBounties]);

  // 取消悬赏
  const cancelBounty = useCallback(async (bountyAddress, bountyId) => {
    if (!walletClient) throw new Error('Please connect wallet');

    const hash = await walletClient.writeContract({
      address: bountyAddress,
      abi: BountyABI,
      functionName: 'cancelBounty',
    });
    await publicClient.waitForTransactionReceipt({ hash });

    // 通知平台更新统计
    const notifyHash = await walletClient.writeContract({
      address: contracts.BountyPlatform,
      abi: BountyPlatformABI,
      functionName: 'notifyCancelled',
      args: [BigInt(bountyId)],
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash: notifyHash });
    await fetchBounties();
    return receipt;
  }, [walletClient, publicClient, contracts.BountyPlatform, fetchBounties]);

  // 发起争议（同时创建仲裁提案，需质押 0.01 ETH）
  const disputeBounty = useCallback(async (bountyAddress, bountyId, reasonHash) => {
    if (!walletClient) throw new Error('Please connect wallet');

    // 1. 将 Bounty 状态设为 Disputed
    const disputeHash = await walletClient.writeContract({
      address: bountyAddress,
      abi: BountyABI,
      functionName: 'disputeBounty',
      args: [reasonHash],
    });
    await publicClient.waitForTransactionReceipt({ hash: disputeHash });

    // 2. 在 ArbitrationDAO 中创建仲裁提案（质押 0.01 ETH）
    const proposalHash = await walletClient.writeContract({
      address: contracts.ArbitrationDAO,
      abi: ArbitrationDAOABI,
      functionName: 'createProposal',
      args: [BigInt(bountyId), bountyAddress, reasonHash],
      value: parseEther('0.01'),
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash: proposalHash });
    await fetchBounties();
    return receipt;
  }, [walletClient, publicClient, contracts.ArbitrationDAO, fetchBounties]);

  // 自动释放
  const autoRelease = useCallback(async (bountyAddress, bountyId) => {
    if (!walletClient) throw new Error('Please connect wallet');

    const hash = await walletClient.writeContract({
      address: bountyAddress,
      abi: BountyABI,
      functionName: 'autoRelease',
    });
    await publicClient.waitForTransactionReceipt({ hash });

    // 通知平台更新信誉和统计
    const notifyHash = await walletClient.writeContract({
      address: contracts.BountyPlatform,
      abi: BountyPlatformABI,
      functionName: 'notifyAutoReleased',
      args: [BigInt(bountyId)],
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash: notifyHash });
    await fetchBounties();
    return receipt;
  }, [walletClient, publicClient, contracts.BountyPlatform, fetchBounties]);

  // 分配赏金
  const splitReward = useCallback(async (bountyAddress, solvers, ratios) => {
    if (!walletClient) throw new Error('Please connect wallet');

    const hash = await walletClient.writeContract({
      address: bountyAddress,
      abi: BountyABI,
      functionName: 'splitReward',
      args: [solvers, ratios.map(r => BigInt(r))],
    });

    return publicClient.waitForTransactionReceipt({ hash });
  }, [walletClient, publicClient]);

  useEffect(() => {
    fetchBounties();
  }, [fetchBounties]);

  return {
    bounties,
    loading,
    error,
    fetchBounties,
    createBounty,
    getBountyDetail,
    submitSolution,
    approveSolution,
    rejectSolution,
    acceptRejection,
    cancelBounty,
    disputeBounty,
    autoRelease,
    splitReward,
    formatEther,
  };
}
