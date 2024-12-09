// utils/scaffold-eth/contract.ts
import { MutateOptions } from "@tanstack/react-query";
import {
  Abi,
  AbiParameter,
  AbiParameterToPrimitiveType,
  AbiParametersToPrimitiveTypes,
  ExtractAbiEvent,
  ExtractAbiEventNames,
  ExtractAbiFunction,
} from "abitype";
import type { ExtractAbiFunctionNames } from "abitype";
import type { Simplify } from "type-fest";
import type { MergeDeepRecord } from "type-fest/source/merge-deep";
import {
  Address,
  Block,
  GetEventArgs,
  GetTransactionReceiptReturnType,
  GetTransactionReturnType,
  Log,
  TransactionReceipt,
  WriteContractErrorType,
} from "viem";
import { Config, UseReadContractParameters } from "wagmi";
// 已移除 UseWatchContractEventParameters
import { WriteContractParameters, WriteContractReturnType } from "wagmi/actions";
import { WriteContractVariables } from "wagmi/query";
import deployedContractsData from "~~/contracts/deployedContracts";
import externalContractsData from "~~/contracts/externalContracts";

// import scaffoldConfig from "~~/scaffold.config"; // 已移除

type AddExternalFlag<T> = {
  [ChainId in keyof T]: {
    [ContractName in keyof T[ChainId]]: T[ChainId][ContractName] & { external?: true };
  };
};

const deepMergeContracts = <L extends Record<PropertyKey, any>, E extends Record<PropertyKey, any>>(
  local: L,
  external: E,
) => {
  const result: Record<PropertyKey, any> = {};
  const allKeys = Array.from(new Set([...Object.keys(external), ...Object.keys(local)]));
  for (const key of allKeys) {
    if (!external[key]) {
      result[key] = local[key];
      continue;
    }
    const amendedExternal = Object.fromEntries(
      Object.entries(external[key] as Record<string, Record<string, unknown>>).map(([contractName, declaration]) => [
        contractName,
        { ...declaration, external: true },
      ]),
    );
    result[key] = { ...local[key], ...amendedExternal };
  }
  return result as MergeDeepRecord<AddExternalFlag<L>, AddExternalFlag<E>, { arrayMergeMode: "replace" }>;
};

const contractsData = deepMergeContracts(deployedContractsData, externalContractsData);

// 定义通用合约类型
export type InheritedFunctions = { readonly [key: string]: string };

export type GenericContract = {
  address: Address;
  abi: Abi;
  inheritedFunctions?: InheritedFunctions;
  external?: true;
};

// 定义通用合约声明类型，使用数字索引签名
export type GenericContractsDeclaration = {
  [chainId: number]: {
    [contractName: string]: GenericContract;
  };
};

// 强制将 contractsData 断言为 GenericContractsDeclaration 类型
export const contracts = contractsData as GenericContractsDeclaration | null;

// **修正部分开始**
// 明确定义 ConfiguredChainId 为 number 类型
type ConfiguredChainId = number;
// **修正部分结束**

// 移除 IsContractDeclarationMissing，直接使用 GenericContractsDeclaration
type ContractsDeclaration = GenericContractsDeclaration;

// **修正部分开始**
// 使用 ConfiguredChainId 作为索引，确保其为 number 类型
type Contracts = ContractsDeclaration[ConfiguredChainId];
// **修正部分结束**

// **修正部分开始**
// 定义 ContractName 为 string 类型，避免 symbol
export type ContractName = keyof Contracts & string;
// **修正部分结束**

export type Contract<TContractName extends ContractName> = Contracts[TContractName];

type InferContractAbi<TContract> = TContract extends { abi: infer TAbi } ? TAbi : never;

export type ContractAbi<TContractName extends ContractName = ContractName> = InferContractAbi<Contract<TContractName>>;

export type AbiFunctionInputs<TAbi extends Abi, TFunctionName extends string> = ExtractAbiFunction<
  TAbi,
  TFunctionName
>["inputs"];

export type AbiFunctionArguments<TAbi extends Abi, TFunctionName extends string> = AbiParametersToPrimitiveTypes<
  AbiFunctionInputs<TAbi, TFunctionName>
>;

export type AbiFunctionOutputs<TAbi extends Abi, TFunctionName extends string> = ExtractAbiFunction<
  TAbi,
  TFunctionName
>["outputs"];

export type AbiFunctionReturnType<TAbi extends Abi, TFunctionName extends string> =
  AbiParametersToPrimitiveTypes<AbiFunctionOutputs<TAbi, TFunctionName>> extends readonly [any]
    ? AbiParametersToPrimitiveTypes<AbiFunctionOutputs<TAbi, TFunctionName>>[0]
    : AbiParametersToPrimitiveTypes<AbiFunctionOutputs<TAbi, TFunctionName>>;

export type AbiEventInputs<TAbi extends Abi, TEventName extends ExtractAbiEventNames<TAbi>> = ExtractAbiEvent<
  TAbi,
  TEventName
>["inputs"];

export enum ContractCodeStatus {
  LOADING,
  DEPLOYED,
  NOT_FOUND,
}

type AbiStateMutability = "pure" | "view" | "nonpayable" | "payable";
export type ReadAbiStateMutability = "view" | "pure";
export type WriteAbiStateMutability = "nonpayable" | "payable";

export type FunctionNamesWithInputs<
  TContractName extends ContractName,
  TAbiStateMutability extends AbiStateMutability = AbiStateMutability,
