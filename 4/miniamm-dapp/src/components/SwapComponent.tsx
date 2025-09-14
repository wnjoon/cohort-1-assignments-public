'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { CONTRACT_ADDRESSES } from '../config/contracts';

interface SwapComponentProps {
  onError: (error: string) => void;
  onSuccess: (message: string) => void;
}

export default function SwapComponent({ onError, onSuccess }: SwapComponentProps) {
  const { address } = useAccount();
  const [swapDirection, setSwapDirection] = useState<'AtoB' | 'BtoA'>('AtoB');
  const [inputAmount, setInputAmount] = useState('');
  const [expectedOutput, setExpectedOutput] = useState('0');
  const [isCalculating, setIsCalculating] = useState(false);

  // Determine token mapping based on contract logic (tokenX < tokenY by address)
  const isTokenALower = CONTRACT_ADDRESSES.TOKEN_A.toLowerCase() < CONTRACT_ADDRESSES.TOKEN_B.toLowerCase();
  const tokenXAddress = isTokenALower ? CONTRACT_ADDRESSES.TOKEN_A : CONTRACT_ADDRESSES.TOKEN_B;
  const tokenYAddress = isTokenALower ? CONTRACT_ADDRESSES.TOKEN_B : CONTRACT_ADDRESSES.TOKEN_A;

  // Read pool reserves using individual calls like PoolInfo component
  const { data: xReserve } = useReadContract({
    address: CONTRACT_ADDRESSES.MINIAMM as `0x${string}`,
    abi: [
      {
        inputs: [],
        name: 'xReserve',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
      },
    ],
    functionName: 'xReserve',
  });

  const { data: yReserve } = useReadContract({
    address: CONTRACT_ADDRESSES.MINIAMM as `0x${string}`,
    abi: [
      {
        inputs: [],
        name: 'yReserve',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
      },
    ],
    functionName: 'yReserve',
  });

  // Read user token balances
  const { data: tokenABalance } = useReadContract({
    address: CONTRACT_ADDRESSES.TOKEN_A as `0x${string}`,
    abi: [
      {
        inputs: [{ name: 'account', type: 'address' }],
        name: 'balanceOf',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
      },
    ],
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  const { data: tokenBBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.TOKEN_B as `0x${string}`,
    abi: [
      {
        inputs: [{ name: 'account', type: 'address' }],
        name: 'balanceOf',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
      },
    ],
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  // Read token allowances
  const { data: tokenAAllowance } = useReadContract({
    address: CONTRACT_ADDRESSES.TOKEN_A as `0x${string}`,
    abi: [
      {
        inputs: [
          { name: 'owner', type: 'address' },
          { name: 'spender', type: 'address' },
        ],
        name: 'allowance',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
      },
    ],
    functionName: 'allowance',
    args: address ? [address, CONTRACT_ADDRESSES.MINIAMM] : undefined,
  });

  const { data: tokenBAllowance } = useReadContract({
    address: CONTRACT_ADDRESSES.TOKEN_B as `0x${string}`,
    abi: [
      {
        inputs: [
          { name: 'owner', type: 'address' },
          { name: 'spender', type: 'address' },
        ],
        name: 'allowance',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
      },
    ],
    functionName: 'allowance',
    args: address ? [address, CONTRACT_ADDRESSES.MINIAMM] : undefined,
  });

  const { writeContract: writeApprove, data: approveHash } = useWriteContract();
  const { writeContract: writeSwap, data: swapHash } = useWriteContract();

  const { isLoading: isApproveLoading, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  const { isLoading: isSwapLoading, isSuccess: isSwapSuccess } = useWaitForTransactionReceipt({
    hash: swapHash,
  });

  // Calculate expected output amount
  useEffect(() => {
    if (!xReserve || !yReserve || !inputAmount || inputAmount === '0') {
      setExpectedOutput('0');
      return;
    }

    setIsCalculating(true);
    
    try {
      const inputAmountWei = parseEther(inputAmount);
      const xReserveBigInt = xReserve as bigint;
      const yReserveBigInt = yReserve as bigint;
      
      if (xReserveBigInt === 0n || yReserveBigInt === 0n) {
        setExpectedOutput('0');
        setIsCalculating(false);
        return;
      }

      let outputAmount: bigint;
      
      // Determine which reserve to use based on actual token mapping
      const isSwappingAtoB = swapDirection === 'AtoB';
      const isATokenX = isTokenALower;
      
      if ((isSwappingAtoB && isATokenX) || (!isSwappingAtoB && !isATokenX)) {
        // Swapping tokenX for tokenY
        const amountInWithFee = inputAmountWei * 997n;
        const numerator = amountInWithFee * yReserveBigInt;
        const denominator = (xReserveBigInt * 1000n) + amountInWithFee;
        outputAmount = numerator / denominator;
      } else {
        // Swapping tokenY for tokenX
        const amountInWithFee = inputAmountWei * 997n;
        const numerator = amountInWithFee * xReserveBigInt;
        const denominator = (yReserveBigInt * 1000n) + amountInWithFee;
        outputAmount = numerator / denominator;
      }

      setExpectedOutput(formatEther(outputAmount));
    } catch (error) {
      console.error('Error calculating output:', error);
      setExpectedOutput('0');
    }
    
    setIsCalculating(false);
  }, [inputAmount, swapDirection, xReserve, yReserve, isTokenALower]);

  // Handle approve success
  useEffect(() => {
    if (isApproveSuccess) {
      onSuccess('Token approval successful! Proceeding with swap...');
      // Automatically proceed with swap after approval
      setTimeout(() => {
        handleSwap();
      }, 1000); // Small delay to ensure approval is processed
    }
  }, [isApproveSuccess, onSuccess]);

  // Handle swap success
  useEffect(() => {
    if (isSwapSuccess) {
      onSuccess('Swap completed successfully!');
      setInputAmount('');
      setExpectedOutput('0');
    }
  }, [isSwapSuccess, onSuccess]);

  // Handle transaction errors
  useEffect(() => {
    if (approveHash && !isApproveLoading && !isApproveSuccess) {
      // Check for approval failure after some time
      const timer = setTimeout(() => {
        if (!isApproveSuccess) {
          onError('Token approval may have failed. Please try again.');
        }
      }, 30000); // 30 seconds timeout
      
      return () => clearTimeout(timer);
    }
  }, [approveHash, isApproveLoading, isApproveSuccess, onError]);

  useEffect(() => {
    if (swapHash && !isSwapLoading && !isSwapSuccess) {
      // Check for swap failure after some time
      const timer = setTimeout(() => {
        if (!isSwapSuccess) {
          onError('Swap transaction may have failed. Please try again.');
        }
      }, 30000); // 30 seconds timeout
      
      return () => clearTimeout(timer);
    }
  }, [swapHash, isSwapLoading, isSwapSuccess, onError]);

  const validateSwap = (): string | null => {
    if (!inputAmount || parseFloat(inputAmount) <= 0) {
      return 'Please enter a valid amount';
    }

    const inputAmountWei = parseEther(inputAmount);
    
    if (swapDirection === 'AtoB') {
      if (!tokenABalance || inputAmountWei > (tokenABalance as bigint)) {
        return 'Insufficient Token A balance';
      }
    } else {
      if (!tokenBBalance || inputAmountWei > (tokenBBalance as bigint)) {
        return 'Insufficient Token B balance';
      }
    }

    if (!xReserve || !yReserve) {
      return 'Pool reserves not loaded';
    }

    const xReserveBigInt = xReserve as bigint;
    const yReserveBigInt = yReserve as bigint;
    if (xReserveBigInt === 0n || yReserveBigInt === 0n) {
      return 'No liquidity in pool';
    }

    // Check if swap amount exceeds available liquidity
    if (swapDirection === 'AtoB' && inputAmountWei >= xReserveBigInt) {
      return 'Swap amount exceeds available liquidity';
    }
    if (swapDirection === 'BtoA' && inputAmountWei >= yReserveBigInt) {
      return 'Swap amount exceeds available liquidity';
    }

    return null;
  };

  const needsApproval = (): boolean => {
    if (!inputAmount) return false;
    
    const inputAmountWei = parseEther(inputAmount);
    
    if (swapDirection === 'AtoB') {
      return !tokenAAllowance || inputAmountWei > (tokenAAllowance as bigint);
    } else {
      return !tokenBAllowance || inputAmountWei > (tokenBAllowance as bigint);
    }
  };

  const handleApprove = async () => {
    try {
      const tokenAddress = swapDirection === 'AtoB' ? CONTRACT_ADDRESSES.TOKEN_A : CONTRACT_ADDRESSES.TOKEN_B;
      const inputAmountWei = parseEther(inputAmount);

      writeApprove({
        address: tokenAddress as `0x${string}`,
        abi: [
          {
            inputs: [
              { name: 'spender', type: 'address' },
              { name: 'amount', type: 'uint256' },
            ],
            name: 'approve',
            outputs: [{ name: '', type: 'bool' }],
            stateMutability: 'nonpayable',
            type: 'function',
          },
        ],
        functionName: 'approve',
        args: [CONTRACT_ADDRESSES.MINIAMM, inputAmountWei],
      });
    } catch (error: any) {
      onError(`Approval failed: ${error.message || 'Unknown error'}`);
    }
  };

  const handleSwap = async () => {
    const validationError = validateSwap();
    if (validationError) {
      onError(validationError);
      return;
    }

    try {
      const inputAmountWei = parseEther(inputAmount);
      
      // Determine correct swap arguments based on token mapping
      const isSwappingAtoB = swapDirection === 'AtoB';
      const isATokenX = isTokenALower;
      
      let swapArgs: readonly [bigint, bigint];
      
      if ((isSwappingAtoB && isATokenX) || (!isSwappingAtoB && !isATokenX)) {
        // Swapping tokenX for tokenY
        swapArgs = [inputAmountWei, 0n];
      } else {
        // Swapping tokenY for tokenX
        swapArgs = [0n, inputAmountWei];
      }

      writeSwap({
        address: CONTRACT_ADDRESSES.MINIAMM as `0x${string}`,
        abi: [
          {
            inputs: [
              { name: 'xAmountIn', type: 'uint256' },
              { name: 'yAmountIn', type: 'uint256' },
            ],
            name: 'swap',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
          },
        ],
        functionName: 'swap',
        args: swapArgs,
      });
    } catch (error: any) {
      onError(`Swap failed: ${error.message || 'Unknown error'}`);
    }
  };

  const handleSwapWithApproval = async () => {
    if (needsApproval()) {
      handleApprove();
    } else {
      handleSwap();
    }
  };

  const switchDirection = () => {
    setSwapDirection(swapDirection === 'AtoB' ? 'BtoA' : 'AtoB');
    setInputAmount('');
    setExpectedOutput('0');
  };

  const isLoading = isApproveLoading || isSwapLoading;
  const canSwap = !isLoading && inputAmount && parseFloat(inputAmount) > 0;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Swap Tokens</h2>
      
      {/* Swap Direction */}
      <div className="mb-4">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="text-center flex-1">
            <div className="text-sm text-gray-600">From</div>
            <div className="font-semibold">
              {swapDirection === 'AtoB' ? 'Token A' : 'Token B'}
            </div>
            <div className="text-xs text-gray-500">
              Balance: {swapDirection === 'AtoB' 
                ? (tokenABalance ? formatEther(tokenABalance as bigint) : '0')
                : (tokenBBalance ? formatEther(tokenBBalance as bigint) : '0')
              }
            </div>
          </div>
          
          <button
            onClick={switchDirection}
            className="mx-4 p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors cursor-pointer disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            ⇄
          </button>
          
          <div className="text-center flex-1">
            <div className="text-sm text-gray-600">To</div>
            <div className="font-semibold">
              {swapDirection === 'AtoB' ? 'Token B' : 'Token A'}
            </div>
            <div className="text-xs text-gray-500">
              Balance: {swapDirection === 'AtoB' 
                ? (tokenBBalance ? formatEther(tokenBBalance as bigint) : '0')
                : (tokenABalance ? formatEther(tokenABalance as bigint) : '0')
              }
            </div>
          </div>
        </div>
      </div>

      {/* Input Amount */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Amount to Swap
        </label>
        <input
          type="number"
          value={inputAmount}
          onChange={(e) => setInputAmount(e.target.value)}
          placeholder="0.0"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isLoading}
        />
      </div>

      {/* Expected Output */}
      <div className="mb-6">
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">Expected Output</div>
          <div className="text-lg font-semibold">
            {isCalculating ? 'Calculating...' : `${expectedOutput} ${swapDirection === 'AtoB' ? 'Token B' : 'Token A'}`}
          </div>
          {parseFloat(expectedOutput) > 0 && (
            <div className="text-xs text-gray-500 mt-1">
              Including 0.3% trading fee
            </div>
          )}
        </div>
      </div>

      {/* Swap Button */}
      <button
        onClick={handleSwapWithApproval}
        disabled={!canSwap}
        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
          canSwap
            ? 'bg-blue-500 hover:bg-blue-600 text-white cursor-pointer'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        {isLoading
          ? isApproveLoading
            ? 'Approving...'
            : 'Swapping...'
          : needsApproval()
          ? `Approve & Swap`
          : 'Swap'
        }
      </button>

      {/* Status Messages */}
      {isApproveLoading && (
        <div className="mt-3 text-sm text-blue-600">
          Step 1/2: Approving token spending...
        </div>
      )}
      {isApproveSuccess && !isSwapLoading && !isSwapSuccess && (
        <div className="mt-3 text-sm text-green-600">
          Step 1/2: Approval complete! Click swap again to proceed.
        </div>
      )}
      {isSwapLoading && (
        <div className="mt-3 text-sm text-blue-600">
          Step 2/2: Processing swap transaction...
        </div>
      )}
    </div>
  );
}
