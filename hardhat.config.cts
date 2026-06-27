import { HardhatUserConfig, subtask } from "hardhat/config";
import { TASK_TEST_RUN_MOCHA_TESTS } from "hardhat/builtin-tasks/task-names";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
import type { MochaOptions } from "mocha";

dotenv.config();

const DEPLOYER_KEY = process.env.DEPLOYER_PRIVATE_KEY;
const ARC_RPC_URL = process.env.ARC_RPC_URL ?? "https://rpc.testnet.arc.network";

// Override the Mocha runner subtask so it uses require() (CJS) instead of import() (ESM).
// This project has "type": "module" in package.json, which makes Hardhat's default runner
// call mocha.loadFilesAsync() — an ESM import() path that bypasses Module._extensions,
// so ts-node's hook never transpiles .cts test files. Using mocha.loadFiles() (synchronous
// CJS require) lets our .cts extension hook work.
subtask(TASK_TEST_RUN_MOCHA_TESTS, async (
  taskArgs: { testFiles: string[]; bail: boolean; parallel: boolean; grep?: string },
  { config }
): Promise<number> => {
  // Register ts-node in transpile-only mode (skips type-checking, just transforms TS→JS)
  // and copy its hook to .cts (ts-node 10.x only patches .ts/.tsx by default).
  // transpileOnly is standard for test runners; type-correctness is validated by tsc separately.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tsNode = require("ts-node") as any;
  tsNode.register({
    transpileOnly: true,
    project: process.env.TS_NODE_PROJECT,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const m = require("module") as any;
  m._extensions[".cts"] = m._extensions[".ts"];

  const { default: Mocha } = await import("mocha");
  const mochaConfig: MochaOptions = { ...config.mocha };
  if (taskArgs.grep !== undefined) mochaConfig.grep = taskArgs.grep;
  if (taskArgs.bail) mochaConfig.bail = true;

  const mocha = new Mocha(mochaConfig);
  taskArgs.testFiles.forEach((file) => mocha.addFile(file));

  // loadFiles() uses require() under the hood — Module._extensions hooks ARE invoked
  mocha.loadFiles();

  return new Promise<number>((resolve) => {
    mocha.run(resolve);
  });
});

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    arcTestnet: {
      chainId: 5042002,
      url: ARC_RPC_URL,
      accounts: DEPLOYER_KEY ? [DEPLOYER_KEY] : [],
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    artifacts: "./artifacts",
    cache: "./cache",
  },
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6",
  },
};

export default config;
