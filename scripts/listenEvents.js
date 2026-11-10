/**
 * 监听链上事件脚本（轮询模式，兼容 HTTP RPC）
 * 用法: npx hardhat run scripts/listenEvents.js --network sepolia
 * 或:   npx hardhat run scripts/listenEvents.js --network localhost
 */
const { ethers } = require("hardhat");
const fs = require("fs");

const POLL_INTERVAL = 15000; // 轮询间隔（毫秒）

function formatEvent(emoji, title, fields) {
  console.log(`\n${emoji} [${title}]`);
  for (const [key, val] of Object.entries(fields)) {
    console.log(`   ${key}: ${val}`);
  }
  console.log(`   时间: ${new Date().toLocaleString()}`);
}

async function main() {
  const deployments = JSON.parse(fs.readFileSync("deployments.json", "utf8"));
  const c = deployments.contracts;

  const Platform = await ethers.getContractAt("BountyPlatform", c.BountyPlatform);
  const Reputation = await ethers.getContractAt("ReputationSystem", c.ReputationSystem);
  const Arbitration = await ethers.getContractAt("ArbitrationDAO", c.ArbitrationDAO);

  const network = await ethers.provider.getNetwork();
  console.log("🔍 开始监听链上事件（轮询模式）...");
  console.log(`   网络: ${network.name}`);
  console.log(`   Platform:   ${c.BountyPlatform}`);
  console.log(`   Reputation: ${c.ReputationSystem}`);
  console.log(`   Arbitration: ${c.ArbitrationDAO}`);
  console.log(`   轮询间隔: ${POLL_INTERVAL / 1000}秒`);
  console.log("─".repeat(60));

  let lastBlock = await ethers.provider.getBlockNumber();
  console.log(`   起始区块: ${lastBlock}`);
  console.log("\n✅ 监听已启动，等待事件... (Ctrl+C 退出)\n");

  // 事件处理映射
  const handlers = {
    Platform: {
      PlatformBountyCreated: (e) => formatEvent("📌", "新悬赏创建", {
        "悬赏ID": `#${e.args[0]}`, "合约地址": e.args[1],
        "发布者": e.args[2], "赏金": `${ethers.formatEther(e.args[3])} ETH`,
      }),
      PlatformSolutionSubmitted: (e) => formatEvent("📝", "解答提交", {
        "悬赏ID": `#${e.args[0]}`, "解答者": e.args[1],
      }),
      PlatformSolutionApproved: (e) => formatEvent("✅", "解答批准", {
        "悬赏ID": `#${e.args[0]}`, "解答者": e.args[1],
        "赏金": `${ethers.formatEther(e.args[2])} ETH`,
      }),
      PlatformBountyAutoReleased: (e) => formatEvent("⏰", "自动释放", {
        "悬赏ID": `#${e.args[0]}`, "解答者": e.args[1],
        "赏金": `${ethers.formatEther(e.args[2])} ETH`,
      }),
      PlatformBountyCancelled: (e) => formatEvent("❌", "悬赏取消", {
        "悬赏ID": `#${e.args[0]}`,
      }),
      PlatformDisputeRaised: (e) => formatEvent("⚠️", "争议发起", {
        "悬赏ID": `#${e.args[0]}`, "发起人": e.args[1],
      }),
      PlatformArbitrationCreated: (e) => formatEvent("⚖️", "仲裁提案创建", {
        "提案ID": `#${e.args[0]}`, "悬赏ID": `#${e.args[1]}`,
      }),
    },
    Reputation: {
      ReputationUpdated: (e) => formatEvent("🏆", "信誉更新", {
        "用户": e.args[0], "解题分": `${e.args[1]}`,
        "出题分": `${e.args[2]}`, "原因": e.args[3],
      }),
      ReputationNFTMinted: (e) => formatEvent("🎖️", "NFT铸造", {
        "用户": e.args[0], "TokenID": `${e.args[1]}`,
      }),
    },
    Arbitration: {
      ProposalCreated: (e) => formatEvent("📋", "仲裁提案", {
        "提案ID": `#${e.args[0]}`, "悬赏ID": `#${e.args[1]}`,
        "提案者": e.args[2],
      }),
      Voted: (e) => formatEvent("🗳️", "投票", {
        "提案ID": `#${e.args[0]}`, "投票者": e.args[1],
        "立场": e.args[2] ? "赞成 ✅" : "反对 ❌",
      }),
      ArbitrationExecuted: (e) => formatEvent("⚡", "仲裁执行", {
        "提案ID": `#${e.args[0]}`, "悬赏ID": `#${e.args[1]}`,
        "结果": e.args[2] ? "赏金→解答者" : "赏金→发布者",
        "票数": `赞成${e.args[3]} / 反对${e.args[4]}`,
      }),
    },
  };

  const contractMap = { Platform, Reputation, Arbitration };

  // 轮询循环
  setInterval(async () => {
    try {
      const currentBlock = await ethers.provider.getBlockNumber();
      if (currentBlock <= lastBlock) return;

      for (const [name, contract] of Object.entries(contractMap)) {
        const events = await contract.queryFilter("*", lastBlock + 1, currentBlock);
        for (const event of events) {
          const eventName = event.fragment?.name;
          if (handlers[name]?.[eventName]) {
            handlers[name][eventName](event);
          }
        }
      }

      lastBlock = currentBlock;
    } catch (err) {
      // 静默处理网络抖动，下次轮询继续
    }
  }, POLL_INTERVAL);

  // 保持脚本运行
  await new Promise(() => {});
}

main().catch(console.error);
