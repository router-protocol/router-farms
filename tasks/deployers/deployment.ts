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

task("deploy:Vault").setAction(async function (taskArguments: TaskArguments, { ethers }) {
  const rewardVault = await ethers.getContractFactory("RewardVault");
  const RouteAddress = "";
  const vault = await rewardVault.deploy(RouteAddress);
  await vault.deployed();
  console.log("Vault deployed to: ", vault.address);
});

task("deploy:StakingReward").setAction(async function (taskArguments: TaskArguments, { ethers }) {
  const stakingRewards = await ethers.getContractFactory("StakingRewards");
  const RouteAddress = "";
  const VaultAddress = "";
  const RewardDuration = "";
  const factoryContract = await stakingRewards.deploy(RouteAddress, RouteAddress, VaultAddress, RewardDuration);

  await factoryContract.deployed();
  console.log("pool deployed to: ", factoryContract.address);
});

task("addRewards").setAction(async function (taskArguments: TaskArguments, { ethers }) {
  const rewardVault = await ethers.getContractFactory("RewardVault");
  const vaultAddress = "";
  const rewardAmount = "";
  const vault = await rewardVault.attach(vaultAddress);
  await vault.addRewards(rewardAmount);
});

task("approve:StakingRewards").setAction(async function (taskArguments: TaskArguments, { ethers }) {
  const rewardVault = await ethers.getContractFactory("RewardVault");
  const vaultAddress = "";
  const rewardAmount = "";
  const stakingRewardAddress = "";
  const vault = await rewardVault.attach(vaultAddress);
  await vault.increaseAllowance(stakingRewardAddress, rewardAmount);
});

task("NotifyRewards").setAction(async function (taskArguments: TaskArguments, { ethers }) {
  const stakingRewardsContract = await ethers.getContractFactory("StakingRewards");
  const StakingRewards = "";
  const RewardAmount = "";
  const factoryContract = await stakingRewardsContract.attach(StakingRewards);
  try {
    const tx = await factoryContract.notifyRewardAmount(RewardAmount);
    tx.wait(2);
  } catch (e) {
    console.log("error", e);
  }
});
