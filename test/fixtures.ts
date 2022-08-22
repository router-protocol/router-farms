// import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
// import { Fixture } from "ethereum-waffle";

// import { Greeter } from "../typechain/Greeter";

// declare module "mocha" {
//   export interface Context {
//     greeter: Greeter;
//     loadFixture: <T>(fixture: Fixture<T>) => Promise<T>;
//     signers: Signers;
//   }
// }

// export interface Signers {
//   admin: SignerWithAddress;
// }

import chai from "chai";
import { Contract, Wallet, BigNumber, providers } from "ethers";
import { solidity, deployContract } from "ethereum-waffle";

import { expandTo18Decimals, REWARDS_DURATION } from "./utils";

import UniswapV2ERC20 from "@uniswap/v2-core/build/ERC20.json";
import TestERC20 from "../artifacts/contracts/test/TestERC20.sol/TestERC20.json";
import StakingRewards from "../artifacts/contracts/StakingRewards.sol/StakingRewards.json";
import StakingRewardsFactory from "../artifacts/contracts/StakingRewards.sol/StakingRewards.json";

chai.use(solidity);

const NUMBER_OF_STAKING_TOKENS = 4;
const NUMBER_OF_REWARD_TOKENS = 2;

interface StakingRewardsFixture {
  stakingRewards: Contract;
  rewardsToken: Contract;
  stakingToken: Contract;
}

export async function stakingRewardsFixture([wallet]: Wallet[]): Promise<StakingRewardsFixture> {
  // const rewardsDistribution = wallet.address
  const rewardsToken = await deployContract(wallet, TestERC20, [expandTo18Decimals(1000000)]);
  const stakingToken = await deployContract(wallet, UniswapV2ERC20, [expandTo18Decimals(1000000)]);

  const stakingRewards = await deployContract(wallet, StakingRewards, [
    rewardsToken.address,
    stakingToken.address,
    REWARDS_DURATION,
  ]);

  return { stakingRewards, rewardsToken, stakingToken };
}

interface StakingRewardsFactoryFixture {
  rewardTokens: Contract[];
  stakingTokens: Contract[];
  genesis: number;
  rewardAmounts: BigNumber[];
  stakingRewardsFactory: Contract;
}

// export async function stakingRewardsFactoryFixture(
//   [wallet]: Wallet[],
//   provider: providers.Web3Provider
// ): Promise<StakingRewardsFactoryFixture> {
//   const rewardTokens = []
//   for (let i = 0; i < NUMBER_OF_STAKING_TOKENS; i++) {
//   const rewardsToken = await deployContract(wallet, TestERC20, [expandTo18Decimals(1_000_000_000)])
//   rewardTokens.push(rewardsToken)
//   }
//   // deploy staking tokens
//   const stakingTokens = []
//   for (let i = 0; i < NUMBER_OF_STAKING_TOKENS; i++) {
//     const stakingToken = await deployContract(wallet, TestERC20, [expandTo18Decimals(1_000_000_000)])
//     stakingTokens.push(stakingToken)
//   }

//   // deploy the staking rewards factory
//   const { timestamp: now } = await provider.getBlock('latest')
//   const genesis = now + 60 * 60
//   const rewardAmounts: BigNumber[] = new Array(stakingTokens.length).fill(expandTo18Decimals(10))
//   const stakingRewardsFactory = await deployContract(wallet, StakingRewardsFactory,[genesis])

//   return { rewardTokens, stakingTokens, genesis, rewardAmounts, stakingRewardsFactory }
// }
