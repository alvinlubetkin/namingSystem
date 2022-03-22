const { deployments } = require("hardhat");

const testFixture = deployments.createFixture(
  async ({ deployments, getNamedAccounts, ethers }) => {
    const { deployer, primaryAccount } = await getNamedAccounts();
    const { read, execute } = deployments;
    const registry = await deployments.deploy("Registry", {
      from: deployer,
      args: [
        ethers.utils.parseUnits("0.25", 18),
        ethers.BigNumber.from("10"), //use shorter expiration time for tests
      ],
    });
    const registrar = await deployments.deploy("Registrar", {
      from: deployer,
      args: [registry.address, 2],
    });

    return {
      registryJSON: registry,
      registrarJSON: registrar,
      _deployer: deployer,
      _primaryAccount: primaryAccount,
    };
  }
);
exports.testFixture = testFixture;
