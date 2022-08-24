import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";
import { TestERC20, TestERC20__factory, StakingRewards, StakingRewards__factory } from "../../typechain";

task("deploy:TestERC20").setAction(async function (taskArguments: TaskArguments, { ethers }) {
  // const testErc20Factory: TestERC20__factory = await ethers.getContractFactory("TestERC20");
  // const totalsupply = ethers.utils.parseEther("20000");
  // const testERC20: TestERC20 = <TestERC20>await testErc20Factory.deploy(totalsupply.toString());
  // await testERC20.deployed();
  // console.log("Token deployed to: ", testERC20.address);
  const testErc20Factory: TestERC20__factory = await ethers.getContractFactory("TestERC20");
  const testERC20: TestERC20 = <TestERC20>await testErc20Factory.attach("0x16ECCfDbb4eE1A85A33f3A9B21175Cd7Ae753dB4");
  const tokenAmount = ethers.utils.parseEther("2");
  await testERC20.approve("0xd8093926e5639Aaa8c753c3685F0777F6735bD4E", tokenAmount.toString());
  // await testERC20.transfer("",ethers.utils.parseEther("100"));
});

task("deploy:Vault").setAction(async function (taskArguments: TaskArguments, { ethers }) {
  const rewardVault = await ethers.getContractFactory("RewardVault");
  const RouteAddress = "0x16ECCfDbb4eE1A85A33f3A9B21175Cd7Ae753dB4";
  const vault = await rewardVault.deploy(RouteAddress);
  await vault.deployed();
  console.log("Vault deployed to: ", vault.address);
});

task("deploy:StakingReward").setAction(async function (taskArguments: TaskArguments, { ethers }) {
  const stakingRewards = await ethers.getContractFactory("StakingRewards");
  const RouteAddress = "0x16ECCfDbb4eE1A85A33f3A9B21175Cd7Ae753dB4";
  const VaultAddress = "0xd8093926e5639Aaa8c753c3685F0777F6735bD4E";
  const RewardDuration = "1";
  const factoryContract = await stakingRewards.deploy(RouteAddress, RouteAddress, VaultAddress, RewardDuration);

  await factoryContract.deployed();
  console.log("pool deployed to: ", factoryContract.address);
});

task("addRewards").setAction(async function (taskArguments: TaskArguments, { ethers }) {
  const rewardVault = await ethers.getContractFactory("RewardVault");
  const vaultAddress = "0xd8093926e5639Aaa8c753c3685F0777F6735bD4E";
  const rewardAmount = ethers.utils.parseEther("2");
  const vault = await rewardVault.attach(vaultAddress);
  await vault.addRewards(rewardAmount);
});

task("approve:StakingRewards").setAction(async function (taskArguments: TaskArguments, { ethers }) {
  const rewardVault = await ethers.getContractFactory("RewardVault");
  const vaultAddress = "0xd8093926e5639Aaa8c753c3685F0777F6735bD4E";
  const rewardAmount = ethers.utils.parseEther("1");
  const stakingRewardAddress = "0x4407D4a594b84C9786717d01B1AC4E028A351Dc1";
  const vault = await rewardVault.attach(vaultAddress);
  await vault.increaseAllowance(stakingRewardAddress, rewardAmount);
});

task("NotifyRewards").setAction(async function (taskArguments: TaskArguments, { ethers }) {
  const stakingRewardsContract = await ethers.getContractFactory("StakingRewards");
  const StakingRewards = "0x4407D4a594b84C9786717d01B1AC4E028A351Dc1";
  const RewardAmount = ethers.utils.parseEther("1");
  const factoryContract = await stakingRewardsContract.attach(StakingRewards);
  try {
    const tx = await factoryContract.notifyRewardAmount(RewardAmount);
    tx.wait(2);
  } catch (e) {
    console.log("error", e);
  }
});
