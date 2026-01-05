import { Card, CardContent } from '@/components/ui/card';
import { 
  Wallet, 
   
  TrendingDown,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  PiggyBank,
  Receipt
} from 'lucide-react';

interface FinancialSummaryCardsProps {
  workspaceId: string;
}

export function FinancialSummaryCards({ workspaceId: _workspaceId }: FinancialSummaryCardsProps) {
  // Mock data - would be replaced with real data from hooks
  const financialData = {
    totalBudget: 500000,
    spent: 185000,
    committed: 120000,
    pendingApprovals: 28500,
    invoicesDue: 54700,
    budgetTrend: 12,
    spendingTrend: -8,
  };

  const available = financialData.totalBudget - financialData.spent - financialData.committed;
  const utilizationPercent = Math.round((financialData.spent / financialData.totalBudget) * 100);

  const formatCurrency = (amount: number) => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    }
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const cards = [
    {
      title: 'Total Budget',
      value: formatCurrency(financialData.totalBudget),
      subtitle: `${utilizationPercent}% utilized`,
      icon: Wallet,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      trend: financialData.budgetTrend,
      trendLabel: 'vs last month',
    },
    {
      title: 'Spent',
      value: formatCurrency(financialData.spent),
      subtitle: `${formatCurrency(financialData.committed)} committed`,
      icon: TrendingDown,
      iconBg: 'bg-orange-500/10',
      iconColor: 'text-orange-600',
      trend: financialData.spendingTrend,
      trendLabel: 'burn rate',
    },
    {
      title: 'Available',
      value: formatCurrency(available),
      subtitle: `${Math.round((available / financialData.totalBudget) * 100)}% remaining`,
      icon: PiggyBank,
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-600',
    },
    {
      title: 'Pending',
      value: formatCurrency(financialData.pendingApprovals),
      subtitle: `${formatCurrency(financialData.invoicesDue)} invoices due`,
      icon: Receipt,
      iconBg: 'bg-amber-500/10',
      iconColor: 'text-amber-600',
      alert: financialData.invoicesDue > 50000,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <Card 
          key={index} 
          className="border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all"
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className={`p-2 rounded-lg ${card.iconBg}`}>
                <card.icon className={`w-5 h-5 ${card.iconColor}`} />
              </div>
              {card.alert && (
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              )}
              {card.trend !== undefined && (
                <div className={`flex items-center gap-0.5 text-xs font-medium ${
                  card.trend >= 0 ? 'text-emerald-600' : 'text-destructive'
                }`}>
                  {card.trend >= 0 ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3" />
                  )}
                  {Math.abs(card.trend)}%
                </div>
              )}
            </div>
            
            <div className="mt-3">
              <p className="text-2xl font-bold tracking-tight">{card.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{card.title}</p>
            </div>
            
            <p className="text-xs text-muted-foreground mt-2">
              {card.subtitle}
              {card.trendLabel && (
                <span className="text-muted-foreground/70"> · {card.trendLabel}</span>
              )}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
