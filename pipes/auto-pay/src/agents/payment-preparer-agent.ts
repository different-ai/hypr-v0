import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { screenpipeSearch } from './tools/screenpipe-search';
import { useAgentStepsStore } from '@/stores/agent-steps-store';
import { toast } from '@/components/ui/use-toast';
import { useCallback, useState, useRef, useEffect } from 'react';
import { z } from 'zod';
import { useSettings } from '@/hooks/use-settings';
import { useSettingsStore } from '@/lib/settings';
import { usePaymentLifecycleStore } from '@/stores/payment-lifecycle-store';
import type { Settings } from '@/types/settings';

// Zod schemas for payment preparation
const bankDetailsSchema = z.object({
  accountNumber: z.string().optional(),
  routingNumber: z.string().optional(),
  iban: z.string().optional(),
}).describe('Bank account details extracted from the payment snippet');

const transferDetailsSchema = z.object({
  amount: z.string().describe('The payment amount'),
  currency: z.string().describe('The payment currency (e.g., USD)'),
  targetAccount: z.object({
    accountHolderName: z.string().optional(),
    accountNumber: z.string().optional(),
    routingNumber: z.string().optional(),
    iban: z.string().optional(),
  }).describe('Target account details'),
  reference: z.string().optional().describe('Payment reference or note'),
  dueDate: z.string().optional().describe('When the payment is due'),
}).describe('Detailed transfer information extracted from the snippet');

const transferAnswerSchema = z.object({
  transfer: z.object({
    details: transferDetailsSchema,
    confidence: z.number().min(0).max(100),
    explanation: z.string().describe('Why these details were extracted'),
  }).describe('The prepared transfer details with confidence score'),
}).describe('Submit the extracted transfer details');

// Types derived from schemas
export type BankDetails = z.infer<typeof bankDetailsSchema>;
export type TransferDetails = z.infer<typeof transferDetailsSchema>;
export type PreparedTransferDetails = TransferDetails;
export type TransferAnswer = z.infer<typeof transferAnswerSchema>;

export interface PaymentPreparationResult {
  transfer?: {
    details: TransferDetails;
    confidence: number;
    explanation: string;
  };
  error?: string;
}

function getHumanActionFromToolCall(toolCall: any) {
  if (toolCall.toolName === 'screenpipeSearch') {
    return `Gathering additional context${
      toolCall.args.query ? ` for "${toolCall.args.query}"` : ''
    }`;
  }
  if (toolCall.toolName === 'transferAnswer') {
    return 'Extracting payment details';
  }
  return 'Processing...';
}

function getHumanResultFromToolCall(toolCall: any, result: any) {
  if (toolCall.toolName === 'screenpipeSearch') {
    if (Array.isArray(result) && result.length > 0) {
      return `Found ${result.length} relevant context items`;
    }
    return 'No additional context found';
  }
  if (toolCall.toolName === 'transferAnswer') {
    const data = result as TransferAnswer;
    return `Extracted payment details with ${data.transfer.confidence}% confidence`;
  }
  return 'Step completed';
}

// Tool definition
const transferAnswer = {
  description: 'Submit the extracted transfer details',
  parameters: transferAnswerSchema,
};

