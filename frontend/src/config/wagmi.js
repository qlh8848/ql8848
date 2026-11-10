import { http, createConfig } from 'wagmi';
import { hardhat, sepolia } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

// 检测本地 Hardhat 节点是否运行（通过 URL 参数 ?network=local 手动启用）
const useLocal = typeof window !== 'undefined' && window.location.search.includes('network=local');

// 仅使用浏览器注入钱包（MetaMask），不依赖 WalletConnect 远程服务
export const config = createConfig({
  chains: useLocal ? [hardhat, sepolia] : [sepolia],
  connectors: [injected()],
  transports: {
    ...(useLocal ? { [hardhat.id]: http('http://127.0.0.1:8545', { timeout: 60_000 }) } : {}),
    [sepolia.id]: http('https://eth-sepolia.g.alchemy.com/v2/pnjp_y4KU3eVeMgMRrjQt'),
  },
});
