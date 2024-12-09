"use client";

import React, { useState } from "react";
import { ethers } from "ethers";
import { NFT_FACTORY_ADDRESS, NFT_FACTORY_ABI } from "../utils/contractConfig";

const DeployNFT = ({ provider }) => {
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const deployNFT = async () => {
    try {
      const signer = await provider.getSigner();
      const factoryContract = new ethers.Contract(NFT_FACTORY_ADDRESS, NFT_FACTORY_ABI, signer);
      const tx = await factoryContract.deployNFT(name, symbol, { gasLimit: 2000000 });
      await tx.wait();
      alert("NFT Contract Deployed Successfully!");
      setDialogOpen(false);
      setName("");
      setSymbol("");
    } catch (error) {
      console.error("Error deploying NFT contract:", error);
      alert("Failed to deploy contract.");
    }
  };

  const handleCancel = () => {
    setDialogOpen(false);
    setName("");
    setSymbol("");
  };

  return (
    <div style={{ padding: "20px", display: "flex", alignItems: "flex-start", gap: "20px" }}>
      <div style={{ flex: "0 0 auto", textAlign: "left" }}>
        <h1 style={{ fontSize: "32px", color: "#333", marginBottom: "10px" }}>NFT Factory</h1>
      </div>

      <div style={{ flex: "1" }}>
        <button
          onClick={() => setDialogOpen(true)}
          style={{
            padding: "8px 20px",
            fontSize: "14px",
            color: "white",
            backgroundColor: "#007bff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            transition: "background-color 0.3s",
            marginBottom: "10px",
          }}
        >
          Deploy Your NFT Contract
        </button>

        {dialogOpen && (
          <div
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              backgroundColor: "white",
              padding: "15px",
              width: "350px",
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3)",
              borderRadius: "5px",
              textAlign: "left",
            }}
          >
            <h3 style={{ marginBottom: "10px", fontSize: "18px" }}>
              Deploy Your NFT Contract
            </h3>
            <input
              type="text"
              placeholder="Name"
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
              placeholder="Symbol"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
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
                onClick={handleCancel}
                style={{
                  padding: "6px 16px",
                  fontSize: "12px",
                  color: "white",
                  backgroundColor: "#dc3545",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                  transition: "background-color 0.3s",
                }}
              >
                Cancel
              </button>
              <button
                onClick={deployNFT}
                style={{
                  padding: "6px 16px",
                  fontSize: "12px",
                  color: "white",
                  backgroundColor: "#28a745",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                  transition: "background-color 0.3s",
                }}
              >
                Deploy
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeployNFT;
