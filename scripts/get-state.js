const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  // Paste your current contract address here
  const contractAddress = "0xDE292686C411161f24e2D8EFA1A50a1084eEb746"; 

  // Get both signers to find the center's address
  const signers = await ethers.getSigners();
  const centerSigner = signers[1];
  
  const agriTrainingFundTracker = await hre.ethers.getContractAt(
    "AgriTrainingFundTracker",
    contractAddress
  );

  // CORRECTED: The centerAddress is the address of the centerSigner
  const centerAddress = centerSigner.address;
  
  console.log("Fetching contract state...");

  const centerDetails = await agriTrainingFundTracker.getCenterDetails(centerAddress);
  console.log("Center Details:", centerDetails);

  const usageLogs = await agriTrainingFundTracker.getUsageReports(centerAddress);
  console.log("Usage Logs:", usageLogs);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });