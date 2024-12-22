import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Agent, RecognizedItem } from '@/agents/base-agent';
import { taskAgent } from '@/agents/task-agent';
import { calendarAgent } from '@/agents/calendar-agent';
import { invoiceAgent } from '@/agents/invoice-agent';
import { useDashboardStore } from './dashboard-store';

// Use agents directly without modification
const defaultAgents = [taskAgent, calendarAgent, invoiceAgent];

// Demo data with proper agent IDs and types
const demoRecognizedItems: RecognizedItem[] = [
  {
    id: 'demo-task-1',
    type: 'task',
    timestamp: new Date().toISOString(),
    agentId: taskAgent.id,
    data: {
      title: 'Review Product Roadmap',
      content: 'Review Q3 product roadmap and provide feedback',
      priority: 'high',
      dueDate: new Date(Date.now() + 86400000).toISOString(),
    }
  },
  {
    id: 'demo-event-1',
    type: 'event',
    timestamp: new Date().toISOString(),
    agentId: calendarAgent.id,
    data: {
      title: 'Team Standup',
      startTime: new Date(Date.now() + 3600000).toISOString(),
      endTime: new Date(Date.now() + 5400000).toISOString(),
      location: 'Zoom',
    }
  },
  {
    id: 'demo-invoice-1',
    type: 'invoice',
    timestamp: new Date().toISOString(),
    agentId: invoiceAgent.id,
    data: {
      title: 'AWS Monthly Invoice',
      amount: 1299.99,
      currency: 'USD',
      dueDate: new Date(Date.now() + 604800000).toISOString(),
      paymentDetails: {
        recipient: 'Company Inc',
        accountNumber: '1234567890',
        bankDetails: '123 Main St, Anytown, USA'
      },
    }
  }
];

interface Log {
  message: string;
  timestamp: string;
  success?: boolean;
  error?: string;
  results?: Array<{ type: string; title: string }>;
}

interface ClassificationState {
  recognizedItems: RecognizedItem[];
  processedContent: Set<string>;
  autoClassifyEnabled: boolean;
  agents: Agent[];
  logs: Log[];
  addRecognizedItem: (item: RecognizedItem) => void;
  setRecognizedItems: (items: RecognizedItem[]) => void;
  toggleAgent: (agentId: string) => void;
  addLog: (log: Log) => void;
  clearLogs: () => void;
  hasProcessedContent: (content: string) => boolean;
  addProcessedContent: (content: string) => void;
  clearRecognizedEvents: () => void;
  clearRecognizedTasks: () => void;
  clearItemsBeforeDate: (date: Date) => void;
  clearItemsByAgent: (agentId: string) => void;
  setAutoClassify: (enabled: boolean) => void;
}

export const useClassificationStore = create<ClassificationState>()(
  persist(
    (set, get) => {
      // Subscribe to demo mode changes
      useDashboardStore.subscribe(
        (state) => state.isDemoMode,
        (isDemoMode) => {
          console.log("0xHypr", "Demo mode changed to:", isDemoMode);
          set({ 
            recognizedItems: isDemoMode ? demoRecognizedItems : [],
            logs: isDemoMode ? [
              { 
                message: 'Demo mode enabled - Loading sample data',
                timestamp: new Date().toISOString(),
                success: true
              },
              { 
                message: 'Recognized 3 items from demo data',
                timestamp: new Date().toISOString(),
                success: true,
                results: demoRecognizedItems.map(item => ({
                  type: item.type,
                  title: item.data.title
                }))
              }
            ] : []
          });
        }
      );

      return {
        recognizedItems: useDashboardStore.getState().isDemoMode ? demoRecognizedItems : [],
        processedContent: new Set<string>(),
        autoClassifyEnabled: false,
        agents: defaultAgents,
        logs: [],

        addRecognizedItem: (item) => {
          console.log("0xHypr", "Adding recognized item:", item);
          set((state) => ({
            recognizedItems: [...state.recognizedItems, item],
            logs: [...state.logs, {
              message: `Recognized new ${item.type}: ${item.data.title}`,
              timestamp: new Date().toISOString(),
              success: true,
              results: [{
                type: item.type,
                title: item.data.title
              }]
            }]
          }));
        },

        setRecognizedItems: (items) => {
          console.log("0xHypr", "Setting recognized items:", items);
          set({ 
            recognizedItems: items,
            logs: [...get().logs, {
              message: `Set ${items.length} recognized items`,
              timestamp: new Date().toISOString(),
              success: true,
              results: items.map(item => ({
                type: item.type,
                title: item.data.title
              }))
            }]
          });
        },

        toggleAgent: (agentId) => {
          console.log("0xHypr", "Toggling agent:", agentId);
          set((state) => {
            const agent = state.agents.find(a => a.id === agentId);
            if (!agent) return state;
            
            const newState = !agent.isActive;
            return {
              agents: state.agents.map((a) =>
                a.id === agentId ? { ...a, isActive: newState } : a
              ),
              logs: [...state.logs, {
                message: `${agent.name} ${newState ? 'enabled' : 'disabled'}`,
                timestamp: new Date().toISOString(),
                success: true
              }]
            };
          });
        },

        addLog: (log) => {
          set((state) => ({
            logs: [...state.logs, {
              ...log,
              timestamp: log.timestamp || new Date().toISOString()
            }]
          }));
        },

        clearLogs: () => set({ logs: [] }),

        hasProcessedContent: (content) => {
          return get().processedContent.has(content);
        },

        addProcessedContent: (content) => {
          set((state) => ({
            processedContent: new Set([...state.processedContent, content])
          }));
        },

        clearRecognizedEvents: () => {
          set((state) => ({
            recognizedItems: state.recognizedItems.filter(item => item.type !== 'event'),
            logs: [...state.logs, {
              message: 'Cleared all recognized events',
              timestamp: new Date().toISOString(),
              success: true
            }]
          }));
        },

        clearRecognizedTasks: () => {
          set((state) => ({
            recognizedItems: state.recognizedItems.filter(item => item.type !== 'task'),
            logs: [...state.logs, {
              message: 'Cleared all recognized tasks',
              timestamp: new Date().toISOString(),
              success: true
            }]
          }));
        },

        clearItemsBeforeDate: (date) => {
          set((state) => ({
            recognizedItems: state.recognizedItems.filter(item => item.timestamp > date.getTime()),
            logs: [...state.logs, {
              message: `Cleared items before ${date.toLocaleDateString()}`,
              timestamp: new Date().toISOString(),
              success: true
            }]
          }));
        },

        clearItemsByAgent: (agentId) => {
          set((state) => ({
            recognizedItems: state.recognizedItems.filter(item => item.agentId !== agentId),
            logs: [...state.logs, {
              message: `Cleared items from agent ${agentId}`,
              timestamp: new Date().toISOString(),
              success: true
            }]
          }));
        },

        setAutoClassify: (enabled) => {
          set((state) => ({
            autoClassifyEnabled: enabled,
            logs: [...state.logs, {
              message: `Auto-classification ${enabled ? 'enabled' : 'disabled'}`,
              timestamp: new Date().toISOString(),
              success: true
            }]
          }));
        }
      };
    },
    {
      name: 'classification-store',
      version: 1,
      partialize: (state) => ({
        recognizedItems: state.recognizedItems,
        autoClassifyEnabled: state.autoClassifyEnabled,
        agents: state.agents,
        logs: state.logs
      })
    }
  )
); 