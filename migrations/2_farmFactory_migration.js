  
const StakingRewardsFactory = artifacts.require('StakingRewardsFactory');
const TestERC20 = artifacts.require('TestERC20');
const StakingRewards=artifacts.require("StakingRewards");

module.exports = async function (deployer, network) {
  
      if(network === "matic"){
        await deployer.deploy(TestERC20,"20000000000000000000000");
        const testERC20 = await TestERC20.deployed();
        // await deployer.deploy(StakingRewardsFactory,Math.floor(Date.now() /1000) + 60 * 5);
        // await StakingRewardsFactory.deployed();
      } else {
        // await deployer.deploy(TestERC20,"20000000000000000000000");
        // const testERC20 = await TestERC20.deployed();
// const testERC20=await TestERC20.at("0x8891d719Ff7A5197a53cB6A3E69aeC210062b434")
// await testERC20.approve("0x0A34545bA10564DFCb574f1e3278bAF4FD703B34","20000000000000000000000");
// await testERC20.transfer("0x3120e4B2deBCea4c1e308699896c7AB5E52A8969","20000000000000000000000");


        // await deployer.deploy(StakingRewardsFactory,Math.floor(Date.now() /1000) + 60 * 2);
        // await StakingRewardsFactory.deployed();
        // const stakingRewardsFactory=await StakingRewardsFactory.at("0x3120e4B2deBCea4c1e308699896c7AB5E52A8969");
        // await stakingRewardsFactory.claimAll();

        // const stakingRewards=await StakingRewards.at("0x0A34545bA10564DFCb574f1e3278bAF4FD703B34")
        // await stakingRewards.stake(web3.utils.toWei('300'));
      }
  };