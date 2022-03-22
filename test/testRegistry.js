const { expect } = require("chai");
const { ethers, getUnnamedAccounts } = require("hardhat");
const ERC721 = require("@openzeppelin/contracts/build/contracts/ERC721.json");
const interface = new ethers.utils.Interface(ERC721.abi);
const { testFixture } = require("../fixtures/simpleFixture");

describe("Registry", () => {
  describe("Registry initial registration", function () {
    let registry;
    let deployer;
    let primaryAccount;

    beforeEach("deploy new registry and registrar", async () => {
      const { registryJSON, _deployer, _primaryAccount } = await testFixture();
      deployer = await ethers.getSigner(_deployer);
      primaryAccount = await ethers.getSigner(_primaryAccount);
      registry = await ethers.getContractAt(
        registryJSON.abi,
        registryJSON.address,
        primaryAccount
      );
      const role = await registry.REGISTRAR_ROLE();
      await registry.connect(deployer).grantRole(role, primaryAccount.address);
    });

    it("Should register a new name", async () => {
      const name = "TEST NAME";

      const timestamp = Math.floor(Date.now() / 1000);
      const txRegister = await registry.registerName(
        name,
        primaryAccount.address,
        { value: ethers.utils.parseUnits("1", 18) }
      );
      const receipt = await ethers.provider.waitForTransaction(txRegister.hash);

      const data = receipt.logs[0].data;
      const topics = receipt.logs[0].topics;
      const event = interface.decodeEventLog("Transfer", data, topics);

      expect(event.from).to.be.equal(
        ethers.constants.AddressZero,
        "nft not minted properly"
      );
      expect(event.to).to.be.equal(
        primaryAccount.address,
        "nft not minted properly"
      );

      const registeredTokenId = await registry.names(name);
      expect(registeredTokenId).to.be.equal(1, "Name not registered properly");

      const expiry = await registry.registrationExpiry(registeredTokenId);
      expect(parseInt(expiry)).to.be.greaterThan(
        timestamp,
        "expiry not registered properly"
      );
    });
    // expect to fail
    it("Should fail to register name with insufficient funds", async () => {
      const txRegister = registry.registerName(
        "TEST NAME",
        primaryAccount.address,
        {
          value: ethers.utils.parseUnits("0.24", 18),
        }
      );
      await expect(txRegister).to.be.reverted;
    });
  });

  describe("Registry functions for owners", () => {
    let registry;
    let deployer;
    let primaryAccount;
    let secondAccount;
    let registeredTokenId;
    let name;

    beforeEach("get deployments and register test name", async () => {
      const { registryJSON, _deployer, _primaryAccount } = await testFixture();
      deployer = await ethers.getSigner(_deployer);
      primaryAccount = await ethers.getSigner(_primaryAccount);
      secondAccount = await ethers.getSigner(await getUnnamedAccounts()[5]);
      registry = await ethers.getContractAt(
        registryJSON.abi,
        registryJSON.address,
        primaryAccount
      );
      name = "TEST NAME";
      const role = await registry.REGISTRAR_ROLE();
      await registry.connect(deployer).grantRole(role, primaryAccount.address);

      await registry.registerName(name, primaryAccount.address, {
        value: ethers.utils.parseUnits("0.25", 18),
      });
      registeredTokenId = await registry.names(name);
    });

    it("Should renew name before expiry", async () => {
      const expiry = await registry.registrationExpiry(registeredTokenId);
      if (parseInt(expiry) > Math.floor(Date.now() / 1000)) {
        await registry.renewName(registeredTokenId);
      } else {
        expect(0).to.be.equal(1, "expiry already passed");
      }
      const newExpiry = await registry.registrationExpiry(registeredTokenId);
      expect(parseInt(newExpiry)).to.be.greaterThan(
        parseInt(expiry),
        "expiry not renewed"
      );
    });
    it("Should release name", async () => {
      const balance = await ethers.provider.getBalance(registry.address);
      const txRelease = await registry.releaseName(name);
      const receipt = await ethers.provider.waitForTransaction(txRelease.hash);
      const data = receipt.logs[1].data;
      const topics = receipt.logs[1].topics;
      const event = interface.decodeEventLog("Transfer", data, topics);

      expect(event.to).to.be.equal(
        ethers.constants.AddressZero,
        "nft not burned properly"
      );
      expect(event.from).to.be.equal(
        primaryAccount.address,
        "nft not burned properly"
      );
      const tokenIdOfName = await registry.names(name);
      expect(tokenIdOfName).to.be.equal(0, "nft not burned properly");
      const balanceAfter = await ethers.provider.getBalance(registry.address);
      expect(parseFloat(ethers.utils.formatEther(balanceAfter))).to.be.lessThan(
        parseFloat(ethers.utils.formatEther(balance)),
        "withdraw failed"
      );
    });

    it("Should update expiry on transfer", async () => {
      const initialExpiry = await registry.registrationExpiry(
        registeredTokenId
      );
      const txTransfer = await registry.transferFrom(
        primaryAccount.address,
        secondAccount.address,
        registeredTokenId
      );
      const receipt = await ethers.provider.waitForTransaction(txTransfer.hash);

      const data = receipt.logs[1].data;
      const topics = receipt.logs[1].topics;
      const event = interface.decodeEventLog("Transfer", data, topics);
      expect(event.to).to.be.equal(
        secondAccount.address,
        "nft not transfered properly"
      );
      expect(event.from).to.be.equal(
        primaryAccount.address,
        "nft not transfered properly"
      );

      const expiry = await registry.registrationExpiry(registeredTokenId);
      expect(parseInt(expiry)).to.be.greaterThan(
        parseInt(initialExpiry),
        "did not update expiry on transfer"
      );
    });

    it("Should fail to release name if not owner/operator", async () => {
      const txRelease = registry
        .connect(secondAccount)
        .releaseName(registeredTokenId);
      await expect(txRelease).to.be.reverted;
    });

    it("Should fail to register name if not registrar", async () => {
      const txRegister = registry
        .connect(secondAccount)
        .registerName(name, secondAccount.address, {
          value: ethers.utils.parseUnits("0.25", 18),
        });
      await expect(txRegister).to.be.revertedWith("Must have REGISTRAR role");
    });

    it("Should fail to register name if already owned", async () => {
      const role = await registry.REGISTRAR_ROLE();
      const setRole = await registry
        .connect(deployer)
        .grantRole(role, secondAccount.address);
      await ethers.provider.waitForTransaction(setRole.hash);

      const txRegister = registry
        .connect(secondAccount)
        .registerName(name, secondAccount.address, {
          value: ethers.utils.parseUnits("0.25", 18),
        });
      await expect(txRegister).to.be.revertedWith("Name is already registered");
    });

    it("Should register for new user after previous registration has expired", async () => {
      const expiry = await registry.registrationExpiry(registeredTokenId);
      let now = Math.floor(Date.now() / 1000);
      //wait for expiry
      while (now < expiry) {
        setTimeout(() => {}, 1000);
        now = Math.floor(Date.now() / 1000);
      }

      const txRegister = await registry
        .connect(primaryAccount)
        .registerName(name, secondAccount.address, {
          value: ethers.utils.parseUnits("0.25", 18),
        });
      const receipt = await ethers.provider.waitForTransaction(txRegister.hash);

      const data = receipt.logs[1].data;
      const topics = receipt.logs[1].topics;
      const event = interface.decodeEventLog("Transfer", data, topics);
      expect(event.from).to.be.equal(
        primaryAccount.address,
        "nft not transfered properly"
      );
      expect(event.to).to.be.equal(
        secondAccount.address,
        "nft not transfered properly"
      );
    });
  });
});
