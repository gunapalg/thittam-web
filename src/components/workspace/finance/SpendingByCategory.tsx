import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';

interface SpendingByCategoryProps {
  workspaceId: string;
}

const spendingData = [
  { name: 'Venue', value: 75000, color: 'hsl(var(--primary))' },
  { name: 'Catering', value: 45000, color: 'hsl(221, 83%, 53%)' },
  { name: 'Marketing', value: 28000, color: 'hsl(142, 76%, 36%)' },
  { name: 'Equipment', value: 22000, color: 'hsl(38, 92%, 50%)' },
  { name: 'Travel', value: 10000, color: 'hsl(280, 65%, 60%)' },
  { name: 'Other', value: 5000, color: 'hsl(var(--muted-foreground))' },
];

const totalSpending = spendingData.reduce((sum, item) => sum + item.value, 0);

export function SpendingByCategory({ workspaceId: _workspaceId }: SpendingByCategoryProps) {
  const formatCurrency = (amount: number) => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    }
    return `₹${(amount / 1000).toFixed(0)}K`;
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <PieChartIcon className="w-5 h-5 text-primary" />
          </div>
          Spending by Category
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-6">
          {/* Pie Chart */}
          <div className="w-32 h-32 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={spendingData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={55}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {spendingData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Category List */}
          <div className="flex-1 space-y-2">
            {spendingData.map((category, index) => {
              const percentage = Math.round((category.value / totalSpending) * 100);
              return (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-2 h-2 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="text-xs flex-1 truncate">{category.name}</span>
                  <span className="text-xs text-muted-foreground">{percentage}%</span>
                  <span className="text-xs font-medium w-14 text-right">
                    {formatCurrency(category.value)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-border/50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Spending</span>
            <span className="font-semibold">{formatCurrency(totalSpending)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
