import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { formatEther } from 'viem';
import {
  User, Award, Star, Trophy, Shield, AlertTriangle,
  ChevronRight, Sparkles, BookOpen, PenTool
} from 'lucide-react';
import toast from 'react-hot-toast';
import StatusBadge from '../components/StatusBadge';
import { useBounty } from '../hooks/useBounty';
import { useReputation } from '../hooks/useReputation';
import { Link } from 'react-router-dom';

export default function Profile() {
  const { address, isConnected } = useAccount();
  const { bounties } = useBounty();
  const { reputation, hasNFT, loading, fetchReputation, claimNFT } = useReputation();
  const [activeTab, setActiveTab] = useState('created');

  useEffect(() => {
    if (address) {
      fetchReputation(address);
    }
  }, [address, fetchReputation]);

  if (!isConnected) {
    return (
      <div className="page-container text-center py-20">
        <User size={48} className="text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-lg mb-2">请连接钱包查看个人信息</p>
        <p className="text-gray-400 text-sm">点击右上角的"Connect Wallet"按钮</p>
      </div>
    );
  }

  const myCreated = bounties.filter(b => b.creator?.toLowerCase() === address?.toLowerCase());
  const mySolved = bounties.filter(b => b.solver?.toLowerCase() === address?.toLowerCase());

  const handleClaimNFT = async () => {
    const toastId = toast.loading('铸造信誉NFT中...');
    try {
      await claimNFT();
      toast.success('NFT铸造成功!', { id: toastId });
      fetchReputation(address);
    } catch (err) {
      toast.error(err.shortMessage || err.message || '铸造失败', { id: toastId });
    }
  };

  return (
    <div className="page-container">

      {/* Profile Header */}
      <div className="card mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
            <User size={36} className="text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900 font-mono mb-1">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </h1>
            <p className="text-sm text-gray-500 font-mono break-all">{address}</p>
            {hasNFT && (
              <span className="inline-flex items-center gap-1 mt-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                <Sparkles size={12} /> Soulbound NFT 持有者
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Reputation Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {[
          { icon: Star, label: '解题分数', value: reputation?.solverScore ?? 0, color: 'text-amber-600 bg-amber-50' },
          { icon: Award, label: '出题分数', value: reputation?.creatorScore ?? 0, color: 'text-blue-600 bg-blue-50' },
          { icon: Trophy, label: '已解题数', value: reputation?.totalSolved ?? 0, color: 'text-green-600 bg-green-50' },
          { icon: BookOpen, label: '已出题数', value: reputation?.totalCreated ?? 0, color: 'text-purple-600 bg-purple-50' },
          { icon: AlertTriangle, label: '争议次数', value: reputation?.totalDisputed ?? 0, color: 'text-red-600 bg-red-50' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="card text-center py-5">
            <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mx-auto mb-2`}>
              <Icon size={18} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* NFT Claim */}
      {!hasNFT && reputation && (reputation.solverScore >= 50 || reputation.creatorScore >= 30) && (
        <div className="card mb-8 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-purple-900 flex items-center gap-2">
                <Sparkles size={18} /> 恭喜！您已达到信誉NFT铸造条件
              </h3>
              <p className="text-sm text-purple-700 mt-1">铸造Soulbound NFT作为您的信誉凭证</p>
            </div>
            <button onClick={handleClaimNFT} className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-5 rounded-xl transition-colors">
              铸造NFT
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
        {[
          { key: 'created', label: '我的发布', icon: PenTool, count: myCreated.length },
          { key: 'solved', label: '我的解答', icon: Trophy, count: mySolved.length },
        ].map(({ key, label, icon: Icon, count }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={15} /> {label}
            <span className={`px-1.5 py-0.5 rounded text-xs ${
              activeTab === key ? 'bg-primary-100 text-primary-700' : 'bg-gray-200 text-gray-500'
            }`}>{count}</span>
          </button>
        ))}
      </div>

      {/* Bounty List */}
      <div className="space-y-3">
        {(activeTab === 'created' ? myCreated : mySolved).length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-400">
              {activeTab === 'created' ? '您还没有发布过悬赏' : '您还没有提交过解答'}
            </p>
          </div>
        ) : (
          (activeTab === 'created' ? myCreated : mySolved).map((b) => (
            <Link
              key={b.id}
              to={`/bounty/${b.id}`}
              className="card flex items-center justify-between group hover:border-primary-200"
            >
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-gray-400">#{b.id}</span>
                <StatusBadge status={b.status} />
                <span className="text-sm font-medium text-gray-700">
                  {formatEther(b.reward)} ETH
                </span>
              </div>
              <ChevronRight size={18} className="text-gray-300 group-hover:text-primary-500 transition-colors" />
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
