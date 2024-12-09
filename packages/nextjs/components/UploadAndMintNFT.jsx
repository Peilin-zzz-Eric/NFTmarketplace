"use client";

import React, { useState } from "react";
import { uploadToPinata } from "../utils/pinata";
import { ethers } from "ethers";

const NFT_COLLECTION_ABI = [
  "function mintAndListNFT(address recipient, string tokenURI, uint256 price) public",
  "function mintNFT(address recipient, string tokenURI) public",
  "function tokenCounter() view public returns (uint256)",
];

const UploadAndMintNFT = () => {
  const [contractAddress, setContractAddress] = useState("");
  const [file, setFile] = useState(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState("");
  const [description, setDescription] = useState("");
  const [recipient, setRecipient] = useState("");
  const [listOnMarketplace, setListOnMarketplace] = useState(false);
  const [price, setPrice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const resetFields = () => {
    setContractAddress("");
    setFile(null);
    setName("");
    setColor("");
    setDescription("");
    setRecipient("");
    setListOnMarketplace(false);
    setPrice("");
    setError("");
  };

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const uploadMetadataAndMint = async () => {
    if (!file || !contractAddress || !recipient || !name || !color || !description) {
      setError("Please fill in all fields before minting.");
      return;
    }

    if (listOnMarketplace && (!price || isNaN(price) || parseFloat(price) <= 0)) {
      setError("Please specify a valid price (e.g., 0.1).");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const imageUri = await uploadToPinata(file);
      const metadata = {
        name,
        color,
        description,
        image: imageUri,
      };
      const metadataBlob = new Blob([JSON.stringify(metadata)], { type: "application/json" });
      const metadataFile = new File([metadataBlob], "metadata.json");
      const metadataUri = await uploadToPinata(metadataFile);

      if (!window.ethereum) {
        throw new Error("MetaMask is not installed.");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const nftCollection = new ethers.Contract(contractAddress, NFT_COLLECTION_ABI, signer);

      if (listOnMarketplace) {
        const priceInWei = ethers.parseEther(price);
        const mintAndListTx = await nftCollection.mintAndListNFT(recipient, metadataUri, priceInWei);
        await mintAndListTx.wait();
        alert("NFT Minted and Listed Successfully!");
      } else {
        const mintTx = await nftCollection.mintNFT(recipient, metadataUri);
        await mintTx.wait();
        alert("NFT Minted Successfully!");
      }

      // Automatically close the dialog upon successful minting
      setDialogOpen(false);
      resetFields();
    } catch (err) {
      console.error("Error minting NFT:", err.message || err);
      setError(err.message || "Failed to mint NFT.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", textAlign: "left" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "10px" }}>
        <h2 style={{ fontSize: "28px", color: "#333", margin: "0" }}>Create NFT</h2>
        <button
          onClick={() => {
            resetFields(); 
            setDialogOpen(true);
          }}
          style={{
            padding: "8px 16px",
            fontSize: "14px",
            color: "white",
            backgroundColor: "#007bff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            transition: "background-color 0.3s",
          }}
        >
          Create NFT
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
            textAlign: "left",
          }}
        >
          <h3 style={{ marginBottom: "15px", fontSize: "18px" }}>Upload & Mint NFT</h3>

          <input
            type="text"
            placeholder="Enter Collection Address"
            value={contractAddress}
            onChange={(e) => setContractAddress(e.target.value)}
            style={{
              width: "100%",
              padding: "8px",
              marginBottom: "8px",
              fontSize: "14px",
              border: "1px solid #ddd",
              borderRadius: "5px",
            }}
          />
          <input type="file" onChange={handleFileChange} style={{ marginBottom: "8px" }} />
          <input
            type="text"
            placeholder="NFT Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              width: "100%",
              padding: "8px",
              marginBottom: "8px",
              fontSize: "14px",
              border: "1px solid #ddd",
              borderRadius: "5px",
            }}
          />
          <input
            type="text"
            placeholder="NFT Color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            style={{
              width: "100%",
              padding: "8px",
              marginBottom: "8px",
              fontSize: "14px",
              border: "1px solid #ddd",
              borderRadius: "5px",
            }}
          />
          <input
            type="text"
            placeholder="NFT Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{
              width: "100%",
              padding: "8px",
              marginBottom: "8px",
              fontSize: "14px",
              border: "1px solid #ddd",
              borderRadius: "5px",
            }}
          />
          <input
            type="text"
            placeholder="Recipient Address"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            style={{
              width: "100%",
              padding: "8px",
              marginBottom: "8px",
              fontSize: "14px",
              border: "1px solid #ddd",
              borderRadius: "5px",
            }}
          />

          <label style={{ display: "block", marginBottom: "8px" }}>
            <input
              type="checkbox"
              checked={listOnMarketplace}
              onChange={(e) => setListOnMarketplace(e.target.checked)}
              style={{ marginRight: "5px" }}
            />
            List on Marketplace
          </label>

          {listOnMarketplace && (
            <input
              type="text"
              placeholder="Price in ETH (e.g., 0.1)"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                marginBottom: "8px",
                fontSize: "14px",
                border: "1px solid #ddd",
                borderRadius: "5px",
              }}
            />
          )}

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px" }}>
            <button
              onClick={() => setDialogOpen(false)}
              style={{
                padding: "6px 16px",
                fontSize: "12px",
                color: "white",
                backgroundColor: "#dc3545",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={uploadMetadataAndMint}
              disabled={loading}
              style={{
                padding: "6px 16px",
                fontSize: "12px",
                color: "white",
                backgroundColor: loading ? "#6c757d" : "#28a745",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Minting..." : "Mint"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadAndMintNFT;
