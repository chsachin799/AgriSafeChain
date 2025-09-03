const { ethers } = require("ethers");

// Replace with your private key and contract address
const trainingCenterPrivateKey = "0xc84d471e33ee55ea42c806bbd3075292e4e59f9ed6e7168bd114eb88aa2aa6f2";
const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

// Replace with the trainer's address and name
const trainerAddress = "0x94Cd10EC3B2e458AefBdf5241E8C612Ab621b507";
const trainerName = "John Doe";

async function registerTrainer() {
    // Connect to the Sepolia network
    const provider = new ethers.JsonRpcProvider("https://sepolia.infura.io/v3/8ffddb46425f4d6aa9a619784d5a3ed0");

    // Create a signer from the training center's private key
    const wallet = new ethers.Wallet(trainingCenterPrivateKey, provider);

    // Load your contract using its ABI and address
    const contractABI = [
        "function registerTrainer(address trainerAddress, string calldata name)",
        // Add other functions you want to call
    ];
    const contract = new ethers.Contract(contractAddress, contractABI, wallet);

    try {
        console.log("Registering trainer...");
        const tx = await contract.registerTrainer(trainerAddress, trainerName);
        await tx.wait();
        console.log("Trainer registered with transaction hash:", tx.hash);
    } catch (error) {
        console.error("Failed to register trainer:", error);
    }
}

registerTrainer();