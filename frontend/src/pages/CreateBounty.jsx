import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { Coins, Clock, ArrowLeft, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import ImageUpload from '../components/ImageUpload';
import { useBounty } from '../hooks/useBounty';

export default function CreateBounty() {
  const navigate = useNavigate();
  const { isConnected } = useAccount();
  const { createBounty } = useBounty();

  const [questionHash, setQuestionHash] = useState('');
  const [reward, setReward] = useState('');
  const [deadlineDays, setDeadlineDays] = useState(7);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isConnected) {
      toast.error('请先连接钱包');
      return;
    }
    if (!questionHash) {
      toast.error('请先上传题目图片');
      return;
    }
    if (!reward || parseFloat(reward) <= 0) {
      toast.error('请设置有效的赏金金额');
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading('正在创建悬赏...');

    try {
      const receipt = await createBounty(questionHash, deadlineDays, reward);
      toast.success('悬赏创建成功!', { id: toastId });
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      console.error('Create bounty failed:', err);
      const msg = err.shortMessage || err.message || '创建失败';
      toast.error(msg, { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container max-w-2xl">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 transition-colors"
      >
        <ArrowLeft size={18} /> 返回
      </button>

      <div className="card">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">发布数学悬赏</h1>
        <p className="text-gray-500 mb-8">上传数学题目图片，设置赏金和截止时间，等待解题者提交答案。</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 图片上传 */}
          <ImageUpload
            label="题目图片 *"
            onUploadComplete={(hash) => setQuestionHash(hash)}
          />

          {/* 赏金金额 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              赏金金额 (ETH) *
            </label>
            <div className="relative">
              <Coins size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="number"
                step="0.001"
                min="0.001"
                value={reward}
                onChange={(e) => setReward(e.target.value)}
                placeholder="0.1"
                className="input-field pl-11"
                required
              />
            </div>
            <p className="text-xs text-gray-400 mt-1.5">赏金将由智能合约托管，确认解答后自动发放</p>
          </div>

          {/* 截止时间 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              截止时间 (天)
            </label>
            <div className="relative">
              <Clock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={deadlineDays}
                onChange={(e) => setDeadlineDays(Number(e.target.value))}
                className="input-field pl-11 appearance-none"
              >
                {[1, 3, 5, 7, 14, 21, 30].map((d) => (
                  <option key={d} value={d}>{d} 天</option>
                ))}
              </select>
            </div>
            <p className="text-xs text-gray-400 mt-1.5">超过截止时间且已提交解答，赏金将自动释放给解答者</p>
          </div>

          {/* 预览信息 */}
          {questionHash && reward && (
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <h3 className="text-sm font-semibold text-gray-700">确认信息</h3>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">赏金</span>
                <span className="font-medium">{reward} ETH</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">截止时间</span>
                <span className="font-medium">{deadlineDays} 天后</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">IPFS哈希</span>
                <span className="font-mono text-xs truncate ml-4">{questionHash}</span>
              </div>
            </div>
          )}

          {/* 提交按钮 */}
          <button
            type="submit"
            disabled={submitting || !isConnected || !questionHash}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                创建中...
              </>
            ) : (
              <>
                <Send size={18} /> 发布悬赏
              </>
            )}
          </button>

          {!isConnected && (
            <p className="text-center text-sm text-amber-600">请先连接钱包才能发布悬赏</p>
          )}
        </form>
      </div>
    </div>
  );
}
