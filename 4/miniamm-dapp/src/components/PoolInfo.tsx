'use client';

import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, CHAIN_CONFIG } from '@/config/contracts';
import { MiniAMM__factory } from '@/types';

interface PoolData {
  tokenAReserve: string;
  tokenBReserve: string;
  loading: boolean;
  error: string | null;
}

export function PoolInfo() {
  const [poolData, setPoolData] = useState<PoolData>({
    tokenAReserve: '0',
    tokenBReserve: '0',
    loading: true,
    error: null,
  });

  useEffect(() => {
    const fetchPoolInfo = async () => {
      try {
        setPoolData(prev => ({ ...prev, loading: true, error: null }));
        
        const provider = new ethers.JsonRpcProvider(CHAIN_CONFIG.rpcUrls.default.http[0]);
        const miniAMMContract = MiniAMM__factory.connect(CONTRACT_ADDRESSES.MINIAMM, provider);
        
        const [xReserve, yReserve] = await Promise.all([
          miniAMMContract.xReserve(),
          miniAMMContract.yReserve(),
        ]);
        
        setPoolData({
          tokenAReserve: ethers.formatEther(xReserve),
          tokenBReserve: ethers.formatEther(yReserve),
          loading: false,
          error: null,
        });
      } catch (error) {
        console.error('Error fetching pool info:', error);
        setPoolData(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to fetch pool information',
        }));
      }
    };

    fetchPoolInfo();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchPoolInfo, 30000);
    return () => clearInterval(interval);
  }, []);

  if (poolData.loading) {
    return (
      <div className="animate-pulse">
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (poolData.error) {
    return (
      <div className="text-red-600 bg-red-50 p-4 rounded-md">
        <p>{poolData.error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center p-4 bg-gray-50 rounded-md">
        <span className="text-gray-600">Token A Reserve:</span>
        <span className="font-mono text-lg">{parseFloat(poolData.tokenAReserve).toFixed(4)}</span>
      </div>
      <div className="flex justify-between items-center p-4 bg-gray-50 rounded-md">
        <span className="text-gray-600">Token B Reserve:</span>
        <span className="font-mono text-lg">{parseFloat(poolData.tokenBReserve).toFixed(4)}</span>
      </div>
      <div className="text-sm text-gray-500 text-center">
        Pool information updates every 30 seconds
      </div>
    </div>
  );
}
