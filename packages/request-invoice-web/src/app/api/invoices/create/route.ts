import { NextRequest, NextResponse } from 'next/server';
import { createInvoiceRequest } from '@/lib/request-network';
import { RequestLogicTypes, ExtensionTypes } from '@requestnetwork/types';
import { ephemeralKeyService } from '@/lib/ephemeral-key-service';
import { ethers } from 'ethers';

interface InvoiceItem {
  name: string;
  quantity: number;
  unitPrice: string;
  currency: string;
  tax?: {
    type: string;
    amount: string;
  };
}

// Fixed EURe currency configuration
const EURE_CONFIG = {
  type: RequestLogicTypes.CURRENCY.ERC20,
  value: '0xcB444e90D8198415266c6a2724b7900fb12FC56E', // EURe token address on Gnosis Chain
  network: 'xdai' as const,
  paymentNetworkId: ExtensionTypes.PAYMENT_NETWORK_ID.ERC20_FEE_PROXY_CONTRACT,
  decimals: 18,
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.json();
    console.log('Form data received:', JSON.stringify(formData, null, 2));
    
    if (!formData) {
      return NextResponse.json(
        { error: 'Invalid invoice data' },
        { status: 400 }
      );
    }
    
    // Always use EURe on Gnosis Chain
    const currencyConfig = EURE_CONFIG;
    
    // Create invoice content data object
    const invoiceContent = formData.contentData || {
      meta: {
        format: 'rnf_invoice',
        version: '0.0.3',
      },
      creationDate: new Date().toISOString(),
      invoiceNumber: `INV-${Date.now()}`,
      sellerInfo: {
        businessName: formData.sellerInfo?.businessName || 'Default Business',
        email: formData.sellerInfo?.email || 'test@example.com',
      },
      invoiceItems: formData.invoiceItems || [{
        name: 'Test Item',
        quantity: 1,
        unitPrice: '100',
        currency: 'EURe',
        tax: { type: 'percentage', amount: '0' },
      }],
      paymentTerms: formData.paymentTerms,
    };
    
    // Create the payment address
    const paymentAddress = "0x58907D99768c34c9da54e5f94d47dDb150b7da82"; // This would be the address for receiving payments
    
    // Calculate total amount from invoice items
    let totalAmount = '100'; // Default minimum amount to ensure it's always positive
    if (invoiceContent.invoiceItems && invoiceContent.invoiceItems.length > 0) {
      const total = invoiceContent.invoiceItems.reduce((sum: number, item: InvoiceItem) => {
        const quantity = Number(item.quantity) || 0;
        const unitPrice = Number(item.unitPrice) || 0;
        const taxRate = item.tax?.amount ? Number(item.tax.amount) / 100 : 0;
        return sum + (quantity * unitPrice * (1 + taxRate));
      }, 0);
      
      // Ensure the amount is positive and at least 100 cents (1 EUR)
      const finalTotal = Math.max(Math.round(total), 100);
      
      // Convert from cents to wei (1 EUR = 100 cents = 1e18 wei)
      // First convert cents to EUR (divide by 100)
      // Then convert EUR to wei (multiply by 1e18)
      const amountInWei = ethers.utils.parseUnits((finalTotal / 100).toString(), 18);
      totalAmount = amountInWei.toString();
      
      console.log('0xHypr', 'Amount conversion:', {
        originalTotal: total,
        finalTotal,
        amountInWei: totalAmount,
        amountInEUR: (finalTotal / 100).toFixed(2)
      });
    }
    
    // Generate ephemeral key for the invoice
    const ephemeralKey = await ephemeralKeyService.generateKey();
    
    // Create the invoice request
    const request = await createInvoiceRequest(
      {
        currency: currencyConfig,
        expectedAmount: totalAmount,
        paymentAddress,
        contentData: invoiceContent,
        paymentNetwork: {
          id: currencyConfig.paymentNetworkId,
          parameters: {
            paymentNetworkName: currencyConfig.network,
            paymentAddress,
          },
        },
      },
      ephemeralKey
    );
    
    return NextResponse.json({
      requestId: request.requestId,
      token: ephemeralKey.token,
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    );
  }
}