// hooks/scaffold-eth/useDeployedContractInfo.ts
import { useEffect, useState } from "react";
import { useTargetNetwork } from "./useTargetNetwork";
import { useIsMounted } from "usehooks-ts";
import { usePublicClient } from "wagmi";
import { Contract, ContractCodeStatus, ContractName, contracts } from "~~/utils/scaffold-eth/contract";

//import { Address } from "viem";

/**
 * 获取部署的合约信息
 * 根据 scaffold.config.ts 中配置的 targetNetworks，获取对应链上的合约信息
 * @param contractName 合约名称
 * @returns 合约数据和加载状态
 */
export const useDeployedContractInfo = <TContractName extends ContractName>(contractName: TContractName) => {
  const isMounted = useIsMounted();
  const { targetNetwork } = useTargetNetwork();

  // 将 targetNetwork.id 转换为 number 类型
  const chainId = Number(targetNetwork.id);

  // **修正部分开始**
  // 将 contractName 强制转换为 string 类型
  const deployedContract = contracts?.[chainId]?.[contractName as string] as Contract<TContractName>;
  // **修正部分结束**

  const [status, setStatus] = useState<ContractCodeStatus>(ContractCodeStatus.LOADING);
  const publicClient = usePublicClient({ chainId });

  useEffect(() => {
    const checkContractDeployment = async () => {
      try {
        if (!isMounted() || !publicClient) return;

        if (!deployedContract) {
          setStatus(ContractCodeStatus.NOT_FOUND);
          return;
        }

        const code = await publicClient.getBytecode({
          address: deployedContract.address,
        });

        // 如果合约代码是 `0x`，表示该地址上没有部署合约
        if (code === "0x") {
          setStatus(ContractCodeStatus.NOT_FOUND);
          return;
        }
        setStatus(ContractCodeStatus.DEPLOYED);
      } catch (e) {
        console.error(e);
        setStatus(ContractCodeStatus.NOT_FOUND);
      }
    };

    checkContractDeployment();
  }, [isMounted, contractName, deployedContract, publicClient]);

  return {
    data: status === ContractCodeStatus.DEPLOYED ? deployedContract : undefined,
    isLoading: status === ContractCodeStatus.LOADING,
  };
};
