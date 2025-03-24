import { PiggyBank, AlertTriangle, TrendingUp } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/src/components/ui/card";
import { YieldOpportunity } from "@/src/types/account";
import { formatCurrency } from "@/src/lib/utils";

interface YieldOpportunitiesProps {
  opportunities: YieldOpportunity[];
}

export function YieldOpportunities({ opportunities }: YieldOpportunitiesProps) {
  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case "low":
        return <PiggyBank className="h-4 w-4 text-green-500" />;
      case "medium":
        return <TrendingUp className="h-4 w-4 text-yellow-500" />;
      case "high":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <PiggyBank className="h-4 w-4" />;
    }
  };

  const getRiskLabel = (risk: string) => {
    switch (risk) {
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-300";
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800/20 dark:text-gray-300";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Yield Opportunities</CardTitle>
        <CardDescription>
          Maximize returns on your idle assets
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {opportunities.slice(0, 3).map((opportunity) => (
            <div
              key={opportunity.id}
              className="p-4 rounded-lg border"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {getRiskIcon(opportunity.risk)}
                  <h3 className="font-medium">{opportunity.name}</h3>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${getRiskLabel(opportunity.risk)}`}
                >
                  {opportunity.risk.charAt(0).toUpperCase() + opportunity.risk.slice(1)} Risk
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{opportunity.description}</p>
              <div className="flex justify-between mb-2">
                <span className="text-sm">APY:</span>
                <span className="font-bold text-sm">{opportunity.apy}%</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-sm">Min Investment:</span>
                <span className="text-sm">{formatCurrency(opportunity.minInvestment, opportunity.currency)}</span>
              </div>
              <div className="flex justify-between mb-4">
                <span className="text-sm">Term:</span>
                <span className="text-sm">{opportunity.term > 0 ? `${opportunity.term} days` : "Flexible"}</span>
              </div>
              <Button className="w-full" size="sm">Invest Now</Button>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full">
          View All Opportunities
        </Button>
      </CardFooter>
    </Card>
  );
}