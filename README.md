# MathBounty - 去中心化数学解题悬赏平台

基于以太坊区块链的去中心化数学解题悬赏 DApp。用户上传数学题图片并设置赏金，其他用户提交解答图片，发布者确认后智能合约自动发放赏金。平台集成信誉系统、Soulbound NFT 身份徽章以及去中心化仲裁 DAO，确保解题过程透明、公正、可信。

## ✨ 核心功能特性

- **悬赏发布**：用户上传题目图片至 IPFS，设置赏金金额（ETH）和截止日期，合约托管赏金
- **解答提交**：解题者上传解答图片至 IPFS，提交后合约锁定悬赏状态
- **自动结算**：发布者确认解答正确后，智能合约自动发放赏金给解题者
- **超时自动释放**：发布者超过 7 天未审核，合约自动将赏金发放给解题者（防止恶意拖欠）
- **取消悬赏**：在无人提交解答前，发布者可取消悬赏并收回赏金
- **双维度信誉系统**：独立统计发布者与解题者信誉积分，行为上/下分
- **Soulbound NFT 徽章**：信誉达阈值自动铸造不可转让 NFT，作为社区身份凭证
- **去中心化仲裁 DAO**：对争议结果发起提案，由信誉 NFT 持有者投票仲裁
- **ERC1167 克隆工厂**：每个悬赏为独立合约实例，大幅降低部署 Gas 成本
- **平台统计看板**：总悬赏数、已解决数、活跃赏金池等全局数据

## 技术栈

- **智能合约**: Solidity ^0.8.19 + OpenZeppelin 4.9.3
- **开发框架**: Hardhat + Ethers.js v6
- **前端**: React 18 + Vite + wagmi/viem + RainbowKit + TailwindCSS
- **去中心化存储**: IPFS (Pinata)
- **链上索引**: The Graph Subgraph
- **测试网**: Sepolia
- **其他依赖**: Chainlink Contracts、React Query、React Dropzone、Lucide Icons、React Hot Toast

## 🔄 业务流程

### 完整悬赏生命周期

```
发布者                    智能合约                    解题者                  仲裁DAO
  │                         │                          │                       │
  ├─ 1. 上传题目到IPFS ────►│                          │                       │
  ├─ 2. 创建悬赏(质押ETH) ─►│                          │                       │
  │                         ├─ 状态: Open              │                       │
  │                         │◄─────────────────────────┤ 3. 浏览悬赏列表       │
  │                         │                          ├─ 4. 上传解答到IPFS    │
  │                         │◄─────────────────────────┤ 5. 提交解答           │
  │                         ├─ 状态: Submitted         │                       │
  ├─ 6. 查看解答 ──────────►│                          │                       │
  │                         │                          │                       │
  ├─ 7a. 确认正确 ─────────►│                          │                       │
  │                         ├─ 发放赏金给解题者        │                       │
  │                         ├─ 更新双方信誉分          │                       │
  │                         ├─ 状态: Approved          │                       │
  │                         │                          │                       │
  ├─ 7b. 有争议 ───────────►│                          │                       │
  │                         ├─ 状态: Disputed          │                       │
  │                         ├────────────────────────────────────────────────►│ 8. 创建仲裁提案(质押0.01ETH)
  │                         │                          │                       ├─ 投票期3天
  │                         │◄────────────────────────────────────────────────┤ 9. 投票执行
  │                         │                          │                       │
  └─ 7c. 7天未处理 ────────►│(超时自动释放)            │                       │
                            ├─ 自动发赏金给解题者      │                       │
                            ├─ 解题者加分/发布者扣分   │                       │
                            └─ 状态: AutoReleased     │                       │
```

### 状态机说明

| 状态 | 说明 | 可触发的下一状态 |
|------|------|----------------|
| `Open` | 悬赏开放中，等待解答提交 | `Submitted`（提交解答）/ `Cancelled`（取消悬赏） |
| `Submitted` | 已有解答，等待发布者审核 | `Approved`（通过）/ `Disputed`（争议）/ `AutoReleased`（超时自动） |
| `Approved` | 悬赏已解决，赏金已发放 | 终态 |
| `Disputed` | 存在争议，进入仲裁流程 | `Approved` / 按仲裁结果 |
| `AutoReleased` | 超时自动释放，赏金已发 | 终态 |
| `Cancelled` | 悬赏已取消，赏金退回发布者 | 终态 |

