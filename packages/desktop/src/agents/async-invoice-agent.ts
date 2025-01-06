import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { getApiKey } from '@/stores/api-key-store';
import { screenpipeSearch } from './tools/screenpipe-search';
import { invoiceAnswer, InvoiceParserResult } from './tools/invoice-answer';
import { useClassificationStore } from '@/stores/classification-store';
import { useInvoiceStore } from '@/stores/invoice-store';
import { useAgentStepsStore } from '@/stores/agent-steps-store';
import { toast } from 'sonner';
import { useCallback } from 'react';

export interface AsyncInvoiceResult {
  success: boolean;
  data?: InvoiceParserResult;
  error?: string;
}

function getHumanActionFromToolCall(toolCall: any) {
  if (toolCall.toolName === 'screenpipeSearch') {
    return `Searching for additional invoice information${toolCall.args.query ? ` related to "${toolCall.args.query}"` : ''}`;
  }
  if (toolCall.toolName === 'invoiceAnswer') {
    return 'Preparing final invoice details';
  }
  return 'Processing...';
}

function getHumanResultFromToolCall(toolCall: any, result: any) {
  if (toolCall.toolName === 'screenpipeSearch') {
    if (Array.isArray(result) && result.length > 0) {
      return `Found ${result.length} relevant pieces of information`;
    }
    return 'No additional information found';
  }
  if (toolCall.toolName === 'invoiceAnswer') {
    const data = result as InvoiceParserResult;
    return `Created invoice for ${data.invoice?.buyerInfo?.businessName || 'client'} with ${data.invoice?.invoiceItems?.length || 0} items`;
  }
  return 'Step completed';
}

export async function runInvoiceAgent(
  vitalInfo: string,
  recognizedItemId: string,
): Promise<AsyncInvoiceResult> {
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error('Please set your OpenAI API key in settings');
    }

    // Clear any existing steps for this item
    useAgentStepsStore.getState().clearSteps(recognizedItemId);

    const openai = createOpenAI({ apiKey });

    const { steps, toolCalls, toolResults } = await generateText({
      model: openai('gpt-4o'),
      tools: {
        screenpipeSearch,
        invoiceAnswer,
      },
      toolChoice: 'required',
      maxSteps: 7,
      system: `
        You are an invoice-filling agent. 
        You can call "screenpipeSearch" to gather extra text from OCR/audio logs. 
        Then refine your invoice. 
        You must produce a final invoice object by calling "invoiceAnswer".
        DO NOT CALL INVOICES ANSWER MORE THAN 2 TIMES IN A ROW SPEND MOST CALLS ON SCREENPIPE

        Follow these steps:
        1. Analyze the initial context from vitalInfo
        2. Use screenpipeSearch as many times as needed to find relevant information about:
        - Start with hyper specific queries like The client/buyer (name, email, business details)
        - Favor recent info rather than old (make queries in the last minutes first, then expand to the last hour, then the last day, then the last week). Stop as soon as you have enough info to fill out the invoice. 
        - Then go for more gneric like invoice amount of items
        - If you can't find anything look for generic keywords like invoice, payment, terms, etc.
        - Any payment terms or conditions
        3. If you find only partial data or suspect more might exist, refine your queries
           and call screenpipeSearch again with updated keywords.
        4. Compile all gathered information into a well-structured invoice.
        5. Only once you're sure you've gathered everything possible from screenpipeSearch,
           call invoiceAnswer with the complete invoice object. That is your final step.
      `,
      prompt: `
        The user wants an invoice for: 
        "${vitalInfo}"

        Use multiple calls to screenpipeSearch with refined queries if you 
        believe there is more context to find, such as buyer info, item details, 
        or payment terms.
        Then fill out the invoice in the Request Network Format (RNF).
      `,
      onStepFinish({ text, toolCalls, toolResults, finishReason, usage }) {
        const addStep = useAgentStepsStore.getState().addStep;
        const updateStepResult = useAgentStepsStore.getState().updateStepResult;

        // For each tool call in the step
        toolCalls?.forEach((toolCall, index) => {
          const stepId = crypto.randomUUID();
          const humanAction = getHumanActionFromToolCall(toolCall);
          
          // Add the step with the action
          addStep(recognizedItemId, {
            text,
            toolCalls: [toolCall],
            toolResults: toolResults ? [toolResults[index]] : undefined,
            finishReason,
            usage,
            humanAction,
          });

          // If we have results, update with human result
          if (toolResults?.[index]) {
            const humanResult = getHumanResultFromToolCall(toolCall, toolResults[index]);
            updateStepResult(recognizedItemId, stepId, humanResult);
          }
        });

        // Show toast for significant events
        if (toolCalls?.length) {
          const toolNames = toolCalls.map(t => 'toolName' in t ? t.toolName : 'unknown').join(', ');
          toast.info(`Agent using tools: ${toolNames}`);
        }
      },
    });

    // Log the agent's steps for debugging
    console.log('0xHypr', 'Invoice agent steps:', steps);
    console.log('0xHypr', 'Tool calls:', toolCalls);
    console.log('0xHypr', 'Tool results:', toolResults);

    // Find the final invoiceAnswer call
    const finalToolCall = toolCalls.find(t => 
      'toolName' in t && t.toolName === 'invoiceAnswer'
    );
    if (!finalToolCall) {
      throw new Error('No final invoice returned by the agent');
    }

    // The args should match our InvoiceParserResult type
    return {
      success: true,
      data: finalToolCall.args as InvoiceParserResult,
    };
  } catch (error) {
    console.error('0xHypr', 'Error in invoice agent:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error in invoice agent',
    };
  }
}

// Hook to manage async invoice processing
export function useAsyncInvoice(recognizedItemId: string) {
  const { setPendingInvoice, pendingInvoices } = useInvoiceStore();
  const result = pendingInvoices[recognizedItemId];

  const processInvoice = useCallback(async (vitalInfo: string) => {
    try {
      // Start processing
      setPendingInvoice(recognizedItemId, null);

      // Run the invoice agent
      const result = await runInvoiceAgent(vitalInfo, recognizedItemId);

      // Update store with result
      setPendingInvoice(recognizedItemId, result);

      if (!result.success) {
        toast.error('Failed to process invoice: ' + result.error);
      }

      return result;
    } catch (error) {
      console.error('0xHypr', 'Error processing invoice:', error);
      const errorResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error processing invoice',
      };
      setPendingInvoice(recognizedItemId, errorResult);
      return errorResult;
    }
  }, [recognizedItemId, setPendingInvoice]);

  return {
    result,
    processInvoice,
    isProcessing: result === null,
  };
} 