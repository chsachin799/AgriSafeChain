const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("Deploying contracts with the account:", deployer.address);

  // Get the contract factory
  const AgriTrainingFundTracker = await hre.ethers.getContractFactory("AgriTrainingFundTracker");

  // Deploy the contract
  const agriTrainingFundTracker = await AgriTrainingFundTracker.deploy();

  // Wait for the deployment to complete
  await agriTrainingFundTracker.waitForDeployment();

  // Log the deployed contract's address
  console.log("AgriTrainingFundTracker deployed to:", agriTrainingFundTracker.target);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });