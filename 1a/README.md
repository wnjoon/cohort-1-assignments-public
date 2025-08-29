# MiniAMM

Install [foundry](https://getfoundry.sh/forge/overview/) and initialize the forge workspace.

Go to [the faucet](https://faucet.flare.network/coston2) and input your EVM wallet address to get C2FLR testnet token. Use this wallet to deploy your contract.

## Requirements

`MiniAMM.sol` has two features available to users:
1. Add liquidity: users supply two tokens at the same time. Essentially, this function transfers a pair of tokens into the contract, thereby increasing the $k$. However, the ratio of $x$ to $y$ must stay constant, except for the first time the liquidity is supplied.
1. Swap: users can swap $x$ amount of token into $y$ amount of token, keeping $k$ constant. Essentially, this transfers $x$ amount of token into the contract, and transfers out $y$ amount of token to the user, while keeping $k$ constant.

To be able to test MiniAMM, you need to deploy two different mock ERC-20 tokens:
1. Complete MockERC20 contract in `MockERC20.sol`. `freeMintTo` must mint `amount` tokens to `to`. `freeMintToSender` mints `amount` tokens to `msg.sender`. These functions must be callable by any address so that minting is available for anyone.

You can test if your contracts are working correctly by running `forge test`. **Your goal is to make all tests pass without hardcoding the answers into your contracts.**

After that, **deploy and verify** two different `MockERC20` contracts with arbitrary names and symbols you choose, as well as `MiniAMM` contract to [Flare Coston2 Testnet](https://coston2.testnet.flarescan.com/). **To verify** means your contract code will be visible on a blockchain explorer. You will need to use [the faucet](https://faucet.flare.network/coston2) to fund your deployer account.

`MiniAMM` contract should take those two `MockERC20` contract addresses as `tokenX` and `tokenY` respectively.

### Deliverables

Once you are done with everything, you would be left with:
- A complete `MiniAMM.sol` implementation
- A complete `MockERC20.sol` implementation
- A complete `MiniAMM.s.sol` implementation
- Deployment addresses of `MiniAMM`, and two `MockERC20` contracts on https://coston2.testnet.flarescan.com/
- All tests under `test` folder passing with `forge test`