export async function runPaymentPreparer(
  recognizedItemId: string,
  snippet: string,
  openaiApiKey: string,
  addStep: (recognizedItemId: string, step: any) => void,
  updateStepResult: (
    recognizedItemId: string,
    stepId: string,
    result: string
  ) => void,
  onProgress?: (message: string) => void,
  signal?: AbortSignal
): Promise<PaymentPreparationResult> {
  try {
    const openai = createOpenAI({ apiKey: openaiApiKey });

    if (signal?.aborted) {
      throw new Error('Operation aborted');
    }

    const { steps, toolCalls, toolResults } = await generateText({
      model: openai('gpt-4o'),
      tools: {
        screenpipeSearch,
        transferAnswer,
      },
      toolChoice: 'required',
      maxSteps: 5,
      abortSignal: signal,
      system: `
        You are a payment preparation agent that extracts detailed payment information from text snippets.
        Favor latest information first: last 5 minutes, 10 minutes, 30 minutes, 1 hour, 2 hours, 4 hours, 8 hours, 12 hours, 24 hours
        Your goal is to find specific payment details like amounts, account numbers, and recipient information.

        Given a snippet of text that might contain payment information:
        1. Look for specific details:
           - Payment amount and currency
           - Account holder name
           - Account numbers (bank account, routing, IBAN)
           - Payment references or invoice numbers
           - Due dates or deadlines

        2. If needed, search for additional context:
           - Look for related mentions of the same payment
           - Search for more specific details
           - Verify information from multiple sources if possible

        3. Extract and structure the information:
           - Format amounts consistently
           - Normalize currency codes
           - Clean up account numbers
           - Standardize dates

        4. Assess confidence:
           - Higher confidence for complete, clear information
           - Lower confidence for partial or unclear details
           - Explain your reasoning

        BE THOROUGH AND PRECISE
        FOCUS ON ACCURACY OVER SPEED
      `,
      prompt: `
        Extract detailed payment information from this snippet:
        "${snippet}"

        Look for specific payment details and gather any additional context needed.
        Return a structured representation of the payment information.
      `,
      onStepFinish({ text, toolCalls, toolResults, finishReason, usage }) {
        const addStep = useAgentStepsStore.getState().addStep;
        const updateStepResult = useAgentStepsStore.getState().updateStepResult;

        toolCalls?.forEach((toolCall, index) => {
          const stepId = crypto.randomUUID();
          const humanAction = getHumanActionFromToolCall(toolCall);

          addStep(recognizedItemId, {
            text,
            toolCalls: [toolCall],
            toolResults: toolResults ? [toolResults[index]] : undefined,
            finishReason,
            usage,
            humanAction,
            tokenCount: usage?.totalTokens || 0,
          });

          if (toolResults?.[index]) {
            const humanResult = getHumanResultFromToolCall(
              toolCall,
              toolResults[index]
            );
            updateStepResult(recognizedItemId, stepId, humanResult);
          }

          if (onProgress) {
            const toolName =
              'toolName' in toolCall ? toolCall.toolName : 'unknown';
            onProgress(`Using tool: ${toolName}`);
          }
        });
      },
    });

    const finalToolCall = toolCalls.find(
      (t) => 'toolName' in t && t.toolName === 'transferAnswer'
    );
    if (!finalToolCall) {
      return {
        error: 'Could not extract payment details',
      };
    }

    const answer = finalToolCall.args as TransferAnswer;
    return {
      transfer: answer.transfer,
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        error: 'Payment preparation was cancelled',
      };
    }
    console.error('0xHypr', 'Error in payment preparation:', error);
    return {
      error:
        error instanceof Error
          ? error.message
          : 'Unknown error in payment preparation',
    };
  }
}

// Hook to manage payment preparation
export function usePaymentPreparer(recognizedItemId: string) {
  const [result, setResult] = useState<PaymentPreparationResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { settings } = useSettings();
  const addStep = useAgentStepsStore((state) => state.addStep);
  const updateStepResult = useAgentStepsStore((state) => state.updateStepResult);
  const { startPreparation, updatePreparation } = usePaymentLifecycleStore();

  const prepareTransfer = useCallback(async (snippet: string, detectionId: string) => {
    try {
      if (!settings?.openaiApiKey) {
        throw new Error('OpenAI API key not available');
      }

      setIsProcessing(true);
      setResult(null);

      // Start preparation in lifecycle store and get the ID
      const preparationId = crypto.randomUUID();
      startPreparation(detectionId);

      // Run preparation
      const result = await runPaymentPreparer(
        recognizedItemId,
        snippet,
        settings.openaiApiKey,
        addStep,
        updateStepResult
      );

      // Update preparation in lifecycle store
      if ('transfer' in result && result.transfer) {
        updatePreparation(preparationId, {
          status: 'prepared',
          recipientDetails: {
            name: result.transfer.details.targetAccount.accountHolderName || '',
            email: '',  // Email needs to be collected from user
            routingNumber: result.transfer.details.targetAccount.routingNumber || '',
            accountNumber: result.transfer.details.targetAccount.accountNumber || '',
            accountType: 'businessChecking' as const,
            address: {
              country: 'US',
              postalCode: '',
              region: '',
              city: '',
              address1: '',
            },
          },
          paymentDetails: {
            amount: result.transfer.details.amount || '',
            currency: result.transfer.details.currency || '',
            description: result.transfer.details.reference || '',
          },
        });
      } else if ('error' in result) {
        updatePreparation(preparationId, {
          status: 'failed',
          error: result.error,
        });
      }

      setResult(result);
      return result;
    } catch (error) {
      console.error('0xHypr', 'Error in payment preparation:', error);
      const errorResult = {
        error: error instanceof Error ? error.message : 'Unknown error in payment preparation',
      };
      setResult(errorResult);
      return errorResult;
    } finally {
      setIsProcessing(false);
    }
  }, [settings, recognizedItemId, addStep, updateStepResult, startPreparation, updatePreparation]);

  return {
    result,
    prepareTransfer,
    isProcessing,
  };
}
