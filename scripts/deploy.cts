import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config();

async function main(): Promise<void> {
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  const rpcUrl = process.env.ARC_RPC_URL;
  const usdcAddress = process.env.USDC_ADDRESS;
  const explorerUrl = process.env.ARC_EXPLORER_URL ?? "https://testnet.arcscan.app";

  if (!privateKey) throw new Error("Missing env var: DEPLOYER_PRIVATE_KEY");
  if (!rpcUrl) throw new Error("Missing env var: ARC_RPC_URL");
  if (!usdcAddress) throw new Error("Missing env var: USDC_ADDRESS");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);

  const erc20Abi = ["function balanceOf(address owner) view returns (uint256)"];
  const usdc = new ethers.Contract(usdcAddress, erc20Abi, deployer);
  const usdcBalance = await usdc.balanceOf(deployer.address);
  console.log("Deployer USDC balance:", ethers.formatUnits(usdcBalance, 6), "USDC");

  console.log("Deploying OinkSafe...");
  const OinkSafe = await ethers.getContractFactory("OinkSafe");
  const oinkSafe = await OinkSafe.deploy(usdcAddress);
  await oinkSafe.waitForDeployment();

  const deployedAddress = await oinkSafe.getAddress();
  const deploymentTx = oinkSafe.deploymentTransaction();
  if (!deploymentTx) throw new Error("Deployment transaction not found");

  const receipt = await deploymentTx.wait();
  if (!receipt) throw new Error("Deployment receipt not found");

  console.log("Deployed address:  ", deployedAddress);
  console.log("Transaction hash:  ", deploymentTx.hash);
  console.log("Block explorer:    ", `${explorerUrl}/address/${deployedAddress}`);

  const deploymentInfo = {
    network: "arc-testnet",
    chainId: 5042002,
    contractName: "OinkSafe",
    address: deployedAddress,
    deployer: deployer.address,
    deploymentTx: deploymentTx.hash,
    usdcAddress: usdcAddress,
    deployedAt: new Date().toISOString(),
    blockNumber: receipt.blockNumber,
  };

  const outDir = path.resolve(__dirname, "..", "deployments");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, "arc-testnet.json"),
    JSON.stringify(deploymentInfo, null, 2) + "\n",
  );
  console.log("Deployment info written to deployments/arc-testnet.json");

  console.log(`\n✅ OinkSafe deployed successfully. Save this address: ${deployedAddress}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
