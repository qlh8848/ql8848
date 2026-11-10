import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAccount, useChainId, usePublicClient } from 'wagmi';
import { formatEther } from 'viem';
import { Trophy, Target, Clock, Coins, ArrowRight, Zap, Shield, Users } from 'lucide-react';
import BountyCard from '../components/BountyCard';
import { useBounty } from '../hooks/useBounty';
import { getContracts } from '../config/contracts';
import { BountyPlatformABI } from '../config/abi';

export default function Home() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { bounties, loading, fetchBounties } = useBounty();
  const [stats, setStats] = useState({ totalBounties: 0, totalResolved: 0, totalRewardPool: '0', activeBounties: 0 });

  const contracts = getContracts(chainId);

  useEffect(() => {
    async function loadStats() {
      if (!publicClient || contracts.BountyPlatform === '0x0000000000000000000000000000000000000000') return;
      try {
        const result = await publicClient.readContract({
          address: contracts.BountyPlatform,
          abi: BountyPlatformABI,
          functionName: 'getPlatformStats',
        });
        setStats({
          totalBounties: Number(result[0]),
          totalResolved: Number(result[1]),
          totalRewardPool: formatEther(result[2]),
          activeBounties: Number(result[3]),
        });
      } catch (err) {
        console.warn('Failed to load platform stats:', err);
      }
    }
    loadStats();
  }, [publicClient, contracts.BountyPlatform, bounties]);

  return (
    <div>
      {/* Hero Section */}
      <section className="animated-bg py-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
            去中心化<span className="gradient-text">数学解题</span>悬赏平台
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            上传数学难题，设置赏金，由全球解题者竞争解答。
            智能合约保障赏金安全，链上信誉系统确保公平公正。
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/create" className="btn-primary text-lg px-8 py-3 flex items-center gap-2">
              <Zap size={20} /> 发布悬赏
            </Link>
            <a href="#bounties" className="btn-secondary text-lg px-8 py-3 flex items-center gap-2">
              浏览题目 <ArrowRight size={20} />
            </a>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 px-4 -mt-8">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Target, label: '总悬赏数', value: stats.totalBounties, color: 'text-primary-600 bg-primary-50' },
            { icon: Trophy, label: '已解决', value: stats.totalResolved, color: 'text-green-600 bg-green-50' },
            { icon: Coins, label: '赏金池 (ETH)', value: stats.totalRewardPool, color: 'text-amber-600 bg-amber-50' },
            { icon: Clock, label: '进行中', value: stats.activeBounties, color: 'text-purple-600 bg-purple-50' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="card text-center">
              <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center mx-auto mb-3`}>
                <Icon size={22} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-sm text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">平台特色</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Shield,
                title: '智能合约托管',
                desc: '赏金由智能合约安全托管，确认解答后自动发放，无需信任第三方。',
              },
              {
                icon: Users,
                title: '去中心化仲裁',
                desc: 'DAO治理模式，信誉持有者参与投票仲裁争议，公平公正透明。',
              },
              {
                icon: Trophy,
                title: '链上信誉系统',
                desc: '解题和发题均积累信誉分数，达标可获得不可转让的Soulbound NFT。',
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card text-center">
                <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Icon size={26} className="text-primary-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bounty List */}
      <section id="bounties" className="page-container">
        <div className="flex items-center justify-between mb-6">
          <h2 className="section-title mb-0">最新悬赏</h2>
          <button
            onClick={fetchBounties}
            className="btn-secondary text-sm"
            disabled={loading}
          >
            {loading ? '加载中...' : '刷新'}
          </button>
        </div>

        {loading && bounties.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">加载悬赏列表...</p>
          </div>
        ) : bounties.length === 0 ? (
          <div className="text-center py-20">
            <Target size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-4">暂无悬赏</p>
            <Link to="/create" className="btn-primary">发布第一个悬赏</Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {bounties.map((bounty) => (
              <BountyCard key={bounty.id} bounty={bounty} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
