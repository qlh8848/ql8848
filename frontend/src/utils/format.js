/**
 * 通用格式化工具函数
 */

/** 以太坊零地址常量 */
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

/** 悬赏状态枚举 */
export const BountyStatus = {
  Open: 0,
  Submitted: 1,
  Approved: 2,
  Disputed: 3,
  AutoReleased: 4,
  Cancelled: 5,
  Rejected: 6,
};

/** 悬赏状态中文标签映射 */
export const BOUNTY_STATUS_LABELS = {
  [BountyStatus.Open]: '开放中',
  [BountyStatus.Submitted]: '已提交',
  [BountyStatus.Approved]: '已批准',
  [BountyStatus.Disputed]: '争议中',
  [BountyStatus.AutoReleased]: '自动释放',
  [BountyStatus.Cancelled]: '已取消',
  [BountyStatus.Rejected]: '已拒绝',
};

/**
 * 缩略以太坊地址
 * @param {string} addr - 完整地址
 * @returns {string} 缩略后的地址，如 0x1234...abcd
 */
export function shortenAddress(addr) {
  if (!addr || addr === ZERO_ADDRESS) return '-';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

/**
 * 格式化剩余时间（秒 → 可读文本）
 * @param {number} seconds - 剩余秒数
 * @returns {string}
 */
export function formatTimeRemaining(seconds) {
  if (!seconds || seconds <= 0) return '已截止';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}天${h}小时`;
  if (h > 0) return `${h}小时${m}分钟`;
  return `${m}分钟`;
}

/**
 * 格式化截止时间戳为剩余时间文本
 * @param {bigint|number} deadline - Unix 时间戳（秒）
 * @returns {string}
 */
export function formatDeadlineRemaining(deadline) {
  const now = Math.floor(Date.now() / 1000);
  const dl = Number(deadline);
  if (dl <= now) return '已截止';
  return formatTimeRemaining(dl - now);
}

/**
 * 格式化 Unix 时间戳为本地日期字符串
 * @param {bigint|number} timestamp - Unix 时间戳（秒）
 * @returns {string}
 */
export function formatTimestamp(timestamp) {
  if (!timestamp) return '-';
  return new Date(Number(timestamp) * 1000).toLocaleString('zh-CN');
}

/**
 * 格式化 Unix 时间戳为日期（不含时间）
 * @param {bigint|number} timestamp - Unix 时间戳（秒）
 * @returns {string}
 */
export function formatDate(timestamp) {
  if (!timestamp) return '-';
  return new Date(Number(timestamp) * 1000).toLocaleDateString('zh-CN');
}
