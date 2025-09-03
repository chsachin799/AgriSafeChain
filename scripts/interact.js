const hre = require("hardhat");

async function main() {
  try {
    // --- Step 1: Replace this with the address of your new contract after you deploy it. ---
    const contractAddress = "0xEC9f10Fa640D6239Acd929860386495723DeE2Df"; 
    
    // Get both signers
    const signers = await hre.ethers.getSigners();
    const governor = signers[0];
    const centerSigner = signers[1];

    const agriTrainingFundTracker = await hre.ethers.getContractAt(
      "AgriTrainingFundTracker",
      contractAddress,
      governor
    );

    // CORRECTED: The center's address is the address of the centerSigner
    const centerAddress = centerSigner.address;
    const trainerAddress = "0x8888888888888888888888888888888888888888";
    const farmerAddress = "0x7777777777777777777777777777777777777777";

    // 1. Government registers the center
    console.log("1. Government registers the center...");
    // The government registers the 'centerSigner's address' as a new center
    const txRegister = await agriTrainingFundTracker.connect(governor).registerCenter(centerAddress, "My Test Center");
    await txRegister.wait();
    console.log("Center registered successfully!");

    // 2. Government allocates funds to the center
    console.log("2. Government allocates funds...");
    const txAllocate = await agriTrainingFundTracker.connect(governor).allocateFunds(centerAddress, 2000);
    await txAllocate.wait();
    console.log("Funds allocated successfully!");

    // 3. The center reports usage
    console.log("3. Center reports usage...");
    const usageAmount = 500;
    const usagePurpose = "Purchasing seeds and equipment";
    // The center's account (centerSigner) calls the function for itself
    const txReport = await agriTrainingFundTracker.connect(centerSigner).reportUsage(usageAmount, usagePurpose);
    await txReport.wait();
    console.log("Usage reported successfully!");

    // 4. The center registers a trainer
    console.log("4. Center registers a trainer...");
    // The center's account (centerSigner) calls the function for itself
    const txTrainer = await agriTrainingFundTracker.connect(centerSigner).registerTrainer(trainerAddress, "Jane Doe");
    await txTrainer.wait();
    console.log("Trainer registered successfully!");

    // 5. The center registers a farmer
    console.log("5. Center registers a farmer...");
    // The center's account (centerSigner) calls the function for itself
    const txFarmer = await agriTrainingFundTracker.connect(centerSigner).registerFarmer(farmerAddress, "John Smith");
    await txFarmer.wait();
    console.log("Farmer registered successfully!");
    
    // View final state
    console.log("\n--- Final State ---");
    const centerDetails = await agriTrainingFundTracker.getCenterDetails(centerAddress);
    console.log("Final Center Details:", centerDetails);
    
    const usageLogs = await agriTrainingFundTracker.getUsageReports(centerAddress);
    console.log("Usage Logs:", usageLogs);
    
  } catch (error) {
    console.error("An error occurred during script execution:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("An unhandled error occurred:", error);
    process.exit(1);
  });