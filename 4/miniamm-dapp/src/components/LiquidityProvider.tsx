'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther, parseUnits, formatUnits } from 'viem';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, TOKEN_METADATA, CHAIN_CONFIG } from '../config/contracts';
import { MockERC20__factory, MiniAMM__factory } from '@/types';
import { showError, showSuccess } from './ErrorMessage';

export function LiquidityProvider() {
  const { address, isConnected } = useAccount();
  const [tokenXAmount, setTokenXAmount] = useState('');
  const [tokenYAmount, setTokenYAmount] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [lastEditedField, setLastEditedField] = useState<'X' | 'Y' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<'none' | 'approveX' | 'approveY' | 'addLiquidity'>('none');
  const [nextStep, setNextStep] = useState<'none' | 'approveY' | 'addLiquidity'>('none');
  
  const { writeContract, data: hash, isPending } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Check token balances and allowances
  const [tokenData, setTokenData] = useState({
    balanceX: '0',
    balanceY: '0',
    allowanceX: '0',
    allowanceY: '0',
  });

  // Pool reserves for ratio calculation
  const [poolData, setPoolData] = useState({
    xReserve: '0', // TOKEN_X reserve
    yReserve: '0', // TOKEN_Y reserve
  });

  useEffect(() => {
    if (!isConnected || !address) return;

    const fetchTokenData = async () => {
      try {
        const provider = new ethers.JsonRpcProvider(CHAIN_CONFIG.rpcUrls.default.http[0]);
        
        const tokenXContract = MockERC20__factory.connect(CONTRACT_ADDRESSES.TOKEN_X, provider);
        const tokenYContract = MockERC20__factory.connect(CONTRACT_ADDRESSES.TOKEN_Y, provider);
        
        const miniAMMContract = MiniAMM__factory.connect(CONTRACT_ADDRESSES.MINIAMM, provider);
        
        const [balanceX, balanceY, allowanceX, allowanceY, xReserve, yReserve] = await Promise.all([
          tokenXContract.balanceOf(address),
          tokenYContract.balanceOf(address),
          tokenXContract.allowance(address, CONTRACT_ADDRESSES.MINIAMM),
          tokenYContract.allowance(address, CONTRACT_ADDRESSES.MINIAMM),
          miniAMMContract.xReserve(),
          miniAMMContract.yReserve(),
        ]);
        
        setTokenData({
          balanceX: formatEther(balanceX),
          balanceY: formatEther(balanceY),
          allowanceX: formatEther(allowanceX),
          allowanceY: formatEther(allowanceY),
        });

        // Set pool reserves directly (no mapping needed since we use TOKEN_X, TOKEN_Y)
        console.log('🔍 Contract Reserves:');
        console.log('  xReserve (TOKEN_X):', formatEther(xReserve));
        console.log('  yReserve (TOKEN_Y):', formatEther(yReserve));

        setPoolData({
          xReserve: formatEther(xReserve),
          yReserve: formatEther(yReserve),
        });
      } catch (error) {
        console.error('Error fetching token data:', error);
      }
    };

    fetchTokenData();
  }, [address, isConnected, isSuccess]);

  // Calculate Token Y amount based on Token X input and pool ratio
  // Uses same calculation as contract: yAmountRequired = (yReserve * xAmountIn) / xReserve
  const calculateTokenYFromX = useCallback((xAmount: string) => {
    if (!xAmount || parseFloat(xAmount) <= 0 || parseFloat(poolData.xReserve) <= 0) {
      setTokenYAmount('');
      return;
    }

    setIsCalculating(true);
    try {
      // Convert to wei for precise calculation (same as contract)
      const xAmountWei = parseEther(xAmount);
      const xReserveWei = parseEther(poolData.xReserve);
      const yReserveWei = parseEther(poolData.yReserve);
      
      if (xReserveWei > 0n && yReserveWei > 0n) {
        // Contract calculation: yAmountRequired = (yReserve * xAmountIn) / xReserve
        const yAmountRequiredWei = (yReserveWei * xAmountWei) / xReserveWei;
        const calculatedY = formatEther(yAmountRequiredWei);
        setTokenYAmount(calculatedY);
        
        console.log('🔍 Y Amount Calculation:');
        console.log('  xAmount:', xAmount);
        console.log('  xReserve:', poolData.xReserve);
        console.log('  yReserve:', poolData.yReserve);
        console.log('  calculatedY:', calculatedY);
      }
    } catch (error) {
      console.error('Error calculating token Y amount:', error);
    } finally {
      setIsCalculating(false);
    }
  }, [poolData.xReserve, poolData.yReserve]);

  // Calculate Token X amount based on Token Y input and pool ratio
  // Uses same calculation as contract: xAmountRequired = (xReserve * yAmountIn) / yReserve
  const calculateTokenXFromY = useCallback((yAmount: string) => {
    if (!yAmount || parseFloat(yAmount) <= 0 || parseFloat(poolData.yReserve) <= 0) {
      setTokenXAmount('');
      return;
    }

    setIsCalculating(true);
    try {
      // Convert to wei for precise calculation (same as contract)
      const yAmountWei = parseEther(yAmount);
      const xReserveWei = parseEther(poolData.xReserve);
      const yReserveWei = parseEther(poolData.yReserve);
      
      if (xReserveWei > 0n && yReserveWei > 0n) {
        // Contract calculation: xAmountRequired = (xReserve * yAmountIn) / yReserve
        const xAmountRequiredWei = (xReserveWei * yAmountWei) / yReserveWei;
        const calculatedX = formatEther(xAmountRequiredWei);
        setTokenXAmount(calculatedX);
        
        console.log('🔍 X Amount Calculation:');
        console.log('  yAmount:', yAmount);
        console.log('  xReserve:', poolData.xReserve);
        console.log('  yReserve:', poolData.yReserve);
        console.log('  calculatedX:', calculatedX);
      }
    } catch (error) {
      console.error('Error calculating token X amount:', error);
    } finally {
      setIsCalculating(false);
    }
  }, [poolData.xReserve, poolData.yReserve]);

  // Handle Token X input change
  const handleTokenXChange = (value: string) => {
    setTokenXAmount(value);
    setLastEditedField('X');
    
    if (parseFloat(poolData.xReserve) > 0 && parseFloat(poolData.yReserve) > 0) {
      calculateTokenYFromX(value);
    }
  };

  // Handle Token Y input change
  const handleTokenYChange = (value: string) => {
    setTokenYAmount(value);
    setLastEditedField('Y');
    
    if (parseFloat(poolData.xReserve) > 0 && parseFloat(poolData.yReserve) > 0) {
      calculateTokenXFromY(value);
    }
  };

  // Clear all amounts
  const clearAmounts = () => {
    setTokenXAmount('');
    setTokenYAmount('');
    setLastEditedField(null);
  };

  // Validate balances
  const validateBalances = () => {
    const xAmount = parseFloat(tokenXAmount);
    const yAmount = parseFloat(tokenYAmount);
    const balanceX = parseFloat(tokenData.balanceX);
    const balanceY = parseFloat(tokenData.balanceY);

    if (xAmount > balanceX) {
      showError(`Insufficient Token X balance. You have ${tokenData.balanceX}, but trying to add ${tokenXAmount}`);
      return false;
    }

    if (yAmount > balanceY) {
      showError(`Insufficient Token Y balance. You have ${tokenData.balanceY}, but trying to add ${tokenYAmount}`);
      return false;
    }

    return true;
  };

  // Check if approvals are needed
  const needsApproval = () => {
    const xAmount = parseFloat(tokenXAmount);
    const yAmount = parseFloat(tokenYAmount);
    const allowanceX = parseFloat(tokenData.allowanceX);
    const allowanceY = parseFloat(tokenData.allowanceY);

    const needsXApproval = xAmount > 0 && xAmount > allowanceX;
    const needsYApproval = yAmount > 0 && yAmount > allowanceY;

    if (needsXApproval && needsYApproval) {
      return 'approveX'; // Start with X approval
    } else if (needsXApproval) {
      return 'approveX';
    } else if (needsYApproval) {
      return 'approveY';
    }
    return 'addLiquidity';
  };

  // Execute add liquidity transaction
  const executeAddLiquidity = useCallback(async () => {
    try {
      setCurrentStep('addLiquidity');
      
      const abi = MiniAMM__factory.abi;
      
      // Simple: TOKEN_X and TOKEN_Y are already in correct order
      const xAmount = parseEther(tokenXAmount);
      const yAmount = parseEther(tokenYAmount);
      
      console.log('🔍 Debug Info:');
      console.log('  TOKEN_X Address:', CONTRACT_ADDRESSES.TOKEN_X);
      console.log('  TOKEN_Y Address:', CONTRACT_ADDRESSES.TOKEN_Y);
      console.log('  UI Token X Amount:', tokenXAmount);
      console.log('  UI Token Y Amount:', tokenYAmount);
      console.log('  Contract xAmount (wei):', xAmount.toString());
      console.log('  Contract yAmount (wei):', yAmount.toString());
      console.log('  Pool xReserve:', poolData.xReserve);
      console.log('  Pool yReserve:', poolData.yReserve);
      
      writeContract({
        address: CONTRACT_ADDRESSES.MINIAMM as `0x${string}`,
        abi,
        functionName: 'addLiquidity',
        args: [xAmount, yAmount],
      });
    } catch (error) {
      console.error('Error adding liquidity:', error);
      showError('Failed to add liquidity. Please try again.');
      setIsProcessing(false);
      setCurrentStep('none');
    }
  }, [tokenXAmount, tokenYAmount, writeContract, poolData.xReserve, poolData.yReserve]);

  const handleAddLiquidity = async () => {
    if (!tokenXAmount || !tokenYAmount || parseFloat(tokenXAmount) <= 0 || parseFloat(tokenYAmount) <= 0) {
      showError('Please enter valid amounts for both tokens');
      return;
    }

    // First validate balances
    if (!validateBalances()) {
      return;
    }

    setIsProcessing(true);

    const firstStep = needsApproval();
    
    if (firstStep === 'approveX') {
      setCurrentStep('approveX');
      setNextStep(parseFloat(tokenData.allowanceY) < parseFloat(tokenYAmount) ? 'approveY' : 'addLiquidity');
    } else if (firstStep === 'approveY') {
      setCurrentStep('approveY');
      setNextStep('addLiquidity');
    } else {
      await executeAddLiquidity();
    }
  };

  // Handle transaction success
  useEffect(() => {
    if (isSuccess && currentStep !== 'none') {
      if (currentStep === 'approveX') {
        showSuccess('Token X approval successful!');
        if (nextStep === 'approveY') {
          setCurrentStep('approveY');
          setNextStep('addLiquidity');
        } else {
          executeAddLiquidity();
        }
      } else if (currentStep === 'approveY') {
        showSuccess('Token Y approval successful!');
        executeAddLiquidity();
      } else if (currentStep === 'addLiquidity') {
        showSuccess('Liquidity added successfully!');
        clearAmounts();
        setIsProcessing(false);
        setCurrentStep('none');
        setNextStep('none');
      }
    }
  }, [isSuccess, currentStep, nextStep, executeAddLiquidity]);

  // Approve Token X
  const approveTokenX = () => {
    const abi = MockERC20__factory.abi;
    writeContract({
      address: CONTRACT_ADDRESSES.TOKEN_X as `0x${string}`,
      abi,
      functionName: 'approve',
      args: [CONTRACT_ADDRESSES.MINIAMM as `0x${string}`, parseEther(tokenXAmount)],
    });
  };

  // Approve Token Y
  const approveTokenY = () => {
    const abi = MockERC20__factory.abi;
    writeContract({
      address: CONTRACT_ADDRESSES.TOKEN_Y as `0x${string}`,
      abi,
      functionName: 'approve',
      args: [CONTRACT_ADDRESSES.MINIAMM as `0x${string}`, parseEther(tokenYAmount)],
    });
  };

  const getButtonText = () => {
    if (isPending || isConfirming) {
      if (currentStep === 'approveX') return 'Approving Token X...';
      if (currentStep === 'approveY') return 'Approving Token Y...';
      if (currentStep === 'addLiquidity') return 'Adding Liquidity...';
    }

    if (currentStep === 'approveX') return 'Approve Token X';
    if (currentStep === 'approveY') return 'Approve Token Y';
    
    return 'Add Liquidity';
  };

  const handleButtonClick = () => {
    if (currentStep === 'approveX') {
      approveTokenX();
    } else if (currentStep === 'approveY') {
      approveTokenY();
    } else {
      handleAddLiquidity();
    }
  };

  const isButtonDisabled = () => {
    if (!isConnected || !tokenXAmount || !tokenYAmount) return true;
    if (parseFloat(tokenXAmount) <= 0 || parseFloat(tokenYAmount) <= 0) return true;
    if (isPending || isConfirming) return true;
    return false;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Add Liquidity</h2>
      
      {/* Pool Status */}
      {parseFloat(poolData.xReserve) > 0 && parseFloat(poolData.yReserve) > 0 && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">Pool Status</h3>
          <div className="text-sm text-blue-700">
            <p>Token X Reserve: {parseFloat(poolData.xReserve).toFixed(4)}</p>
            <p>Token Y Reserve: {parseFloat(poolData.yReserve).toFixed(4)}</p>
            <p>Ratio (X:Y): 1 : {(parseFloat(poolData.yReserve) / parseFloat(poolData.xReserve)).toFixed(4)}</p>
          </div>
        </div>
      )}

      {/* Token X Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {TOKEN_METADATA[CONTRACT_ADDRESSES.TOKEN_X].name} ({TOKEN_METADATA[CONTRACT_ADDRESSES.TOKEN_X].symbol})
        </label>
        <div className="text-xs text-gray-500 mb-1">
          Address: {CONTRACT_ADDRESSES.TOKEN_X}
        </div>
        <input
          type="number"
          value={tokenXAmount}
          onChange={(e) => handleTokenXChange(e.target.value)}
          placeholder="0.0"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isCalculating && lastEditedField === 'Y'}
        />
        <div className="text-xs text-gray-500 mt-1">
          Balance: {parseFloat(tokenData.balanceX).toFixed(4)}
        </div>
      </div>

      {/* Token Y Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {TOKEN_METADATA[CONTRACT_ADDRESSES.TOKEN_Y].name} ({TOKEN_METADATA[CONTRACT_ADDRESSES.TOKEN_Y].symbol})
        </label>
        <div className="text-xs text-gray-500 mb-1">
          Address: {CONTRACT_ADDRESSES.TOKEN_Y}
        </div>
        <input
          type="number"
          value={tokenYAmount}
          onChange={(e) => handleTokenYChange(e.target.value)}
          placeholder="0.0"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isCalculating && lastEditedField === 'X'}
        />
        <div className="text-xs text-gray-500 mt-1">
          Balance: {parseFloat(tokenData.balanceY).toFixed(4)}
        </div>
      </div>

      {/* Pool ratio info */}
      {parseFloat(poolData.xReserve) > 0 && parseFloat(poolData.yReserve) > 0 && (
        <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
          <p className="text-sm text-yellow-800">
            💡 Pool exists! Token amounts will be calculated automatically to maintain the current ratio.
          </p>
        </div>
      )}

      {/* Add Liquidity Button */}
      <button
        onClick={handleButtonClick}
        disabled={isButtonDisabled()}
        className={`w-full py-3 px-4 rounded-md font-medium ${
          isButtonDisabled()
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {getButtonText()}
      </button>

      {/* Clear Button */}
      <button
        onClick={clearAmounts}
        className="w-full mt-2 py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        disabled={isPending || isConfirming}
      >
        Clear
      </button>
    </div>
  );
}
