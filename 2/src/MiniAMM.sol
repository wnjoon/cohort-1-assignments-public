// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;

import {IMiniAMM, IMiniAMMEvents} from "./IMiniAMM.sol";
import {MiniAMMLP} from "./MiniAMMLP.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Add as many variables or functions as you would like
// for the implementation. The goal is to pass `forge test`.
contract MiniAMM is IMiniAMM, IMiniAMMEvents, MiniAMMLP {
    uint256 public k = 0;
    uint256 public xReserve = 0;
    uint256 public yReserve = 0;

    address public tokenX;
    address public tokenY;

    // implement constructor
    constructor(address _tokenX, address _tokenY) MiniAMMLP(_tokenX, _tokenY) {
        require(_tokenX != address(0), "tokenX cannot be zero address");
        require(_tokenY != address(0), "tokenY cannot be zero address");
        require(_tokenX != _tokenY, "Tokens must be different");

        (tokenX, tokenY) = _tokenX < _tokenY ? (_tokenX, _tokenY) : (_tokenY, _tokenX);
    }

    // Helper function to calculate square root
    function sqrt(uint256 x) internal pure returns (uint256) {
        if (x == 0) return 0;
        uint256 z = (x + 1) / 2;
        uint256 y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
        return y;
    }

    // add parameters and implement function.
    // this function will determine the 'k'.
    function _addLiquidityFirstTime(uint256 xAmountIn, uint256 yAmountIn) internal returns (uint256 lpMinted) {
        require(xAmountIn > 0 && yAmountIn > 0, "Amounts must be greater than 0");

        IERC20(tokenX).transferFrom(msg.sender, address(this), xAmountIn);
        IERC20(tokenY).transferFrom(msg.sender, address(this), yAmountIn);

        xReserve = xAmountIn;
        yReserve = yAmountIn;
        k = xReserve * yReserve;

        lpMinted = sqrt(xAmountIn * yAmountIn);
        _mintLP(msg.sender, lpMinted);
        return lpMinted;
    }

    // add parameters and implement function.
    // this function will increase the 'k'
    // because it is transferring liquidity from users to this contract.
    function _addLiquidityNotFirstTime(uint256 xAmountIn, uint256 yAmountIn) internal returns (uint256 lpMinted) {
        require(xAmountIn > 0 && yAmountIn > 0, "Amounts must be greater than 0");

        uint256 yAmountRequired = (yReserve * xAmountIn) / xReserve;
        require(yAmountIn >= yAmountRequired, "MiniAMM: INSUFFICIENT_Y_AMOUNT");

        IERC20(tokenX).transferFrom(msg.sender, address(this), xAmountIn);
        IERC20(tokenY).transferFrom(msg.sender, address(this), yAmountIn);

        lpMinted = (totalSupply() * xAmountIn) / xReserve;
        _mintLP(msg.sender, lpMinted);

        xReserve += xAmountIn;
        yReserve += yAmountIn;
        k = xReserve * yReserve;

        return lpMinted;
    }

    // complete the function. Should transfer LP token to the user.
    function addLiquidity(uint256 xAmountIn, uint256 yAmountIn) external returns (uint256 lpMinted) {
        if (xReserve == 0 && yReserve == 0) {
            lpMinted = _addLiquidityFirstTime(xAmountIn, yAmountIn);
        } else {
            lpMinted = _addLiquidityNotFirstTime(xAmountIn, yAmountIn);
        }

        emit AddLiquidity(xAmountIn, yAmountIn);
    }

    // Remove liquidity by burning LP tokens
    function removeLiquidity(uint256 lpAmount) external returns (uint256 xAmount, uint256 yAmount) {
        require(lpAmount > 0, "MiniAMM: INSUFFICIENT_LP_AMOUNT");

        uint256 currentTotalSupply = totalSupply();
        xAmount = (xReserve * lpAmount) / currentTotalSupply;
        yAmount = (yReserve * lpAmount) / currentTotalSupply;

        _burnLP(msg.sender, lpAmount);

        IERC20(tokenX).transfer(msg.sender, xAmount);
        IERC20(tokenY).transfer(msg.sender, yAmount);

        xReserve -= xAmount;
        yReserve -= yAmount;
        k = xReserve * yReserve;

    }

    // complete the function
    function swap(uint256 xAmountIn, uint256 yAmountIn) external {
        require(xAmountIn > 0 || yAmountIn > 0, "Must swap at least one token");
        require(xAmountIn == 0 || yAmountIn == 0, "Can only swap one direction at a time");
        require(k > 0, "No liquidity in pool");
        require(xAmountIn < xReserve && yAmountIn < yReserve, "Insufficient liquidity");

        uint256 xAmountOut = 0;
        uint256 yAmountOut = 0;

        if (xAmountIn > 0) {
            uint256 amountInWithFee = xAmountIn * 997;
            uint256 numerator = amountInWithFee * yReserve;
            uint256 denominator = (xReserve * 1000) + amountInWithFee;
            yAmountOut = numerator / denominator;

            require(yAmountOut < yReserve, "Insufficient liquidity");

            IERC20(tokenX).transferFrom(msg.sender, address(this), xAmountIn);
            IERC20(tokenY).transfer(msg.sender, yAmountOut);

            xReserve += xAmountIn;
            yReserve -= yAmountOut;
        } else {
            uint256 amountInWithFee = yAmountIn * 997;
            uint256 numerator = amountInWithFee * xReserve;
            uint256 denominator = (yReserve * 1000) + amountInWithFee;
            xAmountOut = numerator / denominator;

            require(xAmountOut < xReserve, "Insufficient liquidity");

            IERC20(tokenY).transferFrom(msg.sender, address(this), yAmountIn);
            IERC20(tokenX).transfer(msg.sender, xAmountOut);

            yReserve += yAmountIn;
            xReserve -= xAmountOut;
        }
        k = xReserve * yReserve;

        emit Swap(xAmountIn, yAmountIn, xAmountOut, yAmountOut);
    }
}
