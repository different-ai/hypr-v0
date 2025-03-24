import { ArrowDownUp, Download, Filter } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { accounts, transactions } from "@/src/lib/mock-data";
import { formatCurrency, formatDate } from "@/src/lib/utils";

export default function TransactionsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Transactions</h1>
          <p className="text-muted-foreground">View and manage your transaction history</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Date</th>
                <th className="px-4 py-3 text-left font-medium">Description</th>
                <th className="px-4 py-3 text-left font-medium">Category</th>
                <th className="px-4 py-3 text-left font-medium">Account</th>
                <th className="px-4 py-3 text-right font-medium">Amount</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => {
                const account = accounts.find(a => a.id === transaction.accountId);
                return (
                  <tr key={transaction.id} className="border-b hover:bg-muted/50">
                    <td className="px-4 py-3 text-left">{formatDate(transaction.date)}</td>
                    <td className="px-4 py-3 text-left">
                      <div className="font-medium">{transaction.description}</div>
                      <div className="text-xs text-muted-foreground">{transaction.counterparty?.name || ''}</div>
                    </td>
                    <td className="px-4 py-3 text-left">
                      {transaction.category || 'Uncategorized'}
                    </td>
                    <td className="px-4 py-3 text-left">{account?.name || 'Unknown'}</td>
                    <td className={`px-4 py-3 text-right ${transaction.amount < 0 ? 'text-red-500' : 'text-green-500'}`}>
                      {formatCurrency(transaction.amount, transaction.currency)}
                    </td>
                    <td className="px-4 py-3 text-left">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium 
                        ${transaction.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-300' : 
                          transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-300' : 
                          'bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-300'}`}>
                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm">
                        <ArrowDownUp className="h-4 w-4" />
                        <span className="sr-only">Details</span>
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}