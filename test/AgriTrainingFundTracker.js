const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AgriTrainingFundTracker", function () {
  let AgriTrainingFundTracker;
  let agriTrainingFundTracker;
  let governor;
  let center;

  beforeEach(async function () {
    [governor, center] = await ethers.getSigners();
    
    // Get the ContractFactory
    AgriTrainingFundTracker = await ethers.getContractFactory("AgriTrainingFundTracker");

    // Corrected deployment: no arguments are needed for your constructor
    agriTrainingFundTracker = await AgriTrainingFundTracker.deploy();
    
    // Re-verify that the governor is set to the deployer
    expect(await agriTrainingFundTracker.government()).to.equal(governor.address);
  });

  it("Should set the right governor", async function () {
    expect(await agriTrainingFundTracker.government()).to.equal(governor.address);
  });

  it("Should allow the governor to register a center", async function () {
    const centerAddress = center.address;
    const centerName = "My Test Center";
    
    await agriTrainingFundTracker.connect(governor).registerCenter(centerAddress, centerName);
    
    const isRegistered = await agriTrainingFundTracker.centers(centerAddress);
    expect(isRegistered.isRegistered).to.equal(true);
  });
});