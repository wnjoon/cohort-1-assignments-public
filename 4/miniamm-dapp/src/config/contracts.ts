// Contract addresses for Flare Coston 2 testnet
export const CONTRACT_ADDRESSES = {
  // MiniAMM Factory contract address
  MINIAMM_FACTORY: '0x5D5175729cA345b593ADeC96049E3daEfF14266D', // To be filled by user
  
  // Token addresses
  TOKEN_A: '0x6D807C61E0Fa0fDd7A0be649f1407f9aeD443072', // To be filled by user
  TOKEN_B: '0x596aea2733aFCad39C4A26d2AaC33EFB4657D162', // To be filled by user
  
  // MiniAMM contract address (will be created by factory)
  MINIAMM: '0xbcC7d9A1F4a9b318a71c8C93C38FB3196D1560dB', // To be filled by user
} as const;

// Chain configuration for Flare Coston 2 testnet
export const FLARE_COSTON2_CHAIN_ID = 114;

export const CHAIN_CONFIG = {
  id: FLARE_COSTON2_CHAIN_ID,
  name: 'Flare Testnet Coston2',
  network: 'coston2',
  nativeCurrency: {
    decimals: 18,
    name: 'Coston2 Flare',
    symbol: 'C2FLR',
  },
  rpcUrls: {
    public: { http: ['https://coston2-api.flare.network/ext/bc/C/rpc'] },
    default: { http: ['https://coston2-api.flare.network/ext/bc/C/rpc'] },
  },
  blockExplorers: {
    default: { name: 'Coston2 Explorer', url: 'https://coston2-explorer.flare.network' },
  },
} as const;
