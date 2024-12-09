// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import {NFTFactory} from "../src/NFTFactory.sol";

contract DeployNFTFactoryScript is Script {
    NFTFactory public nftFactory;

    function setUp() public {}

    function run() public {
        // 开始广播交易（在执行 forge script 时通过 --private-key 指定私钥）
        vm.startBroadcast();

        // 部署 NFTFactory
        nftFactory = new NFTFactory();
        console.log("NFTFactory deployed at:", address(nftFactory));

        // 停止广播
        vm.stopBroadcast();
    }
}