## 🏗️ 系统架构

### 整体架构图

```
┌──────────────────────────────────────────────────────────────────────┐
│                            前端 (React + Vite)                        │
│  ┌─────────┐  ┌────────────┐  ┌──────────┐  ┌────────┐  ┌─────────┐ │
│  │ Home    │  │ CreateBty  │  │ BountyDt │  │ Profile│  │Arbitratn│ │
│  └────┬────┘  └─────┬──────┘  └────┬─────┘  └───┬────┘  └────┬────┘ │
│       └──────────────┴──────────────┴─────────────┴─────────────┘     │
│                              │                                        │
│              ┌───────────────┴───────────────┐                        │
│              │  wagmi / viem / RainbowKit    │                        │
│              └───────────────┬───────────────┘                        │
└──────────────────────────────┼───────────────────────────────────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
          ▼                    ▼                    ▼
   ┌────────────┐      ┌──────────────┐      ┌───────────┐
   │   IPFS     │      │  以太坊区块链  │      │ The Graph │
   │ (Pinata)   │      │              │      │  Subgraph │
   └────────────┘      └──────┬───────┘      └───────────┘
                              │
               ┌──────────────┼──────────────┐
               │              │              │
               ▼              ▼              ▼
     ┌─────────────────┐ ┌──────────┐ ┌──────────────┐
     │ BountyPlatform  │ │   Repu-  │ │ArbitrationDAO│
     │   (主入口合约)   │ │ tation   │ │  (仲裁DAO)   │
     └───────┬─────────┘ └────┬─────┘ └──────────────┘
             │                │
             ▼                ▼
     ┌─────────────────┐ ┌──────────┐
     │ BountyFactory   │ │Soulbound │
     │ (ERC1167 工厂)  │ │   NFT    │
     └───────┬─────────┘ └──────────┘
             │
             ▼  (克隆多个实例)
     ┌─────────────────────────────────────┐
     │ Bounty #1 │ Bounty #2 │ Bounty #3...│
     └─────────────────────────────────────┘
```

## 项目结构

```
├── contracts/                # 智能合约
│   ├── Bounty.sol           # 核心悬赏合约（Clones实例）
│   ├── BountyFactory.sol    # 工厂合约（ERC1167）
│   ├── ReputationSystem.sol # 信誉系统 + Soulbound NFT
│   ├── ArbitrationDAO.sol   # 去中心化仲裁
│   └── BountyPlatform.sol   # 主入口/代理合约
├── test/                     # 合约测试
├── scripts/                  # 部署脚本
├── frontend/                 # React前端
│   └── src/
│       ├── components/      # 通用组件
│       ├── pages/           # 页面
│       ├── hooks/           # 自定义Hooks
│       └── config/          # 配置（ABI、合约地址）
└── subgraph/                 # The Graph子图定义
```

## 快速开始

### 1. 安装依赖

```bash
npm install
cd frontend && npm install
```

### 2. 编译合约

```bash
npx hardhat compile
```

### 3. 运行测试

```bash
npx hardhat test
```

---

## 本地 Hardhat 网络开发

### 启动本地节点

```bash
npx hardhat node
```

### 部署合约到本地

```bash
npx hardhat run scripts/deploy.js --network localhost
```

### 启动前端（本地模式）

```bash
cd frontend
npx vite --host
```

浏览器访问 `http://localhost:3000/?network=local`（需加 `?network=local` 参数启用 Hardhat 链）

### 查询链上数据

```bash
npx hardhat run scripts/queryChain.js --network localhost
```

### 监听链上事件

```bash
npx hardhat run scripts/listenEvents.js --network localhost
```

---

## Sepolia 测试网部署

### 前置条件

1. 在 Alchemy 注册获取 Sepolia RPC URL
2. 准备一个有 Sepolia ETH 的钱包私钥（水龙头: https://sepoliafaucet.com）
3. 创建 `.env` 文件（见环境变量章节）

### 部署合约到 Sepolia

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

部署成功后 `frontend/src/config/contracts.js` 会自动更新 Sepolia 合约地址。

