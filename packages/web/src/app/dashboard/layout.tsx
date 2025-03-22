
import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { OnboardingBanner } from '@/components/onboarding-banner';
import { OnboardingFlow } from '@/components/onboarding-flow';
import { DashboardNav } from '@/components/dashboard-nav';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  
  // If the user is not authenticated, redirect to the sign-in page
  if (!userId) {
    redirect("/sign-in");
  }
  
  return (
    <>
      <OnboardingFlow />
      <OnboardingBanner />
      <div className="container mx-auto px-4 md:px-8 pt-4 pb-12">
        <div className="flex flex-col md:flex-row gap-6 md:gap-10 mb-8">
          <DashboardNav />
          <div className="flex-1">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}