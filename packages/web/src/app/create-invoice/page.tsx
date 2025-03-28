import React from 'react';
import { InvoiceCreationContainer } from '@/components/invoice/invoice-creation-container';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Create Invoice',
  description: 'Create an invoice using Request Network',
};

export default async function CreateInvoicePage() {
  // Server-side auth check
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }
  
  return (
    <main className="container mx-auto px-4 py-8">
      <InvoiceCreationContainer />
    </main>
  );
}