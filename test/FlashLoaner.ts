import { ethers, network } from "hardhat";
import { Signer, Contract, ContractFactory, BigNumber } from "ethers";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { AddressZero } from "@ethersproject/constants";
import { getContractFactory } from "../app/utils";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import type { TransactionResponse, TransactionReceipt, Log } from "@ethersproject/abstract-provider";
import type { TransactionReceiptWithEvents } from "../app/types";

chai.use(solidity);
const { expect } = chai;
const { formatEther, parseEther } = ethers.utils;

// These are constants for default networks
const UNISWAP_ROUTER: string = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
const AAVE_ADDRESSES_PROVIDER: string = "0x88757f2f99175387ab4c6a4b3067c77a695b0349"; //kovan
const KOVAN_DAI_ADDRESS: string = "0xff795577d9ac8bd7d90ee22b6c1703490b6512fd";

describe("FlashLoaner", async () => {
  let accounts: SignerWithAddress[];
  let owner: SignerWithAddress;

  // Contract factories
  let TToken: ContractFactory;
  let FlashLoaner: ContractFactory;
  let UniswapRouter: ContractFactory;
  let AddressesProvider: ContractFactory;
  let LendingPool: ContractFactory;
  let LendingPoolConfigurator: ContractFactory;

  // Contracts that will be deployed by contact factories
  let dai: Contract;
  let usdt: Contract;
  let btc: Contract;
  let uniswapFactory: Contract;
  let uniswapRouter: Contract;

  before(async () => {
    accounts = await ethers.getSigners();
    owner = accounts[0];

    // Create contract factories for the owner of the wallet
    FlashLoaner = getContractFactory("FlashLoaner", owner);
    TToken = getContractFactory("TToken", owner);
    UniswapRouter = getContractFactory("IUniswapV2Router02", owner);

    uniswapRouter = UniswapRouter.attach(UNISWAP_ROUTER);
    dai = TToken.attach(KOVAN_DAI_ADDRESS);
  });

  // Before each test-block we deploy contracts using previously created factories
  beforeEach(async () => {
    usdt = await TToken.deploy("USDT", "USDT", 18);
    btc = await TToken.deploy("BTC", "BTC", 18);

    // Wait for all tokens to be deployed
    await usdt.deployed();
    await btc.deployed();

    // Mint some amount of each token to the owner
    await (await usdt.mint(owner.address, parseEther("2500"))).wait();
    await (await btc.mint(owner.address, parseEther("2000"))).wait();

    // Approve the ability of router to remove some liquidity from the wallet of the one calling this method (owner)
    await (await dai.approve(uniswapRouter.address, parseEther("2000"))).wait();
    await (await usdt.approve(uniswapRouter.address, parseEther("2500"))).wait();
    await (await btc.approve(uniswapRouter.address, parseEther("2000"))).wait();
  });

  it("Initializing FlashLoaner", async () => {
    // Deploy fresh contract 
    console.log(AAVE_ADDRESSES_PROVIDER, uniswapRouter.address);
    const flashLoaner: Contract = await FlashLoaner.deploy(AAVE_ADDRESSES_PROVIDER, uniswapRouter.address);
    console.log(await flashLoaner.deployed());

    // Add liquidity to different contracts in different ratios

    await (await uniswapRouter.addLiquidity(dai.address, btc.address, parseEther("1000"), parseEther("1000"), 0, 0, owner.address, Date.now() + 60000)).wait(); // 1/1
    await (await uniswapRouter.addLiquidity(dai.address, usdt.address, parseEther("1000"), parseEther("1500"), 0, 0, owner.address, Date.now() + 60000)).wait(); // 3/2
    await (await uniswapRouter.addLiquidity(btc.address, usdt.address, parseEther("1000"), parseEther("1000"), 0, 0, owner.address, Date.now() + 60000)).wait(); // 1/1

    // Form a path of all addresses
    // NOTE that it MUST be looped (dai -.....- dai)
    const path: string[] = [dai.address, usdt.address, btc.address, dai.address];

    // Run main function
    console.log(parseEther("0.1"), path);
    console.log(await flashLoaner.startFlashLoan(parseEther("100000"), path));
  });
});
