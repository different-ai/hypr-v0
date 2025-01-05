'use client';

import React, { useState, useEffect } from 'react';
import { Types } from '@requestnetwork/request-client.js';
import { RequestLogicTypes } from '@requestnetwork/types';
import { providers } from 'ethers';
import { 
  payRequest,
  hasSufficientFunds,
  hasErc20Approval,
  approveErc20
} from '@requestnetwork/payment-processor';
import { getRequestClient } from '@/lib/request-network';
import TechnicalDetailsModal from './TechnicalDetailsModal';

interface InvoiceDetailsProps {
  requestId: string;
}

// Currency configuration
const PAYMENT_CURRENCY = {
  type: 'ERC20',
  value: '0x420CA0f9B9b604cE0fd9C18EF134C705e5Fa3430', // EURe on Gnosis Chain
  network: 'gnosis'
};

const CURRENCY_SYMBOLS = {
  EUR: '€'
};

interface InvoiceItem {
  name: string;
  quantity: number;
  unitPrice: string;
  currency: string;
  tax?: {
    type: 'percentage' | 'fixed';
    amount: string;
  };
  reference?: string;
  deliveryDate?: string;
  deliveryPeriod?: string;
}

export default function InvoiceDetails({ requestId }: InvoiceDetailsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [requestData, setRequestData] = useState<Types.IRequestData | null>(null);
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);

  useEffect(() => {
    const fetchRequestData = async () => {
      try {
        const requestClient = getRequestClient();
        const request = await requestClient.fromRequestId(requestId);
        const data = request.getData();
        console.log('0xHypr', 'requestData', data);
        setRequestData(data);
        
        // Fetch exchange rate if denominated currency is different from payment currency
        if (data.contentData?.currency !== 'EUR') {
          // TODO: Implement exchange rate fetching
          // For now using a mock rate
          setExchangeRate(1.1); // 1 EUR = 1.1 USD
        }
      } catch (err) {
        console.error('Error fetching request:', err);
        setError(err instanceof Error ? err.message : 'Failed to load invoice');
      }
    };

    fetchRequestData();
  }, [requestId]);

  if (!requestData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">{error || 'Loading invoice...'}</p>
        </div>
      </div>
    );
  }

  const handlePayment = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!window.ethereum) {
        throw new Error('Please install MetaMask to make payments');
      }

      const provider = new providers.Web3Provider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = provider.getSigner();
      const address = await signer.getAddress();

      // Verify we're on Gnosis Chain
      const network = await provider.getNetwork();
      if (network.chainId !== 100) { // Gnosis Chain ID
        throw new Error('Please switch to Gnosis Chain to make payments');
      }

      const hasFunds = await hasSufficientFunds({
        request: requestData,
        address,
        providerOptions: { provider }
      });

      if (!hasFunds) {
        throw new Error('Insufficient EURe balance');
      }

      const hasApproval = await hasErc20Approval(
        requestData,
        address,
        provider
      );

      if (!hasApproval) {
        const approvalTx = await approveErc20(
          requestData,
          signer
        );
        await approvalTx.wait(2);
      }

      const paymentTx = await payRequest(
        requestData,
        signer
      );
      await paymentTx.wait(2);

      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setIsLoading(false);
    }
  };

  const formatAmount = (amount: string | RequestLogicTypes.Amount) => {
    if (!amount) return '0';
    
    let value: bigint;
    if (typeof amount === 'string') {
      value = BigInt(amount);
    } else {
      value = BigInt(amount.toString());
    }
    
    const baseAmount = Number(value) / 1e18;
    return baseAmount.toFixed(2);
  };

  const getInvoiceData = () => {
    if (requestData.contentData) {
      return requestData.contentData;
    }
    
    const contentDataExt = requestData.extensions?.['content-data'];
    if (contentDataExt?.values?.content) {
      return contentDataExt.values.content;
    }
    
    const contentDataExtData = requestData.extensionsData?.find(ext => ext.id === 'content-data');
    if (contentDataExtData?.parameters?.content) {
      return contentDataExtData.parameters.content;
    }

    return null;
  };

  const invoice = getInvoiceData();
  const balance = requestData.balance?.balance;
  const expectedAmount = requestData.expectedAmount;
  
  const isPaid = balance ? 
    BigInt(balance.toString() || '0') >= BigInt(expectedAmount?.toString() || '0') :
    false;

  const getDenominatedCurrency = () => {
    return 'EUR';
  };

  const getPaymentCurrency = () => {
    return 'EUR'; // Always EURe for payments
  };

  const getCurrencySymbol = (currency: string) => {
    return CURRENCY_SYMBOLS[currency as keyof typeof CURRENCY_SYMBOLS] || currency;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl mx-auto">
      {/* Invoice Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-2xl font-bold">Invoice #{invoice?.invoiceNumber}</h2>
          <p className="text-gray-600">
            Created on {new Date(invoice?.creationDate).toLocaleDateString()}
          </p>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold">
            {getCurrencySymbol(getDenominatedCurrency())}
            {formatAmount(expectedAmount)}
          </div>
          <div className="text-sm text-gray-600">
            {isPaid ? 'Paid' : 'Pending Payment'}
          </div>
        </div>
      </div>

      {/* Business Information */}
      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="text-lg font-semibold mb-2">From</h3>
          <div className="text-gray-600 space-y-2">
            {/* Business Details */}
            <div>
              {invoice?.businessInfo?.businessName && (
                <p className="font-medium text-lg">{invoice.businessInfo.businessName}</p>
              )}
              {(invoice?.businessInfo?.firstName || invoice?.businessInfo?.lastName) && (
                <p>Contact: {[invoice.businessInfo.firstName, invoice.businessInfo.lastName].filter(Boolean).join(' ')}</p>
              )}
            </div>

            {/* Contact Information */}
            <div>
              {invoice?.businessInfo?.email && (
                <p className="flex items-center gap-2">
                  <span className="text-gray-500">Email:</span>
                  <span>{invoice.businessInfo.email}</span>
                </p>
              )}
              {invoice?.businessInfo?.phone && (
                <p className="flex items-center gap-2">
                  <span className="text-gray-500">Phone:</span>
                  <span>{invoice.businessInfo.phone}</span>
                </p>
              )}
            </div>

            {/* Registration Numbers */}
            <div>
              {invoice?.businessInfo?.taxRegistration && (
                <p className="flex items-center gap-2">
                  <span className="text-gray-500">Tax ID:</span>
                  <span>{invoice.businessInfo.taxRegistration}</span>
                </p>
              )}
              {invoice?.businessInfo?.companyRegistration && (
                <p className="flex items-center gap-2">
                  <span className="text-gray-500">Company Reg:</span>
                  <span>{invoice.businessInfo.companyRegistration}</span>
                </p>
              )}
            </div>

            {/* Address */}
            {invoice?.businessInfo?.address && (
              <div className="border-t border-gray-200 pt-2 mt-2">
                <p className="text-gray-500 mb-1">Address:</p>
                <div className="pl-2">
                  {invoice.businessInfo.address['street-address'] && (
                    <p>{invoice.businessInfo.address['street-address']}</p>
                  )}
                  <p>
                    {[
                      invoice.businessInfo.address.locality,
                      invoice.businessInfo.address.region,
                      invoice.businessInfo.address['postal-code']
                    ].filter(Boolean).join(', ')}
                  </p>
                  {invoice.businessInfo.address['country-name'] && (
                    <p>{invoice.businessInfo.address['country-name']}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">To</h3>
          <div className="text-gray-600 space-y-2">
            {/* Business Details */}
            <div>
              {invoice?.buyerInfo?.businessName && (
                <p className="font-medium text-lg">{invoice.buyerInfo.businessName}</p>
              )}
              {(invoice?.buyerInfo?.firstName || invoice?.buyerInfo?.lastName) && (
                <p>Contact: {[invoice.buyerInfo.firstName, invoice.buyerInfo.lastName].filter(Boolean).join(' ')}</p>
              )}
            </div>

            {/* Contact Information */}
            <div>
              {invoice?.buyerInfo?.email && (
                <p className="flex items-center gap-2">
                  <span className="text-gray-500">Email:</span>
                  <span>{invoice.buyerInfo.email}</span>
                </p>
              )}
              {invoice?.buyerInfo?.phone && (
                <p className="flex items-center gap-2">
                  <span className="text-gray-500">Phone:</span>
                  <span>{invoice.buyerInfo.phone}</span>
                </p>
              )}
            </div>

            {/* Registration Numbers */}
            <div>
              {invoice?.buyerInfo?.taxRegistration && (
                <p className="flex items-center gap-2">
                  <span className="text-gray-500">Tax ID:</span>
                  <span>{invoice.buyerInfo.taxRegistration}</span>
                </p>
              )}
              {invoice?.buyerInfo?.companyRegistration && (
                <p className="flex items-center gap-2">
                  <span className="text-gray-500">Company Reg:</span>
                  <span>{invoice.buyerInfo.companyRegistration}</span>
                </p>
              )}
            </div>

            {/* Address */}
            {invoice?.buyerInfo?.address && (
              <div className="border-t border-gray-200 pt-2 mt-2">
                <p className="text-gray-500 mb-1">Address:</p>
                <div className="pl-2">
                  {invoice.buyerInfo.address['street-address'] && (
                    <p>{invoice.buyerInfo.address['street-address']}</p>
                  )}
                  <p>
                    {[
                      invoice.buyerInfo.address.locality,
                      invoice.buyerInfo.address.region,
                      invoice.buyerInfo.address['postal-code']
                    ].filter(Boolean).join(', ')}
                  </p>
                  {invoice.buyerInfo.address['country-name'] && (
                    <p>{invoice.buyerInfo.address['country-name']}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Terms */}
      {invoice?.paymentTerms && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-2">Payment Terms</h3>
          <div className="grid md:grid-cols-2 gap-4 text-gray-600">
            <div>
              <p>Due Date: {new Date(invoice.paymentTerms.dueDate).toLocaleDateString()}</p>
              {invoice.paymentTerms.lateFeesPercent > 0 && (
                <p>Late Fees: {invoice.paymentTerms.lateFeesPercent}%</p>
              )}
              {Number(invoice.paymentTerms.lateFeesFix) > 0 && (
                <p>Late Fees (Fixed): {getCurrencySymbol(getDenominatedCurrency())}{invoice.paymentTerms.lateFeesFix}</p>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Invoice Items */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Invoice Items</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit Price ({getCurrencySymbol(getDenominatedCurrency())})
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount ({getCurrencySymbol(getDenominatedCurrency())})
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoice?.invoiceItems?.map((item: InvoiceItem, index: number) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {getCurrencySymbol(getDenominatedCurrency())}{Number(item.unitPrice).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {getCurrencySymbol(getDenominatedCurrency())}
                    {(Number(item.unitPrice) * Number(item.quantity)).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notes */}
      {invoice?.note && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-2">Notes</h3>
          <p className="text-gray-600 whitespace-pre-wrap">{invoice.note}</p>
        </div>
      )}

      {/* Terms */}
      {invoice?.terms && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-2">Terms and Conditions</h3>
          <p className="text-gray-600 whitespace-pre-wrap">{invoice.terms}</p>
        </div>
      )}

      {/* Payment Information */}
      <div className="border-t border-gray-200 pt-4 mt-8">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between text-lg font-semibold">
            <span>Total Amount ({getDenominatedCurrency()})</span>
            <span>{getCurrencySymbol(getDenominatedCurrency())}{formatAmount(expectedAmount)}</span>
          </div>
          
          <div className="flex justify-between text-base text-gray-600">
            <span>Payment Amount (EURe)</span>
            <span>{getCurrencySymbol('EUR')}{formatAmount(expectedAmount)}</span>
          </div>

          {balance && (
            <div className="flex justify-between text-base text-gray-600">
              <span>Paid Amount (EURe)</span>
              <span>{getCurrencySymbol('EUR')}{formatAmount(balance)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Payment Actions */}
      {!isPaid && (
        <div className="mt-8">
          <button
            onClick={handlePayment}
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-md text-white font-medium ${
              isLoading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isLoading ? 'Processing...' : `Pay ${getCurrencySymbol('EUR')}${formatAmount(expectedAmount)} EURe`}
          </button>
          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
        </div>
      )}

      {/* Technical Details */}
      <div className="mt-8 text-center">
        <button
          onClick={() => setShowTechnicalDetails(true)}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          View Technical Details
        </button>
      </div>

      {showTechnicalDetails && (
        <TechnicalDetailsModal
          requestData={requestData}
          invoice={invoice}
          onClose={() => setShowTechnicalDetails(false)}
          formatAmount={formatAmount}
          getCurrencyDisplay={() => getCurrencySymbol(getPaymentCurrency())}
        />
      )}
    </div>
  );
} 