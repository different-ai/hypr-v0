'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';

const UserButton = dynamic(
  () => import('@clerk/nextjs').then((mod) => mod.UserButton),
  { ssr: false }
);

export function DashboardNav() {
  return (
    <div className="nostalgic-container p-6 flex flex-col gap-5 w-full md:w-60 border border-primary/20">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="">
            <Image
              src="/request-req-logo.png"
              alt="hyprsqrl Logo"
              width={24}
              height={24}
              className="blue-overlay"
              priority
            />
          </div>
          <span className="logo-text font-medium text-lg tracking-tight">Dashboard</span>
        </div>
        <UserButton afterSignOutUrl="/" />
      </div>
      
      <nav className="flex flex-col gap-2">
        <Link
          href="/dashboard/invoices"
          className="nostalgic-button-secondary px-4 py-2 text-sm font-medium w-full text-center"
        >
          Invoices
        </Link>
        <Link
          href="/dashboard/settings"
          className="nostalgic-button-secondary px-4 py-2 text-sm font-medium w-full text-center"
        >
          Settings
        </Link>
        <Link
          href="/create-invoice"
          className="nostalgic-button mt-4 px-4 py-2 text-sm font-medium w-full text-center text-white"
        >
          + New Invoice
        </Link>
      </nav>
    </div>
  );
} 