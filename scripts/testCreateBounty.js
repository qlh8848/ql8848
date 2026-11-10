const fs = require("fs");
const path = require("path");

async function main() {
  // 从部署记录中读取合约地址
  const deploymentsPath = path.join(__dirname, "..", "deployments.json");
  if (!fs.existsSync(deploymentsPath)) {
    throw new Error("deployments.json not found. Run deploy script first.");
  }
  const deployments = JSON.parse(fs.readFileSync(deploymentsPath, "utf8"));
  const factoryAddress = deployments.contracts?.BountyFactory;
  if (!factoryAddress) {
    throw new Error("BountyFactory address not found in deployments.json");
  }

  const factory = await ethers.getContractAt("BountyFactory", factoryAddress);

  console.log("Calling createBounty...");
  const tx = await factory.createBounty("QmTestHash", 1, {
    value: ethers.parseEther("0.1"),
  });
  console.log("tx hash:", tx.hash);
  const receipt = await tx.wait();
  console.log("status:", receipt.status);
  console.log("Bounty count:", (await factory.bountyCount()).toString());
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("ERROR:", err.message);
    process.exit(1);
  });
