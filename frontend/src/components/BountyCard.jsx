import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Coins, User } from 'lucide-react';
import { formatEther } from 'viem';
import StatusBadge from './StatusBadge';
import { IPFS_GATEWAYS } from '../config/contracts';
import { shortenAddress, formatDeadlineRemaining } from '../utils/format';

function BountyImage({ hash }) {
  const [gwIndex, setGwIndex] = useState(0);
  const [allFailed, setAllFailed] = useState(false);

  if (!hash || allFailed) {
    return <span className="text-gray-400 text-sm">题目图片</span>;
  }

  return (
    <img
      src={`${IPFS_GATEWAYS[gwIndex]}${hash}`}
      alt="题目"
      className="w-full h-full object-cover rounded-xl"
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

export default function BountyCard({ bounty }) {
  return (
    <Link
      to={`/bounty/${bounty.id}`}
      className="card group cursor-pointer hover:border-primary-200"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-400">#{bounty.id}</span>
          <StatusBadge status={bounty.status} />
        </div>
        <div className="flex items-center gap-1.5 text-amber-600 font-bold">
          <Coins size={16} />
          <span>{formatEther(bounty.reward)} ETH</span>
        </div>
      </div>

      <div className="mb-4">
        <div className="w-full h-32 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center overflow-hidden">
          <BountyImage hash={bounty.questionIpfsHash} />
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center gap-1.5">
          <User size={14} />
          <span>{shortenAddress(bounty.creator)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock size={14} />
          <span>{formatDeadlineRemaining(bounty.deadline)}</span>
        </div>
      </div>
    </Link>
  );
}
