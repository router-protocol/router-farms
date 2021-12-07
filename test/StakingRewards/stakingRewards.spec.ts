import chai, { expect } from "chai";
import { Contract, BigNumber, constants } from "ethers";
import { solidity, MockProvider, createFixtureLoader, deployContract } from "ethereum-waffle";
import { ecsign } from "ethereumjs-util";

import { stakingRewardsFixture } from "../fixtures";
import { REWARDS_DURATION, expandTo18Decimals, mineBlock, getApprovalDigest } from "../utils";

import StakingRewards from "../../artifacts/contracts/StakingRewards.sol/StakingRewards.json";

chai.use(solidity);

describe("StakingRewards", () => {
  const provider = new MockProvider({
    ganacheOptions: {
      hardfork: "istanbul",
      mnemonic: "horn horn horn horn horn horn horn horn horn horn horn horn",
      gasLimit: 9999999,
    },
  });
  const [wallet, staker, secondStaker] = provider.getWallets();
  const loadFixture = createFixtureLoader([wallet], provider);

  let stakingRewards: Contract;
  let rewardsToken: Contract;
  let stakingToken: Contract;
  beforeEach(async () => {
    const fixture = await loadFixture(stakingRewardsFixture);
    stakingRewards = fixture.stakingRewards;
    rewardsToken = fixture.rewardsToken;
    stakingToken = fixture.stakingToken;
  });

  it("deploy cost", async () => {
    const stakingRewards = await deployContract(wallet, StakingRewards, [
      wallet.address,
      rewardsToken.address,
      stakingToken.address,
      REWARDS_DURATION,
    ]);
    const receipt = await provider.getTransactionReceipt(stakingRewards.deployTransaction.hash);
    expect(receipt.gasUsed).to.eq("2500714");
  });

  it("rewardsDuration", async () => {
    const rewardsDuration = await stakingRewards.rewardsDuration();
    expect(rewardsDuration).to.be.eq(REWARDS_DURATION * 60 * 60 * 24);
  });

  const reward = expandTo18Decimals(100);
  async function start(reward: BigNumber): Promise<{ startTime: BigNumber; endTime: BigNumber }> {
    // send reward to the contract
    await rewardsToken.transfer(stakingRewards.address, reward);
    // must be called by rewardsDistribution
    await stakingRewards.notifyRewardAmount(reward);

    const startTime: BigNumber = await stakingRewards.lastUpdateTime();
    const endTime: BigNumber = await stakingRewards.periodFinish();
    expect(endTime).to.be.eq(startTime.add(REWARDS_DURATION * 24 * 60 * 60));
    return { startTime, endTime };
  }

  it("notifyRewardAmount: full", async () => {
    // stake with staker
    const stake = expandTo18Decimals(2);
    await stakingToken.transfer(staker.address, stake);
    await stakingToken.connect(staker).approve(stakingRewards.address, stake);
    await stakingRewards.connect(staker).stake(stake);

    const { endTime } = await start(reward);

    // fast-forward past the reward window
    await mineBlock(provider, endTime.add(1).toNumber());

    // unstake
    await stakingRewards.connect(staker).exit();
    const stakeEndTime: BigNumber = await stakingRewards.lastUpdateTime();
    expect(stakeEndTime).to.be.eq(endTime);

    const rewardAmount = await rewardsToken.balanceOf(staker.address);
    expect(reward.sub(rewardAmount).lte(reward.div(10000))).to.be.true; // ensure result is within .01%
    expect(rewardAmount).to.be.eq(reward.div(REWARDS_DURATION * 24 * 60 * 60).mul(REWARDS_DURATION * 24 * 60 * 60));
  });

  it("stakeWithPermit", async () => {
    // stake with staker
    const stake = expandTo18Decimals(2);
    await stakingToken.transfer(staker.address, stake);

    // get permit
    const nonce = await stakingToken.nonces(staker.address);
    const deadline = constants.MaxUint256;
    const digest = await getApprovalDigest(
      stakingToken,
      { owner: staker.address, spender: stakingRewards.address, value: stake },
      nonce,
      deadline,
    );
    const { v, r, s } = ecsign(Buffer.from(digest.slice(2), "hex"), Buffer.from(staker.privateKey.slice(2), "hex"));

    await stakingRewards.connect(staker).stakeWithPermit(stake, deadline, v, r, s);

    const { endTime } = await start(reward);

    // fast-forward past the reward window
    await mineBlock(provider, endTime.add(1).toNumber());

    // unstake
    await stakingRewards.connect(staker).exit();
    const stakeEndTime: BigNumber = await stakingRewards.lastUpdateTime();
    expect(stakeEndTime).to.be.eq(endTime);

    const rewardAmount = await rewardsToken.balanceOf(staker.address);
    expect(reward.sub(rewardAmount).lte(reward.div(10000))).to.be.true; // ensure result is within .01%
    expect(rewardAmount).to.be.eq(reward.div(REWARDS_DURATION * 24 * 60 * 60).mul(REWARDS_DURATION * 24 * 60 * 60));
  });

  it("notifyRewardAmount: ~half", async () => {
    const { startTime, endTime } = await start(reward);

    // fast-forward ~halfway through the reward window
    await mineBlock(provider, startTime.add(endTime.sub(startTime).div(2)).toNumber());

    // stake with staker
    const stake = expandTo18Decimals(2);
    await stakingToken.transfer(staker.address, stake);
    await stakingToken.connect(staker).approve(stakingRewards.address, stake);
    await stakingRewards.connect(staker).stake(stake);
    const stakeStartTime: BigNumber = await stakingRewards.lastUpdateTime();

    // fast-forward past the reward window
    await mineBlock(provider, endTime.add(1).toNumber());

    // unstake
    await stakingRewards.connect(staker).exit();
    const stakeEndTime: BigNumber = await stakingRewards.lastUpdateTime();
    expect(stakeEndTime).to.be.eq(endTime);

    const rewardAmount = await rewardsToken.balanceOf(staker.address);
    expect(reward.div(2).sub(rewardAmount).lte(reward.div(2).div(10000))).to.be.true; // ensure result is within .01%
    expect(rewardAmount).to.be.eq(reward.div(REWARDS_DURATION * 24 * 60 * 60).mul(endTime.sub(stakeStartTime)));
  }).retries(2); // TODO investigate flakiness

  it("notifyRewardAmount: two stakers", async () => {
    // stake with first staker
    const stake = expandTo18Decimals(2);
    await stakingToken.transfer(staker.address, stake);
    await stakingToken.connect(staker).approve(stakingRewards.address, stake);
    await stakingRewards.connect(staker).stake(stake);

    const { startTime, endTime } = await start(reward);

    // fast-forward ~halfway through the reward window
    await mineBlock(provider, startTime.add(endTime.sub(startTime).div(2)).toNumber());

    // stake with second staker
    await stakingToken.transfer(secondStaker.address, stake);
    await stakingToken.connect(secondStaker).approve(stakingRewards.address, stake);
    await stakingRewards.connect(secondStaker).stake(stake);

    // fast-forward past the reward window
    await mineBlock(provider, endTime.add(1).toNumber());

    // unstake
    await stakingRewards.connect(staker).exit();
    const stakeEndTime: BigNumber = await stakingRewards.lastUpdateTime();
    expect(stakeEndTime).to.be.eq(endTime);
    await stakingRewards.connect(secondStaker).exit();

    const rewardAmount = await rewardsToken.balanceOf(staker.address);
    const secondRewardAmount = await rewardsToken.balanceOf(secondStaker.address);
    const totalReward = rewardAmount.add(secondRewardAmount);

    // ensure results are within .01%
    expect(reward.sub(totalReward).lte(reward.div(10000))).to.be.true;
    expect(totalReward.mul(3).div(4).sub(rewardAmount).lte(totalReward.mul(3).div(4).div(10000)));
    expect(totalReward.div(4).sub(secondRewardAmount).lte(totalReward.div(4).div(10000)));
  });

  it("check farm renewal", async () => {
    const { startTime, endTime } = await start(reward);
    const rewardBalance = await rewardsToken.balanceOf(stakingRewards.address);
    console.log(rewardBalance.toString());
    const periodFinish = await stakingRewards.periodFinish();
    console.log(periodFinish.toString());
    const initialRewardRate = await stakingRewards.rewardRate();
    expect(initialRewardRate).to.be.equal(rewardBalance.div(REWARDS_DURATION * 24 * 60 * 60));
    await mineBlock(provider, endTime.sub(9).toNumber());
    await start(reward);
    const newrewardBalance = await rewardsToken.balanceOf(stakingRewards.address);
    console.log(newrewardBalance.toString());
    const newPeriodFinish = await stakingRewards.periodFinish();
    console.log(newPeriodFinish.toString());
    const newRewardRate = await stakingRewards.rewardRate();
    expect(newPeriodFinish).to.be.equal(endTime.sub(9).add(REWARDS_DURATION * 24 * 60 * 60));
    expect(newRewardRate).to.be.equal(
      initialRewardRate
        .mul(endTime.sub(endTime.sub(9)))
        .add(reward)
        .div(REWARDS_DURATION * 24 * 60 * 60),
    );
  });
});
