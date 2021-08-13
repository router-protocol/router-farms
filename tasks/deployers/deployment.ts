import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";
import { TestERC20,TestERC20__factory,StakingRewardsFactory,StakingRewardsFactory__factory,StakingRewards__factory,StakingRewards} from "../../typechain";

task("deploy:TestERC20")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const testErc20Factory: TestERC20__factory = await ethers.getContractFactory("TestERC20");
    const totalsupply=ethers.utils.parseEther("20000")
    const testERC20: TestERC20 = <TestERC20>await testErc20Factory.deploy(totalsupply);
    await testERC20.deployed();
    console.log("Token deployed to: ", testERC20.address);
    // const testErc20Factory: TestERC20__factory = await ethers.getContractFactory("TestERC20");
    // const testERC20: TestERC20 = <TestERC20>await testErc20Factory.attach("0x8876C29e743779135e2Ec411E6a7D1903c10d9E7");
    // await testERC20.approve("0xA64De63b9fD024C0BFE5263bFdb11722c0d78a88",ethers.utils.parseEther("100"));
    // await testERC20.transfer("",ethers.utils.parseEther("100"));
  });


  task("deploy:RewardFactory")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const stakingRewardsFactory: StakingRewardsFactory__factory = await ethers.getContractFactory("StakingRewardsFactory");
    const factoryContract: StakingRewardsFactory = <StakingRewardsFactory>await stakingRewardsFactory.deploy(Math.floor(Date.now() /1000) + 60 * 2);
    await factoryContract.deployed();
    console.log("REWARD FACTORY deployed to: ", factoryContract.address);
  });


  task("NotifyRewards")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const stakingRewardsFactory: StakingRewardsFactory__factory = await ethers.getContractFactory("StakingRewardsFactory");
    const factoryContract: StakingRewardsFactory = <StakingRewardsFactory>await stakingRewardsFactory.attach("0xC9A1F66A9499559fe61f6B71B80b84Ae3AD6E959");
    await factoryContract.notifyRewardAmounts();
  });


  task("deploy:POOL")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const stakingRewardsFactory: StakingRewardsFactory__factory = await ethers.getContractFactory("StakingRewardsFactory");
    const factoryContract: StakingRewardsFactory = <StakingRewardsFactory>await stakingRewardsFactory.attach("0xC9A1F66A9499559fe61f6B71B80b84Ae3AD6E959");
    await factoryContract.deploy("0x8876C29e743779135e2Ec411E6a7D1903c10d9E7","0x19B57709C6F76B820010da2F57F0184d63771c9b",ethers.utils.parseEther("300"),1);
    const poolAddress=await factoryContract.stakingRewardsInfoByStakingToken("0x8876C29e743779135e2Ec411E6a7D1903c10d9E7")
    console.log("POOL ADDRESS",poolAddress);
  });

  // task("stake")
  // .setAction(async function (taskArguments: TaskArguments, { ethers }) {
  //   const stakingRewards: StakingRewards__factory = await ethers.getContractFactory("StakingRewards");
  //   const stakingRewardsContract: StakingRewards = <StakingRewards>await stakingRewards.attach("0xA64De63b9fD024C0BFE5263bFdb11722c0d78a88");
  //   // const stakeAmount=ethers.utils.parseEther("100")
  //   // await stakingRewardsContract.stake(stakeAmount);
  //   const rewards=await stakingRewardsContract.earned("0x5F5B7Db92C864dA7d2732788E30309Fd235Fd23d")
  //   console.log("REWARDS ADDRESS",rewards.toString());
  // });
