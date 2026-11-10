import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { Scale, ThumbsUp, ThumbsDown, Clock, CheckCircle, Timer, Shield, Gavel } from 'lucide-react';
import toast from 'react-hot-toast';
import { useArbitration } from '../hooks/useArbitration';
import { useIPFS } from '../hooks/useIPFS';
import { formatTimestamp } from '../utils/format';

function getProposalStatusLabel(status, executed) {
  if (executed) return { label: '已执行', className: 'bg-green-100 text-green-700' };
  switch (status) {
    case 0: return { label: '投票中', className: 'bg-blue-100 text-blue-700' };
    case 1: return { label: '已执行', className: 'bg-green-100 text-green-700' };
    case 2: return { label: '已过期', className: 'bg-gray-100 text-gray-600' };
    default: return { label: '未知', className: 'bg-gray-100 text-gray-600' };
  }
}

export default function ArbitrationHall() {
  const { address, isConnected } = useAccount();
  const {
    proposals, loading, fetchProposals,
    vote, executeArbitration, stakeToBecomeArbitrator,
  } = useArbitration();
  const { getIPFSUrl } = useIPFS();
  const [actionLoading, setActionLoading] = useState('');

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  const handleAction = async (action, name) => {
    setActionLoading(name);
    const toastId = toast.loading(`${name}中...`);
    try {
      await action();
      toast.success(`${name}成功!`, { id: toastId });
      await fetchProposals();
    } catch (err) {
      toast.error(err.shortMessage || err.message || `${name}失败`, { id: toastId });
    } finally {
      setActionLoading('');
    }
  };

  return (
    <div className="page-container">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
              <Scale size={22} className="text-primary-600" />
            </div>
            仲裁大厅
          </h1>
          <p className="text-gray-500 mt-1">查看和参与悬赏争议的投票仲裁</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => handleAction(stakeToBecomeArbitrator, '质押成为仲裁者')}
            disabled={!!actionLoading}
            className="btn-secondary flex items-center gap-2"
          >
            <Shield size={16} /> 成为仲裁者 (0.1 ETH)
          </button>
          <button
            onClick={fetchProposals}
            className="btn-secondary"
            disabled={loading}
          >
            {loading ? '加载中...' : '刷新'}
          </button>
        </div>
      </div>

      {/* Proposals List */}
      {loading && proposals.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">加载仲裁提案...</p>
        </div>
      ) : proposals.length === 0 ? (
        <div className="text-center py-20">
          <Gavel size={48} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">暂无仲裁提案</p>
          <p className="text-gray-400 text-sm mt-2">当有悬赏发生争议时，仲裁提案会出现在这里</p>
        </div>
      ) : (
        <div className="space-y-4">
          {proposals.map((proposal) => {
            const statusConfig = getProposalStatusLabel(proposal.status, proposal.executed);
            const totalVotes = proposal.yesVotes + proposal.noVotes;
            const yesPercent = totalVotes > 0 ? (proposal.yesVotes / totalVotes) * 100 : 50;

            return (
              <div key={proposal.id} className="card">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-400">提案 #{proposal.id}</span>
                    <span className={`badge ${statusConfig.className}`}>{statusConfig.label}</span>
                    <span className="text-sm text-gray-500">
                      关联悬赏 #{proposal.bountyId}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-gray-500">
                    <Clock size={14} />
                    截止: {formatTimestamp(proposal.deadline)}
                  </div>
                </div>

                {/* Evidence */}
                {proposal.evidenceIpfsHash && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">证据材料:</p>
                    <p className="text-sm font-mono text-gray-700 truncate">{proposal.evidenceIpfsHash}</p>
                  </div>
                )}

                {/* Voting Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-green-600 font-medium flex items-center gap-1">
                      <ThumbsUp size={14} /> 支持解答者: {proposal.yesVotes}
                    </span>
                    <span className="text-red-600 font-medium flex items-center gap-1">
                      反对: {proposal.noVotes} <ThumbsDown size={14} />
                    </span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex">
                    <div
                      className="bg-green-500 transition-all duration-500"
                      style={{ width: `${yesPercent}%` }}
                    />
                    <div
                      className="bg-red-400 transition-all duration-500"
                      style={{ width: `${100 - yesPercent}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">总票数: {totalVotes}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                  {proposal.isActive && !proposal.hasVoted && isConnected && (
                    <>
                      <button
                        onClick={() => handleAction(
                          () => vote(proposal.id, true),
                          `投票支持#${proposal.id}`
                        )}
                        disabled={!!actionLoading}
                        className="btn-success flex-1 flex items-center justify-center gap-2"
                      >
                        <ThumbsUp size={16} /> 支持解答者
                      </button>
                      <button
                        onClick={() => handleAction(
                          () => vote(proposal.id, false),
                          `投票反对#${proposal.id}`
                        )}
                        disabled={!!actionLoading}
                        className="btn-danger flex-1 flex items-center justify-center gap-2"
                      >
                        <ThumbsDown size={16} /> 支持发布者
                      </button>
                    </>
                  )}

                  {proposal.hasVoted && (
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <CheckCircle size={14} className="text-green-500" /> 您已投票
                    </span>
                  )}

                  {!proposal.isActive && !proposal.executed && (
                    <button
                      onClick={() => handleAction(
                        () => executeArbitration(proposal.id),
                        `执行仲裁#${proposal.id}`
                      )}
                      disabled={!!actionLoading}
                      className="btn-primary flex items-center gap-2"
                    >
                      <Gavel size={16} /> 执行仲裁结果
                    </button>
                  )}

                  {proposal.executed && (
                    <span className="text-sm text-green-600 flex items-center gap-1">
                      <CheckCircle size={14} /> 仲裁已执行
                      {proposal.yesVotes > proposal.noVotes
                        ? ' - 赏金转给解答者'
                        : ' - 赏金退回发布者'
                      }
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
