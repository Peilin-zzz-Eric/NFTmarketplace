// hooks/scaffold-eth/useTransactor.tsx
//import { useEffect, useState } from "react";
import React from "react";
import { getPublicClient } from "@wagmi/core";
import { Hash, SendTransactionParameters, TransactionReceipt, WalletClient } from "viem";
import { Config, useWalletClient } from "wagmi";
import { SendTransactionMutate } from "wagmi/query";
import { wagmiConfig } from "~~/services/web3/wagmiConfig";
import { getBlockExplorerTxLink, getParsedError, notification } from "~~/utils/scaffold-eth";
import { TransactorFuncOptions } from "~~/utils/scaffold-eth/contract";

type TransactionFunc = (
  tx: (() => Promise<Hash>) | Parameters<SendTransactionMutate<Config, undefined>>[0],
  options?: TransactorFuncOptions,
) => Promise<Hash | undefined>;

/**
 * 交易通知组件
 * @param message 显示的消息
 * @param blockExplorerLink 区块浏览器链接
 * @returns JSX 元素
 */
const TxnNotification = ({ message, blockExplorerLink }: { message: string; blockExplorerLink?: string }) => {
  return (
    <div className={`flex flex-col ml-1 cursor-default`}>
      <p className="my-0">{message}</p>
      {blockExplorerLink && blockExplorerLink.length > 0 ? (
        <a href={blockExplorerLink} target="_blank" rel="noreferrer" className="block link text-md">
          查看交易
        </a>
      ) : null}
    </div>
  );
};

/**
 * 运行传入的交易函数，并显示 UI 反馈
 * @param _walletClient 可选的钱包客户端。如果未提供，将使用 useWalletClient 提供的
 * @returns 接受交易函数作为回调，显示 UI 反馈并返回交易哈希的函数
 */
export const useTransactor = (_walletClient?: WalletClient): TransactionFunc => {
  let walletClient = _walletClient;
  const { data } = useWalletClient();
  if (walletClient === undefined && data) {
    walletClient = data;
  }

  const result: TransactionFunc = React.useCallback(
    async (tx, options) => {
      if (!walletClient) {
        notification.error("无法访问账户");
        console.error("⚡️ ~ file: useTransactor.tsx ~ error");
        return;
      }

      let notificationId: string | null = null;
      let transactionHash: Hash | undefined = undefined;
      let transactionReceipt: TransactionReceipt | undefined;
      let blockExplorerTxURL = "";
      try {
        const network = await walletClient.getChainId();
        // 从公共客户端获取完整交易
        const publicClient = getPublicClient(wagmiConfig);

        // **修正部分开始**
        // 添加 publicClient 是否为 undefined 的检查
        if (!publicClient) {
          throw new Error("公共客户端不可用。");
        }
        // **修正部分结束**

        notificationId = notification.loading(<TxnNotification message="等待用户确认中" />);
        if (typeof tx === "function") {
          // 如果 Tx 已由调用者准备好
          const result = await tx();
          transactionHash = result;
        } else if (tx != null) {
          transactionHash = await walletClient.sendTransaction(tx as SendTransactionParameters);
        } else {
          throw new Error("传递给 transactor 的交易不正确");
        }
        notification.remove(notificationId);

        blockExplorerTxURL = network ? getBlockExplorerTxLink(network, transactionHash) : "";

        notificationId = notification.loading(
          <TxnNotification message="等待交易完成。" blockExplorerLink={blockExplorerTxURL} />,
        );

        transactionReceipt = await publicClient.waitForTransactionReceipt({
          hash: transactionHash,
          confirmations: options?.blockConfirmations,
        });
        notification.remove(notificationId);

        if (transactionReceipt.status === "reverted") throw new Error("交易被回滚");

        notification.success(<TxnNotification message="交易成功完成！" blockExplorerLink={blockExplorerTxURL} />, {
          icon: "🎉",
        });

        if (options?.onBlockConfirmation) options.onBlockConfirmation(transactionReceipt);
      } catch (error: any) {
        if (notificationId) {
          notification.remove(notificationId);
        }
        console.error("⚡️ ~ file: useTransactor.ts ~ error", error);
        const message = getParsedError(error);

        // 如果回执被回滚，显示带有区块浏览器链接的通知并返回错误
        if (transactionReceipt?.status === "reverted") {
          notification.error(<TxnNotification message={message} blockExplorerLink={blockExplorerTxURL} />);
          throw error;
        }

        notification.error(message);
        throw error;
      }

      return transactionHash;
    },
    [walletClient],
  );

  return result;
};
