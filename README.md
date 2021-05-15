## Description

FlashLoaner is a smartcontract to make flashloans with AAVE. This mechanism allows you to make a swap with Uniswap if you only have enough money just to pay the fee. This can be used in an arbitrage bot

* [Core concept](https://aave.com/flash-loans/)
* [Detailed description](https://uniswap.org/docs/v2/core-concepts/flash-swaps/)
* [Arbitrage bot](https://blog.infura.io/build-a-flash-loan-arbitrage-bot-on-infura-part-i)

## Contract

This contract takes addresses of the UniswapRouter during deploy, and provides method startFlashLoan to make falshloans

### Constructor

```solidity
constructor(address addressesProvider, address router) public;
```

You can use your own Router and AddressesProvider or get actual addresses for default networks below:

* Kovan:
  * LendingPoolAddressesProvider: 0x88757f2f99175387ab4c6a4b3067c77a695b0349
  * UniswapV2Router02: 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D
* Mainnet:
  * LendingPoolAddressesProvider: 0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5
  * UniswapV2Router02: 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D

[List of deployed AAVE contracts addresses](https://docs.aave.com/developers/deployed-contracts/deployed-contracts)

### startFlashLoan

```solidity
function startFlashLoan(uint amount, address[] memory path) external;
```

This method borrows the first token of `path` from AAVE pool, makes swap with Router, returns loans back and sends balance after deduction to the `msg.sender`.

* `amount` — amount of tokens that will be borrowed.
* `path` — an array of token addresses between which the swap will be performed in turn. First and last addresses **must** be the same to make a looped swap. Contract saves it to a private attribute `_path` to read it in the method `uniswapV2Call` that will be called next.
You can pass it using `params` argument instead of an attribute, if you need it. `params` is a `bytes` type therefore if you want to pass addresses as an argument you need a library to convert list of addresses to bytes and vice versa. You can read about this [here](https://ethereum.stackexchange.com/a/90801).

### Dependencies

Install dependencies of the package.json:

```bash
npm i -D
```

### Create config

Use _.env_ as a local config to set private options manually:

**Don't commit it to git! (keep it secret)**

```bash
cp .env.template .env
```

You should also register at [Infura](https://infura.io/) and create new project there. 

After that set your Infura Project ID (from project settings) to _.env_

### Scripts

To run any script enter:

```bash
npx hardhat run path/to/script.ts --network network_name
```

#### Generate a wallet

Use the script to generate a new wallet with it's own private key and address:

```bash
npx hardhat run scripts/0_create_new_wallet.ts
```

Copy generated private key (or your own private key) to _.env_ config on the corresponding line.

Add some ETH to address of this wallet. For tests you can use any _faucet_ for your network. For example [faucet.kovan.network](https://faucet.kovan.network)

Also you should get DAI in kovan, because AAVE allows to borrow only tokens that were added to its list. Use the [AAVE Faucet](https://testnet.aave.com/faucet) to get DAI (0xff795577d9ac8bd7d90ee22b6c1703490b6512fd)

#### Deploy the FlashLoaner contract

A script to deploy the FlashLoaner contract and to get it's address:

```bash
npx hardhat run scripts/1_deploy_flashloaner.ts --network kovan
```

### Run local tests

Hardhat allows you to execute tests in it's own network, but due to the fact that you need to interact with Uniswap, you need to make a fork of a network where the Uniswap is. For example - Kovan.

You can use [AlchemyAPI](https://www.alchemy.com/), then you will can specify the block from which the fork will be made. **If you're going specify block, specify block after you get DAI tokens in kovan network!**. To use AlchemyAPI, create an app in its dashboard and set it's URL to _.env_. If the AlchemyAPI URL not setted Infura API will be used.

**Important: Infura API takes a last block during run test. This can lead to different results for the same tests**

```bash
npx hardhat test test/FlashLoaner.ts
```

### Run tests in a testnet

```bash
npx hardhat test test/FlashLoaner.ts --network kovan
```
