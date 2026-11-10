const STATUS_MAP = {
  0: { label: '开放中', className: 'badge-open' },
  1: { label: '已提交', className: 'badge-submitted' },
  2: { label: '已批准', className: 'badge-approved' },
  3: { label: '争议中', className: 'badge-disputed' },
  4: { label: '自动释放', className: 'badge-auto-released' },
  5: { label: '已取消', className: 'badge-cancelled' },
  6: { label: '已拒绝', className: 'badge-disputed' },
};

export default function StatusBadge({ status }) {
  const config = STATUS_MAP[status] || { label: '未知', className: 'badge-cancelled' };
  return <span className={config.className}>{config.label}</span>;
}
