module.exports = async ({ deployments, getNamedAccounts }) => {
  const { deploy, read, execute } = deployments;
  const { deployer, primaryAccount } = await getNamedAccounts();
  const registry = await deployments.get("Registry");
  const registrar = await deploy("Registrar", {
    from: deployer,
    args: [registry.address],
    log: true,
  });
  const role = await read("Registry", { log: true }, "REGISTRAR_ROLE");

  await execute(
    "Registry",
    { from: deployer, log: true },
    "grantRole",
    role,
    primaryAccount
  );
};

module.exports.tags = ["Registrar"];