> = Exclude<
  Extract<
    ContractAbi<TContractName>[number],
    {
      type: "function";
      stateMutability: TAbiStateMutability;
    }
  >,
  {
    inputs: readonly [];
  }
>["name"];

type Expand<T> = T extends object ? (T extends infer O ? { [K in keyof O]: O[K] } : never) : T;

type UnionToIntersection<U> = Expand<(U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never>;

type OptionalTuple<T> = T extends readonly [infer H, ...infer R] ? readonly [H | undefined, ...OptionalTuple<R>] : T;

type UseScaffoldArgsParam<
  TContractName extends ContractName,
  TFunctionName extends ExtractAbiFunctionNames<ContractAbi<TContractName>>,
> =
  TFunctionName extends FunctionNamesWithInputs<TContractName>
    ? {
        args: OptionalTuple<UnionToIntersection<AbiFunctionArguments<ContractAbi<TContractName>, TFunctionName>>>;
        value?: ExtractAbiFunction<ContractAbi<TContractName>, TFunctionName>["stateMutability"] extends "payable"
          ? bigint | undefined
          : undefined;
      }
    : {
        args?: never;
      };

export type UseScaffoldReadConfig<
  TContractName extends ContractName,
  TFunctionName extends ExtractAbiFunctionNames<ContractAbi<TContractName>, ReadAbiStateMutability>,
> = {
  contractName: TContractName;
  watch?: boolean;
} & {
  functionName: TFunctionName;
} & UseScaffoldArgsParam<TContractName, TFunctionName> &
  Omit<UseReadContractParameters, "chainId" | "abi" | "address" | "functionName" | "args">;

export type ScaffoldWriteContractVariables<
  TContractName extends ContractName,
  TFunctionName extends ExtractAbiFunctionNames<ContractAbi<TContractName>, WriteAbiStateMutability>,
> = {
  functionName: TFunctionName;
} & UseScaffoldArgsParam<TContractName, TFunctionName> &
  Omit<WriteContractParameters, "chainId" | "abi" | "address" | "functionName" | "args">;

type WriteVariables = WriteContractVariables<Abi, string, any[], Config, number>;

export type TransactorFuncOptions = {
  onBlockConfirmation?: (txnReceipt: TransactionReceipt) => void;
  blockConfirmations?: number;
};

export type ScaffoldWriteContractOptions = MutateOptions<
  WriteContractReturnType,
  WriteContractErrorType,
  WriteVariables,
  unknown
> &
  TransactorFuncOptions;

export type UseScaffoldEventConfig<
  TContractName extends ContractName,
  TEventName extends ExtractAbiEventNames<ContractAbi<TContractName>>,
> = {
  contractName: TContractName;
  eventName: TEventName;
} & {
  onLogs: (
    logs: Simplify<
      Omit<Log<bigint, number, any>, "args" | "eventName"> & {
        args: Record<string, unknown>;
        eventName: string;
      }
    >[],
  ) => void;
};

type IndexedEventInputs<
  TContractName extends ContractName,
  TEventName extends ExtractAbiEventNames<ContractAbi<TContractName>>,
> = Extract<AbiEventInputs<ContractAbi<TContractName>, TEventName>[number], { indexed: true }>;

export type EventFilters<
  TContractName extends ContractName,
  TEventName extends ExtractAbiEventNames<ContractAbi<TContractName>>,
> =
  IndexedEventInputs<TContractName, TEventName> extends never
    ? never
    : {
        [Key in Extract<
          IndexedEventInputs<TContractName, TEventName>,
          { name: string }
        >["name"]]: AbiParameterToPrimitiveType<Extract<IndexedEventInputs<TContractName, TEventName>, { name: Key }>>;
      };

export type UseScaffoldEventHistoryConfig<
  TContractName extends ContractName,
  TEventName extends ExtractAbiEventNames<ContractAbi<TContractName>>,
  TBlockData extends boolean = false,
  TTransactionData extends boolean = false,
  TReceiptData extends boolean = false,
> = {
  contractName: TContractName;
  eventName: TEventName;
  fromBlock: bigint;
  filters?: EventFilters<TContractName, TEventName>;
  blockData?: TBlockData;
  transactionData?: TTransactionData;
  receiptData?: TReceiptData;
  watch?: boolean;
  enabled?: boolean;
};

export type UseScaffoldEventHistoryData<
  TContractName extends ContractName,
  TEventName extends ExtractAbiEventNames<ContractAbi<TContractName>>,
  TBlockData extends boolean = false,
  TTransactionData extends boolean = false,
  TReceiptData extends boolean = false,
> =
  | {
      log: Log<
        bigint,
        number,
        false,
        ExtractAbiEvent<ContractAbi<TContractName>, TEventName>,
        false,
        [ExtractAbiEvent<ContractAbi<TContractName>, TEventName>],
        TEventName
      >;
      args: AbiParametersToPrimitiveTypes<ExtractAbiEvent<ContractAbi<TContractName>, TEventName>["inputs"]> &
        GetEventArgs<ContractAbi<TContractName>, TEventName, { IndexedOnly: false }>;
      blockData: TBlockData extends true ? Block<bigint, true> : null;
      receiptData: TReceiptData extends true ? GetTransactionReturnType : null;
      transactionData: TTransactionData extends true ? GetTransactionReceiptReturnType : null;
    }[]
  | undefined;

export type AbiParameterTuple = Extract<AbiParameter, { type: "tuple" | `tuple[${string}]` }>;
