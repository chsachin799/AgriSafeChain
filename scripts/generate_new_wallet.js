const { ethers } = require('ethers');

// This script will generate a new wallet and log its address and private key.
// You can use these credentials to test the registration forms.
function generateNewWallet() {
  const wallet = ethers.Wallet.createRandom();
  console.log("Address:", wallet.address);
  console.log("Private Key:", wallet.privateKey);
  console.log("-------------------------------------");
}

generateNewWallet();
