import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import { createPublicClient, http, getContract } from "viem";
import { arcTestnet } from "viem/chains";

const IDENTITY_REGISTRY = "0x8004A818BFB912233c491871b3d84c89A494BD9e";

const AGENT_ID = 885309n;
const OWNER_WALLET_ID = "f6fa6c1d-880c-51ce-b985-718b00575a61";
const NEW_METADATA_URI =
  "ipfs://bafkreiap2t3p7eta4yv24zkhmvcnzdg6tbohl4lj565szxxjqzjckesd2i";

const circleClient = initiateDeveloperControlledWalletsClient({
  apiKey: process.env.CIRCLE_API_KEY!,
  entitySecret: process.env.CIRCLE_ENTITY_SECRET!,
});

const publicClient = createPublicClient({
  chain: arcTestnet,
  transport: http(),
});

async function waitForTransaction(txId: string, label: string) {
  process.stdout.write(`  Waiting for ${label}`);
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const { data } = await circleClient.getTransaction({ id: txId });
    if (data?.transaction?.state === "COMPLETE") {
      const txHash = data.transaction.txHash;
      console.log(` ✓\n  Tx: https://testnet.arcscan.app/tx/${txHash}`);
      return txHash;
    }
    if (data?.transaction?.state === "FAILED") {
      throw new Error(`${label} failed onchain`);
    }
    process.stdout.write(".");
  }
  throw new Error(`${label} timed out`);
}

async function main() {
  console.log("\n── Step 1: Look up owner wallet ──");

  const walletResponse = await circleClient.getWallet({
    id: OWNER_WALLET_ID,
  });
  const ownerWallet = walletResponse.data?.wallet!;

  console.log(`  Owner: ${ownerWallet.address} (${ownerWallet.id})`);

  console.log("\n── Step 2: Verify current agent state ──");

  const identityContract = getContract({
    address: IDENTITY_REGISTRY,
    abi: [
      {
        name: "ownerOf",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "tokenId", type: "uint256" }],
        outputs: [{ name: "", type: "address" }],
      },
      {
        name: "tokenURI",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "tokenId", type: "uint256" }],
        outputs: [{ name: "", type: "string" }],
      },
    ],
    client: publicClient,
  });

  const currentOwner = await identityContract.read.ownerOf([AGENT_ID]);
  const currentURI = await identityContract.read.tokenURI([AGENT_ID]);

  console.log(`  Agent ID:         ${AGENT_ID}`);
  console.log(`  Current owner:    ${currentOwner}`);
  console.log(`  Current URI:      ${currentURI}`);

  if (currentOwner.toLowerCase() !== ownerWallet.address!.toLowerCase()) {
    throw new Error(
      `Owner wallet ${ownerWallet.address} does not match on-chain owner ${currentOwner} — this wallet cannot sign the update`,
    );
  }

  console.log("\n── Step 3: Update agent URI ──");
  console.log(`  New URI: ${NEW_METADATA_URI}`);

  const updateTx = await circleClient.createContractExecutionTransaction({
    walletAddress: ownerWallet.address!,
    blockchain: "ARC-TESTNET",
    contractAddress: IDENTITY_REGISTRY,
    abiFunctionSignature: "setAgentURI(uint256,string)",
    abiParameters: [AGENT_ID.toString(), NEW_METADATA_URI],
    fee: { type: "level", config: { feeLevel: "MEDIUM" } },
  });

  const txHash = await waitForTransaction(updateTx.data?.id!, "URI update");

  console.log("\n── Step 4: Verify updated URI ──");

  const updatedURI = await identityContract.read.tokenURI([AGENT_ID]);

  console.log(`  Metadata URI: ${updatedURI}`);

  console.log("\n── Complete ──");
  console.log("  ✓ Agent metadata URI updated");
  console.log(`\n  Tx:       https://testnet.arcscan.app/tx/${txHash}`);
  console.log(
    `  Agent:    https://testnet.arcscan.app/token/${IDENTITY_REGISTRY}/instance/${AGENT_ID}\n`,
  );
}

main().catch((error) => {
  console.error("\nError:", error.message ?? error);
  process.exit(1);
});
