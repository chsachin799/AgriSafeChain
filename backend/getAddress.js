const { ethers } = require('ethers');
require('dotenv').config();

const centerWallet = new ethers.Wallet(process.env.CENTER_PRIVATE_KEY);

console.log(`The public address for the CENTER_PRIVATE_KEY is: ${centerWallet.address}`);