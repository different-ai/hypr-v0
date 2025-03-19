import { NextRequest } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { z } from 'zod';
import { getAuth } from '@clerk/nextjs/server';
import { hasActiveSubscription } from '@/lib/auth';

import type {
  ScreenpipeSearchParams,
  ScreenpipeSearchResult,
  ScreenpipeSearchResponse,
  InvoiceAnswerParams,
} from '@/lib/utils/ai-tools';

// Import the invoice schema (or define it inline if import is not possible)
const invoiceParserSchema = z.object({
  invoice: z
    .object({
      creationDate: z.string().nullable(),
      invoiceNumber: z.string().nullable(),
      sellerInfo: z
        .object({
          businessName: z.string().nullable(),
          email: z.string().nullable(),
          firstName: z.string().nullable(),
          lastName: z.string().nullable(),
          phone: z.string().nullable(),
          address: z
            .object({
              'country-name': z.string().nullable(),
              'extended-address': z.string().nullable(),
              locality: z.string().nullable(),
              'post-office-box': z.string().nullable(),
              'postal-code': z.string().nullable(),
              region: z.string().nullable(),
              'street-address': z.string().nullable(),
            })
            .nullable(),
          taxRegistration: z.string().nullable(),
          companyRegistration: z.string().nullable(),
          miscellaneous: z.record(z.string(), z.string()).nullable(),
        })
        .required(),
      buyerInfo: z
        .object({
          businessName: z.string().nullable(),
          email: z.string().nullable(),
          firstName: z.string().nullable(),
          lastName: z.string().nullable(),
          phone: z.string().nullable(),
          address: z
            .object({
              'country-name': z.string().nullable(),
              'extended-address': z.string().nullable(),
              locality: z.string().nullable(),
              'post-office-box': z.string().nullable(),
              'postal-code': z.string().nullable(),
              region: z.string().nullable(),
              'street-address': z.string().nullable(),
            })
            .nullable(),
          taxRegistration: z.string().nullable(),
        })
        .required(),
      defaultCurrency: z.string().nullable(),
      invoiceItems: z
        .array(
          z.object({
            name: z.string().nullable(),
            quantity: z.number().nullable(),
            unitPrice: z.string().nullable(),
            currency: z.string().nullable(),
            tax: z
              .object({
                type: z.enum(['percentage', 'fixed']).nullable(),
                amount: z.string().nullable(),
              })
              .nullable(),
            reference: z.string().nullable(),
            deliveryDate: z.string().nullable(),
            deliveryPeriod: z.string().nullable(),
          })
        )
        .nullable(),
      paymentTerms: z
        .object({
          dueDate: z.string().nullable(),
          lateFeesPercent: z.number().nullable(),
          lateFeesFix: z.string().nullable(),
        })
        .nullable(),
      note: z.string().nullable(),
      terms: z.string().nullable(),
      purchaseOrderId: z.string().nullable(),
    })
    .required(),
});

