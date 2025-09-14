'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { CONTRACT_ADDRESSES } from '../config/contracts';

interface RemoveLiquidityProps {
  onError: (error: string) => void;
  onSuccess: (message: string) => void;
}

export default function RemoveLiquidity({ onError, onSuccess }: RemoveLiquidityProps) {
  const { address } = useAccount();
  const [lpAmount, setLpAmount] = useState('');
  const [expectedTokenA, setExpectedTokenA] = useState('0');
  const [expectedTokenB, setExpectedTokenB] = useState('0');
  const [isCalculating, setIsCalculating] = useState(false);

  // Read user LP token balance
  const { data: lpBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.MINIAMM as `0x${string}`,
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

  // Read total LP supply
  const { data: totalSupply } = useReadContract({
    address: CONTRACT_ADDRESSES.MINIAMM as `0x${string}`,
    abi: [
      {
        inputs: [],
        name: 'totalSupply',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
      },
    ],
    functionName: 'totalSupply',
  });

  // Read pool reserves
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

  const { writeContract: writeRemoveLiquidity, data: removeLiquidityHash } = useWriteContract();

  const { isLoading: isRemoveLiquidityLoading, isSuccess: isRemoveLiquiditySuccess } = useWaitForTransactionReceipt({
    hash: removeLiquidityHash,
  });

  // Determine token mapping based on contract logic (tokenX < tokenY by address)
  const isTokenALower = CONTRACT_ADDRESSES.TOKEN_A.toLowerCase() < CONTRACT_ADDRESSES.TOKEN_B.toLowerCase();

  // Calculate expected token amounts when removing liquidity
  useEffect(() => {
    if (!lpAmount || !totalSupply || !xReserve || !yReserve || lpAmount === '0') {
      setExpectedTokenA('0');
      setExpectedTokenB('0');
      return;
    }

    setIsCalculating(true);

    try {
      const lpAmountWei = parseEther(lpAmount);
      const totalSupplyBigInt = totalSupply as bigint;
      const xReserveBigInt = xReserve as bigint;
      const yReserveBigInt = yReserve as bigint;

      if (totalSupplyBigInt === 0n) {
        setExpectedTokenA('0');
        setExpectedTokenB('0');
        setIsCalculating(false);
        return;
      }

      // Calculate proportional amounts
      const xAmount = (lpAmountWei * xReserveBigInt) / totalSupplyBigInt;
      const yAmount = (lpAmountWei * yReserveBigInt) / totalSupplyBigInt;

      // Map to Token A and Token B based on contract logic
      if (isTokenALower) {
        // Token A = tokenX, Token B = tokenY
        setExpectedTokenA(formatEther(xAmount));
        setExpectedTokenB(formatEther(yAmount));
      } else {
        // Token A = tokenY, Token B = tokenX
        setExpectedTokenA(formatEther(yAmount));
        setExpectedTokenB(formatEther(xAmount));
      }
    } catch (error) {
      console.error('Error calculating expected amounts:', error);
      setExpectedTokenA('0');
      setExpectedTokenB('0');
    }

    setIsCalculating(false);
  }, [lpAmount, totalSupply, xReserve, yReserve, isTokenALower]);

  // Handle remove liquidity success
  useEffect(() => {
    if (isRemoveLiquiditySuccess) {
      onSuccess('Liquidity removed successfully!');
      setLpAmount('');
      setExpectedTokenA('0');
      setExpectedTokenB('0');
    }
  }, [isRemoveLiquiditySuccess, onSuccess]);

  const validateRemoveLiquidity = (): string | null => {
    if (!lpAmount || parseFloat(lpAmount) <= 0) {
      return 'Please enter a valid LP token amount';
    }

    const lpAmountWei = parseEther(lpAmount);
    
    if (!lpBalance || lpAmountWei > (lpBalance as bigint)) {
      return 'Insufficient LP token balance';
    }

    if (!totalSupply || (totalSupply as bigint) === 0n) {
      return 'No liquidity in pool';
    }

    return null;
  };

  const handleRemoveLiquidity = async () => {
    const validationError = validateRemoveLiquidity();
    if (validationError) {
      onError(validationError);
      return;
    }

    try {
      const lpAmountWei = parseEther(lpAmount);

      writeRemoveLiquidity({
        address: CONTRACT_ADDRESSES.MINIAMM as `0x${string}`,
        abi: [
          {
            inputs: [{ name: 'lpAmount', type: 'uint256' }],
            name: 'removeLiquidity',
            outputs: [
              { name: 'xAmount', type: 'uint256' },
              { name: 'yAmount', type: 'uint256' },
            ],
            stateMutability: 'nonpayable',
            type: 'function',
          },
        ],
        functionName: 'removeLiquidity',
        args: [lpAmountWei],
      });
    } catch (error: any) {
      onError(`Remove liquidity failed: ${error.message || 'Unknown error'}`);
    }
  };

  const setMaxLpAmount = () => {
    if (lpBalance) {
      setLpAmount(formatEther(lpBalance as bigint));
    }
  };

  const canRemoveLiquidity = !isRemoveLiquidityLoading && lpAmount && parseFloat(lpAmount) > 0;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Remove Liquidity</h2>
      
      {/* LP Token Balance Display */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-sm text-gray-600 mb-1">Your LP Token Balance</div>
        <div className="text-lg font-semibold">
          {lpBalance ? formatEther(lpBalance as bigint) : '0'} LP
        </div>
      </div>

      {/* LP Amount Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          LP Tokens to Remove
        </label>
        <div className="relative">
          <input
            type="number"
            value={lpAmount}
            onChange={(e) => setLpAmount(e.target.value)}
            placeholder="0.0"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-16"
            disabled={isRemoveLiquidityLoading}
          />
          <button
            onClick={setMaxLpAmount}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors cursor-pointer"
            disabled={isRemoveLiquidityLoading}
          >
            MAX
          </button>
        </div>
      </div>

      {/* Expected Output */}
      <div className="mb-6">
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-2">You will receive</div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Token A:</span>
              <span className="font-semibold">
                {isCalculating ? 'Calculating...' : expectedTokenA}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Token B:</span>
              <span className="font-semibold">
                {isCalculating ? 'Calculating...' : expectedTokenB}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Remove Liquidity Button */}
      <button
        onClick={handleRemoveLiquidity}
        disabled={!canRemoveLiquidity}
        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
          canRemoveLiquidity
            ? 'bg-red-500 hover:bg-red-600 text-white cursor-pointer'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        {isRemoveLiquidityLoading ? 'Removing Liquidity...' : 'Remove Liquidity'}
      </button>

      {/* Status Messages */}
      {isRemoveLiquidityLoading && (
        <div className="mt-3 text-sm text-blue-600">
          Processing liquidity removal transaction...
        </div>
      )}
    </div>
  );
}
