// 合约地址配置 —— 部署后需更新
// 本地开发网络 (Hardhat)
export const LOCAL_CONTRACTS = {
  BountyFactory: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  ReputationSystem: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
  ArbitrationDAO: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
  BountyPlatform: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
};

// Sepolia测试网
export const SEPOLIA_CONTRACTS = {
  BountyFactory: '0x405bD32c0f6DaCE5013714D4C0a680DE084e84f6',
  ReputationSystem: '0xFA5992174d0326EcAe90893245B8118eEF166356',
  ArbitrationDAO: '0x6882f0bB14b36413a07e1Be416e6D6Cc271f3915',
  BountyPlatform: '0x2AcBf8Acf2411cA1a9215cDdbb6958B9034F735e',
};

// 根据chainId获取合约地址
export function getContracts(chainId) {
  switch (chainId) {
    case 31337: return LOCAL_CONTRACTS;
    case 11155111: return SEPOLIA_CONTRACTS;
    default: return SEPOLIA_CONTRACTS;
  }
}

// IPFS网关（按优先级排列，自动降级）
export const IPFS_GATEWAYS = [
  'https://gateway.pinata.cloud/ipfs/',
  'https://dweb.link/ipfs/',
  'https://ipfs.io/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
];
export const IPFS_GATEWAY = IPFS_GATEWAYS[0];
export const IPFS_GATEWAY_FALLBACK = IPFS_GATEWAYS[1];

// Pinata API配置
export const PINATA_CONFIG = {
  apiKey: import.meta.env.VITE_PINATA_API_KEY || '',
  secretKey: import.meta.env.VITE_PINATA_SECRET_KEY || '',
  jwt: import.meta.env.VITE_PINATA_JWT || '',
};
