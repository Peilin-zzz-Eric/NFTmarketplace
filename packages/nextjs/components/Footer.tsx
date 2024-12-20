"use client";

import React from "react";
// 移除未使用的 Link
// import Link from "next/link";
//import { hardhat } from "viem/chains";
// 移除未使用的 CurrencyDollarIcon 和 MagnifyingGlassIcon
// import { CurrencyDollarIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { HeartIcon } from "@heroicons/react/24/outline";
import { BuidlGuidlLogo } from "~~/components/assets/BuidlGuidlLogo";

// 移除未使用的 SwitchTheme 和 Faucet
// import { SwitchTheme } from "~~/components/SwitchTheme";
// import { Faucet } from "~~/components/scaffold-eth";
// 移除未使用的 useTargetNetwork 和 useGlobalState
// import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
// import { useGlobalState } from "~~/services/store/store";

/**
 * Site footer
 */
export const Footer = () => {
  // 移除未使用的变量
  // const nativeCurrencyPrice = useGlobalState(state => state.nativeCurrency.price);
  // const { targetNetwork } = useTargetNetwork();
  // const isLocalNetwork = targetNetwork.id === hardhat.id;

  return (
    <div className="min-h-0 py-5 px-1 mb-11 lg:mb-0">
      <div className="w-full">
        <ul className="menu menu-horizontal w-full">
          <div className="flex justify-center items-center gap-2 text-sm w-full">
            <div className="text-center">
              <a href="https://github.com/scaffold-eth/se-2" target="_blank" rel="noreferrer" className="link">
                Fork me
              </a>
            </div>
            <span>·</span>
            <div className="flex justify-center items-center gap-2">
              <p className="m-0 text-center">
                Built with <HeartIcon className="inline-block h-4 w-4" /> at
              </p>
              <a
                className="flex justify-center items-center gap-1"
                href="https://buidlguidl.com/"
                target="_blank"
                rel="noreferrer"
              >
                <BuidlGuidlLogo className="w-3 h-5 pb-1" />
                <span className="link">BuidlGuidl</span>
              </a>
            </div>
            <span>·</span>
            <div className="text-center">
              <a href="https://t.me/joinchat/KByvmRe5wkR-8F_zz6AjpA" target="_blank" rel="noreferrer" className="link">
                Support
              </a>
            </div>
          </div>
        </ul>
      </div>
    </div>
  );
};