### 启动前端（Sepolia 模式）

```bash
cd frontend
npx vite --host
```

浏览器访问 `http://localhost:3000/`（默认连接 Sepolia，MetaMask 需切换到 Sepolia 网络）

### 查询 Sepolia 链上数据

```bash
npx hardhat run scripts/queryChain.js --network sepolia
```

### 监听 Sepolia 链上事件（轮询模式，每 15 秒）

```bash
npx hardhat run scripts/listenEvents.js --network sepolia
```

---

## 网络切换说明

| 场景 | 前端 URL | MetaMask 网络 | 部署命令 |
|------|----------|--------------|---------|
| 本地开发 | `http://localhost:3000/?network=local` | Hardhat (31337) | `--network localhost` |
| Sepolia 测试 | `http://localhost:3000/` | Sepolia (11155111) | `--network sepolia` |

## 🖥️ 前端页面说明

### 页面路由与功能

| 路由 | 页面 | 主要功能 |
|------|------|---------|
| `/` | Home（悬赏大厅） | 展示所有悬赏列表、平台统计看板、按状态筛选 |
| `/create` | CreateBounty（发布悬赏） | 上传题目图片（IPFS）、设置赏金金额和截止天数、发布悬赏 |
| `/bounty/:id` | BountyDetail（悬赏详情） | 查看题目/解答图片、提交解答、确认解答、发起争议、触发超时释放 |
| `/profile` | Profile（个人中心） | 查看个人信誉分、Soulbound NFT 徽章、我发布的悬赏、我解答的悬赏 |
| `/arbitration` | ArbitrationHall（仲裁大厅） | 查看争议提案、创建仲裁提案、对提案进行投票 |

### 前端核心模块

- **hooks/useBounty.js** — 悬赏相关的合约调用（创建、提交解答、审批、取消、超时释放等）
- **hooks/useReputation.js** — 信誉系统查询（获取分数、NFT 持有状态）
- **hooks/useArbitration.js** — 仲裁 DAO 交互（创建提案、投票、查询提案状态）
- **hooks/useIPFS.js** — IPFS 文件上传（题目/解答图片）
- **components/ImageUpload.jsx** — 图片拖拽上传组件（react-dropzone）
- **components/BountyCard.jsx** — 悬赏卡片组件
- **components/StatusBadge.jsx** — 悬赏状态标签（颜色区分）
- **components/Navbar.jsx** — 导航栏 + RainbowKit 钱包连接

### 钱包连接说明

- 使用 **RainbowKit** 提供多钱包接入（MetaMask、WalletConnect 等）
- 连接后自动根据 URL 参数或默认配置切换链网络
- 交易签名使用 wagmi + viem，所有链上操作有 Toast 提示（加载 / 成功 / 失败）

## 合约架构

### BountyFactory（工厂合约）
- 使用ERC1167 Clones模式创建Bounty实例，大幅降低Gas成本
- 记录所有悬赏地址，支持按用户查询

### Bounty（悬赏合约）
状态流转: `Open → Submitted → Approved/Disputed/AutoReleased/Cancelled`
- 赏金由合约托管，ReentrancyGuard防重入
- 支持多人按比例分配赏金（splitReward）
- 超时自动释放机制

### ReputationSystem（信誉系统）
- 解答者/发布者双维度信誉积分
- 达到阈值自动铸造Soulbound NFT（不可转让）
- solverScore >= 50 或 creatorScore >= 30 触发NFT

### ArbitrationDAO（仲裁合约）
- 创建提案需质押0.01 ETH
- 投票资格：持有信誉NFT + 满足最低分数要求
- 3天投票期后执行仲裁结果

## 环境变量

复制 `.env.example` 为 `.env` 并填写：

```
# 区块链 RPC & 账户
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY   # Sepolia RPC 地址（Alchemy/Infura）
PRIVATE_KEY=your_private_key_here                                    # 部署账户私钥（不含 0x 前缀也可）
ETHERSCAN_API_KEY=your_etherscan_api_key                             # Etherscan API 密钥（用于合约验证）

# Pinata IPFS 存储（上传题目/解答图片）
PINATA_API_KEY=your_pinata_api_key                                   # Pinata API Key
PINATA_SECRET_KEY=your_pinata_secret_key                             # Pinata Secret Key
PINATA_JWT=your_pinata_jwt                                           # Pinata JWT（推荐优先使用）

# The Graph 本地节点（可选）
GRAPH_NODE_URL=http://localhost:8020

# Chainlink Automation（可选，用于自动超时释放）
CHAINLINK_AUTOMATION_REGISTRY=0x...
```

