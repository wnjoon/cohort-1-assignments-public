// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {MiniAMMFactory} from "../src/MiniAMMFactory.sol";
import {MiniAMM} from "../src/MiniAMM.sol";
import {MockERC20} from "../src/MockERC20.sol";

contract FactoryScript is Script {
    MiniAMMFactory public miniAMMFactory;
    MockERC20 public token0;
    MockERC20 public token1;
    address public pair;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        // Step 1: Deploy MiniAMMFactory
        miniAMMFactory = new MiniAMMFactory();

        // Step 2: Deploy two MockERC20 tokens
        token0 = new MockERC20("Token A", "TKA");
        token1 = new MockERC20("Token B", "TKB");

        // Step 3: Create a MiniAMM pair using the factory
        pair = miniAMMFactory.createPair(address(token0), address(token1));

        vm.stopBroadcast();
    }
}

// 0xfc5726b3ad9f313d8e7cf0cbf8fd4df9a7c2261a
// forge script script/Factory.s.sol --slow --rpc-url https://coston2-api.flare.network/ext/C/rpc --account hm-deployer --broadcast 
// forge script script/Factory.s.sol --slow --rpc-url https://coston2-api.flare.network/ext/C/rpc --account 0xfc5726b3ad9f313d8e7cf0cbf8fd4df9a7c2261a --broadcast