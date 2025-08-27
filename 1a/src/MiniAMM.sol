// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;

import {IMiniAMM, IMiniAMMEvents} from "./IMiniAMM.sol";
// import {MockERC20} from "./MockERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Add as many variables or functions as you would like
// for the implementation. The goal is to pass `forge test`.
contract MiniAMM is IMiniAMM, IMiniAMMEvents {
    uint256 public k = 0;
    uint256 public xReserve = 0;
    uint256 public yReserve = 0;

    address public tokenX;
    address public tokenY;

    // implement constructor
    constructor(address _tokenX, address _tokenY) {
        require(_tokenX != _tokenY, "Tokens must be different");
        require(_tokenX != address(0), "tokenX cannot be zero address");
        require(_tokenY != address(0), "tokenY cannot be zero address");

        // token with bigger address is tokenY, otherwise tokenX
        if (_tokenX < _tokenY) {
            tokenX = _tokenX;
            tokenY = _tokenY;
        } else {
            tokenX = _tokenY;
            tokenY = _tokenX;
        }
    }

    // add parameters and implement function.
    // this function will determine the initial 'k'.
    function _addLiquidityFirstTime(uint256 xAmountIn, uint256 yAmountIn) internal {
        IERC20(tokenX).transferFrom(msg.sender, address(this), xAmountIn);
        IERC20(tokenY).transferFrom(msg.sender, address(this), yAmountIn);

        xReserve = xAmountIn;
        yReserve = yAmountIn;
        k = xReserve * yReserve;
    }

    // add parameters and implement function.
    // this function will increase the 'k'
    // because it is transferring liquidity from users to this contract.
    function _addLiquidityNotFirstTime(uint256 xAmountIn, uint256 yAmountIn) internal {
        IERC20(tokenX).transferFrom(msg.sender, address(this), xAmountIn);
        IERC20(tokenY).transferFrom(msg.sender, address(this), yAmountIn);

        xReserve += xAmountIn;
        yReserve += yAmountIn;
        k = xReserve * yReserve;
    }

    // complete the function
    // IMPORTANT!
    // Add liquidity is different from CPAMM
    // We should maintain the ratio of each token in the contract.
    // k will be recalculated with the updated token amounts.
    function addLiquidity(uint256 xAmountIn, uint256 yAmountIn) external {
        require(xAmountIn > 0 && yAmountIn > 0, "Amounts must be greater than 0");
        if (k == 0) {
            // add params
            _addLiquidityFirstTime(xAmountIn, yAmountIn);
        } else {
            // add params
            _addLiquidityNotFirstTime(xAmountIn, yAmountIn);
        }
        emit AddLiquidity(xAmountIn, yAmountIn);
    }

    // complete the function
    function swap(uint256 xAmountIn, uint256 yAmountIn) external {
        require(xReserve > 0 && yReserve > 0, "No liquidity in pool");
        require(xAmountIn > 0 || yAmountIn > 0, "Must swap at least one token");
        if (xAmountIn > 0) {
            require(yAmountIn == 0, "Can only swap one direction at a time");
            require(IERC20(tokenX).balanceOf(address(this)) >= xAmountIn, "Insufficient liquidity");
            uint256 expectedYOut = yReserve - (k / (xReserve + xAmountIn));
            
            // transfer tokens
            require(IERC20(tokenX).allowance(msg.sender, address(this)) >= xAmountIn, "Insufficient allowance");
            require(IERC20(tokenX).balanceOf(msg.sender) >= xAmountIn, "Insufficient allowance");
            require(IERC20(tokenY).balanceOf(address(this)) >= expectedYOut, "Insufficient liquidity");
            
            IERC20(tokenX).transferFrom(msg.sender, address(this), xAmountIn);
            IERC20(tokenY).transfer(msg.sender, expectedYOut);

            xReserve += xAmountIn;
            yReserve -= expectedYOut;
            k = xReserve * yReserve;

            emit Swap(xAmountIn, expectedYOut);
        }

        if (yAmountIn > 0) {
            require(xAmountIn == 0, "Can only swap one direction at a time");
            require(IERC20(tokenY).balanceOf(address(this)) >= yAmountIn, "Insufficient liquidity");
            uint256 expectedXOut = xReserve - (k / (yReserve + yAmountIn));
            
             // transfer tokens
            require(IERC20(tokenY).allowance(msg.sender, address(this)) >= yAmountIn, "Insufficient allowance");
            require(IERC20(tokenY).balanceOf(msg.sender) >= yAmountIn, "Insufficient allowance");
            require(IERC20(tokenX).balanceOf(address(this)) >= expectedXOut, "Insufficient liquidity");
            
            IERC20(tokenY).transferFrom(msg.sender, address(this), yAmountIn);
            IERC20(tokenX).transfer(msg.sender, expectedXOut);

            xReserve -= expectedXOut;
            yReserve += yAmountIn;
            k = xReserve * yReserve;

            emit Swap(expectedXOut, yAmountIn);
        }
    }
}
