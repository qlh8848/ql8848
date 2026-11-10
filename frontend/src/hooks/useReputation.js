import { useState, useCallback } from 'react';
import { useAccount, useChainId, usePublicClient, useWalletClient } from 'wagmi';
import { getContracts } from '../config/contracts';
import { ReputationSystemABI } from '../config/abi';

export function useReputation() {
  const { address } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [reputation, setReputation] = useState(null);
  const [hasNFT, setHasNFT] = useState(false);
  const [loading, setLoading] = useState(false);

  const contracts = getContracts(chainId);

  const fetchReputation = useCallback(async (userAddress) => {
    const target = userAddress || address;
    if (!publicClient || !target || contracts.ReputationSystem === '0x0000000000000000000000000000000000000000') return;

    setLoading(true);
    try {
      const rep = await publicClient.readContract({
        address: contracts.ReputationSystem,
        abi: ReputationSystemABI,
        functionName: 'getReputation',
        args: [target],
      });

      const nft = await publicClient.readContract({
        address: contracts.ReputationSystem,
        abi: ReputationSystemABI,
        functionName: 'hasNFT',
        args: [target],
      });

      const reputationData = {
        solverScore: Number(rep.solverScore),
        creatorScore: Number(rep.creatorScore),
        totalSolved: Number(rep.totalSolved),
        totalCreated: Number(rep.totalCreated),
        totalDisputed: Number(rep.totalDisputed),
      };

      setReputation(reputationData);
      setHasNFT(nft);
      return reputationData;
    } catch (err) {
      console.error('Failed to fetch reputation:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [publicClient, address, contracts.ReputationSystem]);

  const claimNFT = async () => {
    if (!walletClient || !address) throw new Error('Please connect wallet');

    const hash = await walletClient.writeContract({
      address: contracts.ReputationSystem,
      abi: ReputationSystemABI,
      functionName: 'getReputationNFT',
      args: [address],
    });

    return publicClient.waitForTransactionReceipt({ hash });
  };

  return {
    reputation,
    hasNFT,
    loading,
    fetchReputation,
    claimNFT,
  };
}
