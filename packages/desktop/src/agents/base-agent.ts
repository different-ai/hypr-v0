import { ReactNode } from 'react';

export type AgentType = 'invoice' | 'calendar' | 'task' | 'event' | 'goal';

export interface RecognizedContext {
  id: string;
  title: string;
  vitalInformation: string;
  type: AgentType;
  source: string;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  type: AgentType;
  isActive: boolean;
  render: (context: RecognizedContext, onSuccess?: () => void) => ReactNode;
  view?: () => ReactNode;
}

export interface ClassificationResult {
  title: string;
  type: AgentType;
  relevantRawContent: string;
  vitalInformation: string;
  confidence: number;
}