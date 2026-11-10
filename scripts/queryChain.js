/**
 * 查询链上数据脚本
 * 用法: npx hardhat run scripts/queryChain.js --network localhost
 */
const { ethers } = require("hardhat");

async function main() {
  // 读取部署地址
  const fs = require("fs");
  const deployments = JSON.parse(fs.readFileSync("deployments.json", "utf8"));
  const c = deployments.contracts;

  const factoryAddr = c.BountyFactory;
  const platformAddr = c.BountyPlatform;
  const reputationAddr = c.ReputationSystem;
  const arbitrationAddr = c.ArbitrationDAO;

  // 获取合约实例
  const Factory = await ethers.getContractAt("BountyFactory", factoryAddr);
  const Platform = await ethers.getContractAt("BountyPlatform", platformAddr);
  const Reputation = await ethers.getContractAt("ReputationSystem", reputationAddr);
  const Arbitration = await ethers.getContractAt("ArbitrationDAO", arbitrationAddr);

  console.log("\n========== 📋 平台统计 ==========");
  const totalBounties = await Platform.totalBountiesCreated();
  const totalResolved = await Platform.totalBountiesResolved();
  console.log(`  总悬赏数:   ${totalBounties}`);
  console.log(`  已解决数:   ${totalResolved}`);

  console.log("\n========== 📦 所有悬赏 ==========");
  const bountyCount = await Factory.bountyCount();
  console.log(`  悬赏合约总数: ${bountyCount}\n`);

  const statusLabels = ["开放中", "已提交", "已批准", "争议中", "自动释放", "已取消", "已拒绝"];

  for (let i = 0; i < bountyCount; i++) {
    const bountyAddr = await Factory.bounties(i);
    const Bounty = await ethers.getContractAt("Bounty", bountyAddr);
    const info = await Bounty.getBountyInfo();

    console.log(`  ── 悬赏 #${i} ──`);
    console.log(`  合约地址:    ${bountyAddr}`);
    console.log(`  发布者:      ${info[0]}`);
    console.log(`  解答者:      ${info[1] === ethers.ZeroAddress ? "无" : info[1]}`);
    console.log(`  题目IPFS:    ${info[2]}`);
    console.log(`  解答IPFS:    ${info[3] || "无"}`);
    console.log(`  赏金:        ${ethers.formatEther(info[4])} ETH`);
    console.log(`  截止时间:    ${new Date(Number(info[5]) * 1000).toLocaleString()}`);
    console.log(`  创建时间:    ${new Date(Number(info[6]) * 1000).toLocaleString()}`);
    console.log(`  状态:        ${statusLabels[Number(info[7])] || "未知"}`);
    console.log();
  }

  console.log("========== 👤 用户信誉 ==========");
  const signers = await ethers.getSigners();
  for (let i = 0; i < 5; i++) {
    const addr = signers[i].address;
    const rep = await Reputation.getReputation(addr);
    const hasNFT = await Reputation.hasNFT(addr);
    if (rep.solverScore > 0 || rep.creatorScore > 0) {
      console.log(`  ${addr}`);
      console.log(`    解题分: ${rep.solverScore}  出题分: ${rep.creatorScore}`);
      console.log(`    已解题: ${rep.totalSolved}  已出题: ${rep.totalCreated}  争议: ${rep.totalDisputed}`);
      console.log(`    持有NFT: ${hasNFT ? "✅ 是" : "❌ 否"}`);
      console.log();
    }
  }

  console.log("========== ⚖️ 仲裁提案 ==========");
  const proposalCount = await Arbitration.proposalCount();
  console.log(`  提案总数: ${proposalCount}\n`);

  const proposalStatusLabels = ["进行中", "已执行", "已过期"];
  for (let i = 0; i < proposalCount; i++) {
    const p = await Arbitration.proposals(i);
    console.log(`  ── 提案 #${i} ──`);
    console.log(`  关联悬赏:  #${p.bountyId}`);
    console.log(`  提案者:    ${p.proposer}`);
    console.log(`  赞成票:    ${p.yesVotes}`);
    console.log(`  反对票:    ${p.noVotes}`);
    console.log(`  状态:      ${proposalStatusLabels[Number(p.status)] || "未知"}`);
    console.log(`  截止时间:  ${new Date(Number(p.deadline) * 1000).toLocaleString()}`);
    console.log();
  }

  console.log("========== 💰 合约余额 ==========");
  for (let i = 0; i < bountyCount; i++) {
    const bountyAddr = await Factory.bounties(i);
    const balance = await ethers.provider.getBalance(bountyAddr);
    if (balance > 0) {
      console.log(`  悬赏 #${i}: ${ethers.formatEther(balance)} ETH`);
    }
  }
  const arbBalance = await ethers.provider.getBalance(arbitrationAddr);
  if (arbBalance > 0) {
    console.log(`  仲裁合约:  ${ethers.formatEther(arbBalance)} ETH`);
  }

  console.log("\n========== 📜 最近事件 ==========");
  const latestBlock = await ethers.provider.getBlockNumber();
  const fromBlock = Math.max(0, latestBlock - 100);

  // 查询平台事件
  const platformEvents = await Platform.queryFilter("*", fromBlock, latestBlock);
  for (const event of platformEvents.slice(-10)) {
    const block = await event.getBlock();
    const time = new Date(block.timestamp * 1000).toLocaleString();
    console.log(`  [${time}] ${event.fragment?.name || "Unknown"}`);
  }

  console.log("\n✅ 查询完成");
}

main().catch(console.error);
