'use client';

import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'ethers';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { MockERC20__factory } from '@/types';
import { showError } from './ErrorMessage';

export function TokenMint() {
  const { address, isConnected } = useAccount();
  const [tokenAAmount, setTokenAAmount] = useState('');
  const [tokenBAmount, setTokenBAmount] = useState('');
  
  const { writeContract, data: hash, isPending } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const mintTokenA = async () => {
    if (!tokenAAmount || parseFloat(tokenAAmount) <= 0) {
      showError('Please enter a valid amount for Token A');
      return;
    }

    try {
      const abi = MockERC20__factory.abi;
      
      writeContract({
        address: CONTRACT_ADDRESSES.TOKEN_A as `0x${string}`,
        abi,
        functionName: 'freeMintToSender',
        args: [parseEther(tokenAAmount)],
      });
    } catch (error) {
      console.error('Error minting Token A:', error);
      showError('Failed to mint Token A. Please try again.');
    }
  };

  const mintTokenB = async () => {
    if (!tokenBAmount || parseFloat(tokenBAmount) <= 0) {
      showError('Please enter a valid amount for Token B');
      return;
    }

    try {
      const abi = MockERC20__factory.abi;
      
      writeContract({
        address: CONTRACT_ADDRESSES.TOKEN_B as `0x${string}`,
        abi,
        functionName: 'freeMintToSender',
        args: [parseEther(tokenBAmount)],
      });
    } catch (error) {
      console.error('Error minting Token B:', error);
      showError('Failed to mint Token B. Please try again.');
    }
  };

  if (!isConnected) {
    return (
      <div className="text-center text-gray-500 p-6">
        <p>Connect your wallet to mint tokens</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Token A Mint */}
      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Mint Token A</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="tokenA" className="block text-sm font-medium text-gray-700 mb-2">
              Amount to mint
            </label>
            <input
              id="tokenA"
              type="number"
              value={tokenAAmount}
              onChange={(e) => setTokenAAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isPending || isConfirming}
            />
          </div>
          <button
            onClick={mintTokenA}
            disabled={isPending || isConfirming || !tokenAAmount}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isPending || isConfirming ? 'Minting...' : 'Mint Token A'}
          </button>
        </div>
      </div>

      {/* Token B Mint */}
      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Mint Token B</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="tokenB" className="block text-sm font-medium text-gray-700 mb-2">
              Amount to mint
            </label>
            <input
              id="tokenB"
              type="number"
              value={tokenBAmount}
              onChange={(e) => setTokenBAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              disabled={isPending || isConfirming}
            />
          </div>
          <button
            onClick={mintTokenB}
            disabled={isPending || isConfirming || !tokenBAmount}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isPending || isConfirming ? 'Minting...' : 'Mint Token B'}
          </button>
        </div>
      </div>

      {/* Transaction Status */}
      {hash && (
        <div className="text-sm text-gray-600 text-center">
          {isConfirming && <p>Waiting for confirmation...</p>}
          {isSuccess && (
            <p className="text-green-600">
              Transaction confirmed! Your tokens have been minted.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
