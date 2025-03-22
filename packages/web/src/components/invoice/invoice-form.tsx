'use client';

import React, { forwardRef, useImperativeHandle, useEffect, useState } from 'react';
import { Plus, Trash2, Copy, Check } from 'lucide-react';
import { useInvoiceStore, InvoiceFormData, InvoiceItemData } from '@/lib/store/invoice-store';
import { createInvoice } from '@/actions/create-invoice';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface InvoiceFormProps {
  onSubmit?: (data: any) => void;
  isSubmitting?: boolean;
}

export const InvoiceForm = forwardRef(({ onSubmit, isSubmitting: externalIsSubmitting }: InvoiceFormProps, ref) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<{ 
    url: string, 
    requestId: string 
  } | null>(null);
  
  // Use our Zustand store for form data and items
  const { 
    formData, 
    invoiceItems, 
    updateFormData, 
    updateInvoiceItems,
    applyDataToForm,
    detectedInvoiceData
  } = useInvoiceStore();
  
  // Expose methods to parent component via ref
  useImperativeHandle(ref, () => ({
    updateFormData: (newFormData: Partial<InvoiceFormData>, newItems?: InvoiceItemData[]) => {
      // Update form data in the store
      updateFormData(newFormData);
      
      // Update items if provided
      if (newItems && newItems.length > 0) {
        updateInvoiceItems(newItems);
      }
    }
  }));
  
  // Apply detected data from store to form on component mount and when detected data changes
  useEffect(() => {
    if (detectedInvoiceData) {
      applyDataToForm();
      console.log("Applying detected invoice data to form", detectedInvoiceData);
    }
  }, [applyDataToForm, detectedInvoiceData]);
  
  const addItem = () => {
    updateInvoiceItems([
      ...invoiceItems,
      {
        id: Date.now(),
        name: '',
        quantity: 1,
        unitPrice: '',
        tax: 0,
      },
    ]);
  };
  
  const removeItem = (id: number) => {
    if (invoiceItems.length === 1) {
      return; // Don't remove the last item
    }
    updateInvoiceItems(invoiceItems.filter(item => item.id !== id));
  };
  
  const updateItem = (id: number, field: string, value: any) => {
    updateInvoiceItems(
      invoiceItems.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };
  
  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Special handling for network changes - automatically update currency
    if (name === 'network') {
      const newCurrency = value === 'ethereum' ? 'USDC' : 'EURe';
      // Update both network and currency together
      updateFormData({
        [name]: value,
        currency: newCurrency
      });
    } else if (name.startsWith('items.')) {
      // Handle invoice line item changes
      const [_, index, field] = name.split('.');
      const indexNum = parseInt(index);
      
      // Create a copy of the current invoice items
      const newItems = [...invoiceItems];
      
      // Update the appropriate field
      if (field === 'tax') {
        newItems[indexNum].tax = parseFloat(value) || 0;
      } else if (field === 'name') {
        newItems[indexNum].name = value;
      } else if (field === 'quantity') {
        newItems[indexNum].quantity = parseInt(value) || 0;
      } else if (field === 'unitPrice') {
        newItems[indexNum].unitPrice = value;
      }
      
      // Update the invoice items in the store
      updateInvoiceItems(newItems);
    } 
    // Handle nested properties (for bankDetails)
    else if (name.includes('.')) {
      const [parent, child] = name.split('.');
      
      if (parent === 'bankDetails') {
        const updatedBankDetails = {
          accountHolder: formData.bankDetails?.accountHolder || '',
          iban: formData.bankDetails?.iban || '',
          bic: formData.bankDetails?.bic || '',
          bankName: formData.bankDetails?.bankName || ''
        };
        
        // Update the specific field
        updatedBankDetails[child as keyof typeof updatedBankDetails] = value;
        
        // Update the form data
        updateFormData({ bankDetails: updatedBankDetails });
      }
    } else {
      // Handle all other form field changes
      updateFormData({
        [name]: value
      });
    }
  };
  
  const calculateSubtotal = () => {
    return invoiceItems.reduce((sum, item) => {
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unitPrice) || 0;
      return sum + quantity * unitPrice;
    }, 0);
  };
  
  const calculateTax = () => {
    return invoiceItems.reduce((sum, item) => {
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unitPrice) || 0;
      const tax = Number(item.tax) || 0;
      return sum + quantity * unitPrice * (tax / 100);
    }, 0);
  };
  
  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Use external isSubmitting state if provided, otherwise use local state
    const isAlreadySubmitting = externalIsSubmitting !== undefined ? externalIsSubmitting : isSubmitting;
    
    if (isAlreadySubmitting) {
      return; // Prevent multiple submissions
    }
    
    // Set local submitting state if not using external state
    if (externalIsSubmitting === undefined) {
      setIsSubmitting(true);
    }
    
    try {
      // Convert the form data to the format expected by the API
      // Validate bank details for fiat payments
      if (formData.paymentType === 'fiat' && 
          (!formData.bankDetails?.accountHolder || 
           !formData.bankDetails?.iban || 
           !formData.bankDetails?.bic)) {
        toast.error('Please fill in all required bank details');
        
        // Reset submitting state if not using external state
        if (externalIsSubmitting === undefined) {
          setIsSubmitting(false);
        }
        return;
      }
      
      const invoiceData = {
        meta: {
          format: 'rnf_invoice',
          version: '0.0.3',
        },
        creationDate: new Date().toISOString(),
        invoiceNumber: formData.invoiceNumber,
        sellerInfo: {
          businessName: formData.sellerBusinessName,
          email: formData.sellerEmail,
          address: {
            'street-address': formData.sellerAddress,
            locality: formData.sellerCity,
            'postal-code': formData.sellerPostalCode,
            'country-name': formData.sellerCountry,
          },
        },
        buyerInfo: {
          businessName: formData.buyerBusinessName,
          email: formData.buyerEmail,
          address: {
            'street-address': formData.buyerAddress,
            locality: formData.buyerCity,
            'postal-code': formData.buyerPostalCode,
            'country-name': formData.buyerCountry,
          },
        },
        invoiceItems: invoiceItems.map(item => ({
          name: item.name,
          quantity: Number(item.quantity) || 1,
          unitPrice: (Number(item.unitPrice) * 100).toString(), // Convert to cents
          currency: formData.network === 'ethereum' ? 'USDC' : 'EURe',
          tax: {
            type: "percentage" as const,
            amount: item.tax.toString(),
          },
        })),
        paymentTerms: {
          dueDate: new Date(formData.dueDate).toISOString(),
        },
        note: formData.note,
        terms: formData.terms,
        currency: formData.currency, // Add the currency property from form data
        paymentType: formData.paymentType,
        bankDetails: formData.paymentType === 'fiat' ? formData.bankDetails : undefined,
      };
      
      // If external onSubmit is provided, use it
      if (onSubmit) {
        onSubmit(invoiceData);
        return;
      }
      
      // Otherwise use the server action
      const result = await createInvoice(invoiceData);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create invoice');
      }
      
      // Generate the invoice URL
      const baseUrl = window.location.origin;
      const invoiceUrl = `${baseUrl}/invoice/${result.requestId}?token=${result.token}`;
      
      // Set success data
      setSuccessData({
        url: invoiceUrl,
        requestId: result.requestId || '' // Ensure it's always a string
      });
      
      toast.success('Invoice created successfully!');
      
      // Redirect to the invoice page
      setTimeout(() => {
        router.push(`/invoice/${result.requestId}?token=${result.token}`);
      }, 3000);
      
    } catch (error) {
      console.error('0xHypr', 'Failed to create invoice:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create invoice');
    } finally {
      // Reset local submitting state if not using external state
      if (externalIsSubmitting === undefined) {
        setIsSubmitting(false);
      }
    }
  };
  
  // Determine if we're submitting based on external or local state
  const submitting = externalIsSubmitting !== undefined ? externalIsSubmitting : isSubmitting;
  
  // Show success message if we have success data
  if (successData) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-green-800 mb-4">Invoice Created Successfully!</h3>
        <p className="mb-4">Your invoice has been created and can be shared with your client.</p>
        
        <div className="bg-white p-4 rounded border mb-4">
          <p className="font-medium">Invoice URL:</p>
          <div className="flex items-center mt-2">
            <input 
              type="text" 
              readOnly 
              value={successData.url} 
              className="flex-1 p-2 border rounded text-sm font-mono"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(successData.url);
                toast.success('URL copied to clipboard!');
              }}
              className="ml-2 p-2 bg-gray-100 rounded hover:bg-gray-200"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        <p className="text-sm text-gray-600">
          You will be redirected to your invoice in a few seconds...
        </p>
      </div>
    );
  }
  
  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-6">
        
        <div className="space-y-8">
          {/* Invoice Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Invoice Number
              </label>
              <input
                type="text"
                name="invoiceNumber"
                value={formData.invoiceNumber}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Issue Date
              </label>
              <input
                type="date"
                name="issueDate"
                value={formData.issueDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
          </div>
          
          {/* Seller Info */}
          <div>
            <h4 className="text-md font-medium mb-3">Your Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Name
                </label>
                <input
                  type="text"
                  name="sellerBusinessName"
                  value={formData.sellerBusinessName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="sellerEmail"
                  value={formData.sellerEmail}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  name="sellerAddress"
                  value={formData.sellerAddress}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  name="sellerCity"
                  value={formData.sellerCity}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    name="sellerPostalCode"
                    value={formData.sellerPostalCode}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    name="sellerCountry"
                    value={formData.sellerCountry}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Client Info */}
          <div>
            <h4 className="text-md font-medium mb-3">Client Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Name
                </label>
                <input
                  type="text"
                  name="buyerBusinessName"
                  value={formData.buyerBusinessName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="buyerEmail"
                  value={formData.buyerEmail}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  name="buyerAddress"
                  value={formData.buyerAddress}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  name="buyerCity"
                  value={formData.buyerCity}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    name="buyerPostalCode"
                    value={formData.buyerPostalCode}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    name="buyerCountry"
                    value={formData.buyerCountry}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Payment Details */}
          <div>
            <h4 className="text-md font-medium mb-3">Payment Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Type
                </label>
                <select
                  name="paymentType"
                  value={formData.paymentType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="crypto">Cryptocurrency</option>
                  <option value="fiat">Fiat Currency</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {formData.paymentType === 'crypto' ? 'Network' : 'Currency'}
                </label>
                {formData.paymentType === 'crypto' ? (
                  // For crypto payments - show network selection
                  <>
                    <select
                      name="network"
                      value={formData.network}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="gnosis">Gnosis Chain</option>
                      <option value="ethereum">Ethereum Mainnet</option>
                    </select>
                    <p className="text-xs mt-1 text-gray-500">
                      {formData.network === 'ethereum' 
                        ? 'Ethereum Mainnet has higher gas fees than Gnosis Chain' 
                        : 'Gnosis Chain offers lower gas fees than Ethereum Mainnet'}
                    </p>
                    <input
                      type="hidden"
                      name="currency"
                      value={formData.network === 'ethereum' ? 'USDC' : 'EURe'}
                    />
                  </>
                ) : (
                  // For fiat payments - show currency selection
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="EUR">EUR - Euro</option>
                    <option value="USD">USD - US Dollar</option>
                    <option value="GBP">GBP - British Pound</option>
                  </select>
                )}
              </div>
              
              {/* Display currency info for crypto payments */}
              {formData.paymentType === 'crypto' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Currency
                  </label>
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                    {formData.network === 'ethereum' ? 'USDC' : 'EURe'}
                  </div>
                  <p className="text-xs mt-1 text-gray-500">
                    {formData.network === 'ethereum' 
                      ? 'USDC (USD Coin) is automatically selected for Ethereum Mainnet' 
                      : 'EURe (Euro e-Money) is automatically selected for Gnosis Chain'}
                  </p>
                </div>
              )}
            </div>
            
            {/* Bank Details for Fiat Payments */}
            {formData.paymentType === 'fiat' && (
              <div className="border rounded-md p-4 bg-gray-50">
                <h4 className="text-md font-medium mb-2">Bank Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Account Holder
                    </label>
                    <input
                      type="text"
                      name="bankDetails.accountHolder"
                      value={formData.bankDetails?.accountHolder || ''}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required={formData.paymentType === 'fiat'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      IBAN
                    </label>
                    <input
                      type="text"
                      name="bankDetails.iban"
                      value={formData.bankDetails?.iban || ''}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required={formData.paymentType === 'fiat'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      BIC/SWIFT
                    </label>
                    <input
                      type="text"
                      name="bankDetails.bic"
                      value={formData.bankDetails?.bic || ''}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required={formData.paymentType === 'fiat'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      name="bankDetails.bankName"
                      value={formData.bankDetails?.bankName || ''}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Invoice Items */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-md font-medium">Invoice Items</h4>
              <button
                type="button"
                className="text-sm px-3 py-1 border border-gray-300 rounded flex items-center hover:bg-gray-50"
                onClick={addItem}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </button>
            </div>
            
            <div className="border rounded-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                      Qty
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                      Price
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                      Tax %
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                      Total
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                      
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoiceItems.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                          placeholder="Item description"
                          className="w-full border-0 focus:ring-0"
                          required
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                          min="1"
                          className="w-full border-0 focus:ring-0"
                          required
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(item.id, 'unitPrice', e.target.value)}
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          className="w-full border-0 focus:ring-0"
                          required
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={item.tax}
                          onChange={(e) => updateItem(item.id, 'tax', Number(e.target.value))}
                          min="0"
                          max="100"
                          className="w-full border-0 focus:ring-0"
                        />
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {formData.paymentType === 'fiat' 
                          ? formData.currency 
                          : formData.network === 'ethereum' ? 'USDC' : 'EURe'}{' '}
                        {((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0) * (1 + (Number(item.tax) || 0) / 100)).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Totals */}
            <div className="mt-4 border-t pt-4">
              <div className="flex justify-end text-right">
                <div className="w-48">
                  <div className="flex justify-between py-1">
                    <span className="text-sm text-gray-600">Subtotal:</span>
                    <span className="font-medium">
                      {formData.paymentType === 'fiat' 
                        ? formData.currency 
                        : formData.network === 'ethereum' ? 'USDC' : 'EURe'} {calculateSubtotal().toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-sm text-gray-600">Tax:</span>
                    <span className="font-medium">
                      {formData.paymentType === 'fiat' 
                        ? formData.currency 
                        : formData.network === 'ethereum' ? 'USDC' : 'EURe'} {calculateTax().toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-t border-gray-200 mt-1 pt-1">
                    <span className="font-medium">Total:</span>
                    <span className="font-bold">
                      {formData.paymentType === 'fiat' 
                        ? formData.currency 
                        : formData.network === 'ethereum' ? 'USDC' : 'EURe'} {calculateTotal().toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Notes and Terms */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Note to Client
              </label>
              <textarea
                name="note"
                value={formData.note}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Thank you for your business"
              ></textarea>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Terms and Conditions
              </label>
              <textarea
                name="terms"
                value={formData.terms}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Payment terms, late fees, etc."
              ></textarea>
            </div>
          </div>
          
          {/* Submit Button */}
          <div className="flex justify-end pt-4 border-t">
            <button
              type="submit"
              className={`px-6 py-2 rounded-md font-medium flex items-center ${
                submitting 
                  ? "bg-blue-600 text-white opacity-80 cursor-wait" 
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Invoice...
                </>
              ) : (
                'Create Invoice'
              )}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
});

InvoiceForm.displayName = 'InvoiceForm';
