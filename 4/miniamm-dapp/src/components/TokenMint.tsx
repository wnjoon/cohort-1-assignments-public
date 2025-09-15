'use client';

import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'ethers';
import { CONTRACT_ADDRESSES, TOKEN_METADATA } from '@/config/contracts';
import { MockERC20__factory } from '@/types';
import { showError } from './ErrorMessage';

export function TokenMint() {
  const { address, isConnected } = useAccount();
  const [tokenXAmount, setTokenXAmount] = useState('');
  const [tokenYAmount, setTokenYAmount] = useState('');
  
  const { writeContract, data: hash, isPending } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const mintTokenX = async () => {
    if (!tokenXAmount || parseFloat(tokenXAmount) <= 0) {
      showError('Please enter a valid amount for Token X');
      return;
    }

    try {
      const abi = MockERC20__factory.abi;
      
      writeContract({
        address: CONTRACT_ADDRESSES.TOKEN_X as `0x${string}`,
        abi,
        functionName: 'freeMintToSender',
        args: [parseEther(tokenXAmount)],
      });
    } catch (error) {
      console.error('Error minting Token X:', error);
      showError('Failed to mint Token X. Please try again.');
    }
  };

  const mintTokenY = async () => {
    if (!tokenYAmount || parseFloat(tokenYAmount) <= 0) {
      showError('Please enter a valid amount for Token Y');
      return;
    }

    try {
      const abi = MockERC20__factory.abi;
      
      writeContract({
        address: CONTRACT_ADDRESSES.TOKEN_Y as `0x${string}`,
        abi,
        functionName: 'freeMintToSender',
        args: [parseEther(tokenYAmount)],
      });
    } catch (error) {
      console.error('Error minting Token Y:', error);
      showError('Failed to mint Token Y. Please try again.');
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
      {/* Token X Mint */}
      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Mint {TOKEN_METADATA[CONTRACT_ADDRESSES.TOKEN_X].name} ({TOKEN_METADATA[CONTRACT_ADDRESSES.TOKEN_X].symbol})
        </h3>
        <div className="text-xs text-gray-500 mb-2">
          Address: {CONTRACT_ADDRESSES.TOKEN_X}
        </div>
        <div className="space-y-4">
          <div>
            <label htmlFor="tokenX" className="block text-sm font-medium text-gray-700 mb-2">
              Amount to mint
            </label>
            <input
              id="tokenX"
              type="number"
              value={tokenXAmount}
              onChange={(e) => setTokenXAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isPending || isConfirming}
            />
          </div>
          <button
            onClick={mintTokenX}
            disabled={isPending || isConfirming || !tokenXAmount}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isPending || isConfirming ? 'Minting...' : `Mint ${TOKEN_METADATA[CONTRACT_ADDRESSES.TOKEN_X].symbol}`}
          </button>
        </div>
      </div>

      {/* Token Y Mint */}
      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Mint {TOKEN_METADATA[CONTRACT_ADDRESSES.TOKEN_Y].name} ({TOKEN_METADATA[CONTRACT_ADDRESSES.TOKEN_Y].symbol})
        </h3>
        <div className="text-xs text-gray-500 mb-2">
          Address: {CONTRACT_ADDRESSES.TOKEN_Y}
        </div>
        <div className="space-y-4">
          <div>
            <label htmlFor="tokenY" className="block text-sm font-medium text-gray-700 mb-2">
              Amount to mint
            </label>
            <input
              id="tokenY"
              type="number"
              value={tokenYAmount}
              onChange={(e) => setTokenYAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              disabled={isPending || isConfirming}
            />
          </div>
          <button
            onClick={mintTokenY}
            disabled={isPending || isConfirming || !tokenYAmount}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isPending || isConfirming ? 'Minting...' : `Mint ${TOKEN_METADATA[CONTRACT_ADDRESSES.TOKEN_Y].symbol}`}
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
