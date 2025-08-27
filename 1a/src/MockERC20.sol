// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IMockERC20} from "./IMockERC20.sol";

// Add as many variables or functions as you would like
// for the implementation. The goal is to pass `forge test`.
contract MockERC20 is ERC20, IMockERC20 {
    // since ERC20 is already a contract, we can use it as a base contract
    // name, symbol, decimals are already defined in ERC20
    constructor(string memory name_, string memory symbol_) ERC20(name_, symbol_) {}

    // Implement
    // use ERC20 _mint function directly
    function freeMintTo(uint256 amount, address to) external {
        require(msg.sender != address(0), "sender cannot be zero address");
        _mint(to, amount);
    }

    // Implement
    // use ERC20 _mint function directly
    function freeMintToSender(uint256 amount) external {
        // msg.sender is the address of the caller
        require(msg.sender != address(0), "sender cannot be zero address");
        _mint(msg.sender, amount);
    }
}
