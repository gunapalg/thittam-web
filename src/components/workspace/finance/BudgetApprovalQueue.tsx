import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Wallet, 
  Check,
  X,
  ChevronRight,
  ArrowUpRight,
  Clock
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface BudgetRequest {
  id: string;
  requestingTeam: string;
  amount: number;
  reason: string;
  requestedBy: string;
  requestedAt: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
}

interface BudgetApprovalQueueProps {
  workspaceId: string;
  parentWorkspaceId?: string | null;
}

const mockRequests: BudgetRequest[] = [
  {
    id: '1',
    requestingTeam: 'Marketing Committee',
    amount: 15000,
    reason: 'Additional social media advertising for ticket sales push',
    requestedBy: 'Priya Sharma',
    requestedAt: new Date('2025-01-04T10:30:00'),
    priority: 'high',
    category: 'Marketing',
  },
  {
    id: '2',
    requestingTeam: 'Technical Committee',
    amount: 8000,
    reason: 'Emergency backup equipment rental for main stage',
    requestedBy: 'Rahul Patel',
    requestedAt: new Date('2025-01-04T14:15:00'),
    priority: 'urgent',
    category: 'Equipment',
  },
  {
    id: '3',
    requestingTeam: 'Catering Committee',
    amount: 5500,
    reason: 'Additional refreshments for increased guest count',
    requestedBy: 'Anjali Gupta',
    requestedAt: new Date('2025-01-03T16:00:00'),
    priority: 'medium',
    category: 'Catering',
  },
];

export function BudgetApprovalQueue({ workspaceId: _workspaceId, parentWorkspaceId: _parentWorkspaceId }: BudgetApprovalQueueProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getPriorityBadge = (priority: BudgetRequest['priority']) => {
    switch (priority) {
      case 'urgent':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Urgent</Badge>;
      case 'high':
        return <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20">High</Badge>;
      case 'medium':
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Medium</Badge>;
      case 'low':
        return <Badge className="bg-muted text-muted-foreground border-border">Low</Badge>;
    }
  };

  const totalPending = mockRequests.reduce((sum, r) => sum + r.amount, 0);

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-violet-500/10">
              <Wallet className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Budget Approval Queue</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                {mockRequests.length} pending · {formatCurrency(totalPending)} total
              </p>
            </div>
          </div>
          <Button size="sm" variant="ghost" className="gap-1 text-xs">
            View All
            <ChevronRight className="w-3 h-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {mockRequests.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Wallet className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>No pending budget requests</p>
          </div>
        ) : (
          mockRequests.map(request => (
            <div
              key={request.id}
              className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {request.requestedBy.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{request.requestingTeam}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{request.requestedBy}</span>
                      <span>·</span>
                      <Clock className="w-3 h-3" />
                      <span>{formatDistanceToNow(request.requestedAt, { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1.5">
                    <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                    <span className="font-semibold text-emerald-600">{formatCurrency(request.amount)}</span>
                  </div>
                  {getPriorityBadge(request.priority)}
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {request.reason}
              </p>

              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {request.category}
                </Badge>
                <div className="flex-1" />
                <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-destructive hover:bg-destructive/10">
                  <X className="w-3 h-3" />
                  Reject
                </Button>
                <Button size="sm" className="h-7 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700">
                  <Check className="w-3 h-3" />
                  Approve
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
