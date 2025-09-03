require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();

module.exports = {
  solidity: "0.8.28",
  networks: {
    sepolia: {
      url: `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: [
        `0x${process.env.GOVERNMENT_PRIVATE_KEY}`,
        `0x${process.env.CENTER_PRIVATE_KEY}`
      ]
    }
  }
};