> 💡 **提示**：本地 Hardhat 网络开发时，只需填写 IPFS 相关变量即可体验完整流程。

## 📦 NPM Scripts 说明

### 根目录（智能合约 / Hardhat）

| 命令 | 说明 |
|------|------|
| `npm run compile` | 编译 Solidity 合约，生成 artifacts |
| `npm run test` | 运行合约单元测试（Chai + Hardhat） |
| `npm run node` | 启动本地 Hardhat 开发链（chainId: 31337） |
| `npm run deploy:local` | 部署所有合约到本地 Hardhat 网络 |
| `npm run deploy:sepolia` | 部署所有合约到 Sepolia 测试网 |
| `npx hardhat run scripts/testCreateBounty.js --network localhost` | 本地测试脚本：批量创建测试悬赏 |

### frontend/ 目录（React 前端）

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动 Vite 开发服务器（默认端口 5173，若冲突会自动切换） |
| `npm run build` | 构建生产版本，输出到 `dist/` |
| `npm run preview` | 本地预览构建后的生产版本 |

> 📌 若需指定 3000 端口，可使用：`npx vite --port 3000 --host`

## ❓ 常见问题 FAQ

### Q1: 本地启动后 MetaMask 无法连接 Hardhat 网络？
1. 确保已运行 `npm run node` 启动本地链
2. 在 MetaMask 中手动添加网络：
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - 符号: `ETH`
3. 导入 Hardhat 提供的测试私钥（终端启动时会打印 Account #0 的私钥）
4. 访问 URL 需带参数：`http://localhost:5173/?network=local`

### Q2: Hardhat 重启后 MetaMask 交易报错 "Nonce too high"？
Hardhat 重启后链状态重置，但 MetaMask 本地缓存了 nonce。解决方法：
- MetaMask → 设置 → 高级 → "重置账户"（仅对测试网操作）

### Q3: 图片上传到 IPFS 失败？
1. 检查 `.env` 中 Pinata JWT 是否填写正确
2. 确认 Pinata 账户额度充足（免费版每天有上传次数限制）
3. 检查文件大小：建议单张图片 < 5MB

### Q4: 合约部署成功但前端显示 "Contract not deployed on this chain"？
1. 检查 `frontend/src/config/contracts.js` 中的合约地址是否为空
2. 重新执行部署脚本，确认部署成功后会自动写入该文件
3. 确认 MetaMask 当前网络与部署网络一致（本地链 / Sepolia）

### Q5: 超时自动释放如何触发？
有两种方式：
1. **手动触发**：在悬赏详情页，超过 7 天后任何人可点击 "超时释放" 按钮触发
2. **Chainlink Automation**（可选）：配置 Chainlink 自动化注册 Upkeep，合约会自动检查并执行

### Q6: 如何获得投票资格参与仲裁？
1. 需要先获得 **Soulbound 信誉 NFT**：解题者信誉分 ≥ 50 或发布者信誉分 ≥ 30 自动铸造
2. 铸造 NFT 后即可在仲裁大厅对提案进行投票

### Q7: 仲裁提案质押的 0.01 ETH 会退还吗？
- 提案通过：质押金退还提案者
- 提案否决：质押金纳入平台奖励池（后续版本用于奖励投票者）

## 📝 相关脚本说明

| 脚本文件 | 用途 |
|---------|------|
| `scripts/deploy.js` | 一键部署所有合约（BountyImpl / Factory / Reputation / Arbitration / Platform），部署成功自动写入前端配置 |
| `scripts/queryChain.js` | 查询链上全局统计（悬赏数、已解决、赏金池）和最近悬赏详情 |
| `scripts/listenEvents.js` | 监听链上事件（悬赏创建、解答提交、审批通过等），实时打印到控制台 |
| `scripts/testCreateBounty.js` | 批量创建测试数据（仅本地开发使用） |

## License

MIT
