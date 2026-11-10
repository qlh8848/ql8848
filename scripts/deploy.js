const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // 1. 部署 Bounty 实现合约（模板）
  console.log("\n1. Deploying Bounty implementation...");
  const BountyImpl = await ethers.getContractFactory("Bounty");
  const bountyImpl = await BountyImpl.deploy();
  await bountyImpl.waitForDeployment();
  const bountyImplAddr = await bountyImpl.getAddress();
  console.log("   Bounty Implementation:", bountyImplAddr);

  // 2. 部署 BountyFactory
  console.log("\n2. Deploying BountyFactory...");
  const BountyFactory = await ethers.getContractFactory("BountyFactory");
  const factory = await BountyFactory.deploy(bountyImplAddr);
  await factory.waitForDeployment();
  const factoryAddr = await factory.getAddress();
  console.log("   BountyFactory:", factoryAddr);

  // 3. 部署 ReputationSystem
  console.log("\n3. Deploying ReputationSystem...");
  const ReputationSystem = await ethers.getContractFactory("ReputationSystem");
  const reputation = await ReputationSystem.deploy();
  await reputation.waitForDeployment();
  const reputationAddr = await reputation.getAddress();
  console.log("   ReputationSystem:", reputationAddr);

  // 4. 部署 ArbitrationDAO
  console.log("\n4. Deploying ArbitrationDAO...");
  const ArbitrationDAO = await ethers.getContractFactory("ArbitrationDAO");
  const arbitration = await ArbitrationDAO.deploy(reputationAddr);
  await arbitration.waitForDeployment();
  const arbitrationAddr = await arbitration.getAddress();
  console.log("   ArbitrationDAO:", arbitrationAddr);

  // 5. 部署 BountyPlatform
  console.log("\n5. Deploying BountyPlatform...");
  const BountyPlatform = await ethers.getContractFactory("BountyPlatform");
  const platform = await BountyPlatform.deploy(factoryAddr, reputationAddr, arbitrationAddr);
  await platform.waitForDeployment();
  const platformAddr = await platform.getAddress();
  console.log("   BountyPlatform:", platformAddr);

  // 6. 配置关联
  console.log("\n6. Configuring contract references...");
  
  // 设置Factory的platform地址
  await factory.setPlatform(platformAddr);
  console.log("   Factory.setPlatform done");

  // 设置ArbitrationDAO的factory地址
  await arbitration.setFactory(factoryAddr);
  console.log("   ArbitrationDAO.setFactory done");

  // 授予Platform合约UPDATER_ROLE（用于更新信誉）
  const UPDATER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("UPDATER_ROLE"));
  await reputation.grantRole(UPDATER_ROLE, platformAddr);
  console.log("   ReputationSystem granted UPDATER_ROLE to Platform");

  // 授予Platform合约PLATFORM_ROLE
  const PLATFORM_ROLE = ethers.keccak256(ethers.toUtf8Bytes("PLATFORM_ROLE"));
  await reputation.grantRole(PLATFORM_ROLE, platformAddr);
  await arbitration.grantRole(PLATFORM_ROLE, platformAddr);
  console.log("   Granted PLATFORM_ROLE to Platform");

  console.log("\n========== Deployment Summary ==========");
  console.log("Bounty Implementation:", bountyImplAddr);
  console.log("BountyFactory:        ", factoryAddr);
  console.log("ReputationSystem:     ", reputationAddr);
  console.log("ArbitrationDAO:       ", arbitrationAddr);
  console.log("BountyPlatform:       ", platformAddr);
  console.log("=========================================\n");

  // 保存部署地址到文件
  const fs = require("fs");
  const deployData = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    deployer: deployer.address,
    contracts: {
      BountyImplementation: bountyImplAddr,
      BountyFactory: factoryAddr,
      ReputationSystem: reputationAddr,
      ArbitrationDAO: arbitrationAddr,
      BountyPlatform: platformAddr,
    },
    deployedAt: new Date().toISOString(),
  };

  fs.writeFileSync(
    "./deployments.json",
    JSON.stringify(deployData, null, 2)
  );
  console.log("Deployment data saved to deployments.json");

  // 自动更新前端合约地址配置
  const contractsConfigPath = "./frontend/src/config/contracts.js";
  if (fs.existsSync(contractsConfigPath)) {
    let configContent = fs.readFileSync(contractsConfigPath, "utf8");
    const chainId = Number((await ethers.provider.getNetwork()).chainId);

    const newAddresses = `{
  BountyFactory: '${factoryAddr}',
  ReputationSystem: '${reputationAddr}',
  ArbitrationDAO: '${arbitrationAddr}',
  BountyPlatform: '${platformAddr}',
}`;

    if (chainId === 31337) {
      configContent = configContent.replace(
        /export const LOCAL_CONTRACTS = \{[^}]+\};/,
        `export const LOCAL_CONTRACTS = ${newAddresses};`
      );
    } else if (chainId === 11155111) {
      configContent = configContent.replace(
        /export const SEPOLIA_CONTRACTS = \{[^}]+\};/,
        `export const SEPOLIA_CONTRACTS = ${newAddresses};`
      );
    }

    fs.writeFileSync(contractsConfigPath, configContent);
    console.log(`Frontend contracts.js updated for chainId ${chainId}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
