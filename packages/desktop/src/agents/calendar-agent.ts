import { Agent } from './base-agent';
import { generateObject } from 'ai';
import { z } from 'zod';
import { createOpenAI } from '@ai-sdk/openai';
import { useApiKeyStore } from '@/stores/api-key-store';

export const calendarAgent: Agent = {
  id: 'calendar-agent',
  name: 'Calendar Agent',
  description: 'Recognizes and processes calendar events from content',
  isActive: true,
  type: 'calendar',
  process: async (content: string) => {
    if (!content?.trim()) {
      return null;
    }

    try {
      const apiKey = useApiKeyStore.getState().apiKey;
      if (!apiKey) {
        throw new Error('No API key found');
      }

      const openai = createOpenAI({ apiKey });

      const { object } = await generateObject({
        model: openai('gpt-4o'),
        schema: z.object({
          title: z.string(),
          startTime: z.string(),
          endTime: z.string(),
          location: z.string().optional(),
          attendees: z.array(z.string()).optional(),
          details: z.string().optional(),
        }),
        prompt: `Extract a calendar event from this content.
        Return null if no clear event found.
        Ensure times are in ISO format.
        Content: ${content}`
      });

      return {
        title: object.title,
        content: content,
        data: {
          startTime: new Date(object.startTime).toISOString(),
          endTime: new Date(object.endTime).toISOString(),
          location: object.location,
          attendees: object.attendees,
          details: object.details
        }
      };
    } catch (error) {
      console.error('Calendar agent processing error:', error);
      return null;
    }
  }
}; 