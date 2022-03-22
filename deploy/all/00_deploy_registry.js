module.exports = async ({ deployments, getNamedAccounts, ethers }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  await deploy("Registry", {
    from: deployer,
    args: [
      ethers.utils.parseUnits("0.25", 18),
      ethers.BigNumber.from("7889400"), // 3 months
    ],
    log: true,
  });
};

module.exports.tags = ["Registry"];
