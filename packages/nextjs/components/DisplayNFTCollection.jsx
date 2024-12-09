"use client";

import React, { useEffect, useState } from "react";
import { ethers } from "ethers";

const NFT_COLLECTION_ABI = [
  "function mintNFT(address recipient, string tokenURI) public",
  "function tokenCounter() view public returns (uint256)",
  "function tokenURI(uint256 tokenId) view public returns (string)",
  "function ownerOf(uint256 tokenId) view public returns (address)",
  "function getListing(uint256 tokenId) public view returns (address seller, uint256 price)",
  "function listNFT(uint256 tokenId, uint256 price) public",
  "function buyNFT(uint256 tokenId) public payable",
];

const DisplayNFTCollection = () => {
  const [showCollectionAddress, setShowCollectionAddress] = useState("");
  const [allNfts, setAllNfts] = useState([]);
  const [userNfts, setUserNfts] = useState([]);
  const [error, setError] = useState("");
  // 移除未使用的 loading 状态
  // const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState("");
  const [priceInputs, setPriceInputs] = useState({});

  const [dialogOpen, setDialogOpen] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);

  const [listDialogOpen, setListDialogOpen] = useState(false);
  const [currentTokenForSale, setCurrentTokenForSale] = useState(null);

  useEffect(() => {
    const handleAccountsChanged = async accounts => {
      if (accounts.length === 0) {
        setError("Please connect to MetaMask.");
        setCurrentUser("");
        setAllNfts([]);
        setUserNfts([]);
      } else {
        // 移除未使用的 provider 和 signer 变量
        // const provider = new ethers.BrowserProvider(window.ethereum);
        // const signer = await provider.getSigner();
        const userAddress = accounts[0];
        setCurrentUser(userAddress);
        setAllNfts([]);
        setUserNfts([]);
      }
    };

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      }
    };
  }, []);

  const fetchNFTs = async () => {
    if (!showCollectionAddress) {
      setError("Please enter a collection address to display NFTs.");
      return;
    }

    setError("");
    // 不再使用 loading 状态
    // setLoading(true);

    try {
      if (!window.ethereum) {
        throw new Error("MetaMask is not installed. Please install MetaMask.");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const nftCollection = new ethers.Contract(showCollectionAddress, NFT_COLLECTION_ABI, signer);

      const userAddress = await signer.getAddress();
      setCurrentUser(userAddress);

      const totalNFTs = await nftCollection.tokenCounter();

      const allNftData = [];
      const userNftData = [];
      for (let tokenId = 0; tokenId < totalNFTs; tokenId++) {
        try {
          const tokenURI = await nftCollection.tokenURI(tokenId);
          const owner = await nftCollection.ownerOf(tokenId);

          let price = null;
          let seller = null;

          try {
            const listing = await nftCollection.getListing(tokenId);
            if (listing.price > 0) {
              seller = listing.seller;
              price = ethers.formatEther(listing.price);
            }
          } catch (err) {
            // 未上架则忽略
            console.error(err); // 确保使用了 err
          }

          const response = await fetch(tokenURI.replace("ipfs://", "https://ipfs.io/ipfs/"));
          const metadata = await response.json();

          const nft = {
            tokenId,
            owner,
            name: metadata.name,
            color: metadata.color,
            description: metadata.description,
            imageUrl: metadata.image.replace("ipfs://", "https://ipfs.io/ipfs/"),
            price,
            seller,
          };

          allNftData.push(nft);

          if (owner === userAddress) {
            userNftData.push(nft);
          }
        } catch (err) {
          console.error(`Error fetching data for Token ID ${tokenId}:`, err.message); // 使用了 err
        }
      }

      setAllNfts(allNftData);
      setUserNfts(userNftData);

      setDialogOpen(false);
      setContentVisible(true);
    } catch (err) {
      console.error("Error fetching NFTs:", err.message || err); // 使用了 err
      setError("Failed to fetch NFTs.");
    } finally {
      // 不需要操作 loading 状态
      // setLoading(false);
    }
  };

  const handlePriceChange = (tokenId, value) => {
    setPriceInputs(prev => ({
      ...prev,
      [tokenId]: value,
    }));
  };

  const buyNFT = async (tokenId, price) => {
    try {
      if (!window.ethereum) {
        throw new Error("MetaMask is not installed. Please install MetaMask.");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const nftCollection = new ethers.Contract(showCollectionAddress, NFT_COLLECTION_ABI, signer);

      const tx = await nftCollection.buyNFT(tokenId, { value: ethers.parseEther(price) });
      console.log("Transaction sent:", tx.hash);

      await tx.wait();
      console.log("Transaction confirmed.");
      alert("NFT purchased successfully!");

      await fetchNFTs();
    } catch (err) {
      console.error("Error purchasing NFT:", err.message || err); // 使用了 err
      alert("Failed to purchase NFT.");
    }
  };

  const listNFT = async tokenId => {
    const price = priceInputs[tokenId];
    if (!price || isNaN(price) || parseFloat(price) <= 0) {
      alert("Please enter a valid price.");
      return;
    }

    try {
      if (!window.ethereum) {
        throw new Error("MetaMask is not installed. Please install MetaMask.");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const nftCollection = new ethers.Contract(showCollectionAddress, NFT_COLLECTION_ABI, signer);

      const priceInWei = ethers.parseEther(price);
      const tx = await nftCollection.listNFT(tokenId, priceInWei);
      console.log("Listing transaction sent:", tx.hash);

      await tx.wait();
      console.log("Listing transaction confirmed.");
      alert("NFT listed successfully!");

      await fetchNFTs();
    } catch (err) {
      console.error("Error listing NFT:", err.message || err); // 使用了 err
      alert("Failed to list NFT.");
    }
  };

  const handleShowCollectionsClick = () => {
    if (contentVisible) {
      setContentVisible(false);
    } else {
      setShowCollectionAddress("");
      setDialogOpen(true);
    }
  };

  const handleListForSaleClick = tokenId => {
    setCurrentTokenForSale(tokenId);
    handlePriceChange(tokenId, priceInputs[tokenId] || "");
    setListDialogOpen(true);
  };

  const handleListDialogCancel = () => {
    if (currentTokenForSale !== null) {
      handlePriceChange(currentTokenForSale, "");
    }
    setListDialogOpen(false);
    setCurrentTokenForSale(null);
  };

  const handleListDialogSale = () => {
    if (currentTokenForSale !== null) {
      listNFT(currentTokenForSale);
    }
    setListDialogOpen(false);
    setCurrentTokenForSale(null);
  };

  return (
    <div style={{ padding: "20px", textAlign: "left" }}>
      {/* 标题与按钮水平排列 */}
      <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "10px" }}>
        <h2 style={{ fontSize: "28px", color: "#333", margin: "0" }}>Show NFT Collection</h2>
        <button
          onClick={handleShowCollectionsClick}
          style={{
            padding: "8px 16px",
            fontSize: "14px",
            color: "white",
            backgroundColor: "#007bff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          {contentVisible ? "Hide Collections" : "Show Collections"}
        </button>
      </div>

      {dialogOpen && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "white",
            padding: "20px",
            width: "400px",
            boxShadow: "0 8px 16px rgba(0, 0, 0, 0.3)",
            borderRadius: "8px",
          }}
        >
          <h3 style={{ marginBottom: "15px", fontSize: "18px" }}>Enter Collection Address</h3>
          <input
            type="text"
            placeholder="Collection Address"
            value={showCollectionAddress}
            onChange={e => setShowCollectionAddress(e.target.value)}
            style={{
              width: "100%",
              padding: "8px",
              marginBottom: "10px",
              fontSize: "14px",
              border: "1px solid #ddd",
              borderRadius: "5px",
            }}
          />
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <button
              onClick={() => {
                setDialogOpen(false);
                setShowCollectionAddress("");
              }}
              style={{
                padding: "8px 16px",
                fontSize: "14px",
                color: "white",
                backgroundColor: "#dc3545",
                border: "none",
                borderRadius: "5px",
              }}
            >
              Cancel
            </button>
            <button
              onClick={fetchNFTs}
              style={{
                padding: "8px 16px",
                fontSize: "14px",
                color: "white",
                backgroundColor: "#28a745",
                border: "none",
                borderRadius: "5px",
              }}
            >
              Show
            </button>
          </div>
        </div>
      )}

      {listDialogOpen && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "white",
            padding: "20px",
            width: "300px",
            boxShadow: "0 8px 16px rgba(0,0,0,0.3)",
            borderRadius: "8px",
          }}
        >
          <h3 style={{ marginBottom: "15px", fontSize: "18px" }}>Set Price in ETH</h3>
          <input
            type="text"
            placeholder="Price in ETH"
            value={currentTokenForSale !== null ? priceInputs[currentTokenForSale] || "" : ""}
            onChange={e => {
              if (currentTokenForSale !== null) {
                handlePriceChange(currentTokenForSale, e.target.value);
              }
            }}
            style={{
              width: "100%",
              padding: "8px",
              marginBottom: "10px",
              fontSize: "14px",
              border: "1px solid #ddd",
              borderRadius: "5px",
            }}
          />
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <button
              onClick={handleListDialogCancel}
              style={{
                padding: "8px 16px",
                fontSize: "14px",
                color: "white",
                backgroundColor: "#dc3545",
                border: "none",
                borderRadius: "5px",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleListDialogSale}
              style={{
                padding: "8px 16px",
                fontSize: "14px",
                color: "white",
                backgroundColor: "#28a745",
                border: "none",
                borderRadius: "5px",
              }}
            >
              Sale
            </button>
          </div>
        </div>
      )}

      {error && <p style={{ color: "red" }}>{error}</p>}

      {contentVisible && (
        <div>
          <h3 style={{ color: "orange", fontSize: "22px" }}>All NFTs in Collection:</h3>
          {allNfts.length > 0 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "20px",
                marginTop: "20px",
              }}
            >
              {allNfts.map(nft => (
                <div
                  key={nft.tokenId}
                  style={{
                    backgroundColor: "white",
                    padding: "15px",
                    border: "1px solid black",
                    borderRadius: "8px",
                    textAlign: "left",
                  }}
                >
                  <p>Token ID: {nft.tokenId}</p>
                  <p>Owner: {nft.owner}</p>
                  <p>Name: {nft.name}</p>
                  <p>Color: {nft.color}</p>
                  <p>Description: {nft.description}</p>
                  <img
                    src={nft.imageUrl}
                    alt={`NFT ${nft.tokenId}`}
                    style={{ width: "100px", height: "100px", objectFit: "cover" }}
                  />
                  {nft.price && <p style={{ color: "red", fontWeight: "bold" }}>Price: {nft.price} ETH</p>}
                  {nft.price && nft.seller !== currentUser && (
                    <button
                      onClick={() => buyNFT(nft.tokenId, nft.price)}
                      style={{
                        backgroundColor: "red",
                        color: "white",
                        border: "none",
                        padding: "5px 10px",
                        borderRadius: "4px",
                        cursor: "pointer",
                        marginTop: "5px",
                      }}
                    >
                      Buy
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p>No NFTs found in this collection.</p>
          )}

          <h3 style={{ color: "orange", fontSize: "22px", marginTop: "30px" }}>Your NFTs:</h3>
          {userNfts.length > 0 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "20px",
                marginTop: "20px",
              }}
            >
              {userNfts.map(nft => (
                <div
                  key={nft.tokenId}
                  style={{
                    backgroundColor: "white",
                    padding: "15px",
                    border: "1px solid black",
                    borderRadius: "8px",
                    textAlign: "left",
                  }}
                >
                  <p>Token ID: {nft.tokenId}</p>
                  <p>Name: {nft.name}</p>
                  <p>Color: {nft.color}</p>
                  <p>Description: {nft.description}</p>
                  <img
                    src={nft.imageUrl}
                    alt={`NFT ${nft.tokenId}`}
                    style={{ width: "100px", height: "100px", objectFit: "cover" }}
                  />
                  {nft.price ? (
                    <p style={{ color: "red", fontWeight: "bold" }}>Price: {nft.price} ETH</p>
                  ) : (
                    <div style={{ marginTop: "5px" }}>
                      <button
                        onClick={() => handleListForSaleClick(nft.tokenId)}
                        style={{
                          backgroundColor: "#ff9800",
                          color: "white",
                          border: "none",
                          padding: "5px 10px",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        List for Sale
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p>You have no NFTs in this collection.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default DisplayNFTCollection;
