export const NFT_FACTORY_ADDRESS = "0xC347874E321Fe535D2b49aeDeE45e5C17e3050C9";
export const NFT_FACTORY_ABI = [
    "event NFTContractDeployed(address indexed,address indexed)",
    "function deployNFT(string,string)",
    "function getNFTDetails(address) view returns (string,string)",
    "function getUserNFTContracts(address) view returns (address[])",
    "function userNFTContracts(address,uint256) view returns (address)"
];
