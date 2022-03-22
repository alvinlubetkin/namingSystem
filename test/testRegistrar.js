const { expect } = require("chai");
const { ethers, deployments, getUnnamedAccounts } = require("hardhat");
const ERC721 = require("@openzeppelin/contracts/build/contracts/ERC721.json");
const interface = new ethers.utils.Interface(ERC721.abi);
const { testFixture } = require("../fixtures/simpleFixture");
require("@openzeppelin/test-helpers/configure")({
  provider: "http://localhost:8545",
});
const { time } = require("@openzeppelin/test-helpers");

describe("Registrar", () => {
  let registry;
  let registrar;
  let deployer;
  let primaryAccount;
  let name = "TEST NAME";
  beforeEach("Deploy contracts and set role", async () => {
    const {
      registryJSON,
      _deployer,
      _primaryAccount,
      registrarJSON,
    } = await testFixture();
    deployer = await ethers.getSigner(_deployer);
    primaryAccount = await ethers.getSigner(_primaryAccount);
    registry = await ethers.getContractAt(
      registryJSON.abi,
      registryJSON.address,
      primaryAccount
    );
    registrar = await ethers.getContractAt(
      registrarJSON.abi,
      registrarJSON.address,
      primaryAccount
    );
    const role = await registry.REGISTRAR_ROLE();
    await registry.connect(deployer).grantRole(role, registrar.address);
  });
  it("should make commit for test name", async () => {
    const txCommit = await registrar.commit(primaryAccount.address);
    const isUpdated = await registrar._commited(primaryAccount.address);
    expect(isUpdated).to.be.equal(true, "commit was not set properly");
    const waitBlock = await registrar._commitBlock(primaryAccount.address);
    expect(waitBlock).to.be.equal(
      txCommit.blockNumber,
      "commit block was not set properly"
    );
  });

  it("should reveal new name and mint", async () => {
    const txCommit = await registrar.commit(primaryAccount.address);
    await ethers.provider.waitForTransaction(txCommit.hash);
    //skip 2 blocks
    await hre.network.provider.send("evm_mine");
    await hre.network.provider.send("evm_mine");

    const txReveal = await registrar.reveal(name, {
      value: ethers.utils.parseUnits("0.25", 18),
    });
    const receipt = await ethers.provider.waitForTransaction(txReveal.hash);

    const event = interface.decodeEventLog(
      "Transfer",
      receipt.logs[0].data,
      receipt.logs[0].topics
    );
    expect(event.from).to.be.equal(
      ethers.constants.AddressZero,
      "nft not minted properly"
    );
    expect(event.to).to.be.equal(
      primaryAccount.address,
      "nft not minted properly"
    );
  });

  it("should fail to reveal if blockMin not passed", async () => {
    const txCommit = await registrar.commit(primaryAccount.address);
    await ethers.provider.waitForTransaction(txCommit.hash);

    const txReveal = registrar.reveal(name, {
      value: ethers.utils.parseUnits("0.25", 18),
    });

    await expect(txReveal).to.be.revertedWith(
      "cannot commit and reveal in less than min blocks"
    );
  });

  it("should fail to reveal if not commited", async () => {
    const txReveal = registrar.reveal(name, {
      value: ethers.utils.parseUnits("0.25", 18),
    });

    await expect(txReveal).to.be.revertedWith("Uncommited.");
  });
});
