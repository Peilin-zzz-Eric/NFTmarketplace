"use client";

import Link from "next/link";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { BugAntIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Address } from "~~/components/scaffold-eth";
import DeployNFT from "../components/DeployNFT";
import ViewNFTContracts from "../components/ViewNFTContracts";
import { useEffect, useState } from "react";
import NFTManager from "../components/NFTManager";
import UploadAndMintNFT from "../components/UploadAndMintNFT";
import DisplayNFTCollection from "../components/DisplayNFTCollection";
import { ethers } from "ethers";

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      // 仅在客户端初始化 provider
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      setProvider(browserProvider);
    }
  }, []);

  if (!provider) {
    return (
      <div className="flex items-center flex-col flex-grow pt-10">
        <div className="px-5">
          <p>Initializing Ethereum provider...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center flex-col flex-grow pt-10">
        <div className="px-5">
          <div className="flex justify-center items-center space-x-2 flex-col sm:flex-row">
            <p className="my-2 font-medium">Connected Address:</p>
            <Address address={connectedAddress} />
          </div>
          <div>
            <DeployNFT provider={provider} />
            <ViewNFTContracts provider={provider} />
          </div>
          <div>
            <UploadAndMintNFT />
            <DisplayNFTCollection />
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
