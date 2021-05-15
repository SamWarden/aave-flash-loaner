import { ethers, network } from "hardhat";
import { Contract, ContractFactory } from "ethers";

/*

This script deploys FlashLoaner on mainnet or testnet
If you want to use this FlashLoaner - deploy it via: npx hardhat run scripts/1_deploy_flashloaner.ts --network YOUR NETWORK NAME HERE

*/

// It is constants for default networks
const AAVE_ADDRESSES_PROVIDER: string = network.name == "mainnet" ? "0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5" : "0x88757f2f99175387ab4c6a4b3067c77a695b0349";
const UNISWAP_ROUTER: string = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

async function main(): Promise<void> {
  const FlashLoaner: ContractFactory = await ethers.getContractFactory("FlashLoaner");
  const flashLoaner: Contract = await FlashLoaner.deploy(AAVE_ADDRESSES_PROVIDER, UNISWAP_ROUTER);
  await flashLoaner.deployed();
  console.log("FlashLoaner deployed successfully. Address:", flashLoaner.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
