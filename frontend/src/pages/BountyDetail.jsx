import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { formatEther } from 'viem';
import {
  ArrowLeft, Clock, Coins, User, CheckCircle, XCircle,
  AlertTriangle, Send, Shield, Timer
} from 'lucide-react';
import toast from 'react-hot-toast';
import StatusBadge from '../components/StatusBadge';
import ImageUpload from '../components/ImageUpload';
import { useBounty } from '../hooks/useBounty';
import { useIPFS } from '../hooks/useIPFS';
import { shortenAddress, formatTimeRemaining, formatDate, BountyStatus, ZERO_ADDRESS } from '../utils/format';
import { IPFS_GATEWAYS } from '../config/contracts';

function IpfsImage({ hash, alt }) {
  const [gwIndex, setGwIndex] = useState(0);
  const [allFailed, setAllFailed] = useState(false);

  if (!hash || allFailed) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400">
        图片加载失败
      </div>
    );
  }

  const src = `${IPFS_GATEWAYS[gwIndex]}${hash}`;

  return (
    <img
      src={src}
      alt={alt}
      className="w-full max-h-96 object-contain"
      onError={() => {
        if (gwIndex + 1 < IPFS_GATEWAYS.length) {
          setGwIndex(gwIndex + 1);
        } else {
          setAllFailed(true);
        }
      }}
    />
  );
}

