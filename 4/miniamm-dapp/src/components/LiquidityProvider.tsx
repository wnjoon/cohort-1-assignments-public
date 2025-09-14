'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, ethers } from 'ethers';
import { CONTRACT_ADDRESSES, CHAIN_CONFIG } from '@/config/contracts';
import { MockERC20__factory, MiniAMM__factory } from '@/types';
import { showError, showSuccess } from './ErrorMessage';

export function LiquidityProvider() {
  const { address, isConnected } = useAccount();
  const [tokenAAmount, setTokenAAmount] = useState('');
  const [tokenBAmount, setTokenBAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<'none' | 'approveA' | 'approveB' | 'addLiquidity'>('none');
  
  const { writeContract, data: hash, isPending } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Check token balances and allowances
  const [tokenData, setTokenData] = useState({
    balanceA: '0',
    balanceB: '0',
    allowanceA: '0',
    allowanceB: '0',
  });

  useEffect(() => {
    if (!isConnected || !address) return;

    const fetchTokenData = async () => {
      try {
        const provider = new ethers.JsonRpcProvider(CHAIN_CONFIG.rpcUrls.default.http[0]);
        
        const tokenAContract = MockERC20__factory.connect(CONTRACT_ADDRESSES.TOKEN_A, provider);
        const tokenBContract = MockERC20__factory.connect(CONTRACT_ADDRESSES.TOKEN_B, provider);
        
        const [balanceA, balanceB, allowanceA, allowanceB] = await Promise.all([
          tokenAContract.balanceOf(address),
          tokenBContract.balanceOf(address),
          tokenAContract.allowance(address, CONTRACT_ADDRESSES.MINIAMM),
          tokenBContract.allowance(address, CONTRACT_ADDRESSES.MINIAMM),
        ]);
        
        setTokenData({
          balanceA: ethers.formatEther(balanceA),
          balanceB: ethers.formatEther(balanceB),
          allowanceA: ethers.formatEther(allowanceA),
          allowanceB: ethers.formatEther(allowanceB),
        });
      } catch (error) {
        console.error('Error fetching token data:', error);
      }
    };

    fetchTokenData();
  }, [address, isConnected, isSuccess]);

  const validateBalances = () => {
    const tokenANeeded = parseFloat(tokenAAmount || '0');
    const tokenBNeeded = parseFloat(tokenBAmount || '0');
    const balanceA = parseFloat(tokenData.balanceA);
    const balanceB = parseFloat(tokenData.balanceB);
    
    if (tokenANeeded > balanceA) {
      showError(`Insufficient Token A balance. You have ${balanceA.toFixed(4)} but need ${tokenANeeded}`);
      return false;
    }
    
    if (tokenBNeeded > balanceB) {
      showError(`Insufficient Token B balance. You have ${balanceB.toFixed(4)} but need ${tokenBNeeded}`);
      return false;
    }
    
    return true;
  };

  const needsApproval = () => {
    const tokenANeeded = parseFloat(tokenAAmount || '0');
    const tokenBNeeded = parseFloat(tokenBAmount || '0');
    const allowanceA = parseFloat(tokenData.allowanceA);
    const allowanceB = parseFloat(tokenData.allowanceB);
    
    return {
      tokenA: tokenANeeded > allowanceA,
      tokenB: tokenBNeeded > allowanceB,
    };
  };

  const executeApproval = async (token: 'A' | 'B') => {
    const neededAmount = parseFloat(token === 'A' ? tokenAAmount : tokenBAmount);
    const currentAllowance = parseFloat(token === 'A' ? tokenData.allowanceA : tokenData.allowanceB);
    const contractAddress = token === 'A' ? CONTRACT_ADDRESSES.TOKEN_A : CONTRACT_ADDRESSES.TOKEN_B;
    
    // Calculate the amount to approve (needed amount, not just the difference)
    // This ensures we have enough allowance for the transaction
    const approveAmount = neededAmount.toString();
    
    try {
      setCurrentStep(token === 'A' ? 'approveA' : 'approveB');
      
      const abi = MockERC20__factory.abi;
      
      writeContract({
        address: contractAddress as `0x${string}`,
        abi,
        functionName: 'approve',
        args: [CONTRACT_ADDRESSES.MINIAMM as `0x${string}`, parseEther(approveAmount)],
      });
    } catch (error) {
      console.error(`Error approving Token ${token}:`, error);
      showError(`Failed to approve Token ${token}. Please try again.`);
      setIsProcessing(false);
      setCurrentStep('none');
    }
  };

  const executeAddLiquidity = async () => {
    try {
      setCurrentStep('addLiquidity');
      
      const abi = MiniAMM__factory.abi;
      
      writeContract({
        address: CONTRACT_ADDRESSES.MINIAMM as `0x${string}`,
        abi,
        functionName: 'addLiquidity',
        args: [parseEther(tokenAAmount), parseEther(tokenBAmount)],
      });
    } catch (error) {
      console.error('Error adding liquidity:', error);
      showError('Failed to add liquidity. Please try again.');
      setIsProcessing(false);
      setCurrentStep('none');
    }
  };

  const handleAddLiquidity = async () => {
    if (!tokenAAmount || !tokenBAmount || parseFloat(tokenAAmount) <= 0 || parseFloat(tokenBAmount) <= 0) {
      showError('Please enter valid amounts for both tokens');
      return;
    }

    // First validate balances
    if (!validateBalances()) {
      return;
    }

    setIsProcessing(true);
    
    const approvals = needsApproval();
    
    // If no approvals needed, go straight to add liquidity
    if (!approvals.tokenA && !approvals.tokenB) {
      await executeAddLiquidity();
      return;
    }
    
    // Start approval process
    if (approvals.tokenA) {
      await executeApproval('A');
    } else if (approvals.tokenB) {
      await executeApproval('B');
    }
  };

  useEffect(() => {
    if (isSuccess && isProcessing) {
      const approvals = needsApproval();
      
      if (currentStep === 'approveA') {
        showSuccess('Token A approved successfully!');
        // Check if Token B also needs approval
        if (approvals.tokenB) {
          executeApproval('B');
        } else {
          executeAddLiquidity();
        }
      } else if (currentStep === 'approveB') {
        showSuccess('Token B approved successfully!');
        executeAddLiquidity();
      } else if (currentStep === 'addLiquidity') {
        showSuccess('Liquidity added successfully!');
        setTokenAAmount('');
        setTokenBAmount('');
        setIsProcessing(false);
        setCurrentStep('none');
      }
    }
  }, [isSuccess, currentStep, isProcessing]);

  if (!isConnected) {
    return (
      <div className="text-center text-gray-500 p-6">
        <p>Connect your wallet to provide liquidity</p>
      </div>
    );
  }

  const getButtonText = () => {
    if (!isProcessing) return 'Add Liquidity';
    
    switch (currentStep) {
      case 'approveA':
        return 'Approving Token A...';
      case 'approveB':
        return 'Approving Token B...';
      case 'addLiquidity':
        return 'Adding Liquidity...';
      default:
        return 'Processing...';
    }
  };

  return (
    <div className="space-y-6">
      {/* Token A Input */}
      <div className="border rounded-lg p-4">
        <label htmlFor="liquidityTokenA" className="block text-sm font-medium text-gray-700 mb-2">
          Token A Amount
        </label>
        <input
          id="liquidityTokenA"
          type="number"
          value={tokenAAmount}
          onChange={(e) => setTokenAAmount(e.target.value)}
          placeholder="Enter Token A amount"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isProcessing || isPending || isConfirming}
        />
      </div>

      {/* Token B Input */}
      <div className="border rounded-lg p-4">
        <label htmlFor="liquidityTokenB" className="block text-sm font-medium text-gray-700 mb-2">
          Token B Amount
        </label>
        <input
          id="liquidityTokenB"
          type="number"
          value={tokenBAmount}
          onChange={(e) => setTokenBAmount(e.target.value)}
          placeholder="Enter Token B amount"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          disabled={isProcessing || isPending || isConfirming}
        />
      </div>

      {/* Add Liquidity Button */}
      <button
        onClick={handleAddLiquidity}
        disabled={
          isProcessing || 
          isPending || 
          isConfirming || 
          !tokenAAmount || 
          !tokenBAmount
        }
        className="w-full bg-purple-600 text-white py-3 px-4 rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold"
      >
        {getButtonText()}
      </button>

      {/* Process Status */}
      {isProcessing && (
        <div className="text-sm text-blue-600 text-center">
          <p>
            {currentStep === 'approveA' && 'Step 1: Approving Token A...'}
            {currentStep === 'approveB' && 'Step 2: Approving Token B...'}
            {currentStep === 'addLiquidity' && 'Step 3: Adding Liquidity...'}
          </p>
        </div>
      )}

      {/* Transaction Status */}
      {hash && (
        <div className="text-sm text-gray-600 text-center">
          {isConfirming && <p>Waiting for confirmation...</p>}
        </div>
      )}
    </div>
  );
}
