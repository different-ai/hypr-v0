'use client';

import React, { useEffect } from 'react';
import { useAllocationState } from '../../hooks/use-allocation-state';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle, Wallet, CircleDollarSign, Landmark } from 'lucide-react';
import { formatUnits } from 'viem';

// Helper function to format balance strings (assuming 6 decimals for USDC)
const formatBalance = (amount: string | undefined | null, decimals: number = 6): string => {
  if (amount === null || amount === undefined) return '0.00';
  try {
    const formatted = formatUnits(BigInt(amount), decimals);
    // Format to 2-6 decimal places for readability
    const number = parseFloat(formatted);
    return number.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 });
  } catch (error) {
    console.error("Error formatting balance:", amount, error);
    return '0.00'; // Return default on error
  }
};

export function AllocationSummaryCard() {
  const { data, isLoading, isError, error, refetch } = useAllocationState();

  // Poll for updates every 30 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      refetch();
    }, 30000); // 30 seconds

    return () => clearInterval(intervalId);
  }, [refetch]);

  const allocationState = data?.allocationState;

  // --- Loading State --- 
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Wallet className="h-5 w-5 mr-2 text-primary" /> Allocation Summary
          </CardTitle>
          <CardDescription>Loading your allocation details...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  // --- Error State --- 
  if (isError) {
    return (
      <Card>
        <CardHeader>
           <CardTitle className="flex items-center">
            <Wallet className="h-5 w-5 mr-2 text-primary" /> Allocation Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Allocation</AlertTitle>
            <AlertDescription>
              {error?.message || 'Could not fetch allocation details. Please try again later.'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }
  
  // --- No State / Primary Safe Missing --- 
  if (!allocationState) {
     return (
      <Card>
         <CardHeader>
           <CardTitle className="flex items-center">
            <Wallet className="h-5 w-5 mr-2 text-primary" /> Allocation Summary
          </CardTitle>
          <CardDescription>No allocation data found. Ensure your primary safe is set up.</CardDescription>
        </CardHeader>
        <CardContent>
           <Alert variant="default" className="border-yellow-500/50 bg-yellow-50 text-yellow-800">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-yellow-900">Pending Setup</AlertTitle>
            <AlertDescription className="text-yellow-700">
                Allocation tracking starts once your primary safe is connected and receives its first USDC deposit.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // --- Main Content: Display Allocation Details --- 

  const totalDeposited = formatBalance(allocationState.totalDeposited);
  const allocatedTax = formatBalance(allocationState.allocatedTax);
  const allocatedLiquidity = formatBalance(allocationState.allocatedLiquidity);
  const allocatedYield = formatBalance(allocationState.allocatedYield);
  const lastUpdated = allocationState.lastUpdated ? new Date(allocationState.lastUpdated).toLocaleString() : 'N/A';

  // Calculate the tax percentages
  const taxPercentage = '30%';
  const primaryPercentage = '60%';
  const yieldPercentage = '10%';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Wallet className="h-5 w-5 mr-2 text-primary" /> Allocation Summary
        </CardTitle>
        <CardDescription>
          Overview of your treasury allocations. Last updated: {lastUpdated}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Deposited */} 
         <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
           <p className="text-sm text-gray-600 flex items-center"><CircleDollarSign className="h-4 w-4 mr-1.5"/> Total Confirmed Deposits (USDC)</p>
           <p className="text-2xl font-bold text-gray-800">${totalDeposited}</p>
        </div>
        
        {/* Allocation Breakdown Grid */} 
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           {/* Tax Allocation */}
           <div className="p-3 border rounded-md flex flex-col justify-between">
             <div>
                <p className="text-sm text-gray-600 flex items-center mb-1"><Landmark className="h-4 w-4 mr-1.5 text-blue-600"/> Tax Reserve</p>
                <p className="text-lg font-semibold text-gray-800">${allocatedTax}</p>
             </div>
             <p className="text-xs text-gray-500 mt-1">{taxPercentage} of deposits</p> 
           </div>

          {/* Primary Safe Allocation */}
           <div className="p-3 border rounded-md flex flex-col justify-between">
             <div>
               <p className="text-sm text-gray-600 flex items-center mb-1"><Wallet className="h-4 w-4 mr-1.5 text-green-600"/> Primary Safe</p>
               <p className="text-lg font-semibold text-gray-800">${allocatedLiquidity}</p>
             </div>
             <p className="text-xs text-gray-500 mt-1">{primaryPercentage} of deposits</p> 
           </div>

          {/* Yield Allocation */}
           <div className="p-3 border rounded-md flex flex-col justify-between">
             <div>
               <p className="text-sm text-gray-600 flex items-center mb-1"><CircleDollarSign className="h-4 w-4 mr-1.5 text-yellow-600"/> Yield Strategies</p>
               <p className="text-lg font-semibold text-gray-800">${allocatedYield}</p>
             </div>
             <p className="text-xs text-gray-500 mt-1">{yieldPercentage} of deposits</p> 
           </div>
        </div>
      </CardContent>
    </Card>
  );
} 