export default function BountyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { address } = useAccount();
  const { getBountyDetail, submitSolution, approveSolution, rejectSolution, acceptRejection, cancelBounty, disputeBounty, autoRelease } = useBounty();
  const { getIPFSUrl } = useIPFS();

  const [bounty, setBounty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [solutionHash, setSolutionHash] = useState('');
  const [actionLoading, setActionLoading] = useState('');
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const loadBounty = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getBountyDetail(Number(id));
      setBounty(data);
    } catch (err) {
      console.error('Failed to load bounty:', err);
      toast.error('加载悬赏详情失败');
    } finally {
      setLoading(false);
    }
  }, [getBountyDetail, id]);

  useEffect(() => {
    loadBounty();
  }, [loadBounty]);

  const handleAction = async (action, actionName) => {
    setActionLoading(actionName);
    const toastId = toast.loading(`${actionName}中...`);
    try {
      await action();
      toast.success(`${actionName}成功!`, { id: toastId });
      await loadBounty();
    } catch (err) {
      const msg = err.shortMessage || err.message || `${actionName}失败`;
      toast.error(msg, { id: toastId });
    } finally {
      setActionLoading('');
    }
  };

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  if (!bounty) {
    return (
      <div className="page-container text-center py-20">
        <XCircle size={48} className="text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">悬赏不存在</p>
      </div>
    );
  }

  const isCreator = address?.toLowerCase() === bounty.creator?.toLowerCase();
  const isSolver = address?.toLowerCase() === bounty.solver?.toLowerCase();

  return (
    <div className="page-container max-w-4xl">

      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 transition-colors"
      >
        <ArrowLeft size={18} /> 返回
      </button>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* 左侧：题目信息 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 题目图片 */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold text-gray-900">悬赏 #{bounty.id}</h1>
              <StatusBadge status={bounty.status} />
            </div>
            <div className="rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
              <IpfsImage hash={bounty.questionIpfsHash} alt="题目" />
            </div>
            <p className="text-xs text-gray-400 mt-2 font-mono truncate">IPFS: {bounty.questionIpfsHash}</p>
          </div>

          {/* 解答区 */}
          {bounty.solutionIpfsHash && (
            <div className="card">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle size={18} className="text-green-500" /> 解答方案
              </h2>
              <div className="rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
                <IpfsImage hash={bounty.solutionIpfsHash} alt="解答" />
              </div>
              <p className="text-xs text-gray-400 mt-2">
                解答者: {shortenAddress(bounty.solver)}
              </p>
            </div>
          )}

          {/* 提交解答表单 */}
          {bounty.status === BountyStatus.Open && !isCreator && address && (
            <div className="card">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Send size={18} className="text-primary-500" /> 提交解答
              </h2>
              <ImageUpload
                label="解答图片"
                onUploadComplete={(hash) => setSolutionHash(hash)}
              />
              {solutionHash && (
                <button
                  onClick={() => handleAction(
                    () => submitSolution(bounty.address, bounty.id, solutionHash),
                    '提交解答'
                  )}
                  disabled={actionLoading === '提交解答'}
                  className="btn-primary mt-4 w-full flex items-center justify-center gap-2"
                >
                  {actionLoading === '提交解答' ? '提交中...' : '提交解答'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* 右侧：操作面板 */}
        <div className="space-y-6">
          {/* 悬赏信息 */}
          <div className="card">
            <h3 className="font-bold text-gray-900 mb-4">悬赏信息</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 flex items-center gap-1.5"><Coins size={14} />赏金</span>
                <span className="font-bold text-amber-600">{formatEther(bounty.reward)} ETH</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 flex items-center gap-1.5"><User size={14} />发布者</span>
                <span className="text-sm font-mono">{shortenAddress(bounty.creator)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 flex items-center gap-1.5"><Timer size={14} />剩余时间</span>
                <span className="text-sm font-medium">{formatTimeRemaining(bounty.timeRemaining)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 flex items-center gap-1.5"><Clock size={14} />创建时间</span>
                <span className="text-sm">{formatDate(bounty.createdAt)}</span>
              </div>
              {bounty.solver && bounty.solver !== ZERO_ADDRESS && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 flex items-center gap-1.5"><User size={14} />解答者</span>
                  <span className="text-sm font-mono">{shortenAddress(bounty.solver)}</span>
                </div>
              )}
            </div>
          </div>

          {/* 发布者操作 */}
          {isCreator && (
            <div className="card">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Shield size={16} /> 发布者操作
              </h3>
              <div className="space-y-3">
                {bounty.status === BountyStatus.Submitted && (
                  <>
                    <button
                      onClick={() => handleAction(() => approveSolution(bounty.address, bounty.id), '批准解答')}
                      disabled={!!actionLoading}
                      className="btn-success w-full flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={16} />
                      {actionLoading === '批准解答' ? '处理中...' : '批准解答并发放赏金'}
                    </button>
                    {!showRejectForm ? (
                      <button
                        onClick={() => setShowRejectForm(true)}
                        disabled={!!actionLoading}
                        className="btn-danger w-full flex items-center justify-center gap-2"
                      >
                        <XCircle size={16} /> 拒绝解答
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <textarea
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="请输入拒绝理由"
                          className="input-field text-sm min-h-[60px] resize-none"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              if (!rejectReason.trim()) {
                                toast.error('请输入拒绝理由');
                                return;
                              }
                              handleAction(
                                () => rejectSolution(bounty.address, rejectReason.trim()),
                                '拒绝解答'
                              );
                            }}
                            disabled={!!actionLoading}
                            className="btn-danger flex-1"
                          >
                            {actionLoading === '拒绝解答' ? '处理中...' : '确认拒绝'}
                          </button>
                          <button
                            onClick={() => { setShowRejectForm(false); setRejectReason(''); }}
                            className="btn-secondary flex-1"
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
                {bounty.status === BountyStatus.Open && (
                  <button
                    onClick={() => handleAction(() => cancelBounty(bounty.address, bounty.id), '取消悬赏')}
                    disabled={!!actionLoading}
                    className="btn-danger w-full flex items-center justify-center gap-2"
                  >
                    <XCircle size={16} />
                    {actionLoading === '取消悬赏' ? '处理中...' : '取消悬赏并退款'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 解答者操作 */}
          {isSolver && bounty.status === BountyStatus.Submitted && (
            <div className="card">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-500" /> 解答者操作
              </h3>
              <p className="text-sm text-gray-500 mb-3">
                如果对结果有异议，可立即发起争议进入仲裁流程（需质押 0.01 ETH，仲裁结束后退还）。
              </p>
              {!showDisputeForm ? (
                <button
                  onClick={() => setShowDisputeForm(true)}
                  disabled={!!actionLoading}
                  className="btn-danger w-full flex items-center justify-center gap-2"
                >
                  <AlertTriangle size={16} /> 发起争议
                </button>
              ) : (
                <div className="space-y-3">
                  <textarea
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    placeholder="请输入争议理由的 IPFS 哈希或说明"
                    className="input-field text-sm min-h-[80px] resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (!disputeReason.trim()) {
                          toast.error('请输入争议理由');
                          return;
                        }
                        handleAction(
                          () => disputeBounty(bounty.address, bounty.id, disputeReason.trim()),
                          '发起争议'
                        );
                      }}
                      disabled={!!actionLoading}
                      className="btn-danger flex-1 flex items-center justify-center gap-2"
                    >
                      <AlertTriangle size={16} />
                      {actionLoading === '发起争议' ? '处理中...' : '确认争议'}
                    </button>
                    <button
                      onClick={() => { setShowDisputeForm(false); setDisputeReason(''); }}
                      className="btn-secondary"
                    >
                      取消
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 已拒绝状态 - 解答者操作 */}
          {isSolver && bounty.status === BountyStatus.Rejected && (
            <div className="card border-red-200 bg-red-50">
              <h3 className="font-bold text-red-800 mb-3 flex items-center gap-2">
                <XCircle size={16} /> 解答被拒绝
              </h3>
              <p className="text-sm text-red-700 mb-4">
                发布者已拒绝您的解答。如果您认为答案是正确的，可以发起争议进入仲裁流程（需质押 0.01 ETH）。
                仲裁通过后赏金将转给您。如果接受拒绝，悬赏将重新开放。
              </p>
              <div className="space-y-3">
                {!showDisputeForm ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowDisputeForm(true)}
                      disabled={!!actionLoading}
                      className="btn-danger flex-1 flex items-center justify-center gap-2"
                    >
                      <AlertTriangle size={16} /> 发起争议
                    </button>
                    <button
                      onClick={() => handleAction(() => acceptRejection(bounty.address), '接受拒绝')}
                      disabled={!!actionLoading}
                      className="btn-secondary flex-1 flex items-center justify-center gap-2"
                    >
                      {actionLoading === '接受拒绝' ? '处理中...' : '接受拒绝'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <textarea
                      value={disputeReason}
                      onChange={(e) => setDisputeReason(e.target.value)}
                      placeholder="请输入争议理由（说明为什么您的解答是正确的）"
                      className="input-field text-sm min-h-[80px] resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (!disputeReason.trim()) {
                            toast.error('请输入争议理由');
                            return;
                          }
                          handleAction(
                            () => disputeBounty(bounty.address, bounty.id, disputeReason.trim()),
                            '发起争议'
                          );
                        }}
                        disabled={!!actionLoading}
                        className="btn-danger flex-1"
                      >
                        {actionLoading === '发起争议' ? '处理中...' : '确认争议（质押 0.01 ETH）'}
                      </button>
                      <button
                        onClick={() => { setShowDisputeForm(false); setDisputeReason(''); }}
                        className="btn-secondary flex-1"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 自动释放 */}
          {bounty.status === BountyStatus.Submitted && bounty.timeRemaining === 0 && (
            <div className="card border-orange-200 bg-orange-50">
              <h3 className="font-bold text-orange-800 mb-3 flex items-center gap-2">
                <Timer size={16} /> 已超时
              </h3>
              <p className="text-sm text-orange-700 mb-3">
                悬赏已超过截止时间，任何人可触发自动释放将赏金转给解答者。
              </p>
              <button
                onClick={() => handleAction(() => autoRelease(bounty.address, bounty.id), '自动释放')}
                disabled={!!actionLoading}
                className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2.5 px-5 rounded-xl w-full transition-colors"
              >
                {actionLoading === '自动释放' ? '处理中...' : '触发自动释放'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
