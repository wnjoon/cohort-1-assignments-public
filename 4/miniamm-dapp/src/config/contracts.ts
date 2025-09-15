// Contract addresses for Flare Coston 2 testnet
// Tokens are automatically sorted by address to match MiniAMM contract order (tokenX < tokenY)
const TOKENS = [
  { name: 'TKX', address: '0x596aea2733aFCad39C4A26d2AaC33EFB4657D162' },
  { name: 'TKY', address: '0x6D807C61E0Fa0fDd7A0be649f1407f9aeD443072' }
];

// Sort tokens by address to match contract tokenX, tokenY order
const sortedTokens = TOKENS.sort((a, b) => a.address.localeCompare(b.address));

export const CONTRACT_ADDRESSES = {
  // MiniAMM Factory contract address
  MINIAMM_FACTORY: '0x5D5175729cA345b593ADeC96049E3daEfF14266D',
  
  // Token addresses in contract order (tokenX < tokenY)
  TOKEN_X: sortedTokens[0].address, // 0x596aea2733aFCad39C4A26d2AaC33EFB4657D162 (TKX)
  TOKEN_Y: sortedTokens[1].address, // 0x6D807C61E0Fa0fDd7A0be649f1407f9aeD443072 (TKY)
  
  // MiniAMM contract address
  MINIAMM: '0xbcC7d9A1F4a9b318a71c8C93C38FB3196D1560dB',
} as const;

// Token metadata for UI display
export const TOKEN_METADATA = {
  [CONTRACT_ADDRESSES.TOKEN_X]: {
    symbol: 'TKX',
    name: 'Token X',
  },
  [CONTRACT_ADDRESSES.TOKEN_Y]: {
    symbol: 'TKY', 
    name: 'Token Y',
  },
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
