// SPDX-License-Identifier: MIT

pragma solidity ^0.6.6;

import "./FlashLoanReceiverBase.sol";
import "./interfaces/IUniswapV2Router02.sol";
import "./interfaces/IERC20.sol";
import "./libraries/UniswapV2Library.sol";

contract FlashLoaner is FlashLoanReceiverBase {
    IUniswapV2Router02 private immutable _router;
    address private immutable _factory;
    address[] private _path;

    constructor(address addressesProvider, address router) FlashLoanReceiverBase(addressesProvider) public {
        _router = IUniswapV2Router02(router);
        _factory = IUniswapV2Router02(router).factory();
    }

    function startFlashLoan(uint amount, address[] calldata path) external {
        require(path.length >= 3, "FlashLoaner: Length of this path has to be at least 3");
        require(path[0] == path[path.length - 1], "FlashLoaner: First and last tokens must be the same token");

        (uint reserveIn1, uint reserveOut1) = UniswapV2Library.getReserves(_factory, path[0], path[1]);
        (uint reserveIn2, uint reserveOut2) = UniswapV2Library.getReserves(_factory, path[1], path[2]);
        uint swapProfit1 = UniswapV2Library.getAmountOut(amount, reserveIn1, reserveOut1);
        uint swapProfit2 = UniswapV2Library.getAmountOut(amount, reserveIn2, reserveOut2);

        require(
            // swapProfit1.mul(swapProfit2).mul(997).mul(997) > amount.mul(swapProfit1).mul(1000).mul(1000) ||
            swapProfit1.mul(swapProfit2).mul(1000).mul(1000) < amount.mul(swapProfit1).mul(997).mul(997),
            "FlashLoaner: Flash loan is not possible"
        );

        // Save the path to use it in executeOperation
        _path = path;

        // 0 = no debt, 1 = stable, 2 = variable
        uint[] memory modes = new uint[](1);
        modes[0] = 0;

        address[] memory assets = new address[](1);
        assets[0] = path[0];

        uint[] memory amounts = new uint[](1);
        amounts[0] = amount;

        LENDING_POOL.flashLoan(
            address(this),
            assets,
            amounts,
            modes,
            address(this),
            bytes(""), // Empty params
            0 // Referral code doesn't matter
        );

        // Send all profit to this sender
        IERC20(path[0]).transfer(msg.sender, IERC20(path[0]).balanceOf(address(this)));
    }

    function executeOperation(
        address[] calldata assets,
        uint[] calldata amounts,
        uint[] calldata premiums,
        address initiator,
        bytes calldata params
    )
        external override
        returns (bool)
    {
        require(amounts[0] <= IERC20(assets[0]).balanceOf(address(this)), "FlashLoaner: Invalid balance");

        IERC20(assets[0]).approve(address(_router), amounts[0]);
        _router.swapExactTokensForTokens(
            amounts[0],
            amounts[0], // Amount that will return back has to be greater than start amount
            _path,
            address(this),
            now + 10 minutes
        );

        // Approve the LendingPool contract allowance to *pull* the owed amount
        uint amountOwing = amounts[0].add(premiums[0]);
        IERC20(assets[0]).approve(address(LENDING_POOL), amountOwing);

        return true;
    }
}
