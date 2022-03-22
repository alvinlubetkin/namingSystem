require("dotenv").config({ path: "./.env" });
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
require("hardhat-deploy");

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
let pkey = process.env.PRIVATE_KEY;
if (!pkey) {
  pkey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
}
module.exports = {
  solidity: "0.8.4",
  networks: {
    hardhat: {
      deploy: ["deploy/all", "deploy/localhost"],
      saveDeployments: false,
    },
    mainnet: {
      url: process.env.NODE_HTTP,
      accounts: [pkey],
      deploy: ["deploy/all", "deploy/mainnet"],
    },
  },
  namedAccounts: {
    deployer: {
      default: 0,
      1: 0,
      4: 0,
    },
    primaryAccount: {
      default: 1,
      1: 0,
      4: 1,
    },
  },
};
