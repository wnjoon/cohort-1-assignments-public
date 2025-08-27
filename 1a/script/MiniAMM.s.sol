// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;

import {Script} from "forge-std/Script.sol";
import {MiniAMM} from "../src/MiniAMM.sol";
import {MockERC20} from "../src/MockERC20.sol";

contract MiniAMMScript is Script {
    MiniAMM public miniAMM;
    MockERC20 public token0;
    MockERC20 public token1;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        // Deploy mock ERC20 tokens
        token0 = new MockERC20("Token A", "TKA");
        token1 = new MockERC20("Token B", "TKB");

        // Deploy MiniAMM with the tokens
        miniAMM = new MiniAMM(address(token0), address(token1));

        vm.stopBroadcast();
    }
}

// --slow is a flag that makes the script run slower (very important!)
// account can be allocated using `cast wallet import {name} --interactive`
// `hm-deployer` keystore was saved successfully. Address: 0xfc5726b3ad9f313d8e7cf0cbf8fd4df9a7c2261a
// forge script script/MiniAMM.s.sol --slow --rpc-url <rpc_url> --account <EOA> --broadcast
// forge script script/MiniAMM.s.sol --slow --rpc-url https://coston2.testnet.flarescan.com/ --account hm-deployer --broadcast --verify