// Simple validation function to replace @requestnetwork/data-format
function validateInvoice(invoice: any) {
  // Perform basic validation checks
  const errors = [];

  // Check essential fields
  if (!invoice.sellerInfo || typeof invoice.sellerInfo !== 'object') {
    errors.push('Missing or invalid sellerInfo');
  }

  if (!invoice.buyerInfo || typeof invoice.buyerInfo !== 'object') {
    errors.push('Missing or invalid buyerInfo');
  }

  // Additional validations could be added here

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    // Get the authenticated user
    const { userId } = getAuth(req);
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401 }
      );
    }
    
    // Check if the user has an active subscription
    const isActive = await hasActiveSubscription(userId);
    if (!isActive) {
      return new Response(
        JSON.stringify({ error: 'Subscription required' }),
        { status: 403 }
      );
    }
    
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({
          error: 'Invalid request: messages array is required',
        }),
        { status: 400 }
      );
    }

    // Create a streaming text response using the AI SDK with Responses API
    const result = streamText({
      model: openai.responses('gpt-4o'),
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant that helps users create invoices. You can use screenpipeSearch to retrieve OCR data from the user's screen and invoiceAnswer to generate structured invoice data from the context.

When helping a user create an invoice, follow these steps:
1. Only use screenpipe if the user says "screenpipe" or "screenshot"
2. Use invoiceAnswer to generate structured invoice data from the retrieved OCR context.
3. DO NOT restate all the invoice details in your text response as the invoiceAnswer tool will display the structured data automatically.
4. Instead, provide a brief confirmation that you've found the invoice data and mention any missing fields that might need attention.
5. Trigger search for publicly avaialbe company information on official government websites to find VAT/tax nubmer EIN and company registration number.

Always be helpful, concise, and professional. Focus on extracting relevant invoice information without duplicating what the tool will display.`,
        },
        ...messages,
      ],
      // Enable streaming tool calls for better UX
      toolCallStreaming: true,
      // Enable multiple steps of tool calling
      maxSteps: 5,
      // Add provider options for Responses API
      providerOptions: {
        openai: {
          strictSchemas: true,
          reasoningEffort: 'high',
          parallelToolCalls: true,
        },
      },
      tools: {
        web_search_preview: openai.tools.webSearchPreview({
          searchContextSize: 'medium',
        }),

        // Tool for generating invoice data from OCR context
        invoiceAnswer: {
          description:
            'Returns the final invoice object that was parsed/refined',
          parameters: invoiceParserSchema,
          execute: async (args: z.infer<typeof invoiceParserSchema>) => {
            // Validate the invoice format using our simple validator
            const validationResult = validateInvoice(args.invoice);
            if (!validationResult.valid) {
              return {
                error: 'Invalid invoice format',
                details: validationResult.errors,
              };
            }

            // Extract invoice details for human-readable explanation
            const { invoice } = args;
            const seller = invoice.sellerInfo.businessName || 'Unknown Seller';
            const buyer = invoice.buyerInfo.businessName || 'Unknown Buyer';
            const itemCount = invoice.invoiceItems?.length || 0;

            // Identify missing fields
            const missingFields: string[] = [];
            if (!invoice.sellerInfo.businessName)
              missingFields.push('Seller Business Name');
            if (!invoice.sellerInfo.email) missingFields.push('Seller Email');
            if (!invoice.buyerInfo.businessName)
              missingFields.push('Buyer Business Name');
            if (!invoice.buyerInfo.email) missingFields.push('Buyer Email');
            if (!invoice.invoiceItems || invoice.invoiceItems.length === 0)
              missingFields.push('Invoice Items');

            return {
              invoiceData: invoice,
              explanation: `Invoice data has been processed for ${seller} to ${buyer} with ${itemCount} item(s). ${
                missingFields.length > 0
                  ? 'Some fields are missing.'
                  : 'All required fields are present.'
              }`,
              missingFields:
                missingFields.length > 0 ? missingFields : undefined,
            };
          },
        },

        // Optional tool for user confirmation before processing
        askForConfirmation: {
          description:
            'Ask the user for confirmation before proceeding with an action',
          parameters: z.object({
            message: z
              .string()
              .describe('The confirmation message to display to the user'),
            action: z
              .string()
              .describe('The action that requires confirmation'),
          }),
          // This tool doesn't have an execute function because it requires user interaction
        },
      },
    });

    // Create error handler function for better error messages
    function errorHandler(error: unknown) {
      console.error('Tool execution error:', error);

      if (error == null) {
        return 'An unknown error occurred while processing your request';
      }

      if (typeof error === 'string') {
        return error;
      }

      if (error instanceof Error) {
        return `Error: ${error.message}`;
      }

      return JSON.stringify(error);
    }

    // Return streaming response with error handling
    return result.toDataStreamResponse({
      getErrorMessage: errorHandler,
    });
  } catch (error) {
    console.error('Error processing invoice chat:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process chat request' }),
      { status: 500 }
    );
  }
}
