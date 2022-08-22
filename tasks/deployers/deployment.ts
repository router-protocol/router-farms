import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";
import { TestERC20, TestERC20__factory, StakingRewards, StakingRewards__factory } from "../../typechain";

task("deploy:TestERC20").setAction(async function (taskArguments: TaskArguments, { ethers }) {
  const testErc20Factory: TestERC20__factory = await ethers.getContractFactory("TestERC20");
  const totalsupply = ethers.utils.parseEther("20000");
  const testERC20: TestERC20 = <TestERC20>await testErc20Factory.deploy(totalsupply.toString());
  await testERC20.deployed();
  console.log("Token deployed to: ", testERC20.address);
  // const testErc20Factory: TestERC20__factory = await ethers.getContractFactory("TestERC20");
  // const testERC20: TestERC20 = <TestERC20>await testErc20Factory.attach("0x8876C29e743779135e2Ec411E6a7D1903c10d9E7");
  // const tokenAmount=ethers.utils.parseEther("100")
  // await testERC20.approve("0xA64De63b9fD024C0BFE5263bFdb11722c0d78a88",tokenAmount.toString());
  // await testERC20.transfer("",ethers.utils.parseEther("100"));
});

task("deploy:StakingReward").setAction(async function (taskArguments: TaskArguments, { ethers }) {
  const stakingRewardsFactory: StakingRewards__factory = await ethers.getContractFactory("StakingRewards");
  const factoryContract: StakingRewards = <StakingRewards>(
    await stakingRewardsFactory.deploy(
      "0x4Cd53963Ad8f152A8AeBe0544B5720DD7A90c21B",
      "0x4Cd53963Ad8f152A8AeBe0544B5720DD7A90c21B",
      5,
    )
  );
  await factoryContract.deployed();
  console.log("REWARD FACTORY deployed to: ", factoryContract.address);
});

task("NotifyRewards").setAction(async function (taskArguments: TaskArguments, { ethers }) {
  const stakingRewardsFactory: StakingRewards__factory = await ethers.getContractFactory("StakingRewards");
  const factoryContract: StakingRewards = <StakingRewards>(
    await stakingRewardsFactory.attach("0xbc32c88C622b94503848009cd7a825998BbfF841")
  );
  console.log("hello world");
  try {
    let tx = await factoryContract.notifyRewardAmount("1000000000000000000000");
    tx.wait(2);
  } catch (e) {
    console.log("error", e);
  }
});

task("stake").setAction(async function (taskArguments: TaskArguments, { ethers }) {
  const stakingRewards: StakingRewards__factory = await ethers.getContractFactory("StakingRewards");
  const stakingRewardsContract: StakingRewards = <StakingRewards>(
    await stakingRewards.attach("0xbc32c88C622b94503848009cd7a825998BbfF841")
  );
  const stakeAmount = ethers.utils.parseEther("1000");
  await stakingRewardsContract.stake(stakeAmount.toString());
  const rewards = await stakingRewardsContract.earned("0x50C8B3412E89f87A16ae27aCe63c861573d2376b");
  console.log("REWARDS ADDRESS", rewards.toString());
});
