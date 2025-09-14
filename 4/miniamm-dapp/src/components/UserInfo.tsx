'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, CHAIN_CONFIG } from '@/config/contracts';
import { MockERC20__factory, MiniAMM__factory } from '@/types';

interface UserAssets {
  tokenABalance: string;
  tokenBBalance: string;
  lpTokenBalance: string;
  loading: boolean;
  error: string | null;
}

export function UserInfo() {
  const { address, isConnected } = useAccount();
  const [userAssets, setUserAssets] = useState<UserAssets>({
    tokenABalance: '0',
    tokenBBalance: '0',
    lpTokenBalance: '0',
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!isConnected || !address) {
      setUserAssets({
        tokenABalance: '0',
        tokenBBalance: '0',
        lpTokenBalance: '0',
        loading: false,
        error: null,
      });
      return;
    }

    const fetchUserAssets = async () => {
      try {
        setUserAssets(prev => ({ ...prev, loading: true, error: null }));
        
        const provider = new ethers.JsonRpcProvider(CHAIN_CONFIG.rpcUrls.default.http[0]);
        
        const tokenAContract = MockERC20__factory.connect(CONTRACT_ADDRESSES.TOKEN_A, provider);
        const tokenBContract = MockERC20__factory.connect(CONTRACT_ADDRESSES.TOKEN_B, provider);
        const miniAMMContract = MiniAMM__factory.connect(CONTRACT_ADDRESSES.MINIAMM, provider);
        
        const [tokenABalance, tokenBBalance, lpTokenBalance] = await Promise.all([
          tokenAContract.balanceOf(address),
          tokenBContract.balanceOf(address),
          miniAMMContract.balanceOf(address),
        ]);
        
        setUserAssets({
          tokenABalance: ethers.formatEther(tokenABalance),
          tokenBBalance: ethers.formatEther(tokenBBalance),
          lpTokenBalance: ethers.formatEther(lpTokenBalance),
          loading: false,
          error: null,
        });
      } catch (error) {
        console.error('Error fetching user assets:', error);
        setUserAssets(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to fetch user assets',
        }));
      }
    };

    fetchUserAssets();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchUserAssets, 30000);
    return () => clearInterval(interval);
  }, [address, isConnected]);

  if (!isConnected) {
    return null;
  }

  if (userAssets.loading) {
    return (
      <div className="animate-pulse">
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (userAssets.error) {
    return (
      <div className="text-red-600 bg-red-50 p-4 rounded-md">
        <p>{userAssets.error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center p-4 bg-blue-50 rounded-md">
        <span className="text-gray-600">Token A Balance:</span>
        <span className="font-mono text-lg">{parseFloat(userAssets.tokenABalance).toFixed(4)}</span>
      </div>
      <div className="flex justify-between items-center p-4 bg-green-50 rounded-md">
        <span className="text-gray-600">Token B Balance:</span>
        <span className="font-mono text-lg">{parseFloat(userAssets.tokenBBalance).toFixed(4)}</span>
      </div>
      <div className="flex justify-between items-center p-4 bg-purple-50 rounded-md">
        <span className="text-gray-600">LP Token Balance:</span>
        <span className="font-mono text-lg">{parseFloat(userAssets.lpTokenBalance).toFixed(4)}</span>
      </div>
      <div className="text-sm text-gray-500 text-center">
        Balances update every 30 seconds
      </div>
    </div>
  );
}
