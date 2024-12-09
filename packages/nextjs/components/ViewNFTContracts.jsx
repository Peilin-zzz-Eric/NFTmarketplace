"use client";

import React, { useState } from "react";
import { NFT_FACTORY_ABI, NFT_FACTORY_ADDRESS } from "../utils/contractConfig";
import { ethers } from "ethers";

const ViewNFTContracts = ({ provider }) => {
  const [contractDetails, setContractDetails] = useState([]);
  const [showContracts, setShowContracts] = useState(false);

  const fetchUserContracts = async () => {
    if (showContracts) {
      setContractDetails([]);
      setShowContracts(false);
      return;
    }

    try {
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      const factoryContract = new ethers.Contract(NFT_FACTORY_ADDRESS, NFT_FACTORY_ABI, signer);

      const contracts = await factoryContract.getUserNFTContracts(userAddress);

      if (contracts && contracts.length > 0) {
        const details = await Promise.all(
          contracts.map(async contractAddress => {
            try {
              const [name, symbol] = await factoryContract.getNFTDetails(contractAddress);
              return { address: contractAddress, name, symbol };
            } catch (err) {
              console.error(`Error fetching details for ${contractAddress}:`, err);
              return { address: contractAddress, name: "Unknown", symbol: "Unknown" };
            }
          }),
        );
        setContractDetails(details);
      } else {
        setContractDetails([]);
      }
      setShowContracts(true);
    } catch (error) {
      console.error("Error fetching user contracts:", error);
    }
  };

  return (
    <div style={{ padding: "20px", textAlign: "left" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
        <h2 style={{ fontSize: "28px", color: "#333", margin: "0" }}>Your Deployed NFT Contracts</h2>
        <button
          onClick={fetchUserContracts}
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
          {showContracts ? "Hide My Contracts" : "View My Contracts"}
        </button>
      </div>

      {showContracts && contractDetails.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "10px",
          }}
        >
          {contractDetails.map((contract, index) => (
            <div
              key={index}
              style={{
                backgroundColor: "white",
                padding: "10px",
                borderRadius: "5px",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                textAlign: "left",
              }}
            >
              <h3 style={{ fontSize: "16px", color: "#333", marginBottom: "5px" }}>NFT Contract</h3>
              <p>
                <strong>Address:</strong> {contract.address}
              </p>
              <p>
                <strong>Name:</strong> {contract.name}
              </p>
              <p>
                <strong>Symbol:</strong> {contract.symbol}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ViewNFTContracts;
