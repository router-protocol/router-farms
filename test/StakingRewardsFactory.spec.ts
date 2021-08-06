import chai, { expect } from 'chai'
import { Contract, BigNumber } from 'ethers'
import { solidity, MockProvider, createFixtureLoader } from 'ethereum-waffle'

import { stakingRewardsFactoryFixture ,stakingRewardsFixture} from './fixtures'
import { mineBlock, REWARDS_DURATION,expandTo18Decimals } from './utils'

import StakingRewards from '../build/StakingRewards.json'

chai.use(solidity)

describe('StakingRewardsFactory', () => {
  const provider = new MockProvider({
    ganacheOptions: {
      hardfork: 'istanbul',
      mnemonic: 'horn horn horn horn horn horn horn horn horn horn horn horn',
      gasLimit: 9999999,
    },
  })
  const [wallet, wallet1,staker] = provider.getWallets()
  const loadFixture = createFixtureLoader([wallet], provider)

  let rewardTokens: Contract[]
  let genesis: number
  let rewardAmounts: BigNumber[]
  let stakingRewardsFactory: Contract
  let stakingTokens: Contract[]
  let totalRewardAmount: BigNumber
  let stakingRewards: Contract
  beforeEach('load fixture', async () => {
    const fixture = await loadFixture(stakingRewardsFactoryFixture)
    const fixture1 = await loadFixture(stakingRewardsFixture)
    rewardTokens = fixture.rewardTokens
    genesis = fixture.genesis
    rewardAmounts = fixture.rewardAmounts
    stakingRewardsFactory = fixture.stakingRewardsFactory
    stakingTokens = fixture.stakingTokens
    stakingRewards = fixture1.stakingRewards
  })

  it('deployment gas', async () => {
    const receipt = await provider.getTransactionReceipt(stakingRewardsFactory.deployTransaction.hash)
    expect(receipt.gasUsed).to.eq('3610427')
  })

  describe('#deploy', () => {
    it('pushes the token into the list', async () => {
      await stakingRewardsFactory.deploy(stakingTokens[1].address,rewardTokens[0].address, 10000, REWARDS_DURATION)
      expect(await stakingRewardsFactory.stakingTokens(0)).to.eq(stakingTokens[1].address)
    })

    it('fails if called twice for same token', async () => {
      await stakingRewardsFactory.deploy(stakingTokens[1].address,rewardTokens[0].address, 10000, REWARDS_DURATION)
      await expect(stakingRewardsFactory.deploy(stakingTokens[1].address,rewardTokens[0].address, 10000, REWARDS_DURATION)).to.revertedWith(
        'StakingRewardsFactory::deploy: already deployed'
      )
    })

    it('can only be called by the owner', async () => {
      await expect(stakingRewardsFactory.connect(wallet1).deploy(stakingTokens[1].address,rewardTokens[0].address, 10000, REWARDS_DURATION)).to.be.revertedWith(
        'Ownable: caller is not the owner'
      )
    })

    it('stores the address of stakingRewards and reward amount', async () => {
      await stakingRewardsFactory.deploy(stakingTokens[1].address,rewardTokens[0].address, 10000, REWARDS_DURATION)
      const [stakingRewards, rewardAmount] = await stakingRewardsFactory.stakingRewardsInfoByStakingToken(
        stakingTokens[1].address
      )
      expect(await provider.getCode(stakingRewards)).to.not.eq('0x')
      expect(rewardAmount).to.eq(10000)
    })

    it('deployed staking rewards has correct parameters', async () => {
      await stakingRewardsFactory.deploy(stakingTokens[1].address,rewardTokens[0].address, 10000, REWARDS_DURATION)
      const [stakingRewardsAddress] = await stakingRewardsFactory.stakingRewardsInfoByStakingToken(
        stakingTokens[1].address
      )
      const stakingRewards = new Contract(stakingRewardsAddress, StakingRewards.abi, provider)
      expect(await stakingRewards.rewardsDistribution()).to.eq(stakingRewardsFactory.address)
      expect(await stakingRewards.stakingToken()).to.eq(stakingTokens[1].address)
      expect(await stakingRewards.rewardsToken()).to.eq(rewardTokens[0].address)
    })

    




  })

  describe('#notifyRewardsAmounts', () => {
    let totalRewardAmount: BigNumber

    beforeEach(() => {
      totalRewardAmount = rewardAmounts.reduce((accumulator, current) => accumulator.add(current), BigNumber.from(0))
    })

    it('called before any deploys', async () => {
      await expect(stakingRewardsFactory.notifyRewardAmounts()).to.be.revertedWith(
        'StakingRewardsFactory::notifyRewardAmounts: called before any deploys'
      )
    })

    describe('after deploying all staking reward contracts', async () => {
      let stakingRewards: Contract[]
      beforeEach('deploy staking reward contracts', async () => {
        stakingRewards = []
        for (let i = 0; i < stakingTokens.length; i++) {
          await stakingRewardsFactory.deploy(stakingTokens[i].address,rewardTokens[0].address, rewardAmounts[i], REWARDS_DURATION)
          const [stakingRewardsAddress] = await stakingRewardsFactory.stakingRewardsInfoByStakingToken(
            stakingTokens[i].address
          )
          stakingRewards.push(new Contract(stakingRewardsAddress, StakingRewards.abi, provider))
        }
      })

      it('gas', async () => {
        await rewardTokens[0].transfer(stakingRewardsFactory.address, totalRewardAmount)
        await mineBlock(provider, genesis)
        const tx = await stakingRewardsFactory.notifyRewardAmounts()
        const receipt = await tx.wait()
        expect(receipt.gasUsed).to.eq('417047')
      })

      it('no op if called twice', async () => {
        await rewardTokens[0].transfer(stakingRewardsFactory.address, totalRewardAmount)
        await mineBlock(provider, genesis)
        await expect(stakingRewardsFactory.notifyRewardAmounts()).to.emit(rewardTokens[0], 'Transfer')
        await expect(stakingRewardsFactory.notifyRewardAmounts()).to.not.emit(rewardTokens[0], 'Transfer')
      })

      it('fails if called without sufficient balance', async () => {
        await mineBlock(provider, genesis)
        await expect(stakingRewardsFactory.notifyRewardAmounts()).to.be.revertedWith(
          'ERC20: transfer amount exceeds balance' // emitted from rewards token
        )
      })

      it('calls notifyRewards on each contract', async () => {
        await rewardTokens[0].transfer(stakingRewardsFactory.address, totalRewardAmount)
        await mineBlock(provider, genesis)
        await expect(stakingRewardsFactory.notifyRewardAmounts())
          .to.emit(stakingRewards[0], 'RewardAdded')
          .withArgs(rewardAmounts[0])
          .to.emit(stakingRewards[1], 'RewardAdded')
          .withArgs(rewardAmounts[1])
          .to.emit(stakingRewards[2], 'RewardAdded')
          .withArgs(rewardAmounts[2])
          .to.emit(stakingRewards[3], 'RewardAdded')
          .withArgs(rewardAmounts[3])
      })

      it('transfers the reward tokens to the individual contracts', async () => {
        await rewardTokens[0].transfer(stakingRewardsFactory.address, totalRewardAmount)
        await mineBlock(provider, genesis)
        await stakingRewardsFactory.notifyRewardAmounts()
        for (let i = 0; i < rewardAmounts.length; i++) {
          expect(await rewardTokens[0].balanceOf(stakingRewards[i].address)).to.eq(rewardAmounts[i])
        }
      })

      it('sets rewardAmount to 0', async () => {
        await rewardTokens[0].transfer(stakingRewardsFactory.address, totalRewardAmount)
        await mineBlock(provider, genesis)
        for (let i = 0; i < stakingTokens.length; i++) {
          const [, amount] = await stakingRewardsFactory.stakingRewardsInfoByStakingToken(stakingTokens[i].address)
          expect(amount).to.eq(rewardAmounts[i])
        }
        await stakingRewardsFactory.notifyRewardAmounts()
        for (let i = 0; i < stakingTokens.length; i++) {
          const [, amount] = await stakingRewardsFactory.stakingRewardsInfoByStakingToken(stakingTokens[i].address)
          expect(amount).to.eq(0)
        }
      })

      it('succeeds when has sufficient balance and after genesis time', async () => {
        await rewardTokens[0].transfer(stakingRewardsFactory.address, totalRewardAmount)
        await mineBlock(provider, genesis)
        await stakingRewardsFactory.notifyRewardAmounts()
      })
    })

      // deploy factory
    // deploy 2 reward tokens
    // depoly 2 staking tokens
    // deploy 2 pools 
    // transfer reward token to factory
    // notify reward amount
    // do stake on both pools
    // mine block from start to end
    // trigger clain all
    // do assert on reward balances
    describe('#Claim', async () => {
      // let stakingRewards: Contract[]
      // beforeEach('deploy staking reward contracts', async () => {
      //   let totalRewardAmount: BigNumber
      //   stakingRewards = []
      //   totalRewardAmount = rewardAmounts.reduce((accumulator, current) => accumulator.add(current), BigNumber.from(0))
      //   for (let i = 0; i < rewardTokens.length; i++) {
      //     await stakingRewardsFactory.deploy(stakingTokens[i].address,rewardTokens[i].address, rewardAmounts[i], REWARDS_DURATION)
      //     const [stakingRewardsAddress] = await stakingRewardsFactory.stakingRewardsInfoByStakingToken(
      //       stakingTokens[i].address
      //     )
      //     stakingRewards.push(new Contract(stakingRewardsAddress, StakingRewards.abi, provider))
      //     await rewardTokens[i].transfer(stakingRewardsFactory.address, totalRewardAmount)

      //   await stakingRewardsFactory.notifyRewardAmounts();
      //   const stake = expandTo18Decimals(2)
      //   await stakingTokens[i].transfer(staker.address, stake)
      //   await stakingTokens[i].connect(staker).approve(stakingTokens[i].address, stake)
      //   await stakingRewards[i].connect(staker).stake(stake)
      //   }
      // })
      const reward = expandTo18Decimals(100)
      async function start(reward: BigNumber): Promise<{ startTime: BigNumber; endTime: BigNumber }> {
        // send reward to the contract
        await rewardTokens[0].transfer(stakingRewards.address, reward)
        // must be called by rewardsDistribution
        await stakingRewards.notifyRewardAmount(reward)
    
        const startTime: BigNumber = await stakingRewards.lastUpdateTime()
        const endTime: BigNumber = await stakingRewards.periodFinish()
        expect(endTime).to.be.eq(startTime.add(REWARDS_DURATION * 24 * 60 * 60))
        return { startTime, endTime }
      }
      it('Check Claim all', async () => {
        let stakingRewards: Contract[]
        let totalRewardAmount: BigNumber
        stakingRewards = []
        totalRewardAmount = rewardAmounts.reduce((accumulator, current) => accumulator.add(current), BigNumber.from(0))
        for (let i = 0; i < rewardTokens.length; i++) {
          await stakingRewardsFactory.deploy(stakingTokens[i].address,rewardTokens[i].address,"2000000000000", REWARDS_DURATION)
          const [stakingRewardsAddress] = await stakingRewardsFactory.stakingRewardsInfoByStakingToken(
            stakingTokens[i].address
          )
          stakingRewards.push(new Contract(stakingRewardsAddress, StakingRewards.abi, provider))
          await rewardTokens[i].transfer(stakingRewardsFactory.address, totalRewardAmount)

        await stakingRewardsFactory.notifyRewardAmounts();
        const stake = expandTo18Decimals(2)
        await stakingTokens[i].transfer(staker.address, stake)
        await stakingTokens[i].connect(staker).approve(stakingTokens[i].address, stake)
        await stakingRewards[i].connect(staker).stake(stake)
        // const { endTime } = await start(reward)
        // await mineBlock(provider, endTime.add(1).toNumber())
        }
        
      await stakingRewardsFactory.connect(staker).claimAll()
      const reward1=stakingRewards[0].earned(staker.address)
      const reward2=stakingRewards[1].earned(staker.address)
      expect(reward1).to.be.eq(0)
      expect(reward2).to.be.eq(0)
      })
    })



  })
})




/*
deploy factory
deploy 2 reward tokens
depoly 2 staking tokens
deploy 2 pools 
transfer reward token to factory
notify reward amount
do stake on both pools
mine block from start to end
trigger clain all
do assert on reward balances


deploy route test token

iden usdc-usdt pool & usdt-dai

depoly factory

deploy pools for above lp

rewards cycle 10 days

reward 1 million token in each pool


*/