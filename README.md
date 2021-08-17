# @router-protocol/router-farms

## Pre Requisites

- Before running any command, you need to create a `.env` file and set a BIP-39 compatible mnemonic as an environment
  variable. Follow the example in `.env.example`. If you don't already have a mnemonic, use this [website](https://iancoleman.io/bip39/) to generate one.
  Then, proceed with installing dependencies:

```sh
yarn install
```

Before Testing and Deployment generate typechain artifacts using:

```sh
$ yarn typechain
```

## Usage

### Compile

Compile the smart contracts with Hardhat:

```sh
$ yarn compile
```

### Lint Solidity

Lint the Solidity code:

```sh
$ yarn lint:sol
```

### Lint TypeScript

Lint the TypeScript code:

```sh
$ yarn lint:ts
```

### Test

Run the tests:

```sh
$ yarn test
```

### Coverage

Generate the code coverage report:

```sh
$ yarn coverage
```

### Report Gas

See the gas usage per unit test and average gas per method call:

```sh
$ REPORT_GAS=true yarn test
```

### Clean

Delete the smart contract artifacts, the coverage reports and the Hardhat cache:

```sh
$ yarn clean
```

### Deploy

Deploy the contracts to Hardhat Network:

```sh
$ yarn deploy
```

## WORK FLOW

### DEPLOY REWARD FACTORY CONTRACT

```sh
$ yarn deployfactory --network <Network Name>
```

### DEPLOY FARMING POOL

- Go to ./tasks/deployers/deployment.ts
- Go to task "deploy:Pool"
- Attach deployed factory contract address
- Pass parameters for factory contract deploy function as factoryContract.deploy("<Staking Token Address>","<Reward Token Address>",<Reward Amount>,<Reward Duration>)
- Pass parameters for factoryContract.stakingRewardsInfoByStakingToken("<Staking Token Address>")

- Deploy pool using:

```sh
$ yarn deploypool --network <Network Name>
```

### TRANSFER REWARD TOKENS TO FACTORY CONTRACT ADDRESS

### TRIGGER NOTIFY REWARDS

```sh
$ yarn notifyrewards --network <Network Name>
```

### STAKE (Optional Step)

```sh
$ yarn stake --network <Network Name>
```

Forked from
[https://github.com/Synthetixio/synthetix/tree/v2.27.2/](https://github.com/Synthetixio/synthetix/tree/v2.27.2/)
