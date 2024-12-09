export const NFT_FACTORY_ADDRESS = "0x63B2c9d83adDff9Eff67176dC72DAdDdF275A702";
export const NFT_FACTORY_ABI = [
    "event NFTContractDeployed(address indexed,address indexed)",
    "function deployNFT(string,string)",
    "function getNFTDetails(address) view returns (string,string)",
    "function getUserNFTContracts(address) view returns (address[])",
    "function userNFTContracts(address,uint256) view returns (address)"
];