// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFTFactory {
    // 用户地址到其部署的合约地址的映射
    mapping(address => address[]) public userNFTContracts;

    // 合约部署事件
    event NFTContractDeployed(address indexed owner, address indexed contractAddress);

    // 部署 NFT 合约
    function deployNFT(string memory name, string memory symbol) public {
        // 输入参数验证
        require(bytes(name).length > 0, "Name cannot be empty");
        require(bytes(symbol).length > 0, "Symbol cannot be empty");

        // 部署新的 NFTCollection 合约
        NFTCollection newNFT = new NFTCollection(msg.sender, name, symbol);

        // 将新合约地址记录到映射中
        userNFTContracts[msg.sender].push(address(newNFT));

        // 触发事件
        emit NFTContractDeployed(msg.sender, address(newNFT));
    }

    // 查询用户部署的所有合约
    function getUserNFTContracts(address user) public view returns (address[] memory) {
        return userNFTContracts[user];
    }

    // 查询指定合约的 name 和 symbol
    function getNFTDetails(address contractAddress) public view returns (string memory name, string memory symbol) {
        // 创建一个 NFTCollection 实例
        NFTCollection nft = NFTCollection(contractAddress);

        // 返回合约的 name 和 symbol
        return (nft.name(), nft.symbol());
    }
}

contract NFTCollection is ERC721URIStorage, Ownable {
    uint256 public tokenCounter;

    struct Listing {
        address seller;
        uint256 price;
    }

    // Token ID => Listing 信息
    mapping(uint256 => Listing) public listings;

    // 事件
    event NFTListed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event NFTSold(uint256 indexed tokenId, address indexed buyer, uint256 price);
    event NFTDelisted(uint256 indexed tokenId);

    constructor(address owner, string memory name, string memory symbol) 
        ERC721(name, symbol) 
        Ownable(owner) // 传递 owner 参数到 Ownable 的构造函数
    {
        require(owner != address(0), "Owner address cannot be zero");
        require(bytes(name).length > 0, "Name cannot be empty");
        require(bytes(symbol).length > 0, "Symbol cannot be empty");

        tokenCounter = 0;
    }

    // 铸造 NFT
    function mintNFT(address recipient, string memory tokenURI) public onlyOwner {
        uint256 tokenId = tokenCounter;
        _mint(recipient, tokenId);
        _setTokenURI(tokenId, tokenURI);
        tokenCounter++;
    }

    // 铸造并上架 NFT
    function mintAndListNFT(address recipient, string memory tokenURI, uint256 price) public onlyOwner {
        require(price > 0, "Price must be greater than zero");

        uint256 tokenId = tokenCounter;
        _mint(recipient, tokenId);
        _setTokenURI(tokenId, tokenURI);
        tokenCounter++;

        // 上架逻辑
        listings[tokenId] = Listing(recipient, price);
        emit NFTListed(tokenId, recipient, price);
    }

    // 上架 NFT
    function listNFT(uint256 tokenId, uint256 price) external {
        require(price > 0, "Price must be greater than zero");
        require(ownerOf(tokenId) == msg.sender, "Caller is not the owner");

        listings[tokenId] = Listing(msg.sender, price);

        emit NFTListed(tokenId, msg.sender, price);
    }

    // 购买 NFT
    function buyNFT(uint256 tokenId) external payable {
        Listing memory listing = listings[tokenId];
        require(listing.price > 0, "NFT is not listed for sale");
        require(msg.value >= listing.price, "Insufficient payment");

        // 转账给卖家
        payable(listing.seller).transfer(listing.price);

        // 转移 NFT 所有权
        _transfer(listing.seller, msg.sender, tokenId);

        // 删除上架信息
        delete listings[tokenId];

        emit NFTSold(tokenId, msg.sender, listing.price);
    }

    // 取消上架 NFT
    function delistNFT(uint256 tokenId) external {
        Listing memory listing = listings[tokenId];
        require(listing.seller == msg.sender, "Caller is not the seller");

        delete listings[tokenId];

        emit NFTDelisted(tokenId);
    }

    // 查询某个 Token 的上架信息
    function getListing(uint256 tokenId) external view returns (Listing memory) {
        return listings[tokenId];
    }
}
