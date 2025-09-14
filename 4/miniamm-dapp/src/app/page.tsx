'use client';

import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { PoolInfo } from '../components/PoolInfo';
import { UserInfo } from '../components/UserInfo';
import { ErrorMessage } from '../components/ErrorMessage';
import { TokenMint } from '../components/TokenMint';
import { LiquidityProvider } from '../components/LiquidityProvider';
import SwapComponent from '../components/SwapComponent';
import RemoveLiquidity from '../components/RemoveLiquidity';

export default function Home() {
  const { isConnected } = useAccount();
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">MiniAMM DApp</h1>
            <ConnectButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pool Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Pool Information</h2>
            <PoolInfo />
          </div>

          {/* User Information (only shown when wallet is connected) */}
          {isConnected && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Assets</h2>
              <UserInfo />
            </div>
          )}

          {/* Welcome message when wallet is not connected */}
          {!isConnected && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Welcome to MiniAMM</h2>
              <p className="text-gray-600 mb-4">
                Connect your wallet to start trading and providing liquidity.
              </p>
              <div className="flex justify-center">
                <ConnectButton />
              </div>
            </div>
          )}
        </div>

        {/* Token Minting (only shown when wallet is connected) */}
        {isConnected && (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Mint Tokens</h2>
            <TokenMint />
          </div>
        )}

        {/* Liquidity Provider (only shown when wallet is connected) */}
        {isConnected && (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Add Liquidity</h2>
            <LiquidityProvider />
          </div>
        )}

        {/* Swap Component (only shown when wallet is connected) */}
        {isConnected && (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <SwapComponent 
              onError={(error: string) => setErrorMessage(error)} 
              onSuccess={(message: string) => setSuccessMessage(message)} 
            />
          </div>
        )}

        {/* Remove Liquidity Component (only shown when wallet is connected) */}
        {isConnected && (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <RemoveLiquidity 
              onError={(error: string) => setErrorMessage(error)} 
              onSuccess={(message: string) => setSuccessMessage(message)} 
            />
          </div>
        )}

        {/* Error/Success Message Area */}
        <div className="mt-8">
          <ErrorMessage />
          {errorMessage && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {errorMessage}
              <button 
                onClick={() => setErrorMessage('')}
                className="ml-2 text-red-500 hover:text-red-700"
              >
                ✕
              </button>
            </div>
          )}
          {successMessage && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
              {successMessage}
              <button 
                onClick={() => setSuccessMessage('')}
                className="ml-2 text-green-500 hover:text-green-700"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
