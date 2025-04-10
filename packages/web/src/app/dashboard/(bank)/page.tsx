'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
// import { SwapCard } from './components/dashboard/swap-card';
import { useUserSafes } from '@/hooks/use-user-safes';
import { ActiveAgents } from './components/agents/active-agents';
import { AddFundingSourceForm } from './components/add-funding-source-form';
// import { getUserFundingSources, type UserFundingSourceDisplayData } from '../actions/get-user-funding-sources';
// import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { BarChart4, Loader2 } from 'lucide-react';
import { type Address } from 'viem';
// import { AllocationManagement } from './components/allocation-management';
import { AllocationSummaryCard } from './components/dashboard/allocation-summary-card';
import { FundingSourceDisplay } from '../settings/components/funding-source-display';
import { TransactionHistoryList } from './components/transaction-history-list';
import { type UserSafe } from '@/db/schema';

export default function DashboardPage() {
  const router = useRouter();
  const { ready, authenticated, user } = usePrivy();
  const { data: userSafesData, isLoading: isLoadingSafes } = useUserSafes();

  useEffect(() => {
    if (ready && !authenticated) {
      router.push('/');
    }
  }, [ready, authenticated, router]);

  const primarySafeAddress = userSafesData?.find(
    (s) => s.safeType === 'primary',
  )?.safeAddress as Address | undefined;

  if (!ready || !authenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-gray-600">Loading Dashboard...</span>
      </div>
    );
  }

  return (
    <div className="">
      {/* Left Column (or Main Column on smaller screens) */}
      <div className="space-y-6">
        <AllocationSummaryCard />
        <TransactionHistoryList />
        <ActiveAgents />
        <FundingSourceDisplay />
      </div>

    </div>
  );
}
