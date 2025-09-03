const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  // --- IMPORTANT: Paste your correct contract address here ---
  const contractAddress = "0xDE292686C411161f24e2D8EFA1A50a1084eEb746";
  
  // Get the governor and center signers
  const signers = await ethers.getSigners();
  const governor = signers[0];
  const centerSigner = signers[1];

  const agriTrainingFundTracker = await hre.ethers.getContractAt(
    "AgriTrainingFundTracker",
    contractAddress,
    governor // The governor is the one making the call
  );

  // This is the address of the center you want to allocate funds to
  const centerAddress = centerSigner.address;
  const amountToAdd = 1000;

  console.log(`Allocating ${amountToAdd} more funds to center ${centerAddress}...`);
  
  const txAllocate = await agriTrainingFundTracker.connect(governor).allocateFunds(centerAddress, amountToAdd);
  await txAllocate.wait();
  
  console.log("Funds allocated successfully!");

  // Optional: Read the new state to verify the change
  const centerDetails = await agriTrainingFundTracker.getCenterDetails(centerAddress);
  console.log("New Center Details:", centerDetails);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });