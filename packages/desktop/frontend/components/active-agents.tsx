import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useClassificationStore } from '@/stores/classification-store';
import { useDashboardStore } from '@/stores/dashboard-store';

export function ActiveAgents() {
  const { agents, recognizedItems } = useClassificationStore();
  const isDemoMode = useDashboardStore((state) => state.isDemoMode);
  
  // Ensure recognizedItems is always an array
  const items = Array.isArray(recognizedItems) ? recognizedItems : [];
  
  const getAgentStats = (agentId: string) => {
    const agentItems = items.filter(item => item.agentId === agentId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayItems = agentItems.filter(item => {
      const itemDate = new Date(item.data.startTime);
      return itemDate >= today;
    });

    return {
      total: agentItems.length,
      today: todayItems.length
    };
  };

  const activeAgents = agents.filter(agent => 
    agent.isActive && (isDemoMode || agent.isReady)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Active Agents</h2>
        <div className="flex gap-2">
          {isDemoMode && (
            <Badge variant="secondary">Demo Mode</Badge>
          )}
          <Badge variant="outline">
            {activeAgents.length} Active
          </Badge>
        </div>
      </div>

      <div className="grid gap-4">
        {activeAgents.map((agent) => {
          const stats = getAgentStats(agent.id);

          return (
            <Card key={agent.id} className="hover:shadow-md transition-shadow">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    {agent.displayName ? agent.displayName() : <span className="font-medium">{agent.name}</span>}
                    {!agent.isReady && (
                      <span className="text-xs text-muted-foreground">Demo Only</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="text-xs">
                      Today: {stats.today}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Total: {stats.total}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {activeAgents.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              <p>No active agents</p>
              {!isDemoMode && (
                <p className="text-sm mt-2">Enable demo mode to see all available agents</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 